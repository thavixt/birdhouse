# Birdhouse

A bird-themed engine-building card game for the browser, in English and Hungarian.

Attract birds to your forest, grassland and wetland over four rounds. Every bird you
place makes that habitat's action stronger, so your board grows into an engine that
gains more food, lays more eggs and draws more cards each turn.

## Features

- **Play solo, against the computer, or in person with friends** on one device: 1–4
  players, with as many bots as you like alongside you.
- **32 bird cards** with original stats and powers, 8 end-of-round goals, full final
  scoring.
- **English and Magyar**, switchable at any time.
- **Resume where you left off:** the game in progress is saved in the browser.
- **Installable app (PWA)** that works offline once installed.

## How to play

On your turn, take one action:

- **Play a bird:** pay its food cost and place it in a habitat it can live in. Later
  slots in a row cost eggs.
- **🌲 Gain food**, **🌼 Lay eggs** or **💧 Draw cards:** the more birds in that habitat, the
  more you get, and those birds then activate their powers.

Each round ends with a goal (for example "Most birds in forest") that awards points.
After four rounds, the highest score wins: bird points + eggs + leftover food (up to 5) +
goal points. The full rules are under **Rules** in the game.

## Getting started

Requires Node.js 22.12 or newer.

```sh
npm install
npm run dev
```

The dev server runs at **https://localhost:8236**. HTTPS comes from
[vite-plugin-mkcert](https://github.com/liuweiGL/vite-plugin-mkcert): the first run
downloads mkcert and adds a local certificate authority to your system's trusted
certificates (your OS may ask you to confirm).

## Scripts

| Command           | Purpose                                         |
| ----------------- | ----------------------------------------------- |
| `npm run dev`     | Start the dev server (HTTPS)                    |
| `npm run build`   | Type-check and build to `dist/`                 |
| `npm run preview` | Serve the production build (HTTPS)              |
| `npm run test`    | Run the unit tests (vitest)                     |
| `npm run lint`    | Lint with oxlint                                |

## Installing as an app

The service worker and app manifest only exist in production builds, so `npm run dev`
won't offer an install button. To try it locally:

```sh
npm run build
npm run preview
```

Then open the printed `https://localhost:…` address in Chrome or Edge and use the install
icon in the address bar. Phones only offer installing over HTTPS, so share a hosted copy
with friends.

## Translations

All text lives in [src/i18n/en-us.json](src/i18n/en-us.json) and
[src/i18n/hu-hu.json](src/i18n/hu-hu.json). Both files must have the same keys; a test
fails if they don't.

## Stack

React 19 (with React Compiler) · TypeScript · Vite 8 · Tailwind CSS v4 · i18next ·
vite-plugin-pwa · vitest · oxlint

## Contributing

[AGENTS.md](AGENTS.md) is the guide for working on the code: conventions, project
structure, the full rules, and the backlog of ideas for v2.
