/**
 * @fileoverview Error metrics calculation for Resistance Distance results
 * @module utils/errorMetrics
 * @author Resistance Distance Visualizer Team
 * 
 * Calculates absolute and relative errors comparing
 * Resistance Distance results against a ground truth reference.
 */

import { logger } from './logger';
import type { ErrorMetrics } from '@/types/algorithm';

/**
 * Calculate absolute error
 * 
 * Absolute = |result - groundTruth|
 * 
 * @param result - Computed resistance distance
 * @param groundTruth - Ground truth resistance distance
 * @returns Absolute error value
 */
export function calculateAbsoluteError(result: number, groundTruth: number): number {
  return Math.abs(result - groundTruth);
}

/**
 * Calculate relative error
 * 
 * Relative = |result - groundTruth| / |groundTruth|
 * 
 * @param result - Computed resistance distance
 * @param groundTruth - Ground truth resistance distance
 * @returns Relative error value (as a fraction, not percentage)
 */
export function calculateRelativeError(result: number, groundTruth: number): number {
  if (Math.abs(groundTruth) < 1e-10) {
    logger.warn('ErrorMetrics', 'Ground truth is near zero, relative error may be unreliable', {
      groundTruth,
    });
    return Infinity;
  }
  return Math.abs(result - groundTruth) / Math.abs(groundTruth);
}

/**
 * Calculate all error metrics at once
 * 
 * @param result - Computed resistance distance
 * @param groundTruth - Ground truth resistance distance
 * @returns Error metrics object
 */
export function calculateErrorMetrics(result: number, groundTruth: number): ErrorMetrics {
  logger.time('ErrorMetrics-Calculate');

  const absolute = calculateAbsoluteError(result, groundTruth);
  const relative = calculateRelativeError(result, groundTruth);

  const metrics: ErrorMetrics = {
    absolute,
    relative,
  };

  logger.info('ErrorMetrics', 'Calculated error metrics', metrics);
  logger.timeEnd('ErrorMetrics-Calculate');

  return metrics;
}

/**
 * Format error metrics for display
 * 
 * @param metrics - Error metrics to format
 * @returns Formatted string representation
 */
export function formatErrorMetrics(metrics: ErrorMetrics): string {
  return `Absolute: ${metrics.absolute.toExponential(3)}, Relative: ${(metrics.relative * 100).toFixed(2)}%`;
}
