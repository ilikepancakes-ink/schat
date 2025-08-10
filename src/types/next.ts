import type { Server as HTTPServer } from 'http';
import type { Socket } from 'net';

export interface NextApiResponseServerIO extends NextApiResponse {
  socket: Socket & {
    server: HTTPServer & {
      io?: any;
    };
  };
}

export interface NextApiResponse {}

