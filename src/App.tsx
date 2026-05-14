import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { participants } from './data/participants';
import {
  DEFAULT_MASTER_PASSWORD,
  JURY_POINTS,
  activeUser,
  addCategory,
  assignJuryPoints,
  calculateAverageScore,
  calculateTotalScore,
  clearState,
  createInitialState,
  deleteCategory,
  ensureUser,
  getFinalTopTen,
  getParticipantRating,
  isParticipantRated,
  loadState,
  mergeUsersByUpdatedAt,
  renameCategory,
  saveParticipantRating,
  saveState,
  setCategoryScore,
  updateActiveUser,
  validateJuryPoints
} from './lib/appState';
import { exportUserJson, exportWhatsAppText, importUserJson } from './lib/export';
import { getGroupJuryScores, getGroupRatingScores, getUserFavorites } from './lib/groupScore';
import { fetchRoom, pushUserToRoom } from './lib/sync';
import { getChatWebSocketUrl, isChatMessage, mergeChatMessages, normalizeChatText } from './lib/chat';
import { getCopy, type Copy } from './lib/i18n';
import type {
  AppState,
  ChatConnectionStatus,
  ChatMessage,
  Language,
  Participant,
  ParticipantFilter,
  ParticipantSort,
  UserSession
} from './types';

type View = 'home' | 'categories' | 'jury' | 'export' | 'scoreboard';

const viewIcons: Record<View, string> = {
  home: '♪',
  categories: '★',
  jury: '12',
  export: '↥',
  scoreboard: '♥'
};

