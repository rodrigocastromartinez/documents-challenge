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
- **Expo version pinning**: this project was scaffolded with Expo SDK ~57. Expo's APIs change
  meaningfully between SDK versions — before writing any Expo-API code (not plain React Native),
  check the versioned docs at `https://docs.expo.dev/versions/v57.0.0/` (or whatever the current
  `expo` version in `package.json` is) rather than relying on training data, which may reflect a
  different SDK version. The official Expo Claude Code plugin is enabled in
  `.claude/settings.json` for this reason.

## How to use this file going forward

Append entries here when something comes up during AI-assisted implementation that future
sessions should know without re-deriving it: a gotcha hit while coding, a prompt/approach that
worked well, a constraint discovered in the reference server, a place where generated code
needed correction and why. Keep entries short and dated.
