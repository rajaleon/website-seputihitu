import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { getSupabase } from '@/lib/server/supabase';

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return Response.json({ success: false, message: 'File wajib diupload' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return Response.json({ success: false, message: 'Format file harus JPG, PNG, WebP, atau GIF' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return Response.json({ success: false, message: 'Ukuran file maksimal 5MB' }, { status: 400 });
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const folder = formData.get('folder') || 'images';
    const path = `${folder}/${filename}`;

    // Upload to Supabase Storage
    const supabase = getSupabase();
    const buffer = Buffer.from(await file.arrayBuffer());

    const { data, error } = await supabase.storage
      .from('seputihitu')
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('[Upload error]', error);
      return Response.json({ success: false, message: 'Gagal upload: ' + error.message }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('seputihitu')
      .getPublicUrl(path);

    return Response.json({
      success: true,
      message: 'File berhasil diupload',
      data: {
        url: urlData.publicUrl,
        path: path,
        filename: filename,
      },
    });
  } catch (err: any) {
    console.error('[POST /api/upload]', err);
    return Response.json({ success: false, message: err.message || 'Terjadi kesalahan' }, { status: 500 });
  }
}
