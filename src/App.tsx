import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { allKnownParticipants, participants } from './data/participants';
import {
  DEFAULT_MASTER_PASSWORD,
  JURY_POINTS,
  activeUser,
  addCategory,
  assignJuryPoints,
  calculateAverageScore,
  calculateTotalScore,
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
import { exportWhatsAppText } from './lib/export';
import { getGroupJuryScores, getGroupRatingScores, getUserFavorites } from './lib/groupScore';
import { deleteUserFromRoom, fetchRoom, pushUserToRoom } from './lib/sync';
import { getChatWebSocketUrl, isChatMessage, mergeChatMessages, normalizeChatText } from './lib/chat';
import { getCopy, type Copy } from './lib/i18n';
import type {
  AppState,
  ChatConnectionStatus,
  ChatMessage,
  ChatOnlineUser,
  JuryPoint,
  Language,
  Participant,
  ParticipantFilter,
  ParticipantSort,
  UserSession
} from './types';

type View = 'home' | 'categories' | 'jury' | 'scoreboard';
type FinalTab = 'favorites' | 'jury' | 'categories' | 'personal';

const viewIcons: Record<View, string> = {
  home: '♪',
  categories: '★',
  jury: '12',
  scoreboard: '♥'
};

const formatParticipantLine = (participant: Participant, copy: Copy) =>
  `${participant.country} - ${participant.song}${
    participant.status === 'eliminated' ? ` (${copy.common.eliminated})` : ''
  }`;

function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [view, setView] = useState<View>('home');
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const copy = useMemo(() => getCopy(state.language), [state.language]);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    document.documentElement.lang = state.language;
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
      try {
        const room =
          mode === 'push-pull' && currentUser
            ? await pushUserToRoom(state.roomId, currentUser)
            : await fetchRoom(state.roomId);

        setState((current) => {
          const users = mergeUsersByUpdatedAt(current.users, room.users);
          for (const userId of Object.keys(current.deletedUserIds ?? {})) {
            delete users[userId];
          }

          return {
            ...current,
            users,
            lastSyncedAt: new Date().toISOString()
          };
        });
      } catch (error) {
        console.warn(error instanceof Error ? error.message : copy.sync.failed);
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

  useEffect(() => {
    if (view === 'scoreboard') {
      void syncNow('pull');
    }
  }, [view]);

  const replaceUser = (update: (user: UserSession) => UserSession) => {
    setState((current) => updateActiveUser(current, update));
  };

  const navigateToView = useCallback((nextView: View) => {
    setSelectedParticipantId(null);
    setView(nextView);
  }, []);

  const completeOnboarding = () => {
    setIsOnboardingOpen(false);
    setState((current) =>
      updateActiveUser(current, (currentUser) => ({
        ...currentUser,
        hasCompletedOnboarding: true
      }))
    );
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
        onDeleteUser={(userId) => {
          setState((current) => {
            const { [userId]: _removed, ...users } = current.users;
            return {
              ...current,
              activeUserId: current.activeUserId === userId ? null : current.activeUserId,
              deletedUserIds: {
                ...current.deletedUserIds,
                [userId]: new Date().toISOString()
              },
              users
            };
          });
          void deleteUserFromRoom(state.roomId, userId).catch((error) => {
            console.warn(error instanceof Error ? error.message : copy.sync.failed);
          });
        }}
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
            title={copy.onboarding.openHelp}
            onClick={() => setIsOnboardingOpen(true)}
          >
            ?
          </button>
          <button
            className="icon-button"
            type="button"
            title={copy.common.switchUser}
            onClick={() => {
              setSelectedParticipantId(null);
              setState((current) => ({ ...current, activeUserId: null }));
            }}
          >
            ⇄
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
            {view === 'jury' && <JuryView copy={copy} language={state.language} user={user} onUpdateUser={replaceUser} />}
            {view === 'scoreboard' && (
              <ScoreboardView
                user={user}
                copy={copy}
                users={Object.values(state.users)}
              />
            )}
          </>
        )}
      </main>

      {!selectedParticipant && <BottomNav copy={copy} currentView={view} onChange={setView} />}
      <ChatWidget copy={copy} user={user} />
      {(isOnboardingOpen || !user.hasCompletedOnboarding) && (
        <OnboardingWizard
          copy={copy}
          onComplete={completeOnboarding}
          onNavigate={navigateToView}
        />
      )}
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
  onDeleteUser,
  onLock
}: {
  state: AppState;
  copy: Copy;
  language: Language;
  onLanguageChange: (language: Language) => void;
  onSelectUser: (name: string) => void;
  onDeleteUser: (userId: string) => void;
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
              <div className="saved-user-row" key={user.id}>
                <button className="saved-user-select" type="button" onClick={() => onSelectUser(user.name)}>
                  {user.name}
                </button>
                <button
                  className="saved-user-delete"
                  type="button"
                  aria-label={copy.auth.deleteUser(user.name)}
                  title={copy.auth.deleteUser(user.name)}
                  onClick={() => {
                    if (window.confirm(copy.auth.deleteUserConfirm(user.name))) {
                      onDeleteUser(user.id);
                    }
                  }}
                >
                  🗑
                </button>
              </div>
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

function OnboardingWizard({
  copy,
  onComplete,
  onNavigate
}: {
  copy: Copy;
  onComplete: () => void;
  onNavigate: (view: View) => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const steps = copy.onboarding.steps;
  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  useEffect(() => {
    onNavigate(step.view as View);

    const timeout = window.setTimeout(() => {
      document.querySelectorAll('[data-tour-active="true"]').forEach((element) => {
        element.removeAttribute('data-tour-active');
      });

      const target = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
      if (!target) {
        return;
      }

      target.setAttribute('data-tour-active', 'true');
      target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }, 120);

    return () => {
      window.clearTimeout(timeout);
      document.querySelectorAll('[data-tour-active="true"]').forEach((element) => {
        element.removeAttribute('data-tour-active');
      });
    };
  }, [onNavigate, step.target, step.view]);

  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="false" aria-labelledby="onboarding-title">
      <section className="onboarding-card">
        <div className="onboarding-progress" aria-label={copy.onboarding.stepLabel(stepIndex + 1, steps.length)}>
          {steps.map((currentStep, index) => (
            <span key={currentStep.title} className={index <= stepIndex ? 'active' : ''} />
          ))}
        </div>

        <p className="eyebrow">{copy.onboarding.stepLabel(stepIndex + 1, steps.length)}</p>
        <h2 id="onboarding-title">{step.title}</h2>
        <p className="onboarding-body">{step.body}</p>

        <div className="onboarding-points">
          {step.points.map((point) => (
            <div key={point}>
              <span>✓</span>
              <p>{point}</p>
            </div>
          ))}
        </div>

        <div className="onboarding-actions">
          <button
            className="text-button"
            type="button"
            disabled={stepIndex === 0}
            onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
          >
            {copy.onboarding.back}
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={() => {
              if (isLastStep) {
                onComplete();
                return;
              }
              setStepIndex((current) => current + 1);
            }}
          >
            {isLastStep ? copy.onboarding.finish : copy.onboarding.next}
          </button>
        </div>

        <button className="text-button onboarding-skip" type="button" onClick={onComplete}>
          {copy.onboarding.skip}
        </button>
      </section>
    </div>
  );
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <aside className="help-card">
      <strong>{title}</strong>
      <p>{body}</p>
    </aside>
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [filter, setFilter] = useState<ParticipantFilter>('all');
  const [sort, setSort] = useState<ParticipantSort>('default');
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const ratedCount = participants.filter((participant) => isParticipantRated(user, participant.id)).length;
  const progress = Math.round((ratedCount / participants.length) * 100);

  const openSearch = () => {
    setIsSearchOpen(true);
    window.setTimeout(() => searchInputRef.current?.focus(), 0);
  };

  const filteredParticipants = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = participants.filter((participant) => {
      const matchesSearch =
        !query ||
        [participant.country, participant.artist, participant.song].some((value) =>
          value.toLowerCase().includes(query)
        );
      const isRated = isParticipantRated(user, participant.id);

      if (!matchesSearch) {
        return false;
      }
      if (filter === 'rated') {
        return isRated;
      }
      if (filter === 'unrated') {
        return !isRated;
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
      <div className="hero-band" data-tour="entries">
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
      <InfoCard title={copy.help.entriesTitle} body={copy.help.entriesBody} />

      <div className="controls">
        <div className={`search-shell ${isSearchOpen || search ? 'open' : 'compact'}`}>
          {isSearchOpen || search ? (
            <>
              <input
                ref={searchInputRef}
                className="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={copy.home.searchPlaceholder}
              />
              <button
                className="search-icon-button"
                type="button"
                aria-label={copy.home.closeSearch}
                onClick={() => {
                  setSearch('');
                  setIsSearchOpen(false);
                }}
              >
                ×
              </button>
            </>
          ) : (
            <button className="search-icon-button" type="button" aria-label={copy.home.searchAction} onClick={openSearch}>
              ⌕
            </button>
          )}
        </div>
        <div className="filter-tools">
          <div className="filter-group status-filter">
            <span>{copy.home.filterLabel}</span>
            <div className="segmented compact-segmented">
              {(['all', 'rated', 'unrated'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  className={filter === option ? 'active' : ''}
                  onClick={() => setFilter(option)}
                >
                  {option === 'all' && copy.home.all}
                  {option === 'rated' && copy.home.rated}
                  {option === 'unrated' && copy.home.unrated}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group sort-filter">
            <span>{copy.home.sortLabel}</span>
            <div className="segmented compact-segmented">
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
      <ParticipantPerformanceImage participant={participant} className="participant-card-image" />
      <div className="participant-card-content">
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
      </div>
    </button>
  );
}

function ParticipantPerformanceImage({ participant, className }: { participant: Participant; className: string }) {
  const image = participant.images?.performance;

  if (!image) {
    return <div className={`${className} participant-image-fallback`} aria-hidden="true">{participant.country.slice(0, 2)}</div>;
  }

  return (
    <img
      className={className}
      src={image.src}
      alt={`${participant.artist} performing ${participant.song} for ${participant.country}`}
      loading="lazy"
    />
  );
}

function ParticipantPortrait({ participant }: { participant: Participant }) {
  const image = participant.images?.portrait;

  if (!image) {
    return <span className="participant-avatar fallback" aria-hidden="true">{participant.country.slice(0, 2)}</span>;
  }

  return (
    <img
      className="participant-avatar"
      src={image.src}
      alt=""
      loading="lazy"
    />
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
        <ParticipantPerformanceImage participant={participant} className="detail-hero-image" />
        <div className="detail-hero-content">
          <p className="eyebrow">{participant.country}</p>
          <h2>{participant.song}</h2>
          <p>{participant.artist}</p>
          {participant.images?.performance && (
            <a className="photo-credit" href={participant.images.performance.sourceUrl} target="_blank" rel="noreferrer">
              {participant.images.performance.credit}
            </a>
          )}
        </div>
      </div>
      <InfoCard title={copy.help.detailTitle} body={copy.help.detailBody} />

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

      <div className="sticky-actions">
        <button className="secondary-button" type="button" onClick={onBack}>
          {copy.detail.backToOverview}
        </button>
        <button className="primary-button" type="button" onClick={onNext}>
          {copy.detail.nextEntry}
        </button>
      </div>
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
      <InfoCard title={copy.help.categoriesTitle} body={copy.help.categoriesBody} />
      <form onSubmit={submit} className="inline-form" data-tour="categories">
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
  language,
  user,
  onUpdateUser
}: {
  copy: Copy;
  language: Language;
  user: UserSession;
  onUpdateUser: (update: (user: UserSession) => UserSession) => void;
}) {
  const validation = validateJuryPoints(user.juryPoints);
  const selectedIds = useMemo(
    () => new Set(Object.values(user.juryPoints).filter((participantId): participantId is string => Boolean(participantId))),
    [user.juryPoints]
  );
  const categorySuggestions = useMemo(() => getCategorySuggestions(user), [user]);
  const [celebrate, setCelebrate] = useState(false);
  const [activePoint, setActivePoint] = useState<JuryPoint | null>(null);
  const [shareMessage, setShareMessage] = useState('');
  const knownParticipantsById = useMemo(
    () => new Map(allKnownParticipants.map((participant) => [participant.id, participant])),
    []
  );
  const shareScore = async () => {
    const text = exportWhatsAppText(allKnownParticipants, user, language);
    const title = copy.exportText.title(user.name);

    try {
      if (navigator.share) {
        await navigator.share({ title, text });
        setShareMessage(copy.jury.shared);
      } else {
        await navigator.clipboard?.writeText(text);
        setShareMessage(copy.jury.shareCopied);
      }
      window.setTimeout(() => setShareMessage(''), 2500);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      try {
        await navigator.clipboard?.writeText(text);
        setShareMessage(copy.jury.shareCopied);
        window.setTimeout(() => setShareMessage(''), 2500);
      } catch {
        setShareMessage('');
      }
    }
  };

  return (
    <section className="screen">
      <div className={`jury-status ${celebrate ? 'celebrate' : ''}`}>
        <div>
          <p className="eyebrow">{copy.jury.title}</p>
          <h2>{validation.isComplete ? copy.jury.complete : copy.jury.missingValues(validation.missingPoints.length)}</h2>
        </div>
        <div className="jury-status-actions">
          <button
            className="jury-share-button"
            type="button"
            data-tour="jury-share"
            aria-label={copy.jury.shareScore}
            title={copy.jury.shareScore}
            onClick={() => void shareScore()}
          >
            ↗
          </button>
          <span>{validation.isUnique ? copy.jury.unique : copy.jury.duplicate}</span>
        </div>
      </div>
      {shareMessage && <p className="success compact-message">{shareMessage}</p>}
      {!validation.isComplete && (
        <p className="hint">{copy.jury.missing(validation.missingPoints)}</p>
      )}
      <InfoCard title={copy.help.juryTitle} body={copy.help.juryBody} />

      <div className="jury-list" data-tour="jury">
        {JURY_POINTS.map((point) => {
          const selected = user.juryPoints[point];
          const suggestion = categorySuggestions.get(point);
          const selectedParticipant = selected ? knownParticipantsById.get(selected) : null;

          return (
            <div key={point} className="jury-row">
              <span className="points-badge">{point}</span>
              <div className="jury-choice">
                <button className="jury-select-button" type="button" onClick={() => setActivePoint(point)}>
                  {selectedParticipant ? (
                    <>
                      <ParticipantPortrait participant={selectedParticipant} />
                      <span>
                        <strong>{selectedParticipant.country}</strong>
                        <small>
                          {selectedParticipant.artist}
                          {selectedParticipant.status === 'eliminated' && ` · ${copy.common.eliminated}`}
                        </small>
                      </span>
                    </>
                  ) : (
                    <span className="jury-select-placeholder">{copy.jury.selectCountry}</span>
                  )}
                </button>
                {suggestion && (
                  <span className="category-suggestion">
                    {copy.jury.categoryHint(suggestion.participant.country, suggestion.average)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {activePoint && (
        <JuryPickerSheet
          copy={copy}
          point={activePoint}
          selectedParticipantId={user.juryPoints[activePoint]}
          selectedIds={selectedIds}
          knownParticipantsById={knownParticipantsById}
          onClose={() => setActivePoint(null)}
          onSelect={(participantId) => {
            onUpdateUser((currentUser) => assignJuryPoints(currentUser, activePoint, participantId));
            if (activePoint === 12 && participantId) {
              setCelebrate(true);
              window.setTimeout(() => setCelebrate(false), 900);
            }
            setActivePoint(null);
          }}
        />
      )}
    </section>
  );
}

function JuryPickerSheet({
  copy,
  point,
  selectedParticipantId,
  selectedIds,
  knownParticipantsById,
  onClose,
  onSelect
}: {
  copy: Copy;
  point: JuryPoint;
  selectedParticipantId: string | null;
  selectedIds: Set<string>;
  knownParticipantsById: Map<string, Participant>;
  onClose: () => void;
  onSelect: (participantId: string | null) => void;
}) {
  const selectedParticipant = selectedParticipantId ? knownParticipantsById.get(selectedParticipantId) : null;

  return (
    <div className="picker-overlay" role="dialog" aria-modal="true" aria-labelledby="jury-picker-title">
      <section className={`picker-sheet ${selectedParticipant?.status === 'eliminated' ? 'has-legacy' : ''}`}>
        <header className="picker-header">
          <div>
            <p className="eyebrow">{copy.common.points(point)}</p>
            <h2 id="jury-picker-title">{copy.jury.chooseForPoints(point)}</h2>
          </div>
          <button className="icon-button" type="button" title={copy.chat.close} onClick={onClose}>
            ×
          </button>
        </header>

        {selectedParticipant?.status === 'eliminated' && (
          <button className="picker-option selected legacy" type="button" onClick={() => onSelect(null)}>
            <ParticipantPortrait participant={selectedParticipant} />
            <span>
              <strong>{selectedParticipant.country}</strong>
              <small>{selectedParticipant.artist} · {copy.common.eliminated}</small>
            </span>
            <em>{copy.jury.clearSelection}</em>
          </button>
        )}

        <div className="picker-list">
          {participants.map((participant) => {
            const isSelected = selectedParticipantId === participant.id;
            const isTaken = selectedIds.has(participant.id) && !isSelected;

            return (
              <button
                key={participant.id}
                className={`picker-option ${isSelected ? 'selected' : ''}`}
                type="button"
                disabled={isTaken}
                onClick={() => onSelect(participant.id)}
              >
                <ParticipantPortrait participant={participant} />
                <span>
                  <strong>{participant.country}</strong>
                  <small>{participant.artist}</small>
                </span>
                {isTaken && <em>{copy.jury.alreadyAssigned}</em>}
              </button>
            );
          })}
        </div>

        <button className="text-button picker-clear" type="button" onClick={() => onSelect(null)}>
          {copy.jury.clearSelection}
        </button>
      </section>
    </div>
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
  const topTen = getFinalTopTen(allKnownParticipants, user);

  return (
    <section className="final-card">
      <InfoCard title={copy.jury.personalTopTen} body={copy.final.personalInfo} />
      {topTen.map(({ point, participant }) => (
        <div key={point} className="topten-row">
          <strong>{point}</strong>
          <span>{participant ? formatParticipantLine(participant, copy) : copy.common.stillOpen}</span>
        </div>
      ))}
    </section>
  );
}

function ScoreboardView({
  user,
  copy,
  users
}: {
  user: UserSession;
  copy: Copy;
  users: UserSession[];
}) {
  const groupJuryScores = getGroupJuryScores(allKnownParticipants, users);
  const groupRatingScores = getGroupRatingScores(allKnownParticipants, users);
  const favorites = getUserFavorites(allKnownParticipants, users);
  const [activeTab, setActiveTab] = useState<FinalTab>('favorites');
  const finalTabs: FinalTab[] = ['favorites', 'jury', 'categories', 'personal'];

  return (
    <section className="screen party-mode">
      <div className="final-tabs" role="tablist" aria-label={copy.final.tabsLabel} data-tour="final">
        {finalTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={activeTab === tab ? 'active' : ''}
            onClick={() => setActiveTab(tab)}
          >
            {copy.final.tabs[tab]}
          </button>
        ))}
      </div>

      {activeTab === 'favorites' && (
        <section className="final-card">
          <InfoCard title={copy.final.groupFavorites} body={copy.final.groupFavoritesInfo} />
          {favorites.map(({ user: favoriteUser, point, participant }) => (
            <div key={favoriteUser.id} className="favorite-row">
              <div>
                <strong>{favoriteUser.name}</strong>
                <small>{point ? copy.common.points(point) : copy.common.stillOpen}</small>
              </div>
              <span className="final-entry-line">
                {participant && <ParticipantPortrait participant={participant} />}
                <span>{participant ? formatParticipantLine(participant, copy) : copy.final.noJuryScore}</span>
              </span>
            </div>
          ))}
        </section>
      )}

      {activeTab === 'jury' && (
        <section className="final-card">
          <InfoCard title={copy.final.juryTotalRanking} body={copy.final.juryInfo} />
          {groupJuryScores.length === 0 && <p className="empty">{copy.final.noJuryPoints}</p>}
          {groupJuryScores.map(({ participant, points, votes }, index) => (
            <div key={participant.id} className="scoreboard-row">
              <span>{index + 1}</span>
              <div className="scoreboard-entry">
                <ParticipantPortrait participant={participant} />
                <span>
                  <strong>{participant.country}</strong>
                  <small>
                    {participant.song}
                    {participant.status === 'eliminated' && <span className="status-chip">{copy.common.eliminated}</span>}
                  </small>
                </span>
              </div>
              <strong>{points}</strong>
              <details className="vote-details">
                <summary>{copy.final.showVotes(votes.length)}</summary>
                <div>
                  {votes.map((vote) => (
                    <span key={`${participant.id}-${vote.userId}`}>
                      {vote.userName}: {copy.common.points(vote.points)}
                    </span>
                  ))}
                </div>
              </details>
            </div>
          ))}
        </section>
      )}

      {activeTab === 'categories' && (
        <section className="final-card">
          <InfoCard title={copy.final.categoryFavorites} body={copy.final.categoryInfo} />
          {groupRatingScores.length === 0 && <p className="empty">{copy.final.noCategoryScores}</p>}
          {groupRatingScores.slice(0, 12).map(({ participant, average, voters }, index) => (
            <div key={participant.id} className="scoreboard-row">
              <span>{index + 1}</span>
              <div className="scoreboard-entry">
                <ParticipantPortrait participant={participant} />
                <span>
                  <strong>{participant.country}</strong>
                  <small>
                    {participant.song}
                    {participant.status === 'eliminated' && <span className="status-chip">{copy.common.eliminated}</span>}
                  </small>
                </span>
              </div>
              <strong>{average} {copy.common.averageShort}</strong>
              <small>{voters} {voters === 1 ? copy.common.rating : copy.common.ratings}</small>
            </div>
          ))}
        </section>
      )}

      {activeTab === 'personal' && <FinalTopTen copy={copy} user={user} />}
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
  const [onlineUsers, setOnlineUsers] = useState<ChatOnlineUser[]>([]);
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
        socket.send(
          JSON.stringify({
            type: 'join',
            authorId: user.id,
            authorName: user.name
          })
        );
      });

      socket.addEventListener('message', (event) => {
        try {
          const payload = JSON.parse(String(event.data)) as {
            type?: string;
            messages?: unknown[];
            message?: unknown;
            users?: unknown[];
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
            return;
          }

          if (payload.type === 'presence' && Array.isArray(payload.users)) {
            setOnlineUsers(payload.users.filter(isChatOnlineUser));
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
  }, [user.id, user.name]);

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
  const statusLabel =
    status === 'connected'
      ? copy.chat.connected
      : status === 'connecting'
        ? copy.chat.connecting
        : status === 'disconnected'
          ? copy.chat.disconnected
          : copy.chat.unavailable;

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
                <div className="chat-title-line">
                  <h2 id="chat-title">{copy.chat.roomTitle}</h2>
                  <span className={`connection-dot ${status}`} aria-label={statusLabel} title={statusLabel} />
                </div>
              </div>
              <button className="icon-button" type="button" title={copy.chat.close} onClick={() => setIsOpen(false)}>
                ×
              </button>
            </header>

            <section className="chat-meta">
              <div className="online-users">
                <strong>{copy.chat.onlineUsers}</strong>
                <div>
                  {onlineUsers.length === 0 && <span>{copy.chat.noOnlineUsers}</span>}
                  {onlineUsers.map((onlineUser) => (
                    <span className="online-user-chip" key={onlineUser.id}>
                      {onlineUser.name}
                    </span>
                  ))}
                </div>
              </div>
            </section>

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

function isChatOnlineUser(value: unknown): value is ChatOnlineUser {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<ChatOnlineUser>;
  return typeof candidate.id === 'string' && typeof candidate.name === 'string';
}

export default App;
