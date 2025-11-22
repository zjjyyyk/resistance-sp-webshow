/**
 * @fileoverview Web Worker for Resistance Distance computation
 * @module workers/resistance.worker
 * @author Resistance Distance Visualizer Team
 * 
 * Handles all resistance distance computations in a separate thread to avoid blocking the UI.
 * Supports both JavaScript and WebAssembly implementations.
 */

import { logger } from '@/utils/logger';
import { pushVSpJS } from '@/algorithms/pushVSp';
import { abwalkVSpJS } from '@/algorithms/abwalkVSp';
import type {
  WorkerMessage,
  WorkerResult,
  ComputeMessage,
} from '@/types/worker';
import type {
  PushVSpParams,
  AbwalkVSpParams,
} from '@/types/algorithm';

// Worker global declarations
declare function importScripts(...urls: string[]): void;

// WASM module interface
interface ResistanceWASM {
  _pushVSp(
    n: number,
    m: number,
    edgeSources: number,
    edgeTargets: number,
    s: number,
    t: number,
    v: number,
    rmax: number
  ): number;
  _abwalkVSp(
    n: number,
    m: number,
    edgeSources: number,
    edgeTargets: number,
    s: number,
    t: number,
    v: number,
    times: number,
    seed: number
  ): number;
  _malloc(size: number): number;
  _free(ptr: number): void;
  getValue(ptr: number, type: string): number;
  setValue(ptr: number, value: number, type: string): void;
  HEAP32?: Int32Array;
  HEAPU8?: Uint8Array;
  buffer?: ArrayBuffer;
}

// WASM module singleton
let wasmModule: ResistanceWASM | null = null;
let wasmLoadingPromise: Promise<ResistanceWASM> | null = null;

/**
 * Load WASM module (singleton pattern)
 */
async function loadWASM(): Promise<ResistanceWASM> {
  if (wasmModule) {
    return wasmModule;
  }

  if (wasmLoadingPromise) {
    return wasmLoadingPromise;
  }

  wasmLoadingPromise = (async () => {
    try {
      logger.info('Worker', 'Loading WASM module...');
      
      const basePath = `${self.location.origin}${import.meta.env.BASE_URL}`;
      
      // Fetch the Emscripten JS wrapper
      const response = await fetch(`${basePath}resistance.js`);
      if (!response.ok) {
        throw new Error(`Failed to fetch resistance.js: ${response.status}`);
      }
      
      const scriptText = await response.text();
      
      // Use indirect eval to execute in global scope
      (0, eval)(scriptText);
      
      const createModule = (globalThis as any).createResistanceModule;
      if (typeof createModule !== 'function') {
        throw new Error('WASM module loader is not a function');
      }
      
      // Create the WASM module instance
      const module = await createModule({
        locateFile: (path: string) => {
          if (path.endsWith('.wasm')) {
            return `${basePath}${path}`;
          }
          return path;
        },
      });
      
      // Wait for runtime initialization
      await new Promise(resolve => setTimeout(resolve, 10));

      wasmModule = module;
      logger.info('Worker', 'WASM module loaded successfully');
      
      return wasmModule!;
    } catch (error) {
      logger.error('Worker', 'Failed to load WASM module', error);
      wasmLoadingPromise = null;
      throw error;
    }
  })();

  return wasmLoadingPromise;
}

/**
 * Execute Push_v_sp using JavaScript
 */
function executePushVSpJS(message: ComputeMessage): number {
  logger.info('Worker', 'Executing Push_v_sp (JS)');

  const { graph, params, taskId } = message.payload;

  // Progress callback
  const onProgress = (progress: number) => {
    const progressMsg: WorkerResult = {
      type: 'PROGRESS',
      payload: {
        taskId,
        progress,
        message: `Computing ${Math.round(progress)}%`,
      },
    };
    self.postMessage(progressMsg);
  };

  return pushVSpJS(graph, params as PushVSpParams, onProgress);
}

