import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    const authResult = await validateSession(token);
    if (!authResult.valid || !authResult.user) {
      return NextResponse.json({
        success: false,
        error: 'Invalid session',
      }, { status: 401 });
    }

    // Get the form data from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const expires = formData.get('expires') as string || '7d';
    const maxDownloads = formData.get('maxDownloads') as string || '10';
    const autoDelete = formData.get('autoDelete') as string || 'true';

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided',
      }, { status: 400 });
    }

    // Validate file size (max 100MB for file.io)
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json({
        success: false,
        error: 'File too large (max 100MB)',
      }, { status: 400 });
    }

    // Create form data for file.io
    const fileIOFormData = new FormData();
    fileIOFormData.append('file', file);
    fileIOFormData.append('expires', expires);
    fileIOFormData.append('maxDownloads', maxDownloads);
    fileIOFormData.append('autoDelete', autoDelete);

    // Upload to file.io
    const response = await fetch('https://file.io/', {
      method: 'POST',
      body: fileIOFormData,
    });

    if (!response.ok) {
      throw new Error(`File.io upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`File.io upload failed: ${data.message || 'Unknown error'}`);
    }

    // Return the file.io response
    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        key: data.key,
        name: data.name,
        link: data.link,
        expires: data.expires,
        expiry: data.expiry,
        downloads: data.downloads,
        maxDownloads: data.maxDownloads,
        autoDelete: data.autoDelete,
        size: data.size,
        mimeType: data.mimeType,
        created: data.created,
        modified: data.modified,
      },
    });

  } catch (error) {
    console.error('File upload proxy error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }, { status: 500 });
  }
}
