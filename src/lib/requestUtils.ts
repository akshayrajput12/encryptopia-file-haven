import { toast } from 'sonner';

// Throttle configuration
const MAX_CONCURRENT_REQUESTS = 5;
const RETRY_DELAY_MS = 1000;
const MAX_RETRIES = 3;

// Track active requests
let activeRequests = 0;
const requestQueue: (() => void)[] = [];

/**
 * Throttle function to limit concurrent requests
 * @param fn The function to execute under throttle control
 */
export async function throttleRequest<T>(fn: () => Promise<T>): Promise<T> {
  // If we're below the concurrent request limit, execute immediately
  if (activeRequests < MAX_CONCURRENT_REQUESTS) {
    activeRequests++;
    try {
      return await fn();
    } finally {
      activeRequests--;
      // Process next queued request if any
      if (requestQueue.length > 0) {
        const nextRequest = requestQueue.shift();
        if (nextRequest) nextRequest();
      }
    }
  }
  
  // Otherwise, queue the request
  return new Promise((resolve, reject) => {
    requestQueue.push(async () => {
      activeRequests++;
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        activeRequests--;
        // Process next queued request if any
        if (requestQueue.length > 0) {
          const nextRequest = requestQueue.shift();
          if (nextRequest) nextRequest();
        }
      }
    });
  });
}

/**
 * Retry a promise-based function with exponential backoff
 * @param fn The function to retry
 * @param retries Maximum number of retries
 * @param delay Initial delay in milliseconds
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY_MS
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    
    console.log(`Request failed, retrying in ${delay}ms...`, error);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Exponential backoff
    return withRetry(fn, retries - 1, delay * 1.5);
  }
}

/**
 * Combines throttling and retry logic
 * @param fn The function to execute with throttling and retry
 */
export async function safeRequest<T>(fn: () => Promise<T>): Promise<T> {
  return throttleRequest(() => withRetry(fn));
}
