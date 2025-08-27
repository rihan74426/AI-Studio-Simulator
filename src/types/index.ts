export interface Generation {
  id: string;
  imageUrl: string;
  prompt: string;
  style: string;
  createdAt: string;
}

export interface ApiRequest {
  imageDataUrl: string;
  prompt: string;
  style: string;
}

export interface ApiResponse {
  id: string;
  imageUrl: string;
  prompt: string;
  style: string;
  createdAt: string;
}

export interface ApiError {
  message: string;
}

export type StyleOption = 'Editorial' | 'Streetwear' | 'Vintage' | 'Minimalist' | 'Cyberpunk';

export interface AppState {
  uploadedImage: string | null;
  prompt: string;
  style: StyleOption;
  isLoading: boolean;
  error: string | null;
  currentGeneration: Generation | null;
  abortController: AbortController | null;
}

export interface GenerationStatus {
  isGenerating: boolean;
  currentAttempt: number;
  maxAttempts: number;
  canAbort: boolean;
}