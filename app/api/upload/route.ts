/**
 * File Upload API Route
 * 
 * Handles file uploads to Cloudinary for images and PDFs.
 * Validates files and returns attachment metadata.
 */

import { NextRequest, NextResponse } from 'next/server';
import { CloudinaryService } from '@/lib/cloudinary';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    // Parse form data
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Validate file count (max 5 files per upload)
    if (files.length > 5) {
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
      return NextResponse.json(
        { error: 'All file uploads failed', details: failures.map(f => f.error) },
        { status: 500 }
      );
    }

    // Return results
    return NextResponse.json({
      success: true,
      attachments: successes.map(result => result.attachment),
      failures: failures.length > 0 ? failures.map(f => f.error) : undefined,
    });

  } catch (error) {
    console.error('Upload API error:', error);
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
