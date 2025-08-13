/**
 * Production-safe logging utility
 * 
 * This utility provides different logging levels that respect the NODE_ENV:
 * - devLog: Only logs in development environment
 * - prodError: Logs critical errors in both development and production
 * - devError: Only logs errors in development environment
 */

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Development-only logging
 * Use this for debug information, general logging, and non-critical information
 */
export const devLog = (message: string, ...args: any[]): void => {
  if (isDevelopment) {
    console.log(message, ...args);
  }
};

/**
 * Development-only warning
 * Use this for warnings that are only relevant during development
 */
export const devWarn = (message: string, ...args: any[]): void => {
  if (isDevelopment) {
    console.warn(message, ...args);
  }
};

/**
 * Development-only info
 * Use this for informational messages during development
 */
export const devInfo = (message: string, ...args: any[]): void => {
  if (isDevelopment) {
    console.info(message, ...args);
  }
};

/**
 * Production-safe error logging
 * Use this ONLY for critical errors that need to be logged in production
 * Examples: Authentication failures, database errors, API failures
 */
export const prodError = (message: string, error?: any, context?: string): void => {
  const errorMessage = context ? `[${context}] ${message}` : message;
  console.error(errorMessage, error);
};

/**
 * Development-only error logging
 * Use this for errors that are only relevant during development/debugging
 */
export const devError = (message: string, error?: any, context?: string): void => {
  if (isDevelopment) {
    const errorMessage = context ? `[${context}] ${message}` : message;
    console.error(errorMessage, error);
  }
};

/**
 * Development-only debug logging with context
 * Use this for detailed debugging information
 */
export const devDebug = (context: string, message: string, data?: any): void => {
  if (isDevelopment) {
    console.log(`🐛 [${context}] ${message}`, data);
  }
};

/**
 * Development-only performance logging
 * Use this for performance monitoring during development
 */
export const devPerf = (label: string, data?: any): void => {
  if (isDevelopment) {
    console.log(`⚡ [Performance] ${label}`, data);
  }
};

/**
 * Development-only success logging
 * Use this for success messages during development
 */
export const devSuccess = (message: string, data?: any): void => {
  if (isDevelopment) {
    console.log(`✅ ${message}`, data);
  }
};

/**
 * Conditional logging based on environment
 * Use this when you need more control over when to log
 */
export const conditionalLog = (condition: boolean, message: string, ...args: any[]): void => {
  if (condition && isDevelopment) {
    console.log(message, ...args);
  }
};

// Export environment check for external use
export { isDevelopment };
