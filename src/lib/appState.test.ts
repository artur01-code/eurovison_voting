import { describe, expect, it } from 'vitest';
import { participants } from '../data/participants';
import {
  addCategory,
  assignJuryPoints,
  calculateAverageScore,
  calculateTotalScore,
  createInitialState,
  createUserSession,
  loadState,
  saveParticipantRating,
  saveState,
  setCategoryScore,
  validateJuryPoints
} from './appState';
import type { StorageLike } from './appState';

class MemoryStorage implements StorageLike {
  private data = new Map<string, string>();

  getItem(key: string) {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.data.set(key, value);
  }

  removeItem(key: string) {
    this.data.delete(key);
  }
}

describe('jury points', () => {
  it('marks incomplete assignments and then validates a complete unique top 10', () => {
    const user = createUserSession('Jorit');
    expect(validateJuryPoints(user.juryPoints).isComplete).toBe(false);

    const completeUser = ([12, 10, 8, 7, 6, 5, 4, 3, 2, 1] as const).reduce(
      (currentUser, point, index) => assignJuryPoints(currentUser, point, participants[index].id),
      user
    );

    const validation = validateJuryPoints(completeUser.juryPoints);
    expect(validation.isComplete).toBe(true);
    expect(validation.isUnique).toBe(true);
    expect(validation.missingPoints).toEqual([]);
  });

  it('moves a country instead of allowing duplicate jury assignments', () => {
    const user = createUserSession('Jorit');
    const germany = participants.find((participant) => participant.country === 'Germany')!;

    const afterTwelve = assignJuryPoints(user, 12, germany.id);
    const afterTen = assignJuryPoints(afterTwelve, 10, germany.id);

    expect(afterTen.juryPoints[12]).toBeNull();
    expect(afterTen.juryPoints[10]).toBe(germany.id);
    expect(validateJuryPoints(afterTen.juryPoints).isUnique).toBe(true);
  });
});

describe('category scoring', () => {
  it('calculates average and total from available category scores', () => {
    const user = createUserSession('Jorit');
    const participantId = participants[0].id;
    const [song, performance, staging] = user.categories;

    const scored = setCategoryScore(
      setCategoryScore(setCategoryScore(user, participantId, song, 8), participantId, performance, 6),
      participantId,
      staging,
      10
    );

    expect(calculateAverageScore(scored, participantId)).toBe(8);
    expect(calculateTotalScore(scored, participantId)).toBe(24);
  });

  it('validates non-empty category names and clamps category points', () => {
    const user = addCategory(createUserSession('Jorit'), 'Fun factor');
    const participantId = participants[0].id;
    const category = user.categories.at(-1)!;
    const scored = setCategoryScore(user, participantId, category, 14);

    expect(scored.ratings[participantId].scores[category.id]).toBe(10);
    expect(() => addCategory(user, '   ')).toThrow('Category name');
  });
});

describe('local storage', () => {
  it('saves and loads versioned app state', () => {
    const storage = new MemoryStorage();
    const state = {
      ...createInitialState(),
      isUnlocked: true
    };

    saveState(state, storage);
    expect(loadState(storage)).toEqual(state);
  });

  it('falls back to initial state for invalid JSON', () => {
    const storage = new MemoryStorage();
    storage.setItem('eurovision-jury-2026:v1', '{invalid');

    expect(loadState(storage)).toEqual(createInitialState());
  });

  it('keeps notes in saved participant ratings', () => {
    const user = saveParticipantRating(createUserSession('Jorit'), participants[0].id, {
      notes: 'Starker Refrain'
    });

    expect(user.ratings[participants[0].id].notes).toBe('Starker Refrain');
  });
});
