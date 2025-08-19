import os
import shutil
import tempfile
from pathlib import Path
from typing import List

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from starlette.background import BackgroundTask

# Ensure we can import converter from the repo
import sys
import uuid
import boto3
from botocore.exceptions import ClientError
repo_root = Path(__file__).resolve().parents[1]
# Add the 3dm_version_converter package directory to sys.path so we can `import converter`
converter_dir = repo_root / "3dm_version_converter"
if str(converter_dir) not in sys.path:
    sys.path.insert(0, str(converter_dir))


# Upload constraints
# Default max size is 500 MB; can be overridden with MAX_UPLOAD_MB env var.
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_MB", "500")) * 1024 * 1024
# Enforce a stricter cap for direct uploads to this endpoint; larger files must use S3.
DIRECT_UPLOAD_MAX_BYTES = int(os.getenv("DIRECT_UPLOAD_MAX_MB", "100")) * 1024 * 1024
CHUNK_SIZE = 1024 * 1024  # 1 MB

# S3 configuration (optional, used for presigned flow)
# Use env vars if provided; otherwise fall back to safe defaults shared by the user.
AWS_REGION = os.getenv("AWS_REGION") or os.getenv("AWS_DEFAULT_REGION") or "eu-north-1"
S3_BUCKET = os.getenv("S3_BUCKET") or "3dm-converter-uploads-prod"
S3_PREFIX = os.getenv("S3_PREFIX", "uploads/").rstrip("/")
s3_client = None
if S3_BUCKET and AWS_REGION:
    s3_client = boto3.client("s3", region_name=AWS_REGION)

try:
    import converter as conv  # type: ignore
except Exception as e:
    raise RuntimeError(f"Failed to import converter.py from {converter_dir}: {e}")

app = FastAPI(title="TANGBL.3dm File Downsaver - Converter Service")

# CORS
# Default to the user's production domains and localhost if ALLOWED_ORIGINS is not set.
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "https://3dm-file-downsaver.vercel.app,https://tangbl-3dm-file-downsaver.onrender.com,http://localhost:3000",
)
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
        # Save upload in chunks with size limit
        total = 0
        with input_path.open("wb") as f:
            while True:
                chunk = await file.read(CHUNK_SIZE)
                if not chunk:
                    break
                total += len(chunk)
                # Absolute ceiling (safety)
                if total > MAX_UPLOAD_BYTES:
                    raise HTTPException(status_code=413, detail=f"File too large. Max {(MAX_UPLOAD_BYTES // (1024*1024))} MB")
                # Direct-upload ceiling: force S3 for larger files
                if total > DIRECT_UPLOAD_MAX_BYTES:
                    raise HTTPException(status_code=413, detail=f"File too large for direct upload. Use S3 flow for files over {(DIRECT_UPLOAD_MAX_BYTES // (1024*1024))} MB")
                f.write(chunk)

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


@app.get("/presign")
async def presign(filename: str = Query(..., min_length=1)):
    """Return a presigned POST so the client can upload directly to S3.
    Requires env: AWS_REGION, S3_BUCKET (and credentials), optional S3_PREFIX.
    """
    if not s3_client:
        raise HTTPException(status_code=400, detail="S3 not configured on server")

    # Generate a unique key under prefix
    file_id = uuid.uuid4().hex
    key = f"{S3_PREFIX}/{file_id}/{filename}" if S3_PREFIX else f"{file_id}/{filename}"

    conditions = [["content-length-range", 0, MAX_UPLOAD_BYTES]]
    try:
        post = s3_client.generate_presigned_post(
            Bucket=S3_BUCKET,
            Key=key,
            Conditions=conditions,
            ExpiresIn=900,  # 15 minutes
        )
    except ClientError as e:
        raise HTTPException(status_code=500, detail=f"Failed to presign: {e}")

    return {
        "url": post["url"],
        "fields": post["fields"],
        "key": key,
        "bucket": S3_BUCKET,
        "maxMb": MAX_UPLOAD_BYTES // (1024 * 1024),
        "expiresIn": 900,
    }


def _cleanup_s3_and_tmpdir(bucket: str, key: str, tmpdir: Path):
    try:
        if bucket and key and s3_client:
            s3_client.delete_object(Bucket=bucket, Key=key)
    except Exception:
        pass
    shutil.rmtree(tmpdir, ignore_errors=True)


@app.post("/convert-by-key")
async def convert_by_key(key: str = Form(...), targetVersion: str = Form(...), originalFilename: str | None = Form(None)):
    if not s3_client or not S3_BUCKET:
        raise HTTPException(status_code=400, detail="S3 not configured on server")

    try:
        target_version_num = conv.get_version_number(targetVersion)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid targetVersion")

    tmpdir = Path(tempfile.mkdtemp(prefix="tangbl-converter-s3-"))
    input_name = originalFilename or Path(key).name
    input_path = tmpdir / input_name

    try:
        # Download from S3 to temp file (streamed)
        with input_path.open("wb") as f:
            s3_client.download_fileobj(S3_BUCKET, key, f)

        # Build output path
        stem = input_path.stem
        output_path = tmpdir / f"{stem}_v{target_version_num}.3dm"

        ok, err = conv.convert_file(input_path, output_path, target_version_num)
        if not ok:
            raise HTTPException(status_code=500, detail=f"Conversion failed: {err}")

        if not output_path.exists():
            raise HTTPException(status_code=500, detail="Conversion failed: output missing")

        filename = output_path.name
        return FileResponse(
            path=str(output_path),
            media_type="application/octet-stream",
            filename=filename,
            headers={"Cache-Control": "no-store"},
            background=BackgroundTask(_cleanup_s3_and_tmpdir, S3_BUCKET, key, tmpdir),
        )
    except HTTPException:
        _cleanup_s3_and_tmpdir(S3_BUCKET or "", key, tmpdir)
        raise
    except Exception as e:
        _cleanup_s3_and_tmpdir(S3_BUCKET or "", key, tmpdir)
        return JSONResponse(status_code=500, content={"error": str(e)})
