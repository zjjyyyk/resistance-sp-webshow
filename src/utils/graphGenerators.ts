/**
 * @fileoverview Synthetic graph generators
 * @module utils/graphGenerators
 * @author Resistance Distance Visualizer Team
 * 
 * Provides functions to generate various types of synthetic graphs.
 * Translated from graph_generators.hpp
 */

import { logger } from './logger';
import type { Graph, SyntheticGraphType } from '@/types/graph';

const MODULE = 'UI' as const;

/**
 * Generate a random number in range [0, max)
 */
function randInt(max: number): number {
  return Math.floor(Math.random() * max);
}

/**
 * Generate a random float in range [0, 1)
 */
function randFloat(): number {
  return Math.random();
}

/**
 * Add an undirected edge to the graph
 */
function addEdge(adj: Set<number>[], u: number, v: number): void {
  if (u === v) return; // No self-loops
  adj[u].add(v);
  adj[v].add(u);
}

/**
 * Convert adjacency list to edge list (undirected, so each edge appears twice)
 */
function adjToEdges(adj: Set<number>[]): { source: number; target: number }[] {
  const edges: { source: number; target: number }[] = [];
  
  // Since adj is already bidirectional (from addEdge), just iterate and add all edges
  for (let u = 0; u < adj.length; u++) {
    for (const v of adj[u]) {
      edges.push({ source: u, target: v });
    }
  }
  
  return edges;
}

// 1. Planar Graph (simplified)
export function generatePlanar(n: number, edgeProb = 0.1): Graph {
  logger.info(MODULE, `Generating Planar graph: n=${n}, edgeProb=${edgeProb}`);
  
  const adj: Set<number>[] = Array.from({ length: n }, () => new Set());
  
  // Simplified planar graph: limit degree to maintain planarity
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (randFloat() < edgeProb && adj[i].size < 5 && adj[j].size < 5) {
        addEdge(adj, i, j);
      }
    }
  }
  
  const edges = adjToEdges(adj);
  logger.info(MODULE, `Generated Planar graph: ${edges.length} edges`);
  
  return { nodes: n, edges, isDirected: false };
}

// 2. Cycle Graph
export function generateCycle(n: number): Graph {
  logger.info(MODULE, `Generating Cycle graph: n=${n}`);
  
  const edges: { source: number; target: number }[] = [];
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    edges.push({ source: i, target: next });
    edges.push({ source: next, target: i });
  }
  
  return { nodes: n, edges, isDirected: false };
}

// 3. Path Graph
export function generatePath(n: number): Graph {
  logger.info(MODULE, `Generating Path graph: n=${n}`);
  
  const edges: { source: number; target: number }[] = [];
  for (let i = 0; i < n - 1; i++) {
    edges.push({ source: i, target: i + 1 });
    edges.push({ source: i + 1, target: i });
  }
  
  return { nodes: n, edges, isDirected: false };
}

// 4. Complete Bipartite Graph
export function generateCompleteBipartite(n1: number, n2: number): Graph {
  logger.info(MODULE, `Generating Complete Bipartite graph: n1=${n1}, n2=${n2}`);
  
  const n = n1 + n2;
  const edges: { source: number; target: number }[] = [];
  
  for (let i = 0; i < n1; i++) {
    for (let j = n1; j < n; j++) {
      edges.push({ source: i, target: j });
      edges.push({ source: j, target: i });
    }
  }
  
  return { nodes: n, edges, isDirected: false };
}

// 5. Star Graph
export function generateStar(n: number): Graph {
  logger.info(MODULE, `Generating Star graph: n=${n}`);
  
  const edges: { source: number; target: number }[] = [];
  for (let i = 1; i < n; i++) {
    edges.push({ source: 0, target: i });
    edges.push({ source: i, target: 0 });
  }
  
  return { nodes: n, edges, isDirected: false };
}

// 6. Matching Graph
export function generateMatching(n: number): Graph {
  logger.info(MODULE, `Generating Matching graph: n=${n}`);
  
  const edges: { source: number; target: number }[] = [];
  for (let i = 0; i < n - 1; i += 2) {
    edges.push({ source: i, target: i + 1 });
    edges.push({ source: i + 1, target: i });
  }
  
  return { nodes: n, edges, isDirected: false };
}