function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [view, setView] = useState<View>('home');
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const copy = useMemo(() => getCopy(state.language), [state.language]);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    document.documentElement.lang = state.language;
    setSyncMessage('');
  }, [state.language]);

  const user = activeUser(state);

  const setLanguage = (language: Language) => {
    setState((current) => ({ ...current, language }));
  };

  const syncNow = useCallback(
    async (mode: 'push-pull' | 'pull' = 'push-pull') => {
      if (!state.isUnlocked || !state.roomId || !state.activeUserId) {
        return;
      }

      const currentUser = user;
      setIsSyncing(true);
      setSyncMessage(mode === 'pull' ? copy.sync.refreshingScores : copy.sync.autoSyncing);

      try {
        const room =
          mode === 'push-pull' && currentUser
            ? await pushUserToRoom(state.roomId, currentUser)
            : await fetchRoom(state.roomId);

        setState((current) => ({
          ...current,
          users: mergeUsersByUpdatedAt(current.users, room.users),
          lastSyncedAt: new Date().toISOString()
        }));
        setSyncMessage(copy.sync.usersInRoom(Object.keys(room.users).length));
      } catch (error) {
        const message = error instanceof Error ? error.message : copy.sync.failed;
        setSyncMessage(message);
      } finally {
        setIsSyncing(false);
      }
    },
    [copy, state.activeUserId, state.isUnlocked, state.roomId, user]
  );

  useEffect(() => {
    if (!user) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void syncNow('push-pull');
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [syncNow, user]);

  useEffect(() => {
    if (!state.isUnlocked || !state.activeUserId) {
      return;
    }

    const interval = window.setInterval(() => {
      void syncNow('pull');
    }, 15000);

    return () => window.clearInterval(interval);
  }, [state.activeUserId, state.isUnlocked, syncNow]);

  const replaceUser = (update: (user: UserSession) => UserSession) => {
    setState((current) => updateActiveUser(current, update));
  };

  if (!state.isUnlocked) {
    return (
      <LoginScreen
        copy={copy}
        language={state.language}
        onLanguageChange={setLanguage}
        onUnlock={() => setState((current) => ({ ...current, isUnlocked: true }))}
      />
    );
  }

  if (!user) {
    return (
      <UserGate
        state={state}
        copy={copy}
        language={state.language}
        onLanguageChange={setLanguage}
        onSelectUser={(name) => setState((current) => ensureUser(current, name))}
        onLock={() => setState((current) => ({ ...current, isUnlocked: false }))}
      />
    );
  }

  const selectedParticipant = selectedParticipantId
    ? participants.find((participant) => participant.id === selectedParticipantId) ?? null
    : null;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">{copy.common.appTitle}</p>
          <h1>{copy.nav[view]}</h1>
        </div>
        <div className="topbar-actions">
          <LanguageSwitch language={state.language} onChange={setLanguage} />
          <button
            className="icon-button"
            type="button"
            title={copy.common.lockApp}
            onClick={() => setState((current) => ({ ...current, isUnlocked: false }))}
          >
            ⌕
          </button>
        </div>
      </header>

      <main>
        {selectedParticipant ? (
          <ParticipantDetail
            copy={copy}
            user={user}
            participant={selectedParticipant}
            onBack={() => setSelectedParticipantId(null)}
            onNext={() => {
              const currentIndex = participants.findIndex((participant) => participant.id === selectedParticipant.id);
              const next = participants[(currentIndex + 1) % participants.length];
              setSelectedParticipantId(next.id);
            }}
            onUpdateUser={replaceUser}
          />
        ) : (
          <>
            {view === 'home' && (
              <HomeView
                copy={copy}
                user={user}
                onOpenParticipant={(participant) => setSelectedParticipantId(participant.id)}
              />
            )}
            {view === 'categories' && <CategoriesView copy={copy} user={user} onUpdateUser={replaceUser} />}
            {view === 'jury' && <JuryView copy={copy} user={user} onUpdateUser={replaceUser} />}
            {view === 'export' && (
              <ExportView
                copy={copy}
                language={state.language}
                state={state}
                user={user}
                syncMessage={syncMessage || copy.sync.autoStart}
                isSyncing={isSyncing}
                onSync={() => syncNow('push-pull')}
                onRoomChange={(roomId) =>
                  setState((current) => ({
                    ...current,
                    roomId,
                    lastSyncedAt: null
                  }))
                }
                onImport={(importedUser) =>
                  setState((current) => ({
                    ...current,
                    activeUserId: importedUser.id,
                    users: { ...current.users, [importedUser.id]: importedUser }
                  }))
                }
                onSwitchUser={() => {
                  setState((current) => ({ ...current, activeUserId: null }));
                  setView('home');
                }}
                onReset={() => {
                  const confirmed = window.confirm(copy.export.resetConfirm);
                  if (confirmed) {
                    clearState();
                    setState({ ...createInitialState(), isUnlocked: true });
                    setView('home');
                  }
                }}
              />
            )}
            {view === 'scoreboard' && (
              <ScoreboardView
                user={user}
                copy={copy}
                users={Object.values(state.users)}
                syncMessage={syncMessage || copy.sync.autoStart}
                isSyncing={isSyncing}
                onSync={() => syncNow('push-pull')}
              />
            )}
          </>
        )}
      </main>

      {!selectedParticipant && <BottomNav copy={copy} currentView={view} onChange={setView} />}
      <ChatWidget copy={copy} user={user} />
    </div>
  );
}

function LanguageSwitch({
  language,
  onChange
}: {
  language: Language;
  onChange: (language: Language) => void;
}) {
  return (
    <div className="language-switch" aria-label="Language switch">
      <button className={language === 'en' ? 'active' : ''} type="button" onClick={() => onChange('en')}>
        EN
      </button>
      <button className={language === 'de' ? 'active' : ''} type="button" onClick={() => onChange('de')}>
        DE
      </button>
    </div>
  );
}

function LoginScreen({
  copy,
  language,
  onLanguageChange,
  onUnlock
}: {
  copy: Copy;
  language: Language;
  onLanguageChange: (language: Language) => void;
  onUnlock: () => void;
}) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (password === DEFAULT_MASTER_PASSWORD) {
      setError('');
      onUnlock();
      return;
    }
    setError(copy.auth.wrongPassword);
  };

  return (
    <main className="auth-screen">
      <section className="auth-panel">
        <div className="auth-header">
          <p className="eyebrow">{copy.auth.eyebrow}</p>
          <LanguageSwitch language={language} onChange={onLanguageChange} />
        </div>
        <h1>Jury 2026</h1>
        <p className="muted">{copy.auth.subtitle}</p>
        <form onSubmit={submit} className="stack">
          <label>
            {copy.auth.masterPassword}
            <input
              autoFocus
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={copy.auth.passwordPlaceholder}
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="primary-button" type="submit">
            {copy.auth.openApp}
          </button>
        </form>
      </section>
    </main>
  );
}

