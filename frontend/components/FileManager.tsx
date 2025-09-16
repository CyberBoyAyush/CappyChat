/**
 * FileManager Component
 *
 * Displays and manages user uploaded files.
 * Shows files in a grid with options to view, download, and delete.
 */

import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Download,
  Trash2,
  FileImage,
  FileText,
  Loader2,
  HardDrive,
  Calendar,
  Eye,
  ImageIcon,
  AlertTriangle,
  File,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "../contexts/AuthContext";

// Helper function to get file icon and theme-aware color
const getFileIcon = (fileType: string) => {
  switch (fileType) {
    case "image":
      return { icon: FileImage, color: "text-primary" };
    case "pdf":
      return { icon: FileText, color: "text-primary" };
    case "text":
      return { icon: FileText, color: "text-primary" };
    case "document":
      return { icon: File, color: "text-primary" };
    default:
      return { icon: File, color: "text-muted-foreground" };
  }
};

interface UserFile {
  id: string;
  filename: string;
  originalName: string;
  fileType: "image" | "pdf" | "text" | "document";
  mimeType: string;
  size: number;
  url: string;
  publicId: string;
  createdAt: Date;
  messageId: string;
  threadId: string;
  uploadedAt: Date;
}

interface FileManagerProps {
  className?: string;
}

// File Delete Confirmation Dialog Component
interface FileDeleteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  file: UserFile | null;
  onConfirm: () => void;
  isDeleting: boolean;
}

const FileDeleteDialog = ({
  isOpen,
  onOpenChange,
  file,
  onConfirm,
  isDeleting,
}: FileDeleteDialogProps) => {
  if (!file) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border shadow-lg bg-background">
        <DialogHeader className="space-y-4 pb-2">
          <div className="flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 border border-destructive/30">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <DialogTitle className="text-lg font-semibold text-foreground">
              Delete File?
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              This action cannot be undone. The file will be permanently removed
              from your account.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="rounded-lg bg-secondary/40 border border-border p-4 my-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-2">
              {(() => {
                const { icon: IconComponent, color } = getFileIcon(file.fileType);
                return <IconComponent className={`w-4 h-4 ${color}`} />;
              })()}
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {file.fileType}
              </span>
            </div>
            <span className="text-xs text-muted-foreground ml-auto">
              {formatFileSize(file.size)}
            </span>
          </div>
          <p className="text-sm font-medium text-foreground break-all">
            {file.originalName}
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <Calendar className="w-3 h-3" />
            <span>Uploaded {format(file.uploadedAt, "MMM d, yyyy")}</span>
          </div>
        </div>

        <div className="rounded-lg bg-destructive/5 border border-destructive/30 p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <div className="text-xs text-destructive">
              <p className="font-medium">This action is permanent</p>
              <p className="mt-1">
                The file will be completely removed and cannot be recovered.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3 pt-4 flex-col sm:flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="w-full sm:w-auto sm:flex-1 h-10 font-medium border-border hover:bg-accent hover:text-accent-foreground transition-all duration-200"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="w-full sm:w-auto sm:flex-1 h-10 font-medium bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-sm transition-all duration-200 gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete File"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Bulk Delete Images Confirmation Dialog Component
interface BulkDeleteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  imageCount: number;
  totalSize: number;
  onConfirm: () => void;
  isDeleting: boolean;
}

