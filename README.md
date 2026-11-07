# Mini Pokédex

A single-page Angular 21 app to browse Pokémon and build teams. Pokémon data comes from the
PokéAPI GraphQL endpoint; teams are stored in a local `json-graphql-server` mock.
Built for the Angular frontend assessment, following `DEVELOPER_GUIDE`.

## Setup

Requires a current Node.js LTS.

```bash
npm install
npm run mock:api   # terminal 1: mock teams API on http://localhost:4000
npm start          # terminal 2: app on http://localhost:4200
```

Other scripts:

```bash
npm test -- --no-watch   # unit tests (Vitest)
npx ng lint              # ESLint
npx ng build             # production build
```

The mock server keeps its data in memory. Restarting it resets teams to `db.js`.

## Features

- **Pokédex** (`/pokedex`): sortable stat columns, name search (debounced), type filter,
  10/25/50 rows per page, coloured type badges. Clicking a row opens a slide-in panel with
  details, abilities and a radar chart of the six base stats that animates between Pokémon.
- **Teams** (`/teams`): team list with total base stats and type distribution per team,
  delete with rollback, selected team remembered across reloads.
- **New team** (`/teams/new`): reactive form with a unique-name async validator, a typeahead
  picker and removable chips (1 to 6 Pokémon). New teams appear in the list immediately.

Every view that loads async data handles loading (skeletons with fixed sizes), empty,
error (message plus Retry) and success.

## Architecture
src/app/
├── common/ shared components (skeleton, empty/error state, type badge), cache service,
│ utils (retry, GraphQL response helper, dates), global constants, SCSS tokens
├── core/ logger service
├── pokedex/ models, constants, API service, state/ (store + selectors), table, detail
│ panel, radar chart, list page
└── teams/ models, constants, API service, state/ (store), validators, team card,
picker, list page, form page


**State.** Each store is a `BehaviorSubject` holding one state object, with an `asObservable()`
stream and small, documented methods that patch it. Selectors are derived streams
(`combineLatest` + `map` + `distinctUntilChanged`); the filtered and sorted streams use
`shareReplay` because several consumers read them. Components bridge streams into signals with
`toSignal()` and use `computed()` for view-only values (team stats, pagination flags).

**Pokémon loading.** Sorting, filtering and paging are client-side, so the store loads all
default-form Pokémon in chunks of 200 and stays in `loading` until the last chunk arrives
(otherwise sorting a half-loaded list would be misleading). The finished list is cached in
`localStorage` for one hour.

**Optimistic updates.** `TeamStore.createTeam` inserts a temporary team immediately, swaps it for
the server copy on success, and removes only that entry on failure while setting an error message.
Deletes restore the team to its old position. Both are wrapped in `defer`, so nothing changes
until the returned observable is subscribed to.

**Errors.** GraphQL returns HTTP 200 with an `errors` array on failure, so a helper turns that
into a thrown error. Calls use a 30 s timeout and retry with a growing delay. The create-team
mutation is not retried, to avoid duplicates after a lost response.

## Decisions and deviations

- **PokéAPI endpoint changed.** The endpoint in the task (`beta.pokeapi.co/graphql/v1beta`) was
  retired in November 2026 and now answers 401. I use its successor,
  `https://graphql.pokeapi.co/v1beta2`, where the `pokemon_v2_` prefix is dropped from names
  (`pokemon_v2_pokemon` became `pokemon`, and so on). The queries return the same data.
- **Rate limit.** The new endpoint allows 100 calls per hour per IP and asks clients to cache.
  Hence the one-hour list cache, in-memory caching of ability lookups, and a picker that
  searches the cached list instead of calling the API for every keystroke.
- **Single-Pokémon query.** `getPokemonById$` exists in the API service, but the detail panel
  uses the stats already in the cache plus the abilities query, to save requests.
- **Default forms only.** The list query filters `is_default`, so alternate forms (ids above
  10000) are not shown.
- **No authentication.** New teams belong to a fixed trainer (id 1). Name uniqueness is checked
  against all teams, case-insensitively.
- **`createTeam` has no `id` argument** on this mock server; ids are assigned by the server, so
  optimistic teams use a temporary id.
- **ECharts** is registered with the Pokédex route (only the radar pieces), not in the root
  config, to keep the initial bundle small.

## Tests

Vitest specs cover: the team store (optimistic create, rollback on failure, delete rollback),
the Pokémon selectors (filter, sort, debounced search), the team-name and team-size validators,
the cache service (expiry, corrupt entries) and the retry operator. Specs that touch
`localStorage` stub it, because the Node test runtime does not provide one.

## What I would improve with more time

- Server-side or virtual-scrolled pagination instead of loading the whole list.
- Component tests for the picker, detail panel and form, and an end-to-end test.
- Keyboard navigation (arrow keys) in the picker dropdown and a slide-out animation for the panel.
- Toasts instead of the inline error banner, and an edit-team flow.
- Environment-based API URLs, and a proxy or backend for production.
- Abort in-flight chunk requests when the Pokédex page is left.