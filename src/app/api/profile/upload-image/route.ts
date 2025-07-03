import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { supabaseAdmin, supabase } from '@/lib/supabase';

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

    const formData = await request.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json({
        success: false,
        error: 'No image provided',
      }, { status: 400 });
    }

    // Validate file type
    if (!image.type.startsWith('image/')) {
      return NextResponse.json({
        success: false,
        error: 'File must be an image',
      }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (image.size > 5 * 1024 * 1024) {
      return NextResponse.json({
        success: false,
        error: 'Image must be less than 5MB',
      }, { status: 400 });
    }

    const userId = authResult.user.id;
    const fileExt = image.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `profile-pictures/${fileName}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await image.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: image.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({
        success: false,
        error: 'Failed to upload image',
      }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const imageUrl = urlData.publicUrl;

    // Update user profile with new image URL
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        profile_picture_url: imageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Failed to update profile',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      message: 'Profile picture updated successfully',
    });

  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
