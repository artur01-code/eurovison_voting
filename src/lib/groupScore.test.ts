import { describe, expect, it } from 'vitest';
import { allKnownParticipants, eliminatedParticipants, participants } from '../data/participants';
import { assignJuryPoints, createUserSession, setCategoryScore } from './appState';
import { getGroupJuryScores, getGroupRatingScores, getUserFavorites } from './groupScore';

describe('group score aggregation', () => {
  it('sums jury points across users and sorts the winner first', () => {
    const germany = participants.find((participant) => participant.country === 'Germany')!;
    const italy = participants.find((participant) => participant.country === 'Italy')!;
    const jorit = assignJuryPoints(assignJuryPoints(createUserSession('Jorit'), 12, germany.id), 10, italy.id);
    const lea = assignJuryPoints(assignJuryPoints(createUserSession('Lea'), 12, italy.id), 8, germany.id);

    const scores = getGroupJuryScores(participants, [jorit, lea]);

    expect(scores[0].participant.country).toBe('Italy');
    expect(scores[0].points).toBe(22);
    expect(scores[0].votes).toEqual([
      { userId: 'lea', userName: 'Lea', points: 12 },
      { userId: 'jorit', userName: 'Jorit', points: 10 }
    ]);
    expect(scores[1].participant.country).toBe('Germany');
    expect(scores[1].points).toBe(20);
  });

  it('calculates group category averages from all users with scores', () => {
    const participant = participants[0];
    const jorit = createUserSession('Jorit');
    const lea = createUserSession('Lea');
    const category = jorit.categories[0];
    const scoredJorit = setCategoryScore(jorit, participant.id, category, 10);
    const scoredLea = setCategoryScore(lea, participant.id, lea.categories[0], 6);

    const scores = getGroupRatingScores(participants, [scoredJorit, scoredLea]);

    expect(scores[0].participant.id).toBe(participant.id);
    expect(scores[0].average).toBe(8);
    expect(scores[0].voters).toBe(2);
  });

  it('lists each user favorite from their highest assigned jury score', () => {
    const germany = participants.find((participant) => participant.country === 'Germany')!;
    const jorit = assignJuryPoints(createUserSession('Jorit'), 12, germany.id);

    const favorites = getUserFavorites(participants, [jorit]);

    expect(favorites[0].point).toBe(12);
    expect(favorites[0].participant?.country).toBe('Germany');
  });

  it('can still aggregate legacy scores for eliminated entries when they are known', () => {
    const armenia = eliminatedParticipants.find((participant) => participant.country === 'Armenia')!;
    const jorit = assignJuryPoints(createUserSession('Jorit'), 12, armenia.id);

    const scores = getGroupJuryScores(allKnownParticipants, [jorit]);

    expect(scores[0].participant.country).toBe('Armenia');
    expect(scores[0].participant.status).toBe('eliminated');
  });
});
