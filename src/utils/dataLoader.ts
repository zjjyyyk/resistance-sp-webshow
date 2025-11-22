/**
 * @fileoverview Data loader utility for loading datasets
 * @module utils/dataLoader
 */

import { logger } from './logger';
import { parseEdgeList, validateGraph } from './graphParser';
import type { ParsedGraph } from '@/types/graph';

export interface Dataset {
  name: string;
  displayName: string;
  description: string;
  nodes: number;
  edges: number;
  source: string;
  url: string;
  file: string;
}

/**
 * Get list of available datasets
 */
export function getAvailableDatasets(): Dataset[] {
  // Fetch metadata dynamically from public folder
  return [
    {
      name: "demo",
      displayName: "Demo Graph (30 B)",
      description: "A small demonstration graph with 4 nodes and 5 edges. Perfect for understanding PageRank algorithm basics.",
      nodes: 4,
      edges: 5,
      source: "Custom",
      url: "",
      file: "demo.txt"
    },
    {
      name: "dblp",
      displayName: "DBLP Co-authorship (1.7 KB)",
      description: "Collaboration network from the DBLP computer science bibliography. Nodes represent authors, edges represent co-authorship relationships.",
      nodes: 100,
      edges: 250,
      source: "Stanford SNAP",
      url: "https://snap.stanford.edu/data/com-DBLP.html",
      file: "dblp.txt"
    },
    {
      name: "email-enron",
      displayName: "Enron Email Network (1.3 KB)",
      description: "Email communication network from the Enron Corporation. Nodes represent email addresses, directed edges represent email exchanges.",
      nodes: 80,
      edges: 180,
      source: "Stanford SNAP",
      url: "https://snap.stanford.edu/data/email-Enron.html",
      file: "email-enron.txt"
    },
    {
      name: "astro",
      displayName: "Astrophysics Citations (2.0 KB)",
      description: "Citation network from the arXiv Astrophysics category. Nodes represent scientific papers, edges represent citations between papers.",
      nodes: 120,
      edges: 300,
      source: "Stanford SNAP",
      url: "https://snap.stanford.edu/data/ca-AstroPh.html",
      file: "astro.txt"
    },
    {
      name: "dblp-full",
      displayName: "DBLP Co-authorship (14.0 MB)",
      description: "Full DBLP collaboration network. Large dataset with over 300,000 nodes. Recommended to use WASM algorithms only.",
      nodes: 317080,
      edges: 1049866,
      source: "Stanford SNAP",
      url: "https://snap.stanford.edu/data/com-DBLP.html",
      file: "dblp-full.txt"
    }
  ];
}

/**
 * Load a built-in dataset by name
 * 
 * @param datasetName - Name of the dataset (e.g., 'dblp', 'email-enron', 'astro')
 * @returns Parsed undirected graph
 */
export async function loadDataset(datasetName: string): Promise<ParsedGraph> {
  logger.info('DataLoader', `Loading dataset: ${datasetName}`);
  logger.time(`DataLoader-${datasetName}`);

  const datasets = getAvailableDatasets();
  const dataset = datasets.find((d) => d.name === datasetName);
  
  if (!dataset) {
    throw new Error(`Dataset not found: ${datasetName}`);
  }

  try {
    // Load from public folder (works with base path)
    const basePath = import.meta.env.BASE_URL || '/';
    const response = await fetch(`${basePath}datasets/${dataset.file}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch dataset: ${response.statusText}`);
    }

    const content = await response.text();
    
    logger.info('DataLoader', `Loaded ${content.length} bytes from ${dataset.file}`);

    // All preset datasets are undirected
    const graph = parseEdgeList(content);
    validateGraph(graph);

    logger.timeEnd(`DataLoader-${datasetName}`);
    logger.info('DataLoader', `Successfully loaded dataset: ${datasetName}`, {
      nodes: graph.nodes,
      edges: graph.edges.length,
    });

    return graph;
  } catch (error) {
    logger.error('DataLoader', `Failed to load dataset: ${datasetName}`, error);
    throw error;
  }
}

/**
 * Load graph from uploaded file (always undirected)
 * 
 * @param file - File object from input
 * @returns Parsed undirected graph
 */
export async function loadFromFile(file: File): Promise<ParsedGraph> {
  logger.info('DataLoader', `Loading file: ${file.name}`, {
    size: file.size,
    type: file.type,
  });

  // Check file size (50MB limit)
  const MAX_SIZE = 50 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB (max 50MB)`);
  }

  logger.time('DataLoader-FileRead');

  try {
    const content = await file.text();
    logger.timeEnd('DataLoader-FileRead');

    logger.info('DataLoader', `Read ${content.length} bytes from file`);

    const graph = parseEdgeList(content);
    validateGraph(graph);

    logger.info('DataLoader', `Successfully parsed file: ${file.name}`, {
      nodes: graph.nodes,
      edges: graph.edges.length,
    });

    return graph;
  } catch (error) {
    logger.error('DataLoader', `Failed to parse file: ${file.name}`, error);
    throw error;
  }
}
