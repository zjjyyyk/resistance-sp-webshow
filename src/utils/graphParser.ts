/**
 * @fileoverview Graph parser utility for edge list format
 * @module utils/graphParser
 * @author Resistance Distance Visualizer Team
 * 
 * Supports:
 * - Standard edge list format: "source target" per line
 * - Comment lines starting with #
 * - Optional first line with metadata: "n m" (node count, edge count)
 * - Auto-detection of 0-based or 1-based node IDs
 * - All graphs are undirected for resistance distance computation
 */

import { logger } from './logger';
import type { ParsedGraph, Edge } from '@/types/graph';

/**
 * Parse error class for graph parsing errors
 */
export class GraphParseError extends Error {
  constructor(message: string, public line?: number) {
    super(message);
    this.name = 'GraphParseError';
  }
}

/**
 * Parse edge list format into an undirected graph structure
 * 
 * @param content - Raw text content of the edge list file
 * @returns Parsed undirected graph with metadata
 * @throws GraphParseError if the format is invalid
 * 
 * @example
 * ```
 * const content = `
 * # Comment line
 * 3 3
 * 1 2
 * 2 3
 * 3 1
 * `;
 * const graph = parseEdgeList(content);
 * // graph.nodes === 3
 * // graph.edges.length === 6 (bidirectional)
 * ```
 */
export function parseEdgeList(content: string): ParsedGraph {
  logger.time('GraphParser-ParseEdgeList');
  logger.info('GraphParser', 'Starting to parse edge list (undirected graph)');

  const lines = content.split('\n').map((line) => line.trim());
  const edges: Edge[] = [];
  let declaredNodeCount: number | null = null;
  let declaredEdgeCount: number | null = null;
  let minNodeId = Infinity;
  let maxNodeId = -Infinity;
  let lineNumber = 0;
  let firstDataLineProcessed = false;

  for (const line of lines) {
    lineNumber++;

    // Skip empty lines
    if (line === '') continue;

    // Skip comment lines
    if (line.startsWith('#')) {
      logger.debug('GraphParser', `Skipping comment at line ${lineNumber}`, { line });
      continue;
    }

    // Parse the line
    const parts = line.split(/\s+/);

    // Check if this is the metadata line (first non-comment line with 2 numbers)
    // Format: "n m" where n = node count, m = edge count
    if (!firstDataLineProcessed && parts.length === 2) {
      const first = parseInt(parts[0], 10);
      const second = parseInt(parts[1], 10);

      if (!isNaN(first) && !isNaN(second) && first > 0 && second > 0) {
        // First non-comment line with two positive integers is treated as metadata
        declaredNodeCount = first;
        declaredEdgeCount = second;
        logger.info('GraphParser', 'Found metadata line', {
          nodes: declaredNodeCount,
          edges: declaredEdgeCount,
        });
        firstDataLineProcessed = true;
        continue;
      }
    }

    firstDataLineProcessed = true;

    // Parse edge - for undirected graph, we add both directions
    if (parts.length !== 2) {
      throw new GraphParseError(
        `Invalid edge format at line ${lineNumber}: expected 2 numbers, got ${parts.length}`,
        lineNumber
      );
    }

    const source = parseInt(parts[0], 10);
    const target = parseInt(parts[1], 10);

    if (isNaN(source) || isNaN(target)) {
      throw new GraphParseError(
        `Invalid node IDs at line ${lineNumber}: could not parse as integers`,
        lineNumber
      );
    }

    if (source < 0 || target < 0) {
      throw new GraphParseError(
        `Invalid node IDs at line ${lineNumber}: negative IDs not allowed`,
        lineNumber
      );
    }

    // Add both directions for undirected edge
    edges.push({ source, target });
    if (source !== target) {
      edges.push({ source: target, target: source });
    }
    
    minNodeId = Math.min(minNodeId, source, target);
    maxNodeId = Math.max(maxNodeId, source, target);
  }

  if (edges.length === 0) {
    throw new GraphParseError('No edges found in the file');
  }

  // Determine if IDs are 0-based or 1-based
  const wasOneBased = minNodeId === 1;
  logger.info('GraphParser', 'Detected node ID base', {
    minNodeId,
    maxNodeId,
    wasOneBased,
  });

  // Convert to 0-based if needed
  if (wasOneBased) {
    logger.info('GraphParser', 'Converting 1-based IDs to 0-based');
    edges.forEach((edge) => {
      edge.source--;
      edge.target--;
    });
    maxNodeId--;
  }

  // Calculate node count
  const nodeCount = maxNodeId + 1;

  // Validate against declared metadata if present
  if (declaredNodeCount !== null) {
    if (nodeCount !== declaredNodeCount) {
      logger.warn('GraphParser', 'Node count mismatch', {
        declared: declaredNodeCount,
        actual: nodeCount,
      });
    }
  }

  if (declaredEdgeCount !== null) {
    if (edges.length !== declaredEdgeCount) {
      logger.warn('GraphParser', 'Edge count mismatch', {
        declared: declaredEdgeCount,
        actual: edges.length,
      });
    }
  }

  const graph: ParsedGraph = {
    nodes: nodeCount,
    edges,
    isDirected: false, // Always undirected
    wasOneBased,
    originalMaxNodeId: wasOneBased ? maxNodeId + 1 : maxNodeId,
  };

  logger.info('GraphParser', 'Successfully parsed graph', {
    nodes: graph.nodes,
    edges: graph.edges.length,
    wasOneBased: graph.wasOneBased,
  });
  logger.timeEnd('GraphParser-ParseEdgeList');

  return graph;
}

