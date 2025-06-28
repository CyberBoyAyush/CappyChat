/**
 * FileManager Component
 * 
 * Displays and manages user uploaded files.
 * Shows files in a grid with options to view, download, and delete.
 */

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import {
  Download,
  Trash2,
  FileImage,
  FileText,
  ExternalLink,
  Loader2,
  HardDrive,
  Calendar,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

interface UserFile {
  id: string;
  filename: string;
  originalName: string;
  fileType: 'image' | 'pdf';
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

export default function FileManager({ className }: FileManagerProps) {
  const [files, setFiles] = useState<UserFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [totalSize, setTotalSize] = useState(0);
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
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.$id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to load files');
      }

      const data = await response.json();
      setFiles(data.files || []);
      setTotalSize(data.totalSize || 0);
    } catch (error) {
      console.error('Error loading files:', error);
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (file: UserFile) => {
    if (!user?.$id) {
      toast.error('User not authenticated');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${file.originalName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(file.id);
      console.log(`🗑️ Deleting file: ${file.originalName} (${file.publicId})`);

      const response = await fetch('/api/files', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.$id,
          publicId: file.publicId,
          resourceType: file.fileType
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete file');
      }

      const result = await response.json();
      console.log('✅ File deletion response:', result);

      // Remove from local state and refresh from server to ensure consistency
      setFiles(prev => prev.filter(f => f.id !== file.id));
      setTotalSize(prev => prev - file.size);

      // Refresh the file list from server to ensure consistency
      setTimeout(() => {
        console.log('🔄 Refreshing file list after deletion...');
        loadFiles();
      }, 1000); // Increased delay to ensure database updates are complete

      toast.success('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = (file: UserFile) => {
    // Create a temporary link to download the file
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.originalName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (file: UserFile) => {
    window.open(file.url, '_blank');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!user) {
    return (
      <div className={cn("text-center py-8", className)}>
        <FileImage className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Please log in to view your files</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center py-8", className)}>
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading files...</span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h4 className="text-sm font-medium">Your Uploaded Files</h4>
          <p className="text-xs text-muted-foreground">
            {files.length} files • {formatFileSize(totalSize)} total
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <HardDrive className="w-4 h-4" />
          <span>{formatFileSize(totalSize)}</span>
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
                  {file.fileType === 'image' ? (
                    <FileImage className="w-5 h-5 text-blue-500" />
                  ) : (
                    <FileText className="w-5 h-5 text-red-500" />
                  )}
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
                <p className="text-sm font-medium truncate" title={file.originalName}>
                  {file.originalName}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Calendar className="w-3 h-3" />
                  <span>{format(file.uploadedAt, 'MMM d, yyyy')}</span>
                </div>
              </div>

              {/* Image preview for images */}
              {file.fileType === 'image' && (
                <div className="mb-3">
                  <img
                    src={file.url}
                    alt={file.originalName}
                    className="w-full h-20 object-cover rounded border"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleView(file)}
                  className="flex-1 h-8 text-xs"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(file)}
                  className="flex-1 h-8 text-xs"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(file)}
                  disabled={deleting === file.id}
                  className="h-8 text-xs text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
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
    </div>
  );
}