// 7. Random Tree (using Prufer sequence)
export function generateRandomTree(n: number): Graph {
  logger.info(MODULE, `Generating Random Tree: n=${n}`);
  
  if (n === 1) {
    return { nodes: 1, edges: [], isDirected: false };
  }
  
  // Generate Prufer sequence
  const prufer: number[] = [];
  for (let i = 0; i < n - 2; i++) {
    prufer.push(randInt(n));
  }
  
  // Convert to tree
  const degree = Array(n).fill(1);
  for (const x of prufer) {
    degree[x]++;
  }
  
  const edges: { source: number; target: number }[] = [];
  
  for (let i = 0; i < n - 2; i++) {
    for (let j = 0; j < n; j++) {
      if (degree[j] === 1) {
        const u = j;
        const v = prufer[i];
        edges.push({ source: u, target: v });
        edges.push({ source: v, target: u });
        degree[j]--;
        degree[prufer[i]]--;
        break;
      }
    }
  }
  
  // Connect last two nodes with degree 1
  const lastTwo: number[] = [];
  for (let i = 0; i < n; i++) {
    if (degree[i] === 1) {
      lastTwo.push(i);
    }
  }
  
  if (lastTwo.length === 2) {
    edges.push({ source: lastTwo[0], target: lastTwo[1] });
    edges.push({ source: lastTwo[1], target: lastTwo[0] });
  }
  
  return { nodes: n, edges, isDirected: false };
}

// 8. Lobster Graph
export function generateLobster(spineLength: number, maxLegs = 2): Graph {
  logger.info(MODULE, `Generating Lobster: spineLength=${spineLength}, maxLegs=${maxLegs}`);
  
  const adj: Set<number>[] = [];
  let nodeCount = 0;
  
  // Create spine
  const spine: number[] = [];
  for (let i = 0; i < spineLength; i++) {
    spine.push(nodeCount++);
    adj.push(new Set());
  }
  
  // Connect spine
  for (let i = 0; i < spineLength - 1; i++) {
    addEdge(adj, spine[i], spine[i + 1]);
  }
  
  // Add legs to each spine node
  for (let i = 0; i < spineLength; i++) {
    const legs = randInt(maxLegs + 1);
    for (let j = 0; j < legs; j++) {
      const legNode = nodeCount++;
      adj.push(new Set());
      addEdge(adj, spine[i], legNode);
    }
  }
  
  const edges = adjToEdges(adj);
  return { nodes: nodeCount, edges, isDirected: false };
}

// 9. Caterpillar Graph
export function generateCaterpillar(spineLength: number): Graph {
  logger.info(MODULE, `Generating Caterpillar: spineLength=${spineLength}`);
  
  const adj: Set<number>[] = [];
  let nodeCount = 0;
  
  // Create spine
  const spine: number[] = [];
  for (let i = 0; i < spineLength; i++) {
    spine.push(nodeCount++);
    adj.push(new Set());
  }
  
  // Connect spine
  for (let i = 0; i < spineLength - 1; i++) {
    addEdge(adj, spine[i], spine[i + 1]);
  }
  
  // Add at most one leaf to each spine node
  for (let i = 0; i < spineLength; i++) {
    if (randFloat() < 0.7) { // 70% probability
      const leaf = nodeCount++;
      adj.push(new Set());
      addEdge(adj, spine[i], leaf);
    }
  }
  
  const edges = adjToEdges(adj);
  return { nodes: nodeCount, edges, isDirected: false };
}

// 10. Grid Graph
export function generateGrid(rows: number, cols: number): Graph {
  logger.info(MODULE, `Generating Grid: rows=${rows}, cols=${cols}`);
  
  const n = rows * cols;
  const edges: { source: number; target: number }[] = [];
  
  const getIndex = (r: number, c: number) => r * cols + c;
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const current = getIndex(r, c);
      // Right neighbor
      if (c < cols - 1) {
        const right = getIndex(r, c + 1);
        edges.push({ source: current, target: right });
        edges.push({ source: right, target: current });
      }
      // Down neighbor
      if (r < rows - 1) {
        const down = getIndex(r + 1, c);
        edges.push({ source: current, target: down });
        edges.push({ source: down, target: current });
      }
    }
  }
  
  return { nodes: n, edges, isDirected: false };
}

