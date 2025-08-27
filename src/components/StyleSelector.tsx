import React from 'react';
import { Palette } from 'lucide-react';
import type { StyleOption } from '../types';

const STYLE_OPTIONS: { value: StyleOption; label: string; description: string }[] = [
  { value: 'Editorial', label: 'Editorial', description: 'High-fashion magazine style' },
  { value: 'Streetwear', label: 'Streetwear', description: 'Urban casual aesthetic' },
  { value: 'Vintage', label: 'Vintage', description: 'Classic retro vibes' },
  { value: 'Minimalist', label: 'Minimalist', description: 'Clean and simple' },
  { value: 'Cyberpunk', label: 'Cyberpunk', description: 'Futuristic neon aesthetic' }
];

interface StyleSelectorProps {
  value: StyleOption;
  onChange: (style: StyleOption) => void;
  disabled?: boolean;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  return (
    <div className="space-y-3">
      <label htmlFor="style-select" className="flex items-center gap-2 text-sm font-medium text-white">
        <Palette className="h-4 w-4" />
        Style
      </label>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {STYLE_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            disabled={disabled}
            className={`
              p-3 rounded-lg border text-left transition-all focus:outline-none 
              focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed
              ${value === option.value
                ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600 hover:bg-gray-800'
              }
            `}
            role="radio"
            aria-checked={value === option.value}
            tabIndex={disabled ? -1 : 0}
          >
            <div className="font-medium text-sm">{option.label}</div>
            <div className="text-xs text-gray-500 mt-1">{option.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
};