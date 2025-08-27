---

# 2) AI_USAGE.md

```md
# AI_USAGE.md

This file documents how AI-assisted tools were used during development. Be transparent and brief — this helps reviewers understand automation and collaboration.

## Tools used

- **ChatGPT (GPT-5 Thinking mini)** — used interactively to:
  - Design UI layouts and propose professional AI-studio structure.
  - Generate the enhanced React component (`ProfessionalAIStudioWired.tsx`) including client-side downscale, retry/backoff, and abort logic.
  - Produce `README.md`, `AI_USAGE.md`, and Pull Request drafts.
  - Suggest accessibility improvements, keyboard shortcuts, and test cases.
- **GitHub Copilot** — used locally to speed up small boilerplate code completions and TypeScript type hints during iterative edits.
- (Optional) **Other tools** — e.g., Cursor, Copilot X, or VS Code extensions for refactors — list here if you used them.

## What I asked the AI to help with (examples)

- "Create a Vite + React + TypeScript component that accepts an uploaded image, downscales it to max 1920px, and returns a data URL."
- "Write a retryWithBackoff helper that retries only when the error is 'Model overloaded' and supports AbortController."
- "Suggest an accessible keyboard-first UI layout for an AI image generation page."

## How AI was used (high level)

- **Design & structure:** ChatGPT produced multiple layout suggestions and a final professional layout (left rail, center canvas, right inspector).
- **Implementation:** ChatGPT wrote the end-to-end wired component and helper utilities (downscale, mock API, retries).
- **Testing & debugging assistance:** ChatGPT suggested a set of unit/e2e tests and manual test steps to validate retry/abort/history behaviors.
- **Documentation & PRs:** ChatGPT generated `README.md`, `AI_USAGE.md`, and PR bodies to streamline submission.

## Manual checks & verification

- All AI-generated code was reviewed and adapted manually:
  - Verified TypeScript types and `tsconfig` strict compliance.
  - Tested the downscale flow locally with large images.
  - Confirmed AbortController cancels requests and retries.

## Notes on reliability

- AI produced working code scaffolding and logic but the generated mock images are placeholders (SVG); a production integration requires a real backend or model endpoint.
- Tests and linting are recommended to run locally to validate behavior against your exact environment.

_If you'd like, I can produce the exact prompts used (redacted) and the step-by-step iterative chat that led to the final files for internal audit._
```
