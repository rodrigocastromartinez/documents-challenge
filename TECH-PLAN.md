# Technical Plan

This document lays out the technical decisions and implementation plan for the React Native
Developer challenge, before writing any application code. It complements the final `README.md`
(which will explain how to run/test the app and the reasoning behind the final result).

Part of this project's development is AI-assisted; [`AGENTS.md`](AGENTS.md) is kept alongside
this plan as a running log of conventions, constraints, and gotchas discovered along the way,
so that guidance given once doesn't need to be repeated in every session. This plan is the
source of truth for architecture decisions; `AGENTS.md` is the day-to-day working notes derived
from it.

## 1. Server integration facts (from the reference server)

The client integrates with the reference Go server provided alongside this challenge's brief
(its repository URL is in the original brief, not repeated here since the challenge asks not to
reference the company name anywhere in this project). It must be run locally:

- `GET http://localhost:8080/documents` — returns a JSON array of 1-21 randomly generated
  documents on every call. Document shape: `ID`, `Title`, `Version`, `CreatedAt`, `UpdatedAt`,
  `Attachments: string[]`, `Contributors: { ID, Name }[]`.
- `ws://localhost:8080/notifications` — a WebSocket stream that emits a message at random
  intervals (0-5s) whenever another user creates a document. Message shape: `Timestamp`,
  `UserID`, `UserName`, `DocumentID`, `DocumentTitle`.
- **There is no `POST`/create endpoint for documents anywhere in the server.** This is
  intentional on the server's side (it's a read-only fake-data generator), so:
  - "Creating a new document" is implemented as **client-side/local state only**: a new
    document is generated locally (client-generated UUID, `CreatedAt = now`) and prepended to
    the in-memory/cached list. It is not persisted to the server.
  - This is explicitly documented here (and will be repeated in the final README) so it reads
    as a deliberate architectural decision, not a missed requirement.

## 2. Runtime: Expo (managed) + TypeScript

**Decision: Expo managed workflow, TypeScript template.**

Reasoning:

- Every required/optional feature (HTTP fetch, native `WebSocket`, native share sheet, local
  notifications, key-value offline cache) is covered by the Expo SDK or standard web APIs — no
  feature requires a custom native module that would justify a bare/CLI workflow.
- Lower friction for whoever reviews the challenge: `npx expo start` + Expo Go (or a simple dev
  build) runs on iOS/Android without deep Xcode/Android Studio setup. Since the README must
  explain "how to run the code," simplicity here matters.
- If a feature later needs something unsupported in Expo Go (e.g. advanced local notification
  behavior), we can switch to `expo-dev-client` without leaving the Expo ecosystem — no need to
  eject.
- The only real integration risk is reaching `localhost:8080` from an emulator/simulator/device,
  which is a generic React Native networking concern (Android emulator needs `10.0.2.2`), not
  something specific to Expo.

Alternative considered: **React Native CLI (bare workflow)** — rejected because it adds native
configuration boilerplate (Podfile, Gradle, manual linking) without unlocking any capability the
app actually needs. Worth noting: my day-to-day production app is built with React Native CLI,
because it depends on native modules (an NFC reader) that require bare-workflow native code —
so this isn't unfamiliarity with the CLI workflow, it's a deliberate choice given this
challenge's much simpler native surface.

Language: **TypeScript** (strict mode) throughout, for type safety on API payloads, reducer
actions, and component props — directly supports "maintainable, well-written code."

## 3. Application architecture

### 3.1 Guiding principles

- **Feature-based structure**, not layer-based (no global `screens/`, `components/`, `redux/`
  dumped together). Each feature owns its API access, state, and UI. This is what makes it
  sustainable to add new features or change requirements: a change to how documents are
  fetched/stored stays inside `features/documents/`.
- **Separation of server-state vs. client/local-state.** Documents fetched from the API,
  locally-created documents, and the notification feed are conceptually different kinds of
  state with different lifecycles; they are not shoved into one giant store.
- **No premature abstraction.** No generic "framework" for CRUD, no repository/ORM-like layer
  (also explicitly disallowed by the challenge). Plain functions and hooks per feature.
- **Own code over dependencies** where the payoff is small (state management, date formatting,
  websocket reconnect logic) so the implementation showcases actual engineering, while relying
  on well-established libraries for things that are tedious and risky to hand-roll correctly
  (storage primitives).
- **No navigation library.** The mockups show a single screen (Documents, with list/grid/sort
  controls and a notification bell) plus one overlay ("Add document"). There is no multi-screen
  stack to manage, so `@react-navigation` would be a dependency solving a problem the app
  doesn't have. Screen-level composition is just `<DocumentsScreen />` rendered by `App.tsx`,
  and the "Add document" flow is a **bottom sheet** (slides up from the bottom, rounded top
  corners, dismissible via the `X` button or tapping the backdrop — not a centered floating
  dialog), toggled by local state. See §3.7 for how it's built. If a real navigation need shows
  up later (e.g. a document detail screen), it's a self-contained addition at that point —
  nothing in this plan depends on avoiding it out of principle.
