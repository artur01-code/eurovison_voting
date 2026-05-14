import type { Participant } from '../types';

const rawParticipants = [
  { country: 'Albania', artist: 'Alis', song: 'Nân' },
  { country: 'Armenia', artist: 'SIMÓN', song: 'Paloma Rumba' },
  { country: 'Australia', artist: 'Delta Goodrem', song: 'Eclipse' },
  { country: 'Austria', artist: 'COSMÓ', song: 'Tanzschein' },
  { country: 'Azerbaijan', artist: 'JIVA', song: 'Just Go' },
  { country: 'Belgium', artist: 'ESSYLA', song: 'Dancing on the Ice' },
  { country: 'Bulgaria', artist: 'DARA', song: 'Bangaranga' },
  { country: 'Croatia', artist: 'LELEK', song: 'Andromeda' },
  { country: 'Cyprus', artist: 'Antigoni', song: 'JALLA' },
  { country: 'Czechia', artist: 'Daniel Zizka', song: 'CROSSROADS' },
  { country: 'Denmark', artist: 'Søren Torpegaard Lund', song: 'Før Vi Går Hjem' },
  { country: 'Estonia', artist: 'Vanilla Ninja', song: 'Too Epic To Be True' },
  { country: 'Finland', artist: 'Linda Lampenius x Pete Parkkonen', song: 'Liekinheitin' },
  { country: 'France', artist: 'Monroe', song: 'Regarde !' },
  { country: 'Georgia', artist: 'Bzikebi', song: 'On Replay' },
  { country: 'Germany', artist: 'Sarah Engels', song: 'Fire' },
  { country: 'Greece', artist: 'Akylas', song: 'Ferto' },
  { country: 'Israel', artist: 'Noam Bettan', song: 'Michelle' },
  { country: 'Italy', artist: 'Sal Da Vinci', song: 'Per Sempre Sì' },
  { country: 'Latvia', artist: 'Atvara', song: 'Ēnā' },
  { country: 'Lithuania', artist: 'Lion Ceccah', song: 'Sólo Quiero Más' },
  { country: 'Luxembourg', artist: 'Eva Marija', song: 'Mother Nature' },
  { country: 'Malta', artist: 'AIDAN', song: 'Bella' },
  { country: 'Moldova', artist: 'Satoshi', song: 'Viva, Moldova!' },
  { country: 'Montenegro', artist: 'Tamara Živković', song: 'Nova Zora' },
  { country: 'Norway', artist: 'JONAS LOVV', song: 'YA YA YA' },
  { country: 'Poland', artist: 'ALICJA', song: 'Pray' },
  { country: 'Portugal', artist: 'Bandidos do Cante', song: 'Rosa' },
  { country: 'Romania', artist: 'Alexandra Căpitănescu', song: 'Choke Me' },
  { country: 'San Marino', artist: 'SENHIT', song: 'Superstar' },
  { country: 'Serbia', artist: 'LAVINA', song: 'Kraj Mene' },
  { country: 'Sweden', artist: 'FELICIA', song: 'My System' },
  { country: 'Switzerland', artist: 'Veronica Fusaro', song: 'Alice' },
  { country: 'Ukraine', artist: 'LELÉKA', song: 'Ridnym' },
  { country: 'United Kingdom', artist: 'LOOK MUM NO COMPUTER', song: 'Eins, Zwei, Drei' }
] as const;

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const participants: Participant[] = rawParticipants.map((participant) => ({
  ...participant,
  id: slugify(participant.country)
}));

