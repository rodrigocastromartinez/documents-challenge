# AGENTS.md

Working notes for AI-assisted development on this project. This file is not project
documentation for reviewers — it's a running log of decisions, constraints, and conventions
that an AI agent (or a human) should know before making changes, so guidance doesn't have to be
repeated across sessions.

See [TECH-PLAN.md](TECH-PLAN.md) for the architecture and feature plan itself.

## Conventions established so far

- TypeScript strict mode everywhere; no `any` without a comment justifying it.
- Feature-based folder structure under `src/features/*`; shared code only in `src/shared/*`.
  Don't add cross-feature imports between `documents` and `notifications` outside of `*Screen`
  files — see the next bullet for why screens are the one designated exception.
- **`*Screen` files are thin composition only; no top-level `screens/` folder.** Screens live
  inside their feature (they're the feature's visible face), and any conditional rendering
  logic (loading/error/empty/data) gets its own component file — a locally-defined helper
  component inside a screen file is the signal to extract it. See TECH-PLAN.md §3.2.
  **`*Screen` files are also the one place allowed to import another feature's public
  components/hooks** (e.g. `DocumentsScreen` importing `NotificationBell`/`useNotifications`) —
  they _are_ "the screen level" the cross-feature-import rule above refers to. Only screens get
  this exception; a non-screen file in `documents/` still may not reach into `notifications/`,
  or vice versa.
- **Don't add comments by default.** Only add one when it captures a non-obvious _why_ (a
  constraint, a workaround, a decision that would surprise a reader) — never to restate what the
  code already says. If a comment would just narrate what the next line does, delete it instead
  of writing it. This codebase had a real problem with comment bloat from over-explaining
  otherwise self-evident code; keep code self-documenting through naming instead.
- **Barrel `index.ts` files exist for `shared/components`, `shared/theme`, each feature's
  `components/` and `store/`, and each feature's top level** (`features/documents`,
  `features/notifications`) — import from those instead of deep individual-file paths when
  consuming from _outside_ the folder. `shared/i18n` and `shared/utils` deliberately don't get
  one: every call site only ever imports a single named export (`t`, `formatRelativeDate`) from
  them, so a barrel would add a file without shortening anything.
  **A file _inside_ a barreled folder must keep importing its siblings via their direct deep
  path, never through that folder's own barrel** — e.g. `DocumentsContent.tsx` imports
  `DocumentGridItem` directly even though both are re-exported by
  `documents/components/index.ts`. Importing the barrel from within the same folder it
  re-exports is a circular import (`index.ts` → sibling → `index.ts` → ...); Metro/Jest usually
  papers over it, but it's fragile and not worth the risk. `DocumentsScreen.tsx` is deliberately
  _excluded_ from `documents/components/index.ts` for this exact reason — it needs to consume
  its sibling components through the barrel (it's the one place that legitimately benefits from
  it), which is only safe because nothing in that barrel imports `DocumentsScreen` back.
  Hooks (`useDocuments`, `useNotifications`) are deliberately **not** re-exported through any
  barrel and stay as direct deep imports at every call site — they're `jest.mock()`'d by exact
  module path in tests (e.g. `jest.mock('@/features/documents/hooks/useDocuments')`), and
  routing a mocked hook through a barrel risks either silently not being intercepted or
  auto-mocking unrelated sibling exports from the same barrel.
- State: Context + `useReducer` per feature, no Redux/Zustand/React Query. Don't introduce a
  state management library without updating §3.3 of TECH-PLAN.md first.
- No `@react-navigation`: this is a single-screen app plus one bottom sheet. Don't add a
  navigation library "just in case" — if a real second screen becomes necessary, update
  TECH-PLAN.md §3.1 first.
- Environment variables only via `EXPO_PUBLIC_*` + `.env` (git-ignored) / `.env.example`
  (committed). Never hardcode hosts/ports/keys in source. See TECH-PLAN.md §3.6 before touching
  networking config.
- The reference server has no document-creation endpoint — locally created documents are
  client-only, persisted to AsyncStorage. Don't "fix" this by inventing a fake POST call.
- **`CreatedAt`/`UpdatedAt` from the reference server are fully random**, not real timestamps
  (verified by actually running the server locally — values ranged from 1904 to decades in the
  future). Don't build anything that assumes these are meaningful recency signals beyond "some
  date to display." `formatRelativeDate` is bounded because of this — see TECH-PLAN.md §3.7.
- **No hardcoded user-facing strings.** Every label/button/empty-state/notification copy goes
  into `src/shared/i18n/strings/en.ts` and is read via `t('some.key')` from
  `src/shared/i18n/t.ts` — never inline string literals in JSX. See TECH-PLAN.md §3.9 for why
  this is a hand-rolled lookup rather than `i18next` for now.
