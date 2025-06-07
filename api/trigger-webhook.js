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

  try {
    const webhookRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName, fileType, fileSize, duration, width, height, r2Url })
    });
    if (!webhookRes.ok) {
      throw new Error("Webhook call failed");
    }
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
