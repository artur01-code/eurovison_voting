import type { Language } from '../types';

export const DEFAULT_LANGUAGE: Language = 'en';

export const translations = {
  en: {
    nav: {
      home: 'Entries',
      categories: 'Categories',
      jury: 'Jury',
      export: 'Export',
      scoreboard: 'Final'
    },
    common: {
      appTitle: 'Private Jury 2026',
      lockApp: 'Lock app',
      back: 'Back',
      copy: 'Copy',
      import: 'Import',
      send: 'Send',
      refreshNow: 'Refresh now',
      refreshing: 'Refreshing...',
      open: 'open',
      averageShort: 'avg',
      total: 'total',
      rating: 'rating',
      ratings: 'ratings',
      stillOpen: 'Still open',
      points: (point: number) => `${point} points`
    },
    auth: {
      eyebrow: 'Eurovision Prediction Game',
      subtitle: 'Private, locally stored, no account required.',
      masterPassword: 'Master password',
      passwordPlaceholder: 'Enter password',
      openApp: 'Open app',
      wrongPassword: 'The password is not correct.',
      localUser: 'Local user',
      whoVotes: 'Who is voting?',
      yourName: 'Your name',
      namePlaceholder: 'e.g. Jorit',
      continue: 'Continue',
      savedUsers: 'Saved users'
    },
    home: {
      greeting: (name: string) => `Hi ${name}`,
      ratedProgress: (rated: number, total: number) => `${rated} of ${total} rated`,
      progressLabel: (progress: number) => `${progress} percent progress`,
      searchPlaceholder: 'Search country, artist, or song',
      all: 'All',
      rated: 'Rated',
      unrated: 'Open',
      sortDefault: 'Default',
      sortFavorites: 'Favorites'
    },
    detail: {
      average: 'Average',
      total: 'Total',
      emptyCategories: 'Create categories first to assign scores.',
      clear: 'clear',
      notes: 'Notes',
      notesPlaceholder: 'Impression, highlights, live reaction...',
      nextEntry: 'Next entry'
    },
    categories: {
      title: 'Global categories',
      description: 'These categories apply to all entries. Scores are saved per country.',
      placeholder: 'e.g. Outfit',
      add: 'Add',
      remove: 'Remove',
      categoryLabel: (name: string) => `Category ${name}`,
      createError: 'Category could not be created.'
    },
    jury: {
      title: 'Jury points',
      complete: 'Top 10 complete',
      missingValues: (count: number) => `${count} values missing`,
      unique: 'Unique',
      duplicate: 'Duplicate',
      missing: (points: readonly number[]) => `Missing: ${points.map((point) => `${point} pts`).join(', ')}`,
      selectCountry: 'Select country',
      categoryHint: (country: string, average: number) => `category hint: ${country} · ${average} avg`,
      personalTopTen: 'Personal Top 10'
    },
    sync: {
      autoStart: 'Auto-sync starting...',
      refreshingScores: 'Refreshing group scores...',
      autoSyncing: 'Auto-syncing...',
      usersInRoom: (count: number) => `${count} users in this room`,
      failed: 'Sync failed.',
      autoRoom: 'Auto-sync room',
      roomId: 'Room ID',
      autoRoomNote: 'You are automatically in this shared room after login.'
    },
    export: {
      title: 'Share and back up',
      description: 'Export your score as WhatsApp text or JSON for another device.',
      copied: 'Copied to clipboard.',
      importSummary: 'Import JSON',
      pasteJson: 'Paste JSON here',
      importComplete: 'Import complete.',
      importFailed: 'Import failed. Please check the JSON.',
      switchUser: 'Switch user',
      resetAll: 'Reset all',
      resetConfirm: 'Do you really want to reset all local data?'
    },
    final: {
      usersInGroup: (count: number) => `${count} users in group scores`,
      noWinner: 'No winner yet',
      winnerSummary: (points: number, voters: number) => `${points} jury points from ${voters} scorecards`,
      waitingForRanking: 'The live ranking appears here automatically once jury points are available.',
      groupFavorites: 'Group favorites',
      noJuryScore: 'No jury score',
      juryTotalRanking: 'Jury total ranking',
      noJuryPoints: 'No jury points synced yet.',
      categoryFavorites: 'Category favorites',
      categoryInfoLabel: 'Explain category favorites',
      categoryInfo:
        "The average is calculated from each user's category scores for that country. The rating count shows how many users have rated that country with categories.",
      noCategoryScores: 'No category scores synced yet.'
    },
    chat: {
      liveChat: 'Live chat',
      compact: 'Chat',
      openLabel: 'Open public chat',
      connectedPreview: 'Connected to public chat',
      connectingPreview: 'Connecting to public chat...',
      automaticallyConnected: 'Automatically connected',
      roomTitle: 'Eurovision room',
      close: 'Close chat',
      connected: 'Connected',
      connecting: 'Connecting...',
      disconnected: 'Disconnected. Reconnecting...',
      unavailable: 'WebSocket is unavailable in this browser.',
      empty: 'No messages yet. You are already in the public chat.',
      placeholderConnected: 'Write a message...',
      placeholderDisconnected: 'Chat server is not connected'
    },
    exportText: {
      title: (name: string) => `${name}'s Eurovision Jury 2026:`,
      points: (point: number, entry: string) => `${point} points: ${entry}`,
      open: 'open',
      notesTitle: 'Notes/Favorites:',
      stillOpen: (points: readonly number[]) => `Still open: ${points.join(', ')} points`
    }
  },
  de: {
    nav: {
      home: 'Teilnehmer',
      categories: 'Kategorien',
      jury: 'Jury',
      export: 'Export',
      scoreboard: 'Finale'
    },
    common: {
      appTitle: 'Private Jury 2026',
      lockApp: 'App sperren',
      back: 'Zurück',
      copy: 'Kopieren',
      import: 'Importieren',
      send: 'Senden',
      refreshNow: 'Aktualisieren',
      refreshing: 'Aktualisiere...',
      open: 'offen',
      averageShort: 'Ø',
      total: 'gesamt',
      rating: 'Wertung',
      ratings: 'Wertungen',
      stillOpen: 'Noch offen',
      points: (point: number) => `${point} Punkte`
    },
    auth: {
      eyebrow: 'Eurovision Tippspiel',
      subtitle: 'Privat geschützt, lokal gespeichert, ohne Account.',
      masterPassword: 'Master-Passwort',
      passwordPlaceholder: 'Passwort eingeben',
      openApp: 'App öffnen',
      wrongPassword: 'Das Passwort stimmt nicht.',
      localUser: 'Lokaler Nutzer',
      whoVotes: 'Wer stimmt ab?',
      yourName: 'Dein Name',
      namePlaceholder: 'z. B. Jorit',
      continue: 'Weiter',
      savedUsers: 'Gespeicherte Nutzer'
    },
    home: {
      greeting: (name: string) => `Hallo ${name}`,
      ratedProgress: (rated: number, total: number) => `${rated} von ${total} bewertet`,
      progressLabel: (progress: number) => `${progress} Prozent Fortschritt`,
      searchPlaceholder: 'Land, Artist oder Song suchen',
      all: 'Alle',
      rated: 'Bewertet',
      unrated: 'Offen',
      sortDefault: 'Standard',
      sortFavorites: 'Favoriten'
    },
    detail: {
      average: 'Durchschnitt',
      total: 'Summe',
      emptyCategories: 'Lege zuerst Kategorien an, um Punkte zu vergeben.',
      clear: 'löschen',
      notes: 'Notizen',
      notesPlaceholder: 'Eindruck, Highlights, Live-Reaktion...',
      nextEntry: 'Nächstes Land'
    },
    categories: {
      title: 'Globale Kategorien',
      description: 'Diese Kategorien gelten für alle Länder. Punkte bleiben pro Land gespeichert.',
      placeholder: 'z. B. Outfit',
      add: 'Hinzufügen',
      remove: 'Entfernen',
      categoryLabel: (name: string) => `Kategorie ${name}`,
      createError: 'Kategorie konnte nicht angelegt werden.'
    },
    jury: {
      title: 'Jury-Punkte',
      complete: 'Top 10 vollständig',
      missingValues: (count: number) => `${count} Werte fehlen`,
      unique: 'Eindeutig',
      duplicate: 'Doppelt',
      missing: (points: readonly number[]) => `Offen: ${points.map((point) => `${point}P`).join(', ')}`,
      selectCountry: 'Land auswählen',
      categoryHint: (country: string, average: number) => `Kategorie-Hinweis: ${country} · ${average} Ø`,
      personalTopTen: 'Persönliche Top 10'
    },
    sync: {
      autoStart: 'Auto-Sync startet...',
      refreshingScores: 'Gruppenstand wird aktualisiert...',
      autoSyncing: 'Synchronisiere automatisch...',
      usersInRoom: (count: number) => `${count} Nutzer im Raum`,
      failed: 'Sync fehlgeschlagen.',
      autoRoom: 'Auto-Sync-Raum',
      roomId: 'Raum-ID',
      autoRoomNote: 'Du bist nach dem Login automatisch in diesem gemeinsamen Raum.'
    },
    export: {
      title: 'Teilen und sichern',
      description: 'Exportiere deine Wertung als WhatsApp-Text oder JSON für ein anderes Gerät.',
      copied: 'In die Zwischenablage kopiert.',
      importSummary: 'JSON importieren',
      pasteJson: 'JSON hier einfügen',
      importComplete: 'Import abgeschlossen.',
      importFailed: 'Import fehlgeschlagen. Bitte JSON prüfen.',
      switchUser: 'Nutzer wechseln',
      resetAll: 'Alles zurücksetzen',
      resetConfirm: 'Lokale Daten wirklich komplett zurücksetzen?'
    },
    final: {
      usersInGroup: (count: number) => `${count} Nutzer im Gruppenstand`,
      noWinner: 'Noch kein Gewinner',
      winnerSummary: (points: number, voters: number) => `${points} Jury-Punkte aus ${voters} Wertungen`,
      waitingForRanking: 'Der Live-Stand erscheint hier automatisch, sobald Jury-Punkte vorhanden sind.',
      groupFavorites: 'Gruppenfavoriten',
      noJuryScore: 'Keine Jury-Wertung',
      juryTotalRanking: 'Jury-Gesamtwertung',
      noJuryPoints: 'Noch keine Jury-Punkte synchronisiert.',
      categoryFavorites: 'Kategorie-Favoriten',
      categoryInfoLabel: 'Kategorie-Favoriten erklären',
      categoryInfo:
        'Der Durchschnitt wird aus den Kategoriepunkten der Nutzer für dieses Land berechnet. Die Anzahl der Wertungen zeigt, wie viele Nutzer dieses Land mit Kategorien bewertet haben.',
      noCategoryScores: 'Noch keine Kategoriepunkte synchronisiert.'
    },
    chat: {
      liveChat: 'Live-Chat',
      compact: 'Chat',
      openLabel: 'Öffentlichen Chat öffnen',
      connectedPreview: 'Mit öffentlichem Chat verbunden',
      connectingPreview: 'Verbinde mit öffentlichem Chat...',
      automaticallyConnected: 'Automatisch verbunden',
      roomTitle: 'Eurovision-Raum',
      close: 'Chat schließen',
      connected: 'Verbunden',
      connecting: 'Verbinde...',
      disconnected: 'Getrennt. Verbinde erneut...',
      unavailable: 'WebSocket ist in diesem Browser nicht verfügbar.',
      empty: 'Noch keine Nachrichten. Du bist schon im öffentlichen Chat.',
      placeholderConnected: 'Nachricht schreiben...',
      placeholderDisconnected: 'Chat-Server ist nicht verbunden'
    },
    exportText: {
      title: (name: string) => `${name}s Eurovision Jury 2026:`,
      points: (point: number, entry: string) => `${point} Punkte: ${entry}`,
      open: 'offen',
      notesTitle: 'Notizen/Favoriten:',
      stillOpen: (points: readonly number[]) => `Noch offen: ${points.join(', ')} Punkte`
    }
  }
} as const;

export type Copy = (typeof translations)[Language];

export const getCopy = (language: Language = DEFAULT_LANGUAGE) => translations[language] ?? translations.en;

export const isLanguage = (value: unknown): value is Language => value === 'en' || value === 'de';
