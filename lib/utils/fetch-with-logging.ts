import { logger } from "./logger";

/**
 * Wrapper around fetch that automatically logs API calls
 */
export async function fetchWithLogging(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const method = options?.method || "GET";
  const startTime = performance.now();

  try {
    logger.debug(`API Call: ${method} ${url}`);

    const response = await fetch(url, options);
    const duration = Math.round(performance.now() - startTime);

    logger.apiCall(method, url, response.status, duration);

    return response;
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    logger.error(`API Error: ${method} ${url}`, {
      duration,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