function UserGate({
  state,
  copy,
  language,
  onLanguageChange,
  onSelectUser,
  onLock
}: {
  state: AppState;
  copy: Copy;
  language: Language;
  onLanguageChange: (language: Language) => void;
  onSelectUser: (name: string) => void;
  onLock: () => void;
}) {
  const [name, setName] = useState('');
  const users = Object.values(state.users);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (name.trim()) {
      onSelectUser(name);
    }
  };

  return (
    <main className="auth-screen">
      <section className="auth-panel">
        <div className="auth-header">
          <p className="eyebrow">{copy.auth.localUser}</p>
          <LanguageSwitch language={language} onChange={onLanguageChange} />
        </div>
        <h1>{copy.auth.whoVotes}</h1>
        <form onSubmit={submit} className="stack">
          <label>
            {copy.auth.yourName}
            <input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={copy.auth.namePlaceholder}
            />
          </label>
          <button className="primary-button" type="submit" disabled={!name.trim()}>
            {copy.auth.continue}
          </button>
        </form>
        {users.length > 0 && (
          <div className="saved-users">
            <p className="muted">{copy.auth.savedUsers}</p>
            {users.map((user) => (
              <button key={user.id} type="button" onClick={() => onSelectUser(user.name)}>
                {user.name}
              </button>
            ))}
          </div>
        )}
        <button className="text-button" type="button" onClick={onLock}>
          {copy.common.lockApp}
        </button>
      </section>
    </main>
  );
}

function HomeView({
  copy,
  user,
  onOpenParticipant
}: {
  copy: Copy;
  user: UserSession;
  onOpenParticipant: (participant: Participant) => void;
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ParticipantFilter>('all');
  const [sort, setSort] = useState<ParticipantSort>('default');
  const ratedCount = participants.filter((participant) => isParticipantRated(user, participant.id)).length;
  const progress = Math.round((ratedCount / participants.length) * 100);

  const filteredParticipants = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = participants.filter((participant) => {
      const matchesSearch =
        !query ||
        [participant.country, participant.artist, participant.song].some((value) =>
          value.toLowerCase().includes(query)
        );
      const isRated = isParticipantRated(user, participant.id);
      const hasJuryPoints = Object.values(user.juryPoints).includes(participant.id);

      if (!matchesSearch) {
        return false;
      }
      if (filter === 'rated') {
        return isRated;
      }
      if (filter === 'unrated') {
        return !isRated;
      }
      if (filter === 'jury') {
        return hasJuryPoints;
      }
      return true;
    });

    if (sort === 'favorites') {
      return [...filtered].sort((a, b) => {
        const averageA = calculateAverageScore(user, a.id);
        const averageB = calculateAverageScore(user, b.id);

        if (averageA === null && averageB === null) {
          return a.country.localeCompare(b.country);
        }
        if (averageA === null) {
          return 1;
        }
        if (averageB === null) {
          return -1;
        }

        return averageB - averageA || a.country.localeCompare(b.country);
      });
    }

    return filtered;
  }, [filter, search, sort, user]);

  return (
    <section className="screen">
      <div className="hero-band">
        <div>
          <p className="eyebrow">{copy.home.greeting(user.name)}</p>
          <h2>{copy.home.ratedProgress(ratedCount, participants.length)}</h2>
        </div>
        <div className="progress-ring" aria-label={copy.home.progressLabel(progress)}>
          {progress}%
        </div>
      </div>
      <div className="progress-track">
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="controls">
        <input
          className="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={copy.home.searchPlaceholder}
        />
        <div className="segmented">
          {(['all', 'rated', 'unrated', 'jury'] as const).map((option) => (
            <button
              key={option}
              type="button"
              className={filter === option ? 'active' : ''}
              onClick={() => setFilter(option)}
            >
              {option === 'all' && copy.home.all}
              {option === 'rated' && copy.home.rated}
              {option === 'unrated' && copy.home.unrated}
              {option === 'jury' && copy.nav.jury}
            </button>
          ))}
        </div>
        <div className="segmented wide">
          {(['default', 'favorites'] as const).map((option) => (
            <button
              key={option}
              type="button"
              className={sort === option ? 'active' : ''}
              onClick={() => setSort(option)}
            >
              {option === 'default' ? copy.home.sortDefault : copy.home.sortFavorites}
            </button>
          ))}
        </div>
      </div>

      <div className="participant-list">
        {filteredParticipants.map((participant) => (
          <ParticipantCard
            key={participant.id}
            participant={participant}
            user={user}
            copy={copy}
            onClick={() => onOpenParticipant(participant)}
          />
        ))}
      </div>
    </section>
  );
}

