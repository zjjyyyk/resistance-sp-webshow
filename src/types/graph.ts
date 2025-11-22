/**
 * @fileoverview Type definitions for graph data structures
 * @module types/graph
 */

/**
 * Represents an edge in the graph
 */
export interface Edge {
  source: number;
  target: number;
}

/**
 * Graph data structure
 */
export interface Graph {
  /** Number of nodes in the graph */
  nodes: number;
  /** Array of edges as [source, target] pairs */
  edges: Edge[];
  /** All graphs in this project are undirected */
  isDirected: false;
  /** Degree for each node (optional, computed on demand) */
  degree?: number[];
  /** Adjacency list representation (optional, computed on demand) */
  adjacencyList?: number[][];
}

/**
 * Parsed graph with metadata
 */
export interface ParsedGraph extends Graph {
  /** Whether node IDs were 1-based in the input (converted to 0-based) */
  wasOneBased: boolean;
  /** Original max node ID from the input */
  originalMaxNodeId: number;
}

/**
 * Dataset metadata
 */
export interface DatasetMetadata {
  name: string;
  description: string;
  nodes: number;
  edges: number;
  source: string;
}

/**
 * Synthetic graph type names
 */
export type SyntheticGraphType =
  | 'planar'
  | 'cycle'
  | 'path'
  | 'complete-bipartite'
  | 'star'
  | 'matching'
  | 'random-tree'
  | 'lobster'
  | 'caterpillar'
  | 'grid'
  | 'quadrangulation'
  | 'partial-k-tree'
  | 'wheel'
  | 'disk-intersection'
  | 'interval-graph'
  | 'ladder'
  | 'hypercube'
  | 'complete'
  | 'small-vertex-cover'
  | 'small-cutwidth';

/**
 * Parameters for synthetic graph generation
 */
export interface SyntheticGraphParams {
  type: SyntheticGraphType;
  params: Record<string, number>;
}
