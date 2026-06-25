

const buckets = new Map();
const stats = { totalRequests: 0, throttled: 0, windowMs: 60000, max: 100 };

function _clientKey(req) {

  return (
    req.ip ||
    (req.headers && req.headers['x-forwarded-for']) ||
    (req.connection && req.connection.remoteAddress) ||
    'unknown'
  );
}

function rateLimiter(options = {}) {
  const windowMs = options.windowMs ?? 60000;
  const max = options.max ?? 100;
  stats.windowMs = windowMs;
  stats.max = max;

  return function rateLimitMiddleware(req, res, next) {
    const key = _clientKey(req);
    const now = Date.now();

    let bucket = buckets.get(key);
    if (!bucket || now >= bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count++;
    stats.totalRequests++;

    const remaining = Math.max(0, max - bucket.count);
    res.set('X-RateLimit-Limit', String(max));
    res.set('X-RateLimit-Remaining', String(remaining));

    if (bucket.count > max) {
      stats.throttled++;
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({
        message: 'Demasiadas solicitudes. Intenta más tarde.',
        retryAfter
      });
    }

    return next();
  };
}

function getStats() {
  return {
    totalRequests: stats.totalRequests,
    throttled: stats.throttled,
    windowMs: stats.windowMs,
    max: stats.max,
    activeClients: buckets.size
  };
}

function reset() {
  buckets.clear();
  stats.totalRequests = 0;
  stats.throttled = 0;
}

module.exports = { rateLimiter, getStats, reset };
