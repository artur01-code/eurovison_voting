import type { Participant } from '../types';
import { participantImages } from './participantImages';

export const FINALISTS_2026 = [
  // Grand Final running order, Eurovision.com, 15 May 2026.
  { runningOrder: 1, country: 'Denmark', artist: 'Søren Torpegaard Lund', song: 'Før Vi Går Hjem' },
  { runningOrder: 2, country: 'Germany', artist: 'Sarah Engels', song: 'Fire' },
  { runningOrder: 3, country: 'Israel', artist: 'Noam Bettan', song: 'Michelle' },
  { runningOrder: 4, country: 'Belgium', artist: 'ESSYLA', song: 'Dancing on the Ice' },
  { runningOrder: 5, country: 'Albania', artist: 'Alis', song: 'Nân' },
  { runningOrder: 6, country: 'Greece', artist: 'Akylas', song: 'Ferto' },
  { runningOrder: 7, country: 'Ukraine', artist: 'LELÉKA', song: 'Ridnym' },
  { runningOrder: 8, country: 'Australia', artist: 'Delta Goodrem', song: 'Eclipse' },
  { runningOrder: 9, country: 'Serbia', artist: 'LAVINA', song: 'Kraj Mene' },
  { runningOrder: 10, country: 'Malta', artist: 'AIDAN', song: 'Bella' },
  { runningOrder: 11, country: 'Czechia', artist: 'Daniel Zizka', song: 'CROSSROADS' },
  { runningOrder: 12, country: 'Bulgaria', artist: 'DARA', song: 'Bangaranga' },
  { runningOrder: 13, country: 'Croatia', artist: 'LELEK', song: 'Andromeda' },
  { runningOrder: 14, country: 'United Kingdom', artist: 'LOOK MUM NO COMPUTER', song: 'Eins, Zwei, Drei' },
  { runningOrder: 15, country: 'France', artist: 'Monroe', song: 'Regarde !' },
  { runningOrder: 16, country: 'Moldova', artist: 'Satoshi', song: 'Viva, Moldova!' },
  { runningOrder: 17, country: 'Finland', artist: 'Linda Lampenius x Pete Parkkonen', song: 'Liekinheitin' },
  { runningOrder: 18, country: 'Poland', artist: 'ALICJA', song: 'Pray' },
  { runningOrder: 19, country: 'Lithuania', artist: 'Lion Ceccah', song: 'Sólo Quiero Más' },
  { runningOrder: 20, country: 'Sweden', artist: 'FELICIA', song: 'My System' },
  { runningOrder: 21, country: 'Cyprus', artist: 'Antigoni', song: 'JALLA' },
  { runningOrder: 22, country: 'Italy', artist: 'Sal Da Vinci', song: 'Per Sempre Sì' },
  { runningOrder: 23, country: 'Norway', artist: 'JONAS LOVV', song: 'YA YA YA' },
  { runningOrder: 24, country: 'Romania', artist: 'Alexandra Căpitănescu', song: 'Choke Me' },
  { runningOrder: 25, country: 'Austria', artist: 'COSMÓ', song: 'Tanzschein' }
] as const;

const ELIMINATED_2026 = [
  { country: 'Armenia', artist: 'SIMÓN', song: 'Paloma Rumba' },
  { country: 'Azerbaijan', artist: 'JIVA', song: 'Just Go' },
  { country: 'Estonia', artist: 'Vanilla Ninja', song: 'Too Epic To Be True' },
  { country: 'Georgia', artist: 'Bzikebi', song: 'On Replay' },
  { country: 'Latvia', artist: 'Atvara', song: 'Ēnā' },
  { country: 'Luxembourg', artist: 'Eva Marija', song: 'Mother Nature' },
  { country: 'Montenegro', artist: 'Tamara Živković', song: 'Nova Zora' },
  { country: 'Portugal', artist: 'Bandidos do Cante', song: 'Rosa' },
  { country: 'San Marino', artist: 'SENHIT', song: 'Superstar' },
  { country: 'Switzerland', artist: 'Veronica Fusaro', song: 'Alice' }
] as const;

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const toParticipant = (
  participant: (typeof FINALISTS_2026)[number] | (typeof ELIMINATED_2026)[number],
  status: Participant['status']
): Participant => ({
  ...participant,
  id: slugify(participant.country),
  status,
  images: participantImages[slugify(participant.country)]
});

export const participants: Participant[] = FINALISTS_2026.map((participant) => toParticipant(participant, 'finalist'));

export const eliminatedParticipants: Participant[] = ELIMINATED_2026.map((participant) =>
  toParticipant(participant, 'eliminated')
);

export const allKnownParticipants: Participant[] = [...participants, ...eliminatedParticipants];
