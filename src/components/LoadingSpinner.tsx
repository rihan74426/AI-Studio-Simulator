import React from 'react';
import { Loader2, StopCircle } from 'lucide-react';

interface LoadingSpinnerProps {
  onAbort?: () => void;
  message?: string;
  currentAttempt?: number;
  maxAttempts?: number;
  currentAttempt?: number;
  maxAttempts?: number;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  onAbort,
  message = "Generating your styled image...",
  currentAttempt,
  maxAttempts
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4" role="status" aria-live="polite" aria-busy="true">
      <div className="relative">
        {/* Outer rotating ring */}
        <div className="w-16 h-16 border-4 border-gray-700 border-t-purple-500 rounded-full animate-spin" />
        
        {/* Inner pulsing dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
        </div>
      </div>
      
      <div className="text-center space-y-2">
        <p className="text-white font-medium">{message}</p>
        {maxAttempts && currentAttempt && maxAttempts > 1 && (
          <p className="text-sm text-gray-400">
            Attempt {currentAttempt} of {maxAttempts}
          </p>
        )}
        <p className="text-sm text-gray-400">This may take a few seconds</p>
      </div>

      {onAbort && (
        <button
          onClick={onAbort}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-400 
                   hover:text-red-300 border border-red-500/30 hover:border-red-500/50 
                   rounded-lg transition-colors focus:outline-none focus:ring-2 
                   focus:ring-red-500/50 focus:ring-offset-2 focus:ring-offset-gray-900"
          aria-label="Cancel generation"
        >
          <StopCircle className="h-4 w-4" />
          Cancel
        </button>
      )}
    </div>
  );
};