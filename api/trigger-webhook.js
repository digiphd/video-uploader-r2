import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export default async function handler(req, res) {
  // API key authentication


  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { fileName, fileType, fileSize, duration, width, height } = req.body;
  const webhookUrl = process.env.WEBHOOK_URL;

  if (!webhookUrl) {
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
  } catch (err) {
    // If presigned URL fails, continue but log error
    presignedGetUrl = null;
  }

  try {
    const videoMetadata = { fileName, fileType, fileSize, duration, width, height, r2Url, presignedGetUrl };
    const webhookRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoMetadata })
    });
    if (!webhookRes.ok) {
      throw new Error("Webhook call failed");
    }
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
