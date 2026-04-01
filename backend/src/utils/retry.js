/**
 * Generic retry helper for transient failures in upstream AI stages.
 */
async function withRetry(task, options = {}) {
  const {
    attempts = 3,
    baseDelayMs = 150,
    factor = 2,
    onRetry = null,
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await task(attempt);
    } catch (error) {
      lastError = error;

      if (attempt >= attempts) {
        break;
      }

      if (typeof onRetry === 'function') {
        onRetry({ attempt, nextAttempt: attempt + 1, error });
      }

      const delay = baseDelayMs * Math.pow(factor, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

module.exports = {
  withRetry,
};
