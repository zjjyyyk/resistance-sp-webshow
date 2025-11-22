/**
 * @fileoverview Synthetic graph generator selector component
 * @module components/SyntheticGraphSelector
 */

import { useState } from 'react';
import { Wand2 } from 'lucide-react';
import { logger } from '@/utils/logger';
import { generateSyntheticGraph, getGraphTypeParams } from '@/utils/graphGenerators';
import type { SyntheticGraphType, ParsedGraph } from '@/types/graph';

interface SyntheticGraphSelectorProps {
  onGraphGenerated: (graph: ParsedGraph) => void;
  disabled: boolean;
}

const GRAPH_TYPES: { value: SyntheticGraphType; label: string }[] = [
  { value: 'cycle', label: 'Cycle Graph' },
  { value: 'path', label: 'Path Graph' },
  { value: 'star', label: 'Star Graph' },
  { value: 'wheel', label: 'Wheel Graph' },
  { value: 'complete', label: 'Complete Graph' },
  { value: 'grid', label: 'Grid Graph' },
  { value: 'ladder', label: 'Ladder Graph' },
  { value: 'hypercube', label: 'Hypercube' },
  { value: 'random-tree', label: 'Random Tree' },
  { value: 'complete-bipartite', label: 'Complete Bipartite' },
  { value: 'planar', label: 'Planar Graph' },
  { value: 'matching', label: 'Matching Graph' },
  { value: 'lobster', label: 'Lobster Graph' },
  { value: 'caterpillar', label: 'Caterpillar Graph' },
  { value: 'quadrangulation', label: 'Quadrangulation' },
  { value: 'partial-k-tree', label: 'Partial k-tree' },
  { value: 'disk-intersection', label: 'Disk Intersection' },
  { value: 'interval-graph', label: 'Interval Graph' },
  { value: 'small-vertex-cover', label: 'Small Vertex Cover' },
  { value: 'small-cutwidth', label: 'Small Cutwidth' },
];

export function SyntheticGraphSelector({
  onGraphGenerated,
  disabled,
}: SyntheticGraphSelectorProps) {
  const [selectedType, setSelectedType] = useState<SyntheticGraphType>('cycle');
  const [params, setParams] = useState<Record<string, number>>({});

  // Update params when graph type changes
  const handleTypeChange = (type: SyntheticGraphType) => {
    setSelectedType(type);
    const paramDefs = getGraphTypeParams(type);
    const defaultParams: Record<string, number> = {};
    
    paramDefs.forEach((param) => {
      defaultParams[param.name] = param.defaultValue;
    });
    
    setParams(defaultParams);
    logger.info('UI', `Selected graph type: ${type}`, defaultParams);
  };

  const handleParamChange = (paramName: string, value: number) => {
    setParams((prev) => ({
      ...prev,
      [paramName]: value,
    }));
  };

  const handleGenerate = () => {
    try {
      logger.info('UI', 'Generating synthetic graph', {
        type: selectedType,
        params,
      });

      const graph = generateSyntheticGraph(selectedType, params);
      
      // Convert to ParsedGraph format
      const parsedGraph: ParsedGraph = {
        ...graph,
        wasOneBased: false,
        originalMaxNodeId: graph.nodes - 1,
      };

      onGraphGenerated(parsedGraph);
      logger.info('UI', 'Successfully generated graph', {
        nodes: graph.nodes,
        edges: graph.edges.length,
      });
    } catch (error) {
      logger.error('UI', 'Failed to generate graph', error);
      throw error;
    }
  };

  const paramDefs = getGraphTypeParams(selectedType);

  // Initialize params on first render
  if (Object.keys(params).length === 0 && paramDefs.length > 0) {
    const defaultParams: Record<string, number> = {};
    paramDefs.forEach((param) => {
      defaultParams[param.name] = param.defaultValue;
    });
    setParams(defaultParams);
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-300">Synthetic Graph Generator</h3>

      {/* Graph Type Selection */}
      <div className="space-y-2">
        <label className="block text-sm text-gray-400">Graph Type</label>
        <select
          value={selectedType}
          onChange={(e) => handleTypeChange(e.target.value as SyntheticGraphType)}
          className="input-field"
          disabled={disabled}
        >
          {GRAPH_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Parameters */}
      {paramDefs.length > 0 && (
        <div className="space-y-3">
          <label className="block text-sm text-gray-400">Parameters</label>
          {paramDefs.map((paramDef) => (
            <div key={paramDef.name} className="space-y-1">
              <label className="block text-xs text-gray-500">
                {paramDef.name}: <span className="text-white font-mono">{params[paramDef.name] || paramDef.defaultValue}</span>
              </label>
              <input
                type="number"
                min={paramDef.min}
                max={paramDef.max}
                step={paramDef.name.includes('Prob') || paramDef.name === 'radius' ? 0.01 : 1}
                value={params[paramDef.name] ?? paramDef.defaultValue}
                onChange={(e) => handleParamChange(paramDef.name, parseFloat(e.target.value))}
                className="input-field text-sm"
                disabled={disabled}
              />
            </div>
          ))}
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={disabled}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        <Wand2 className="w-4 h-4" />
        Generate Graph
      </button>
    </div>
  );
}
