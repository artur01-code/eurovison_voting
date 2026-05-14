export type JuryPoint = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 10 | 12;

export interface Participant {
  id: string;
  country: string;
  artist: string;
  song: string;
}

export interface RatingCategory {
  id: string;
  name: string;
  min: number;
  max: number;
}

export interface ParticipantRating {
  participantId: string;
  notes: string;
  scores: Record<string, number | null>;
  updatedAt: string;
}

export type JuryPointsAssignment = Record<JuryPoint, string | null>;

export interface UserSession {
  id: string;
  name: string;
  categories: RatingCategory[];
  ratings: Record<string, ParticipantRating>;
  juryPoints: JuryPointsAssignment;
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  schemaVersion: number;
  isUnlocked: boolean;
  activeUserId: string | null;
  roomId: string;
  lastSyncedAt: string | null;
  users: Record<string, UserSession>;
}

export type ParticipantFilter = 'all' | 'rated' | 'unrated' | 'jury';

export interface SyncRoomState {
  schemaVersion: number;
  roomId: string;
  users: Record<string, UserSession>;
  updatedAt: string;
}

export interface SyncResponse {
  room: SyncRoomState;
}
