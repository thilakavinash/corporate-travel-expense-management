/**
 * API Diagnostic Utility
 * Logs safe API request/response information for debugging
 * Controlled by VITE_API_DEBUG environment variable
 */

const DEBUG = import.meta.env.VITE_API_DEBUG === 'true';

/**
 * Log a debug message if debug mode is enabled
 */
export const debugLog = (category, message, data = {}) => {
  if (!DEBUG) return;
  
  const timestamp = new Date().toISOString();
  const categoryTag = `[${category.toUpperCase()}]`;
  
  console.log(`${timestamp} ${categoryTag}`, message, data);
};

/**
 * Log API request information (sanitized)
 */
export const logRequest = (config) => {
  if (!DEBUG) return;
  
  const url = new URL(config.url, window.location.origin);
  
  debugLog('API', 'Request', {
    method: config.method?.toUpperCase(),
    path: url.pathname + url.search,
    hasAuth: !!config.headers?.Authorization,
    hasBody: !!config.data,
  });
};

/**
 * Log API response information (sanitized)
 */
export const logResponse = (response, duration) => {
  if (!DEBUG) return;
  
  debugLog('API', 'Response', {
    status: response.status,
    statusText: response.statusText,
    duration: `${duration}ms`,
    hasData: !!response.data,
    hasHeaders: !!response.headers,
  });
};

/**
 * Log API error information (sanitized)
 */
export const logError = (error, config) => {
  if (!DEBUG) return;
  
  const url = config ? new URL(config.url, window.location.origin) : 'N/A';
  
  debugLog('API', 'Error', {
    path: url.pathname,
    status: error.response?.status,
    statusText: error.response?.statusText,
    message: error.response?.data?.message || error.message,
    code: error.code,
  });
};

/**
 * Log authentication flow events
 */
export const logAuth = (event, data = {}) => {
  if (!DEBUG) return;
  
  const safeData = { ...data };
  
  // Remove sensitive fields
  delete safeData.password;
  delete safeData.token;
  delete safeData.newToken;
  
  debugLog('AUTH', event, safeData);
};
