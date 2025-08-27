# AI Studio Simulator

A modern React application that simulates an AI image generation studio with client-side image processing, mock API interactions, and persistent history management.

## Features

- **Client-side Image Processing**: Automatic image downscaling and compression
- **Mock AI API**: Simulated image generation with realistic delays and error handling
- **Retry Logic**: Exponential backoff for handling "Model overloaded" errors
- **Request Cancellation**: AbortController support for canceling in-flight requests
- **Persistent History**: localStorage-based history management (last 5 generations)
- **Accessibility**: Full keyboard navigation and screen reader support
- **Error Handling**: Comprehensive error boundaries and user feedback

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Linting**: ESLint

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ai-studio-simulator

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev

# The application will be available at http://localhost:5173
```

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Linting

```bash
# Run ESLint
npm run lint
```

### Testing

```bash
# Run tests (when implemented)
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Usage

1. **Upload Image**: Drag and drop or click to select a PNG/JPG image (max 10MB)
2. **Enter Prompt**: Describe the style transformation you want
3. **Select Style**: Choose from Editorial, Streetwear, Vintage, Minimalist, or Cyberpunk
4. **Generate**: Click the generate button to create your styled image
5. **View History**: Access your last 5 generations in the history panel

### Key Features

- **Automatic Retries**: The system automatically retries failed requests up to 3 times
- **Request Cancellation**: Cancel ongoing generations with the abort button
- **History Management**: Click any history item to restore its settings
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Architecture

### Core Components

- `App.tsx` - Main application component with state management
- `FileUpload.tsx` - Drag-and-drop image upload with validation
- `PromptInput.tsx` - Text input for generation prompts
- `StyleSelector.tsx` - Style option selection interface
- `GenerationPreview.tsx` - Display component for generated images
- `GenerationHistory.tsx` - History management and display
- `LoadingSpinner.tsx` - Loading states with abort functionality
- `ErrorBoundary.tsx` - Error handling and recovery

### Utilities

- `imageUtils.ts` - Client-side image processing and validation
- `apiUtils.ts` - Mock API calls with retry logic and abort support
- `storageUtils.ts` - localStorage management for history persistence

### Types

- `types/index.ts` - TypeScript interfaces and type definitions

## API Simulation

The mock API simulates realistic AI generation behavior:

- **Response Time**: 1-2 second delays
- **Error Rate**: ~20% chance of "Model overloaded" errors
- **Retry Logic**: Exponential backoff (500ms, 1000ms, 2000ms + jitter)
- **Abort Support**: Full AbortController integration

## Accessibility Features

- **Keyboard Navigation**: Full keyboard support for all interactions
- **Screen Reader Support**: Proper ARIA labels and live regions
- **Focus Management**: Visible focus indicators and logical tab order
- **Error Announcements**: Screen reader announcements for errors and status changes

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Considerations

- **Image Optimization**: Automatic downscaling to max 1920px with JPEG compression
- **Memory Management**: Proper cleanup of AbortControllers and event listeners
- **Storage Limits**: History limited to 5 items to prevent localStorage bloat

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Submission Checklist

### Required Deliverables

- [ ] **GitHub Repository**: Public repository with complete source code
- [ ] **Live Demo**: Deployed application (Netlify, Vercel, or similar)
- [ ] **Pull Request**: At least one meaningful PR showing development process
- [ ] **README.md**: This comprehensive documentation

### Core Features Implementation

- [x] **Client-side Image Downscaling**: `downscaleImage()` utility with canvas processing
- [x] **Mock API with Retry Logic**: Exponential backoff for "Model overloaded" errors
- [x] **Request Cancellation**: AbortController support with proper cleanup
- [x] **History & localStorage**: Persistent storage of last 5 generations
- [x] **Accessibility**: Full keyboard navigation and screen reader support
- [x] **Error Handling**: Comprehensive error boundaries and user feedback

### Technical Requirements

- [x] **TypeScript**: Full type safety throughout the application
- [x] **React Hooks**: Modern functional components with proper state management
- [x] **Responsive Design**: Mobile-first approach with Tailwind CSS
- [x] **Code Quality**: ESLint configuration and clean code practices

### Bonus Features

- [x] **Error Boundary**: React error boundary for graceful error handling
- [x] **Loading States**: Detailed loading indicators with attempt counts
- [x] **User Experience**: Smooth animations and micro-interactions
- [ ] **Unit Tests**: React Testing Library tests (recommended for production)
- [ ] **E2E Tests**: Cypress or Playwright tests (recommended for production)
- [ ] **CI/CD**: GitHub Actions for automated testing and deployment

## Links

- **GitHub Repository**: [Add your repository URL here]
- **Live Demo**: [Add your deployed application URL here]
- **Pull Requests**: [Add links to your PRs here]

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.