- **Every component gets a `testID` and, where it renders meaningful content, an
  `accessibilityLabel`/`accessibilityRole`.** This isn't an afterthought bolted on before
  submission — it's a rule applied from the first component (see AGENTS.md). Two distinct
  reasons drive this, not one: (1) tests query by `testID` rather than matching rendered text,
  so a copy change (i18n string, exact wording) doesn't break a test that was really asserting
  "this element is present and did X," not "this exact string is on screen"; (2) VoiceOver/
  TalkBack support isn't optional polish for a document-management app. Shared components
  (`Button`, `Spinner`, `EmptyState`, `ErrorView`) accept `testID` as a prop so call sites can
  assign meaningful, unique IDs; feature components derive `testID`s from stable domain data
  where one exists (e.g. `` `document-item-${document.id}` ``) rather than from array index.

### 3.2 Folder structure

```
src/
├─ App.tsx                      Root component: providers + <DocumentsScreen />
├─ features/
│  ├─ documents/
│  │  ├─ api/
│  │  │  └─ getDocuments.ts     fetch wrapper + mapping to domain types
│  │  ├─ store/
│  │  │  ├─ documentsReducer.ts        loading/success/error/refetch + locally created docs
│  │  │  ├─ DocumentsProvider.tsx
│  │  │  ├─ localDocumentsStorage.ts   AsyncStorage gateway for locally-created documents
│  │  │  └─ remoteDocumentsCache.ts    AsyncStorage gateway for the last-known /documents response
│  │  ├─ hooks/
│  │  │  └─ useDocuments.ts
│  │  ├─ components/
│  │  │  ├─ DocumentsScreen.tsx   thin composition: header + <DocumentsContent />
│  │  │  ├─ DocumentsContent.tsx  loading / error / empty / list state switch
│  │  │  ├─ DocumentListItem.tsx
│  │  │  ├─ DocumentGridItem.tsx
│  │  │  ├─ ViewToggle.tsx        list / grid switch
│  │  │  ├─ SortBySelect.tsx      title / date sort control
│  │  │  ├─ OfflineBanner.tsx     "showing cached data" banner (see §3.8)
│  │  │  └─ AddDocumentSheet.tsx  Name / Version / File form
│  │  ├─ sortDocuments.ts          pure (documents, sortKey) -> Document[]
│  │  ├─ shareDocument.ts          native Share wrapper (see §3.7)
│  │  └─ types.ts
│  └─ notifications/
│     ├─ socket/
│     │  └─ NotificationsClient.ts   WebSocket wrapper: connect / reconnect / teardown
│     ├─ localNotifications.ts        expo-notifications wrapper (request perms, present)
│     ├─ store/
│     │  ├─ notificationsReducer.ts  feed + unread count
│     │  └─ NotificationsProvider.tsx
│     ├─ hooks/
│     │  └─ useNotifications.ts
│     └─ components/
│        ├─ NotificationBell.tsx     header icon + unread badge
│        └─ NotificationBanner.tsx   in-app toast on new message
├─ shared/
│  ├─ components/     Button.tsx, Text.tsx, Spinner.tsx, EmptyState.tsx, ErrorView.tsx
│  ├─ theme/           colors.ts, spacing.ts, typography.ts, shadow.ts (cross-platform card shadow)
│  ├─ utils/           formatRelativeDate.ts
│  ├─ network/         httpClient.ts, resolveApiBaseUrl.ts
│  ├─ i18n/             t.ts + strings/en.ts (see §3.9)
│  └─ hooks/           useIsOnline.ts   connectivity, for the offline banner
└─ __tests__/          or *.test.ts colocated next to the unit under test
```

Why this scales: adding a new feature (e.g. document detail) means adding
`features/document-detail/` without touching `documents` or `notifications` internals. Changing
a requirement (e.g. "documents must come from a different backend") is isolated to
`features/documents/api/`.

Two structure conventions worth making explicit:

- **`*Screen` files are thin composition only.** A screen wires state (hooks) to components and
  lays out the top-level regions; any conditional rendering logic (loading/error/empty/data
  switches) lives in its own component (`DocumentsContent`), not inline in the screen. If a
  screen file needs a locally-defined helper component, that's the signal to extract it.
- **No top-level `screens/` folder — screens are feature-owned.** A global `screens/` directory
  was considered and rejected: it reintroduces layer-based grouping, splitting each feature
  across two trees (its screen in `screens/`, everything else in `features/`), so a requirement
  change touches both. Folders should group what changes together, not what looks alike —
  `DocumentsScreen` is the visible face of the documents feature, so it lives with it. If a
  feature ever grows several screens, they'd go under `features/<name>/screens/`, still inside
  the feature. The only screen-related thing that lives at the top is composition itself
  (`App.tsx` mounting providers + the screen), which is genuinely app-level.

### 3.3 State management

**Decision: Context + `useReducer`, hand-written per feature. No Redux/Zustand.**

Reasoning: the app has exactly two pieces of non-trivial state (documents, notifications) plus
transient UI state (view mode, form open/closed) that belongs in component state, not global
state. A general-purpose state library would add indirection without solving a real problem at
this scale, and hand-writing the store makes more of the logic ours to be assessed on. Each
feature exposes:

- a `*Reducer.ts` (pure, unit-testable in isolation),
- a `*Provider` component wrapping `children` with `useReducer` + effects (fetch on mount,
  socket connection lifecycle),
- a `use*()` hook as the only consumption surface for components (keeps the reducer/dispatch
  private to the feature).

If the app were to grow substantially (many more entities, cross-feature state), this is the
seam where Redux Toolkit or Zustand would be introduced later without a full rewrite — components
only depend on the `use*()` hook API, not on Context internals.

### 3.4 Data fetching (`documents`)

