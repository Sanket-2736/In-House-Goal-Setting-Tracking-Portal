import { useState, useCallback } from "react";
import { toast } from "sonner";
import { logger } from "@/lib/utils/logger";

interface UseApiOptions {
  showToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Hook for making API calls with automatic toast notifications and logging
 */
export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = useCallback(
    async <T = any,>(
      url: string,
      options: RequestInit & UseApiOptions = {}
    ): Promise<ApiResponse<T> | null> => {
      const {
        showToast = true,
        successMessage,
        errorMessage,
        onSuccess,
        onError,
        ...fetchOptions
      } = options;

      try {
        setLoading(true);
        setError(null);

        const startTime = performance.now();
        const method = fetchOptions.method || "GET";

        logger.debug(`API Call: ${method} ${url}`);

        const response = await fetch(url, fetchOptions);
        const duration = Math.round(performance.now() - startTime);

        const data: ApiResponse<T> = await response.json();

        // Log API call
        logger.apiCall(method, url, response.status, duration, data);

        if (!response.ok) {
          const errorMsg = data.error || errorMessage || "An error occurred";
          setError(errorMsg);

          if (showToast) {
            toast.error(errorMsg);
          }

          logger.error(`API Error: ${method} ${url}`, {
            status: response.status,
            error: errorMsg,
          });

          onError?.(data);
          return null;
        }

        // Success
        const successMsg = successMessage || data.message || "Success";
        if (showToast && successMessage) {
          toast.success(successMsg);
        }

        logger.success(`API Success: ${method} ${url}`, data);
        onSuccess?.(data);

        return data;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Network error";
        setError(errorMsg);

        if (showToast) {
          toast.error(errorMessage || errorMsg);
        }

        logger.error(`API Exception: ${url}`, err);
        onError?.(err);

        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { call, loading, error };
}

/**
 * Convenience function for GET requests
 */
export async function apiGet<T = any>(
  url: string,
  options?: UseApiOptions
): Promise<ApiResponse<T> | null> {
  try {
    const startTime = performance.now();
    const response = await fetch(url);
    const duration = Math.round(performance.now() - startTime);

    const data: ApiResponse<T> = await response.json();

    logger.apiCall("GET", url, response.status, duration, data);

    if (!response.ok) {
      const errorMsg = data.error || options?.errorMessage || "An error occurred";
      if (options?.showToast !== false) {
        toast.error(errorMsg);
      }
      options?.onError?.(data);
      return null;
    }

    if (options?.showToast && options?.successMessage) {
      toast.success(options.successMessage);
    }
    options?.onSuccess?.(data);

    return data;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Network error";
    if (options?.showToast !== false) {
      toast.error(options?.errorMessage || errorMsg);
    }
    logger.error(`GET ${url}`, err);
    options?.onError?.(err);
    return null;
  }
}

/**
 * Convenience function for POST requests
 */
export async function apiPost<T = any>(
  url: string,
  body?: any,
  options?: UseApiOptions
): Promise<ApiResponse<T> | null> {
  try {
    const startTime = performance.now();
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const duration = Math.round(performance.now() - startTime);

    const data: ApiResponse<T> = await response.json();

    logger.apiCall("POST", url, response.status, duration, data);

    if (!response.ok) {
      const errorMsg = data.error || options?.errorMessage || "An error occurred";
      if (options?.showToast !== false) {
        toast.error(errorMsg);
      }
      options?.onError?.(data);
      return null;
    }

    if (options?.showToast !== false && options?.successMessage) {
      toast.success(options.successMessage);
    }
    options?.onSuccess?.(data);

    return data;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Network error";
    if (options?.showToast !== false) {
      toast.error(options?.errorMessage || errorMsg);
    }
    logger.error(`POST ${url}`, err);
    options?.onError?.(err);
    return null;
  }
}

/**
 * Convenience function for PUT requests
 */
export async function apiPut<T = any>(
  url: string,
  body?: any,
  options?: UseApiOptions
): Promise<ApiResponse<T> | null> {
  try {
    const startTime = performance.now();
    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const duration = Math.round(performance.now() - startTime);

    const data: ApiResponse<T> = await response.json();

    logger.apiCall("PUT", url, response.status, duration, data);

    if (!response.ok) {
      const errorMsg = data.error || options?.errorMessage || "An error occurred";
      if (options?.showToast !== false) {
        toast.error(errorMsg);
      }
      options?.onError?.(data);
      return null;
    }

    if (options?.showToast !== false && options?.successMessage) {
      toast.success(options.successMessage);
    }
    options?.onSuccess?.(data);

    return data;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Network error";
    if (options?.showToast !== false) {
      toast.error(options?.errorMessage || errorMsg);
    }
    logger.error(`PUT ${url}`, err);
    options?.onError?.(err);
    return null;
  }
}

/**
 * Convenience function for DELETE requests
 */
export async function apiDelete<T = any>(
  url: string,
  options?: UseApiOptions
): Promise<ApiResponse<T> | null> {
  try {
    const startTime = performance.now();
    const response = await fetch(url, { method: "DELETE" });
    const duration = Math.round(performance.now() - startTime);

    const data: ApiResponse<T> = await response.json();

    logger.apiCall("DELETE", url, response.status, duration, data);

    if (!response.ok) {
      const errorMsg = data.error || options?.errorMessage || "An error occurred";
      if (options?.showToast !== false) {
        toast.error(errorMsg);
      }
      options?.onError?.(data);
      return null;
    }

    if (options?.showToast !== false && options?.successMessage) {
      toast.success(options.successMessage);
    }
    options?.onSuccess?.(data);

    return data;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Network error";
    if (options?.showToast !== false) {
      toast.error(options?.errorMessage || errorMsg);
    }
    logger.error(`DELETE ${url}`, err);
    options?.onError?.(err);
    return null;
  }
}
