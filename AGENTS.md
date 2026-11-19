# AGENTS.md — Birdhouse

Guidance for AI agents (and humans) working on this repo.

## What this is

**Birdhouse** is a bird-themed engine-building card game for the browser, based on the award-winning tabletop game _Wingspan_
Players attract birds to three habitats; each bird strengthens the action of the
habitat it lives in, so the board grows into an "engine" over four rounds.

All names, card data, powers, rules text and visuals are **original to this project**.
Do not copy card text, artwork, iconography, or layouts from any published board game.
Real bird species names are fine; their stats and powers must be our own.

## Tech stack

- **Vite 8** + **React 19** + **TypeScript** (scaffolded with `create-vite`, `react-compiler-ts` template)
- **React Compiler** via `@rolldown/plugin-babel` + `reactCompilerPreset()` — handles memoization automatically
- **Tailwind CSS v4** via `@tailwindcss/vite` (`src/index.css` contains only `@import "tailwindcss";`)
- **oxlint** for linting
- **i18next + react-i18next** for translations: English (`en-us`) and Hungarian (`hu-hu`)
- **vite-plugin-pwa** — installable, offline-capable PWA (see "PWA" under Conventions)
- **vite-plugin-mkcert** — local HTTPS for `npm run dev` and `npm run preview`
  (`https://localhost:8236`). Not used by `npm run build`. The first run on a machine
  downloads mkcert and installs its local CA into the OS trust store (may show a prompt).

### Commands

| Command           | Purpose                                              |
| ----------------- | ---------------------------------------------------- |
| `npm run dev`     | Dev server (HTTPS, `https://localhost:8236`)         |
| `npm run build`   | Type-check (`tsc -b`) + build                        |
| `npm run lint`    | oxlint                                               |
| `npm run preview` | Serve the production build (HTTPS)                   |
| `npm run test`    | vitest: `src/game/**` and `src/i18n/**` tests        |

