/**
 * @fileoverview Logger utility for consistent console logging across the application
 * @module utils/logger
 * @author PageRank Visualizer Team
 * @created 2025-11-21
 */

/**
 * Module names for categorizing log messages
 */
export type LogModule =
  | 'DataLoader'
  | 'GraphParser'
  | 'Worker'
  | 'Algorithm'
  | 'ErrorMetrics'
  | 'UI'
  | 'WASM'
  | 'FileUpload'
  | 'GraphVisualizer'
  | 'App';

/**
 * Unified logger for the application
 * Provides structured logging with timestamps and module categorization
 */
export const logger = {
  /**
   * Log informational messages
   * @param module - The module name where the log originates
   * @param message - The log message
   * @param data - Optional data to include in the log
   */
  info: (module: LogModule, message: string, data?: unknown): void => {
    const timestamp = new Date().toISOString();
    if (data !== undefined) {
      console.log(`[${timestamp}] [${module}] ${message}`, data);
    } else {
      console.log(`[${timestamp}] [${module}] ${message}`);
    }
  },

  /**
   * Log error messages
   * @param module - The module name where the error originates
   * @param message - The error message
   * @param error - Optional error object or additional data
   */
  error: (module: LogModule, message: string, error?: unknown): void => {
    const timestamp = new Date().toISOString();
    if (error !== undefined) {
      console.error(`[${timestamp}] [${module}] ERROR: ${message}`, error);
    } else {
      console.error(`[${timestamp}] [${module}] ERROR: ${message}`);
    }
  },

  /**
   * Log warning messages
   * @param module - The module name where the warning originates
   * @param message - The warning message
   * @param data - Optional data to include in the log
   */
  warn: (module: LogModule, message: string, data?: unknown): void => {
    const timestamp = new Date().toISOString();
    if (data !== undefined) {
      console.warn(`[${timestamp}] [${module}] WARNING: ${message}`, data);
    } else {
      console.warn(`[${timestamp}] [${module}] WARNING: ${message}`);
    }
  },

  /**
   * Start a timer for performance measurement
   * @param label - The label for the timer
   */
  time: (label: string): void => {
    console.time(label);
  },

  /**
   * End a timer and log the elapsed time
   * @param label - The label for the timer
   */
  timeEnd: (label: string): void => {
    console.timeEnd(label);
  },

  /**
   * Log debug messages (only in development)
   * @param module - The module name where the debug log originates
   * @param message - The debug message
   * @param data - Optional data to include in the log
   */
  debug: (module: LogModule, message: string, data?: unknown): void => {
    if (import.meta.env.DEV) {
      const timestamp = new Date().toISOString();
      if (data !== undefined) {
        console.debug(`[${timestamp}] [${module}] DEBUG: ${message}`, data);
      } else {
        console.debug(`[${timestamp}] [${module}] DEBUG: ${message}`);
      }
    }
  },
};