/**
 * Execute Abwalk_v_sp using JavaScript
 */
function executeAbwalkVSpJS(message: ComputeMessage): number {
  logger.info('Worker', 'Executing Abwalk_v_sp (JS)');

  const { graph, params, taskId } = message.payload;

  // Progress callback
  const onProgress = (progress: number) => {
    const progressMsg: WorkerResult = {
      type: 'PROGRESS',
      payload: {
        taskId,
        progress,
        message: `Random walks ${Math.round(progress)}%`,
      },
    };
    self.postMessage(progressMsg);
  };

  return abwalkVSpJS(graph, params as AbwalkVSpParams, onProgress);
}

/**
 * Execute Push_v_sp using WASM
 */
async function executePushVSpWASM(message: ComputeMessage): Promise<{ result: number; pureTime: number }> {
  try {
    const module = await loadWASM();
    logger.info('Worker', 'Executing Push_v_sp (WASM)');

    const { graph, params, taskId } = message.payload;
    const { s, t, v, rmax } = params as PushVSpParams;
    const n = graph.nodes;
    const m = graph.edges.length;

    // Allocate memory for edge arrays (not counted in execution time)
    const edgeSourcesPtr = module._malloc(m * 4); // 4 bytes per int32
    const edgeTargetsPtr = module._malloc(m * 4);

    try {
      // Copy edge data to WASM memory (not counted in execution time)
      const sources = new Int32Array(m);
      const targets = new Int32Array(m);
      for (let i = 0; i < m; i++) {
        sources[i] = graph.edges[i].source;
        targets[i] = graph.edges[i].target;
      }
      
      // Copy to WASM memory using setValue
      for (let i = 0; i < m; i++) {
        module.setValue(edgeSourcesPtr + i * 4, sources[i], 'i32');
        module.setValue(edgeTargetsPtr + i * 4, targets[i], 'i32');
      }

      // Send progress update
      const progressMsg: WorkerResult = {
        type: 'PROGRESS',
        payload: {
          taskId,
          progress: 50,
          message: 'Computing (WASM)...',
        },
      };
      self.postMessage(progressMsg);

      // ⏱️ Start timing here - only measure the C++ algorithm execution
      const algoStart = performance.now();
      const result = module._pushVSp(
        n,
        m,
        edgeSourcesPtr,
        edgeTargetsPtr,
        s,
        t,
        v,
        rmax
      );
      const pureTime = performance.now() - algoStart;
      // ⏱️ End timing

      logger.info('Worker', `WASM execution time: ${pureTime.toFixed(3)}ms`);

      return { result, pureTime };
    } finally {
      // Free allocated memory
      module._free(edgeSourcesPtr);
      module._free(edgeTargetsPtr);
    }
  } catch (error) {
    logger.error('Worker', 'WASM execution failed, falling back to JS', error);
    const jsResult = executePushVSpJS(message);
    return { result: jsResult, pureTime: 0 };
  }
}

/**
 * Execute Abwalk_v_sp using WASM
 */
