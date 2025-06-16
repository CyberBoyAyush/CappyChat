/**
 * Cloudinary Service
 *
 * Handles file uploads to Cloudinary for images and PDFs.
 * Provides secure upload functionality with validation and error handling.
 * This module is server-side only.
 */

import { FileAttachment } from './appwriteDB';

// Dynamic import for server-side only
let cloudinary: any = null;

async function getCloudinary() {
  if (!cloudinary) {
    const { v2 } = await import('cloudinary');
    v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    cloudinary = v2;
  }
  return cloudinary;
}

export interface UploadResult {
  success: boolean;
  attachment?: FileAttachment;
  error?: string;
}

export class CloudinaryService {
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  private static readonly ALLOWED_PDF_TYPE = 'application/pdf';

  /**
   * Validate file before upload
   */
  private static validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: 'File size must be less than 5MB' };
    }

    // Check file type
    const isImage = this.ALLOWED_IMAGE_TYPES.includes(file.type);
    const isPdf = file.type === this.ALLOWED_PDF_TYPE;

    if (!isImage && !isPdf) {
      return { valid: false, error: 'Only images (JPEG, PNG, GIF, WebP) and PDF files are allowed' };
    }

    return { valid: true };
  }

  /**
   * Upload file to Cloudinary
   */
  static async uploadFile(file: File): Promise<UploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Convert file to base64
      const base64 = await this.fileToBase64(file);

      // Determine resource type and folder
      const isImage = this.ALLOWED_IMAGE_TYPES.includes(file.type);
      const resourceType = isImage ? 'image' : 'raw';
      const folder = isImage ? 'atchat/images' : 'atchat/documents';

      // Get Cloudinary instance
      const cloudinary = await getCloudinary();

      // Upload to Cloudinary with public access
      const uploadResult = await cloudinary.uploader.upload(base64, {
        resource_type: resourceType,
        folder: folder,
        public_id: `${Date.now()}_${file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9.-]/g, '_')}`,
        overwrite: false,
        unique_filename: true,
        access_mode: 'public', // Ensure public access
        type: 'upload', // Ensure it's an upload type
      });

      // Create attachment object
      const attachment: FileAttachment = {
        id: `attachment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        filename: uploadResult.public_id,
        originalName: file.name,
        fileType: isImage ? 'image' : 'pdf',
        mimeType: file.type,
        size: file.size,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        createdAt: new Date(),
      };

      return { success: true, attachment };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      return { success: false, error: 'Failed to upload file. Please try again.' };
    }
  }

  /**
   * Upload multiple files
   */
  static async uploadFiles(files: File[]): Promise<UploadResult[]> {
    const uploadPromises = files.map(file => this.uploadFile(file));
    return Promise.all(uploadPromises);
  }

  /**
   * Delete file from Cloudinary
   */
  static async deleteFile(publicId: string, resourceType: 'image' | 'raw' = 'image'): Promise<boolean> {
    try {
      const cloudinary = await getCloudinary();
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      return true;
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      return false;
    }
  }

  /**
   * Convert File to base64 (server-side)
   */
  private static async fileToBase64(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    return `data:${file.type};base64,${base64}`;
  }

  /**
   * Get optimized image URL
   */
  static async getOptimizedImageUrl(publicId: string, options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
  }): Promise<string> {
    const { width, height, quality = 80, format = 'auto' } = options || {};

    let transformation = `f_${format},q_${quality}`;
    if (width) transformation += `,w_${width}`;
    if (height) transformation += `,h_${height}`;

    const cloudinary = await getCloudinary();
    return cloudinary.url(publicId, {
      transformation: transformation,
      secure: true,
    });
  }

  /**
   * Get file info from Cloudinary
   */
  static async getFileInfo(publicId: string, resourceType: 'image' | 'raw' = 'image') {
    try {
      const cloudinary = await getCloudinary();
      const result = await cloudinary.api.resource(publicId, { resource_type: resourceType });
      return result;
    } catch (error) {
      console.error('Error getting file info:', error);
      return null;
    }
  }
}

export default CloudinaryService;
