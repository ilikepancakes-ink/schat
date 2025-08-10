import { initIO } from '@/lib/socket-io';

// This API route initializes Socket.IO server on the Next.js HTTP server.
// It responds immediately but ensures a single io instance is attached.
export default function handler(req: any, res: any) {
  if (!res.socket) {
    res.status(500).end();
    return;
  }

  // Initialize IO once and reuse across hot reloads
  if (!(res.socket as any).server.io) {
    const io = initIO((res.socket as any).server);
    ;(res.socket as any).server.io = io;
  }
  res.end();
}

export const config = {
  api: {
    bodyParser: false, // Disallow body parsing to allow upgrades
  },
};

