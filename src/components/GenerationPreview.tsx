import React from 'react';
import { Calendar, Hash, Palette, Type } from 'lucide-react';
import type { Generation } from '../types';

interface GenerationPreviewProps {
  generation: Generation;
  className?: string;
}

export const GenerationPreview: React.FC<GenerationPreviewProps> = ({
  generation,
  className = ""
}) => {
  const formattedDate = new Date(generation.createdAt).toLocaleString();

  return (
    <div className={`bg-gray-800 rounded-xl overflow-hidden border border-gray-700 ${className}`}>
      <div className="aspect-square">
        <img
          src={generation.imageUrl}
          alt={`AI generated image: ${generation.prompt}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-2">
          <Type className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <p className="text-sm text-white line-clamp-2">{generation.prompt}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-gray-400" aria-hidden="true" />
          <span className="text-sm font-medium text-purple-400">{generation.style}</span>
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" aria-hidden="true" />
            <time dateTime={generation.createdAt}>{formattedDate}</time>
          </div>
          <div className="flex items-center gap-1">
            <Hash className="h-3 w-3" aria-hidden="true" />
            <span className="font-mono">{generation.id.slice(-6)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};