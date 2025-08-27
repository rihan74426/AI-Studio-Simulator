import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Wand2,
  Sparkles,
  AlertTriangle,
  X,
  ZoomIn,
  Upload,
  Download,
  Settings,
  History,
  Play,
  Square,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * ProfessionalAIStudioWired.tsx
 * - Self-contained wiring of UI -> functionality required by the assignment.
 * - TypeScript; single-file for easy drop-in. Replace your current component with this.
 */

/* --------------------------- Types --------------------------- */
type StyleOption =
  | "Editorial"
  | "Portrait"
  | "Cinematic"
  | "Artistic"
  | "Documentary";

type Generation = {
  id: string;
  imageUrl: string; // dataURL (base64)
  prompt: string;
  style: StyleOption;
  createdAt: string;
};

type AppState = {
  uploadedImage: string | null;
  prompt: string;
  style: StyleOption;
  isLoading: boolean;
  error: string | null;
  currentGeneration: Generation | null;
  abortController: AbortController | null;
};

/* ------------------------ Constants -------------------------- */
const HISTORY_KEY = "modelia_history_v1";
const MAX_HISTORY = 5;

/* ------------------------ Helpers ---------------------------- */

/** downscaleFile: downscale images client-side to maxEdge px and return a JPEG dataURL.
 * - preserves aspect ratio
 * - outputs JPEG at quality 0.9 (smaller than PNG)
 */
async function downscaleFile(file: File, maxEdge = 1920): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Not an image file");
  const imgUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = imgUrl;
    });

    const { width, height } = img;
    const longEdge = Math.max(width, height);
    let targetW = width;
    let targetH = height;
    if (longEdge > maxEdge) {
      const scale = maxEdge / longEdge;
      targetW = Math.round(width * scale);
      targetH = Math.round(height * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, targetW, targetH);
    // Use JPEG to shrink size — quality 0.9
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    return dataUrl;
  } finally {
    URL.revokeObjectURL(imgUrl);
  }
}

