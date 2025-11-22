/**
 * @fileoverview Push_v_sp algorithm implementation in JavaScript
 * @module algorithms/pushVSp
 * @author Resistance Distance Visualizer Team
 * 
 * Implements the Push-based algorithm for computing resistance distance
 * with a landmark node v.
 * Translated from Push_v_sp.hpp
 */

import { logger } from '@/utils/logger';
import type { Graph } from '@/types/graph';
import type { PushVSpParams } from '@/types/algorithm';

/**
 * Compute resistance distance using Push_v_sp method
 * 
 * Algorithm:
 * 1. Push from source node s (avoiding landmark v)
 * 2. Push from target node t (avoiding landmark v)
 * 3. Compute resistance distance from the residuals
 * 
 * @param graph - The undirected graph
 * @param params - Algorithm parameters (s, t, v, rmax)
 * @param onProgress - Optional callback for progress updates (0-100)
 * @returns Resistance distance between s and t
 */
export function pushVSpJS(
  graph: Graph,
  params: PushVSpParams,
  onProgress?: (progress: number) => void
): number {
  const { s, t, v, rmax } = params;
  const n = graph.nodes;

  logger.info('Algorithm', 'Starting Push_v_sp (JS)', {
    nodes: n,
    edges: graph.edges.length,
    s,
    t,
    v,
    rmax,
  });

  logger.time('PushVSp-JS-Total');

  // Compute degree for each node
  const degree = new Float64Array(n);
  for (const edge of graph.edges) {
    degree[edge.source]++;
  }

  logger.info('Algorithm', `Landmark node v=${v} with degree ${degree[v]}`);

  // Build adjacency list for faster neighbor access
  const adjacencyList: number[][] = Array.from({ length: n }, () => []);
  for (const edge of graph.edges) {
    adjacencyList[edge.source].push(edge.target);
  }

  // Push from s
  logger.debug('Algorithm', 'Start push from s', { s, rmax });
  const rs = new Float64Array(n);
  rs[s] = 1.0;
  const ps = new Float64Array(n);
  
  const queue: number[] = [];
  const inQueue = new Set<number>();
  
  if (s !== v) {
    queue.push(s);
    inQueue.add(s);
  }

  let pushCount = 0;
  while (queue.length > 0) {
    const u = queue.shift()!;
    inQueue.delete(u);
    
    ps[u] += rs[u];
    
    for (const nei of adjacencyList[u]) {
      if (nei === v) continue; // Skip landmark
      
      rs[nei] += rs[u] / degree[u];
      
      if (!inQueue.has(nei) && rs[nei] > degree[nei] * rmax) {
        queue.push(nei);
        inQueue.add(nei);
      }
    }
    
    rs[u] = 0.0;
    pushCount++;
    
    // Report progress periodically
    if (onProgress && pushCount % 100 === 0) {
      onProgress(25); // First push is ~25% of work
    }
  }

  logger.debug('Algorithm', `Completed push from s (${pushCount} pushes)`);

  // Push from t
  logger.debug('Algorithm', 'Start push from t', { t, rmax });
  const rt = new Float64Array(n);
  rt[t] = 1.0;
  const pt = new Float64Array(n);
  
  queue.length = 0;
  inQueue.clear();
  
  if (t !== v) {
    queue.push(t);
    inQueue.add(t);
  }

  pushCount = 0;
  while (queue.length > 0) {
    const u = queue.shift()!;
    inQueue.delete(u);
    
    pt[u] += rt[u];
    
    for (const nei of adjacencyList[u]) {
      if (nei === v) continue; // Skip landmark
      
      rt[nei] += rt[u] / degree[u];
      
      if (!inQueue.has(nei) && rt[nei] > degree[nei] * rmax) {
        queue.push(nei);
        inQueue.add(nei);
      }
    }
    
    rt[u] = 0.0;
    pushCount++;
    
    // Report progress periodically
    if (onProgress && pushCount % 100 === 0) {
      onProgress(75); // Second push completes at ~75%
    }
  }

  logger.debug('Algorithm', `Completed push from t (${pushCount} pushes)`);

  // Compute resistance distance
  logger.debug('Algorithm', 'Calculating resistance distance');
  const resistanceDistance = 
    ps[s] / degree[s] +
    pt[t] / degree[t] -
    ps[t] / degree[s] -
    pt[s] / degree[t];

  if (onProgress) {
    onProgress(100);
  }

  logger.timeEnd('PushVSp-JS-Total');
  logger.info('Algorithm', 'Completed Push_v_sp (JS)', {
    resistanceDistance,
  });

  return resistanceDistance;
}
