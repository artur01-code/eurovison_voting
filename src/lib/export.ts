import { JURY_POINTS, getFinalTopTen } from './appState';
import type { AppState, Participant, UserSession } from '../types';

export const exportUserJson = (state: AppState, user: UserSession) =>
  JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      schemaVersion: state.schemaVersion,
      user
    },
    null,
    2
  );

export const importUserJson = (rawJson: string): UserSession => {
  const parsed = JSON.parse(rawJson) as unknown;
  const candidate =
    parsed && typeof parsed === 'object' && 'user' in parsed
      ? (parsed as { user?: unknown }).user
      : parsed;
  const user = candidate as Partial<UserSession> | undefined;

  if (!user?.id || !user.name || !Array.isArray(user.categories) || !user.juryPoints) {
    throw new Error('The JSON file does not contain a valid scorecard.');
  }

  return user as UserSession;
};

export const exportWhatsAppText = (participants: Participant[], user: UserSession) => {
  const topTen = getFinalTopTen(participants, user);
  const lines = [`${user.name}'s Eurovision Jury 2026:`];

  for (const { point, participant } of topTen) {
    lines.push(
      `${point} points: ${
        participant ? `${participant.country} - ${participant.artist} - ${participant.song}` : 'open'
      }`
    );
  }

  const notes = participants
    .map((participant) => {
      const note = user.ratings[participant.id]?.notes.trim();
      return note ? `${participant.country}: ${note}` : null;
    })
    .filter((line): line is string => Boolean(line));

  if (notes.length > 0) {
    lines.push('', 'Notes/Favorites:', ...notes.slice(0, 8));
  }

  const missing = JURY_POINTS.filter((point) => !user.juryPoints[point]);
  if (missing.length > 0) {
    lines.push('', `Still open: ${missing.join(', ')} points`);
  }

  return lines.join('\n');
};