// 11. Quadrangulation
export function generateQuadrangulation(gridSize: number): Graph {
  logger.info(MODULE, `Generating Quadrangulation: gridSize=${gridSize}`);
  
  const n = (gridSize + 1) * (gridSize + 1);
  const edges: { source: number; target: number }[] = [];
  
  const getIndex = (r: number, c: number) => r * (gridSize + 1) + c;
  
  for (let r = 0; r <= gridSize; r++) {
    for (let c = 0; c <= gridSize; c++) {
      const current = getIndex(r, c);
      if (c < gridSize) {
        const right = getIndex(r, c + 1);
        edges.push({ source: current, target: right });
        edges.push({ source: right, target: current });
      }
      if (r < gridSize) {
        const down = getIndex(r + 1, c);
        edges.push({ source: current, target: down });
        edges.push({ source: down, target: current });
      }
    }
  }
  
  return { nodes: n, edges, isDirected: false };
}

// 12. Partial k-tree
export function generatePartialKTree(n: number, k: number): Graph {
  logger.info(MODULE, `Generating Partial k-tree: n=${n}, k=${k}`);
  
  const adj: Set<number>[] = Array.from({ length: n }, () => new Set());
  
  // Start with k-clique
  for (let i = 0; i < Math.min(k, n); i++) {
    for (let j = i + 1; j < Math.min(k, n); j++) {
      addEdge(adj, i, j);
    }
  }
  
  // Add remaining nodes
  for (let v = k; v < n; v++) {
    const cliqueNodes: number[] = [];
    for (let i = 0; i < v && cliqueNodes.length < k; i++) {
      if (randFloat() < 0.7) {
        cliqueNodes.push(i);
      }
    }
    
    const connections = Math.min(k, cliqueNodes.length);
    for (let i = 0; i < connections; i++) {
      addEdge(adj, v, cliqueNodes[i]);
    }
  }
  
  const edges = adjToEdges(adj);
  return { nodes: n, edges, isDirected: false };
}

// 13. Wheel Graph
export function generateWheel(n: number): Graph {
  logger.info(MODULE, `Generating Wheel: n=${n}`);
  
  const edges: { source: number; target: number }[] = [];
  
  // Center to all others
  for (let i = 1; i < n; i++) {
    edges.push({ source: 0, target: i });
    edges.push({ source: i, target: 0 });
  }
  
  // Outer cycle
  for (let i = 1; i < n - 1; i++) {
    edges.push({ source: i, target: i + 1 });
    edges.push({ source: i + 1, target: i });
  }
  if (n > 2) {
    edges.push({ source: n - 1, target: 1 });
    edges.push({ source: 1, target: n - 1 });
  }
  
  return { nodes: n, edges, isDirected: false };
}

// 14. Disk Intersection Graph
export function generateDiskIntersection(n: number, radius = 0.3): Graph {
  logger.info(MODULE, `Generating Disk Intersection: n=${n}, radius=${radius}`);
  
  // Generate random points
  const points: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    points.push([randFloat(), randFloat()]);
  }
  
  const adj: Set<number>[] = Array.from({ length: n }, () => new Set());
  
  // Connect if distance < 2*radius
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = points[i][0] - points[j][0];
      const dy = points[i][1] - points[j][1];
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 2 * radius) {
        addEdge(adj, i, j);
      }
    }
  }
  
  const edges = adjToEdges(adj);
  return { nodes: n, edges, isDirected: false };
}

// 15. Interval Graph
export function generateIntervalGraph(n: number): Graph {
  logger.info(MODULE, `Generating Interval Graph: n=${n}`);
  
  // Generate random intervals
  const intervals: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const start = randFloat();
    const length = randFloat() * 0.5;
    intervals.push([start, start + length]);
  }
  
  const adj: Set<number>[] = Array.from({ length: n }, () => new Set());
  
  // Connect if intervals intersect
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (intervals[i][1] >= intervals[j][0] && intervals[j][1] >= intervals[i][0]) {
        addEdge(adj, i, j);
      }
    }
  }
  
  const edges = adjToEdges(adj);
  return { nodes: n, edges, isDirected: false };
}

