/**
 * @fileoverview Type definitions for Web Worker communication
 * @module types/worker
 */

import type { AlgorithmType, AlgorithmParams } from './algorithm';
import type { Graph } from './graph';

/**
 * Message types for worker communication
 */
export type WorkerMessageType = 'COMPUTE' | 'CANCEL';

/**
 * Result types from worker
 */
export type WorkerResultType = 'RESULT' | 'ERROR' | 'PROGRESS';

/**
 * Message sent to worker to start computation
 */
export interface ComputeMessage {
  type: 'COMPUTE';
  payload: {
    algorithm: AlgorithmType;
    graph: Graph;
    params: AlgorithmParams;
    taskId: string;
  };
}

/**
 * Message to cancel ongoing computation
 */
export interface CancelMessage {
  type: 'CANCEL';
  payload: {
    taskId: string;
  };
}

/**
 * Union type for messages sent to worker
 */
export type WorkerMessage = ComputeMessage | CancelMessage;

/**
 * Successful computation result from worker
 */
export interface ComputeResultMessage {
  type: 'RESULT';
  payload: {
    taskId: string;
    result: number; // Scalar resistance distance
    time: number;
  };
}

/**
 * Error message from worker
 */
export interface ComputeErrorMessage {
  type: 'ERROR';
  payload: {
    taskId: string;
    error: string;
  };
}

/**
 * Progress update from worker
 */
export interface ComputeProgressMessage {
  type: 'PROGRESS';
  payload: {
    taskId: string;
    progress: number; // 0-100
    message?: string;
  };
}

/**
 * Union type for messages received from worker
 */
export type WorkerResult =
  | ComputeResultMessage
  | ComputeErrorMessage
  | ComputeProgressMessage;
