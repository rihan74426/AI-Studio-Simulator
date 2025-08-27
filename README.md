# AI Studio Pro — Frontend Assignment

A small React + TypeScript frontend that simulates a simplified AI studio for image transformation.  
Built with Vite, TailwindCSS and TypeScript (strict mode). Includes a mocked generation API, client-side image downscale, exponential-backoff retries, abort support, and local history.

## Live demo

> (If you published the app, put the public URL here)

## Features

- Upload and preview PNG/JPG images.
- Client-side downscale if image longest edge > 1920px (keeps upload ≤ 10MB).
- Prompt input + style selector (5 styles).
- Live summary (preview + prompt + style).
- **Generate** button — calls a **mocked** API:
  - POST body: `{ imageDataUrl, prompt, style }`
  - Response: `{ id, imageUrl, prompt, style, createdAt }` after ~1–2s
  - 20% simulated `"Model overloaded"` error.
  - Automatic exponential-backoff retry (max 3 attempts) for the overloaded error.
  - Loading spinner and attempt progress bar.
  - Abort in-flight request using **AbortController**.
- History: last 5 successful generations saved in `localStorage`.
- Click or keyboard-select history item to restore into preview.
- Accessible keyboard navigation, visible focus states, and ARIA where applicable.
- Polished UI with animations (Framer Motion) and micro-interactions.

## Tech stack

- React + TypeScript (Vite)
- Tailwind CSS
- Framer Motion (animations)
- lucide-react (icons)
- ESLint + Prettier
- Jest + React Testing Library (unit tests)
- Playwright (end-to-end tests) — optional

## Folder structure (high level)

src/
components/ # FileUpload, PromptInput, LoadingSpinner, GenerationPreview...
pages/ or App.tsx # main app component (ProfessionalAIStudioWired.tsx)
utils/
apiUtils.ts # mockApiCall & retryWithBackoff
imageUtils.ts # downscaleFile
storageUtils.ts # localStorage helpers
styles/
tests/ # unit tests

## Install

```bash
# clone
git clone https://github.com/<your-username>/<repo>.git
cd <repo>

# install dependencies
npm ci
# or
yarn install

The project uses Vite + React + TypeScript. If you used Next.js instead, replace npm run dev with next dev instructions.

# dev server
npm run dev
# or
yarn dev

# build for production
npm run build
# preview production build
npm run preview

# lint (ESLint)
npm run lint

# format (Prettier)
npm run format

# unit tests (Jest + RTL)
npm run test

# e2e tests (Playwright)
npm run test:e2e
How to run locally (quick)

npm ci

npm run dev

Open http://localhost:5173
 (or printed port) in your browser.

How the mock API works

The UI calls a local mockApiCall (in src/utils/apiUtils.ts).

mockApiCall simulates a 0.8–1.6s response delay and randomly returns an error { message: "Model overloaded" } in ~20% of requests.

retryWithBackoff() wraps mockApiCall and retries only on the overloaded error with exponential backoff (base delay + jitter). Max attempts = 3.

The AbortController signal is passed down so user cancel stops both the current mock request and further retries.

Replace mock API with a real one

Replace mockApiCall calls with real fetch()/axios POSTs to your endpoint.

Ensure the real endpoint respects AbortSignal (fetch does) or wrap calls to support cancellation.

Keep the client-side retry logic (retryWithBackoff) or adapt server-side retry behavior as needed.

Accessibility & keyboard shortcuts

Focus outlines are visible using focus-visible.

Keyboard shortcuts:

Ctrl/Cmd + Enter — generate

Esc — close large preview or history panel

Aria attributes used for status and alert regions.

Tests

Unit tests cover:

downscaleFile behavior (resizing logic).

Retry behavior: verify retryWithBackoff retries only on "Model overloaded".

saveGeneration / getHistory localStorage behavior.

E2E tests (Playwright) cover:

Upload → Generate → success saved to history.

Simulated overloaded error and automatic retries.

Abort in-flight request and verify no history entry.

Design notes

Visual language: dark, professional studio look with high contrast CTA.

Motion: subtle scale & fade transitions to make the experience feel responsive without distraction.

History stores thumbnails as data URLs to simplify offline storage — trimmed to 5 items to avoid large localStorage usage.

Images are converted to JPEG on downscale (smaller payload) even if original is PNG.

## Known limitations

Mock API generates synthetic SVG images (placeholders). Replace with a real generation endpoint to get realistic outputs.

localStorage is used for persistence; for multi-device synchronization use a backend.

For extremely large images (very large file sizes), the browser may hit memory limits when decoding — recommend advising users to upload reasonable sizes.
```
