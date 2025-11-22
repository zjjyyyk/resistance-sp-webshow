/**
 * @fileoverview Results display panel component
 * @module components/ResultsPanel
 */

import { Star, Trash2, ChevronDown, ChevronUp, Pin, PinOff } from 'lucide-react';
import type { AlgorithmResultWithMetrics } from '@/types/algorithm';

interface ResultsPanelProps {
  results: AlgorithmResultWithMetrics[];
  setResults: (results: AlgorithmResultWithMetrics[]) => void;
  groundTruthId: string | null;
  setGroundTruthId: (id: string | null) => void;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

const algorithmNames: Record<string, string> = {
  'push-v-sp-js': 'Push_v_sp (JavaScript)',
  'push-v-sp-wasm': 'Push_v_sp (WebAssembly)',
  'abwalk-v-sp-js': 'Abwalk_v_sp (JavaScript)',
  'abwalk-v-sp-wasm': 'Abwalk_v_sp (WebAssembly)',
};

export function ResultsPanel({
  results,
  setResults,
  groundTruthId,
  setGroundTruthId,
  showToast,
}: ResultsPanelProps) {
  const handleSetGroundTruth = (id: string) => {
    if (groundTruthId === id) {
      // Clear ground truth
      setGroundTruthId(null);
      showToast('info', 'Ground truth cleared');
    } else {
      // Set new ground truth
      setGroundTruthId(id);
      
      // Move ground truth to top, pin it, and expand it
      const targetIndex = results.findIndex(r => r.id === id);
      if (targetIndex !== -1) {
        const newResults = [...results];
        const [target] = newResults.splice(targetIndex, 1);
        
        // Pin and expand the ground truth
        target.isPinned = true;
        target.isCollapsed = false;
        
        // Insert at the beginning
        newResults.unshift(target);
        setResults(newResults);
      }
      
      showToast('success', 'Ground truth set and pinned');
    }
  };

  const handleDeleteResult = (id: string) => {
    setResults(results.filter((r) => r.id !== id));
    if (groundTruthId === id) {
      setGroundTruthId(null);
    }
    showToast('info', 'Result deleted');
  };

  const handleToggleCollapse = (id: string) => {
    setResults(results.map(r => 
      r.id === id ? { ...r, isCollapsed: !r.isCollapsed } : r
    ));
  };

  const handleTogglePin = (id: string) => {
    setResults(results.map(r => 
      r.id === id ? { ...r, isPinned: !r.isPinned } : r
    ));
  };

  if (results.length === 0) {
    return (
      <div className="card h-full flex items-center justify-center">
        <div className="text-center text-gray-400">
          <p className="text-lg mb-2">No results yet</p>
          <p className="text-sm">Configure parameters and click "Compute Resistance Distance" to see results</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
      <h2 className="text-xl font-bold text-primary-400 sticky top-0 bg-gray-900 pb-2">
        Results ({results.length})
      </h2>

      {results.map((result) => {
        const isGroundTruth = result.id === groundTruthId;
        const isCollapsed = result.isCollapsed ?? false;
        const isPinned = result.isPinned ?? false;

        return (
          <div
            key={result.id}
            className={`card ${isGroundTruth ? 'card-ground-truth' : ''}`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-primary-300">
                    {algorithmNames[result.algorithm]}
                  </h3>
                  {isPinned && (
                    <Pin className="w-4 h-4 text-yellow-500 fill-current" />
                  )}
                </div>
                <p className="text-sm text-gray-400">
                  Dataset: {result.dataset}
                </p>
                <p className="text-xs text-gray-500">
                  Nodes: s={result.params.s}, t={result.params.t}, v={result.params.v}
                </p>
                {result.algorithm.includes('push-v-sp') && 'rmax' in result.params && (
                  <p className="text-xs text-gray-500">
                    rmax: {result.params.rmax.toExponential(2)}
                  </p>
                )}
                {result.algorithm.includes('abwalk-v-sp') && 'times' in result.params && (
                  <p className="text-xs text-gray-500">
                    Random walks: {result.params.times.toLocaleString()}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isGroundTruth && (
                  <span className="flex items-center gap-1 text-yellow-500 text-sm font-medium">
                    <Star className="w-4 h-4 fill-current" />
                    Ground Truth
                  </span>
                )}
                <button
                  onClick={() => handleTogglePin(result.id)}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                  title={isPinned ? 'Unpin' : 'Pin'}
                >
                  {isPinned ? (
                    <PinOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Pin className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                <button
                  onClick={() => handleToggleCollapse(result.id)}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                  title={isCollapsed ? 'Expand' : 'Collapse'}
                >
                  {isCollapsed ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Execution Time - Always visible */}
            <div className="mb-3">
              <p className="text-sm">
                <span className="text-gray-400">⏱️ Execution Time:</span>{' '}
                <span className="font-medium text-white">
                  {result.executionTime.toFixed(2)}ms
                </span>
              </p>
            </div>

            {/* Collapsible Content */}
            {!isCollapsed && (
              <>
                {/* Resistance Distance */}
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-300 mb-2">📊 Resistance Distance:</p>
                  <div className="bg-gray-700 rounded p-3 text-center">
                    <span className="text-2xl font-mono text-primary-300">
                      {result.resistanceDistance.toExponential(6)}
                    </span>
                  </div>
                </div>

                {/* Error Metrics */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-300 mb-2">📏 Error Metrics:</p>
                  {result.metrics ? (
                    <div className="bg-gray-700 rounded p-2 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Absolute Error:</span>
                        <span className="text-white font-mono">
                          {result.metrics.absolute.toExponential(3)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Relative Error:</span>
                        <span className="text-white font-mono">
                          {(result.metrics.relative * 100).toFixed(4)}%
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-700 rounded p-2 text-xs text-gray-400 italic">
                      N/A - Please set a Ground Truth to calculate errors
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Action Buttons - Always visible */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleSetGroundTruth(result.id)}
                className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  isGroundTruth
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                <Star className={`w-4 h-4 inline mr-1 ${isGroundTruth ? 'fill-current' : ''}`} />
                {isGroundTruth ? 'Clear Ground Truth' : 'Set as Ground Truth'}
              </button>
              <button
                onClick={() => handleDeleteResult(result.id)}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