const BulkDeleteDialog = ({
  isOpen,
  onOpenChange,
  imageCount,
  totalSize,
  onConfirm,
  isDeleting,
}: BulkDeleteDialogProps) => {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border shadow-lg bg-background">
        <DialogHeader className="space-y-4 pb-2">
          <div className="flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 border border-destructive/30">
              <ImageIcon className="h-5 w-5 text-destructive" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <DialogTitle className="text-lg font-semibold text-foreground">
              Delete All Images?
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              This will permanently remove all your uploaded images. This action
              cannot be undone.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="rounded-lg bg-secondary/40 border border-border p-4 my-2">
          <div className="flex items-center gap-2 mb-2">
            <ImageIcon className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Images to Delete
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {imageCount} {imageCount === 1 ? "image" : "images"}
            </p>
            <p className="text-xs text-muted-foreground">
              Total size: {formatFileSize(totalSize)}
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-destructive/5 border border-destructive/30 p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <div className="text-xs text-destructive">
              <p className="font-medium">
                This action is permanent and irreversible
              </p>
              <p className="mt-1">
                All {imageCount} images will be completely removed from your
                account and cannot be recovered.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3 pt-4 flex-col sm:flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="w-full sm:w-auto sm:flex-1 h-10 font-medium border-border hover:bg-accent hover:text-accent-foreground transition-all duration-200"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="w-full sm:w-auto sm:flex-1 h-10 font-medium bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-sm transition-all duration-200 gap-2"
          >
            <ImageIcon className="h-4 w-4" />
            {isDeleting ? "Deleting..." : `Delete ${imageCount} Images`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function FileManager({ className }: FileManagerProps) {
  const [files, setFiles] = useState<UserFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [totalSize, setTotalSize] = useState(0);

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<UserFile | null>(null);
  // Image preview dialog state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<UserFile | null>(null);

  const { user } = useAuth();

  // Load user files
  useEffect(() => {
    if (user?.$id) {
      loadFiles();
    }
  }, [user?.$id]);

  const loadFiles = async () => {
    if (!user?.$id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.$id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to load files");
      }

      const data = await response.json();
      setFiles(data.files || []);
      setTotalSize(data.totalSize || 0);
    } catch (error) {
      console.error("Error loading files:", error);
      toast.error("Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (file: UserFile) => {
    setFileToDelete(file);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!user?.$id || !fileToDelete) {
      toast.error("User not authenticated");
      return;
    }

    try {
      setDeleting(fileToDelete.id);
      console.log(
        `🗑️ Deleting file: ${fileToDelete.originalName} (${fileToDelete.publicId})`
      );

      const response = await fetch("/api/files", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.$id,
          publicId: fileToDelete.publicId,
          resourceType: fileToDelete.fileType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete file");
      }

      const result = await response.json();
      console.log("✅ File deletion response:", result);

      // Remove from local state and refresh from server to ensure consistency
      setFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));
      setTotalSize((prev) => prev - fileToDelete.size);

      // Close dialog and reset state
      setDeleteDialogOpen(false);
      setFileToDelete(null);

      // Refresh the file list from server to ensure consistency
      setTimeout(() => {
        console.log("🔄 Refreshing file list after deletion...");
        loadFiles();
      }, 1000); // Increased delay to ensure database updates are complete

      toast.success("File deleted successfully");
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error(
        `Failed to delete file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setDeleting(null);
    }
  };

  const handleBulkDeleteClick = () => {
    setBulkDeleteDialogOpen(true);
  };

  const handleBulkDeleteImages = async () => {
    if (!user?.$id) {
      toast.error("User not authenticated");
      return;
    }

    const imageFiles = files.filter((file) => file.fileType === "image");

    if (imageFiles.length === 0) {
      toast.error("No images found to delete");
      return;
    }

    try {
      setBulkDeleting(true);
      console.log(`🗑️ Starting bulk deletion of ${imageFiles.length} images`);

      const response = await fetch("/api/files", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.$id,
          bulkDeleteImages: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete images");
      }

      const result = await response.json();
      console.log("✅ Bulk deletion response:", result);

      // Close dialog
      setBulkDeleteDialogOpen(false);

      // Refresh the file list from server
      setTimeout(() => {
        console.log("🔄 Refreshing file list after bulk deletion...");
        loadFiles();
      }, 1500); // Longer delay for bulk operations

      toast.success(
        result.message || `Successfully deleted ${result.deletedCount} images`
      );
    } catch (error) {
      console.error("Error bulk deleting images:", error);
      toast.error(
        `Failed to delete images: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleDownload = (file: UserFile) => {
    // Create a temporary link to download the file
    const link = document.createElement("a");
    link.href = file.url;
    link.download = file.originalName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (file: UserFile) => {
    if (file.fileType === "image") {
      setPreviewFile(file);
      setPreviewOpen(true);
    } else {
      window.open(file.url, "_blank", "noopener,noreferrer");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const imageFiles = files.filter((f) => f.fileType === "image");
  const imagesTotalSize = imageFiles.reduce(
    (total, file) => total + file.size,
    0
  );

  if (!user) {
    return (
      <div className={cn("text-center py-8", className)}>
        <FileImage className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          Please log in to view your files
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center py-8", className)}>
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Loading files...
        </span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with stats */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h4 className="text-sm font-medium">Your Uploaded Files</h4>
          <p className="text-xs text-muted-foreground">
            {files.length} files • {formatFileSize(totalSize)} total
          </p>
        </div>
        <div className="md:flex items-center justify-end gap-2">
          {/* Delete All Images Button */}
          {imageFiles.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkDeleteClick}
              disabled={bulkDeleting || loading}
              className="text-xs text-destructive px-0 hover:text-destructive border-border hover:bg-destructive/10"
            >
              {bulkDeleting ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <ImageIcon className="w-3 h-3 mr-1" />
                  Delete All Images ({imageFiles.length})
                </>
              )}
            </Button>
          )}
          <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
            <HardDrive className="w-4 h-4" />
            <span>{formatFileSize(totalSize)}</span>
          </div>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="text-center py-8">
          <FileImage className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No files uploaded yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Files you upload in conversations will appear here
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {files.map((file) => (
            <div
              key={file.id}
              className="border rounded-lg p-3 bg-card hover:shadow-sm transition-shadow"
            >
              {/* File icon and type */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {(() => {
                    const { icon: IconComponent, color } = getFileIcon(file.fileType);
                    return <IconComponent className={`w-5 h-5 ${color}`} />;
                  })()}
                  <span className="text-xs font-medium text-muted-foreground uppercase">
                    {file.fileType}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </span>
              </div>

              {/* File name */}
              <div className="mb-2">
                <p
                  className="text-sm font-medium truncate"
                  title={file.originalName}
                >
                  {file.originalName}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Calendar className="w-3 h-3" />
                  <span>{format(file.uploadedAt, "MMM d, yyyy")}</span>
                </div>
              </div>

              {/* Image preview for images */}
              {file.fileType === "image" && (
                <button
                  type="button"
                  onClick={() => handleView(file)}
                  className="mb-3 group block relative rounded border overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <img
                    src={file.url}
                    alt={file.originalName}
                    className="w-full h-20 object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                  <span className="pointer-events-none absolute inset-0 ring-0 group-hover:ring-2 ring-inset ring-ring/40 rounded"></span>
                </button>
              )}

              {/* Action buttons */}
              <div className="flex gap-1">
                {file.fileType !== "image" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleView(file)}
                    disabled={bulkDeleting}
                    className="flex-1 h-8 text-xs"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(file)}
                  disabled={bulkDeleting}
                  className="flex-1 h-8 text-xs"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteClick(file)}
                  disabled={deleting === file.id || bulkDeleting}
                  className="h-8 text-xs text-destructive hover:text-destructive border-border hover:bg-destructive/10"
                >
                  {deleting === file.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete File Confirmation Dialog */}
      <FileDeleteDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        file={fileToDelete}
        onConfirm={handleDelete}
        isDeleting={deleting === fileToDelete?.id}
      />

      {/* Bulk Delete Images Confirmation Dialog */}
      <BulkDeleteDialog
        isOpen={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        imageCount={imageFiles.length}
        totalSize={imagesTotalSize}
        onConfirm={handleBulkDeleteImages}
        isDeleting={bulkDeleting}
      />

      {/* Image Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-3xl bg-background border-border p-0 overflow-hidden">
          <button
            type="button"
            onClick={() => setPreviewOpen(false)}
            className="absolute top-3 right-3 inline-flex items-center justify-center h-8 w-8 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            aria-label="Close preview"
          >
            <X className="h-4 w-4" />
          </button>
          {previewFile && (
            <div className="max-h-[85vh] w-full flex items-center justify-center bg-card">
              <img
                src={previewFile.url}
                alt={previewFile.originalName}
                className="max-h-[85vh] w-auto object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper function needs to be accessible by dialog components
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
