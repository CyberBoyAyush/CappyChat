"use client";

import React, { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { FileText } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFThumbnailProps {
  url: string;
  alt?: string;
  className?: string;
}

export const PDFThumbnail: React.FC<PDFThumbnailProps> = ({
  url,
  alt = "PDF preview",
  className = "",
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const onLoadSuccess = () => {
    setLoading(false);
    setError(false);
  };

  const onLoadError = () => {
    setLoading(false);
    setError(true);
  };

  if (error) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={`relative ${className} overflow-hidden`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
          <FileText className="h-8 w-8 text-muted-foreground animate-pulse" />
        </div>
      )}
      <div className="w-full h-full flex items-center justify-center pdf-thumbnail-container">
        <Document
          file={url}
          onLoadSuccess={onLoadSuccess}
          onLoadError={onLoadError}
          loading=""
          error=""
        >
          <Page
            pageNumber={1}
            width={80}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
      </div>
    </div>
  );
};
