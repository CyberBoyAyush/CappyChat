/**
 * File Upload API Route
 *
 * Handles file uploads to Cloudinary for images and PDFs.
 * Validates files and returns attachment metadata.
 */

import { NextRequest, NextResponse } from 'next/server';
import { CloudinaryService } from '@/lib/cloudinary';
import {
  createBetterStackLogger,
  logApiRequestStart,
  logApiRequestSuccess,
  logApiRequestError,
  logValidationError,
  logFileOperation,
  flushLogs,
} from '@/lib/betterstack-logger';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const logger = createBetterStackLogger('upload');

  try {
    // Parse form data
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    // Log request start
    await logApiRequestStart(logger, '/api/upload', {
      fileCount: files.length,
    });

    if (!files || files.length === 0) {
      await logValidationError(logger, '/api/upload', 'files', 'No files provided');
      await flushLogs(logger);
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Validate file count (max 5 files per upload)
    if (files.length > 5) {
      await logValidationError(logger, '/api/upload', 'fileCount', 'Maximum 5 files allowed per upload');
      await flushLogs(logger);
      return NextResponse.json(
        { error: 'Maximum 5 files allowed per upload' },
        { status: 400 }
      );
    }

    // Upload files to Cloudinary
    const uploadResults = await CloudinaryService.uploadFiles(files);

    // Check for any upload failures
    const failures = uploadResults.filter(result => !result.success);
    const successes = uploadResults.filter(result => result.success);

    if (failures.length > 0 && successes.length === 0) {
      // All uploads failed
      await logApiRequestError(logger, '/api/upload', new Error('All file uploads failed'), {
        fileCount: files.length,
        failures: failures.length,
      });
      await flushLogs(logger);
      return NextResponse.json(
        { error: 'All file uploads failed', details: failures.map(f => f.error) },
        { status: 500 }
      );
    }

    // Log file operation
    await logFileOperation(logger, 'upload', {
      filesUploaded: successes.length,
      filesFailed: failures.length,
      totalSize: files.reduce((sum, f) => sum + f.size, 0),
    });

    // Log success
    await logApiRequestSuccess(logger, '/api/upload', {
      filesUploaded: successes.length,
      filesFailed: failures.length,
    });
    await flushLogs(logger);

    // Return results
    return NextResponse.json({
      success: true,
      attachments: successes.map(result => result.attachment),
      failures: failures.length > 0 ? failures.map(f => f.error) : undefined,
    });

  } catch (error) {
    console.error('Upload API error:', error);
    await logApiRequestError(logger, '/api/upload', error);
    await flushLogs(logger);
    return NextResponse.json(
      { error: 'Internal server error during file upload' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
