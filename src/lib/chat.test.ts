import { describe, expect, it } from 'vitest';
import { CHAT_MAX_MESSAGE_LENGTH, isChatMessage, mergeChatMessages, normalizeChatText } from './chat';
import type { ChatMessage } from '../types';

describe('chat helpers', () => {
  it('normalizes whitespace and limits message length', () => {
    const text = normalizeChatText(`  hello\n\n eurovision   ${'x'.repeat(500)}`);

    expect(text.startsWith('hello eurovision')).toBe(true);
    expect(text.length).toBe(CHAT_MAX_MESSAGE_LENGTH);
  });

  it('deduplicates and sorts chat messages', () => {
    const older: ChatMessage = {
      id: '1',
      authorId: 'a',
      authorName: 'A',
      text: 'first',
      createdAt: '2026-05-14T18:00:00.000Z'
    };
    const newer: ChatMessage = {
      id: '2',
      authorId: 'b',
      authorName: 'B',
      text: 'second',
      createdAt: '2026-05-14T18:01:00.000Z'
    };

    expect(mergeChatMessages([newer], [older, newer]).map((message) => message.id)).toEqual(['1', '2']);
  });

  it('validates chat message shape', () => {
    expect(isChatMessage({ id: '1', authorId: 'a', authorName: 'A', text: 'hi', createdAt: 'now' })).toBe(true);
    expect(isChatMessage({ text: 'hi' })).toBe(false);
  });
});

