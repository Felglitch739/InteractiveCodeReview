import { checkRateLimit } from './_rateLimit.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!checkRateLimit(req, res, { bucket: 'pin', maxPerIp: 15, maxGlobal: 200, windowMs: 10 * 60 * 1000 })) {
    return
  }

  const expectedPin = (process.env.TEAM_PIN || '1380').trim()
  const providedPin = String(req.body?.pin || '').trim()

  if (!providedPin || providedPin !== expectedPin) {
    return res.status(401).json({ ok: false, error: 'Incorrect team PIN.' })
  }

  return res.status(200).json({ ok: true })
}
