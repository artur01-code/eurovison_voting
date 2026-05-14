import type { ChatMessage } from '../types';

export const CHAT_HISTORY_LIMIT = 80;
export const CHAT_MAX_MESSAGE_LENGTH = 360;

export const getChatWebSocketUrl = () => {
  const configuredUrl = import.meta.env.VITE_CHAT_WS_URL;
  if (configuredUrl) {
    return configuredUrl;
  }

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'ws://127.0.0.1:8787';
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/chat`;
};

export const normalizeChatText = (value: string) => value.trim().replace(/\s+/g, ' ').slice(0, CHAT_MAX_MESSAGE_LENGTH);

export const isChatMessage = (value: unknown): value is ChatMessage => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<ChatMessage>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.authorId === 'string' &&
    typeof candidate.authorName === 'string' &&
    typeof candidate.text === 'string' &&
    typeof candidate.createdAt === 'string'
  );
};

export const mergeChatMessages = (current: ChatMessage[], incoming: ChatMessage[]) => {
  const byId = new Map<string, ChatMessage>();

  for (const message of [...current, ...incoming]) {
    byId.set(message.id, message);
  }

  return Array.from(byId.values())
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(-CHAT_HISTORY_LIMIT);
};

