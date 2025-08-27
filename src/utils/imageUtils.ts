export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_IMAGE_DIMENSION = 1920;

export const validateImageFile = (file: File): string | null => {
  if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
    return 'Please upload a PNG or JPG file';
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return 'File size must be less than 10MB';
  }
  
  return null;
};

export const downscaleImage = (file: File, maxDim: number = MAX_IMAGE_DIMENSION): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Cannot get canvas context'));
      return;
    }
    
    img.onload = () => {
      const { width, height } = img;
      
      // Calculate new dimensions while maintaining aspect ratio
      let newWidth = width;
      let newHeight = height;
      
      if (width > maxDim || height > maxDim) {
        const aspectRatio = width / height;
        
        if (width > height) {
          newWidth = maxDim;
          newHeight = Math.round(maxDim / aspectRatio);
        } else {
          newHeight = maxDim;
          newWidth = Math.round(maxDim * aspectRatio);
        }
      }
      
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      // Validate final size (rough estimate: base64 is ~1.37x original)
      const estimatedSize = (dataUrl.length * 0.75); // Convert base64 to bytes
      if (estimatedSize > MAX_FILE_SIZE) {
        reject(new Error('Processed image is still too large. Please use a smaller image.'));
        return;
      }
      
      resolve(dataUrl);
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

export const getImageDimensions = (dataUrl: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => reject(new Error('Failed to get image dimensions'));
    img.src = dataUrl;
  });
};