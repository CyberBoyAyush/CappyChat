/**
 * Cloudinary Client Service
 * 
 * Client-side utilities for Cloudinary operations.
 * This module can be safely imported on the client side.
 */

export class CloudinaryClientService {
  /**
   * Get optimized image URL using URL transformations
   */
  static getOptimizedImageUrl(url: string, options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
  }): string {
    const { width, height, quality = 80, format = 'auto' } = options || {};
    
    // Build transformation string
    const transformations = [];
    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`);
    transformations.push(`c_fit`); // Fit within dimensions
    transformations.push(`q_${quality}`);
    transformations.push(`f_${format}`);
    
    const transformationString = transformations.join(',');
    
    // Insert transformation into Cloudinary URL
    if (url.includes('/upload/')) {
      return url.replace('/upload/', `/upload/${transformationString}/`);
    }
    
    return url;
  }

  /**
   * Extract public ID from Cloudinary URL
   */
  static extractPublicId(url: string): string | null {
    try {
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
      return match ? match[1] : null;
    } catch (error) {
      console.error('Error extracting public ID:', error);
      return null;
    }
  }

  /**
   * Check if URL is a Cloudinary URL
   */
  static isCloudinaryUrl(url: string): boolean {
    return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
  }
}

export default CloudinaryClientService;