Requires Node.js 22.12+ (vitest's minimum).

## Conventions

- **Game logic is pure and UI-free.** Everything in `src/game/` is plain TypeScript:
  no React imports, no DOM, no `Math.random()` calls inline — randomness goes through
  a seeded RNG stored in state so games are reproducible and testable.
- **Single source of truth:** one `GameState` object, updated only by
  `reduce(state, action) => state` in `src/game/engine.ts`. The UI calls
  `useReducer(reduce, …)` and dispatches `GameAction`s.
- **Immutable updates.** Never mutate state in the reducer; return new objects.
- **No manual memoization.** Don't add `useMemo` / `useCallback` / `React.memo` —
  React Compiler does it. Follow the Rules of React (pure render, no mutation of props/state).
- **No TS `enum`s or `namespace`s** (`erasableSyntaxOnly` is on). Use string-literal
  unions and `as const` objects.
- **Styling:** Tailwind utility classes only; no CSS modules or extra CSS files.
  Extract repeated class sets into small components, not `@apply`.
- **Components** are function components, one per file, PascalCase filenames.
- Keep it **basic**. Prefer fewer features done well over many half-done ones.

### Responsive layout

- **Mobile-first Tailwind:** unprefixed classes are the phone layout; `sm:` (≥ 640px) and
  `lg:` (≥ 1024px) restore the wider layouts. Desktop is the original design.
- **No horizontal page scrolling** at 320px and up. Wide content scrolls inside its own
  container instead (hand, bird tray, goal chips on phones, the score table).
- **Habitat rows:** on phones the action button is a bar above the 5 slots; from `sm` it's
  a column on the left. Placed birds show a compact egg count (🥚 2/5) on phones.
- **Action panel:** from `lg` it sits in the sidebar. Below `lg` a second instance
  (`docked`) is the `sticky bottom-0` last child of the page column, so prompts and
  Confirm stay on screen without permanently covering content. Only one instance is
  visible at a time (`hidden lg:block` / `lg:hidden`), so tests and scripts that look
  up its text should filter to the visible one.

### Persistence

- The game in progress is saved to `localStorage` (`birdhouse.savedGame`) after every
  action and offered as "Continue" on the start screen. "Quit" keeps the save; starting a
  new game replaces it; a finished game clears it.
- `src/game/save.ts` (pure, tested) owns the format: `{ version: SAVE_VERSION, state }`.
  `deserializeGame` rejects missing, malformed or outdated saves and unknown card/goal ids.
  **Bump `SAVE_VERSION` whenever `GameState`'s shape changes**, so old saves are dropped
  instead of crashing the game.
- `src/persistence.ts` is the only code touching storage; every call is wrapped in
  try/catch so the game still works when storage is unavailable.

### PWA

- Configured in `vite.config.ts` (`VitePWA`): `registerType: 'autoUpdate'` (new versions
  install in the background and apply on the next load), Workbox `generateSW` precaching
  the whole build so the installed app works fully offline.
- Icons (favicon, apple-touch, 64/192/512, maskable) are **generated at build time** from
  `public/duck.png` by `pwaAssets` (`@vite-pwa/assets-generator`), which also injects the
  icon and `theme-color` tags into `index.html`. Don't add icon links by hand; to change
  the icon, replace `duck.png` (square, ≥ 512px).
- Don't add `webmanifest` to `workbox.globPatterns`: the plugin precaches the manifest
  itself, and a duplicate entry makes the whole precache fail silently.
- The service worker only runs in production builds. To test installing / offline use
  `npm run build && npm run preview` (served over HTTPS via mkcert), not `npm run dev`.

### Translations (i18n)

- **No hardcoded user-facing text.** Every string the player can see (including `title`
  and `aria-label`) comes from `src/i18n/en-us.json` via `useTranslation()`'s `t()`, or
  `<Trans>` for text with markup (`<b>…</b>`). Add new keys to **both** `en-us.json` and
  `hu-hu.json` (copy the English text if there's no translation yet). A test fails when
  the two files' keys differ or code uses a missing key.
- **Plurals:** use `_one` / `_other` key suffixes and pass `count`.
- **Rules dialog** (`RulesModal.tsx`, `rules.*` keys): when a rule changes, update its
  text in both files. The goal points table is built from `GOAL_POINTS`, not the JSON.
- **`src/game/` never imports i18n.** The engine emits `GameMessage = { key, params }`
  for log entries and validation errors; keys are paths in the JSON (`log.*`, `error.*`).
  `formatMessage(t, msg)` in `src/i18n/message.ts` translates params by name: `card` /
  `target` → bird name, `habitat` → `habitat` + `habitatIn`, `food` → food name,
  `foods` → "2 seed, 1 fish", `goal` → goal name, other arrays → comma-joined.
- Bird names, goal names and power text are shown from the JSON (`birds.<id>`,
  `goals.<id>`, `powers.<kind>`); `BirdCard.name` in `birds.ts` is reference data only.
- The chosen language is stored in `localStorage` (`birdhouse.language`); first visit
  defaults to Hungarian if the browser language is Hungarian, otherwise English.

## Project structure

```
src/
  main.tsx                 // entry: loads i18n, mounts <App/>
  index.css                // @import "tailwindcss";
  App.tsx                  // useReducer over the engine; screens, bot turns, saving
  game/                    // PURE LOGIC — no React
    types.ts               // Food, Habitat, BirdCard, SlotRef, Player, GameState, GameAction, GameMessage
    birds.ts               // ~30 original bird card definitions (data only)
    goals.ts               // end-of-round goal definitions
    rng.ts                 // seeded PRNG (mulberry32) + shuffle
    setup.ts               // createGame(seed, playerConfigs) => GameState
    engine.ts              // reduce, validateAction + helpers (playableHabitats, canAfford, ...)
    powers.ts              // bird power resolution
    scoring.ts             // final + round-goal scoring
    bot.ts                 // chooseAction(state, playerId) => GameAction
    save.ts                // versioned save format + validation
    __tests__/             // vitest unit tests
  components/
    Board.tsx              // a player's three habitat rows
    HabitatRow.tsx         // one row: action button + 5 slots
    BirdCard.tsx           // card visual (name, habitat, cost, points, egg limit, power)
    Hand.tsx               // current player's cards
    FoodSupply.tsx         // shared food supply / player's food tokens
    CardTray.tsx           // 3 face-up cards + deck
    ActionPanel.tsx        // contextual prompts (choose food, place eggs, pick card)
    RoundTracker.tsx       // round, turns left, goals
    ScoreScreen.tsx        // final scores breakdown
    StartScreen.tsx        // new game: solo / vs computer / with friends, continue saved game
    GameScreen.tsx         // in-game layout; owns the in-progress turn draft
    LanguageSwitch.tsx     // English | Magyar toggle
    PowerText.tsx          // translated "When activated: …" power text
    RulesButton.tsx        // self-contained "Rules" button + dialog (start screen, game header)
    FoodToken.tsx, GameLog.tsx, RulesModal.tsx
  draft.ts                 // UI-side "draft" of a turn's choices -> one GameAction
  theme.ts                 // food/habitat icons and static Tailwind class maps
  persistence.ts           // localStorage load/save/clear of the game in progress
  i18n/
    index.ts               // i18next init, LANGUAGES, language persistence
    message.ts             // formatMessage(t, GameMessage) for engine log/errors
    en-us.json             // English dictionary (source of truth for keys)
    hu-hu.json             // Hungarian dictionary (same keys)
    __tests__/             // dictionary consistency tests
public/
  duck.png                 // source image for all generated app icons
```

> Windows note: run vitest from a path with an upper-case drive letter (`C:\...`).
> With a `c:\...` cwd vitest loads two module copies and every suite fails with
> "Vitest failed to find the current suite".

## Game rules (v1 — "very basic")

### Components

- **Food types (5):** `seed`, `insect`, `fish`, `fruit`, `rodent`.
- **Bird cards:** name, allowed habitat(s), food cost (list of food types, optionally
  "any 1"), victory points, egg limit, optional power.
- **Habitats (3):** `forest`, `grassland`, `wetland`, each a row of 5 slots per player.
- **Food supply:** unlimited shared pool (v1 has no dice feeder).
- **Card tray:** 3 face-up cards, refilled from the deck at end of each turn.

### Setup

- Each player gets 5 random bird cards and 5 food (1 of each type).
- Shuffle deck, fill tray with 3 cards. Pick 4 random round goals.

### Turn

On your turn, take **exactly one** action:

1. **Play a bird** — pay its food cost, place it in the leftmost empty slot of a
   habitat it allows. Egg cost by column: slots 1–2 free, 3–4 cost 1 egg, 5 costs 2 eggs
   (eggs removed from any of your birds).
2. **Gain food** (forest) — take N food of your choice, where
   N = 1 + floor(birds in forest / 2). Then activate forest birds' powers right-to-left.
3. **Lay eggs** (grassland) — place N eggs on your birds (respecting egg limits),
   N = 2 + floor(birds in grassland / 2). Then activate grassland powers right-to-left.
4. **Draw cards** (wetland) — draw N cards from tray and/or deck,
   N = 1 + floor(birds in wetland / 2). Then activate wetland powers right-to-left.

Hand limit: none in v1.

### Rounds

- 4 rounds. Turns per player per round: **8, 7, 6, 5**.
- Players alternate turns. At end of each round, score that round's goal.

### Powers (v1 — only "when activated", all simple & optional)

Powers resolve automatically (all are beneficial, so there is no choice to make).
`layEggAny` puts the egg on the bird with the most free space.

- `gainFood(type)` — gain 1 of a food type
- `layEgg(self)` — lay 1 egg on this bird
- `layEggAny` — lay 1 egg on any of your birds
- `drawCard` — draw 1 card from deck
- `allGainFood(type)` — every player gains 1 of a food type

### Round goals

Defined in `goals.ts`: most birds in forest / grassland / wetland, most birds total,
most eggs in grassland, most eggs total, most birds with eggs, most bird points on board.
Scoring per round: 1st = 4/5/6/7 pts (by round), 2nd = 1/2/3/4, others 0.
Tied players share the points of the places they span (round down). A player needs a
value of at least 1 to place (so nobody scores an empty goal, e.g. in solo play).

### End of game scoring

Bird points + 1 per egg + 1 per leftover food (cap 5) + round-goal points.
Tiebreak: most leftover food.

### Explicitly out of scope for v1

Dice feeder, bonus cards, tucking cards, caching food, nest types, "when played"
and "between turns" powers, predator powers, bird size stats, animations,
online multiplayer. (Persistence was originally on this list and has since been added;
see "Persistence" under Conventions.)

## Players

- Engine supports **N players (1–4)**, each `kind: 'human' | 'bot'`, in any mix.
- **Start screen** (`StartScreen.tsx`) offers three modes; **Solo** (1 human) is the default:

  | Mode                   | Preset line-up       | Highlighted when the line-up has… |
  | ---------------------- | -------------------- | --------------------------------- |
  | Solo                   | 1 human              | 1 human, no bots                  |
  | Against the computer   | 1 human + 1 bot      | 1 human + any bots                |
  | In person with friends | 2 humans (hot-seat)  | 2+ humans, with or without bots   |

  The highlight is derived from the current line-up, so it follows manual edits too.
- **The first player is always human** (the person at the device): no human/bot toggle
  and no remove button on that row. So the UI never starts an all-bot game, even though
  the engine would allow one.
- **Player names:** switching a player between human and bot swaps a preset name
  ("Player N", the bot names) for an unused one of the new kind; a name the user typed
  is kept. "Add player" adds a bot with the first unused bot name.
- **Bot (v1):** greedy heuristic — play the highest-points affordable bird; else take the
  action that best unlocks one (food it lacks, eggs if a slot needs them, cards if hand is
  thin); late game, favour laying eggs. Bot turns run with a short delay for readability.

## Milestones

1. **Scaffold** ✅ — Vite + React Compiler + TS + Tailwind; build & lint pass.
2. **Core engine** ✅ — `types`, `rng`, `birds`, `setup`, `engine` (4 actions, egg costs,
   turn/round flow), `scoring`. Unit tests with vitest.
3. **Basic UI** ✅ — StartScreen, Board, HabitatRow, BirdCard, Hand, FoodSupply, CardTray,
   ActionPanel, RoundTracker, ScoreScreen. Playable hot-seat.
4. **Powers + round goals** ✅ — `powers.ts`, `goals.ts`, wired into engine & UI.
5. **Bot** ✅ — `bot.ts`, auto-play bot turns.
6. **Polish** ✅ — habitat colour theming, responsive layout, action log, rules help modal.
   Phone layout checked at 320, 360, 375 and 414px (see "Responsive layout" under Conventions).

## Backlog — v2 ideas

Persistence is done; everything else here is not started.

> Ideas only, not a spec. Before building one, write it up like the "Milestone 2 spec"
> (scope, rules, design decisions, tests) and move the rule changes into "Game rules".
> Each item keeps the existing conventions: pure engine, seeded RNG, complete-command
> actions, all display text in `src/i18n/*.json`.

### Leftovers from v1

None. Phone layout and the Hungarian bird names (checked against Hungarian Wikipedia)
are done.

### Suggested order

1. ~~**Persistence**~~ ✅ + ~~**phone layout**~~ ✅ — cheap; fix the most noticeable friction.
2. **"When played" powers** + **bonus cards** — most strategic depth per effort; the
   engine already suits them.
3. Later: **dice feeder**, **"between turns" / predator powers**, **online multiplayer** —
   each reshapes the engine or needs infrastructure.

### Ideas

| Feature                                | Effort       | Notes                                                                                                                                                                   |
| -------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Persistence** (resume a game) ✅     | Small        | Done — see "Persistence" under Conventions.                                                                                                                             |
| **Animations**                         | Small–medium | Card moves, eggs appearing, round-end banner. UI-only.                                                                                                                  |
| **"When played" powers**               | Medium       | Fire once when the bird is placed. Fits the engine's action model; needs new `Power` kinds, cards, translations and tests.                                               |
| **Bonus cards**                        | Medium       | Secret per-player end-game scoring conditions (e.g. "birds that eat fish"). New card type, scoring and UI.                                                              |
| **Tucking cards / caching food**       | Medium       | Score-only piles under birds, plus powers that use them.                                                                                                                |
| **Dice feeder**                        | Medium–large | Replaces the unlimited food supply with a shared, rerollable pool. Changes `gainFood`, its validation and the bot's food choice.                                         |
| **Nest types, bird size**              | Medium       | Card attributes; only matter once goals or bonus cards use them.                                                                                                        |
| **"Between turns" / predator powers**  | Large        | Trigger on other players' turns, some with randomness; complicates the one-action-per-turn flow.                                                                        |
| **Online multiplayer**                 | Large        | Server, rooms and syncing. The deterministic engine helps (sync actions, not states), but it's its own project.                                                         |

## Definition of done (every change)

- `npm run build` and `npm run lint` pass with no errors.
- Game logic changes come with/keep passing unit tests (from milestone 2 on).
- No new runtime dependencies without a clear reason.

---

## Milestone 2 spec — Core engine

> Status: **done** ✅. This milestone covers the rules core only: no UI, powers, round
> goals or bot. The full playable game is milestones 2–5 together; this one is the
> foundation they all build on.

### Goal

A pure, fully unit-tested TypeScript rules engine in `src/game/` that can play a complete
4-round game (setup → turns → rounds → final scores) when driven by valid actions,
and rejects invalid ones.

### Scope

- **In:** `types.ts`, `rng.ts`, `birds.ts`, `setup.ts`, `engine.ts`, `scoring.ts`, vitest
  setup and tests.
- **Out (later milestones):** power resolution (types defined now, ignored by the engine
  until M4), round-goal scoring (M4; `goalPoints` stays 0), bot (M5), any React code (M3).

### Design decisions

- **Actions are complete commands.** Each `GameAction` carries every choice the player
  made (which foods, where eggs go, which cards), so the engine never needs a multi-step
  "pending decision" state. The UI (M3) collects the choices first, then dispatches one action.
- **Invalid actions don't throw.** `validateAction(state, action): GameMessage | null` returns
  `null` if legal or a translatable reason (`error.*` key + params) if not. `reduce` calls it and returns the state
  unchanged for invalid actions.
- **IDs:** card definitions have a stable `id` (e.g. `'barn-owl'`). Hands, deck, tray and
  board reference cards by id; `BIRDS_BY_ID` in `birds.ts` resolves them. Duplicate copies
  in the deck are allowed.
- **RNG state lives in `GameState`** (`rngState: number`). Anything that shuffles returns the
  new rng state. Same seed + same actions ⇒ identical game.

### `types.ts`

```ts
export const FOODS = ['seed', 'insect', 'fish', 'fruit', 'rodent'] as const
export type Food = (typeof FOODS)[number]

export const HABITATS = ['forest', 'grassland', 'wetland'] as const
export type Habitat = (typeof HABITATS)[number]

export type FoodCost = { foods: Food[]; anyCount: number } // anyCount = "any N food"

export type Power = // resolved in M4, defined now
  | { kind: 'gainFood'; food: Food }
  | { kind: 'layEggSelf' }
  | { kind: 'layEggAny' }
  | { kind: 'drawCard' }
  | { kind: 'allGainFood'; food: Food }

export type BirdCard = {
  id: string
  name: string
  habitats: Habitat[]
  cost: FoodCost
  points: number
  eggLimit: number
  power?: Power
}

export type PlacedBird = { cardId: string; eggs: number }
export type Board = Record<Habitat, PlacedBird[]> // 0..5 birds, left to right
export type SlotRef = { habitat: Habitat; index: number }
export type EggPlacement = { slot: SlotRef; count: number }

export type Player = {
  id: string
  name: string
  kind: 'human' | 'bot'
  hand: string[] // card ids
  food: Record<Food, number>
  board: Board
  goalPoints: number // filled in M4
}

export type GameState = {
  players: Player[]
  currentPlayer: number // index into players
  firstPlayer: number // rotates each round
  round: 1 | 2 | 3 | 4
  turnsLeft: number[] // per player, this round
  deck: string[]
  tray: (string | null)[] // always length 3
  goals: string[] // one goal id per round (used in M4)
  rngState: number
  phase: 'playing' | 'gameOver'
  log: GameMessage[] // translatable event log ({ key, params })
}

export type CardPick = { from: 'tray'; index: number } | { from: 'deck' }

export type GameAction =
  | {
      type: 'playBird'
      cardId: string
      habitat: Habitat
      payment: Food[]
      eggPayment: EggPlacement[]
    }
  | { type: 'gainFood'; foods: Food[] }
  | { type: 'layEggs'; placements: EggPlacement[] }
  | { type: 'drawCards'; picks: CardPick[] }
```

### `rng.ts`

- `nextRandom(state: number): [value: number, nextState: number]`: mulberry32, value in [0, 1).
- `shuffle<T>(items: readonly T[], state: number): [T[], number]`: Fisher–Yates, non-mutating.

### `birds.ts`

- ~30 **original** `BirdCard` definitions using real species names; stats and powers are our own.
- Balance guide: total cost ≈ points tier. 1 food → 1–3 pts, 2 food → 3–5 pts,
  3 food → 5–8 pts. Egg limit 1–6, roughly inverse to points.
- Coverage: each habitat has ≥ 12 birds that can live there; each food type appears in
  ≥ 6 costs; ~5 birds use `anyCount`; about half have a power.
- Exports: `BIRDS: BirdCard[]`, `BIRDS_BY_ID: Record<string, BirdCard>`,
  `STARTING_DECK: string[]` (each bird twice → ~60 cards).

### `setup.ts`

`createGame(seed: number, players: { name: string; kind: 'human' | 'bot' }[]): GameState`

- Require 1–4 players.
- Shuffle `STARTING_DECK`; deal 5 cards to each player; fill the tray with 3.
- Each player starts with 1 of each food, an empty board and `goalPoints: 0`.
- Pick 4 goal ids at random (placeholder list until M4).
- `round: 1`, `turnsLeft: players.map(() => 8)`, `currentPlayer: 0`, `firstPlayer: 0`,
  `phase: 'playing'`.

### `engine.ts`

Exports `reduce`, `validateAction`, and helpers that the UI and bot will reuse:

| Helper                                       | Returns                                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------------------- |
| `eggCostForSlot(index)`                      | `0, 0, 1, 1, 2` for slot indices 0–4                                                  |
| `canAfford(player, cost, payment)`           | payment exactly covers cost (listed foods + `anyCount` of anything) and player owns it |
| `playableHabitats(state, playerIdx, cardId)` | habitats where the bird is allowed, row isn't full, and the egg cost is payable       |
| `actionCount(board, habitat)`                | food `1 + ⌊n/2⌋`, eggs `2 + ⌊n/2⌋`, cards `1 + ⌊n/2⌋` (n = birds in that row)          |
| `eggCapacity(player)`                        | total free egg space across all of the player's birds                                 |
| `totalEggs(player)`                          | eggs across all of the player's birds                                                 |
| `turnsPerRound(round)`                       | `8, 7, 6, 5`                                                                          |

**Action rules (validated):**

- `playBird`: card is in hand; habitat is allowed for the bird and the row has < 5 birds;
  `payment` exactly matches the cost and is owned; `eggPayment` removes exactly
  `eggCostForSlot(row.length)` eggs from birds that have them. Effect: remove the card from
  hand, deduct food and eggs, append `{ cardId, eggs: 0 }` to the row.
- `gainFood`: `foods.length === actionCount(forest)`. Effect: add the foods.
- `layEggs`: each bird stays ≤ its `eggLimit`; total must equal
  `min(actionCount(grassland), eggCapacity(player))` (so 0 is legal only when no space).
  Effect: add the eggs.
- `drawCards`: `picks.length === min(actionCount(wetland), filled tray slots + deck size)`;
  tray indices distinct and non-empty; deck picks ≤ deck size. Effect: add to hand; picked
  tray slots become `null`.

**Turn flow** (after any valid action):

1. Refill empty tray slots from the deck (if the deck is empty, slots stay `null`).
2. Decrement `turnsLeft[currentPlayer]`; append a log line.
3. Advance `currentPlayer` to the next player (wrapping) with `turnsLeft > 0`.
4. If every player has 0 turns left, end the round: (M4 hook: score the round goal), then
   - round 4 → `phase = 'gameOver'`;
   - otherwise `round++`, discard the tray and refill it with 3 new cards, reset `turnsLeft`
     to `turnsPerRound(round)`, `firstPlayer = (firstPlayer + 1) % players.length`,
     `currentPlayer = firstPlayer`.
5. Any action while `phase === 'gameOver'` is invalid.

### `scoring.ts`

- `scorePlayer(player)` → `{ birds, eggs, food, goals, total }`: bird points + 1 per egg +
  `min(5, total food)` + `goalPoints`.
- `finalStandings(state)` → `{ playerIdx, breakdown, rank }[]`: sorted by total, tiebreak by
  most leftover food; still tied ⇒ shared rank.

### Tests (`src/game/__tests__/*.test.ts`, vitest)

Add `vitest` as a devDependency and a `"test": "vitest run"` script.

- **rng:** same seed ⇒ same sequence; shuffle is a permutation; input not mutated.
- **birds:** ids unique; every bird has ≥ 1 habitat; the coverage rules above hold.
- **setup:** hand sizes, starting food, tray of 3, deck size = total − dealt − 3;
  same seed ⇒ equal state.
- **engine (per action):** happy path plus each rejection reason; egg cost per slot
  (0, 0, 1, 1, 2); `actionCount` scaling; lay-eggs capacity edge case; drawing from an empty
  deck; immutability (deep-freeze the input state, `reduce` must not throw).
- **flow:** turn alternation; a player with 0 turns is skipped; round transitions
  (8 → 7 → 6 → 5), first-player rotation, tray reset; `gameOver` after round 4 and further
  actions rejected.
- **scoring:** breakdown math, food cap of 5, tiebreak and shared ranks.
- **simulation:** a "first legal action" driver plays 100 seeded games to completion with
  no invalid states (no negative food or eggs, eggs ≤ limit, rows ≤ 5).

### Acceptance criteria

- [x] All files above exist; `src/game/` has zero React or DOM imports.
- [x] `npm run test`, `npm run build` and `npm run lint` all pass.
- [x] The simulation test completes 100 games.
- [x] Milestone list above updated (M2 ✅), and any rule changes reflected in
      "Game rules (v1)".