// 16. Ladder Graph
export function generateLadder(n: number): Graph {
  logger.info(MODULE, `Generating Ladder: n=${n}`);
  
  const edges: { source: number; target: number }[] = [];
  
  // Two parallel paths
  for (let i = 0; i < n - 1; i++) {
    edges.push({ source: i, target: i + 1 }); // Top
    edges.push({ source: i + 1, target: i });
    edges.push({ source: i + n, target: i + n + 1 }); // Bottom
    edges.push({ source: i + n + 1, target: i + n });
  }
  
  // Connecting rungs
  for (let i = 0; i < n; i++) {
    edges.push({ source: i, target: i + n });
    edges.push({ source: i + n, target: i });
  }
  
  return { nodes: 2 * n, edges, isDirected: false };
}

// 17. Hypercube Graph
export function generateHypercube(dimension: number): Graph {
  logger.info(MODULE, `Generating Hypercube: dimension=${dimension}`);
  
  const n = 1 << dimension; // 2^dimension
  const edges: { source: number; target: number }[] = [];
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < dimension; j++) {
      const neighbor = i ^ (1 << j); // Flip bit j
      if (neighbor > i) { // Avoid duplicates
        edges.push({ source: i, target: neighbor });
        edges.push({ source: neighbor, target: i });
      }
    }
  }
  
  return { nodes: n, edges, isDirected: false };
}

// 18. Complete Graph
export function generateComplete(n: number): Graph {
  logger.info(MODULE, `Generating Complete graph: n=${n}`);
  
  const edges: { source: number; target: number }[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      edges.push({ source: i, target: j });
      edges.push({ source: j, target: i });
    }
  }
  
  return { nodes: n, edges, isDirected: false };
}

// 19. Small Vertex Cover
export function generateSmallVertexCover(n: number, coverSize: number): Graph {
  logger.info(MODULE, `Generating Small Vertex Cover: n=${n}, coverSize=${coverSize}`);
  
  const coverNodes = new Set<number>();
  for (let i = 0; i < Math.min(coverSize, n); i++) {
    coverNodes.add(i);
  }
  
  const adj: Set<number>[] = Array.from({ length: n }, () => new Set());
  
  // All edges must connect to at least one cover node
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const connectsToCover = coverNodes.has(i) || coverNodes.has(j);
      if (connectsToCover && randFloat() < 0.3) {
        addEdge(adj, i, j);
      }
    }
  }
  
  const edges = adjToEdges(adj);
  return { nodes: n, edges, isDirected: false };
}

// 20. Small Cutwidth
export function generateSmallCutwidth(n: number): Graph {
  logger.info(MODULE, `Generating Small Cutwidth: n=${n}`);
  
  const adj: Set<number>[] = Array.from({ length: n }, () => new Set());
  
  // Path-like structure
  for (let i = 0; i < n - 1; i++) {
    addEdge(adj, i, i + 1);
  }
  
  // Add limited random edges within distance
  for (let i = 0; i < n; i++) {
    for (let j = i + 2; j < Math.min(i + 5, n); j++) {
      if (randFloat() < 0.2) {
        addEdge(adj, i, j);
      }
    }
  }
  
  const edges = adjToEdges(adj);
  return { nodes: n, edges, isDirected: false };
}

/**
 * Main generator function that dispatches to specific generators
 */
