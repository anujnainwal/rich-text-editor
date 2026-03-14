import { EditorOptions } from '../Editor';

export interface UploadResult {
  imageUrl: string;
  imageId?: string;
}

export class ImageUploader {
  /**
   * Compresses an image file using HTML5 Canvas.
   */
  static async compressImage(file: File, maxSizeMB: number): Promise<File | Blob> {
    return new Promise((resolve, reject) => {
      // If file is already small enough, skip compression
      if (file.size <= maxSizeMB * 1024 * 1024 && file.type === 'image/webp') {
        return resolve(file);
      }

      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Max dimensions to prevent massive canvas crashes
        const MAX_DIM = 2000;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          return reject(new Error('Failed to get canvas context'));
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Export as WebP for best compression/quality ratio
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas toBlob failed'));
            }
          },
          'image/webp',
          0.8 // 80% quality is professional standard
        );

        URL.revokeObjectURL(img.src);
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image for compression'));
      };
    });
  }

  /**
   * Uploads a file based on editor configuration.
   */
  static async uploadFile(file: File | Blob, options: EditorOptions): Promise<UploadResult | null> {
    const filename = file instanceof File ? file.name : 'upload.webp';

    // 1. Try Custom Upload Endpoint
    if (options.imageEndpoints?.upload) {
      const formData = new FormData();
      formData.append('file', file, filename);

      try {
        const response = await fetch(options.imageEndpoints.upload, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          return {
            imageUrl: data.imageUrl,
            imageId: data.imageId
          };
        }
        console.warn('Custom upload endpoint returned an error, falling back.');
      } catch (error) {
        console.error('Custom upload failed:', error);
      }
    }

    // 2. Try Cloudinary Fallback
    if (options.cloudinaryFallback) {
      const { cloudName, uploadPreset } = options.cloudinaryFallback;
      const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

      const formData = new FormData();
      formData.append('file', file, filename);
      formData.append('upload_preset', uploadPreset);

      try {
        const response = await fetch(url, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          return {
            imageUrl: data.secure_url
          };
        }
        console.warn('Cloudinary upload failed, falling back.');
      } catch (error) {
        console.error('Cloudinary fallback failed:', error);
      }
    }

    // No upload method configured or all failed
    return null;
  }
}
