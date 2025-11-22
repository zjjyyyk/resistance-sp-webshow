/**
 * @fileoverview Type definitions for algorithm execution and results
 * @module types/algorithm
 */

/**
 * Available algorithm types
 */
export type AlgorithmType =
  | 'push-v-sp-wasm'
  | 'push-v-sp-js'
  | 'abwalk-v-sp-wasm'
  | 'abwalk-v-sp-js';

/**
 * Algorithm parameters for Push_v_sp
 */
export interface PushVSpParams {
  /** Source node */
  s: number;
  /** Target node */
  t: number;
  /** Landmark node */
  v: number;
  /** Residual threshold (default: 1e-6) */
  rmax: number;
}

/**
 * Algorithm parameters for Abwalk_v_sp
 */
export interface AbwalkVSpParams {
  /** Source node */
  s: number;
  /** Target node */
  t: number;
  /** Landmark node */
  v: number;
  /** Number of random walks (default: 10000) */
  times: number;
}

/**
 * Union type for algorithm parameters
 */
export type AlgorithmParams = PushVSpParams | AbwalkVSpParams;

/**
 * Algorithm execution result
 */
export interface AlgorithmResult {
  /** Unique identifier for this result */
  id: string;
  /** Algorithm type used */
  algorithm: AlgorithmType;
  /** Dataset name */
  dataset: string;
  /** Algorithm parameters */
  params: AlgorithmParams;
  /** Resistance distance (scalar result) */
  resistanceDistance: number;
  /** Execution time in milliseconds */
  executionTime: number;
  /** Timestamp of computation */
  timestamp: number;
  /** Whether this result is the ground truth */
  isGroundTruth: boolean;
}

/**
 * Error metrics compared to ground truth
 */
export interface ErrorMetrics {
  /** Absolute error: |result - groundTruth| */
  absolute: number;
  /** Relative error: |result - groundTruth| / |groundTruth| */
  relative: number;
}

/**
 * Algorithm result with error metrics
 */
export interface AlgorithmResultWithMetrics extends AlgorithmResult {
  /** Error metrics (null if no ground truth set) */
  metrics: ErrorMetrics | null;
  /** Whether this result is collapsed (UI state) */
  isCollapsed?: boolean;
  /** Whether this result is pinned (UI state) */
  isPinned?: boolean;
}