- `getDocuments()` — plain `fetch` against `resolveApiBaseUrl()/documents`, with a timeout guard
  and JSON validation/mapping into a typed `Document`.
- `useDocuments()` — owns loading/success/error/refetch via reducer; exposes `refetch()` for
  pull-to-refresh.
- Locally created documents live in the same reducer, tagged (`origin: "local"` vs
  `"remote"`) so the UI can optionally indicate that, and are prepended to the merged list shown
  to the user, and (for offline support) persisted to `AsyncStorage` so they survive an app
  restart.
- **A locally-created document gets one hardcoded contributor representing the app's user**,
  since (per §7) there's no authentication on the reference server and therefore no real session
  to pull a name from. This is a placeholder standing in for "whoever is logged in" — the point
  in the code where it's set (`DocumentsProvider.addLocalDocument`) is commented accordingly so
  it reads as a deliberate stand-in, not a forgotten TODO.
- **Local document IDs use `expo-crypto`'s `randomUUID()`**, not a hand-rolled generator.
  Hermes doesn't ship `crypto.randomUUID`, so something has to fill that gap — and ID generation
  is exactly the kind of small-surface-but-easy-to-get-subtly-wrong problem (RFC 4122 format,
  actual CSPRNG-backed randomness) this plan's §3.1 principle already carves out an exception
  for, the same reasoning applied to `NetInfo` in §3.8. `expo-crypto` is already effectively
  "in the SDK" — no bare-workflow cost to reach for it.
- No React Query/SWR: the API surface is a single GET endpoint with no pagination, mutation, or
  cache-invalidation complexity that would justify the dependency; a hand-written reducer covers
  it more transparently.

### 3.5 Real-time notifications

- `NotificationsClient` — a small class wrapping the native `WebSocket`: connects to
  `ws://<host>:8080/notifications`, parses incoming JSON messages, exposes `onMessage`/`onStatus`
  callbacks, and implements reconnect-with-backoff on close/error (capped exponential backoff,
  cancellable on unmount). Unit-tested in isolation with `jest-websocket-mock`, independent of
  React; the backoff delay math is factored into a plain `computeReconnectDelay` function so it
  can be tested without fake timers, which don't mix with `jest-websocket-mock` (see AGENTS.md).
- `NotificationsProvider` — instantiates the client, feeds messages into a reducer tracking
  connection status, unread count, and the single most recent message (no feed/history is kept —
  see the "not merged with documents" reasoning below), tears the client down on unmount.
- UI: `NotificationBell` (header icon + unread badge) and `NotificationBanner` (an in-app
  toast — "X created document Y" — that auto-dismisses after a few seconds or on manual
  dismiss).
- **Local notifications (optional feature, implemented)**: the same WebSocket message pipeline
  triggers an `expo-notifications` local notification (`localNotifications.ts`) whenever a
  message arrives while the app is backgrounded — foregrounded arrivals only show the in-app
  banner, not a system notification too, since that would be a redundant/noisy double-signal for
  the same event. Design decisions that came out of actually watching it run:
  - **A fixed notification `identifier`**, so each new message replaces the previous system
    notification instead of piling up — the server emits every 0-5s, so without this the
    notification center accumulates dozens of entries in a minute. One "latest" notification
    mirrors the in-app state (a single `latestMessage`, no feed/history).
  - **Delivered notifications are dismissed when the app returns to the foreground** — once the
    user is looking at the app, the bell/banner tell the story; a stale system notification on
    top of that is noise.
  - **Backgrounded-ness is read from `AppState.currentState` at message-arrival time** (kept in
    sync natively by RN), not through a state hook — the socket's `onMessage` callback is
    created once and must not be recreated per foreground/background transition, and
    subscribing through render state would also re-render the whole provider subtree on every
    transition for a value only a callback needs.
  - **Android notification channel** (`setNotificationChannelAsync`) is registered up front —
    required on Android 8+ for notifications to display at all; a no-op on iOS.
  - **`expo-notifications` is loaded via a guarded `require()`, not a static `import`, and
    skipped entirely on Android when running inside Expo Go.** The versioned Expo docs (SDK 57)
    say local (non-push) notifications work in Expo Go without a development build, and that's
    true on iOS — but verified on a real Android Studio emulator, just _importing_ the package
    crashes the app on launch in that combination: it registers a push-token listener at module
    load time regardless of whether push is ever used, and that listener unconditionally throws
    on Android inside Expo Go (vs. only a `console.warn` elsewhere). See AGENTS.md for the full
    trace. Since a static import always executes regardless of any runtime check inside it, the
    only fix is to never let the real module load in that one combination — local notifications
    are then silently unavailable there, while everything else (including local notifications on
    a real Android build, dev or production) keeps working.
- **The bell glyph is a `.webp` image asset (`features/notifications/assets/bell.webp`),
  tinted via `Image`'s `tintColor` style, not a vector icon library.** `react-native-svg` was
  tried first, but pulling in a full SVG-rendering library for a single static icon isn't
  justified — this app has exactly one icon that needs to look like a real vector glyph rather
  than a text/emoji character (see §3.7 for why `☰`/`⊞`/`✕` elsewhere are plain text glyphs
  instead). A pre-rendered image sized for its one fixed use gets the same visual result with no
  new dependency, consistent with §3.1's "own code/assets over dependencies where the payoff is
  small."