function ParticipantCard({
  participant,
  user,
  copy,
  onClick
}: {
  participant: Participant;
  user: UserSession;
  copy: Copy;
  onClick: () => void;
}) {
  const average = calculateAverageScore(user, participant.id);
  const total = calculateTotalScore(user, participant.id);
  const juryPoint = JURY_POINTS.find((point) => user.juryPoints[point] === participant.id);

  return (
    <button className="participant-card" type="button" onClick={onClick}>
      <div>
        <p className="country">{participant.country}</p>
        <h3>{participant.song}</h3>
        <p className="muted">{participant.artist}</p>
      </div>
      <div className="card-stats">
        {juryPoint && <span className="jury-pill">{juryPoint}</span>}
        <span>{average === null ? copy.common.open : `${average} ${copy.common.averageShort}`}</span>
        {total !== null && <small>{total} {copy.common.total}</small>}
      </div>
    </button>
  );
}

function ParticipantDetail({
  copy,
  user,
  participant,
  onBack,
  onNext,
  onUpdateUser
}: {
  copy: Copy;
  user: UserSession;
  participant: Participant;
  onBack: () => void;
  onNext: () => void;
  onUpdateUser: (update: (user: UserSession) => UserSession) => void;
}) {
  const rating = getParticipantRating(user, participant.id);
  const average = calculateAverageScore(user, participant.id);
  const total = calculateTotalScore(user, participant.id);

  return (
    <section className="screen detail-screen">
      <button className="text-button back-button" type="button" onClick={onBack}>
        ← {copy.common.back}
      </button>
      <div className="detail-hero">
        <p className="eyebrow">{participant.country}</p>
        <h2>{participant.song}</h2>
        <p>{participant.artist}</p>
      </div>

      <div className="score-summary">
        <div>
          <span>{copy.detail.average}</span>
          <strong>{average === null ? '–' : average}</strong>
        </div>
        <div>
          <span>{copy.detail.total}</span>
          <strong>{total === null ? '–' : total}</strong>
        </div>
      </div>

      <div className="stack">
        {user.categories.length === 0 && (
          <p className="empty">{copy.detail.emptyCategories}</p>
        )}
        {user.categories.map((category) => {
          const score = rating.scores[category.id];

          return (
            <label key={category.id} className="range-row">
              <span>
                {category.name}
                <strong>{typeof score === 'number' ? score : '–'}</strong>
              </span>
              <input
                type="range"
                min={category.min}
                max={category.max}
                step="1"
                value={typeof score === 'number' ? score : 0}
                onChange={(event) =>
                  onUpdateUser((currentUser) =>
                    setCategoryScore(currentUser, participant.id, category, Number(event.target.value))
                  )
                }
              />
              <button
                className="text-button compact"
                type="button"
                onClick={() =>
                  onUpdateUser((currentUser) => setCategoryScore(currentUser, participant.id, category, null))
                }
              >
                {copy.detail.clear}
              </button>
            </label>
          );
        })}
      </div>

      <label className="notes-box">
        {copy.detail.notes}
        <textarea
          value={rating.notes}
          rows={5}
          placeholder={copy.detail.notesPlaceholder}
          onChange={(event) =>
            onUpdateUser((currentUser) =>
              saveParticipantRating(currentUser, participant.id, { notes: event.target.value })
            )
          }
        />
      </label>

      <button className="primary-button sticky-action" type="button" onClick={onNext}>
        {copy.detail.nextEntry}
      </button>
    </section>
  );
}

