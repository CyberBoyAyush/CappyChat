/**
 * FileUpload Component
 * 
 * Handles file upload functionality with drag-and-drop support.
 * Validates files and uploads them to Cloudinary via API.
 */

import React, { useCallback, useState, useRef } from 'react';
import { FileAttachment } from '@/lib/appwriteDB';
import { Button } from './ui/button';
import { Paperclip, X, Upload, FileImage, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FileUploadProps {
  onFilesUploaded: (attachments: FileAttachment[]) => void;
  disabled?: boolean;
  className?: string;
}

interface UploadingFile {
  file: File;
  progress: number;
  error?: string;
}

export default function FileUpload({ onFilesUploaded, disabled, className }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf'
    ];

    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 5MB' };
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Only images (JPEG, PNG, GIF, WebP) and PDF files are allowed' };
    }

    return { valid: true };
  };

  const uploadFiles = async (files: File[]) => {
    // Validate files
    const validFiles: File[] = [];
    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.valid) {
        toast.error(`${file.name}: ${validation.error}`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Initialize uploading state
    const uploadingFiles: UploadingFile[] = validFiles.map(file => ({
      file,
      progress: 0,
    }));
    setUploadingFiles(uploadingFiles);

    try {
      // Create form data
      const formData = new FormData();
      validFiles.forEach(file => {
        formData.append('files', file);
      });

      // Upload files
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      // Handle successful uploads
      if (result.attachments && result.attachments.length > 0) {
        onFilesUploaded(result.attachments);
        toast.success(`${result.attachments.length} file(s) uploaded successfully`);
      }

      // Handle partial failures
      if (result.failures && result.failures.length > 0) {
        result.failures.forEach((error: string) => {
          toast.error(`Upload failed: ${error}`);
        });
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files. Please try again.');
    } finally {
      setUploadingFiles([]);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    uploadFiles(fileArray);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  }, [disabled]);

  const handleButtonClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <FileImage className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn("relative", className)}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={disabled}
      />

      {/* Upload button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleButtonClick}
        disabled={disabled || uploadingFiles.length > 0}
        className="relative"
        title="Upload files (Images and PDFs)"
      >
        {uploadingFiles.length > 0 ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Paperclip className="w-4 h-4" />
        )}
      </Button>

      {/* Drag and drop overlay */}
      {isDragOver && (
        <div
          className="fixed inset-0 bg-primary/10 backdrop-blur-sm z-50 flex items-center justify-center"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="bg-background border-2 border-dashed border-primary rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 mx-auto mb-4 text-primary" />
            <p className="text-lg font-medium">Drop files here to upload</p>
            <p className="text-sm text-muted-foreground mt-2">
              Images (JPEG, PNG, GIF, WebP) and PDF files up to 5MB
            </p>
          </div>
        </div>
      )}

      {/* Upload progress */}
      {uploadingFiles.length > 0 && (
        <div className="absolute bottom-full mb-2 left-0 bg-background border rounded-lg p-3 shadow-lg min-w-64">
          <div className="text-sm font-medium mb-2">Uploading files...</div>
          {uploadingFiles.map((uploadingFile, index) => (
            <div key={index} className="flex items-center gap-2 mb-2 last:mb-0">
              {getFileIcon(uploadingFile.file)}
              <div className="flex-1 min-w-0">
                <div className="text-xs truncate">{uploadingFile.file.name}</div>
                <div className="text-xs text-muted-foreground">
                  {formatFileSize(uploadingFile.file.size)}
                </div>
              </div>
              <Loader2 className="w-3 h-3 animate-spin" />
            </div>
          ))}
        </div>
      )}

      {/* Global drag handlers */}
      <div
        className="fixed inset-0 pointer-events-none"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      />
    </div>
  );
}
