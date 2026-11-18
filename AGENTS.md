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

### Commands

| Command           | Purpose                       |
| ----------------- | ----------------------------- |
| `npm run dev`     | Dev server                    |
| `npm run build`   | Type-check (`tsc -b`) + build |
| `npm run lint`    | oxlint                        |
| `npm run preview` | Serve the production build    |

Tests (from milestone 2): `npm run test` runs vitest on `src/game/**`. See "Milestone 2 spec" below.

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

## Project structure

```
src/
  main.tsx                 // entry, mounts <App/>
  index.css                // @import "tailwindcss";
  App.tsx                  // useReducer over game engine; screen switching
  game/                    // PURE LOGIC — no React
    types.ts               // Food, Habitat, BirdCard, BoardSlot, Player, GameState, GameAction
    birds.ts               // ~30 original bird card definitions (data only)
    goals.ts               // end-of-round goal definitions
    rng.ts                 // seeded PRNG (mulberry32) + shuffle
    setup.ts               // createGame(seed, playerConfigs) => GameState
    engine.ts              // reduce(state, action) + legality helpers (canPlayBird, ...)
    powers.ts              // bird power resolution
    scoring.ts             // final + round-goal scoring
    bot.ts                 // chooseAction(state, playerId) => GameAction
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
    StartScreen.tsx        // new game: vs bot / hot-seat
    GameScreen.tsx         // in-game layout; owns the in-progress turn draft
    FoodToken.tsx, GameLog.tsx, RulesModal.tsx
  draft.ts                 // UI-side "draft" of a turn's choices -> one GameAction
  theme.ts                 // food/habitat icons and static Tailwind class maps
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
persistence, online multiplayer.

## Players

- Engine supports **N players (1–4)**, each `kind: 'human' | 'bot'`.
- Default new game: **1 human vs 1 bot**. Hot-seat (2+ humans) works with the same engine.
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
6. **Polish** (mostly ✅) — habitat colour theming, responsive layout, action log, rules help modal.
   Colours, log and rules modal are in; the layout is responsive but only lightly tuned for phones.

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
- **Invalid actions don't throw.** `validateAction(state, action): string | null` returns
  `null` if legal or a human-readable reason if not. `reduce` calls it and returns the state
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
  log: string[] // human-readable event log
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
