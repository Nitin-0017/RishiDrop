export function getErrorMessage(err: any, fallback: string = 'An unexpected error occurred'): string {
  if (!err) return fallback;

  const candidate = err?.response?.data?.error 
    ?? err?.response?.data?.message 
    ?? err?.response?.data
    ?? err?.message;

  if (typeof candidate === 'string') {
    return candidate;
  }

  if (candidate && typeof candidate === 'object') {
    if (typeof candidate.message === 'string') return candidate.message;
    if (typeof candidate.error === 'string') return candidate.error;
    try {
      return JSON.stringify(candidate);
    } catch {
      return fallback;
    }
  }

  return fallback;
}
