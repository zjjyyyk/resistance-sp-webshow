/**
 * @fileoverview Graph visualization component using Cytoscape.js with edit mode
 * @module components/GraphVisualizer
 */

import { useEffect, useRef, useState } from 'react';
import cytoscape, { Core, ElementDefinition, Position } from 'cytoscape';
import { Edit3, Save, X, RotateCcw, RotateCw } from 'lucide-react';
import { logger } from '@/utils/logger';
import type { ParsedGraph, Edge } from '@/types/graph';

interface GraphVisualizerProps {
  graph: ParsedGraph;
  s: number;
  t: number;
  v: number;
  onGraphChange?: (g: ParsedGraph) => void;
  isEditMode: boolean;
  setIsEditMode: (mode: boolean) => void;
}

interface EditHistory {
  edges: Edge[];
  timestamp: number;
}

export function GraphVisualizer({ graph, s, t, v, onGraphChange, isEditMode, setIsEditMode }: GraphVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const positionsRef = useRef<Record<string, Position>>({});
  const lastGraphRef = useRef<ParsedGraph | null>(null);
  
  // Edit mode state
  const [originalGraph, setOriginalGraph] = useState<ParsedGraph | null>(null);
  const [currentEdges, setCurrentEdges] = useState<Edge[]>([]);
  const [history, setHistory] = useState<EditHistory[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);

  // Detect graph change (new graph loaded) - exit edit mode and clear positions
  useEffect(() => {
    const graphChanged = lastGraphRef.current && (
      lastGraphRef.current.nodes !== graph.nodes  // Only clear on node count change
    );
    
    if (graphChanged) {
      // New graph loaded (different number of nodes) - exit edit mode and clear positions
      if (isEditMode) {
        setIsEditMode(false);
        setOriginalGraph(null);
        setSelectedNode(null);
        logger.info('GraphVisualizer', 'New graph loaded - exiting edit mode');
      }
      positionsRef.current = {};
      logger.info('GraphVisualizer', 'Cleared node positions for new graph');
    }
    
    lastGraphRef.current = graph;
  }, [graph, isEditMode, setIsEditMode]);

  // Initialize currentEdges from graph
  useEffect(() => {
    if (!isEditMode) {
      // Filter out invalid edges (nodes outside valid range)
      const validEdges = graph.edges.filter((e) => 
        e.source >= 0 && e.source < graph.nodes && 
        e.target >= 0 && e.target < graph.nodes
      );
      
      if (validEdges.length < graph.edges.length) {
        logger.warn('GraphVisualizer', 'Filtered out invalid edges', { 
          total: graph.edges.length, 
          valid: validEdges.length 
        });
      }
      
      setCurrentEdges([...validEdges]);
      setHistory([{ edges: [...validEdges], timestamp: Date.now() }]);
      setHistoryIndex(0);
      setSelectedNode(null);
    }
  }, [graph, isEditMode]);

  // Enter edit mode
  const handleEnterEditMode = () => {
    // Filter out invalid edges
    const validEdges = graph.edges.filter((e) => 
      e.source >= 0 && e.source < graph.nodes && 
      e.target >= 0 && e.target < graph.nodes
    );
    
    setOriginalGraph({ ...graph });
    setCurrentEdges([...validEdges]);
    setHistory([{ edges: [...validEdges], timestamp: Date.now() }]);
    setHistoryIndex(0);
    setSelectedNode(null);
    setIsEditMode(true);
    logger.info('GraphVisualizer', 'Entered edit mode');
  };

  // Save changes
  const handleSave = () => {
    if (onGraphChange && originalGraph) {
      const updatedGraph: ParsedGraph = {
        ...originalGraph,
        edges: [...currentEdges],
      };
      onGraphChange(updatedGraph);
      setIsEditMode(false);
      setOriginalGraph(null);
      logger.info('GraphVisualizer', 'Saved graph changes', { edges: currentEdges.length });
    }
  };

  // Cancel edit mode
  const handleCancel = () => {
    if (originalGraph) {
      // Restore original graph
      setCurrentEdges([...originalGraph.edges]);
      setIsEditMode(false);
      setOriginalGraph(null);
      setSelectedNode(null);
      logger.info('GraphVisualizer', 'Cancelled edit mode');
    }
  };

  // Add to history
  const addToHistory = (edges: Edge[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ edges: [...edges], timestamp: Date.now() });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentEdges([...history[newIndex].edges]);
      logger.info('GraphVisualizer', 'Undo', { historyIndex: newIndex });
    }
  };

  // Redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentEdges([...history[newIndex].edges]);
      logger.info('GraphVisualizer', 'Redo', { historyIndex: newIndex });
    }
  };

  // Delete edge
  const deleteEdge = (source: number, target: number) => {
    const newEdges = currentEdges.filter((e) => {
      return !((e.source === source && e.target === target) || (e.source === target && e.target === source));
    });
    setCurrentEdges(newEdges);
    addToHistory(newEdges);
    logger.info('GraphVisualizer', 'Deleted edge', { source, target });
  };

  // Add edge
  const addEdge = (source: number, target: number) => {
    // Check if edge already exists
    const exists = currentEdges.some((e) => {
      return (e.source === source && e.target === target) || (e.source === target && e.target === source);
    });
    
    if (!exists && source !== target) {
      const newEdges = [...currentEdges, { source, target }, { source: target, target: source }];
      setCurrentEdges(newEdges);
      addToHistory(newEdges);
      logger.info('GraphVisualizer', 'Added edge', { source, target });
      return true;
    }
    return false;
  };

  // Initialize Cytoscape instance
  useEffect(() => {
    if (!containerRef.current || graph.nodes > 100) return;

    logger.info('GraphVisualizer', 'Initializing graph visualization', {
      nodes: graph.nodes,
      edges: currentEdges.length,
      isEditMode,
    });

    // Save current positions if cytoscape exists
    if (cyRef.current) {
      cyRef.current.nodes().forEach((node) => {
        const id = node.data('id');
        positionsRef.current[id] = node.position();
      });
    }

    // Create nodes
    const nodes: ElementDefinition[] = [];
    for (let i = 0; i < graph.nodes; i++) {
      const nodeId = `${i}`;
      const savedPosition = positionsRef.current[nodeId];
      
      nodes.push({
        data: { id: nodeId, label: `${i}` },
        ...(savedPosition ? { position: savedPosition } : {}),
      });
    }

    // Create edges (remove duplicates for undirected graph)
    const edgeSet = new Set<string>();
    const edges: ElementDefinition[] = [];
    
    currentEdges.forEach((edge) => {
      // Validate edge node IDs are within valid range
      if (edge.source >= graph.nodes || edge.target >= graph.nodes || edge.source < 0 || edge.target < 0) {
        logger.warn('GraphVisualizer', 'Skipping invalid edge', { edge, maxNode: graph.nodes - 1 });
        return;
      }
      
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

    // Destroy existing instance
    if (cyRef.current) {
      cyRef.current.destroy();
    }

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
              if (id === selectedNode) return '#a855f7'; // purple for selected
              if (id === s) return '#22c55e';
              if (id === t) return '#ef4444';
              if (id === v) return '#f59e0b';
              return '#6366f1';
            },
            'border-color': (ele: any) => {
              const id = parseInt(ele.data('id'));
              if (id === selectedNode) return '#9333ea';
              if (id === s) return '#16a34a';
              if (id === t) return '#dc2626';
              if (id === v) return '#d97706';
              return '#4f46e5';
            },
            'border-width': (ele: any) => {
              const id = parseInt(ele.data('id'));
              return (id === s || id === t || id === v || id === selectedNode) ? '3px' : '2px';
            },
            'width': (ele: any) => {
              const id = parseInt(ele.data('id'));
              return (id === s || id === t || id === v || id === selectedNode) ? '35px' : '30px';
            },
            'height': (ele: any) => {
              const id = parseInt(ele.data('id'));
              return (id === s || id === t || id === v || id === selectedNode) ? '35px' : '30px';
            },
            'font-weight': (ele: any) => {
              const id = parseInt(ele.data('id'));
              return (id === s || id === t || id === v || id === selectedNode) ? 'bold' : 'normal';
            },
          },
        },
        // Highlight edges in edit mode
        {
          selector: 'edge',
          style: {
            'line-color': isEditMode ? '#ef4444' : '#94a3b8',
            'width': isEditMode ? 3 : 2,
          },
        },
      ],
      layout: {
        name: Object.keys(positionsRef.current).length > 0 ? 'preset' : 'cose',
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

    // Save initial positions after layout
    setTimeout(() => {
      if (cyRef.current) {
        cyRef.current.nodes().forEach((node) => {
          const id = node.data('id');
          positionsRef.current[id] = node.position();
        });
      }
    }, 100);

    // Edit mode interactions
    if (isEditMode) {
      // Click edge to delete
      cy.on('tap', 'edge', (evt) => {
        const ele = evt.target;
        const id = ele.data('id') as string;
        const parts = id.split('-');
        if (parts.length === 2) {
          const u = parseInt(parts[0], 10);
          const v = parseInt(parts[1], 10);
          deleteEdge(u, v);
        }
      });

      // Click node to select/add edge
      cy.on('tap', 'node', (evt) => {
        const ele = evt.target;
        const id = parseInt(ele.data('id'), 10);
        
        if (selectedNode === null) {
          // First node selection
          setSelectedNode(id);
        } else if (selectedNode === id) {
          // Deselect if clicking same node
          setSelectedNode(null);
        } else {
          // Second node - try to add edge
          if (addEdge(selectedNode, id)) {
            // Success - edge added
          }
          setSelectedNode(null);
        }
      });

      // Click background to deselect
      cy.on('tap', (evt) => {
        if (evt.target === cy) {
          setSelectedNode(null);
        }
      });
    }

    logger.info('GraphVisualizer', 'Graph visualization initialized');

    return () => {
      if (cyRef.current) {
        cyRef.current.removeAllListeners();
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [graph.nodes, currentEdges, isEditMode, selectedNode, s, t, v]);

  if (graph.nodes > 100) {
    return null;
  }

  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <div>
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
            {isEditMode && selectedNode !== null && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-purple-500 border-2 border-purple-600"></div>
                <span className="text-gray-400">Selected ({selectedNode})</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Edit Mode Controls */}
        <div className="flex gap-2">
          {!isEditMode ? (
            <button
              onClick={handleEnterEditMode}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="btn-secondary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Undo"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="btn-secondary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Redo"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancel}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </>
          )}
        </div>
      </div>

      {/* Edit Mode Instructions */}
      {isEditMode && (
        <div className="mb-3 bg-primary-900 border border-primary-700 p-3 rounded text-xs text-primary-200">
          <div className="font-semibold mb-1">Edit Mode Active:</div>
          <ul className="list-disc list-inside space-y-1">
            <li>Click an edge to delete it</li>
            <li>Click two nodes sequentially to add an edge between them</li>
            <li>Click a selected node again to deselect</li>
            <li>Save to apply changes or Cancel to discard</li>
          </ul>
        </div>
      )}

      <div
        ref={containerRef}
        className={`w-full bg-gray-800 rounded border ${isEditMode ? 'border-primary-500' : 'border-gray-700'}`}
        style={{ height: '400px' }}
      />
      
      <div className="flex justify-between items-center mt-2">
        <p className="text-xs text-gray-500">
          💡 Drag to pan, scroll to zoom
        </p>
        {isEditMode && (
          <p className="text-xs text-primary-400 font-medium">
            Edges: {currentEdges.filter((e, i, arr) => i === arr.findIndex(x => (x.source === e.source && x.target === e.target) || (x.source === e.target && x.target === e.source))).length}
          </p>
        )}
      </div>
    </div>
  );
}