function CategoriesView({
  copy,
  user,
  onUpdateUser
}: {
  copy: Copy;
  user: UserSession;
  onUpdateUser: (update: (user: UserSession) => UserSession) => void;
}) {
  const [newCategory, setNewCategory] = useState('');
  const [error, setError] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    try {
      onUpdateUser((currentUser) => addCategory(currentUser, newCategory));
      setNewCategory('');
      setError('');
    } catch (error) {
      setError(copy.categories.createError);
    }
  };

  return (
    <section className="screen">
      <div className="section-copy">
        <h2>{copy.categories.title}</h2>
        <p className="muted">{copy.categories.description}</p>
      </div>
      <form onSubmit={submit} className="inline-form">
        <input
          value={newCategory}
          onChange={(event) => setNewCategory(event.target.value)}
          placeholder={copy.categories.placeholder}
        />
        <button type="submit" className="primary-button" disabled={!newCategory.trim()}>
          {copy.categories.add}
        </button>
      </form>
      {error && <p className="error">{error}</p>}

      <div className="category-list">
        {user.categories.map((category) => (
          <div className="category-card" key={category.id}>
            <input
              aria-label={copy.categories.categoryLabel(category.name)}
              value={category.name}
              onChange={(event) =>
                onUpdateUser((currentUser) => {
                  try {
                    return renameCategory(currentUser, category.id, event.target.value);
                  } catch {
                    return currentUser;
                  }
                })
              }
            />
            <button
              className="danger-button"
              type="button"
              onClick={() => onUpdateUser((currentUser) => deleteCategory(currentUser, category.id))}
            >
              {copy.categories.remove}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function JuryView({
  copy,
  user,
  onUpdateUser
}: {
  copy: Copy;
  user: UserSession;
  onUpdateUser: (update: (user: UserSession) => UserSession) => void;
}) {
  const validation = validateJuryPoints(user.juryPoints);
  const selectedIds = new Set(Object.values(user.juryPoints).filter(Boolean));
  const categorySuggestions = useMemo(() => getCategorySuggestions(user), [user]);
  const [celebrate, setCelebrate] = useState(false);

  return (
    <section className="screen">
      <div className={`jury-status ${celebrate ? 'celebrate' : ''}`}>
        <div>
          <p className="eyebrow">{copy.jury.title}</p>
          <h2>{validation.isComplete ? copy.jury.complete : copy.jury.missingValues(validation.missingPoints.length)}</h2>
        </div>
        <span>{validation.isUnique ? copy.jury.unique : copy.jury.duplicate}</span>
      </div>
      {!validation.isComplete && (
        <p className="hint">{copy.jury.missing(validation.missingPoints)}</p>
      )}

      <div className="jury-list">
        {JURY_POINTS.map((point) => {
          const selected = user.juryPoints[point];
          const suggestion = categorySuggestions.get(point);

          return (
            <label key={point} className="jury-row">
              <span className="points-badge">{point}</span>
              <div className="jury-choice">
                <select
                  value={selected ?? ''}
                  onChange={(event) => {
                    const nextParticipantId = event.target.value || null;
                    onUpdateUser((currentUser) => assignJuryPoints(currentUser, point, nextParticipantId));
                    if (point === 12 && nextParticipantId) {
                      setCelebrate(true);
                      window.setTimeout(() => setCelebrate(false), 900);
                    }
                  }}
                >
                  <option value="">{copy.jury.selectCountry}</option>
                  {participants.map((participant) => {
                    const isTaken = selectedIds.has(participant.id) && selected !== participant.id;
                    return (
                      <option key={participant.id} value={participant.id} disabled={isTaken}>
                        {participant.country} - {participant.artist}
                      </option>
                    );
                  })}
                </select>
                {suggestion && (
                  <span className="category-suggestion">
                    {copy.jury.categoryHint(suggestion.participant.country, suggestion.average)}
                  </span>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </section>
  );
}

function getCategorySuggestions(user: UserSession) {
  const sorted = participants
    .map((participant) => ({
      participant,
      average: calculateAverageScore(user, participant.id)
    }))
    .filter((item): item is { participant: Participant; average: number } => item.average !== null)
    .sort((a, b) => b.average - a.average || a.participant.country.localeCompare(b.participant.country));

  return new Map(JURY_POINTS.map((point, index) => [point, sorted[index] ?? null]));
}

function FinalTopTen({ copy, user }: { copy: Copy; user: UserSession }) {
  const topTen = getFinalTopTen(participants, user);

  return (
    <section className="final-card">
      <h2>{copy.jury.personalTopTen}</h2>
      {topTen.map(({ point, participant }) => (
        <div key={point} className="topten-row">
          <strong>{point}</strong>
          <span>{participant ? `${participant.country} - ${participant.song}` : copy.common.stillOpen}</span>
        </div>
      ))}
    </section>
  );
}

function ExportView({
  copy,
  language,
  state,
  user,
  syncMessage,
  isSyncing,
  onSync,
  onRoomChange,
  onImport,
  onSwitchUser,
  onReset
}: {
  copy: Copy;
  language: Language;
  state: AppState;
  user: UserSession;
  syncMessage: string;
  isSyncing: boolean;
  onSync: () => void;
  onRoomChange: (roomId: string) => void;
  onImport: (user: UserSession) => void;
  onSwitchUser: () => void;
  onReset: () => void;
}) {
  const [mode, setMode] = useState<'text' | 'json'>('text');
  const [importText, setImportText] = useState('');
  const [message, setMessage] = useState('');
  const textExport = exportWhatsAppText(participants, user, language);
  const jsonExport = exportUserJson(state, user);
  const exportValue = mode === 'text' ? textExport : jsonExport;

  const copyToClipboard = async () => {
    await navigator.clipboard?.writeText(exportValue);
    setMessage(copy.export.copied);
  };

  return (
    <section className="screen">
      <div className="section-copy">
        <h2>{copy.export.title}</h2>
        <p className="muted">{copy.export.description}</p>
      </div>
      <section className="sync-panel">
        <div>
          <p className="eyebrow">{copy.sync.autoRoom}</p>
          <label>
            {copy.sync.roomId}
            <input
              value={state.roomId}
              onChange={(event) => onRoomChange(event.target.value)}
              placeholder="eurovision-2026-private"
            />
          </label>
        </div>
        <div className="sync-actions">
          <button className="primary-button" type="button" onClick={onSync} disabled={isSyncing || !state.roomId.trim()}>
            {isSyncing ? copy.common.refreshing : copy.common.refreshNow}
          </button>
          <span className="sync-note">{copy.sync.autoRoomNote}</span>
          <p className="muted">{syncMessage}</p>
        </div>
      </section>
      <div className="segmented wide">
        <button className={mode === 'text' ? 'active' : ''} type="button" onClick={() => setMode('text')}>
          Text
        </button>
        <button className={mode === 'json' ? 'active' : ''} type="button" onClick={() => setMode('json')}>
          JSON
        </button>
      </div>
      <textarea className="export-box" readOnly value={exportValue} rows={14} />
      <button className="primary-button" type="button" onClick={copyToClipboard}>
        {copy.common.copy}
      </button>
      {message && <p className="success">{message}</p>}

      <details className="import-panel">
        <summary>{copy.export.importSummary}</summary>
        <textarea
          value={importText}
          onChange={(event) => setImportText(event.target.value)}
          placeholder={copy.export.pasteJson}
          rows={7}
        />
        <button
          className="primary-button"
          type="button"
          onClick={() => {
            try {
              onImport(importUserJson(importText));
              setImportText('');
              setMessage(copy.export.importComplete);
            } catch {
              setMessage(copy.export.importFailed);
            }
          }}
        >
          {copy.common.import}
        </button>
      </details>

      <div className="danger-zone">
        <button type="button" onClick={onSwitchUser}>
          {copy.export.switchUser}
        </button>
        <button type="button" onClick={onReset}>
          {copy.export.resetAll}
        </button>
      </div>
    </section>
  );
}

function ScoreboardView({
  user,
  copy,
  users,
  syncMessage,
  isSyncing,
  onSync
}: {
  user: UserSession;
  copy: Copy;
  users: UserSession[];
  syncMessage: string;
  isSyncing: boolean;
  onSync: () => void;
}) {
  const groupJuryScores = getGroupJuryScores(participants, users);
  const groupRatingScores = getGroupRatingScores(participants, users);
  const favorites = getUserFavorites(participants, users);
  const winner = groupJuryScores[0] ?? null;
  const [showCategoryInfo, setShowCategoryInfo] = useState(false);

  return (
    <section className="screen party-mode">
      <section className="winner-card">
        <p className="eyebrow">{copy.final.usersInGroup(users.length)}</p>
        <h2>{winner ? winner.participant.country : copy.final.noWinner}</h2>
        <p>
          {winner
            ? copy.final.winnerSummary(winner.points, winner.voters)
            : copy.final.waitingForRanking}
        </p>
        <button className="primary-button" type="button" onClick={onSync} disabled={isSyncing}>
          {isSyncing ? copy.common.refreshing : copy.common.refreshNow}
        </button>
        <p className="muted">{syncMessage}</p>
      </section>

      <section className="final-card">
        <h2>{copy.final.groupFavorites}</h2>
        {favorites.map(({ user: favoriteUser, point, participant }) => (
          <div key={favoriteUser.id} className="favorite-row">
            <div>
              <strong>{favoriteUser.name}</strong>
              <small>{point ? copy.common.points(point) : copy.common.stillOpen}</small>
            </div>
            <span>{participant ? `${participant.country} - ${participant.song}` : copy.final.noJuryScore}</span>
          </div>
        ))}
      </section>

      <section className="final-card">
        <h2>{copy.final.juryTotalRanking}</h2>
        {groupJuryScores.length === 0 && <p className="empty">{copy.final.noJuryPoints}</p>}
        {groupJuryScores.map(({ participant, points, voters, twelvePoints }, index) => (
          <div key={participant.id} className="scoreboard-row">
            <span>{index + 1}</span>
            <div>
              <strong>{participant.country}</strong>
              <small>{participant.song}</small>
            </div>
            <strong>{points}</strong>
            <small>{voters} {voters === 1 ? copy.common.rating : copy.common.ratings} · {twelvePoints}×12</small>
          </div>
        ))}
      </section>

      <section className="final-card">
        <div className="card-title-row">
          <h2>{copy.final.categoryFavorites}</h2>
          <button
            className="info-button"
            type="button"
            aria-expanded={showCategoryInfo}
            aria-label={copy.final.categoryInfoLabel}
            onClick={() => setShowCategoryInfo((current) => !current)}
          >
            i
          </button>
        </div>
        {showCategoryInfo && (
          <p className="info-note">
            {copy.final.categoryInfo}
          </p>
        )}
        {groupRatingScores.length === 0 && <p className="empty">{copy.final.noCategoryScores}</p>}
        {groupRatingScores.slice(0, 12).map(({ participant, average, voters }, index) => (
          <div key={participant.id} className="scoreboard-row">
            <span>{index + 1}</span>
            <div>
              <strong>{participant.country}</strong>
              <small>{participant.song}</small>
            </div>
            <strong>{average} {copy.common.averageShort}</strong>
            <small>{voters} {voters === 1 ? copy.common.rating : copy.common.ratings}</small>
          </div>
        ))}
      </section>

      <FinalTopTen copy={copy} user={user} />
    </section>
  );
}

function BottomNav({
  copy,
  currentView,
  onChange
}: {
  copy: Copy;
  currentView: View;
  onChange: (view: View) => void;
}) {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {(Object.keys(copy.nav) as View[]).map((view) => (
        <button
          key={view}
          type="button"
          className={currentView === view ? 'active' : ''}
          onClick={() => onChange(view)}
        >
          <span>{viewIcons[view]}</span>
          {copy.nav[view]}
        </button>
      ))}
    </nav>
  );
}

function ChatWidget({ copy, user }: { copy: Copy; user: UserSession }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState<ChatConnectionStatus>('connecting');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showBubblePreview, setShowBubblePreview] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const isOpenRef = useRef(isOpen);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!('WebSocket' in window)) {
      setStatus('unavailable');
      return undefined;
    }

    let closedByComponent = false;
    let reconnectTimer: number | null = null;

    const connect = () => {
      setStatus('connecting');
      const socket = new WebSocket(getChatWebSocketUrl());
      socketRef.current = socket;

      socket.addEventListener('open', () => {
        setStatus('connected');
      });

      socket.addEventListener('message', (event) => {
        try {
          const payload = JSON.parse(String(event.data)) as {
            type?: string;
            messages?: unknown[];
            message?: unknown;
          };

          if (payload.type === 'history' && Array.isArray(payload.messages)) {
            const history = payload.messages.filter(isChatMessage);
            setMessages((current) => mergeChatMessages(current, history));
            return;
          }

          if (payload.type === 'message' && isChatMessage(payload.message)) {
            setMessages((current) => mergeChatMessages(current, [payload.message as ChatMessage]));
            if (!isOpenRef.current && payload.message.authorId !== user.id) {
              setUnreadCount((count) => count + 1);
            }
          }
        } catch {
          setStatus('disconnected');
        }
      });

      socket.addEventListener('close', () => {
        if (closedByComponent) {
          return;
        }
        setStatus('disconnected');
        reconnectTimer = window.setTimeout(connect, 2500);
      });

      socket.addEventListener('error', () => {
        setStatus('disconnected');
        socket.close();
      });
    };

    connect();

    return () => {
      closedByComponent = true;
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
      }
      socketRef.current?.close();
    };
  }, [user.id]);

  useEffect(() => {
    if (isOpen) {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  const latestMessage = messages.at(-1);

  useEffect(() => {
    if (!latestMessage || isOpen) {
      setShowBubblePreview(false);
      return undefined;
    }

    setShowBubblePreview(true);
    const timeout = window.setTimeout(() => {
      setShowBubblePreview(false);
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [isOpen, latestMessage?.id]);

  const preview = latestMessage
    ? `${latestMessage.authorName}: ${latestMessage.text}`
    : status === 'connected'
      ? copy.chat.connectedPreview
      : copy.chat.connectingPreview;
  const isBubbleExpanded = Boolean(showBubblePreview && latestMessage && !isOpen);
  const canSend = status === 'connected' && normalizeChatText(draft).length > 0;

  const sendMessage = (event: FormEvent) => {
    event.preventDefault();
    const text = normalizeChatText(draft);
    const socket = socketRef.current;

    if (!text || !socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }

    socket.send(
      JSON.stringify({
        type: 'message',
        authorId: user.id,
        authorName: user.name,
        text
      })
    );
    setDraft('');
  };

  return (
    <>
      <button
        className={`chat-bubble ${isBubbleExpanded ? 'expanded' : 'compact'}`}
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={copy.chat.openLabel}
      >
        <span className="chat-bubble-title">{isBubbleExpanded ? copy.chat.liveChat : copy.chat.compact}</span>
        {isBubbleExpanded && <span className="chat-bubble-preview">{preview}</span>}
        {unreadCount > 0 && <strong>{unreadCount}</strong>}
      </button>

      {isOpen && (
        <div className="chat-overlay" role="dialog" aria-modal="true" aria-labelledby="chat-title">
          <section className="chat-modal">
            <header className="chat-header">
              <div>
                <p className="eyebrow">{copy.chat.automaticallyConnected}</p>
                <h2 id="chat-title">{copy.chat.roomTitle}</h2>
              </div>
              <button className="icon-button" type="button" title={copy.chat.close} onClick={() => setIsOpen(false)}>
                ×
              </button>
            </header>

            <div className={`chat-status ${status}`}>
              {status === 'connected' && copy.chat.connected}
              {status === 'connecting' && copy.chat.connecting}
              {status === 'disconnected' && copy.chat.disconnected}
              {status === 'unavailable' && copy.chat.unavailable}
            </div>

            <div className="chat-messages" ref={listRef}>
              {messages.length === 0 && <p className="empty">{copy.chat.empty}</p>}
              {messages.map((message) => (
                <article
                  key={message.id}
                  className={`chat-message ${message.authorId === user.id ? 'own' : ''}`}
                >
                  <div>
                    <strong>{message.authorName}</strong>
                    <time dateTime={message.createdAt}>
                      {new Intl.DateTimeFormat(undefined, {
                        hour: '2-digit',
                        minute: '2-digit'
                      }).format(new Date(message.createdAt))}
                    </time>
                  </div>
                  <p>{message.text}</p>
                </article>
              ))}
            </div>

            <form className="chat-form" onSubmit={sendMessage}>
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={360}
                placeholder={status === 'connected' ? copy.chat.placeholderConnected : copy.chat.placeholderDisconnected}
              />
              <button className="primary-button" type="submit" disabled={!canSend}>
                {copy.common.send}
              </button>
            </form>
          </section>
        </div>
      )}
    </>
  );
}

export default App;
