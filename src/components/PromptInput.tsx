import React from 'react';
import { Type } from 'lucide-react';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const PromptInput: React.FC<PromptInputProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = "Describe the style transformation you want..."
}) => {
  return (
    <div className="space-y-2">
      <label htmlFor="prompt-input" className="flex items-center gap-2 text-sm font-medium text-white">
        <Type className="h-4 w-4" />
        Prompt
      </label>
      <textarea
        id="prompt-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        rows={3}
        className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white 
                 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 
                 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 
                 disabled:cursor-not-allowed transition-colors"
        aria-describedby="prompt-help"
      />
      <p id="prompt-help" className="text-xs text-gray-500">
        Be specific about the style, mood, and details you want to see
      </p>
    </div>
  );
};