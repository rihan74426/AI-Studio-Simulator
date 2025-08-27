import React, { useCallback, useState } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';
import { validateImageFile, downscaleImage } from '../utils/imageUtils';

interface FileUploadProps {
  onImageUpload: (dataUrl: string) => void;
  uploadedImage: string | null;
  onRemoveImage: () => void;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onImageUpload,
  uploadedImage,
  onRemoveImage,
  disabled = false
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setProcessing(true);

    try {
      const dataUrl = await downscaleImage(file);
      onImageUpload(dataUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process image. Please try again.';
      setError(errorMessage);
    } finally {
      setProcessing(false);
    }
  }, [onImageUpload]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled || processing) return;

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  }, [disabled, processing, handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || processing) return;

    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
    // Reset input value to allow re-uploading the same file
    e.target.value = '';
  }, [disabled, processing, handleFile]);

  return (
    <div className="space-y-4">
      {!uploadedImage ? (
        <div
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center transition-all
            ${dragActive 
              ? 'border-purple-500 bg-purple-500/10 scale-105' 
              : 'border-gray-600 hover:border-gray-500'
            }
            ${disabled || processing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-800/50'}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          role="button"
          tabIndex={disabled || processing ? -1 : 0}
          aria-label="Upload image file"
          aria-busy={processing}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled && !processing) {
              e.preventDefault();
              document.getElementById('file-input')?.click();
            }
          }}
        >
          <input
            id="file-input"
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleInputChange}
            disabled={disabled || processing}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            aria-describedby="file-upload-description"
          />
          
          <div className="space-y-4">
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${
              processing ? 'bg-purple-500/20 animate-pulse' : 'bg-gray-700'
            }`}>
              <Upload className={`h-6 w-6 ${processing ? 'text-purple-400 animate-bounce' : 'text-gray-400'}`} />
            </div>
            
            <div>
              <p className="text-lg font-medium text-white mb-2">
                {processing ? 'Processing image...' : 'Upload your image'}
              </p>
              <p id="file-upload-description" className="text-sm text-gray-400">
                Drag and drop or click to select • PNG/JPG • Max 10MB
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative group">
          <img
            src={uploadedImage}
            alt="Uploaded preview"
            className="w-full h-64 object-cover rounded-xl border border-gray-700"
          />
          <button
            onClick={onRemoveImage}
            disabled={disabled}
            className="absolute top-2 right-2 p-2 bg-gray-900/80 hover:bg-red-600/80 
                     text-white rounded-full transition-colors opacity-0 group-hover:opacity-100
                     focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500
                     focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50"
            aria-label="Remove uploaded image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg" role="alert">
          <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
};