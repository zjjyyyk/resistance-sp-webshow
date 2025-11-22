/**
 * @fileoverview Parameter configuration panel component
 * @module components/ParameterPanel
 */

import { useState, useRef, useEffect } from 'react';
import { Upload, Trash2, Play, Loader2, StopCircle } from 'lucide-react';
import { logger } from '@/utils/logger';
import { loadDataset, loadFromFile, getAvailableDatasets } from '@/utils/dataLoader';
import { calculateErrorMetrics } from '@/utils/errorMetrics';
import { findMaxDegreeNode } from '@/utils/graphParser';
import { NodeSelector } from './NodeSelector';
import { SyntheticGraphSelector } from './SyntheticGraphSelector';
import type { ParsedGraph } from '@/types/graph';
import type { AlgorithmType, AlgorithmResultWithMetrics, PushVSpParams, AbwalkVSpParams } from '@/types/algorithm';

interface ParameterPanelProps {
  currentGraph: ParsedGraph | null;
  setCurrentGraph: (graph: ParsedGraph | null) => void;
  isComputing: boolean;
  setIsComputing: (computing: boolean) => void;
  results: AlgorithmResultWithMetrics[];
  setResults: (results: AlgorithmResultWithMetrics[]) => void;
  groundTruthId: string | null;
  s: number;
  setS: (value: number) => void;
  t: number;
  setT: (value: number) => void;
  v: number;
  setV: (value: number) => void;
  compute: (
    algorithm: AlgorithmType,
    graph: ParsedGraph,
    params: PushVSpParams | AbwalkVSpParams,
    callbacks: {
      onResult: (result: number, time: number) => void;
      onError: (error: string) => void;
      onProgress?: (progress: number, message?: string) => void;
    }
  ) => string;
  cancel: (taskId: string) => void;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export function ParameterPanel({
  currentGraph,
  setCurrentGraph,
  isComputing,
  setIsComputing,
  results,
  setResults,
  groundTruthId,
  s,
  setS,
  t,
  setT,
  v,
  setV,
  compute,
  cancel,
  showToast,
}: ParameterPanelProps) {
  const [dataSource, setDataSource] = useState<'preset' | 'synthetic' | 'upload'>('preset');
  const [selectedDataset, setSelectedDataset] = useState<string>('dblp');
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('push-v-sp-wasm');
  const [rmax, setRmax] = useState<number>(1e-6);
  const [times, setTimes] = useState<number>(10000);
  const [progress, setProgress] = useState<number>(0);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const datasets = getAvailableDatasets();

  // Timer for elapsed time display
  useEffect(() => {
    if (isComputing) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsedSeconds(elapsed);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setElapsedSeconds(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isComputing]);

  // Auto-load DBLP dataset on mount
  useEffect(() => {
    if (currentGraph !== null) {
      return;
    }

    const loadDefaultDataset = async () => {
      try {
        const graph = await loadDataset('dblp');
        setCurrentGraph(graph);
        const maxDegNode = findMaxDegreeNode(graph);
        setV(maxDegNode);
        showToast('success', `Auto-loaded dataset: dblp (${graph.nodes} nodes, ${graph.edges.length} edges)`);
      } catch (error) {
        logger.error('UI', 'Failed to auto-load default dataset', error);
      }
    };
    
    loadDefaultDataset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDatasetChange = async (datasetName: string) => {
    setSelectedDataset(datasetName);
    try {
      const graph = await loadDataset(datasetName);
      setCurrentGraph(graph);
      
      // Auto-select max degree node as v
      const maxDegNode = findMaxDegreeNode(graph);
      setV(maxDegNode);
      
      // Reset s and t to valid values
      setS(0);
      setT(Math.min(1, graph.nodes - 1));
      
      showToast('success', `Loaded dataset: ${datasetName} (${graph.nodes} nodes, ${graph.edges.length} edges)`);
    } catch (error) {
      logger.error('UI', 'Failed to load dataset', error);
      showToast('error', `Failed to load dataset: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const graph = await loadFromFile(file);
      setCurrentGraph(graph);
      setSelectedDataset(file.name);
      
      // Auto-select max degree node as v
      const maxDegNode = findMaxDegreeNode(graph);
      setV(maxDegNode);
      
      // Reset s and t to valid values
      setS(0);
      setT(Math.min(1, graph.nodes - 1));
      
      showToast('success', `Loaded file: ${file.name} (${graph.nodes} nodes, ${graph.edges.length} edges)`);
    } catch (error) {
      logger.error('UI', 'Failed to load file', error);
      showToast('error', `Failed to load file: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSyntheticGraphGenerated = (graph: ParsedGraph) => {
    setCurrentGraph(graph);
    setSelectedDataset('Synthetic Graph');
    
    // Auto-select max degree node as v
    const maxDegNode = findMaxDegreeNode(graph);
    setV(maxDegNode);
    
    // Reset s and t to valid values
    setS(0);
    setT(Math.min(1, graph.nodes - 1));
    
    showToast('success', `Generated synthetic graph (${graph.nodes} nodes, ${graph.edges.length} edges)`);
  };

  const handleCompute = () => {
    if (!currentGraph) {
      showToast('warning', 'Please load a dataset first');
      return;
    }

    // Validate node selections
    if (s < 0 || s >= currentGraph.nodes || t < 0 || t >= currentGraph.nodes || v < 0 || v >= currentGraph.nodes) {
      showToast('error', 'Invalid node selection. Nodes must be within valid range.');
      return;
    }

    setIsComputing(true);
    setProgress(0);

    const params = algorithm.includes('push-v-sp')
      ? { s, t, v, rmax }
      : { s, t, v, times };

    const taskId = compute(algorithm, currentGraph, params, {
      onResult: (result, time) => {
        // Find ground truth for error calculation
        const groundTruth = results.find((r) => r.id === groundTruthId);
        const metrics = groundTruth ? calculateErrorMetrics(result, groundTruth.resistanceDistance) : null;

        const newResult: AlgorithmResultWithMetrics = {
          id: `result-${Date.now()}`,
          algorithm,
          dataset: selectedDataset,
          params,
          resistanceDistance: result,
          executionTime: time,
          timestamp: Date.now(),
          isGroundTruth: false,
          metrics,
          isCollapsed: false,
          isPinned: false,
        };

        // Collapse all existing unpinned results
        const updatedResults = results.map(r => ({
          ...r,
          isCollapsed: r.isPinned ? r.isCollapsed : true,
        }));

        setResults([...updatedResults, newResult]);
        setIsComputing(false);
        setProgress(0);
        setCurrentTaskId(null);
        showToast('success', `Computation completed in ${time.toFixed(2)}ms`);
      },
      onError: (error) => {
        setIsComputing(false);
        setProgress(0);
        setCurrentTaskId(null);
        showToast('error', `Computation failed: ${error}`);
      },
      onProgress: (prog) => {
        setProgress(prog);
      },
    });
    
    setCurrentTaskId(taskId);
  };

  const handleStop = () => {
    if (currentTaskId) {
      cancel(currentTaskId);
      setIsComputing(false);
      setProgress(0);
      setCurrentTaskId(null);
      showToast('info', 'Computation stopped');
    }
  };

  const handleClearResults = () => {
    const groundTruthResults = results.filter(r => r.id === groundTruthId);
    setResults(groundTruthResults);
    
    const clearedCount = results.length - groundTruthResults.length;
    if (clearedCount > 0) {
      showToast('info', `Cleared ${clearedCount} result(s)${groundTruthResults.length > 0 ? ', kept ground truth' : ''}`);
    } else {
      showToast('info', 'No results to clear');
    }
  };

  return (
    <div className="card space-y-6">
      <h2 className="text-xl font-bold text-primary-400">Parameters</h2>

      {/* Data Source Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Data Source</label>
        <div className="space-y-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="dataSource"
              value="preset"
              checked={dataSource === 'preset'}
              onChange={(e) => setDataSource(e.target.value as 'preset')}
              className="w-4 h-4 text-primary-600"
              disabled={isComputing}
            />
            <span className="text-sm">Preset Dataset</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="dataSource"
              value="synthetic"
              checked={dataSource === 'synthetic'}
              onChange={(e) => setDataSource(e.target.value as 'synthetic')}
              className="w-4 h-4 text-primary-600"
              disabled={isComputing}
            />
            <span className="text-sm">Synthetic Graph</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="dataSource"
              value="upload"
              checked={dataSource === 'upload'}
              onChange={(e) => setDataSource(e.target.value as 'upload')}
              className="w-4 h-4 text-primary-600"
              disabled={isComputing}
            />
            <span className="text-sm">Upload File</span>
          </label>
        </div>
      </div>

      {/* Preset Dataset Selection */}
      {dataSource === 'preset' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">Choose Dataset</label>
          <div className="space-y-2">
            {datasets.map((dataset) => (
              <label key={dataset.name} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="dataset"
                  value={dataset.name}
                  checked={selectedDataset === dataset.name}
                  onChange={(e) => handleDatasetChange(e.target.value)}
                  className="w-4 h-4 text-primary-600"
                  disabled={isComputing}
                />
                <span className="text-sm">{dataset.displayName}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Synthetic Graph Generator */}
      {dataSource === 'synthetic' && (
        <SyntheticGraphSelector
          onGraphGenerated={handleSyntheticGraphGenerated}
          disabled={isComputing}
        />
      )}

      {/* File Upload */}
      {dataSource === 'upload' && (
        <div className="space-y-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isComputing}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload Custom File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.edgelist"
            onChange={handleFileUpload}
            className="hidden"
          />
          <p className="text-xs text-gray-400">
            Upload edge list format (one edge per line: "source target")
          </p>
        </div>
      )}

      {/* Current Graph Info */}
      {currentGraph && (
        <div className="space-y-2">
          {/* Graph Visualization Hint */}
          {currentGraph.nodes <= 100 ? (
            <div className="bg-primary-900 border border-primary-700 p-2 rounded text-xs text-primary-200">
              💡 Graph visualization enabled (≤100 nodes)
            </div>
          ) : (
            <div className="bg-gray-700 border border-gray-600 p-2 rounded text-xs text-gray-400">
              ℹ️ Graph visualization available for graphs with ≤100 nodes
            </div>
          )}
          
          <div className="bg-gray-700 p-3 rounded text-sm space-y-1">
            <p className="text-gray-300">
              <span className="font-medium">Dataset:</span> {selectedDataset}
            </p>
            <p className="text-gray-300">
              <span className="font-medium">Nodes:</span> {currentGraph.nodes.toLocaleString()}
            </p>
            <p className="text-gray-300">
              <span className="font-medium">Edges:</span> {currentGraph.edges.length.toLocaleString()}
            </p>
            <p className="text-gray-300">
              <span className="font-medium">Type:</span> Undirected
            </p>
          </div>
        </div>
      )}

      {/* Node Selection */}
      <NodeSelector
        graph={currentGraph}
        s={s}
        setS={setS}
        t={t}
        setT={setT}
        v={v}
        setV={setV}
        disabled={isComputing}
      />

      {/* Algorithm Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Algorithm</label>
        <select
          value={algorithm}
          onChange={(e) => setAlgorithm(e.target.value as AlgorithmType)}
          className="input-field"
          disabled={isComputing}
        >
          <option value="push-v-sp-js">Push_v_sp (JavaScript)</option>
          <option value="push-v-sp-wasm">Push_v_sp (WebAssembly)</option>
          <option value="abwalk-v-sp-js">Abwalk_v_sp (JavaScript)</option>
          <option value="abwalk-v-sp-wasm">Abwalk_v_sp (WebAssembly)</option>
        </select>
      </div>

      {/* Algorithm Parameters */}
      {algorithm.includes('push-v-sp') ? (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            rmax (Residual Threshold): {rmax.toExponential(2)}
          </label>
          <input
            type="range"
            min="-10"
            max="-2"
            step="0.1"
            value={Math.log10(rmax)}
            onChange={(e) => setRmax(Math.pow(10, parseFloat(e.target.value)))}
            className="w-full"
            disabled={isComputing}
          />
          <input
            type="number"
            min="1e-10"
            max="1e-2"
            step="1e-7"
            value={rmax}
            onChange={(e) => setRmax(parseFloat(e.target.value))}
            className="input-field"
            disabled={isComputing}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            Times (Random Walks): {times.toLocaleString()}
          </label>
          <input
            type="range"
            min="100"
            max="100000"
            step="100"
            value={times}
            onChange={(e) => setTimes(parseInt(e.target.value))}
            className="w-full"
            disabled={isComputing}
          />
          <input
            type="number"
            min="100"
            max="1000000"
            step="100"
            value={times}
            onChange={(e) => setTimes(parseInt(e.target.value))}
            className="input-field"
            disabled={isComputing}
          />
        </div>
      )}

      {/* Progress Bar */}
      {isComputing && progress > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={handleCompute}
          disabled={!currentGraph || isComputing}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {isComputing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Computing...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Compute Resistance Distance
            </>
          )}
        </button>

        <button
          onClick={handleStop}
          disabled={!isComputing}
          className="btn-secondary w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700"
        >
          <StopCircle className="w-4 h-4" />
          Stop {isComputing && `(${elapsedSeconds} sec)`}
        </button>

        <button
          onClick={handleClearResults}
          disabled={results.length === 0 || isComputing}
          className="btn-secondary w-full flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Clear All Results (except Ground Truth)
        </button>
      </div>
    </div>
  );
}
