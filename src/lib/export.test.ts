import { describe, expect, it } from 'vitest';
import { participants } from '../data/participants';
import { assignJuryPoints, createInitialState, createUserSession } from './appState';
import { exportUserJson, exportWhatsAppText, importUserJson } from './export';

describe('exports', () => {
  it('exports WhatsApp text in classic jury order', () => {
    const germany = participants.find((participant) => participant.country === 'Germany')!;
    const italy = participants.find((participant) => participant.country === 'Italy')!;
    const user = assignJuryPoints(assignJuryPoints(createUserSession('Jorit'), 12, germany.id), 10, italy.id);

    const text = exportWhatsAppText(participants, user);
    const lines = text.split('\n');

    expect(lines[0]).toBe("Jorit's Eurovision Jury 2026:");
    expect(lines[1]).toBe('12 points: Germany - Sarah Engels - Fire');
    expect(lines[2]).toBe('10 points: Italy - Sal Da Vinci - Per Sempre Sì');
  });

  it('imports the JSON export as a user session', () => {
    const user = createUserSession('Jorit');
    const json = exportUserJson(createInitialState(), user);

    expect(importUserJson(json).id).toBe(user.id);
  });
});
