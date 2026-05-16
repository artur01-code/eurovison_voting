import type { Language } from '../types';

export const DEFAULT_LANGUAGE: Language = 'en';

export const translations = {
  en: {
    nav: {
      home: 'Entries',
      categories: 'Categories',
      jury: 'Jury',
      scoreboard: 'Final'
    },
    common: {
      appTitle: 'Private Jury 2026',
      lockApp: 'Lock app',
      switchUser: 'Switch user',
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
      eliminated: 'eliminated',
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
      savedUsers: 'Saved users',
      deleteUser: (name: string) => `Delete ${name}`,
      deleteUserConfirm: (name: string) => `Delete all local data for ${name}? This cannot be undone on this device.`
    },
    home: {
      greeting: (name: string) => `Hi ${name}`,
      ratedProgress: (rated: number, total: number) => `${rated} of ${total} rated`,
      progressLabel: (progress: number) => `${progress} percent progress`,
      searchPlaceholder: 'Search country, artist, or song',
      all: 'All',
      rated: 'Rated',
      unrated: 'Open',
      filterLabel: 'Show',
      sortLabel: 'Sort',
      searchAction: 'Search',
      closeSearch: 'Close search',
      sortDefault: 'Running order',
      sortFavorites: 'Favorites'
    },
    help: {
      entriesTitle: 'Start here',
      entriesBody:
        'Open an entry, score it with your private categories, and use Favorites sorting when you want to see your personal frontrunners.',
      detailTitle: 'Your private notes',
      detailBody:
        'Category scores and notes stay personal. They help you compare songs during the show, but only your final Jury points are shared.',
      categoriesTitle: 'Build your own scorecard',
      categoriesBody:
        'Create categories that matter to you, such as Voice, Staging, Outfit, or Fun factor. They apply to every country.',
      juryTitle: 'This is the shared vote',
      juryBody:
        'Assign each classic Eurovision value once. These Jury points are synced with the group and create the final result.',
      exportTitle: 'Backup or move devices',
      exportBody:
        'Use text for sharing your vote in a chat, or JSON if you want to restore your local data on another phone.',
      finalTitle: 'Group result',
      finalBody:
        'The Final tab combines all synced Jury points. Everyone does not need to be online at the same time; the latest saved scores stay in the shared room.'
    },
    onboarding: {
      openHelp: 'Open app guide',
      stepLabel: (current: number, total: number) => `Step ${current} of ${total}`,
      back: 'Back',
      next: 'Next',
      finish: 'Start voting',
      skip: 'Skip guide',
      steps: [
        {
          view: 'categories',
          target: 'categories',
          title: 'Create your personal categories',
          body: 'First decide what you want to rate. Categories are your own scorecard and are not visible to the other players.',
          points: [
            'Examples: Voice, Outfit, Performance, Song, Fun factor, Staging.',
            'You can rename or delete categories at any time.',
            'The same categories appear for every entry.'
          ]
        },
        {
          view: 'home',
          target: 'entries',
          title: 'Rate entries for yourself',
          body: 'On the Entries tab you open each country and score it with your categories. Notes are useful for live reactions during the final.',
          points: [
            'Your progress shows how many entries you have already rated.',
            'Search helps you quickly find a country, artist, or song.',
            'Favorites sorting shows your highest category scores first.'
          ]
        },
        {
          view: 'jury',
          target: 'jury',
          title: 'Turn favorites into Jury points',
          body: 'Your category scores help you decide, but they do not automatically pick the final vote. You choose the Eurovision points yourself.',
          points: [
            'Use each value exactly once: 12, 10, 8, 7, 6, 5, 4, 3, 2, 1.',
            'A country can only receive one Jury value.',
            'Small hints show which entries your categories currently favor.'
          ]
        },
        {
          view: 'scoreboard',
          target: 'final',
          title: 'Follow the group result',
          body: 'The Final tab combines the Jury points from everyone in the shared room, even if not everyone is online right now.',
          points: [
            'The overall ranking comes from the shared Jury points.',
            'Group favorites show what each person currently has at the top.',
            'Category favorites are separate and only summarize private category ratings.'
          ]
        },
        {
          view: 'jury',
          target: 'jury-share',
          title: 'Share your result quickly',
          body: 'The public chat is always available through the bubble. In the Jury tab you can share your score as a text message.',
          points: [
            'Chat messages are live for online users.',
            'The share icon can open your phone share sheet.',
            'WhatsApp receives the readable points summary directly.'
          ]
        }
      ]
    },
    detail: {
      average: 'Average',
      total: 'Total',
      emptyCategories: 'Create categories first to assign scores.',
      clear: 'clear',
      notes: 'Notes',
      notesPlaceholder: 'Impression, highlights, live reaction...',
      backToOverview: 'Back to overview',
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
      chooseForPoints: (point: number) => `Choose ${point} points`,
      clearSelection: 'Clear selection',
      alreadyAssigned: 'Already assigned',
      categoryHint: (country: string, average: number) => `category hint: ${country} · ${average} avg`,
      shareScore: 'Share score',
      shareCopied: 'Score copied to clipboard.',
      shared: 'Share sheet opened.',
      personalTopTen: 'Personal Top 10'
    },
    sync: {
      autoStart: 'Auto-sync starting...',
      refreshingScores: 'Refreshing group scores...',
      autoSyncing: 'Auto-syncing...',
      usersInRoom: (count: number) => `${count} users in this room`,
      failed: 'Sync failed.'
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
      tabsLabel: 'Final sections',
      tabs: {
        favorites: 'Favorites',
        jury: 'Jury',
        categories: 'Categories',
        personal: 'My Top 10'
      },
      groupFavorites: 'Group favorites',
      groupFavoritesInfo: 'Shows each player’s current 12-point entry, or what is still missing.',
      noJuryScore: 'No jury score',
      juryTotalRanking: 'Jury total ranking',
      juryInfo: 'This is the shared group result from everyone’s final Jury points. Expand a country to see who voted for it.',
      noJuryPoints: 'No jury points synced yet.',
      showVotes: (count: number) => `${count} votes`,
      categoryFavorites: 'Category favorites',
      categoryInfoLabel: 'Explain category favorites',
      categoryInfo:
        "The average is calculated from each user's category scores for that country. The rating count shows how many users have rated that country with categories.",
      noCategoryScores: 'No category scores synced yet.',
      personalInfo: 'Your personal final Top 10. This is the same Jury scorecard you assign in the Jury tab.'
    },
    chat: {
      liveChat: 'Live chat',
      compact: 'Chat',
      openLabel: 'Open public chat',
      connectedPreview: 'Connected to public chat',
      connectingPreview: 'Connecting to public chat...',
      roomTitle: 'Eurovision room',
      close: 'Close chat',
      connected: 'Connected',
      connecting: 'Connecting...',
      disconnected: 'Disconnected. Reconnecting...',
      unavailable: 'WebSocket is unavailable in this browser.',
      onlineUsers: 'Online users',
      noOnlineUsers: 'No online users yet.',
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
      scoreboard: 'Finale'
    },
    common: {
      appTitle: 'Private Jury 2026',
      lockApp: 'App sperren',
      switchUser: 'Nutzer wechseln',
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
      eliminated: 'ausgeschieden',
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
      savedUsers: 'Gespeicherte Nutzer',
      deleteUser: (name: string) => `${name} löschen`,
      deleteUserConfirm: (name: string) =>
        `Alle lokalen Daten von ${name} löschen? Das kann auf diesem Gerät nicht rückgängig gemacht werden.`
    },
    home: {
      greeting: (name: string) => `Hallo ${name}`,
      ratedProgress: (rated: number, total: number) => `${rated} von ${total} bewertet`,
      progressLabel: (progress: number) => `${progress} Prozent Fortschritt`,
      searchPlaceholder: 'Land, Artist oder Song suchen',
      all: 'Alle',
      rated: 'Bewertet',
      unrated: 'Offen',
      filterLabel: 'Anzeigen',
      sortLabel: 'Sortieren',
      searchAction: 'Suchen',
      closeSearch: 'Suche schließen',
      sortDefault: 'Startreihenfolge',
      sortFavorites: 'Favoriten'
    },
    help: {
      entriesTitle: 'Hier starten',
      entriesBody:
        'Öffne einen Beitrag, bewerte ihn mit deinen privaten Kategorien und nutze die Favoriten-Sortierung, um deine persönlichen Spitzenreiter zu sehen.',
      detailTitle: 'Deine privaten Notizen',
      detailBody:
        'Kategoriepunkte und Notizen bleiben persönlich. Sie helfen dir beim Vergleichen, geteilt werden später nur deine finalen Jury-Punkte.',
      categoriesTitle: 'Baue deinen eigenen Bewertungsbogen',
      categoriesBody:
        'Lege Kategorien an, die dir wichtig sind, zum Beispiel Stimme, Staging, Outfit oder Spaßfaktor. Sie gelten für alle Länder.',
      juryTitle: 'Das ist die geteilte Wertung',
      juryBody:
        'Vergib jeden klassischen Eurovision-Wert genau einmal. Diese Jury-Punkte werden mit der Gruppe synchronisiert und ergeben das finale Ergebnis.',
      exportTitle: 'Sichern oder Gerät wechseln',
      exportBody:
        'Nutze Text zum Teilen deiner Wertung im Chat, oder JSON, wenn du deine lokalen Daten auf einem anderen Handy wiederherstellen möchtest.',
      finalTitle: 'Gruppenergebnis',
      finalBody:
        'Der Finale-Tab kombiniert alle synchronisierten Jury-Punkte. Nicht alle müssen gleichzeitig online sein; der letzte gespeicherte Stand bleibt im geteilten Raum.'
    },
    onboarding: {
      openHelp: 'App-Erklärung öffnen',
      stepLabel: (current: number, total: number) => `Schritt ${current} von ${total}`,
      back: 'Zurück',
      next: 'Weiter',
      finish: 'Loslegen',
      skip: 'Erklärung überspringen',
      steps: [
        {
          view: 'categories',
          target: 'categories',
          title: 'Lege deine persönlichen Kategorien an',
          body: 'Entscheide zuerst, wonach du bewerten möchtest. Kategorien sind dein eigener Bewertungsbogen und für die anderen nicht sichtbar.',
          points: [
            'Beispiele: Stimme, Outfit, Performance, Song, Spaßfaktor, Staging.',
            'Du kannst Kategorien jederzeit umbenennen oder löschen.',
            'Die gleichen Kategorien erscheinen bei jedem Beitrag.'
          ]
        },
        {
          view: 'home',
          target: 'entries',
          title: 'Bewerte die Beiträge für dich',
          body: 'Im Teilnehmer-Tab öffnest du jedes Land und vergibst Punkte in deinen Kategorien. Notizen helfen für Live-Eindrücke während des Finales.',
          points: [
            'Der Fortschritt zeigt, wie viele Beiträge du schon bewertet hast.',
            'Über die Suche findest du schnell Land, Artist oder Song.',
            'Die Favoriten-Sortierung zeigt deine höchsten Kategoriepunkte zuerst.'
          ]
        },
        {
          view: 'jury',
          target: 'jury',
          title: 'Aus Favoriten werden Jury-Punkte',
          body: 'Deine Kategoriepunkte helfen bei der Entscheidung, wählen aber nicht automatisch. Die finalen Eurovision-Punkte vergibst du selbst.',
          points: [
            'Nutze jeden Wert genau einmal: 12, 10, 8, 7, 6, 5, 4, 3, 2, 1.',
            'Ein Land kann nur einen Jury-Wert bekommen.',
            'Kleine Hinweise zeigen, welche Beiträge deine Kategorien gerade favorisieren.'
          ]
        },
        {
          view: 'scoreboard',
          target: 'final',
          title: 'Verfolge das Gruppenergebnis',
          body: 'Der Finale-Tab kombiniert die Jury-Punkte aller Personen im geteilten Raum, auch wenn gerade nicht alle online sind.',
          points: [
            'Die Gesamtwertung entsteht aus den geteilten Jury-Punkten.',
            'Gruppenfavoriten zeigen, wer aktuell wen ganz vorne hat.',
            'Kategorie-Favoriten sind getrennt davon und fassen nur private Kategoriebewertungen zusammen.'
          ]
        },
        {
          view: 'jury',
          target: 'jury-share',
          title: 'Teile deine Wertung schnell',
          body: 'Der öffentliche Chat ist immer über die Bubble erreichbar. Im Jury-Tab kannst du deine Punkte als Textnachricht teilen.',
          points: [
            'Chat-Nachrichten sind live für Nutzer, die online sind.',
            'Das Teilen-Symbol kann das Teilen-Menü deines Handys öffnen.',
            'WhatsApp bekommt direkt die lesbare Punkte-Zusammenfassung.'
          ]
        }
      ]
    },
    detail: {
      average: 'Durchschnitt',
      total: 'Summe',
      emptyCategories: 'Lege zuerst Kategorien an, um Punkte zu vergeben.',
      clear: 'löschen',
      notes: 'Notizen',
      notesPlaceholder: 'Eindruck, Highlights, Live-Reaktion...',
      backToOverview: 'Zurück zur Übersicht',
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
      chooseForPoints: (point: number) => `${point} Punkte auswählen`,
      clearSelection: 'Auswahl löschen',
      alreadyAssigned: 'Schon vergeben',
      categoryHint: (country: string, average: number) => `Kategorie-Hinweis: ${country} · ${average} Ø`,
      shareScore: 'Wertung teilen',
      shareCopied: 'Wertung in die Zwischenablage kopiert.',
      shared: 'Teilen-Menü geöffnet.',
      personalTopTen: 'Persönliche Top 10'
    },
    sync: {
      autoStart: 'Auto-Sync startet...',
      refreshingScores: 'Gruppenstand wird aktualisiert...',
      autoSyncing: 'Synchronisiere automatisch...',
      usersInRoom: (count: number) => `${count} Nutzer im Raum`,
      failed: 'Sync fehlgeschlagen.'
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
      tabsLabel: 'Finale-Bereiche',
      tabs: {
        favorites: 'Favoriten',
        jury: 'Jury',
        categories: 'Kategorien',
        personal: 'Meine Top 10'
      },
      groupFavorites: 'Gruppenfavoriten',
      groupFavoritesInfo: 'Zeigt pro Person den aktuellen 12-Punkte-Favoriten oder was noch offen ist.',
      noJuryScore: 'Keine Jury-Wertung',
      juryTotalRanking: 'Jury-Gesamtwertung',
      juryInfo: 'Das ist das geteilte Gruppenergebnis aus den finalen Jury-Punkten. Klappe ein Land auf, um zu sehen, wer dafür gestimmt hat.',
      noJuryPoints: 'Noch keine Jury-Punkte synchronisiert.',
      showVotes: (count: number) => `${count} Stimmen`,
      categoryFavorites: 'Kategorie-Favoriten',
      categoryInfoLabel: 'Kategorie-Favoriten erklären',
      categoryInfo:
        'Der Durchschnitt wird aus den Kategoriepunkten der Nutzer für dieses Land berechnet. Die Anzahl der Wertungen zeigt, wie viele Nutzer dieses Land mit Kategorien bewertet haben.',
      noCategoryScores: 'Noch keine Kategoriepunkte synchronisiert.',
      personalInfo: 'Deine persönliche finale Top 10. Das ist dieselbe Jury-Wertung, die du im Jury-Tab vergibst.'
    },
    chat: {
      liveChat: 'Live-Chat',
      compact: 'Chat',
      openLabel: 'Öffentlichen Chat öffnen',
      connectedPreview: 'Mit öffentlichem Chat verbunden',
      connectingPreview: 'Verbinde mit öffentlichem Chat...',
      roomTitle: 'Eurovision-Raum',
      close: 'Chat schließen',
      connected: 'Verbunden',
      connecting: 'Verbinde...',
      disconnected: 'Getrennt. Verbinde erneut...',
      unavailable: 'WebSocket ist in diesem Browser nicht verfügbar.',
      onlineUsers: 'Online-Nutzer',
      noOnlineUsers: 'Noch keine Online-Nutzer.',
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
