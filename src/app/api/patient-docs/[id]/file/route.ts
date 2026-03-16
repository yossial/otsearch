import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { PatientDoc } from '@/lib/db/models/PatientDoc';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (!session?.user || role !== 'therapist') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  await connectDB();

  const doc = await PatientDoc.findById(id).lean();
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (doc.therapistId.toString() !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { fileUrl, mimeType } = doc;

  // ── Base64 fallback (dev / no S3) ──────────────────────────────────────────
  if (fileUrl.startsWith('data:')) {
    const base64 = fileUrl.split(',')[1] ?? '';
    const buffer = Buffer.from(base64, 'base64');
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': 'inline',
        'Content-Length': String(buffer.length),
      },
    });
  }

  // ── S3 presigned URL (production) ──────────────────────────────────────────
  const bucket = process.env.S3_BUCKET_NAME;
  const region = process.env.S3_REGION ?? 'eu-west-1';

  if (!bucket) {
    return NextResponse.json({ error: 'Storage not configured' }, { status: 500 });
  }

  // Extract key from URL: https://bucket.s3.region.amazonaws.com/key
  const key = new URL(fileUrl).pathname.slice(1); // remove leading /

  const client = new S3Client({ region });
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseContentDisposition: 'inline',
    ResponseContentType: mimeType,
  });

  const signedUrl = await getSignedUrl(client, command, { expiresIn: 900 }); // 15 min
  return NextResponse.redirect(signedUrl, 307);
}
