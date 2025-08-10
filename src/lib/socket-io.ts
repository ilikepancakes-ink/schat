import { Server, Socket } from 'socket.io';
import { validateSession } from '@/lib/auth';

// Keep a global reference to avoid multiple instances during hot-reload
declare global {
  // eslint-disable-next-line no-var
  var _io: Server | undefined;
}

export function getIO(): Server | null {
  return global._io ?? null;
}

export function initIO(server: any): Server {
  if (global._io) return global._io;

  const io = new Server(server, {
    path: '/api/socket',
    cors: {
      origin: true,
      credentials: true,
    },
    // Only websockets in production; polling fallback can be enabled if needed
    transports: ['websocket'] as any,
  });

  // Auth middleware
  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie || '';
      const tokenFromCookie = (cookieHeader.match(/(?:^|; )auth-token=([^;]+)/) || [])[1];
      const tokenFromAuth = (socket.handshake as any).auth?.token;
      const token = tokenFromAuth || tokenFromCookie;

      if (!token) return next(new Error('Unauthorized'));

      const session = await validateSession(token);
      if (!session.valid || !session.user) return next(new Error('Unauthorized'));

      (socket.data as any).user = session.user;
      return next();
    } catch (err) {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket.data as any).user;

    socket.on('join_chatroom', (chatroomId: string) => {
      const room = `chatroom:${chatroomId}`;
      socket.join(room);
      io.to(room).emit('user_joined', { userId: user.id, chatroomId });
    });

    socket.on('leave_chatroom', (chatroomId: string) => {
      const room = `chatroom:${chatroomId}`;
      socket.leave(room);
      io.to(room).emit('user_left', { userId: user.id, chatroomId });
    });

    // Generic WebRTC signaling relay within a chatroom room
    socket.on('call:signal', (payload: any) => {
      try {
        const chatroomId = payload?.chatroomId;
        if (!chatroomId) return;
        const room = `chatroom:${chatroomId}`;
        // Relay to everyone else in the room
        socket.to(room).emit('call:signal', { ...payload, fromUserId: user.id });
      } catch (_) {
        // ignore
      }
    });

    socket.on('disconnect', () => {
      // No-op for now
    });
  });

  global._io = io;
  return io;
}

