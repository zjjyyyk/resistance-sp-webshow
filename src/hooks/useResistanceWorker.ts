/**
 * @fileoverview Resistance distance worker hook for managing Web Worker communication
 * @module hooks/useResistanceWorker
 */

import { useEffect, useRef, useCallback } from 'react';
import { logger } from '@/utils/logger';
import type {
  WorkerMessage,
  WorkerResult,
  ComputeMessage,
} from '@/types/worker';
import type { AlgorithmType, AlgorithmParams } from '@/types/algorithm';
import type { Graph } from '@/types/graph';

export interface ComputeTask {
  taskId: string;
  onResult: (result: number, time: number) => void;
  onError: (error: string) => void;
  onProgress?: (progress: number, message?: string) => void;
}

export function useResistanceWorker() {
  const workerRef = useRef<Worker | null>(null);
  const tasksRef = useRef<Map<string, ComputeTask>>(new Map());

  useEffect(() => {
    // Create worker
    logger.info('UI', 'Initializing Resistance Distance worker');
    workerRef.current = new Worker(
      new URL('@/workers/resistance.worker.ts', import.meta.url),
      { type: 'module' }
    );

    // Set up message handler
    workerRef.current.onmessage = (event: MessageEvent<WorkerResult>) => {
      const message = event.data;
      const task = tasksRef.current.get(message.payload.taskId);

      if (!task) {
        logger.warn('UI', `Received message for unknown task: ${message.payload.taskId}`);
        return;
      }

      switch (message.type) {
        case 'RESULT':
          logger.info('UI', `Received result for task ${message.payload.taskId}`);
          task.onResult(message.payload.result!, message.payload.time!);
          tasksRef.current.delete(message.payload.taskId);
          break;

        case 'ERROR':
          logger.error('UI', `Received error for task ${message.payload.taskId}`, message.payload.error);
          task.onError(message.payload.error!);
          tasksRef.current.delete(message.payload.taskId);
          break;

        case 'PROGRESS':
          if (task.onProgress) {
            task.onProgress(message.payload.progress!, message.payload.message);
          }
          break;
      }
    };

    workerRef.current.onerror = (error) => {
      logger.error('UI', 'Worker error', error);
      // Notify all pending tasks
      tasksRef.current.forEach((task) => {
        task.onError('Worker error occurred');
      });
      tasksRef.current.clear();
    };

    return () => {
      logger.info('UI', 'Terminating Resistance Distance worker');
      workerRef.current?.terminate();
      workerRef.current = null;
      tasksRef.current.clear();
    };
  }, []);

  const compute = useCallback(
    (
      algorithm: AlgorithmType,
      graph: Graph,
      params: AlgorithmParams,
      callbacks: Omit<ComputeTask, 'taskId'>
    ): string => {
      if (!workerRef.current) {
        throw new Error('Worker not initialized');
      }

      const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Register task
      tasksRef.current.set(taskId, { taskId, ...callbacks });

      // Send message to worker
      const message: ComputeMessage = {
        type: 'COMPUTE',
        payload: {
          algorithm,
          graph,
          params,
          taskId,
        },
      };

      logger.info('UI', `Sending compute request for task ${taskId}`, { algorithm });
      workerRef.current.postMessage(message);

      return taskId;
    },
    []
  );

  const cancel = useCallback((taskId: string) => {
    if (!workerRef.current) return;

    const message: WorkerMessage = {
      type: 'CANCEL',
      payload: { taskId },
    };

    workerRef.current.postMessage(message);
    tasksRef.current.delete(taskId);
  }, []);

  return { compute, cancel };
}