/** getHistory / saveGeneration using localStorage */
function getHistory(): Generation[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Generation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveGeneration(g: Generation) {
  const h = getHistory();
  // dedupe by id (generally not necessary) then prepend and trim
  const filtered = [g, ...h.filter((x) => x.id !== g.id)].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
}

/* ------------------------ Mock API --------------------------- */

/**
 * mockApiCall simulates a remote generation API:
 * - returns success object after 1-2s
 * - 20% chance to reject with { message: "Model overloaded" }
 * - respects AbortSignal (reject with DOMException name 'AbortError')
 */
async function mockApiCall(
  body: { imageDataUrl: string; prompt: string; style: StyleOption },
  signal?: AbortSignal
): Promise<{
  id: string;
  imageUrl: string;
  prompt: string;
  style: StyleOption;
  createdAt: string;
}> {
  // small helper to be cancelable
  function wait(ms: number) {
    return new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => {
        signal?.removeEventListener("abort", onAbort);
        resolve();
      }, ms);
      const onAbort = () => {
        clearTimeout(t);
        reject(new DOMException("Aborted", "AbortError"));
      };
      signal?.addEventListener("abort", onAbort);
      if (signal?.aborted) onAbort();
    });
  }

  // variable delay 800-1600ms
  const delay = 800 + Math.floor(Math.random() * 800);
  await wait(delay);

  // abort check
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  // 20% overloaded
  if (Math.random() < 0.2) {
    const err: any = new Error("Model overloaded");
    err.message = "Model overloaded";
    throw err;
  }

  // success: we simulate a generated image by blending the input with a gradient overlay
  const now = Date.now();
  const generatedDataUrl = body.imageDataUrl.startsWith("data:")
    ? // if the input is data URL we can overlay text by just returning a generated SVG with prompt (keeps it simple)
      `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'>
        <defs><linearGradient id='g' x1='0' x2='1'><stop offset='0' stop-color='#6366f1'/><stop offset='1' stop-color='#ec4899'/></linearGradient></defs>
        <rect width='100%' height='100%' fill='url(#g)'/>
        <text x='50%' y='45%' font-size='36' text-anchor='middle' fill='white' font-family='Arial'>${escapeXml(
          body.style
        )}</text>
        <text x='50%' y='60%' font-size='18' text-anchor='middle' fill='rgba(255,255,255,0.9)'>${escapeXml(
          truncate(body.prompt, 80)
        )}</text>
      </svg>`)}`
    : body.imageDataUrl;

  return {
    id: now.toString(),
    imageUrl: generatedDataUrl,
    prompt: body.prompt,
    style: body.style,
    createdAt: new Date(now).toISOString(),
  };
}

/* ---------------------- Retry helper ------------------------- */
/**
 * retryWithBackoff(fn, attempts, baseDelay, jitter)
 * - retries only when the thrown error's message === "Model overloaded"
 * - respects AbortSignal if provided inside fn (fn should accept the signal)
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  attempts = 3,
  baseDelay = 500,
  jitter = 100,
  signal?: AbortSignal
): Promise<T> {
  let attempt = 0;
  while (attempt < attempts) {
    attempt++;
    try {
      return await fn();
    } catch (err: any) {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      const msg = (err && err.message) || String(err || "");
      // only retry on overloaded
      if (msg === "Model overloaded" && attempt < attempts) {
        const delay =
          baseDelay * Math.pow(2, attempt - 1) +
          Math.floor(Math.random() * jitter);
        await new Promise<void>((res, rej) => {
          const t = setTimeout(() => {
            signal?.removeEventListener("abort", onAbort);
            res();
          }, delay);
          const onAbort = () => {
            clearTimeout(t);
            rej(new DOMException("Aborted", "AbortError"));
          };
          signal?.addEventListener("abort", onAbort);
          if (signal?.aborted) onAbort();
        });
        continue;
      }
      // don't retry other errors
      throw err;
    }
  }
  // If we exhausted attempts, throw final error
  throw new Error("Failed after retries");
}

/* ------------------------ Utils ------------------------------ */
function truncate(s: string, n = 80) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
function escapeXml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[
        c
      ] as string)
  );
}

/* ------------------------ Component -------------------------- */

export default function ProfessionalAIStudioWired(): JSX.Element {
  const [state, setState] = useState<AppState>({
    uploadedImage: null,
    prompt: "",
    style: "Editorial",
    isLoading: false,
    error: null,
    currentGeneration: null,
    abortController: null,
  });

  const [history, setHistoryState] = useState<Generation[]>(() => getHistory());
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [toast, setToast] = useState<{
    id: number;
    type: "info" | "error" | "success";
    text: string;
  } | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const updateState = useCallback((updates: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const pushToast = useCallback(
    (type: "info" | "error" | "success", text: string) => {
      const id = Date.now();
      setToast({ id, type, text });
      setTimeout(() => {
        if (mounted.current) setToast((t) => (t && t.id === id ? null : t));
      }, 3000);
    },
    []
  );

  /* ---------- file handling: open file input and process --------- */
  const openFilePicker = useCallback(() => fileInputRef.current?.click(), []);
  const onFileSelected = useCallback(
    async (file?: File) => {
      if (!file) return;
      try {
        // downscale if needed
        const dataUrl = await downscaleFile(file, 1920);
        updateState({ uploadedImage: dataUrl, error: null });
        pushToast("success", "Image ready");
      } catch (err: any) {
        pushToast("error", err?.message || "Failed to process image");
      }
    },
    [updateState, pushToast]
  );

  /* ---------- generate flow with retries & abort support --------- */
  const handleGenerate = useCallback(async () => {
    if (!state.uploadedImage || !state.prompt.trim() || state.isLoading) return;

    const controller = new AbortController();
    updateState({
      isLoading: true,
      error: null,
      currentGeneration: null,
      abortController: controller,
    });
    setRetryAttempt(0);

    const body = {
      imageDataUrl: state.uploadedImage,
      prompt: state.prompt.trim(),
      style: state.style,
    };

    try {
      const result = await retryWithBackoff(
        () => {
          // track attempts
          setRetryAttempt((a) => a + 1);
          return mockApiCall(body, controller.signal);
        },
        3,
        500,
        120,
        controller.signal
      );

      if (!mounted.current || controller.signal.aborted) return;

      const generation: Generation = {
        id: result.id,
        imageUrl: result.imageUrl,
        prompt: result.prompt,
        style: result.style,
        createdAt: result.createdAt,
      };

      // persist & update UI
      saveGeneration(generation);
      setHistoryState(getHistory());
      updateState({
        currentGeneration: generation,
        isLoading: false,
        abortController: null,
        error: null,
      });
      pushToast("success", "Generation saved to history");
      setRetryAttempt(0);
    } catch (err: any) {
      if (!mounted.current) return;
      if (err && err.name === "AbortError") {
        // aborted by user
        updateState({
          isLoading: false,
          abortController: null,
          error: "Generation aborted",
        });
        pushToast("info", "Generation aborted");
        setRetryAttempt(0);
        return;
      }
      const message = (err && err.message) || "Generation failed";
      updateState({ isLoading: false, abortController: null, error: message });
      pushToast("error", message);
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

  const handleAbort = useCallback(() => {
    if (state.abortController) {
      state.abortController.abort();
      updateState({
        isLoading: false,
        abortController: null,
        error: "Generation cancelled",
      });
      pushToast("info", "Generation cancelled");
      setRetryAttempt(0);
    }
  }, [state.abortController, updateState, pushToast]);

  const handleHistoryClick = useCallback(
    (g: Generation) => {
      updateState({
        currentGeneration: g,
        prompt: g.prompt,
        style: g.style,
        error: null,
      });
      pushToast("info", "Restored from history");
    },
    [updateState, pushToast]
  );

  const canGenerate =
    !!state.uploadedImage && !!state.prompt.trim() && !state.isLoading;

  /* -------------------- small accessibility helpers -------------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to generate
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleGenerate();
      }
      if (e.key === "Escape") {
        // close zoom or history
        if (zoomImage) setZoomImage(null);
        else if (showHistory) setShowHistory(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleGenerate, zoomImage, showHistory]);

  /* ------------------------ JSX UI ------------------------ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.currentTarget.value = "";
          if (f) onFileSelected(f);
        }}
      />

      {/* Top Navigation */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
                <Wand2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">AI Studio Pro</h1>
                <p className="text-xs text-slate-400">
                  Advanced Image Generation
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowHistory((s) => !s)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                aria-pressed={showHistory}
                aria-label="Toggle history panel"
              >
                <History className="w-5 h-5" />
              </button>
              <button
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Sidebar - Controls */}
        <div className="w-80 border-r border-slate-700 bg-slate-900/30 p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Image Upload */}
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-3">
                Source Image
              </h3>

              {/* Inline uploader that uses the real file picker */}
              <div className="relative">
                {state.uploadedImage ? (
                  <div className="relative group">
                    <img
                      src={state.uploadedImage}
                      alt="Uploaded"
                      className="w-full h-32 object-cover rounded-lg border border-slate-700"
                    />
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openFilePicker()}
                        className="bg-slate-800/80 p-1 rounded text-slate-200"
                        aria-label="Replace image"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateState({ uploadedImage: null })}
                        className="bg-red-600 p-1 rounded text-white"
                        aria-label="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") openFilePicker();
                    }}
                    onClick={() => openFilePicker()}
                    className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-slate-500 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    aria-label="Upload image"
                  >
                    <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <p className="text-sm text-slate-400">
                      Click to upload image (will downscale if 1920px)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Prompt Input */}
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-3">
                Prompt
              </h3>
              <textarea
                value={state.prompt}
                onChange={(e) => updateState({ prompt: e.target.value })}
                placeholder="Describe the style and transformation you want..."
                className="w-full h-32 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                disabled={state.isLoading}
              />
              <p className="text-xs text-slate-400 mt-2">
                {state.prompt.length}/500 characters
              </p>
            </div>

            {/* Style Selector */}
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-3">
                Style
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    "Editorial",
                    "Portrait",
                    "Cinematic",
                    "Artistic",
                    "Documentary",
                  ] as StyleOption[]
                ).map((s) => (
                  <button
                    key={s}
                    onClick={() => updateState({ style: s })}
                    className={`p-3 rounded-lg text-sm font-medium transition-all ${
                      state.style === s
                        ? "bg-indigo-600 text-white shadow-lg"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                    disabled={state.isLoading}
                    aria-pressed={state.style === s}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <div className="pt-4">
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className={`w-full py-4 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  canGenerate && !state.isLoading
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg"
                    : "bg-slate-700 text-slate-400 cursor-not-allowed"
                }`}
                aria-disabled={!canGenerate}
              >
                {state.isLoading ? (
                  <>
                    <Square className="w-4 h-4" /> Generating...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" /> Generate Image
                  </>
                )}
              </button>

              {state.isLoading && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Progress</span>
                    <span>Attempt {retryAttempt} of 3</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(retryAttempt / 3) * 100}%` }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    />
                  </div>
                  <button
                    onClick={handleAbort}
                    className="w-full mt-2 py-2 bg-red-600 hover:bg-red-700 rounded text-xs font-medium"
                  >
                    Cancel Generation
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Preview Area */}
        <div className="flex-1 flex flex-col">
          {/* Preview Header */}
          <div className="border-b border-slate-700 bg-slate-900/20 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Preview</h2>
                <p className="text-sm text-slate-400">
                  {state.currentGeneration
                    ? `Generated ${new Date(
                        state.currentGeneration.createdAt
                      ).toLocaleTimeString()}`
                    : state.uploadedImage
                    ? "Source image loaded"
                    : "Upload an image to begin"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {state.currentGeneration && (
                  <>
                    <button
                      onClick={() =>
                        setZoomImage(state.currentGeneration!.imageUrl)
                      }
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-sm flex items-center gap-1"
                    >
                      <ZoomIn className="w-4 h-4" /> Full Size
                    </button>
                    <button
                      onClick={() => {
                        /* implement download logic if desired */
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-sm flex items-center gap-1"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 flex items-center justify-center p-8 bg-slate-900/10">
            <div className="w-full h-full max-w-4xl max-h-[70vh] flex items-center justify-center">
              <AnimatePresence mode="wait">
                {state.isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-mono">
                            {retryAttempt}/3
                          </span>
                        </div>
                      </div>
                      <div className="text-center text-slate-300">
                        Generating your image...
                      </div>
                    </div>
                  </motion.div>
                ) : state.currentGeneration ? (
                  <motion.div
                    key="generated"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative group w-full h-full flex items-center justify-center"
                  >
                    <img
                      src={state.currentGeneration.imageUrl}
                      alt={state.currentGeneration.prompt}
                      className="max-w-full max-h-full object-contain rounded-xl shadow-2xl cursor-zoom-in"
                      onClick={() =>
                        setZoomImage(state.currentGeneration!.imageUrl)
                      }
                    />
                    <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-sm font-medium">
                        {state.currentGeneration.prompt}
                      </p>
                      <p className="text-xs text-slate-300 mt-1">
                        Style: {state.currentGeneration.style}
                      </p>
                    </div>
                  </motion.div>
                ) : state.uploadedImage ? (
                  <motion.div
                    key="uploaded"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full flex items-center justify-center"
                  >
                    <img
                      src={state.uploadedImage}
                      alt="Uploaded source"
                      className="max-w-full max-h-full object-contain rounded-xl shadow-lg"
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center text-slate-400"
                  >
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-slate-800 flex items-center justify-center">
                      <Wand2 className="w-12 h-12" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      Ready to Create
                    </h3>
                    <p className="text-slate-500 max-w-md">
                      Upload an image and describe your vision. Our AI will
                      transform it according to your prompt.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Sidebar - History */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-slate-700 bg-slate-900/30 overflow-hidden"
              aria-hidden={!showHistory}
            >
              <div
                className="p-6 h-full overflow-y-auto"
                role="region"
                aria-label="Generation history"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Generation History</h3>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="p-1 hover:bg-slate-800 rounded"
                    aria-label="Close history"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {history.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-8">
                      Your generated images will appear here
                    </p>
                  ) : (
                    history.map((generation) => (
                      <motion.div
                        key={generation.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-800/50 rounded-lg overflow-hidden cursor-pointer hover:bg-slate-800 transition-colors"
                        onClick={() => handleHistoryClick(generation)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleHistoryClick(generation);
                        }}
                      >
                        <img
                          src={generation.imageUrl}
                          alt={generation.prompt}
                          className="w-full h-32 object-cover"
                        />
                        <div className="p-3">
                          <p className="text-xs text-slate-300 mb-1">
                            {new Date(
                              generation.createdAt
                            ).toLocaleDateString()}
                          </p>
                          <p className="text-sm font-medium truncate mb-1">
                            {generation.prompt}
                          </p>
                          <p className="text-xs text-slate-400">
                            Style: {generation.style}
                          </p>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Full Screen Image Modal */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90"
            onClick={() => setZoomImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-[90vw] max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setZoomImage(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                aria-label="Close full size image"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={zoomImage}
                alt="Full size preview"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-40"
          >
            <div
              className={`px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 ${
                toast.type === "error"
                  ? "bg-red-600"
                  : toast.type === "success"
                  ? "bg-green-600"
                  : "bg-blue-600"
              }`}
            >
              {toast.type === "error" ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">{toast.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
