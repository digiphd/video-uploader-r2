# Video Uploader for Vercel + Cloudflare R2

## Features
- Upload large video files directly to Cloudflare R2 using a presigned URL
- Triggers a webhook after upload (for social media queueing, etc)
- Deployable to Vercel as a static site with serverless API routes

## Setup

1. **Install dependencies:**
   ```sh
   npm install
   # or
   yarn install
   ```

2. **Configure environment variables:**
   - Copy `.env.example` to `.env` and fill in your Cloudflare R2 and webhook details.

3. **Deploy to Vercel:**
   - Push to GitHub and import the repo in Vercel.
   - Set the same environment variables in the Vercel dashboard.
   - Deploy!

## Environment Variables
See `.env.example` for required variables:
- `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT`
- `WEBHOOK_URL`

## API Endpoints
- `/api/generate-presigned-url` – returns a presigned R2 upload URL
- `/api/trigger-webhook` – triggers your webhook after upload

## Frontend
- All logic is in `index.html` (no framework required)
- Handles file selection, upload, and status updates

---

**Supported by Vercel serverless functions and static hosting.**
