/**
 * @fileoverview Abwalk_v_sp algorithm implementation in JavaScript
 * @module algorithms/abwalkVSp
 * @author Resistance Distance Visualizer Team
 * 
 * Implements the v-absorbed random walk algorithm for computing resistance distance.
 * Translated from Abwalk_v_sp.hpp
 */

import { logger } from '@/utils/logger';
import type { Graph } from '@/types/graph';
import type { AbwalkVSpParams } from '@/types/algorithm';

/**
 * Compute resistance distance using Abwalk_v_sp method
 * 
 * Algorithm:
 * 1. Perform v-absorbed random walks from s
 * 2. Perform v-absorbed random walks from t
 * 3. Count hits and compute resistance distance
 * 
 * @param graph - The undirected graph
 * @param params - Algorithm parameters (s, t, v, times)
 * @param onProgress - Optional callback for progress updates (0-100)
 * @returns Resistance distance between s and t
 */
export function abwalkVSpJS(
  graph: Graph,
  params: AbwalkVSpParams,
  onProgress?: (progress: number) => void
): number {
  const { s, t, v, times } = params;
  const n = graph.nodes;

  logger.info('Algorithm', 'Starting Abwalk_v_sp (JS)', {
    nodes: n,
    edges: graph.edges.length,
    s,
    t,
    v,
    times,
  });

  logger.time('AbwalkVSp-JS-Total');

  // Compute degree for each node
  const degree = new Float64Array(n);
  for (const edge of graph.edges) {
    degree[edge.source]++;
  }

  logger.info('Algorithm', `Landmark node v=${v} with degree ${degree[v]}`);

  // Build adjacency list
  const adjacencyList: number[][] = Array.from({ length: n }, () => []);
  for (const edge of graph.edges) {
    adjacencyList[edge.source].push(edge.target);
  }

  // Random neighbor selection helper
  const randNeighbor = (u: number): number => {
    const neighbors = adjacencyList[u];
    const idx = Math.floor(Math.random() * neighbors.length);
    return neighbors[idx];
  };

  // Hit counters
  let tauss = 0; // v-absorbed walk from s passing s
  let taust = 0; // v-absorbed walk from s passing t
  let tauts = 0; // v-absorbed walk from t passing s
  let tautt = 0; // v-absorbed walk from t passing t

  // v-absorbed walks from s
  logger.debug('Algorithm', `Start v-absorbed walks from s, times=${times}`);
  for (let i = 0; i < times; i++) {
    let u = s;
    while (u !== v) {
      if (u === s) tauss += 1.0;
      if (u === t) taust += 1.0;
      u = randNeighbor(u);
    }
    
    // Report progress
    if (onProgress && (i + 1) % Math.max(1, Math.floor(times / 20)) === 0) {
      const progress = ((i + 1) / times) * 50; // First half is 0-50%
      onProgress(progress);
    }
  }

  logger.debug('Algorithm', 'Completed v-absorbed walks from s');

  // v-absorbed walks from t
  logger.debug('Algorithm', `Start v-absorbed walks from t, times=${times}`);
  for (let i = 0; i < times; i++) {
    let u = t;
    while (u !== v) {
      if (u === s) tauts += 1.0;
      if (u === t) tautt += 1.0;
      u = randNeighbor(u);
    }
    
    // Report progress
    if (onProgress && (i + 1) % Math.max(1, Math.floor(times / 20)) === 0) {
      const progress = 50 + ((i + 1) / times) * 50; // Second half is 50-100%
      onProgress(progress);
    }
  }

  logger.debug('Algorithm', 'Completed v-absorbed walks from t');

  // Compute resistance distance
  logger.debug('Algorithm', 'Calculating resistance distance');
  const resistanceDistance = 
    tauss / (degree[s] * times) -
    taust / (degree[t] * times) -
    tauts / (degree[s] * times) +
    tautt / (degree[t] * times);

  logger.timeEnd('AbwalkVSp-JS-Total');
  logger.info('Algorithm', 'Completed Abwalk_v_sp (JS)', {
    resistanceDistance,
    tauss,
    taust,
    tauts,
    tautt,
  });

  return resistanceDistance;
}
