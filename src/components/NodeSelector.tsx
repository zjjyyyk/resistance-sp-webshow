/**
 * @fileoverview Node selector component for s, t, v nodes
 * @module components/NodeSelector
 */

import { useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { logger } from '@/utils/logger';
import { computeDegree } from '@/utils/graphParser';
import type { ParsedGraph } from '@/types/graph';

interface NodeSelectorProps {
  graph: ParsedGraph | null;
  s: number;
  setS: (value: number) => void;
  t: number;
  setT: (value: number) => void;
  v: number;
  setV: (value: number) => void;
  disabled: boolean;
}

export function NodeSelector({
  graph,
  s,
  setS,
  t,
  setT,
  v,
  setV,
  disabled,
}: NodeSelectorProps) {
  const maxNode = graph ? graph.nodes - 1 : 0;
  const degrees = graph ? computeDegree(graph) : [];

  // Auto-select v on graph load
  useEffect(() => {
    if (graph) {
      handleAutoSelectV();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph?.nodes]); // Only run when graph changes

  const handleAutoSelectV = () => {
    if (!graph) return;

    const degrees = computeDegree(graph);
    let maxDegNode = 0;
    let maxDeg = degrees[0];

    for (let i = 1; i < graph.nodes; i++) {
      if (degrees[i] > maxDeg) {
        maxDeg = degrees[i];
        maxDegNode = i;
      }
    }

    setV(maxDegNode);
    logger.info('UI', `Auto-selected landmark node v=${maxDegNode} with degree ${maxDeg}`);
  };

  const validateNode = (value: number, setter: (v: number) => void) => {
    if (value < 0) {
      setter(0);
    } else if (value > maxNode) {
      setter(maxNode);
    } else {
      setter(value);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-300">Node Selection</h3>

      {/* Source and Target Nodes (s, t) */}
      <div className="grid grid-cols-2 gap-4">
        {/* Source Node (s) */}
        <div className="space-y-2">
          <label className="block text-sm text-gray-400">
            Source Node (s): <span className="text-white font-mono">{s}</span>
          </label>
          <input
            type="number"
            min="0"
            max={maxNode}
            value={s}
            onChange={(e) => validateNode(parseInt(e.target.value) || 0, setS)}
            className="input-field"
            disabled={disabled || !graph}
          />
          {graph && (
            <p className="text-xs text-gray-500">
              Range: 0-{maxNode}
            </p>
          )}
        </div>

        {/* Target Node (t) */}
        <div className="space-y-2">
          <label className="block text-sm text-gray-400">
            Target Node (t): <span className="text-white font-mono">{t}</span>
          </label>
          <input
            type="number"
            min="0"
            max={maxNode}
            value={t}
            onChange={(e) => validateNode(parseInt(e.target.value) || 0, setT)}
            className="input-field"
            disabled={disabled || !graph}
          />
          {graph && (
            <p className="text-xs text-gray-500">
              Range: 0-{maxNode}
            </p>
          )}
        </div>
      </div>

      {/* Landmark Node (v) */}
      <div className="space-y-2">
        <label className="block text-sm text-gray-400">
          Landmark Node (v): <span className="text-white font-mono">{v}</span>
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            max={maxNode}
            value={v}
            onChange={(e) => validateNode(parseInt(e.target.value) || 0, setV)}
            className="input-field flex-1"
            disabled={disabled || !graph}
          />
          <button
            onClick={handleAutoSelectV}
            disabled={disabled || !graph}
            className="btn-secondary flex items-center gap-2 px-4"
            title="Auto-select node with maximum degree"
          >
            <Sparkles className="w-4 h-4" />
            Auto
          </button>
        </div>
        {graph && (
          <div className="text-xs space-y-1">
            <p className="text-gray-500">Valid range: 0 to {maxNode}</p>
            <p className="text-primary-400">
              Degree of v: <span className="font-mono">{degrees[v] || 0}</span>
            </p>
          </div>
        )}
      </div>

      {!graph && (
        <p className="text-sm text-gray-500 italic">
          Load a dataset to select nodes
        </p>
      )}
    </div>
  );
}
