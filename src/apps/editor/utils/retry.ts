/**
 * Retry utility with exponential backoff
 * Used for network requests that may fail temporarily
 */

/**
 * Retry an async operation with exponential backoff
 * @param operation - The async operation to retry
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param initialDelay - Initial delay in milliseconds (default: 1000)
 * @returns The result of the operation
 */
export async function retryWithBackoff<T>(
	operation: () => Promise<T>,
	maxRetries = 3,
	initialDelay = 1000,
): Promise<T> {
	let lastError: Error | unknown;
	
	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			return await operation();
		} catch (error) {
			lastError = error;
			
			// Don't retry on last attempt
			if (attempt === maxRetries) {
				throw error;
			}
			
			// Calculate delay with exponential backoff: initialDelay * 2^attempt
			const delay = initialDelay * Math.pow(2, attempt);
			
			// Wait before retrying
			await new Promise((resolve) => setTimeout(resolve, delay));
			
			console.warn(
				`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms delay`,
			);
		}
	}
	
	throw lastError;
}

/**
 * Retry an async operation with exponential backoff, but only for network errors
 * @param operation - The async operation to retry
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param initialDelay - Initial delay in milliseconds (default: 1000)
 * @returns The result of the operation
 */
export async function retryOnNetworkError<T>(
	operation: () => Promise<T>,
	maxRetries = 3,
	initialDelay = 1000,
): Promise<T> {
	let lastError: Error | unknown;
	
	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			return await operation();
		} catch (error) {
			lastError = error;
			
			// Only retry on network errors
			const isNetworkError =
				error instanceof TypeError && error.message.includes("fetch") ||
				error instanceof Error && (
					error.message.includes("network") ||
					error.message.includes("NetworkError") ||
					error.message.includes("Failed to fetch")
				);
			
			if (!isNetworkError || attempt === maxRetries) {
				throw error;
			}
			
			// Calculate delay with exponential backoff
			const delay = initialDelay * Math.pow(2, attempt);
			
			// Wait before retrying
			await new Promise((resolve) => setTimeout(resolve, delay));
			
			console.warn(
				`Network error, retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms delay`,
			);
		}
	}
	
	throw lastError;
}
