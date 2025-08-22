# TANGBL.3dm Converter Microservice (FastAPI)

A minimal FastAPI service exposing `/convert` to down-save Rhino `.3dm` files using `rhino3dm`.

## Endpoints
- `GET /health` → `{ status: "ok" }`
- `POST /convert` (multipart)
  - fields: `file` (.3dm), `targetVersion` (e.g., `5`, `6`, `7`, `8`)
  - returns: converted `.3dm` as attachment

## Local dev
```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r microservice/requirements.txt
uvicorn microservice.app:app --reload
```
Open http://127.0.0.1:8000/docs

## Deploy to Render (recommended)
- Create new Web Service
- Runtime: Python 3.10+
- Build Command: `pip install -r microservice/requirements.txt`
- Start Command: `uvicorn microservice.app:app --host 0.0.0.0 --port $PORT`
- Plan: Free (works for moderate file sizes)
- Env Vars:
  - `PYTHONUNBUFFERED=1`
  - `ALLOWED_ORIGINS=https://<your-vercel-app>.vercel.app, http://localhost:3000`

Alternatively, use `render.yaml` in repo root (Infrastructure as Code).

## Integrating with Next.js
On Vercel, set an env var:
- `CONVERTER_API_URL=https://<your-render-service>.onrender.com`

The Next.js route at `web-frontend/src/app/api/convert/route.ts` proxies requests to this microservice.

## Large uploads (100MB+)
- Prefer direct-to-microservice upload from the browser (bypass Vercel limits)
- For very large models:
  - Implement chunked uploads (Tus/uppy) or direct-to-storage (S3/R2) then process by URL
  - Increase service plan memory/time if needed
  - Stream output back; service already streams with `FileResponse`

## S3 Configuration for Large Files

The microservice supports an S3 flow for files larger than 100MB. To enable this:

1. Create an S3 bucket (or use compatible storage like Cloudflare R2)
2. Set the following environment variables on your Render.com instance:
   - `AWS_REGION` - The region of your S3 bucket (e.g., `us-east-1`, `eu-north-1`)
   - `AWS_ACCESS_KEY_ID` - Your AWS access key with S3 permissions
   - `AWS_SECRET_ACCESS_KEY` - Your AWS secret key
   - `S3_BUCKET` - The name of your S3 bucket (e.g., `3dm-converter-uploads-prod`)
   - `S3_PREFIX` - Optional prefix for uploaded files (e.g., `uploads/`)
   - `MAX_UPLOAD_MB` - Optional, maximum file size in MB (default: 500)
   - `DIRECT_UPLOAD_MAX_MB` - Optional, maximum size for direct uploads in MB (default: 100)

3. Ensure your S3 bucket has proper CORS configuration to allow uploads from your frontend domain:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["https://your-frontend-domain.com"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

4. For security, set up a dedicated IAM user with limited permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
