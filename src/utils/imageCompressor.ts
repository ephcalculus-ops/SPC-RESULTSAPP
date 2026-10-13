/**
 * Utility to compress and resize passport photos locally before saving to localStorage
 * Standard passport aspect ratio is roughly 35mm x 45mm (approx 1:1.2).
 * Compressing to 300x360 px at 85% JPEG quality reduces typical 3MB-10MB camera files
 * down to just ~15-25 KB, ensuring lightning-fast rendering and preventing localStorage quota overflow.
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export async function compressPassportImage(
  fileOrBlob: File | Blob,
  options: CompressOptions = {}
): Promise<string> {
  const { maxWidth = 300, maxHeight = 360, quality = 0.82 } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Failed to read local image file.'));
    };

    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => {
        reject(new Error('Invalid image file format.'));
      };

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Target passport ratio is approx 300:360 (5:6)
          const targetRatio = maxWidth / maxHeight;
          const currentRatio = width / height;

          let sourceX = 0;
          let sourceY = 0;
          let sourceWidth = width;
          let sourceHeight = height;

          // Center crop to match passport ratio if significantly different
          if (currentRatio > targetRatio) {
            // Wider than target ratio: crop sides
            sourceWidth = height * targetRatio;
            sourceX = (width - sourceWidth) / 2;
          } else if (currentRatio < targetRatio) {
            // Taller than target ratio: crop slightly more from bottom for portraits
            sourceHeight = width / targetRatio;
            sourceY = (height - sourceHeight) * 0.25; // keep head positioned near top
          }

          canvas.width = maxWidth;
          canvas.height = maxHeight;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Unable to create image canvas context.'));
            return;
          }

          // Use high quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Fill neutral background in case of transparent PNG
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(0, 0, maxWidth, maxHeight);

          // Draw cropped & scaled image
          ctx.drawImage(
            img,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            maxWidth,
            maxHeight
          );

          // Export as compressed JPEG
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(fileOrBlob);
  });
}

/**
 * Validates whether an uploaded local file is a valid image under acceptable size limits
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type.toLowerCase()) && !file.type.startsWith('image/')) {
    return {
      valid: false,
      error: 'Please choose a valid image file (JPG, PNG, or WebP).',
    };
  }

  // 15 MB max raw input size before compression
  if (file.size > 15 * 1024 * 1024) {
    return {
      valid: false,
      error: 'File size exceeds 15MB. Please choose a smaller photo.',
    };
  }

  return { valid: true };
}
