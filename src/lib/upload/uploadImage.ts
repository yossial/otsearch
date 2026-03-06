import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

export async function uploadImage(
  buffer: Buffer,
  mimeType: string,
  folder = 'avatars'
): Promise<string> {
  const bucket = process.env.S3_BUCKET_NAME;
  const region = process.env.S3_REGION ?? 'eu-west-1';

  if (bucket) {
    const key = `${folder}/${randomUUID()}.${mimeType.split('/')[1] ?? 'jpg'}`;
    const client = new S3Client({ region });
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      })
    );
    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  }

  // Fallback: base64 data URL
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}
