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
- **No hardcoded user-facing strings.** Every label/button/empty-state/notification copy goes
  into `src/shared/i18n/strings/en.ts` and is read via `t('some.key')` from
  `src/shared/i18n/t.ts` — never inline string literals in JSX. See TECH-PLAN.md §3.9 for why
  this is a hand-rolled lookup rather than `i18next` for now.
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
