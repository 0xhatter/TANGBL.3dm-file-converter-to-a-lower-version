import os
import shutil
import tempfile
from pathlib import Path
from typing import List

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from starlette.background import BackgroundTask

# Ensure we can import converter from the repo
import sys
repo_root = Path(__file__).resolve().parents[1]
# Add the 3dm_version_converter package directory to sys.path so we can `import converter`
converter_dir = repo_root / "3dm_version_converter"
if str(converter_dir) not in sys.path:
    sys.path.insert(0, str(converter_dir))

try:
    import converter as conv  # type: ignore
except Exception as e:
    raise RuntimeError(f"Failed to import converter.py from {converter_dir}: {e}")

app = FastAPI(title="TANGBL.3dm File Downsaver - Converter Service")

# CORS
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*")
origins: List[str] = [o.strip() for o in allowed_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/convert")
async def convert(file: UploadFile = File(...), targetVersion: str = Form(...)):
    if not file.filename or not file.filename.lower().endswith(".3dm"):
        raise HTTPException(status_code=400, detail="Only .3dm files are supported")

    try:
        target_version_num = conv.get_version_number(targetVersion)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid targetVersion")

    tmpdir = Path(tempfile.mkdtemp(prefix="tangbl-converter-"))
    input_path = tmpdir / file.filename

    try:
        # Save upload
        with input_path.open("wb") as f:
            content = await file.read()
            f.write(content)

        # Build output path
        stem = input_path.stem
        output_path = tmpdir / f"{stem}_v{target_version_num}.3dm"

        ok, err = conv.convert_file(input_path, output_path, target_version_num)
        if not ok:
            raise HTTPException(status_code=500, detail=f"Conversion failed: {err}")

        if not output_path.exists():
            raise HTTPException(status_code=500, detail="Conversion failed: output missing")

        # Stream back result; cleanup directory when response is done
        filename = output_path.name
        return FileResponse(
            path=str(output_path),
            media_type="application/octet-stream",
            filename=filename,
            headers={"Cache-Control": "no-store"},
            background=BackgroundTask(shutil.rmtree, tmpdir, True),
        )
    except HTTPException:
        shutil.rmtree(tmpdir, ignore_errors=True)
        raise
    except Exception as e:
        shutil.rmtree(tmpdir, ignore_errors=True)
        return JSONResponse(status_code=500, content={"error": str(e)})
