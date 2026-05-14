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
import type { AppState, ChatConnectionStatus, ChatMessage, Participant, ParticipantFilter, UserSession } from './types';

type View = 'home' | 'categories' | 'jury' | 'export' | 'scoreboard';

const viewLabels: Record<View, string> = {
  home: 'Entries',
  categories: 'Categories',
  jury: 'Jury',
  export: 'Export',
  scoreboard: 'Final'
};

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
  const [syncMessage, setSyncMessage] = useState('Auto-sync starting...');
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const user = activeUser(state);

  const syncNow = useCallback(
    async (mode: 'push-pull' | 'pull' = 'push-pull') => {
      if (!state.isUnlocked || !state.roomId || !state.activeUserId) {
        return;
      }

      const currentUser = user;
      setIsSyncing(true);
      setSyncMessage(mode === 'pull' ? 'Refreshing group scores...' : 'Auto-syncing...');

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
        setSyncMessage(`${Object.keys(room.users).length} users in this room`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Sync failed.';
        setSyncMessage(message);
      } finally {
        setIsSyncing(false);
      }
    },
    [state.activeUserId, state.isUnlocked, state.roomId, user]
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
        onUnlock={() => setState((current) => ({ ...current, isUnlocked: true }))}
      />
    );
  }

  if (!user) {
    return (
      <UserGate
        state={state}
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
          <p className="eyebrow">Private Jury 2026</p>
          <h1>{viewLabels[view]}</h1>
        </div>
        <button
          className="icon-button"
          type="button"
          title="Lock app"
          onClick={() => setState((current) => ({ ...current, isUnlocked: false }))}
        >
          ⌕
        </button>
      </header>

      <main>
        {selectedParticipant ? (
          <ParticipantDetail
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
              <HomeView user={user} onOpenParticipant={(participant) => setSelectedParticipantId(participant.id)} />
            )}
            {view === 'categories' && <CategoriesView user={user} onUpdateUser={replaceUser} />}
            {view === 'jury' && <JuryView user={user} onUpdateUser={replaceUser} />}
            {view === 'export' && (
              <ExportView
                state={state}
                user={user}
                syncMessage={syncMessage}
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
                  const confirmed = window.confirm('Do you really want to reset all local data?');
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
                users={Object.values(state.users)}
                syncMessage={syncMessage}
                isSyncing={isSyncing}
                onSync={() => syncNow('push-pull')}
              />
            )}
          </>
        )}
      </main>

      {!selectedParticipant && <BottomNav currentView={view} onChange={setView} />}
      <ChatWidget user={user} />
    </div>
  );
}

function LoginScreen({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (password === DEFAULT_MASTER_PASSWORD) {
      setError('');
      onUnlock();
      return;
    }
    setError('The password is not correct.');
  };

  return (
    <main className="auth-screen">
      <section className="auth-panel">
        <p className="eyebrow">Eurovision Prediction Game</p>
        <h1>Jury 2026</h1>
        <p className="muted">Private, locally stored, no account required.</p>
        <form onSubmit={submit} className="stack">
          <label>
            Master password
            <input
              autoFocus
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="primary-button" type="submit">
            Open app
          </button>
        </form>
      </section>
    </main>
  );
}

function UserGate({
  state,
  onSelectUser,
  onLock
}: {
  state: AppState;
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
        <p className="eyebrow">Local user</p>
        <h1>Who is voting?</h1>
        <form onSubmit={submit} className="stack">
          <label>
            Your name
            <input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Jorit"
            />
          </label>
          <button className="primary-button" type="submit" disabled={!name.trim()}>
            Continue
          </button>
        </form>
        {users.length > 0 && (
          <div className="saved-users">
            <p className="muted">Saved users</p>
            {users.map((user) => (
              <button key={user.id} type="button" onClick={() => onSelectUser(user.name)}>
                {user.name}
              </button>
            ))}
          </div>
        )}
        <button className="text-button" type="button" onClick={onLock}>
          Lock app
        </button>
      </section>
    </main>
  );
}

