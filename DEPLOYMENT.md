# Deployment Instructions

## Prerequisites
- Docker & Docker Compose installed
- (Optional) AWS CLI configured for S3 resume storage

## Build & Run Locally
```sh
docker-compose up --build
```

## Cloud Storage (Resumes)
- Use AWS S3 or similar for storing uploaded resumes.
- Update backend to use boto3 for S3 integration.

## Production
- Use a cloud provider (AWS, Azure, GCP) for deployment.
- Set environment variables for secrets and S3 credentials.
- Use a production-ready web server (e.g., Gunicorn for FastAPI).
