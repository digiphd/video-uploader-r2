import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export default async function handler(req, res) {
  // API key authentication

  // Log incoming request and env vars for debugging
  console.log('trigger-webhook: incoming request', JSON.stringify(req.body));
  console.log('trigger-webhook: env', {
    R2_ENDPOINT: process.env.R2_ENDPOINT,
    R2_BUCKET: process.env.R2_BUCKET,
    R2_ACCESS_KEY_ID: !!process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: !!process.env.R2_SECRET_ACCESS_KEY,
    WEBHOOK_URL: process.env.WEBHOOK_URL,
  });

  if (req.method !== "POST") {
    console.error('trigger-webhook: method not allowed');
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { fileName, fileType, fileSize, duration, width, height } = req.body;
  const webhookUrl = process.env.WEBHOOK_URL;

  if (!webhookUrl) {
    console.error('trigger-webhook: WEBHOOK_URL not configured');
    return res.status(500).json({ error: "Webhook URL not configured" });
  }

  // Construct the public R2 URL
  const r2Base = process.env.R2_ENDPOINT.replace(/\/$/, "");
  const r2Url = `${r2Base}/${encodeURIComponent(fileName)}`;

  // Generate a presigned GET URL for AssemblyAI or other consumers
  let presignedGetUrl = null;
  try {
    const client = new S3Client({
      region: "auto",
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
    const getCommand = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: fileName,
    });
    presignedGetUrl = await getSignedUrl(client, getCommand, { expiresIn: 1800 }); // 30 min
    console.log('trigger-webhook: presignedGetUrl generated');
  } catch (err) {
    console.error('trigger-webhook: failed to generate presignedGetUrl', err);
    presignedGetUrl = null;
  }

  try {
    const videoMetadata = { fileName, fileType, fileSize, duration, width, height, r2Url, presignedGetUrl };
    console.log('trigger-webhook: sending to webhook', { webhookUrl, videoMetadata });
    const webhookRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoMetadata })
    });
    if (!webhookRes.ok) {
      const text = await webhookRes.text();
      console.error('trigger-webhook: webhook call failed', text);
      throw new Error("Webhook call failed: " + text);
    }
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('trigger-webhook: error', error);
    res.status(500).json({ error: error.message });
  }
}
