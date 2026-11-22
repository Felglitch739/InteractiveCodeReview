import crypto from 'node:crypto'
import { checkRateLimit } from './_rateLimit.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!checkRateLimit(req, res, { bucket: 'pin', maxPerIp: 6, maxGlobal: 120, windowMs: 15 * 60 * 1000 })) {
    return
  }

  const expectedPin = (process.env.TEAM_PIN || '1380').trim()
  const providedPin = String(req.body?.pin || '').trim()

  const expectedHash = crypto.createHash('sha256').update(expectedPin).digest()
  const providedHash = crypto.createHash('sha256').update(providedPin).digest()

  if (!providedPin || !crypto.timingSafeEqual(providedHash, expectedHash)) {
    return res.status(401).json({ ok: false, error: 'Incorrect team PIN.' })
  }

  return res.status(200).json({ ok: true })
}
