import { JURY_POINTS, calculateAverageScore } from './appState';
import type { Participant, UserSession } from '../types';

export interface GroupJuryScore {
  participant: Participant;
  points: number;
  voters: number;
  twelvePoints: number;
}

export interface GroupRatingScore {
  participant: Participant;
  average: number;
  voters: number;
}

export interface UserFavorite {
  user: UserSession;
  point: number;
  participant: Participant | null;
}

export const getGroupJuryScores = (
  participants: Participant[],
  users: UserSession[]
): GroupJuryScore[] => {
  const byId = new Map(participants.map((participant) => [participant.id, participant]));
  const scores = new Map<string, { points: number; voters: Set<string>; twelvePoints: number }>();

  for (const user of users) {
    for (const point of JURY_POINTS) {
      const participantId = user.juryPoints[point];
      if (!participantId || !byId.has(participantId)) {
        continue;
      }

      const current = scores.get(participantId) ?? { points: 0, voters: new Set<string>(), twelvePoints: 0 };
      current.points += point;
      current.voters.add(user.id);
      if (point === 12) {
        current.twelvePoints += 1;
      }
      scores.set(participantId, current);
    }
  }

  return Array.from(scores.entries())
    .map(([participantId, score]) => ({
      participant: byId.get(participantId)!,
      points: score.points,
      voters: score.voters.size,
      twelvePoints: score.twelvePoints
    }))
    .sort((a, b) => b.points - a.points || b.twelvePoints - a.twelvePoints || a.participant.country.localeCompare(b.participant.country));
};

export const getGroupRatingScores = (
  participants: Participant[],
  users: UserSession[]
): GroupRatingScore[] =>
  participants
    .map((participant) => {
      const averages = users
        .map((user) => calculateAverageScore(user, participant.id))
        .filter((score): score is number => typeof score === 'number');

      if (averages.length === 0) {
        return null;
      }

      return {
        participant,
        average: Number((averages.reduce((sum, score) => sum + score, 0) / averages.length).toFixed(1)),
        voters: averages.length
      };
    })
    .filter((score): score is GroupRatingScore => Boolean(score))
    .sort((a, b) => b.average - a.average || b.voters - a.voters || a.participant.country.localeCompare(b.participant.country));

export const getUserFavorites = (participants: Participant[], users: UserSession[]): UserFavorite[] => {
  const byId = new Map(participants.map((participant) => [participant.id, participant]));

  return users
    .map((user) => {
      const point = JURY_POINTS.find((juryPoint) => user.juryPoints[juryPoint]);
      const participantId = point ? user.juryPoints[point] : null;

      return {
        user,
        point: point ?? 0,
        participant: participantId ? byId.get(participantId) ?? null : null
      };
    })
    .sort((a, b) => a.user.name.localeCompare(b.user.name));
};

