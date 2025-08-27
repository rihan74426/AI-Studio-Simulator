import React from 'react';
import { History, Trash2 } from 'lucide-react';
import { GenerationPreview } from './GenerationPreview';
import { clearHistory } from '../utils/storageUtils';
import type { Generation } from '../types';

interface GenerationHistoryProps {
  history: Generation[];
  onSelectGeneration: (generation: Generation) => void;
  onHistoryUpdate: () => void;
}

export const GenerationHistory: React.FC<GenerationHistoryProps> = ({
  history,
  onSelectGeneration,
  onHistoryUpdate
}) => {
  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all history?')) {
      clearHistory();
      onHistoryUpdate();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, generation: Generation) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectGeneration(generation);
    }
  };

  if (history.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
        <History className="h-12 w-12 text-gray-600 mx-auto mb-4" aria-hidden="true" />
        <h3 className="text-lg font-medium text-white mb-2">No history yet</h3>
        <p className="text-gray-400">Your generated images will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-white" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-white">Recent Generations</h2>
          <span className="text-sm text-gray-400" aria-label={`${history.length} of 5 items`}>
            ({history.length}/5)
          </span>
        </div>
        
        <button
          onClick={handleClearHistory}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium 
                   text-red-400 hover:text-red-300 border border-red-500/30 
                   hover:border-red-500/50 rounded-lg transition-colors
                   focus:outline-none focus:ring-2 focus:ring-red-500/50
                   focus:ring-offset-2 focus:ring-offset-gray-900"
          aria-label="Clear all history"
        >
          <Trash2 className="h-3 w-3" aria-hidden="true" />
          Clear
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="list">
        {history.map((generation, index) => (
          <div
            key={generation.id}
            role="listitem"
            className="text-left transform transition-transform hover:scale-105 
                     focus-within:scale-105 rounded-xl"
          >
            <button
              onClick={() => onSelectGeneration(generation)}
              onKeyDown={(e) => handleKeyDown(e, generation)}
              className="w-full text-left focus:outline-none focus:ring-2 focus:ring-purple-500 
                       focus:ring-offset-2 focus:ring-offset-gray-900 rounded-xl"
              aria-label={`View generation ${index + 1}: ${generation.prompt}`}
            >
              <GenerationPreview generation={generation} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};