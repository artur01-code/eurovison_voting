import type { Participant } from '../types';
import { participantImages } from './participantImages';

export const FINALISTS_2026 = [
  // Automatically qualified
  { country: 'Austria', artist: 'COSMÓ', song: 'Tanzschein' },
  { country: 'France', artist: 'Monroe', song: 'Regarde !' },
  { country: 'Germany', artist: 'Sarah Engels', song: 'Fire' },
  { country: 'Italy', artist: 'Sal Da Vinci', song: 'Per Sempre Sì' },
  { country: 'United Kingdom', artist: 'LOOK MUM NO COMPUTER', song: 'Eins, Zwei, Drei' },

  // Semi-Final 1 qualifiers
  { country: 'Belgium', artist: 'ESSYLA', song: 'Dancing on the Ice' },
  { country: 'Croatia', artist: 'LELEK', song: 'Andromeda' },
  { country: 'Finland', artist: 'Linda Lampenius x Pete Parkkonen', song: 'Liekinheitin' },
  { country: 'Greece', artist: 'Akylas', song: 'Ferto' },
  { country: 'Israel', artist: 'Noam Bettan', song: 'Michelle' },
  { country: 'Lithuania', artist: 'Lion Ceccah', song: 'Sólo Quiero Más' },
  { country: 'Moldova', artist: 'Satoshi', song: 'Viva, Moldova!' },
  { country: 'Poland', artist: 'ALICJA', song: 'Pray' },
  { country: 'Serbia', artist: 'LAVINA', song: 'Kraj Mene' },
  { country: 'Sweden', artist: 'FELICIA', song: 'My System' },

  // Semi-Final 2 qualifiers
  { country: 'Albania', artist: 'Alis', song: 'Nân' },
  { country: 'Australia', artist: 'Delta Goodrem', song: 'Eclipse' },
  { country: 'Bulgaria', artist: 'DARA', song: 'Bangaranga' },
  { country: 'Cyprus', artist: 'Antigoni', song: 'JALLA' },
  { country: 'Czechia', artist: 'Daniel Zizka', song: 'CROSSROADS' },
  { country: 'Denmark', artist: 'Søren Torpegaard Lund', song: 'Før Vi Går Hjem' },
  { country: 'Malta', artist: 'AIDAN', song: 'Bella' },
  { country: 'Norway', artist: 'JONAS LOVV', song: 'YA YA YA' },
  { country: 'Romania', artist: 'Alexandra Căpitănescu', song: 'Choke Me' },
  { country: 'Ukraine', artist: 'LELÉKA', song: 'Ridnym' }
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
