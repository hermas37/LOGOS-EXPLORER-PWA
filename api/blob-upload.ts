import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  const body = req.body as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request: req as any,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = clientPayload ? JSON.parse(clientPayload) : {};
        if (payload.password !== process.env.ADMIN_PASSWORD) {
          throw new Error('Not authorised');
        }
        return {
          allowedContentTypes: [
            'audio/mpeg', 'audio/wav', 'audio/mp4',
            'video/mp4', 'video/quicktime', 'video/webm',
            'application/pdf',
            'image/png', 'image/jpeg', 'image/webp',
          ],
          maximumSizeInBytes: 500 * 1024 * 1024,
          addRandomSuffix: false,
          allowOverwrite: true,
          cacheControlMaxAge: 60 * 60 * 24 * 365,
          tokenPayload: JSON.stringify({ pathname }),
        };
      },
      onUploadCompleted: async () => {},
    });

    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ error: (err as Error).message });
  }
}
