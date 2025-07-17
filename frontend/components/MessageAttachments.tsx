/**
 * MessageAttachments Component
 * 
 * Displays file attachments in chat messages.
 * Handles image previews and PDF download links.
 */

import React from 'react';
import { FileAttachment } from '@/lib/appwriteDB';
import { Button } from './ui/button';
import { Download, FileImage, FileText, ExternalLink, File } from 'lucide-react';
import { cn } from '@/lib/utils';
import CloudinaryClientService from '@/lib/cloudinary-client';

interface MessageAttachmentsProps {
  attachments: FileAttachment[];
  className?: string;
}

export default function MessageAttachments({ attachments, className }: MessageAttachmentsProps) {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  const handleDownload = async (attachment: FileAttachment) => {
    try {
      const response = await fetch(attachment.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab
      window.open(attachment.url, '_blank');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getOptimizedImageUrl = (attachment: FileAttachment) => {
    if (attachment.fileType === 'image') {
      return CloudinaryClientService.getOptimizedImageUrl(attachment.url, {
        width: 400,
        height: 300,
        quality: 80,
      });
    }
    return attachment.url;
  };

  const renderImageAttachment = (attachment: FileAttachment) => (
    <div key={attachment.id} className="relative group">
      <div className="relative overflow-hidden rounded-lg border bg-muted">
        <img
          src={getOptimizedImageUrl(attachment)}
          alt={attachment.originalName}
          className="max-w-full h-auto max-h-64 object-contain cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => window.open(attachment.url, '_blank')}
          loading="lazy"
        />
        
        {/* Image overlay with actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end justify-end p-2 opacity-0 group-hover:opacity-100">
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => window.open(attachment.url, '_blank')}
              className="h-7 px-2"
              title="View full size"
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleDownload(attachment)}
              className="h-7 px-2"
              title="Download"
            >
              <Download className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Image info */}
      <div className="mt-1 text-xs text-muted-foreground">
        <div className="truncate">{attachment.originalName}</div>
        <div>{formatFileSize(attachment.size)}</div>
      </div>
    </div>
  );

  const renderPdfAttachment = (attachment: FileAttachment) => (
    <div key={attachment.id} className="border rounded-lg p-3 bg-muted/50">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <FileText className="w-8 h-8 text-red-500" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{attachment.originalName}</div>
          <div className="text-xs text-muted-foreground">
            PDF • {formatFileSize(attachment.size)}
          </div>
        </div>
        
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(attachment.url, '_blank')}
            className="h-7 px-2"
            title="View PDF"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            View
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDownload(attachment)}
            className="h-7 px-2"
            title="Download PDF"
          >
            <Download className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderTextAttachment = (attachment: FileAttachment) => (
    <div key={attachment.id} className="border rounded-lg p-3 bg-muted/50">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <FileText className="w-8 h-8 text-blue-500" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{attachment.originalName}</div>
          <div className="text-xs text-muted-foreground">
            Text File • {formatFileSize(attachment.size)}
          </div>
        </div>

        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDownload(attachment)}
            className="h-7 px-2"
            title="Download text file"
          >
            <Download className="w-3 h-3 mr-1" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );

  const renderDocumentAttachment = (attachment: FileAttachment) => (
    <div key={attachment.id} className="border rounded-lg p-3 bg-muted/50">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <File className="w-8 h-8 text-purple-500" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{attachment.originalName}</div>
          <div className="text-xs text-muted-foreground">
            Word Document • {formatFileSize(attachment.size)}
          </div>
        </div>

        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDownload(attachment)}
            className="h-7 px-2"
            title="Download document"
          >
            <Download className="w-3 h-3 mr-1" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );

  // Separate different file types
  const images = attachments.filter(att => att.fileType === 'image');
  const pdfs = attachments.filter(att => att.fileType === 'pdf');
  const textFiles = attachments.filter(att => att.fileType === 'text');
  const documents = attachments.filter(att => att.fileType === 'document');

  return (
    <div className={cn("space-y-3", className)}>
      {/* Images */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {images.map(renderImageAttachment)}
        </div>
      )}

      {/* PDFs */}
      {pdfs.length > 0 && (
        <div className="space-y-2">
          {pdfs.map(renderPdfAttachment)}
        </div>
      )}

      {/* Text Files */}
      {textFiles.length > 0 && (
        <div className="space-y-2">
          {textFiles.map(renderTextAttachment)}
        </div>
      )}

      {/* Document Files */}
      {documents.length > 0 && (
        <div className="space-y-2">
          {documents.map(renderDocumentAttachment)}
        </div>
      )}
    </div>
  );
}
