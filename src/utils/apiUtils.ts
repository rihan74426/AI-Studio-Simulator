import type { ApiRequest, ApiResponse, ApiError } from '../types';

const MOCK_IMAGES = [
  'https://images.pexels.com/photos/1167021/pexels-photo-1167021.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/2310641/pexels-photo-2310641.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3861972/pexels-photo-3861972.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1108572/pexels-photo-1108572.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/2346091/pexels-photo-2346091.jpeg?auto=compress&cs=tinysrgb&w=800'
];

export const mockApiCall = async (
  request: ApiRequest,
  signal?: AbortSignal
): Promise<ApiResponse> => {
  const { imageDataUrl, prompt, style } = request;
  
  // Simulate network delay (1-2 seconds)
  const delay = 1000 + Math.random() * 1000;
  
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      // 20% chance of "Model overloaded" error
      if (Math.random() < 0.2) {
        const error: ApiError = { message: 'Model overloaded. Please try again.' };
        reject(error);
        return;
      }
      
      // Return mock success response
      const response: ApiResponse = {
        id: `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        imageUrl: MOCK_IMAGES[Math.floor(Math.random() * MOCK_IMAGES.length)],
        prompt,
        style,
        createdAt: new Date().toISOString()
      };
      
      resolve(response);
    }, delay);
    
    // Handle abort signal
    signal?.addEventListener('abort', () => {
      clearTimeout(timeoutId);
      reject(new DOMException('Request aborted', 'AbortError'));
    });
  });
};

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxJitter?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 500,
  maxJitter: number = 100
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on abort or non-retryable errors
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error;
      }
      
      // Only retry on "Model overloaded" errors
      const isRetryableError = lastError.message?.includes('Model overloaded');
      if (!isRetryableError || attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff with jitter: 500ms, 1000ms, 2000ms + random jitter
      const delay = baseDelay * Math.pow(2, attempt - 1);
      const jitter = Math.random() * maxJitter;
      
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
    }
  }
  
  throw lastError!;
};