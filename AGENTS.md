# AGENTS.md

Working notes for AI-assisted development on this project. This file is not project
documentation for reviewers — it's a running log of decisions, constraints, and conventions
that an AI agent (or a human) should know before making changes, so guidance doesn't have to be
repeated across sessions.

See [TECH-PLAN.md](TECH-PLAN.md) for the architecture and feature plan itself.

## Conventions established so far

- TypeScript strict mode everywhere; no `any` without a comment justifying it.
- Feature-based folder structure under `src/features/*`; shared code only in `src/shared/*`.
  Don't add cross-feature imports between `documents` and `notifications` — compose them at the
  screen level instead.
- **`*Screen` files are thin composition only; no top-level `screens/` folder.** Screens live
  inside their feature (they're the feature's visible face), and any conditional rendering
  logic (loading/error/empty/data) gets its own component file — a locally-defined helper
  component inside a screen file is the signal to extract it. See TECH-PLAN.md §3.2.
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
