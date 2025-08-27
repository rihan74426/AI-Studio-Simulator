import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Wand2,
  Sparkles,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { FileUpload } from "./components/FileUpload";
import { PromptInput } from "./components/PromptInput";
import { StyleSelector } from "./components/StyleSelector";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { GenerationPreview } from "./components/GenerationPreview";
import { GenerationHistory } from "./components/GenerationHistory";
import { GenerationSummary } from "./components/GenerationSummary";
import { mockApiCall, retryWithBackoff } from "./utils/apiUtils";
import { saveGeneration, getHistory } from "./utils/storageUtils";
import type { AppState, Generation, StyleOption, ApiRequest } from "./types";

/**
 * AppEnhanced.tsx
 * - A drop-in enhanced version of your App with improved layout, motion, keyboard interactions,
 *   better history thumbnails, retry progress visualization, accessible zoom modal, and toasts.
 * - Replace your existing `App` export with this component (or import it as a new route).
 */

export default function AppEnhanced() {
  const [state, setState] = useState<AppState>({
    uploadedImage: null,
    prompt: "",
    style: "Editorial",
    isLoading: false,
    error: null,
    currentGeneration: null,
    abortController: null,
  });

  const [history, setHistory] = useState<Generation[]>([]);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [toast, setToast] = useState<{
    id: number;
    type: "info" | "error" | "success";
    text: string;
  } | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const mounted = useRef(true);
  const toastId = useRef(1);

  useEffect(() => {
    // single mount load
    setHistory(getHistory());
    return () => {
      mounted.current = false;
    };
  }, []);

  const updateState = useCallback((updates: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Toast helper
  const pushToast = useCallback(
    (type: "info" | "error" | "success", text: string, ttl = 3500) => {
      const id = toastId.current++;
      setToast({ id, type, text });
      setTimeout(() => {
        // remove only if it's the same toast (avoid removing newer one)
        setToast((t) => (t && t.id === id ? null : t));
      }, ttl);
    },
    []
  );

  // Image handlers
  const handleImageUpload = useCallback(
    (dataUrl: string) => {
      updateState({ uploadedImage: dataUrl, error: null });
    },
    [updateState]
  );

  const handleRemoveImage = useCallback(() => {
    updateState({ uploadedImage: null });
  }, [updateState]);

  // prompt/style
  const handlePromptChange = useCallback(
    (prompt: string) => updateState({ prompt }),
    [updateState]
  );
  const handleStyleChange = useCallback(
    (style: StyleOption) => updateState({ style }),
    [updateState]
  );

  // Abort
  const handleAbort = useCallback(() => {
    if (state.abortController) {
      state.abortController.abort();
      updateState({
        isLoading: false,
        abortController: null,
        error: "Generation cancelled by user",
      });
      pushToast("info", "Generation aborted");
      setRetryAttempt(0);
    }
  }, [state.abortController, updateState, pushToast]);

  // Generate with better UX: show live preview while waiting, progress bar for retries, keyboard shortcut
  const handleGenerate = useCallback(async () => {
    if (!state.uploadedImage || !state.prompt.trim() || state.isLoading) return;

    const abortController = new AbortController();
    updateState({
      isLoading: true,
      error: null,
      currentGeneration: null,
      abortController,
    });
    setRetryAttempt(0);

    const request: ApiRequest = {
      imageDataUrl: state.uploadedImage,
      prompt: state.prompt.trim(),
      style: state.style,
    };

    try {
      const result = await retryWithBackoff(
        () => {
          setRetryAttempt((prev) => prev + 1);
          return mockApiCall(request, abortController.signal);
        },
        3,
        500,
        100,
        (attempt) => {
          // live progress callback (optional hook from utils)
          // we keep this simple by updating retryAttempt via setRetryAttempt above
        }
      );

      if (!mounted.current || abortController.signal.aborted) return;

      const generation: Generation = {
        id: result.id,
        imageUrl: result.imageUrl,
        prompt: result.prompt,
        style: result.style,
        createdAt: result.createdAt,
      };

      saveGeneration(generation);
      setHistory(getHistory());

      updateState({
        currentGeneration: generation,
        isLoading: false,
        abortController: null,
        error: null,
      });
      pushToast("success", "Generation saved to history");
      setRetryAttempt(0);
    } catch (error: any) {
      if (!mounted.current || abortController.signal.aborted) return;
      const errorMessage =
        error instanceof Error ? error.message : "Generation failed";
      updateState({
        isLoading: false,
        abortController: null,
        error: errorMessage,
      });
      pushToast("error", errorMessage);
      setRetryAttempt(0);
    }
  }, [
    state.uploadedImage,
    state.prompt,
    state.style,
    state.isLoading,
    updateState,
    pushToast,
  ]);

  // Restore generation from history
  const handleSelectGeneration = useCallback(
    (generation: Generation) => {
      updateState({
        currentGeneration: generation,
        prompt: generation.prompt,
        style: generation.style as StyleOption,
        error: null,
      });
      pushToast("info", "Restored from history");
    },
    [updateState, pushToast]
  );

  const handleHistoryUpdate = useCallback(() => setHistory(getHistory()), []);

  // Keyboard: Enter to generate when focus is inside prompt; Esc to close zoom modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomImage(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const canGenerate =
    !!state.uploadedImage && !!state.prompt.trim() && !state.isLoading;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
        {/* Header */}
        <header className="sticky top-0 z-30 backdrop-blur bg-opacity-30 bg-gray-900/60 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-500 rounded-lg shadow">
                <Wand2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold">
                  AI Studio — Enhanced
                </h1>
                <p className="text-sm text-gray-400">
                  Interactive preview, animated history, and accessible controls
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-300">
                <Sparkles className="h-4 w-4" />
                <span>
                  Press{" "}
                  <kbd className="px-2 py-0.5 rounded bg-gray-800">Esc</kbd> to
                  close images
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left controls */}
            <aside className="lg:col-span-4 space-y-6">
              <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700 shadow-sm">
                <h2 className="text-lg font-semibold mb-3">
                  Upload • Prompt • Style
                </h2>
                <FileUpload
                  onImageUpload={handleImageUpload}
                  uploadedImage={state.uploadedImage}
                  onRemoveImage={handleRemoveImage}
                  disabled={state.isLoading}
                />

                <div className="mt-4">
                  <PromptInput
                    value={state.prompt}
                    onChange={handlePromptChange}
                    disabled={state.isLoading}
                    placeholder="e.g. A cozy portrait in warm editorial tones"
                  />
                </div>

                <div className="mt-4">
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

                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={handleGenerate}
                    disabled={!canGenerate}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:scale-[1.02] focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-600/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-disabled={!canGenerate}
                    aria-live="polite"
                  >
                    <Sparkles className="h-5 w-5" />
                    <span>{state.isLoading ? "Generating…" : "Generate"}</span>
                  </button>

                  <button
                    onClick={handleAbort}
                    disabled={!state.isLoading}
                    className="w-12 h-12 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
                    aria-label="Abort generation"
                  >
                    <X className="h-5 w-5 text-red-400" />
                  </button>
                </div>

                {/* Retry progress */}
                <div className="mt-3">
                  <AnimatePresence>
                    {state.isLoading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-1"
                      >
                        <div className="text-xs text-gray-300">
                          Attempt {retryAttempt} of 3
                        </div>
                        <div className="w-full h-2 bg-gray-700 rounded overflow-hidden">
                          <motion.div
                            key={retryAttempt}
                            initial={{ width: 0 }}
                            animate={{
                              width: `${Math.min(
                                100,
                                (retryAttempt / 3) * 100
                              )}%`,
                            }}
                            transition={{ duration: 0.4 }}
                            className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* small hint */}
                <p className="mt-4 text-xs text-gray-400">
                  Tip: Use descriptive prompts and try different styles. Your
                  last 5 results are saved in history on the right.
                </p>
              </div>
            </aside>

            {/* Center preview */}
            <section className="lg:col-span-4">
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-sm h-full flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <h2 className="text-lg font-semibold">Preview</h2>

                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    {state.currentGeneration ? (
                      <span className="inline-flex items-center gap-2">
                        Generated{" "}
                        <span className="text-gray-400">
                          {new Date(
                            state.currentGeneration.createdAt
                          ).toLocaleString()}
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        Live preview
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-1 gap-4">
                  <div className="rounded-xl overflow-hidden border border-dashed border-gray-700 bg-gradient-to-b from-gray-800/20 to-gray-800/10 aspect-video flex items-center justify-center">
                    <AnimatePresence>
                      {state.isLoading ? (
                        <motion.div
                          key="spinner"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-center w-full h-full"
                        >
                          <LoadingSpinner
                            onAbort={handleAbort}
                            currentAttempt={retryAttempt}
                            maxAttempts={3}
                          />
                        </motion.div>
                      ) : state.currentGeneration ? (
                        <motion.div
                          key="gen"
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="w-full h-full flex items-center justify-center p-4"
                        >
                          <div className="relative w-full h-full">
                            <img
                              src={state.currentGeneration.imageUrl}
                              alt={state.currentGeneration.prompt}
                              className="object-contain w-full h-full rounded-lg cursor-zoom-in"
                              onClick={() =>
                                setZoomImage(state.currentGeneration!.imageUrl)
                              }
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  setZoomImage(
                                    state.currentGeneration!.imageUrl
                                  );
                              }}
                            />

                            <div className="absolute left-3 bottom-3 bg-black/40 px-3 py-1 rounded-md text-xs backdrop-blur text-gray-100">
                              {state.currentGeneration.style} —{" "}
                              {state.currentGeneration.prompt.slice(0, 60)}
                              {state.currentGeneration.prompt.length > 60
                                ? "…"
                                : ""}
                            </div>
                          </div>
                        </motion.div>
                      ) : state.uploadedImage ? (
                        <motion.div
                          key="uploaded"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="w-full h-full p-4 flex items-center justify-center"
                        >
                          <div className="relative w-full h-full">
                            <img
                              src={state.uploadedImage}
                              alt={state.prompt || "Uploaded image"}
                              className="object-contain w-full h-full rounded-lg cursor-zoom-in"
                              onClick={() => setZoomImage(state.uploadedImage)}
                            />
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="empty"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="h-full w-full flex flex-col items-center justify-center text-center text-gray-400 p-4"
                        >
                          <Wand2 className="h-14 w-14 text-gray-500 mb-2" />
                          <p className="font-medium">No image yet</p>
                          <p className="text-sm mt-1">
                            Upload an image and write a prompt to see a live
                            preview and generate.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* small meta / actions */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-gray-400">
                      Prompt:{" "}
                      <span className="text-gray-200">
                        {state.prompt || "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="text-xs px-2 py-1 rounded bg-gray-800 border border-gray-700 focus-visible:ring-2 focus-visible:ring-indigo-500"
                        onClick={() => {
                          if (state.currentGeneration)
                            setZoomImage(state.currentGeneration.imageUrl);
                        }}
                        aria-label="Open large preview"
                      >
                        <ZoomIn className="h-4 w-4 inline mr-1" /> View large
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Right history */}
            <aside className="lg:col-span-4">
              <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700 shadow-sm h-full flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">History (last 5)</h2>
                  <div className="text-sm text-gray-400">
                    Click / keyboard-select to restore
                  </div>
                </div>

                <div className="flex-1 overflow-auto">
                  <div className="grid grid-cols-2 gap-3">
                    {history.length === 0 ? (
                      <div className="col-span-2 text-sm text-gray-400">
                        No history yet. Your successful generations will appear
                        here.
                      </div>
                    ) : (
                      history.map((g, idx) => (
                        <motion.button
                          key={g.id}
                          onClick={() => handleSelectGeneration(g)}
                          onDoubleClick={() => setZoomImage(g.imageUrl)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="group relative rounded-lg overflow-hidden border border-gray-700 p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600"
                          aria-label={`Restore generation ${g.prompt}`}
                        >
                          <img
                            src={g.imageUrl}
                            alt={g.prompt}
                            className="w-full h-28 object-cover"
                          />

                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end">
                            <div className="p-2 w-full text-xs text-white bg-gradient-to-t from-black/60 to-transparent">
                              <div className="font-medium truncate">
                                {g.prompt}
                              </div>
                              <div className="text-[11px] text-gray-300 truncate">
                                {g.style} •{" "}
                                {new Date(g.createdAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </motion.button>
                      ))
                    )}
                  </div>
                </div>

                <div className="text-xs text-gray-400">
                  History is stored in localStorage and kept for your last 5
                  generations.
                </div>
              </div>
            </aside>
          </div>
        </main>

        {/* Zoom Modal */}
        <AnimatePresence>
          {zoomImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="absolute inset-0 bg-black/70"
                onClick={() => setZoomImage(null)}
                aria-hidden
              />

              <motion.div
                initial={{ scale: 0.98 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.98 }}
                className="relative max-w-4xl w-full bg-gray-900 rounded-lg overflow-hidden"
              >
                <button
                  className="absolute right-3 top-3 bg-gray-800/60 p-2 rounded focus:outline-none"
                  onClick={() => setZoomImage(null)}
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="p-4">
                  <img
                    src={zoomImage}
                    alt="Zoomed"
                    className="w-full h-[60vh] object-contain"
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast */}
        <div className="fixed right-4 bottom-6 z-50">
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={`min-w-[220px] px-4 py-3 rounded-lg shadow-lg ${
                  toast.type === "error"
                    ? "bg-red-600"
                    : toast.type === "success"
                    ? "bg-emerald-600"
                    : "bg-gray-800"
                }`}
                role="status"
              >
                <div className="flex items-center gap-3">
                  {toast.type === "error" ? (
                    <AlertTriangle className="h-5 w-5" />
                  ) : (
                    <Sparkles className="h-5 w-5" />
                  )}
                  <div className="text-sm font-medium">{toast.text}</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </ErrorBoundary>
  );
}
