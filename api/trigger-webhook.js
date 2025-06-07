export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { fileName, fileType } = req.body;
  const webhookUrl = process.env.WEBHOOK_URL;

  if (!webhookUrl) {
    return res.status(500).json({ error: "Webhook URL not configured" });
  }

  try {
    const webhookRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName, fileType })
    });
    if (!webhookRes.ok) {
      throw new Error("Webhook call failed");
    }
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
