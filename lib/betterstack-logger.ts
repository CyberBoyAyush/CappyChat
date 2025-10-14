/**
 * Better Stack Logtail Logger Utility
 *
 * This utility provides a centralized logging system that sends logs directly to Better Stack
 * in both development and production environments.
 *
 * Features:
 * - Sends logs directly to Better Stack via HTTP
 * - Works in both dev and production environments
 * - Provides structured logging with context
 * - Maintains existing console logging for local development
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  [key: string]: any;
}

interface BetterStackLog {
  dt: string;
  level: string;
  message: string;
  source?: string;
  [key: string]: any;
}

class BetterStackLogger {
  private source: string;
  private sourceToken: string;
  private ingestingUrl: string;

  constructor(source: string) {
    this.source = source;
    // Use server-side environment variables (without NEXT_PUBLIC prefix)
    this.sourceToken = process.env.BETTER_STACK_SOURCE_TOKEN || "";
    this.ingestingUrl = process.env.BETTER_STACK_INGESTING_URL || "";

    if (!this.sourceToken || !this.ingestingUrl) {
      console.warn(
        "[Better Stack] Environment variables not set. Logs will only be printed to console.",
        {
          hasSourceToken: !!this.sourceToken,
          hasIngestingUrl: !!this.ingestingUrl,
        }
      );
    }
  }

  private async sendLog(level: string, message: string, context: Record<string, any> = {}) {
    const log: BetterStackLog = {
      dt: new Date().toISOString(),
      level,
      message,
      source: this.source,
      ...context,
    };

    // Always log to console for local debugging
    console.log(`[${level.toUpperCase()}] [${this.source}]`, message, context);

    // Send to Better Stack if configured
    if (this.sourceToken && this.ingestingUrl) {
      try {
        const response = await fetch(this.ingestingUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.sourceToken}`,
          },
          body: JSON.stringify([log]),
        });

        if (!response.ok) {
          console.error("[Better Stack] Failed to send log:", response.statusText);
        }
      } catch (error) {
        console.error("[Better Stack] Error sending log:", error);
      }
    }
  }

  info(message: string, context: Record<string, any> = {}) {
    return this.sendLog("info", message, context);
  }

  error(message: string, context: Record<string, any> = {}) {
    return this.sendLog("error", message, context);
  }

  warn(message: string, context: Record<string, any> = {}) {
    return this.sendLog("warn", message, context);
  }

  debug(message: string, context: Record<string, any> = {}) {
    return this.sendLog("debug", message, context);
  }

  // Compatibility method - no-op since we send logs immediately
  async flush() {
    // No-op - logs are sent immediately
  }
}

/**
 * Create a Better Stack logger instance with a specific source
 */
export const createBetterStackLogger = (source: string) => {
  return new BetterStackLogger(source);
};

/**
 * Log an API request start
 */
export const logApiRequestStart = async (
  logger: BetterStackLogger,
  endpoint: string,
  context: LogContext
) => {
  await logger.info(`🚀 API Request: ${endpoint}`, {
    event: "api_request_start",
    endpoint,
    timestamp: new Date().toISOString(),
    ...context,
  });
};

/**
 * Log an API request success
 */
export const logApiRequestSuccess = async (
  logger: BetterStackLogger,
  endpoint: string,
  context: LogContext
) => {
  await logger.info(`✅ API Success: ${endpoint}`, {
    event: "api_request_success",
    endpoint,
    timestamp: new Date().toISOString(),
    ...context,
  });
};

/**
 * Log an API request error
 */
export const logApiRequestError = async (
  logger: BetterStackLogger,
  endpoint: string,
  error: any,
  context?: LogContext
) => {
  await logger.error(`❌ API Error: ${endpoint}`, {
    event: "api_request_error",
    endpoint,
    timestamp: new Date().toISOString(),
    error: error?.message || String(error),
    errorStack: error?.stack,
    ...context,
  });
};

/**
 * Log a validation error
 */
export const logValidationError = async (
  logger: BetterStackLogger,
  endpoint: string,
  field: string,
  message: string,
  context?: LogContext
) => {
  await logger.warn(`⚠️ Validation Error: ${endpoint} - ${field}`, {
    event: "validation_error",
    endpoint,
    field,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  });
};

/**
 * Log rate limiting
 */
export const logRateLimit = async (
  logger: BetterStackLogger,
  endpoint: string,
  context: LogContext
) => {
  await logger.warn(`🚫 Rate Limit: ${endpoint}`, {
    event: "rate_limit",
    endpoint,
    timestamp: new Date().toISOString(),
    ...context,
  });
};

/**
 * Log credit consumption
 */
export const logCreditConsumption = async (
  logger: BetterStackLogger,
  context: LogContext
) => {
  await logger.info("💳 Credit Consumption", {
    event: "credit_consumption",
    timestamp: new Date().toISOString(),
    ...context,
  });
};

/**
 * Log authentication/authorization events
 */
export const logAuthEvent = async (
  logger: BetterStackLogger,
  event: string,
  context: LogContext
) => {
  await logger.info(`🔐 Auth: ${event}`, {
    event: "auth_event",
    authEvent: event,
    timestamp: new Date().toISOString(),
    ...context,
  });
};

/**
 * Log file operations
 */
export const logFileOperation = async (
  logger: BetterStackLogger,
  operation: string,
  context: LogContext
) => {
  await logger.info(`📁 File: ${operation}`, {
    event: "file_operation",
    operation,
    timestamp: new Date().toISOString(),
    ...context,
  });
};

/**
 * Log database operations
 */
export const logDatabaseOperation = async (
  logger: BetterStackLogger,
  operation: string,
  context: LogContext
) => {
  await logger.info(`🗄️ Database: ${operation}`, {
    event: "database_operation",
    operation,
    timestamp: new Date().toISOString(),
    ...context,
  });
};

/**
 * Flush logs to Better Stack
 * Call this before returning a response from an API route
 */
export const flushLogs = async (logger: BetterStackLogger) => {
  try {
    await logger.flush();
  } catch (error) {
    console.error("Failed to flush logs to Better Stack:", error);
  }
};