async function executeAbwalkVSpWASM(message: ComputeMessage): Promise<{ result: number; pureTime: number }> {
  try {
    const module = await loadWASM();
    logger.info('Worker', 'Executing Abwalk_v_sp (WASM)');

    const { graph, params, taskId } = message.payload;
    const { s, t, v, times } = params as AbwalkVSpParams;
    const n = graph.nodes;
    const m = graph.edges.length;
    const seed = Math.floor(Math.random() * 0xFFFFFFFF);

    // Allocate memory (not counted)
    const edgeSourcesPtr = module._malloc(m * 4);
    const edgeTargetsPtr = module._malloc(m * 4);

    try {
      // Copy edge data to WASM memory (not counted)
      const sources = new Int32Array(m);
      const targets = new Int32Array(m);
      for (let i = 0; i < m; i++) {
        sources[i] = graph.edges[i].source;
        targets[i] = graph.edges[i].target;
      }
      
      // Copy to WASM memory using setValue
      for (let i = 0; i < m; i++) {
        module.setValue(edgeSourcesPtr + i * 4, sources[i], 'i32');
        module.setValue(edgeTargetsPtr + i * 4, targets[i], 'i32');
      }

      const progressMsg: WorkerResult = {
        type: 'PROGRESS',
        payload: {
          taskId,
          progress: 50,
          message: 'Random walks (WASM)...',
        },
      };
      self.postMessage(progressMsg);

      // ⏱️ Start timing - only measure C++ execution
      const algoStart = performance.now();
      const result = module._abwalkVSp(
        n,
        m,
        edgeSourcesPtr,
        edgeTargetsPtr,
        s,
        t,
        v,
        times,
        seed
      );
      const pureTime = performance.now() - algoStart;
      // ⏱️ End timing

      logger.info('Worker', `WASM execution time: ${pureTime.toFixed(3)}ms`);

      return { result, pureTime };
    } finally {
      // Free allocated memory
      module._free(edgeSourcesPtr);
      module._free(edgeTargetsPtr);
    }
  } catch (error) {
    logger.error('Worker', 'WASM execution failed, falling back to JS', error);
    const jsResult = executeAbwalkVSpJS(message);
    return { result: jsResult, pureTime: 0 };
  }
}

/**
 * Handle compute message
 */
async function handleCompute(message: ComputeMessage): Promise<void> {
  const { algorithm, taskId } = message.payload;

  logger.info('Worker', `Starting computation for task ${taskId}`, {
    algorithm,
    nodes: message.payload.graph.nodes,
    edges: message.payload.graph.edges.length,
  });

  try {
    let result: number;
    let executionTime: number;

    // For WASM, measure only the pure computation time
    // For JS, measure the full algorithm time
    const startTime = performance.now();

    // Dispatch to appropriate algorithm implementation
    switch (algorithm) {
      case 'push-v-sp-wasm':
      case 'abwalk-v-sp-wasm': {
        // For WASM: use the pure execution time returned from the function
        const wasmResult = await (algorithm === 'push-v-sp-wasm' 
          ? executePushVSpWASM(message)
          : executeAbwalkVSpWASM(message));
        result = wasmResult.result;
        executionTime = wasmResult.pureTime;
        break;
      }

      case 'push-v-sp-js':
        result = executePushVSpJS(message);
        executionTime = performance.now() - startTime;
        break;

      case 'abwalk-v-sp-js':
        result = executeAbwalkVSpJS(message);
        executionTime = performance.now() - startTime;
        break;

      default:
        throw new Error(`Unknown algorithm: ${algorithm}`);
    }

    logger.info('Worker', `Computation completed for task ${taskId}`, {
      algorithm,
      executionTime,
      result,
    });

    // Send result back to main thread
    const resultMsg: WorkerResult = {
      type: 'RESULT',
      payload: {
        taskId,
        result,
        time: executionTime,
      },
    };

    self.postMessage(resultMsg);
  } catch (error) {
    logger.error('Worker', `Computation failed for task ${taskId}`, error);

    const errorMsg: WorkerResult = {
      type: 'ERROR',
      payload: {
        taskId,
        error: error instanceof Error ? error.message : String(error),
      },
    };

    self.postMessage(errorMsg);
  }
}

/**
 * Message handler
 */
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;

  logger.debug('Worker', 'Received message', { type: message.type });

  switch (message.type) {
    case 'COMPUTE':
      await handleCompute(message);
      break;

    case 'CANCEL':
      logger.info('Worker', 'Cancel requested', message.payload);
      // Note: Current implementation doesn't support cancellation
      // In a production system, you'd need to add cancellation logic
      break;

    default:
      logger.warn('Worker', 'Unknown message type', message);
  }
};

// Log worker initialization
logger.info('Worker', 'Resistance Distance worker initialized');
