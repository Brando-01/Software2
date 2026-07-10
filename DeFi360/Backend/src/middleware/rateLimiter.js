const buckets = new Map();
const stats = { totalRequests: 0, throttled: 0, windowMs: 60000, max: 100 };
// Limpieza periódica de buckets expirados para liberar memoria y mantener estadísticas precisas.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (now >= bucket.resetAt) {
      buckets.delete(key);
    }
  }
}, 60000).unref();
// Función para generar la clave del cliente basada en su dirección IP.
function _clientKey(req) {
  const forwarded = req.headers?.['x-forwarded-for'];
  const forwardedIp = forwarded ? forwarded.split(',')[0].trim() : null;

  return (
    forwardedIp ||
    req.ip ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}
// Middleware de limitación de tasa para controlar la cantidad de solicitudes que un cliente puede hacer en un período de tiempo determinado.
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
// Función para obtener estadísticas del limitador de tasa, incluyendo el número total de solicitudes, solicitudes limitadas, duración de la ventana y número de clientes activos.
function getStats() {
  return {
    totalRequests: stats.totalRequests,
    throttled: stats.throttled,
    windowMs: stats.windowMs,
    max: stats.max,
    activeClients: buckets.size
  };
}
// Función para reiniciar las estadísticas y limpiar todos los buckets, útil para pruebas o reinicios del sistema.
function reset() {
  buckets.clear();
  stats.totalRequests = 0;
  stats.throttled = 0;
}

module.exports = { rateLimiter, getStats, reset };