function HomeView({
  user,
  onOpenParticipant
}: {
  user: UserSession;
  onOpenParticipant: (participant: Participant) => void;
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ParticipantFilter>('all');
  const ratedCount = participants.filter((participant) => isParticipantRated(user, participant.id)).length;
  const progress = Math.round((ratedCount / participants.length) * 100);

  const filteredParticipants = useMemo(() => {
    const query = search.trim().toLowerCase();

    return participants.filter((participant) => {
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
  }, [filter, search, user]);

  return (
    <section className="screen">
      <div className="hero-band">
        <div>
          <p className="eyebrow">Hi {user.name}</p>
          <h2>{ratedCount} of {participants.length} rated</h2>
        </div>
        <div className="progress-ring" aria-label={`${progress} percent progress`}>
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
          placeholder="Search country, artist, or song"
        />
        <div className="segmented">
          {(['all', 'rated', 'unrated', 'jury'] as const).map((option) => (
            <button
              key={option}
              type="button"
              className={filter === option ? 'active' : ''}
              onClick={() => setFilter(option)}
            >
              {option === 'all' && 'All'}
              {option === 'rated' && 'Rated'}
              {option === 'unrated' && 'Open'}
              {option === 'jury' && 'Jury'}
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
  onClick
}: {
  participant: Participant;
  user: UserSession;
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
        <span>{average === null ? 'open' : `${average} avg`}</span>
        {total !== null && <small>{total} total</small>}
      </div>
    </button>
  );
}

function ParticipantDetail({
  user,
  participant,
  onBack,
  onNext,
  onUpdateUser
}: {
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
        ← Back
      </button>
      <div className="detail-hero">
        <p className="eyebrow">{participant.country}</p>
        <h2>{participant.song}</h2>
        <p>{participant.artist}</p>
      </div>

      <div className="score-summary">
        <div>
          <span>Average</span>
          <strong>{average === null ? '–' : average}</strong>
        </div>
        <div>
          <span>Total</span>
          <strong>{total === null ? '–' : total}</strong>
        </div>
      </div>

      <div className="stack">
        {user.categories.length === 0 && (
          <p className="empty">Create categories first to assign scores.</p>
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
                clear
              </button>
            </label>
          );
        })}
      </div>

      <label className="notes-box">
        Notes
        <textarea
          value={rating.notes}
          rows={5}
          placeholder="Impression, highlights, live reaction..."
          onChange={(event) =>
            onUpdateUser((currentUser) =>
              saveParticipantRating(currentUser, participant.id, { notes: event.target.value })
            )
          }
        />
      </label>

      <button className="primary-button sticky-action" type="button" onClick={onNext}>
        Next entry
      </button>
    </section>
  );
}

function CategoriesView({
  user,
  onUpdateUser
}: {
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
      setError(error instanceof Error ? error.message : 'Category could not be created.');
    }
  };

  return (
    <section className="screen">
      <div className="section-copy">
        <h2>Global categories</h2>
        <p className="muted">These categories apply to all entries. Scores are saved per country.</p>
      </div>
      <form onSubmit={submit} className="inline-form">
        <input
          value={newCategory}
          onChange={(event) => setNewCategory(event.target.value)}
          placeholder="e.g. Outfit"
        />
        <button type="submit" className="primary-button" disabled={!newCategory.trim()}>
          Add
        </button>
      </form>
      {error && <p className="error">{error}</p>}

      <div className="category-list">
        {user.categories.map((category) => (
          <div className="category-card" key={category.id}>
            <input
              aria-label={`Category ${category.name}`}
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
              Remove
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function JuryView({
  user,
  onUpdateUser
}: {
  user: UserSession;
  onUpdateUser: (update: (user: UserSession) => UserSession) => void;
}) {
  const validation = validateJuryPoints(user.juryPoints);
  const selectedIds = new Set(Object.values(user.juryPoints).filter(Boolean));
  const [celebrate, setCelebrate] = useState(false);

  return (
    <section className="screen">
      <div className={`jury-status ${celebrate ? 'celebrate' : ''}`}>
        <div>
          <p className="eyebrow">Jury points</p>
          <h2>{validation.isComplete ? 'Top 10 complete' : `${validation.missingPoints.length} values missing`}</h2>
        </div>
        <span>{validation.isUnique ? 'Unique' : 'Duplicate'}</span>
      </div>
      {!validation.isComplete && (
        <p className="hint">Missing: {validation.missingPoints.map((point) => `${point} pts`).join(', ')}</p>
      )}

      <div className="jury-list">
        {JURY_POINTS.map((point) => {
          const selected = user.juryPoints[point];

          return (
            <label key={point} className="jury-row">
              <span className="points-badge">{point}</span>
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
                <option value="">Select country</option>
                {participants.map((participant) => {
                  const isTaken = selectedIds.has(participant.id) && selected !== participant.id;
                  return (
                    <option key={participant.id} value={participant.id} disabled={isTaken}>
                      {participant.country} - {participant.artist}
                    </option>
                  );
                })}
              </select>
            </label>
          );
        })}
      </div>

      <FinalTopTen user={user} />
    </section>
  );
}

function FinalTopTen({ user }: { user: UserSession }) {
  const topTen = getFinalTopTen(participants, user);

  return (
    <section className="final-card">
      <h2>Personal Top 10</h2>
      {topTen.map(({ point, participant }) => (
        <div key={point} className="topten-row">
          <strong>{point}</strong>
          <span>{participant ? `${participant.country} - ${participant.song}` : 'Still open'}</span>
        </div>
      ))}
    </section>
  );
}

function ExportView({
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
  const textExport = exportWhatsAppText(participants, user);
  const jsonExport = exportUserJson(state, user);
  const exportValue = mode === 'text' ? textExport : jsonExport;

  const copy = async () => {
    await navigator.clipboard?.writeText(exportValue);
    setMessage('Copied to clipboard.');
  };

  return (
    <section className="screen">
      <div className="section-copy">
        <h2>Share and back up</h2>
        <p className="muted">Export your score as WhatsApp text or JSON for another device.</p>
      </div>
      <section className="sync-panel">
        <div>
          <p className="eyebrow">Auto-sync room</p>
          <label>
            Room ID
            <input
              value={state.roomId}
              onChange={(event) => onRoomChange(event.target.value)}
              placeholder="eurovision-2026-private"
            />
          </label>
        </div>
        <div className="sync-actions">
          <button className="primary-button" type="button" onClick={onSync} disabled={isSyncing || !state.roomId.trim()}>
            {isSyncing ? 'Refreshing...' : 'Refresh now'}
          </button>
          <span className="sync-note">You are automatically in this shared room after login.</span>
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
      <button className="primary-button" type="button" onClick={copy}>
        Copy
      </button>
      {message && <p className="success">{message}</p>}

      <details className="import-panel">
        <summary>Import JSON</summary>
        <textarea
          value={importText}
          onChange={(event) => setImportText(event.target.value)}
          placeholder="Paste JSON here"
          rows={7}
        />
        <button
          className="primary-button"
          type="button"
          onClick={() => {
            try {
              onImport(importUserJson(importText));
              setImportText('');
              setMessage('Import complete.');
            } catch {
              setMessage('Import failed. Please check the JSON.');
            }
          }}
        >
          Import
        </button>
      </details>

      <div className="danger-zone">
        <button type="button" onClick={onSwitchUser}>
          Switch user
        </button>
        <button type="button" onClick={onReset}>
          Reset all
        </button>
      </div>
    </section>
  );
}

function ScoreboardView({
  user,
  users,
  syncMessage,
  isSyncing,
  onSync
}: {
  user: UserSession;
  users: UserSession[];
  syncMessage: string;
  isSyncing: boolean;
  onSync: () => void;
}) {
  const groupJuryScores = getGroupJuryScores(participants, users);
  const groupRatingScores = getGroupRatingScores(participants, users);
  const favorites = getUserFavorites(participants, users);
  const winner = groupJuryScores[0] ?? null;

  return (
    <section className="screen party-mode">
      <section className="winner-card">
        <p className="eyebrow">{users.length} users in group scores</p>
        <h2>{winner ? winner.participant.country : 'No winner yet'}</h2>
        <p>
          {winner
            ? `${winner.points} jury points from ${winner.voters} scorecards`
            : 'The live ranking appears here automatically once jury points are available.'}
        </p>
        <button className="primary-button" type="button" onClick={onSync} disabled={isSyncing}>
          {isSyncing ? 'Refreshing...' : 'Refresh now'}
        </button>
        <p className="muted">{syncMessage}</p>
      </section>

      <section className="final-card">
        <h2>Group favorites</h2>
        {favorites.map(({ user: favoriteUser, point, participant }) => (
          <div key={favoriteUser.id} className="favorite-row">
            <div>
              <strong>{favoriteUser.name}</strong>
              <small>{point ? `${point} points` : 'still open'}</small>
            </div>
            <span>{participant ? `${participant.country} - ${participant.song}` : 'No jury score'}</span>
          </div>
        ))}
      </section>

      <section className="final-card">
        <h2>Jury total ranking</h2>
        {groupJuryScores.length === 0 && <p className="empty">No jury points synced yet.</p>}
        {groupJuryScores.map(({ participant, points, voters, twelvePoints }, index) => (
          <div key={participant.id} className="scoreboard-row">
            <span>{index + 1}</span>
            <div>
              <strong>{participant.country}</strong>
              <small>{participant.song}</small>
            </div>
            <strong>{points}</strong>
            <small>{voters}× · {twelvePoints}×12</small>
          </div>
        ))}
      </section>

      <section className="final-card">
        <h2>Category favorites</h2>
        {groupRatingScores.length === 0 && <p className="empty">No category scores synced yet.</p>}
        {groupRatingScores.slice(0, 12).map(({ participant, average, voters }, index) => (
          <div key={participant.id} className="scoreboard-row">
            <span>{index + 1}</span>
            <div>
              <strong>{participant.country}</strong>
              <small>{participant.song}</small>
            </div>
            <strong>{average} avg</strong>
            <small>{voters}×</small>
          </div>
        ))}
      </section>

      <FinalTopTen user={user} />
    </section>
  );
}

function BottomNav({ currentView, onChange }: { currentView: View; onChange: (view: View) => void }) {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {(Object.keys(viewLabels) as View[]).map((view) => (
        <button
          key={view}
          type="button"
          className={currentView === view ? 'active' : ''}
          onClick={() => onChange(view)}
        >
          <span>{viewIcons[view]}</span>
          {viewLabels[view]}
        </button>
      ))}
    </nav>
  );
}

function ChatWidget({ user }: { user: UserSession }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState<ChatConnectionStatus>('connecting');
  const [unreadCount, setUnreadCount] = useState(0);
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
  const preview = latestMessage
    ? `${latestMessage.authorName}: ${latestMessage.text}`
    : status === 'connected'
      ? 'Connected to public chat'
      : 'Connecting to public chat...';
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
      <button className="chat-bubble" type="button" onClick={() => setIsOpen(true)} aria-label="Open public chat">
        <span className="chat-bubble-title">Live chat</span>
        <span className="chat-bubble-preview">{preview}</span>
        {unreadCount > 0 && <strong>{unreadCount}</strong>}
      </button>

      {isOpen && (
        <div className="chat-overlay" role="dialog" aria-modal="true" aria-labelledby="chat-title">
          <section className="chat-modal">
            <header className="chat-header">
              <div>
                <p className="eyebrow">Automatically connected</p>
                <h2 id="chat-title">Eurovision room</h2>
              </div>
              <button className="icon-button" type="button" title="Close chat" onClick={() => setIsOpen(false)}>
                ×
              </button>
            </header>

            <div className={`chat-status ${status}`}>
              {status === 'connected' && 'Connected'}
              {status === 'connecting' && 'Connecting...'}
              {status === 'disconnected' && 'Disconnected. Reconnecting...'}
              {status === 'unavailable' && 'WebSocket is unavailable in this browser.'}
            </div>

            <div className="chat-messages" ref={listRef}>
              {messages.length === 0 && <p className="empty">No messages yet. You are already in the public chat.</p>}
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
                placeholder={status === 'connected' ? 'Write a message...' : 'Chat server is not connected'}
              />
              <button className="primary-button" type="submit" disabled={!canSend}>
                Send
              </button>
            </form>
          </section>
        </div>
      )}
    </>
  );
}

export default App;
