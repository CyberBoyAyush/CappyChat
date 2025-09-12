/**
 * FileUpload Component
 *
 * Handles file upload functionality with drag-and-drop support.
 * Validates files and uploads them to Cloudinary via API.
 */

import React, { useCallback, useState, useRef } from "react";
import { FileAttachment } from "@/lib/appwriteDB";
import { Button } from "./ui/button";
import { Paperclip, Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { devError } from "@/lib/logger";
import { LinkIcon } from "./ui/icons/LinkIcon";

interface FileUploadProps {
  onFilesUploaded: (attachments: FileAttachment[]) => void;
  disabled?: boolean;
  className?: string;
  onUploadStatusChange?: (uploadingFiles: UploadingFile[]) => void;
  acceptedFileTypes?: string;
}

export interface UploadingFile {
  file: File;
  progress: number;
  error?: string;
  status: "uploading" | "success" | "error";
}

export default function FileUpload({
  onFilesUploaded,
  disabled,
  className,
  onUploadStatusChange,
  acceptedFileTypes = "image/*,.pdf,.txt,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const maxSize = 5 * 1024 * 1024; // 5MB

    // Determine allowed types based on acceptedFileTypes prop
    let allowedTypes: string[] = [];
    let errorMessage = "";

    if (acceptedFileTypes.includes("image/png,image/jpeg,image/jpg")) {
      // Image-to-image mode: only PNG, JPEG, JPG
      allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
      errorMessage =
        "Only PNG, JPEG, and JPG images are allowed for image-to-image generation";
    } else {
      // Default mode: images, PDFs, text, and docx files
      allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
        "text/plain",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      errorMessage =
        "Only images (JPEG, PNG, GIF, WebP), PDF, text (.txt), and Word (.docx) files are allowed";
    }

    if (file.size > maxSize) {
      return { valid: false, error: "File size must be less than 5MB" };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: errorMessage,
      };
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
    const uploadingFiles: UploadingFile[] = validFiles.map((file) => ({
      file,
      progress: 0,
      status: "uploading" as const,
    }));
    setUploadingFiles(uploadingFiles);
    onUploadStatusChange?.(uploadingFiles);

    try {
      // Create form data
      const formData = new FormData();
      validFiles.forEach((file) => {
        formData.append("files", file);
      });

      // Upload files
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed");
      }

      // Show success state briefly before clearing
      const successFiles = validFiles.map((file) => ({
        file,
        progress: 100,
        status: "success" as const,
      }));
      setUploadingFiles(successFiles);
      onUploadStatusChange?.(successFiles);

      // Handle successful uploads
      if (result.attachments && result.attachments.length > 0) {
        onFilesUploaded(result.attachments);
        toast.success(
          `${result.attachments.length} file(s) uploaded successfully`
        );
      }

      // Handle partial failures
      if (result.failures && result.failures.length > 0) {
        result.failures.forEach((error: string) => {
          toast.error(`Upload failed: ${error}`);
        });
      }

      // Clear uploading state after a brief delay to show success
      setTimeout(() => {
        setUploadingFiles([]);
        onUploadStatusChange?.([]);
      }, 1500);
    } catch (error) {
      devError("Upload error:", error);

      // Show error state
      const errorFiles = validFiles.map((file) => ({
        file,
        progress: 0,
        status: "error" as const,
        error: "Upload failed",
      }));
      setUploadingFiles(errorFiles);
      onUploadStatusChange?.(errorFiles);

      toast.error("Failed to upload files. Please try again.");

      // Clear error state after delay
      setTimeout(() => {
        setUploadingFiles([]);
        onUploadStatusChange?.([]);
      }, 3000);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    uploadFiles(fileArray);
  };

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      handleFileSelect(files);
    },
    [disabled]
  );

  const handleButtonClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("relative", className)}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedFileTypes}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={disabled}
      />

      {/* Upload button - Enhanced with better visual feedback */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleButtonClick}
        disabled={disabled || uploadingFiles.length > 0}
        className={cn(
          "relative h-9 w-9 sm:h-10 sm:w-10 transition-all duration-200 mobile-touch",
          uploadingFiles.length > 0
            ? "bg-primary/10 text-primary"
            : "hover:bg-muted/80 hover:scale-105 active:scale-95"
        )}
        title={
          uploadingFiles.length > 0
            ? "Uploading files..."
            : "Upload files (Images, PDFs, text, and Word documents)"
        }
      >
        {uploadingFiles.length > 0 ? (
          <div className="relative">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            {/* Pulsing background effect */}
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
          </div>
        ) : (
          <LinkIcon className="w-4 h-4 transition-transform group-hover:rotate-12" />
        )}

        {/* Upload count indicator */}
        {uploadingFiles.length > 0 && (
          <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium animate-pulse">
            {uploadingFiles.length}
          </div>
        )}
      </Button>

      {/* Drag and drop overlay - Enhanced responsive design */}
      {isDragOver && (
        <div
          className="fixed inset-0 bg-primary/15 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="bg-background/95 backdrop-blur-sm border-2 border-dashed border-primary rounded-2xl p-6 sm:p-8 md:p-12 text-center max-w-md mx-auto shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="relative mb-4 sm:mb-6">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <Upload className="relative w-12 h-12 sm:w-16 sm:h-16 mx-auto text-primary animate-bounce" />
            </div>

            <div className="space-y-2 sm:space-y-3">
              <p className="text-lg sm:text-xl font-semibold text-foreground">
                Drop files here to upload
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Images (JPEG, PNG, GIF, WebP), PDF, text (.txt), and Word
                (.docx) files
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Maximum file size: 5MB each
              </p>
            </div>

            {/* Visual indicator */}
            <div className="mt-4 sm:mt-6 flex justify-center">
              <div className="flex space-x-1">
                <div
                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
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
