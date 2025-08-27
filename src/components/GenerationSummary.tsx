import React from 'react';
import { Image, Type, Palette, Sparkles } from 'lucide-react';

interface GenerationSummaryProps {
  hasImage: boolean;
  prompt: string;
  style: string;
}

export const GenerationSummary: React.FC<GenerationSummaryProps> = ({
  hasImage,
  prompt,
  style
}) => {
  const isComplete = hasImage && prompt.trim() && style;

  return (
    <div className={`
      p-4 rounded-lg border transition-all
      ${isComplete 
        ? 'border-green-500/30 bg-green-500/5' 
        : 'border-gray-600 bg-gray-800/50'
      }
    `}>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className={`h-4 w-4 ${isComplete ? 'text-green-400' : 'text-gray-400'}`} />
        <h3 className="font-medium text-white">Generation Summary</h3>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <Image className={`h-3 w-3 ${hasImage ? 'text-green-400' : 'text-gray-500'}`} />
          <span className={hasImage ? 'text-green-400' : 'text-gray-500'}>
            {hasImage ? 'Image uploaded ✓' : 'No image uploaded'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Type className={`h-3 w-3 ${prompt.trim() ? 'text-green-400' : 'text-gray-500'}`} />
          <span className={prompt.trim() ? 'text-green-400' : 'text-gray-500'}>
            {prompt.trim() ? `Prompt: "${prompt.slice(0, 30)}${prompt.length > 30 ? '...' : ''}"` : 'No prompt entered'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Palette className={`h-3 w-3 ${style ? 'text-green-400' : 'text-gray-500'}`} />
          <span className={style ? 'text-green-400' : 'text-gray-500'}>
            Style: {style}
          </span>
        </div>
      </div>

      {isComplete && (
        <div className="mt-3 p-2 bg-green-500/10 rounded border border-green-500/20">
          <p className="text-xs text-green-400">Ready to generate! ✨</p>
        </div>
      )}
    </div>
  );
};