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

wss.on('connection', (socket) => {
  sendJson(socket, { type: 'history', messages });

  socket.on('message', (raw) => {
    try {
      const payload = JSON.parse(String(raw));
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
});

server.listen(PORT, () => {
  console.log(`Eurovision chat WebSocket listening on ws://127.0.0.1:${PORT}`);
});
