# E2E tests (Maestro)

`flows/golden-path.yaml` drives the app like a real user, end-to-end against the live reference
server — no mocks. It covers the golden path described in TECH-PLAN.md §5: launch the app, see
the documents list, switch to grid view and back, change sort order, create a document via the
"Add document" sheet, see it appear at the top of the list, and observe an in-app notification
from the WebSocket feed.

## Prerequisites

1. The reference Go server running locally (`go run server.go`), listening on `localhost:8080` —
   see the root README for setup.
2. This app's dev server running (`npm start` / `npx expo start`).
3. An iOS Simulator or Android Emulator open, with **Expo Go installed** (the flow runs inside
   Expo Go via a deep link into the dev server, not a standalone build — see below for why).
4. [Maestro CLI](https://docs.maestro.dev/getting-started/installing-maestro) installed
   (`maestro --version` to check).

## Running

```bash
maestro test e2e/flows/golden-path.yaml
```

Maestro auto-detects the running Simulator/Emulator. Add `--device <id>` to target a specific one
if you have several open (`maestro --help` / your platform's device-list command for IDs).

## State isolation between runs

The flow starts with `launchApp: { clearState: true }`, wiping Expo Go's sandboxed storage —
including this app's AsyncStorage — so every run begins from identical conditions instead of
accumulating the local document each previous run creates. Cleanup happens at launch rather than
at the end of the flow deliberately: an aborted run can't skip it, so leftover state from a
crashed run never leaks into the next one. Side effect worth knowing: this also wipes any local
documents you created manually in Expo Go while developing (in Expo Go the app and the flow
share one sandbox — there's no separate "test database" without either restarting the dev server
with a different env or adding a test-only mode to the app, neither of which is worth the
complexity here).

## Why this isn't in CI

The unit/lint/type pipeline runs on every push (see `.github/workflows/ci.yml`); this flow is a
local, pre-release check instead of a CI gate, for three reasons:

1. **The reference server can't be referenced from a committed workflow.** CI would need to
   clone and run it, and its repository URL contains the company name this challenge explicitly
   asks not to mention anywhere in the project. Hiding it in a repo secret would work but makes
   the pipeline non-reproducible for anyone cloning the repo — the opposite of what CI is for.
2. **Simulator/emulator infrastructure is heavy.** iOS Simulators require macOS runners (10×
   the GitHub Actions cost multiplier, slow to boot); an Android emulator on Linux is feasible
   but means scripting emulator boot, Expo Go installation, and Metro startup inside CI — more
   pipeline than app, at this project's size.
3. **The flow exercises live randomized data and WebSocket timing by design.** That's its value
   as an end-to-end check, and also exactly what makes it noisy as a merge gate.

## Why Expo Go, not a standalone build

This project deliberately never requires a native build to run (see TECH-PLAN.md §2) — the
whole point is that a reviewer can go from `git clone` to a running app with just `npx expo
start` and Expo Go. Building this flow around a standalone binary would mean introducing EAS
Build/local native builds just for E2E, which contradicts that goal for no real benefit at this
app's size. The flow instead opens `exp://localhost:8081` inside Expo Go, the same deep link
this project's own manual verification has used throughout development.

**This `localhost:8081` is unrelated to the `EXPO_PUBLIC_API_HOST` variable in `.env.example`**
(which the app itself uses to reach the reference server on port 8080, and which does need
`10.0.2.2` on an Android Emulator instead of `localhost` — see that file). The two ports serve
completely different purposes and get to the emulator through different mechanisms:

- **Port 8081** here is Metro/Expo's own dev server, which is what serves the JS bundle to Expo
  Go — not the reference server. `expo start`/`npm run android` normally runs
  `adb reverse tcp:8081 tcp:8081` for you the moment an Android Emulator connects, forwarding the
  emulator's own `localhost:8081` to the host's, which is what makes `exp://localhost:8081` work
  there too, the same as on iOS Simulator (which shares the host's network namespace directly, no
  forwarding needed). This reverse-port setup is normally automatic but occasionally doesn't
  kick in — if `openLink` in the flow times out on Android, run
  `adb reverse tcp:8081 tcp:8081` yourself first.
- **Port 8080** is the reference server, reached directly by the app's own `fetch`/`WebSocket`
  calls — nothing sets up a reverse tunnel for that automatically, which is exactly why
  `EXPO_PUBLIC_API_HOST` has to be set to `10.0.2.2` by hand for an Android Emulator.

## A note on the notification step

The reference server's WebSocket feed emits a message at a random 0-5s interval (see
TECH-PLAN.md §1) — there is no way to force one on demand. The last step waits up to 20s for the
in-app banner, which comfortably covers that window without the flow blocking indefinitely if
something is actually broken.
