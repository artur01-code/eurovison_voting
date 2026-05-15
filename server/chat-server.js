import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { WebSocketServer } from 'ws';

const PORT = Number(process.env.CHAT_PORT ?? 8787);
const HISTORY_LIMIT = 80;
const MAX_MESSAGE_LENGTH = 360;

/** @type {Array<{id: string, authorId: string, authorName: string, text: string, createdAt: string}>} */
let messages = [];

const normalizeText = (value) => String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, MAX_MESSAGE_LENGTH);
const normalizeName = (value) => String(value ?? 'Guest').trim().replace(/\s+/g, ' ').slice(0, 40) || 'Guest';
const normalizeId = (value) => String(value ?? 'guest').trim().replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 80) || 'guest';

const server = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, clients: wss.clients.size, messages: messages.length }));
    return;
  }

  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server });

const getOnlineUsers = () => {
  const usersById = new Map();

  for (const client of wss.clients) {
    if (client.user) {
      usersById.set(client.user.id, client.user);
    }
  }

  return Array.from(usersById.values()).sort((a, b) => a.name.localeCompare(b.name));
};

const sendJson = (socket, payload) => {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
};

const broadcast = (payload) => {
  for (const client of wss.clients) {
    sendJson(client, payload);
  }
};

const broadcastPresence = () => {
  broadcast({ type: 'presence', users: getOnlineUsers() });
};

wss.on('connection', (socket) => {
  socket.user = null;
  sendJson(socket, { type: 'history', messages });
  sendJson(socket, { type: 'presence', users: getOnlineUsers() });

  socket.on('message', (raw) => {
    try {
      const payload = JSON.parse(String(raw));
      if (payload.type === 'join') {
        socket.user = {
          id: normalizeId(payload.authorId),
          name: normalizeName(payload.authorName)
        };
        broadcastPresence();
        return;
      }

      if (payload.type !== 'message') {
        return;
      }

      const text = normalizeText(payload.text);
      if (!text) {
        return;
      }

      const message = {
        id: randomUUID(),
        authorId: normalizeId(payload.authorId),
        authorName: normalizeName(payload.authorName),
        text,
        createdAt: new Date().toISOString()
      };

      messages = [...messages, message].slice(-HISTORY_LIMIT);
      broadcast({ type: 'message', message });
    } catch {
      sendJson(socket, { type: 'error', error: 'Invalid chat payload.' });
    }
  });

  socket.on('close', () => {
    socket.user = null;
    broadcastPresence();
  });
});

server.listen(PORT, () => {
  console.log(`Eurovision chat WebSocket listening on ws://127.0.0.1:${PORT}`);
});
