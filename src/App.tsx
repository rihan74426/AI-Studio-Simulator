import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Wand2, Sparkles, AlertTriangle } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FileUpload } from './components/FileUpload';
import { PromptInput } from './components/PromptInput';
import { StyleSelector } from './components/StyleSelector';
import { LoadingSpinner } from './components/LoadingSpinner';
import { GenerationPreview } from './components/GenerationPreview';
import { GenerationHistory } from './components/GenerationHistory';
import { GenerationSummary } from './components/GenerationSummary';
import { mockApiCall, retryWithBackoff } from './utils/apiUtils';
import { saveGeneration, getHistory } from './utils/storageUtils';
import type { AppState, Generation, StyleOption, ApiRequest } from './types';

function App() {
  const [state, setState] = useState<AppState>({
    uploadedImage: null,
    prompt: '',
    style: 'Editorial',
    isLoading: false,
    error: null,
    currentGeneration: null,
    abortController: null
  });

  const [history, setHistory] = useState<Generation[]>([]);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const mounted = useRef(true);

  // Load history on mount
  useEffect(() => {
    setHistory(getHistory());
    return () => {
      mounted.current = false;
    };
  }, []);

  // Load history on mount
  useEffect(() => {
    setHistory(getHistory());
    return () => {
      mounted.current = false;
    };
  }, []);

  const updateState = useCallback((updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleImageUpload = useCallback((dataUrl: string) => {
    updateState({ uploadedImage: dataUrl, error: null });
  }, [updateState]);

  const handleRemoveImage = useCallback(() => {
    updateState({ uploadedImage: null });
  }, [updateState]);

  const handlePromptChange = useCallback((prompt: string) => {
    updateState({ prompt });
  }, [updateState]);

  const handleStyleChange = useCallback((style: StyleOption) => {
    updateState({ style });
  }, [updateState]);

  const handleAbort = useCallback(() => {
    if (state.abortController) {
      state.abortController.abort();
      updateState({ 
        isLoading: false, 
        abortController: null,
        error: 'Generation cancelled by user' 
      });
      setRetryAttempt(0);
    }
  }, [state.abortController, updateState]);

  const handleGenerate = useCallback(async () => {
    if (!state.uploadedImage || !state.prompt.trim() || state.isLoading) return;

    const abortController = new AbortController();
    updateState({ 
      isLoading: true, 
      error: null, 
      currentGeneration: null,
      abortController 
    });
    setRetryAttempt(0);

    const request: ApiRequest = {
      imageDataUrl: state.uploadedImage,
      prompt: state.prompt.trim(),
      style: state.style
    };

    try {
      const result = await retryWithBackoff(
        () => {
          setRetryAttempt(prev => prev + 1);
          return mockApiCall(request, abortController.signal);
        },
        3,
        500,
        100
      );

      if (!mounted.current || abortController.signal.aborted) return;

      const generation: Generation = {
        id: result.id,
        imageUrl: result.imageUrl,
        prompt: result.prompt,
        style: result.style,
        createdAt: result.createdAt
      };

      saveGeneration(generation);
      setHistory(getHistory());
      
      saveGeneration(generation);
      setHistory(getHistory());
      
      updateState({ 
        currentGeneration: generation,
        isLoading: false,
        abortController: null,
        error: null
      });
      setRetryAttempt(0);
    } catch (error) {
      if (!mounted.current || abortController.signal.aborted) return;

      const errorMessage = error instanceof Error ? error.message : 'Generation failed';
      updateState({ 
        isLoading: false, 
        abortController: null,
        error: errorMessage
      });
      setRetryAttempt(0);
    }
  }, [state.uploadedImage, state.prompt, state.style, state.isLoading, updateState]);

  const handleSelectGeneration = useCallback((generation: Generation) => {
    updateState({
      currentGeneration: generation,
      prompt: generation.prompt,
      style: generation.style as StyleOption,
      error: null
    });
  }, [updateState]);

  const handleHistoryUpdate = useCallback(() => {
    setHistory(getHistory());
  }, []);

  const canGenerate = state.uploadedImage && state.prompt.trim() && !state.isLoading;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
                <Wand2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">AI Studio</h1>
                <p className="text-gray-400">Transform your images with AI</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Input */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h2 className="text-lg font-semibold mb-4">Upload Image</h2>
                <FileUpload
                  onImageUpload={handleImageUpload}
                  uploadedImage={state.uploadedImage}
                  onRemoveImage={handleRemoveImage}
                  disabled={state.isLoading}
                />
              </div>

              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <PromptInput
                  value={state.prompt}
                  onChange={handlePromptChange}
                  disabled={state.isLoading}
                />
              </div>

              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <StyleSelector
                  value={state.style}
                  onChange={handleStyleChange}
                  disabled={state.isLoading}
                />
              </div>

              <GenerationSummary
                hasImage={!!state.uploadedImage}
                prompt={state.prompt}
                style={state.style}
              />

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 
                         hover:from-purple-700 hover:to-blue-700 disabled:from-gray-700 
                         disabled:to-gray-700 text-white font-medium py-3 px-6 rounded-lg 
                         transition-all transform hover:scale-[1.02] disabled:scale-100
                         disabled:cursor-not-allowed focus:outline-none focus:ring-2 
                         focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900
                         flex items-center justify-center gap-2"
                aria-describedby="generate-help"
              >
                <Sparkles className="h-5 w-5" />
                {state.isLoading ? 'Generating...' : 'Generate'}
              </button>
              <p id="generate-help" className="text-xs text-gray-500 text-center">
                Upload an image and add a prompt to get started
              </p>
            </div>

            {/* Center Column - Preview */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h2 className="text-lg font-semibold mb-4">Preview</h2>
                
                {state.isLoading ? (
                  <LoadingSpinner 
                    onAbort={handleAbort} 
                    currentAttempt={retryAttempt}
                    maxAttempts={3}
                  />
                ) : state.currentGeneration ? (
                  <GenerationPreview generation={state.currentGeneration} />
                ) : (
                  <div className="aspect-square bg-gray-700/50 rounded-xl border-2 border-dashed 
                               border-gray-600 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <Wand2 className="h-12 w-12 text-gray-500 mx-auto" />
                      <p className="text-gray-400">Your generated image will appear here</p>
                    </div>
                  </div>
                )}

                {state.error && (
                  <div className="mt-4 flex items-start gap-2 p-3 bg-red-500/10 border 
                               border-red-500/20 rounded-lg" role="alert">
                    <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-red-400 font-medium">Generation failed</p>
                      <p className="text-sm text-red-400/80">{state.error}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - History */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <GenerationHistory
                  history={history}
                  onSelectGeneration={handleSelectGeneration}
                  onHistoryUpdate={handleHistoryUpdate}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;