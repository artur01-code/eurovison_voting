import type {
  AppState,
  JuryPoint,
  JuryPointsAssignment,
  Participant,
  ParticipantRating,
  RatingCategory,
  SyncRoomState,
  UserSession
} from '../types';

export const STORAGE_KEY = 'eurovision-jury-2026:v1';
export const SCHEMA_VERSION = 2;
export const JURY_POINTS = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1] as const satisfies readonly JuryPoint[];
export const DEFAULT_MASTER_PASSWORD = import.meta.env.VITE_MASTER_PASSWORD ?? 'eurovision2026';
export const DEFAULT_ROOM_ID = import.meta.env.VITE_ROOM_ID ?? 'eurovision-2026-private';

const now = () => new Date().toISOString();

export const createEmptyJuryPoints = (): JuryPointsAssignment => ({
  1: null,
  2: null,
  3: null,
  4: null,
  5: null,
  6: null,
  7: null,
  8: null,
  10: null,
  12: null
});

export const defaultCategories = (): RatingCategory[] => [
  { id: 'song', name: 'Song', min: 0, max: 10 },
  { id: 'performance', name: 'Performance', min: 0, max: 10 },
  { id: 'staging', name: 'Staging', min: 0, max: 10 }
];

export const createInitialState = (): AppState => ({
  schemaVersion: SCHEMA_VERSION,
  isUnlocked: false,
  activeUserId: null,
  roomId: DEFAULT_ROOM_ID,
  lastSyncedAt: null,
  users: {}
});

export const normalizeName = (name: string) => name.trim().replace(/\s+/g, ' ');

export const userIdFromName = (name: string) =>
  normalizeName(name)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const createUserSession = (name: string): UserSession => {
  const cleanName = normalizeName(name);
  const timestamp = now();

  return {
    id: userIdFromName(cleanName),
    name: cleanName,
    categories: defaultCategories(),
    ratings: {},
    juryPoints: createEmptyJuryPoints(),
    createdAt: timestamp,
    updatedAt: timestamp
  };
};

export const ensureUser = (state: AppState, name: string): AppState => {
  const user = createUserSession(name);
  const existing = state.users[user.id];
  const nextUser = existing ? { ...existing, name: normalizeName(name), updatedAt: now() } : user;

  return {
    ...state,
    activeUserId: nextUser.id,
    users: {
      ...state.users,
      [nextUser.id]: nextUser
    }
  };
};

export const activeUser = (state: AppState) =>
  state.activeUserId ? state.users[state.activeUserId] ?? null : null;

export const getParticipantRating = (
  user: UserSession,
  participantId: string
): ParticipantRating => ({
  participantId,
  notes: user.ratings[participantId]?.notes ?? '',
  scores: user.ratings[participantId]?.scores ?? {},
  updatedAt: user.ratings[participantId]?.updatedAt ?? now()
});

export const saveParticipantRating = (
  user: UserSession,
  participantId: string,
  patch: Partial<Pick<ParticipantRating, 'notes' | 'scores'>>
): UserSession => {
  const current = getParticipantRating(user, participantId);
  const updatedAt = now();

  return {
    ...user,
    updatedAt,
    ratings: {
      ...user.ratings,
      [participantId]: {
        ...current,
        ...patch,
        participantId,
        updatedAt
      }
    }
  };
};

export const updateActiveUser = (state: AppState, update: (user: UserSession) => UserSession): AppState => {
  const user = activeUser(state);
  if (!user) {
    return state;
  }

  const nextUser = update(user);
  return {
    ...state,
    users: {
      ...state.users,
      [nextUser.id]: nextUser
    }
  };
};

const isNewer = (candidate: UserSession, existing: UserSession) =>
  new Date(candidate.updatedAt).getTime() > new Date(existing.updatedAt).getTime();

export const mergeUsersByUpdatedAt = (
  localUsers: Record<string, UserSession>,
  remoteUsers: Record<string, UserSession>
) => {
  const merged = { ...localUsers };

  for (const [userId, remoteUser] of Object.entries(remoteUsers)) {
    const existing = merged[userId];
    if (!existing || isNewer(remoteUser, existing)) {
      merged[userId] = remoteUser;
    }
  }

  return merged;
};

export const createRoomState = (roomId: string, users: Record<string, UserSession>): SyncRoomState => ({
  schemaVersion: SCHEMA_VERSION,
  roomId,
  users,
  updatedAt: now()
});

export const calculateAverageScore = (user: UserSession, participantId: string): number | null => {
  const rating = user.ratings[participantId];
  if (!rating) {
    return null;
  }

  const values = user.categories
    .map((category) => rating.scores[category.id])
    .filter((score): score is number => typeof score === 'number');

  if (values.length === 0) {
    return null;
  }

  return Number((values.reduce((sum, score) => sum + score, 0) / values.length).toFixed(1));
};

