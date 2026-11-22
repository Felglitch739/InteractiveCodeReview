import { checkRateLimit } from './_rateLimit.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!checkRateLimit(req, res, { bucket: 'live-token', maxPerIp: 5, maxGlobal: 60, windowMs: 15 * 60 * 1000 })) {
    return
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' })
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1alpha/auth_tokens?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uses: 1 }),
      }
    )

    const data = await response.json()
    if (!response.ok || !data?.name) {
      return res
        .status(response.status || 502)
        .json({ error: data?.error?.message || 'Could not mint ephemeral live token.' })
    }

    return res.status(200).json({ token: data.name })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unexpected token server error' })
  }
}
