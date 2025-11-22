/**
 * @fileoverview Graph visualization component using Cytoscape.js
 * @module components/GraphVisualizer
 */

import { useEffect, useRef } from 'react';
import cytoscape, { Core, ElementDefinition } from 'cytoscape';
import { logger } from '@/utils/logger';
import type { ParsedGraph } from '@/types/graph';

interface GraphVisualizerProps {
  graph: ParsedGraph;
  s: number;
  t: number;
  v: number;
}

export function GraphVisualizer({ graph, s, t, v }: GraphVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  // Initialize Cytoscape instance
  useEffect(() => {
    if (!containerRef.current || graph.nodes > 100) return;

    logger.info('GraphVisualizer', 'Initializing graph visualization', {
      nodes: graph.nodes,
      edges: graph.edges.length,
    });

    // Create nodes
    const nodes: ElementDefinition[] = [];
    for (let i = 0; i < graph.nodes; i++) {
      nodes.push({
        data: { id: `${i}`, label: `${i}` },
      });
    }

    // Create edges (remove duplicates for undirected graph)
    const edgeSet = new Set<string>();
    const edges: ElementDefinition[] = [];
    
    graph.edges.forEach((edge) => {
      const edgeId1 = `${edge.source}-${edge.target}`;
      const edgeId2 = `${edge.target}-${edge.source}`;
      
      if (!edgeSet.has(edgeId1) && !edgeSet.has(edgeId2)) {
        edgeSet.add(edgeId1);
        edges.push({
          data: {
            id: edgeId1,
            source: `${edge.source}`,
            target: `${edge.target}`,
          },
        });
      }
    });

    // Initialize Cytoscape
    const cy = cytoscape({
      container: containerRef.current,
      elements: [...nodes, ...edges],
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#6366f1',
            'label': 'data(label)',
            'color': '#fff',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '12px',
            'width': '30px',
            'height': '30px',
            'border-width': '2px',
            'border-color': '#4f46e5',
          },
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#94a3b8',
            'curve-style': 'bezier',
          },
        },
        // Highlight special nodes (s, t, v)
        {
          selector: 'node',
          style: {
            'background-color': (ele: any) => {
              const id = parseInt(ele.data('id'));
              if (id === s) return '#22c55e';
              if (id === t) return '#ef4444';
              if (id === v) return '#f59e0b';
              return '#6366f1';
            },
            'border-color': (ele: any) => {
              const id = parseInt(ele.data('id'));
              if (id === s) return '#16a34a';
              if (id === t) return '#dc2626';
              if (id === v) return '#d97706';
              return '#4f46e5';
            },
            'border-width': (ele: any) => {
              const id = parseInt(ele.data('id'));
              return (id === s || id === t || id === v) ? '3px' : '2px';
            },
            'width': (ele: any) => {
              const id = parseInt(ele.data('id'));
              return (id === s || id === t || id === v) ? '35px' : '30px';
            },
            'height': (ele: any) => {
              const id = parseInt(ele.data('id'));
              return (id === s || id === t || id === v) ? '35px' : '30px';
            },
            'font-weight': (ele: any) => {
              const id = parseInt(ele.data('id'));
              return (id === s || id === t || id === v) ? 'bold' : 'normal';
            },
          },
        },
      ],
      layout: {
        name: 'cose',
        animate: false,
        nodeDimensionsIncludeLabels: true,
        idealEdgeLength: 60,
        nodeRepulsion: 8000,
        gravity: 0.1,
      },
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
    });

    cyRef.current = cy;

    logger.info('GraphVisualizer', 'Graph visualization initialized');

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [graph]);

  // Update node styles when s, t, v change (without redrawing)
  useEffect(() => {
    if (!cyRef.current) return;

    logger.info('GraphVisualizer', 'Updating highlighted nodes', { s, t, v });

    // Force style recalculation
    cyRef.current.nodes().style({
      'background-color': (ele: any) => {
        const id = parseInt(ele.data('id'));
        if (id === s) return '#22c55e';
        if (id === t) return '#ef4444';
        if (id === v) return '#f59e0b';
        return '#6366f1';
      },
      'border-color': (ele: any) => {
        const id = parseInt(ele.data('id'));
        if (id === s) return '#16a34a';
        if (id === t) return '#dc2626';
        if (id === v) return '#d97706';
        return '#4f46e5';
      },
      'border-width': (ele: any) => {
        const id = parseInt(ele.data('id'));
        return (id === s || id === t || id === v) ? '3px' : '2px';
      },
      'width': (ele: any) => {
        const id = parseInt(ele.data('id'));
        return (id === s || id === t || id === v) ? '35px' : '30px';
      },
      'height': (ele: any) => {
        const id = parseInt(ele.data('id'));
        return (id === s || id === t || id === v) ? '35px' : '30px';
      },
      'font-weight': (ele: any) => {
        const id = parseInt(ele.data('id'));
        return (id === s || id === t || id === v) ? 'bold' : 'normal';
      },
    });
  }, [s, t, v]);

  if (graph.nodes > 100) {
    return null;
  }

  return (
    <div className="card">
      <div className="mb-3">
        <h2 className="text-xl font-bold text-primary-400 mb-2">Graph Visualizer</h2>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-green-600"></div>
            <span className="text-gray-400">Source (s={s})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-red-600"></div>
            <span className="text-gray-400">Target (t={t})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-amber-600"></div>
            <span className="text-gray-400">Landmark (v={v})</span>
          </div>
        </div>
      </div>
      <div
        ref={containerRef}
        className="w-full bg-gray-800 rounded border border-gray-700"
        style={{ height: '400px' }}
      />
      <p className="text-xs text-gray-500 mt-2">
        💡 Drag to pan, scroll to zoom
      </p>
    </div>
  );
}
