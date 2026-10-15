# d-pacer

A mobile-first race pace planner. Pick a race distance, set a goal finish time or average pace, choose a strategy (even, negative split, positive split, or progression), and get a split table with rolling average pace, elapsed time, and checkpoint times. You can also enter every split by hand and see how far ahead or behind your goal you are.

- Miles or kilometers for splits and pace
- Plans are saved in the browser and can be shared as a link
- Printable wrist pace band
- Light and dark mode (follows your system setting by default)

Originally prototyped in Figma Make ([rocketman1776/dPacer](https://github.com/rocketman1776/dPacer)).

## Stack

React 19, TypeScript, Vite 8, Tailwind CSS v4, Vitest.

## Run locally

Requires Node 22 and pnpm 10.

```bash
pnpm install
pnpm dev          # http://localhost:8443 (override with PORT=xxxx)
```

Other scripts:

```bash
pnpm test         # unit tests for the pace math and saved/shared plan state
pnpm typecheck    # tsc --noEmit
pnpm build        # production build in dist/
pnpm preview      # serve the production build
```

## Beta and live

`main` is the live app at [dpacer.app](https://dpacer.app). The `beta` branch is the test app at [dpacer.app/beta](https://dpacer.app/beta), with a Beta banner under the logo. Saved plans stay separate between the two.

Push the `beta` branch to update the test app. When that version is ready, merge `beta` into `main` to publish it live.

## Project layout

- `src/lib/pace.ts` – pure pace calculations: segments, strategies, checkpoints, unit conversion, formatting
- `src/lib/planState.ts` – plan state shape, validation, localStorage and share-link encoding
- `src/lib/useTheme.ts` – light/dark mode with system preference
- `src/components/` – UI sections (distance, goal, strategy, splits, print pace band) and input fields
- `src/App.tsx` – state and wiring
- `src/index.css` – styles, dark mode, and print stylesheet