- **Pressing the bell clears the unread count _and_ dismisses the banner.** The brief doesn't
  fully specify how the bell and the banner should interact, so this is a deliberate
  interpretation: from the user's point of view, tapping the bell means "I've seen this", and
  leaving a banner on screen claiming there's something new to see while the badge simultaneously
  resets to zero would read as a contradiction. There is still no history screen behind the bell
  (out of scope per the "optionally a small history" wording above) — tapping it purely
  acknowledges the current unread state.
- **A notification does not insert a document into the list.** The two features are wired
  together only through the user noticing the banner and pulling to refresh — the notification
  feed and the documents list are deliberately not merged. Reasoning: the reference server
  regenerates 1-21 random documents on every `GET /documents` call, so it has no stable
  document identity across requests. Inserting a document sourced from a notification's
  `DocumentID`/`DocumentTitle` would produce an entry that very likely vanishes or contradicts
  the list on the next fetch (initial load or pull-to-refresh) — a confusing, self-contradicting
  UI. Treating the notification purely as "something changed, you may want to refresh" avoids
  building a merge/reconciliation layer for data the server itself doesn't keep stable.

### 3.6 Networking base URL resolution — via environment variables

A single `resolveApiBaseUrl()` in `shared/network/`, driven entirely by **environment
variables** (Expo's `EXPO_PUBLIC_*` mechanism), never hardcoded and never committed:

- `EXPO_PUBLIC_API_HOST` / `EXPO_PUBLIC_API_PORT` (default `8080`) resolved per platform:
  - iOS Simulator → `localhost`
  - Android Emulator → `10.0.2.2`
  - Physical device via Expo Go → LAN IP of the dev machine (must be set explicitly, since it
    cannot be auto-detected reliably)
- `.env.example` is committed with placeholder/non-secret values and documents every variable;
  the real `.env` is **git-ignored** (`.gitignore` entry added in the very first scaffold
  commit, before any `.env` file can ever exist) and each developer/reviewer creates their own
  from the example file, per the README instructions.
- Security posture, since this is explicitly the area most likely to be scrutinized:
  - There are currently no real secrets in this app (the reference server has no auth/API
    keys) — but the mechanism is built as if there were, so it's the right shape from day one
    rather than retrofitted later.
  - Nothing sensitive is ever hardcoded in source, logged, or committed.
  - If a real API key were introduced later, it would **not** use `EXPO_PUBLIC_*` (that prefix
    is inlined into the JS bundle at build time and is readable by anyone with the app binary —
    fine for a non-secret host/port, wrong for credentials). A real secret would instead be kept
    server-side or injected at build time via EAS Secrets / CI environment variables, never
    shipped to the client bundle.
  - `app.config.ts` reads from `process.env` rather than defining values inline, so there is a
    single source of truth and no risk of drift between environments.

### 3.7 UI

- Single `DocumentsScreen` (matches the mockups): header with title + notification bell,
  a controls row (`SortBySelect` + `ViewToggle`), the list/grid itself, and a bottom
  "Add document" button that opens `AddDocumentSheet`.
- **Two-tone background, matching the mockups exactly**: the header (title + bell) sits on a
  white background that also fills the safe-area inset above it (status bar/notch), while the
  content area below (controls row + list/grid) sits on the light gray background — the split
  happens right below the header, not at the screen edges. Implementation: the outer
  `SafeAreaView` itself is white (so its top safe-area padding renders white, not gray), and a
  separate inner `View` wrapping the content area carries the gray background. Getting this
  backwards (gray on the outer container) was the first UI review finding — worth calling out
  since it's an easy default to get wrong when reasoning about "one background color" instead of
  the actual two-region layout in the mockup.
- **Cards have a subtle shadow** (`shadowColor`/`shadowOffset`/`shadowOpacity`/`shadowRadius` on
  iOS, `elevation` on Android via `Platform.select`), matching the mockup's card treatment —
  without it the white cards have no visual separation from the gray background behind them.
- **`AddDocumentSheet` (bottom sheet, not a centered modal)**: built on top of React Native's
  built-in `Modal` (`transparent` + `animationType="slide"`) — a dimmed backdrop `View` behind a
  sheet `View` anchored to the bottom of the screen with rounded top corners, containing the
  `Name`/`Version`/`File`/`Submit` form from the mockup. The mockup's sheet has no drag handle
  and no intermediate snap points, just slide-in/slide-out, so this is hand-rolled instead of
  pulling in `@gorhom/bottom-sheet` (which exists for drag-to-resize/snap-point sheets — more
  than this UI needs). If a future requirement adds drag-to-dismiss or multiple snap points,
  that's the point where introducing that library would start paying for itself. Since the sheet
  has text inputs and sits at the bottom of the screen, it wraps its content in a
  `KeyboardAvoidingView` — otherwise the keyboard covers the `Name`/`Version` fields on both
  platforms, a well-known RN footgun for bottom-anchored forms.
- **The "File" field is a non-functional placeholder for now** ("Choose file" button that just
  reflects a fixed/mock filename into the form state, not a real picker). Given the server has
  no upload endpoint at all (§1), a real file the user picks would have nowhere to go except the
  same client-only `Attachments` array as a plain string — so wiring up an actual native picker
  buys realism without buying any new behavior worth demonstrating. `expo-document-picker` is
  the correct library **if** this becomes a real field later: it's a thin, purpose-built wrapper
  over each platform's native file picker UI, and reimplementing that native chrome by hand would
  be pure busywork. That decision is deliberately deferred rather than made now — revisit this
  note if the placeholder ends up feeling too thin during implementation.
- List/grid toggle over the same `Document[]` data source: one `FlatList` with `numColumns`
  driven by view mode, sharing a single item-shape contract but two presentational components
  (`DocumentListItem`, `DocumentGridItem`). Note for implementation: RN's `FlatList` throws if
  `numColumns` changes on a list that's already rendered with a different value — the list needs
  a `key` (e.g. `key={viewMode}`) tied to the view mode so it remounts instead of updating in
  place when the toggle is pressed.
- **Sort by** control (`SortBySelect`): lets the user sort the documents by **Title** (A→Z) or
  **Date** (newest first, using `CreatedAt`). **Default is Date**, matching required feature #1
  ("display the most recent documents created") — the list should already read as
  most-recent-first before the user touches the sort control, not after. Sorting is a derived
  value (`useMemo` over the reducer's document list + the selected sort key), not stored state
  duplicated elsewhere — keeps a single source of truth for "what documents exist" separate from
  "how they're currently ordered."
- Pull-to-refresh via `FlatList`'s built-in `refreshControl` calling `useDocuments().refetch()`.
- Share button uses the built-in React Native `Share` API (no extra dependency needed for
  plain text/URL sharing).
- Relative dates via a small hand-written `formatRelativeDate(date: Date): string` utility —
  simple enough to not justify pulling in `dayjs`/`date-fns` for one function, and it's easy to
  unit test exhaustively. **Bounded relative range, falling back to an absolute date**: "just
  now" / "X minutes ago" / "X hours ago" / "Yesterday" for anything within the last ~36 hours,
  and a plain formatted date (e.g. "Mar 10, 2002") for anything older. This wasn't the original
  plan — it came from actually running the reference server (see AGENTS.md) and finding that
  `CreatedAt`/`UpdatedAt` are fully random timestamps with no real recency (values ranging from
  the 1900s to decades in the future), since the server exists to generate fake data, not to
  track real document history. An unbounded relative formatter would print nonsense like "
  120 years ago" for most documents; capping the relative window to what's actually meaningful (today
  vs. yesterday vs. a few hours ago) and showing a real date for everything else keeps the UI
  honest about what the data actually is, rather than manufacturing false precision from
  effectively random inputs.

### 3.8 Offline support (optional feature, detailed)

This needs more than "cache to AsyncStorage" to actually hold up, so here's the full behavior:

- **What gets persisted, and why two different things are persisted for two different reasons:**
  - _Remote documents_ (from `GET /documents`): persisted purely as a **read cache**, so the
    last successful response survives an app restart / offline launch. This is the classic
    stale-while-revalidate case.
  - _Locally-created documents_: persisted **unconditionally, online or offline**, because —
    as established in §1 — the server has no create endpoint at all. AsyncStorage is the only
    place these ever live, so this isn't really "offline support," it's the actual source of
    truth for anything the user creates, and it needs to survive restarts regardless of
    connectivity. Calling this out explicitly so it doesn't read as a gap: there is no
    write-queue/sync-on-reconnect logic to build, because there is no server write path to sync
    to.
  - Both are stored under versioned `AsyncStorage` keys (e.g. `documents.cache.v1`), alongside a
    `cachedAt` timestamp, via two small gateway modules — `localDocumentsStorage.ts` and
    `remoteDocumentsCache.ts` (get/set, JSON-safe, swallows/logs storage errors — a full disk or
    corrupted value should degrade to "no cache," never crash the app).
- **Load sequence** (`DocumentsProvider`): on mount, hydrate the reducer from `AsyncStorage`
  immediately if a cache exists (so the UI never shows a blank loading state on a warm start),
  then attempt a live `getDocuments()` fetch in the background:
  - success → replace the remote portion of the list, re-persist, clear any "offline" banner.
  - failure → keep showing the cached remote documents (merged with local ones), surface an
    **offline banner** ("Showing cached data from `formatRelativeDate(cachedAt)`") instead of a
    blocking error screen. An error screen only appears if there is _no_ cache and the fetch
    fails (nothing to fall back to).
- **Connectivity detection**: `@react-native-community/netinfo` is used to proactively show/hide
  the offline banner based on actual connectivity, rather than only inferring "offline" from a
  failed fetch after the fact (which is slower to surface and gives a worse message). This is
  the one new dependency this feature adds — reachability detection is genuinely
  platform-specific and easy to get subtly wrong by hand, so it's a case where relying on a
  focused, well-maintained library is the right tradeoff (see §3.1's principle on this).
- **Notifications are explicitly out of scope for offline caching**: the WebSocket feed is
  live/ephemeral by nature — there is no history endpoint on the server, so there is nothing to
  "catch up on" after being offline. `NotificationsClient`'s existing reconnect-with-backoff
  (§3.5) is what handles connectivity coming back; no separate offline handling is needed there.

### 3.9 Internationalization (i18n)

The app only ships English copy, but user-facing strings are still routed through a small
translation layer instead of being hardcoded inline — the goal is to show the practice was
considered, not to actually localize anything right now.

- **Decision: a hand-rolled `t(key, params?)` lookup, not `i18next`.** All strings live in
  `src/shared/i18n/strings/en.ts` as a flat, typed object (dot-namespaced keys like
  `'documents.title'`, `'documents.addDocument'`, `'notifications.created'`), and
  `src/shared/i18n/t.ts` exports `t()`, which looks a key up and does simple `{{param}}`
  interpolation for the handful of dynamic strings (e.g. the notification message: `"{{user}}
created {{document}}"`). `TranslationKey = keyof typeof en` gives autocomplete and a compile
  error on typos or missing keys — most of the value of a "real" i18n setup, with none of the
  runtime machinery.
- **Why not a library today**: this app has no pluralization, no RTL, and exactly one locale.
  `i18next`/`react-i18next` would add a context provider, async namespace loading, and a
  pluralization/interpolation engine that would sit entirely unused — the kind of dependency
  this plan's §3.1 principle (own code where the payoff of a library is small) argues against.
- **Where this stops paying for itself, and what to reach for instead**: if the app actually
  needed to ship a second language, plurals, date/number formatting per locale, or RTL layout,
  that's the point where hand-rolling stops being the right tradeoff and `i18next` +
  `react-i18next` (+ `expo-localization` for device locale detection) becomes the correct
  choice — those are exactly the hard, easy-to-get-subtly-wrong problems a mature i18n library
  exists to solve. The migration path is contained: call sites already go through `t()`, so
  swapping the implementation behind that function is a localized change, not a rewrite.
- Every user-facing string added from here on (labels, button text, empty/error states,
  notification copy) goes into `en.ts` and is read via `t()` — see the convention recorded in
  `AGENTS.md`.

### 3.10 Design patterns in use

The design patterns applied are the following, each addressing a concrete problem in this app rather than adopted for its own sake — in
keeping with §3.1's guiding principle that no abstraction earns its place on name recognition
alone. They're named explicitly here so a reviewer can see both where each one lives in the code
and the reasoning behind it in one place.

- **Observer** — `NotificationsClient` doesn't know React exists: it publishes through injected
  `onMessage`/`onStatusChange` callbacks, and `NotificationsProvider` subscribes and re-publishes
  through Context. This decoupling is what makes the WebSocket lifecycle testable in isolation
  (`jest-websocket-mock`, no React renderer involved), and would let a second consumer (say, an
  analytics logger) attach without touching the client.
- **Facade** — three deliberate ones:
  - `httpClient` hides `fetch` + `AbortController` timeout wiring + error normalization behind
    `get<T>(path)`; call sites never see a raw `Response` or an `AbortError`, only a typed value
    or an `HttpError`.
  - `localNotifications.ts` hides `expo-notifications`' platform quirks (the Android/Expo Go
    import crash, the Android channel requirement, permission failures) behind three safe,
    never-throwing functions.
  - Each feature's `use*()` hook is the facade over its store: `dispatch`, action shapes, and
    the reducer are private to the feature — components can't couple to them even by accident.
- **Adapter (anti-corruption layer)** — `mapDocument` (`getDocuments.ts`) and `mapMessage`
  (`NotificationsClient.ts`) translate the server's `PascalCase` wire format into the app's
  domain types right at the boundary; app-only concerns (`origin: 'local' | 'remote'`) are added
  in the same step. Nothing outside `api/`/`socket/` ever sees a `RawDocument` — if the server's
  schema changed, these two functions are the whole blast radius.
- **Flux (unidirectional data flow), with reducers as finite state machines** — state only
  changes through dispatched actions handled by pure reducers (§3.3). `DocumentsState` is a
  discriminated union keyed on `status`, so illegal states are unrepresentable at the type
  level — an `error` message can't exist outside the `'error'` state, enforced by the compiler
  rather than by discipline.
- **Provider (dependency injection via React Context)** — components receive state and
  operations through `use*()` hooks backed by providers, never from module-level singletons.
  That seam is what lets component tests mock `useDocuments` wholesale, and what would let the
  state layer be swapped per §3.3's migration note without touching a single consumer.
- **Null Object** — `NotificationsClient` defaults omitted callbacks to no-ops (`?? (() => {})`)
  instead of storing nullables and null-checking at every call site.
- **Gateway** — `localDocumentsStorage` / `remoteDocumentsCache` each isolate AsyncStorage keys,
  serialization, and the degrade-to-empty error policy in one place. Deliberately _not_ a
  generic Repository: the challenge disallows DB/ORM-style layers, and these are intentionally
  dumb, feature-named key-value gateways.
- **Stale-while-revalidate** — the offline behavior in §3.8: hydrate from cache, render
  immediately, revalidate in the background, replace on success.
- **Strategy (kept honest)** — `sortDocuments(documents, sortKey)` parameterizes the ordering,
  which is the Strategy idea — but with exactly two options it's a plain conditional, not
  polymorphic strategy objects. That function is the seam where a comparator map
  (`Record<SortKey, Comparator>`) would go if sort options grew; adding that indirection today
  would be the premature abstraction §3.1 rules out.
- **Functional core, imperative shell** — the decision-making is pure and unit-tested without
  mocks (`documentsReducer`, `notificationsReducer`, `sortDocuments`, `formatRelativeDate`,
  `computeReconnectDelay`); side effects (fetching, sockets, storage, timers) live at the edges,
  in providers and clients. `computeReconnectDelay` was extracted for exactly this reason — the
  backoff _math_ is testable without the fake-timer problems of the I/O that surrounds it (see
  AGENTS.md).

Equally deliberate is what's absent: no Repository interfaces with a single implementation, no
Factory/Builder for objects with one construction site, no Decorator/middleware chain for a
pipeline two functions long. At this app's size those would be pattern-for-pattern's-sake — the
same premature-abstraction trap §3.1 rules out. Each pattern above is here because the problem
it solves actually occurred.

## 4. Third-party libraries (final justification will be repeated in README)

| Library                                     | Purpose                                                          | Alternative considered & why rejected                                                                                                                                       |
| ------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Expo SDK                                    | runtime & tooling                                                | RN CLI — no native module actually needed, adds setup friction (see §2 for why my usual choice differs on other projects)                                                   |
| `react-native-safe-area-context`            | safe-area-aware layout for the screen header                     | RN's built-in `SafeAreaView` — deprecated on Android; this is the maintained, cross-platform replacement Expo itself recommends                                             |
| `@react-native-async-storage/async-storage` | key-value cache for offline support + local document persistence | This is explicitly allowed (not a DB/ORM) as a storage primitive; `expo-file-system` would be lower-level than needed                                                       |
| `@react-native-community/netinfo`           | connectivity detection for the offline banner (see §3.8)         | Hand-rolled reachability checks — platform-specific and easy to get subtly wrong; this is a small, focused, well-maintained library for exactly this problem                |
| `expo-crypto`                               | `randomUUID()` for locally-created document IDs (see §3.4)       | Hand-rolled ID generator — Hermes has no `crypto.randomUUID`, and getting RFC 4122 format/randomness right by hand isn't worth owning                                       |
| RN `Share` API                              | native share sheet (optional feature)                            | `expo-sharing` — solves file/URI sharing specifically; the built-in `Share` API already covers this app's plain text/URL sharing need with zero extra dependency            |
| `expo-notifications`                        | local notifications (optional feature)                           | `notifee` — more powerful but requires a dev build regardless; no benefit for local-only notifications here                                                                 |
| `jest` + `@testing-library/react-native`    | unit/component testing                                           | De facto standard in the RN ecosystem                                                                                                                                       |
| `jest-websocket-mock` (dev)                 | testing `NotificationsClient` without a real server              | Hand-mocking `WebSocket` — more brittle, reinvents an existing well-tested tool                                                                                             |
| Maestro                                     | E2E testing                                                      | Detox — more powerful but far heavier to configure (native build hooks); Maestro drives the app like a user via a simple YAML flow, better cost/benefit for this app's size |

Not used, deliberately: Redux/Zustand (see §3.3), React Query/SWR (see §3.4), `dayjs`/`date-fns`
and `@gorhom/bottom-sheet` (see §3.7 — hand-rolled slide-up sheet covers the mockup's needs),
`@react-navigation` (see §3.1 — no multi-screen stack exists), `expo-document-picker` (see §3.7
— the File field is a placeholder since the server has no upload endpoint; this is the right
library to reach for if that field becomes real), `i18next`/`react-i18next` (see
§3.9 — a single locale doesn't justify it yet, though it's the correct next step if that
changes), any ORM/DB (disallowed by the challenge).

## 5. Testing strategy

- **Unit**: reducers (`documentsReducer`, `notificationsReducer`), `formatRelativeDate`,
  `resolveApiBaseUrl`, `NotificationsClient` reconnect/backoff behavior (fake timers).
- **Hooks**: `useDocuments`, `useNotifications` with `fetch`/`WebSocket` mocked, covering
  loading → success, loading → error, refetch, and message-arrival paths.
- **Components** (React Native Testing Library): `DocumentListItem`/`DocumentGridItem`
  rendering, `ViewToggle` switching, `SortBySelect` changing order, `AddDocumentSheet` submit
  flow, `NotificationBanner` appearing/dismissing. Queries prefer `getByTestId`/`within(...)`
  over `getByText` for structural assertions (element present, correct section, event fired);
  `getByText`/`getByLabelText` are still the right tool when the thing actually under test is
  the rendered copy or the accessibility tree itself (see §3.1).
- **E2E (committed deliverable)**: `e2e/flows/golden-path.yaml` (Maestro) — launch app, see the
  documents list, switch to grid view and back, change sort order, create a document via the
  modal, see it appear at the top of the list, and observe an in-app notification. Committed
  from the start (not a stretch goal), since it's high-signal for reviewers and exercises the
  real app end-to-end against the live reference server, not mocked units. Runs inside Expo Go
  via a deep link (`openLink: exp://localhost:8081`), not a standalone build — see
  `e2e/README.md` for the full reasoning and how to run it. Two things worth calling out about
  the flow itself:
  - **Sort order is switched back to Date before creating the document.** The flow tries Title
    order too (to exercise `SortBySelect`), but asserting the new document "appears at the top"
    only holds under Date order — under Title order it sorts alphabetically instead, which for
    "Maestro E2E Test Document" would land it off-screen, not at the top.
  - **Every tap that toggles state which the flow depends on is wrapped in a `retry:` block**
    (tap + its assertion together, `maxRetries: 3`), not the seemingly-obvious
    `retryTapIfNoChange`. A tap can occasionally register as a no-op if its target
    unmounts/re-renders as part of the same native touch gesture that triggered it (observed
    with `SortBySelect`'s trigger + its full-screen dismiss backdrop, both mounted/interacted
    with in one state update). `retryTapIfNoChange` looks like the fix but isn't reliable here:
    it retries based on _any_ hierarchy change, and this app's live WebSocket feed changes the
    notification banner/badge every few seconds regardless of what's being tapped, which reads
    as "the tap worked" even when it didn't. `retry:` around the tap + assertion retries based
    on whether the intended outcome actually happened instead — see AGENTS.md for the full
    investigation (including the failed first attempt).
  - **Runs are state-isolated**: the flow launches with `clearState: true`, wiping the app's
    AsyncStorage so repeated runs start from identical conditions instead of accumulating the
    local document each run creates. Cleanup-at-launch (not at flow end) means an aborted run
    can't leak state into the next one. See `e2e/README.md` for the Expo Go quirks this
    surfaced (its one-time intro overlay reappears every run and needs a two-tap dismissal).
  - **Deliberately not a CI gate**: the E2E flow is a local pre-release check, not part of the
    GitHub Actions pipeline. Main reason: CI would need to clone and run the reference server,
    whose repository URL contains the company name this challenge asks not to mention anywhere
    in the project. Beyond that, simulator infrastructure in CI (macOS runners or scripted
    Android emulators + Expo Go installation) is far more pipeline than this project's size
    justifies, and the flow's dependence on live randomized data/WebSocket timing — its whole
    value as an E2E check — is exactly what makes it noisy as a merge gate. Full reasoning in
    `e2e/README.md`.

## 6. Implementation backlog (small, independently committable steps)

1. Scaffold Expo TS project, folder structure, ESLint/Prettier, strict `tsconfig`,
   `.env.example` + `.gitignore` for `.env`
2. App shell: `App.tsx` + providers composition + empty `DocumentsScreen`
3. Shared theme/UI kit (colors, spacing, `Text`/`Button`/`Spinner`/`EmptyState`/`ErrorView`) +
   Jest/RNTL setup
4. CI pipeline (GitHub Actions): `tsc`, `eslint`, `prettier --check`, `jest` on every push/PR —
   set up early so every subsequent step is checked automatically, not just at the end
5. Network config (`resolveApiBaseUrl` via env vars) + `httpClient` wrapper + tests
6. `documents/api` (`getDocuments`) + tests
7. `useDocuments` (reducer: loading/success/error/refetch) + tests
8. List UI (`FlatList` + `DocumentListItem`) + tests
9. Grid UI + `ViewToggle`
10. `SortBySelect` (title / date, defaulting to date — see §3.7) + tests
11. Pull-to-refresh
12. `formatRelativeDate` + tests, wired into item components
13. Local document creation flow (`AddDocumentSheet` incl. placeholder File field, `expo-crypto`
    for local IDs, reducer action, persistence) + tests
14. `NotificationsClient` (WebSocket + reconnect/backoff) + tests
15. Notifications store/hook + `NotificationBell` + `NotificationBanner` UI + tests
16. Share button integration
17. Offline support: `localDocumentsStorage`/`remoteDocumentsCache` (cache + local doc persistence), hydrate-then-revalidate
    in `useDocuments`, `NetInfo`-driven offline banner (see §3.8) + tests
18. Local notifications (background) integration
19. Polish: empty/error states, accessibility labels, loading states
20. Maestro E2E golden-path flow
21. Final `README.md`: setup, run, test instructions, architecture rationale, library
    justification, CI status badge

Each step above is meant to be a small, self-contained commit (or short series of commits),
reviewable independently, per the challenge's request to "commit from the very beginning and
commit often."

## 7. Open items / assumptions

- Reviewer will run the reference Go server locally (`go run server.go`) alongside the app;
  this will be spelled out in the final README's setup instructions.
- The app targets both iOS and Android. No platform-specific APIs are used without a
  `Platform`-appropriate counterpart (shadows via `elevation`, the Android notification channel,
  `10.0.2.2` as the emulator host).
- No authentication exists on the reference server, so none is implemented client-side.
- **Known limitation: `LayoutAnimation` transitions (sort/view-mode toggle, the add-document
  flow, the notification/offline banners appearing and dismissing) don't animate on Android —
  they still work, the state change just applies instantly instead of transitioning.** This is
  not a missing configuration on our side: it's a long-standing upstream React Native bug where
  `LayoutAnimation` is effectively broken on Android specifically under the **New Architecture
  (Fabric)**, which this app runs on by default (RN 0.86 / Expo SDK 57 have no legacy-bridge
  option to fall back to). iOS's Fabric implementation animates correctly; Android's does not
  yet — see [facebook/react-native#38661](https://github.com/facebook/react-native/issues/38661),
  [facebook/react-native#47617](https://github.com/facebook/react-native/issues/47617), and
  [expo/expo#30153](https://github.com/expo/expo/issues/30153) (same symptom: works on iOS, not
  on Android, with the New Architecture on). The Android-only
  `UIManager.setLayoutAnimationEnabledExperimental(true)` opt-in this app calls (per RN's own
  docs) is a no-op under Fabric and doesn't work around it — there's no known workaround using
  RN's built-in `LayoutAnimation` at all. `LayoutAnimation` was still chosen deliberately for
  this challenge: zero extra dependencies, and it does animate correctly on iOS, which was the
  primary manual-verification target during development. **The complete, cross-platform fix
  would be migrating those four call sites to `react-native-reanimated`'s Layout Animations API**
  (`LinearTransition`/`Layout`), which implements its own Fabric-compatible animation driver on
  both platforms instead of relying on RN's broken built-in one. That's a real dependency plus a
  rewrite of each call site, not a one-line fix, for a gap that's purely cosmetic (nothing is
  broken functionally) — deferred rather than done for this submission.
