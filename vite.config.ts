import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'node:http';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'local-sync-api',
      configureServer(server) {
        const rooms = new Map<string, { schemaVersion: number; roomId: string; users: Record<string, unknown>; updatedAt: string }>();
        const normalizeRoomId = (value: string | null) =>
          String(value ?? '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9._-]+/g, '-')
            .replace(/(^-|-$)/g, '')
            .slice(0, 80);
        const emptyRoom = (roomId: string): { schemaVersion: number; roomId: string; users: Record<string, unknown>; updatedAt: string } => ({
          schemaVersion: 2,
          roomId,
          users: {},
          updatedAt: new Date().toISOString()
        });
        const send = (status: number, body: unknown, res: ServerResponse) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(body));
        };
        const readBody = (req: IncomingMessage) =>
          new Promise<Record<string, unknown>>((resolve, reject) => {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                resolve(body ? JSON.parse(body) : {});
              } catch (error) {
                reject(error);
              }
            });
            req.on('error', reject);
          });

        server.middlewares.use('/api/room', async (req, res) => {
          try {
            const url = new URL(req.url ?? '/', 'http://localhost');

            if (req.method === 'GET') {
              const roomId = normalizeRoomId(url.searchParams.get('roomId'));
              if (!roomId) {
                return send(400, { error: 'roomId is missing.' }, res);
              }
              return send(200, { room: rooms.get(roomId) ?? emptyRoom(roomId) }, res);
            }

            if (req.method === 'POST') {
              const body = await readBody(req);
              const roomId = normalizeRoomId(typeof body.roomId === 'string' ? body.roomId : null);
              const user = body.user as { id?: string; updatedAt?: string } | undefined;
              if (!roomId || !user?.id || !user.updatedAt) {
                return send(400, { error: 'Invalid sync request.' }, res);
              }

              const room = rooms.get(roomId) ?? emptyRoom(roomId);
              const existing = room.users[user.id] as { updatedAt?: string } | undefined;
              if (!existing || new Date(user.updatedAt).getTime() >= new Date(existing.updatedAt ?? 0).getTime()) {
                room.users[user.id] = user;
                room.updatedAt = new Date().toISOString();
                rooms.set(roomId, room);
              }

              return send(200, { room }, res);
            }

            return send(405, { error: 'Method not allowed.' }, res);
          } catch (error) {
            return send(500, { error: error instanceof Error ? error.message : 'Local sync failed.' }, res);
          }
        });
      }
    }
  ],
  test: {
    environment: 'jsdom',
    globals: true
  }
});
