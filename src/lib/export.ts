import { JURY_POINTS, getFinalTopTen } from './appState';
import { DEFAULT_LANGUAGE, getCopy } from './i18n';
import type { AppState, Language, Participant, UserSession } from '../types';

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

export const exportWhatsAppText = (
  participants: Participant[],
  user: UserSession,
  language: Language = DEFAULT_LANGUAGE
) => {
  const copy = getCopy(language);
  const topTen = getFinalTopTen(participants, user);
  const lines = [copy.exportText.title(user.name)];

  for (const { point, participant } of topTen) {
    const entry = participant
      ? `${participant.country} - ${participant.artist} - ${participant.song}${
          participant.status === 'eliminated' ? ` (${copy.common.eliminated})` : ''
        }`
      : copy.exportText.open;
    lines.push(copy.exportText.points(point, entry));
  }

  const notes = participants
    .map((participant) => {
      const note = user.ratings[participant.id]?.notes.trim();
      const label =
        participant.status === 'eliminated'
          ? `${participant.country} (${copy.common.eliminated})`
          : participant.country;
      return note ? `${label}: ${note}` : null;
    })
    .filter((line): line is string => Boolean(line));

  if (notes.length > 0) {
    lines.push('', copy.exportText.notesTitle, ...notes.slice(0, 8));
  }

  const missing = JURY_POINTS.filter((point) => !user.juryPoints[point]);
  if (missing.length > 0) {
    lines.push('', copy.exportText.stillOpen(missing));
  }

  return lines.join('\n');
};
