const SCHEMA_VERSION = 2;
const KEY_PREFIX = 'eurovision-jury-2026:room:';

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error('Request body is too large.'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body ? JSON.parse(body) : {}));
    req.on('error', reject);
  });

const normalizeRoomId = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);

const redisCommand = async (command) => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    const error = new Error('Sync is not configured. UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are missing.');
    error.status = 503;
    throw error;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(command)
  });
  const payload = await response.json();

  if (!response.ok || payload.error) {
    const error = new Error(payload.error ?? 'Redis request failed.');
    error.status = response.status;
    throw error;
  }

  return payload.result;
};

const emptyRoom = (roomId) => ({
  schemaVersion: SCHEMA_VERSION,
  roomId,
  users: {},
  updatedAt: new Date().toISOString()
});

const loadRoom = async (roomId) => {
  const raw = await redisCommand(['GET', `${KEY_PREFIX}${roomId}`]);
  if (!raw) {
    return emptyRoom(roomId);
  }

  const room = JSON.parse(raw);
  if (!room || typeof room !== 'object' || room.schemaVersion !== SCHEMA_VERSION) {
    return emptyRoom(roomId);
  }

  return {
    ...emptyRoom(roomId),
    ...room,
    roomId,
    users: room.users ?? {}
  };
};

const saveRoom = async (room) => {
  await redisCommand(['SET', `${KEY_PREFIX}${room.roomId}`, JSON.stringify(room)]);
};

const isUserSession = (value) =>
  value &&
  typeof value === 'object' &&
  typeof value.id === 'string' &&
  typeof value.name === 'string' &&
  Array.isArray(value.categories) &&
  value.ratings &&
  typeof value.ratings === 'object' &&
  value.juryPoints &&
  typeof value.juryPoints === 'object' &&
  typeof value.updatedAt === 'string';

const isNewerOrEqual = (candidate, existing) =>
  !existing || new Date(candidate.updatedAt).getTime() >= new Date(existing.updatedAt).getTime();

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const requestUrl = new URL(req.url ?? '/', 'http://localhost');
      const roomId = normalizeRoomId(req.query?.roomId ?? requestUrl.searchParams.get('roomId'));
      if (!roomId) {
        return json(res, 400, { error: 'roomId is missing.' });
      }

      return json(res, 200, { room: await loadRoom(roomId) });
    }

    if (req.method === 'POST') {
      const body = await readBody(req);
      const roomId = normalizeRoomId(body.roomId);
      if (!roomId) {
        return json(res, 400, { error: 'roomId is missing.' });
      }
      if (!isUserSession(body.user)) {
        return json(res, 400, { error: 'Invalid user scorecard.' });
      }

      const room = await loadRoom(roomId);
      const existing = room.users[body.user.id];
      if (isNewerOrEqual(body.user, existing)) {
        room.users[body.user.id] = body.user;
        room.updatedAt = new Date().toISOString();
        await saveRoom(room);
      }

      return json(res, 200, { room });
    }

    res.setHeader('Allow', 'GET, POST');
    return json(res, 405, { error: 'Method not allowed.' });
  } catch (error) {
    return json(res, error.status ?? 500, { error: error.message ?? 'Serverless sync failed.' });
  }
}