export function generateSyntheticGraph(
  type: SyntheticGraphType,
  params: Record<string, number>
): Graph {
  logger.info(MODULE, `Generating synthetic graph`, { type, params });
  
  switch (type) {
    case 'planar':
      return generatePlanar(params.n, params.edgeProb ?? 0.1);
    case 'cycle':
      return generateCycle(params.n);
    case 'path':
      return generatePath(params.n);
    case 'complete-bipartite':
      return generateCompleteBipartite(params.n1, params.n2);
    case 'star':
      return generateStar(params.n);
    case 'matching':
      return generateMatching(params.n);
    case 'random-tree':
      return generateRandomTree(params.n);
    case 'lobster':
      return generateLobster(params.spineLength, params.maxLegs ?? 2);
    case 'caterpillar':
      return generateCaterpillar(params.spineLength);
    case 'grid':
      return generateGrid(params.rows, params.cols);
    case 'quadrangulation':
      return generateQuadrangulation(params.gridSize);
    case 'partial-k-tree':
      return generatePartialKTree(params.n, params.k);
    case 'wheel':
      return generateWheel(params.n);
    case 'disk-intersection':
      return generateDiskIntersection(params.n, params.radius ?? 0.3);
    case 'interval-graph':
      return generateIntervalGraph(params.n);
    case 'ladder':
      return generateLadder(params.n);
    case 'hypercube':
      return generateHypercube(params.dimension);
    case 'complete':
      return generateComplete(params.n);
    case 'small-vertex-cover':
      return generateSmallVertexCover(params.n, params.coverSize);
    case 'small-cutwidth':
      return generateSmallCutwidth(params.n);
    default:
      throw new Error(`Unknown graph type: ${type}`);
  }
}

/**
 * Get parameter definitions for each graph type
 */
export function getGraphTypeParams(type: SyntheticGraphType): {
  name: string;
  defaultValue: number;
  min?: number;
  max?: number;
}[] {
  const defaults = {
    planar: [
      { name: 'n', defaultValue: 20, min: 2, max: 1000 },
      { name: 'edgeProb', defaultValue: 0.1, min: 0, max: 1 },
    ],
    cycle: [{ name: 'n', defaultValue: 20, min: 3, max: 1000 }],
    path: [{ name: 'n', defaultValue: 20, min: 2, max: 1000 }],
    'complete-bipartite': [
      { name: 'n1', defaultValue: 20, min: 1, max: 500 },
      { name: 'n2', defaultValue: 20, min: 1, max: 500 },
    ],
    star: [{ name: 'n', defaultValue: 20, min: 2, max: 1000 }],
    matching: [{ name: 'n', defaultValue: 20, min: 2, max: 1000 }],
    'random-tree': [{ name: 'n', defaultValue: 20, min: 1, max: 1000 }],
    lobster: [
      { name: 'spineLength', defaultValue: 20, min: 1, max: 500 },
      { name: 'maxLegs', defaultValue: 2, min: 0, max: 10 },
    ],
    caterpillar: [{ name: 'spineLength', defaultValue: 20, min: 1, max: 500 }],
    grid: [
      { name: 'rows', defaultValue: 20, min: 1, max: 100 },
      { name: 'cols', defaultValue: 20, min: 1, max: 100 },
    ],
    quadrangulation: [{ name: 'gridSize', defaultValue: 20, min: 1, max: 100 }],
    'partial-k-tree': [
      { name: 'n', defaultValue: 20, min: 1, max: 1000 },
      { name: 'k', defaultValue: 3, min: 1, max: 10 },
    ],
    wheel: [{ name: 'n', defaultValue: 20, min: 4, max: 1000 }],
    'disk-intersection': [
      { name: 'n', defaultValue: 20, min: 2, max: 500 },
      { name: 'radius', defaultValue: 0.3, min: 0.1, max: 1 },
    ],
    'interval-graph': [{ name: 'n', defaultValue: 20, min: 2, max: 500 }],
    ladder: [{ name: 'n', defaultValue: 20, min: 2, max: 500 }],
    hypercube: [{ name: 'dimension', defaultValue: 4, min: 1, max: 10 }],
    complete: [{ name: 'n', defaultValue: 20, min: 2, max: 500 }],
    'small-vertex-cover': [
      { name: 'n', defaultValue: 20, min: 2, max: 500 },
      { name: 'coverSize', defaultValue: 5, min: 1, max: 20 },
    ],
    'small-cutwidth': [{ name: 'n', defaultValue: 20, min: 2, max: 500 }],
  };
  
  return defaults[type] || [];
}
