import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { uploadImage } from '@/lib/upload/uploadImage';

export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only images are allowed.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum 5 MB.' }, { status: 400 });
    }

    const buffer = Buffer.from(arrayBuffer);
    const url = await uploadImage(buffer, file.type);

    return NextResponse.json({ url });
  } catch (err) {
    console.error('[POST /api/upload]', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