export const calculateTotalScore = (user: UserSession, participantId: string): number | null => {
  const rating = user.ratings[participantId];
  if (!rating) {
    return null;
  }

  const values = user.categories
    .map((category) => rating.scores[category.id])
    .filter((score): score is number => typeof score === 'number');

  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, score) => sum + score, 0);
};

export const isParticipantRated = (user: UserSession, participantId: string): boolean => {
  const rating = user.ratings[participantId];
  if (!rating) {
    return false;
  }

  return (
    rating.notes.trim().length > 0 ||
    user.categories.some((category) => typeof rating.scores[category.id] === 'number')
  );
};

export const assignJuryPoints = (
  user: UserSession,
  point: JuryPoint,
  participantId: string | null
): UserSession => {
  const updatedAt = now();
  const next = { ...user.juryPoints };

  for (const juryPoint of JURY_POINTS) {
    if (participantId && next[juryPoint] === participantId) {
      next[juryPoint] = null;
    }
  }

  next[point] = participantId;

  return {
    ...user,
    updatedAt,
    juryPoints: next
  };
};

export const validateJuryPoints = (assignment: JuryPointsAssignment) => {
  const missingPoints = JURY_POINTS.filter((point) => !assignment[point]);
  const selectedParticipants = JURY_POINTS.map((point) => assignment[point]).filter(
    (participantId): participantId is string => Boolean(participantId)
  );
  const duplicates = selectedParticipants.filter(
    (participantId, index) => selectedParticipants.indexOf(participantId) !== index
  );

  return {
    isComplete: missingPoints.length === 0,
    isUnique: duplicates.length === 0,
    missingPoints,
    duplicateParticipantIds: Array.from(new Set(duplicates))
  };
};

export const addCategory = (user: UserSession, name: string): UserSession => {
  const cleanName = normalizeName(name);
  if (!cleanName) {
    throw new Error('Category name cannot be empty.');
  }

  const idBase = userIdFromName(cleanName) || 'category';
  let id = idBase;
  let suffix = 2;
  while (user.categories.some((category) => category.id === id)) {
    id = `${idBase}-${suffix}`;
    suffix += 1;
  }

  return {
    ...user,
    updatedAt: now(),
    categories: [...user.categories, { id, name: cleanName, min: 0, max: 10 }]
  };
};

export const renameCategory = (user: UserSession, categoryId: string, name: string): UserSession => {
  const cleanName = normalizeName(name);
  if (!cleanName) {
    throw new Error('Category name cannot be empty.');
  }

  return {
    ...user,
    updatedAt: now(),
    categories: user.categories.map((category) =>
      category.id === categoryId ? { ...category, name: cleanName } : category
    )
  };
};

export const deleteCategory = (user: UserSession, categoryId: string): UserSession => {
  const ratings = Object.fromEntries(
    Object.entries(user.ratings).map(([participantId, rating]) => {
      const { [categoryId]: _removed, ...scores } = rating.scores;
      return [participantId, { ...rating, scores }];
    })
  );

  return {
    ...user,
    updatedAt: now(),
    categories: user.categories.filter((category) => category.id !== categoryId),
    ratings
  };
};

export const setCategoryScore = (
  user: UserSession,
  participantId: string,
  category: RatingCategory,
  rawScore: number | null
): UserSession => {
  const score =
    typeof rawScore === 'number'
      ? Math.min(category.max, Math.max(category.min, Number(rawScore.toFixed(1))))
      : null;
  const rating = getParticipantRating(user, participantId);

  return saveParticipantRating(user, participantId, {
    scores: {
      ...rating.scores,
      [category.id]: score
    }
  });
};

export const getFinalTopTen = (participants: Participant[], user: UserSession) => {
  const byId = new Map(participants.map((participant) => [participant.id, participant]));

  return JURY_POINTS.map((point) => {
    const participantId = user.juryPoints[point];
    const participant = participantId ? byId.get(participantId) ?? null : null;
    return { point, participant };
  });
};

export const migrateState = (unknownState: unknown): AppState => {
  if (!unknownState || typeof unknownState !== 'object') {
    return createInitialState();
  }

  const candidate = unknownState as Partial<AppState>;
  if (candidate.schemaVersion !== 1 && candidate.schemaVersion !== SCHEMA_VERSION) {
    return createInitialState();
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    isUnlocked: Boolean(candidate.isUnlocked),
    activeUserId: candidate.activeUserId ?? null,
    roomId: candidate.roomId ?? DEFAULT_ROOM_ID,
    lastSyncedAt: candidate.lastSyncedAt ?? null,
    users: candidate.users ?? {}
  };
};

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const loadState = (storage: StorageLike = window.localStorage): AppState => {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    return createInitialState();
  }

  try {
    return migrateState(JSON.parse(raw));
  } catch {
    return createInitialState();
  }
};

export const saveState = (state: AppState, storage: StorageLike = window.localStorage) => {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const clearState = (storage: StorageLike = window.localStorage) => {
  storage.removeItem(STORAGE_KEY);
};