- **Every component gets a `testID` and an appropriate `accessibilityLabel`/`accessibilityRole`
  where it renders meaningful content.** Not optional, not a pre-submission pass — add both when
  you write the component, not after. Shared components (`Button`, `Spinner`, `EmptyState`,
  `ErrorView`) accept `testID` as a prop; feature components derive stable, meaningful `testID`s
  from domain data (e.g. `` `document-item-${document.id}` ``), never from array index. Tests
  should query by `testID` (via `getByTestId`/`within(...)`) for structural assertions instead of
  matching rendered text, so a copy change doesn't break a test that wasn't really about the
  exact wording. See TECH-PLAN.md §3.1 and §5.
- **Expo version pinning**: this project was scaffolded with Expo SDK ~57. Expo's APIs change
  meaningfully between SDK versions — before writing any Expo-API code (not plain React Native),
  check the versioned docs at `https://docs.expo.dev/versions/v57.0.0/` (or whatever the current
  `expo` version in `package.json` is) rather than relying on training data, which may reflect a
  different SDK version. The official Expo Claude Code plugin is enabled in
  `.claude/settings.json` for this reason.
- **`assets/*.png` are committed placeholders (Expo's default icon/splash), not final art.**
  They're tracked deliberately — `app.json` references them, so a fresh clone must have them to
  build at all — but they're expected to be swapped for real icons before final delivery. Don't
  re-add a `.gitignore` rule for them; just replace the files in place when real assets exist.

## Branching strategy

- `master` is the stable/release branch — only receives merges at logical milestones (e.g.
  after all required features are done, after optional features are done, final delivery). It
  should never have direct commits.
- `develop` is the integration branch for ongoing work.
- Each backlog step (see TECH-PLAN.md §6) gets its own short-lived `feature/<short-name>` branch
  off `develop` (e.g. `feature/documents-api`, `feature/app-shell`). Commit there in small steps,
  then merge back into `develop`.
- Merges into `develop` use a regular merge commit, **not squash** — individual commits must stay
  visible in `git log`, since that granularity is part of what's being evaluated.
- Don't merge `develop` → `master` after every single feature branch; batch them at milestones as
  described above, so `master`'s history reads as meaningful checkpoints rather than noise.

## How to use this file going forward

Append entries here when something comes up during AI-assisted implementation that future
sessions should know without re-deriving it: a gotcha hit while coding, a prompt/approach that
worked well, a constraint discovered in the reference server, a place where generated code
needed correction and why. Keep entries short and dated.

## Gotchas log

- **2026-07-10 — `@testing-library/react-native` v14's `render()` and `fireEvent.*` are async.**
  They return a `Promise` (the library now renders through a Fabric-compatible `test-renderer`
  package instead of the old sync `react-test-renderer`). Forgetting `await` doesn't throw where
  you'd expect — `screen.getByText(...)` etc. fail afterwards with a generic `` `render` function
has not been called `` error, which is misleading if you don't already know this. Always
  `await render(...)` and `await fireEvent.press(...)` (or whichever event) in tests.
- **2026-07-10 — `tsc` didn't see `describe`/`it`/`expect` in test files despite `@types/jest`
  being installed.** Had to add `"types": ["jest"]` explicitly to `tsconfig.json`'s
  `compilerOptions` — the automatic "include every package under `node_modules/@types`" behavior
  wasn't kicking in as expected on this Expo/TS setup. If a future `@types/*` package added for
  something else stops being picked up, check this array first.
- **2026-07-11 — mutating `process.env.EXPO_PUBLIC_*` in tests must be in-place, never
  `process.env = { ...originalEnv, ... }`.** `babel-preset-expo` rewrites every
  `process.env.EXPO_PUBLIC_*` read into a reference to `env` from the virtual module
  `expo/virtual/env`, which does `export const env = process.env` — a reference captured **once**
  at module-load time. Reassigning the whole `process.env` object (a common Jest pattern for
  isolating env vars per test) points the global at a new object that `env` never sees, so code
  under test keeps reading the old values no matter what the test sets — with no error, just
  silently stale values. Always set/delete individual keys on the existing `process.env` object
  (see `setOrDelete` helper in `src/shared/network/__tests__/`) instead of replacing it wholesale.
- **2026-07-11 — `RefreshControl`'s props (`refreshing`, `onRefresh`, `testID`) aren't
  inspectable through RNTL in this jest-expo setup.** The test renderer's built-in mock renders
  it as an empty host node that drops every prop, so `getByTestId(...).props.refreshing` etc.
  never finds anything. Tried overriding the export (`jest.mock('react-native', () => ({
...jest.requireActual('react-native'), RefreshControl: 'RefreshControl' }))`) to swap in a
  plain host tag — `requireActual('react-native')` itself blows up
  (`TurboModuleRegistry.getEnforcing(...): 'DevMenu' could not be found`) because it bypasses
  jest-expo's own react-native mocking setup, not just the bit we wanted to override. Don't
  fight this: verify pull-to-refresh manually/in the simulator or via the Maestro E2E flow
  instead of asserting on `RefreshControl`'s rendered props in a unit test.
- **2026-07-12 — `StyleSheet.absoluteFillObject` doesn't exist on this RN version's types**
  (`StyleSheet.absoluteFill` does, but that's a style _ID_ meant to go directly in a `style`
  prop/array, not a plain object you can spread into `StyleSheet.create({...})`). Hit this twice
  (`ViewToggle`, `AddDocumentSheet`) before writing it down. Just spell out
  `{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }` instead of reaching for either.
- **2026-07-12 — `@react-native-async-storage/async-storage`'s official jest mock
  (`.../jest/async-storage-mock`) doesn't self-register.** It only exports a mock object; adding
  its path directly to jest's `setupFiles` (as if it were a script to run) does nothing — the
  real native module still loads and throws `NativeModule: AsyncStorage is null`. It has to be
  wired up explicitly via `jest.mock('@react-native-async-storage/async-storage', () =>
require('@react-native-async-storage/async-storage/jest/async-storage-mock'))` inside a file
  that setupFiles actually runs (see `jest.setup.js`) — `jest.mock` calls are hoisted/global
  regardless of which file they're in, but merely requiring the module is not enough.
- **2026-07-12 — `jest.resetAllMocks()` silently destroys AsyncStorage's mock implementation
  for the rest of the test run, not just the current file.** The official mock wraps its
  methods in `jest.fn(realImplementation)`; `resetAllMocks`/`.mockReset()` strips the
  implementation (unlike `jest.spyOn`, there's no original to fall back to), leaving `getItem`/
  `setItem` returning `undefined` forever after. Any test file that renders something touching
  AsyncStorage (e.g. `DocumentsProvider` via `useDocuments` tests) must use
  `jest.clearAllMocks()` in its `afterEach`, not `resetAllMocks()` — `clearAllMocks` only clears
  call history and leaves implementations intact.
- **2026-07-12 — `jest-websocket-mock` (via `mock-socket`) and `jest.useFakeTimers()` don't mix.**
  `mock-socket` simulates the WebSocket handshake/close sequence internally via real `setTimeout`
  calls; faking timers before those internal timers fire makes `await server.connected` (or
  `.closed`) hang forever, even with `jest.advanceTimersByTimeAsync(...)`. This is a documented
  limitation in the library's own README ("Known issues"), not something fixable by sequencing
  calls differently. Don't try to test exact reconnect-backoff _timing_ through a mocked
  WebSocket — extract the delay math into a plain, timer-free function (see
  `computeReconnectDelay` in `NotificationsClient.ts`) and unit-test that directly; keep the
  WebSocket-integration tests on real timers with small millisecond delays instead.
- **2026-07-12 — importing `expo-notifications` (even just for local notifications) logs a
  console warning on every import, project-wide, in tests.** It registers a push-token listener
  at module load time regardless of whether push is ever used, and that listener immediately
  warns that Android push is unavailable in Expo Go (removed since SDK 53) — noisy in any test
  file that transitively imports `NotificationsProvider` (which is most of them, since
  `DocumentsScreen` composes it), not just ones that test notifications directly. There's no
  official jest mock for this package. Fixed with a minimal project-wide stub of the three
  functions this app actually calls (`setNotificationHandler`/`requestPermissionsAsync`/
  `scheduleNotificationAsync`) in `jest.setup.js`, same pattern as AsyncStorage/NetInfo.
- **2026-07-12 — mutating a ref's `.current` directly in a component's render body (not inside
  an effect/handler) is now an eslint error** (`react-hooks/refs`, part of the React Compiler-era
  rules bundled with this project's `eslint-config-expo`), not just a lint nitpick — do the
  assignment inside a `useEffect(() => { ref.current = value }, [value])` instead. First hit
  wiring an `appStateRef` in `NotificationsProvider`; that ref was later removed entirely in
  favor of reading `AppState.currentState` directly at callback-fire time (RN keeps it in sync
  natively) — often the state-plus-ref bridge isn't needed at all, which is the better fix.
- **2026-07-13 — `expo-notifications` doesn't just _warn_ on Android inside Expo Go, it _throws_
  and crashes the app on launch — the entry above (logged from the iOS/Jest side) undersold
  this.** Confirmed on a real Android Studio emulator (a different machine, cloned fresh):
  `[runtime not ready]: Error: expo-notifications: Android Push notifications... was removed
from Expo Go`. The throw comes from `warnOfExpoGoPushUsage()` inside the package's own
  `DevicePushTokenAutoRegistration.fx.ts`, a side-effect-only module that calls
  `addPushTokenListener` unconditionally as soon as `expo-notifications` is imported —
  before any of our code runs, and regardless of only ever using LOCAL (non-push)
  notifications. `Platform.OS === 'android'` → hard `throw`; every other platform → `console.warn`
  only. This is asymmetric behavior baked into the library itself, not something a try/catch
  around our own calls can fix, since the crash happens at `import` time. Fixed in
  `localNotifications.ts` by resolving `Platform.OS === 'android' && isRunningInExpoGo()`
  (the same check the library uses internally, exported from the `expo` package) and only
  `require()`-ing `expo-notifications` when that combination isn't true — a static
  `import` would always execute regardless of any runtime guard, since ES imports are hoisted.
  Local notifications are silently unavailable in that one combination (Android + Expo Go);
  a real Android build (dev or production) is unaffected, and iOS/Expo Go keeps working exactly
  as before.
- **2026-07-14 — a Maestro `tapOn` that toggles UI state (opening a dropdown, switching
  list/grid) can occasionally register as "no visible change" and the flow fails as if the tap
  never landed — even though the exact same flow passes on the next run.** Root cause: tapping
  `SortBySelect`'s trigger opens the dropdown and its full-screen dismiss backdrop in the same
  state update, and if the native touch's up-event gets captured by that freshly-mounted
  backdrop instead of the trigger, the dropdown opens and immediately closes within the same
  gesture — net zero change from the tap's own doing.
  **First fix tried, and why it didn't hold up**: `retryTapIfNoChange: true` on every affected
  `tapOn`, which re-taps if Maestro's before/after hierarchy diff comes back empty. This helped
  but didn't eliminate the flake (still failed roughly 1 run in 4) — because this app's live
  WebSocket feed re-renders the notification banner/badge every few seconds regardless of what's
  being tapped, so the hierarchy is nearly always changing _somehow_. `retryTapIfNoChange` reads
  that unrelated churn as "the tap had an effect" and never actually retries the failed one.
  **The fix that held (5/5 clean runs after switching)**: wrap each flaky tap + its assertion in
  a `retry:` block (`maxRetries: 3`) instead — this retries based on whether the _specific_
  intended outcome (the assertion) actually happened, completely independent of what else in the
  hierarchy did or didn't change. See `e2e/flows/golden-path.yaml`. General lesson for this app:
  any Maestro flow here should assume the hierarchy is never quiescent, and prefer outcome-based
  retry (`retry:`) over change-based retry (`retryTapIfNoChange`) for interactions that must
  actually succeed.
  **Corollary found later the same way**: the dropdown's _option_ tap has the same race (the
  menu closes identically whether the option landed or the dismiss backdrop ate the tap), so
  "the menu closed" proves nothing. The only reliable outcome signal is `SortBySelect`'s
  trigger accessibility label, which embeds the current value ("Sort by: Date" / "Sort by:
  Title") — the flow asserts on that after picking an option. When adding outcome-based retries,
  make sure the assert targets something that can only be true if the interaction actually
  applied, not something that also happens on the failure path.
- **2026-07-14 — Maestro + Expo Go: `launchApp: { clearState: true }` re-triggers Expo Go's
  one-time developer-menu intro overlay on every run, and dismissing it takes TWO taps, not
  one.** clearState wipes Expo Go's own storage along with the app's (which is the point — it's
  what isolates E2E runs from each other and from manually-created dev data), including the
  "already saw the intro" flag. The intro sheet's "Continue" button does NOT close it — it
  advances into the full developer menu, whose "Close" (X) button is the actual dismissal. Two
  more traps found while wiring this up: (a) while any sheet is presented, iOS hides the app
  hierarchy behind it from the accessibility tree, so asserting on the app's own testIDs doubles
  as a "sheet is really gone" check — but use `extendedWaitUntil`, not a bare `assertVisible`,
  because the dismiss animation takes longer than a bare assert's patience and burns the retries;
  (b) the first post-clearState render pays for an Expo Go bundle re-download plus a cold fetch,
  so the first list assertion needs a generous timeout (15s) that a warm start wouldn't.
