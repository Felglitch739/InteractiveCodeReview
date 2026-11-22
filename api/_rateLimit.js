// Lightweight in-memory sliding-window rate limiter per IP + global instance cap
// Protects Gemini API quota when shared across large classes on Vercel.

const ipBuckets = new Map()
const globalBuckets = new Map()

function getClientIp(req) {
  const fwd = req.headers?.['x-forwarded-for']
  if (typeof fwd === 'string' && fwd.length > 0) {
    return fwd.split(',')[0].trim()
  }
  return req.headers?.['x-real-ip'] || req.socket?.remoteAddress || 'unknown'
}

function prune(timestamps, cutoff) {
  while (timestamps.length > 0 && timestamps[0] < cutoff) {
    timestamps.shift()
  }
}

export function checkRateLimit(req, res, { bucket = 'default', maxPerIp = 15, maxGlobal = 120, windowMs = 10 * 60 * 1000 } = {}) {
  const now = Date.now()
  const cutoff = now - windowMs
  const ip = getClientIp(req)

  // Global burst cap per serverless instance
  const gList = globalBuckets.get(bucket) || []
  prune(gList, cutoff)
  if (gList.length >= maxGlobal) {
    res.status(429).json({
      error: 'The voice tutor is getting lots of class traffic right now. Please wait a minute and try again—all interactive labs and quizzes still work offline!',
    })
    return false
  }

  // Per-IP cap
  const ipKey = `${bucket}:${ip}`
  const list = ipBuckets.get(ipKey) || []
  prune(list, cutoff)
  if (list.length >= maxPerIp) {
    const retrySec = Math.max(15, Math.ceil((list[0] + windowMs - now) / 1000))
    res.setHeader('Retry-After', String(retrySec))
    res.status(429).json({
      error: `Rate limit reached for this session. Please wait about ${Math.ceil(retrySec / 60)} min before asking the tutor again—all interactive labs and quizzes keep working!`,
    })
    return false
  }

  list.push(now)
  gList.push(now)
  ipBuckets.set(ipKey, list)
  globalBuckets.set(bucket, gList)

  // Prevent unbounded map growth
  if (ipBuckets.size > 1000) {
    for (const [k, v] of ipBuckets.entries()) {
      prune(v, cutoff)
      if (v.length === 0) ipBuckets.delete(k)
    }
  }

  return true
}
