# Documents

![CI](https://github.com/rodrigocastromartinez/documents-challenge/actions/workflows/ci.yml/badge.svg?branch=master)

A React Native (Expo) app that lists documents in real time, notifies the user when someone else
creates one, and lets the user create their own — built as a technical challenge submission.

This README is the **"how to run it" guide**. For the **"why it's built this way"** — library
choices, architecture decisions, design patterns, the full implementation backlog, testing
strategy — see [TECH-PLAN.md](TECH-PLAN.md), referenced throughout instead of repeated here. For
how this project's AI-assisted development was set up and steered, see
[AGENTS.md](AGENTS.md) and the note on that below.

## Rodrigo's notes

This project has been mostly developed using Claude Code, driven by myself. This is the only section purely written by me.
My job was to drive the AI with the tasks I wanted to do, how and when, in order to still have the project under control.
I started by explaining what we have to build, putting special atention in the requirements of the project: scalable,
maintainable, following good practices and writting my own code instead of using a library when possible. The following are
some of the most important decissions that I took:

- Using Expo instead of RN CLI. I have experience with both, and even though I'm currently working in a big RN CLI project, I
  decided to use Expo this time. It offers all the main libraries needed for this project and it streamlines development, dev
  builds creation and testing. I could even share a working build with reviewers if the server was available online. I think
  that it's a very interesting and powerful framework, and it's getting more and more support over time.
- Feature structure. In order to allow the project to grow in the future, I considered using a feature architecture. This allows
  to isolate every feature, make it grow when necessary and create as many features as we want without mixing them. This is
  great for maintainability and scalability.
- Context + useReducer. In order to follow the instruction of reducing the use of libraries and considering the size of the app,
  a Context + useReducer state management is more than enough here. I particularly consider this is not a great solution for
  scalability, but applies for this case. If I know that the app will grow, I would consider using a state management library
  from the very beginning, such as Redux, MobX or Zustand. These kind of libraries have too much boilerplate for the setup,
  but once it's done they can make global state management way easier.
- Not using navigation library. This has no sense if there is only one screen. I would use it in both cases of needing a
  horizontal navigation or a deeper one. For the bottom up sheet I decided not to use gorhom neither, but RN Modal instead.
- No i18next for translations. As we have only English copies, I decided not to use i18next library. However it would most
  likely be used if having at least 2 languages.
- Accessibility labels and testIDs. Accessibility labels were not consider at the very beginning by AI, so I decided to include
  them. Also, it started using text assertions for testing, and I decided to change and use testIDs instead. I noticed this
  after a few commits, and decided to improve it.
- Using Maestro for E2E. As I have experience with Maestro and it is the recommended tool for e2e by Expo documentation, I
  decided to use it. It has the perk of being really easy to setup and write tests.
- CI only with unit tests. For the sake of simplicity, I decided not to include e2e tests in the pipeline, but just the unit
  tests instead (see e2e/README.md for the full reasoning), together with linter, prettier and type checking.
- Branching strategy. I decided to have a master branch and a development branch. Then, every feature or fix would be a
  separated branch were the commits will point, and would be merged to develop after finishing the task. Then, develop would
  be merged to master only on big milestones (in this case, finalizing the assesment).
- E2E DB isolation. I have evaluated the possibility of separating e2e created data from development data, by using env
  variables. Again, for the sake of simplicity, I have stored all together. However, this would be one of the first things to
  do in a real project, in order to avoid conflicts between Devs and QAs.

## Contents

- [Features implemented](#features-implemented)
- [Prerequisites](#prerequisites)
- [1. Run the reference server](#1-run-the-reference-server)
- [2. Clone and install this app](#2-clone-and-install-this-app)
- [3. Configure environment variables](#3-configure-environment-variables)
- [4. Start the app](#4-start-the-app)
- [5. Confirm it works](#5-confirm-it-works)
- [Running the unit test suite](#running-the-unit-test-suite)
- [Running the E2E test (Maestro)](#running-the-e2e-test-maestro)
- [Full verification (mirrors CI)](#full-verification-mirrors-ci)
- [Troubleshooting](#troubleshooting)
- [Project documentation](#project-documentation)
- [A note on AI-assisted development and Skills](#a-note-on-ai-assisted-development-and-skills)
- [Known limitations](#known-limitations)

## Features implemented

**Required:**

- [x] Documents list, as a list view or a grid view
- [x] Real-time notification when another user creates a document (WebSocket)
- [x] Create a new document

**Optional:**

- [x] Offline support (cached list + persisted local documents, offline banner)
- [x] Local (system) notifications when a message arrives while backgrounded
- [x] Pull to refresh
- [x] Native "share" button
- [x] Relative dates (e.g. "2 hours ago")

## Prerequisites

Install these once, before touching this repository:

1. **[Node.js](https://nodejs.org/) 20 LTS or newer** (includes `npm`). Check with `node -v`.
2. **[Git](https://git-scm.com/)**.
3. **[Go](https://go.dev/dl/) 1.21+** — needed to run the reference server this app talks to (see
   step 1).
4. **A way to actually see the app.** Pick whichever is easiest for you — no need for more than
   one:
   - **Easiest, no extra installs beyond an app store**: the **Expo Go** app on your own iPhone
     or Android phone (search "Expo Go" in the App Store / Play Store). This is the recommended
     path — it's how this app was verified throughout development, and needs no Xcode/Android
     Studio at all.
   - **iOS Simulator** (macOS only): install [Xcode](https://apps.apple.com/app/xcode/id497799835)
     from the App Store, open it once to finish its component install, done.
   - **Android Emulator**: install
     [Android Studio](https://developer.android.com/studio), then create a virtual device via
     its Device Manager.

## 1. Run the reference server

This app has no backend of its own — it reads and creates documents against the Go reference
server provided alongside this challenge's brief. (Its repository isn't linked from this project
on purpose — see [AGENTS.md](AGENTS.md) and [TECH-PLAN.md §1](TECH-PLAN.md#1-server-integration-facts-from-the-reference-server)
for why. If you're the one evaluating this challenge, you already have it from the original
brief.)

In its own terminal window, from that server's directory:

```bash
go run server.go
```

Leave this running. You should see it start listening (by default on `localhost:8080`, exposing
`GET /documents` and a `ws://.../notifications` WebSocket feed). Everything below assumes this
terminal stays open the whole time you're using the app.

## 2. Clone and install this app

In a **second** terminal window:

```bash
git clone https://github.com/rodrigocastromartinez/documents-challenge.git
cd documents-challenge
npm install
```

## 3. Configure environment variables

```bash
cp .env.example .env
```

Open the new `.env` file and set `EXPO_PUBLIC_API_HOST` to match **how you'll run the app** (see
step 4) — the comments in `.env.example` spell out all three cases:

| Running the app on...         | Set `EXPO_PUBLIC_API_HOST` to...                                                                                                  |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| iOS Simulator                 | `localhost` (the default — no change needed)                                                                                      |
| Android Emulator              | `10.0.2.2`                                                                                                                        |
| Physical device (Expo Go app) | your computer's LAN IP (e.g. `192.168.1.23`) — the phone must be on the **same Wi-Fi network** as the computer running the server |

`EXPO_PUBLIC_API_PORT` defaults to `8080`, matching the server. Leave it unless you started the
server on a different port.

## 4. Start the app

Back in the app's terminal:

```bash
npm start
```

This starts the Expo dev server and prints a QR code plus a small menu. Depending on which option
you picked in the prerequisites:

- **Physical device (Expo Go)**: open the Expo Go app and scan the QR code shown in the terminal
  (iOS: use the Camera app to scan it, which hands off to Expo Go; Android: scan it from inside
  Expo Go itself).
- **iOS Simulator**: press `i` in the terminal. The Simulator and Expo Go both launch
  automatically the first time.
- **Android Emulator**: start your virtual device from Android Studio first, then press `a` in
  the terminal.

## 5. Confirm it works

Within a couple of seconds you should see the **Documents** screen with a list of documents
fetched from the reference server. Try:

- Toggling list/grid view (top-right icons).
- Changing sort order (the "Sort by" control).
- Pulling down to refresh.
- Tapping the bottom **"Add document"** button, filling the form, and submitting — the new
  document appears at the top of the list.
- Waiting a few seconds (the server emits a WebSocket message every 0-5s) — a notification banner
  and a bell badge should appear.

If the list never loads and you instead see an offline/error state, see
[Troubleshooting](#troubleshooting) below — it's almost always step 1 or step 3.

## Running the unit test suite

No server, simulator, or `.env` file needed for this — it's fully isolated:

```bash
npm test
```

Runs the full Jest + React Native Testing Library suite (reducers, hooks, components — see
[TECH-PLAN.md §5](TECH-PLAN.md#5-testing-strategy) for what's covered and why). For watch mode
while developing:

```bash
npm run test:watch
```

## Running the E2E test (Maestro)

The end-to-end flow (`e2e/flows/golden-path.yaml`) drives the real app — list load, view/sort
toggles, creating a document, seeing a live notification — against the real reference server, no
mocks. Full prerequisites, troubleshooting, and the reasoning behind how it's set up live in
[`e2e/README.md`](e2e/README.md); the short version:

1. Install the [Maestro CLI](https://docs.maestro.dev/getting-started/installing-maestro):
   ```bash
   curl -Ls "https://get.maestro.mobile.dev" | bash
   ```
2. Make sure both the reference server (step 1) and this app's dev server (step 4) are running,
   with an iOS Simulator or Android Emulator open and Expo Go installed on it (this flow targets a
   Simulator/Emulator, not a physical device).
3. Run:
   ```bash
   npm run e2e
   ```

Maestro will reset the app to a clean state, drive it through the whole flow automatically, and
report pass/fail. See `e2e/README.md` if anything about that run needs explaining (e.g. why the
app's own onboarding overlay briefly appears, or what to do if it can't reach the dev server on
Android).

## Full verification (mirrors CI)

The same four checks [CI](.github/workflows/ci.yml) runs on every push/PR to `master`/`develop`:

```bash
npx tsc --noEmit      # type check
npm run lint          # ESLint
npm run format:check  # Prettier
npm test              # Jest + RNTL
```

## Troubleshooting

- **App shows an offline/error state on first load.** Almost always one of: the reference server
  isn't running (step 1), or `EXPO_PUBLIC_API_HOST` in `.env` doesn't match how you're running the
  app (step 3 table). Editing `.env` requires restarting `npm start` — Expo inlines `EXPO_PUBLIC_*`
  values into the bundle at start-up, so it won't pick up a change while already running.
- **Android Emulator can't reach the server, even with `EXPO_PUBLIC_API_HOST=10.0.2.2`.** Confirm
  the emulator (not just the server) is actually running, and that you restarted `npm start` after
  editing `.env`.
- **Physical device via Expo Go can't reach the server.** Confirm the phone and computer are on
  the same Wi-Fi network, and that `EXPO_PUBLIC_API_HOST` is the computer's actual LAN IP (not
  `localhost`, which on a phone means the phone itself). Some corporate/guest Wi-Fi networks
  isolate devices from each other, which no `.env` value can work around — try a home network or a
  personal hotspot if that happens.
- **`npm start` can't find a Simulator/Emulator when pressing `i`/`a`.** Confirm Xcode (iOS) or an
  Android Studio virtual device (Android) is fully installed, per [Prerequisites](#prerequisites)
  — Expo launches an existing Simulator/Emulator, it doesn't install one for you.
- **Anything E2E-specific** (Maestro not finding Expo Go, the dev-menu overlay, Android port
  forwarding): see the dedicated troubleshooting notes in [`e2e/README.md`](e2e/README.md).

## Project documentation

- **[TECH-PLAN.md](TECH-PLAN.md)** — the canonical source for _why_: architecture decisions,
  the design patterns in use and where each lives in the code (§3.10), the full third-party
  library comparison table (what was used, what was considered and rejected, and why), the
  testing strategy, and the complete step-by-step implementation backlog as it was actually
  planned and executed. This README intentionally doesn't repeat any of that.
- **[AGENTS.md](AGENTS.md)** — see the note right below.

## A note on AI-assisted development and Skills

Part of this project's development was AI-assisted (Claude Code). [AGENTS.md](AGENTS.md) is the
running log of the working conventions established for that collaboration — code conventions,
folder/import rules, and a dated gotchas log of real issues hit along the way (an Expo SDK quirk,
a flaky E2E tap, etc.) and how each was actually resolved. It's kept so guidance given once
doesn't need repeating, and so a reviewer can see the reasoning behind non-obvious decisions
in-place rather than having to reconstruct it from the diff alone.

No custom [Claude Skills](https://docs.claude.com/en/docs/claude-code/skills) were written for
this project. A Skill earns its keep when a multi-step procedure repeats several times with the
same shape — this challenge is small enough that no such repetition actually came up. If it had
(for example, wiring up a feature flag for each newly built feature, following the same steps
every time), that procedure would have been extracted into its own Skill instead of being
re-explained by hand on every occurrence.

## Known limitations

- **Document creation is client-side only** — the reference server has no create endpoint, so a
  new document lives in local state + `AsyncStorage`, not on the server. Deliberate, not a gap —
  see [TECH-PLAN.md §1](TECH-PLAN.md#1-server-integration-facts-from-the-reference-server).
- **The "Choose file" field is a non-functional placeholder** — there's no upload endpoint for a
  real file to go to either. See [TECH-PLAN.md §3.7](TECH-PLAN.md#37-ui).
- **List/grid and sort-order transitions don't animate on Android** (they still work, just without
  the transition) — an upstream React Native bug under the New Architecture, not a missing
  configuration on this app's side. See
  [TECH-PLAN.md §7](TECH-PLAN.md#7-open-items--assumptions) for the full explanation and upstream
  issue links.