/**
 * Compute degree for each node in the undirected graph
 * 
 * @param graph - The graph to compute degrees for
 * @returns Array of degrees indexed by node ID
 */
export function computeDegree(graph: ParsedGraph): number[] {
  const degree = new Array(graph.nodes).fill(0);

  for (const edge of graph.edges) {
    degree[edge.source]++;
  }

  return degree;
}

/**
 * Build adjacency list representation of the graph
 * 
 * @param graph - The graph to build adjacency list for
 * @returns Adjacency list where index is node and value is array of neighbors
 */
export function buildAdjacencyList(graph: ParsedGraph): number[][] {
  const adjacencyList: number[][] = Array.from({ length: graph.nodes }, () => []);

  for (const edge of graph.edges) {
    adjacencyList[edge.source].push(edge.target);
  }

  return adjacencyList;
}

/**
 * Find the node with maximum degree
 * 
 * @param graph - The graph to search
 * @returns Node ID with maximum degree
 */
export function findMaxDegreeNode(graph: ParsedGraph): number {
  const degree = computeDegree(graph);
  let maxNode = 0;
  let maxDeg = degree[0];
  
  for (let i = 1; i < graph.nodes; i++) {
    if (degree[i] > maxDeg) {
      maxDeg = degree[i];
      maxNode = i;
    }
  }
  
  logger.info('GraphParser', `Max degree node: ${maxNode} with degree ${maxDeg}`);
  return maxNode;
}

/**
 * Validate graph structure
 * 
 * @param graph - The graph to validate
 * @throws GraphParseError if the graph structure is invalid
 */
export function validateGraph(graph: ParsedGraph): void {
  if (graph.nodes <= 0) {
    throw new GraphParseError('Graph must have at least one node');
  }

  if (graph.edges.length === 0) {
    throw new GraphParseError('Graph must have at least one edge');
  }

  // Check for self-loops (optional warning)
  const selfLoops = graph.edges.filter((e) => e.source === e.target);
  if (selfLoops.length > 0) {
    logger.warn('GraphParser', `Found ${selfLoops.length} self-loop(s) in the graph`);
  }

  // Check for isolated nodes (nodes with degree 0)
  const degree = computeDegree(graph);
  const isolatedNodes = degree.filter((deg) => deg === 0).length;
  if (isolatedNodes > 0) {
    logger.warn(
      'GraphParser',
      `Found ${isolatedNodes} isolated node(s) with no edges`
    );
  }
}
