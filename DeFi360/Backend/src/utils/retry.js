// Retry utility function to handle transient errors in asynchronous operations.
async function retry(fn, options = {}) {
  const {
    retries = 2,
    baseDelay = 10,
    factor = 2,
    onRetry = null
  } = options;

  let attempt = 0;
  let lastError;

  while (attempt <= retries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === retries) {
        break;
      }

      if (typeof onRetry === 'function') {
        onRetry(attempt + 1, error);
      }

      const delay = baseDelay * Math.pow(factor, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
      attempt++;
    }
  }

  throw lastError;
}

module.exports = retry;
