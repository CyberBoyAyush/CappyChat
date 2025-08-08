/**
 * Cloudinary Service
 *
 * Handles file uploads to Cloudinary for images and PDFs.
 * Provides secure upload functionality with validation and error handling.
 * This module is server-side only.
 */

import { FileAttachment } from './appwriteDB';

// Dynamic imports for server-side only
let cloudinary: any = null;
let mammoth: any = null;

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

async function getMammoth() {
  if (!mammoth) {
    mammoth = await import('mammoth');
  }
  return mammoth;
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
  private static readonly ALLOWED_TEXT_TYPES = [
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  ];

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
    const isText = this.ALLOWED_TEXT_TYPES.includes(file.type);

    if (!isImage && !isPdf && !isText) {
      return { valid: false, error: 'Only images (JPEG, PNG, GIF, WebP), PDF, text (.txt), and Word (.docx) files are allowed' };
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
      const isPdf = file.type === this.ALLOWED_PDF_TYPE;
      const isText = this.ALLOWED_TEXT_TYPES.includes(file.type);
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

      // Extract text content for text/docx files
      let textContent: string | undefined;
      if (isText) {
        textContent = await this.extractTextContent(file);
      }

      // Determine file type for attachment
      let fileType: 'image' | 'pdf' | 'text' | 'document';
      if (isImage) {
        fileType = 'image';
      } else if (isPdf) {
        fileType = 'pdf';
      } else if (file.type === 'text/plain') {
        fileType = 'text';
      } else {
        fileType = 'document'; // for .docx files
      }



      // Create attachment object
      const attachment: FileAttachment = {
        id: `attachment_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        filename: uploadResult.public_id,
        originalName: file.name,
        fileType,
        mimeType: file.type,
        size: file.size,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        createdAt: new Date(),
        textContent,
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
   * Extract text content from text/docx files
   */
  private static async extractTextContent(file: File): Promise<string> {
    try {
      if (file.type === 'text/plain') {
        // For .txt files, read content directly
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return buffer.toString('utf-8');
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // For .docx files, use mammoth to extract text
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Use buffer instead of arrayBuffer for mammoth
        const mammothLib = await getMammoth();
        const result = await mammothLib.extractRawText({ buffer });
        return result.value || '';
      }

      throw new Error('Unsupported file type for text extraction');
    } catch (error) {
      console.error('Error extracting text content:', error);
      // Return a fallback message instead of throwing
      return `[Error: Could not extract text from ${file.name}. File may be corrupted or in an unsupported format.]`;
    }
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
