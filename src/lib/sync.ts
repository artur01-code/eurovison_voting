import type { SyncResponse, SyncRoomState, UserSession } from '../types';

export type SyncMode = 'push-pull' | 'pull';

export class SyncError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
  }
}

const parseResponse = async (response: Response): Promise<SyncResponse> => {
  const body = (await response.json().catch(() => null)) as SyncResponse | { error?: string } | null;

  if (!response.ok) {
    const error = body && 'error' in body ? body.error : null;
    throw new SyncError(error ?? 'Sync ist gerade nicht erreichbar.', response.status);
  }

  if (!body || !('room' in body)) {
    throw new SyncError('The sync response is invalid.');
  }

  return body;
};

export const fetchRoom = async (roomId: string): Promise<SyncRoomState> => {
  const response = await fetch(`/api/room?roomId=${encodeURIComponent(roomId)}`);
  return (await parseResponse(response)).room;
};

export const pushUserToRoom = async (roomId: string, user: UserSession): Promise<SyncRoomState> => {
  const response = await fetch('/api/room', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ roomId, user })
  });

  return (await parseResponse(response)).room;
};

export const deleteUserFromRoom = async (roomId: string, userId: string): Promise<SyncRoomState> => {
  const response = await fetch('/api/room', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ roomId, userId })
  });

  return (await parseResponse(response)).room;
};
