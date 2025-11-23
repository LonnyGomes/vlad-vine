# Repository Guidelines

## Project Structure & Module Organization
BulbutinNg is an Angular 20 workspace under `apps/bulbutin-ng`. UI code lives in `src/app`, with feature folders such as `home`, `map`, `image-card-feed`, and shared layers (`services`, `models`, `pipes`). Application-wide styles live in `src/styles.scss` and `src/theme.scss`; component styles stay alongside their TypeScript. Static assets, redirects, and the root HTML shell reside in `public/` and `src/index.html`. Environment-specific configs are under `src/environments`, while build utilities and setup hooks sit in `scripts/`.

## Build, Test, and Development Commands
- `npm start`: Runs `ng serve` with the development environment and live reload at `http://localhost:4200`.
- `npm run build`: Invokes `scripts/build.js`, injecting `MAPBOX_ACCESS_TOKEN` and outputting to `dist/`.
- `npm run build:dev`: Creates an optimized dev bundle without the custom injector.
- `npm run watch`: Continuous rebuild useful for CI preview environments.
- `npm run test`: Executes Karma + Jasmine unit tests via `ng test`.
Use `npm run ng -- generate component hero-card` for schematics when you need scaffolding.

## Coding Style & Naming Conventions
Use Prettier defaults from `package.json` (100-column width, single quotes) and keep TypeScript/HTML indented with two spaces. Name components, directives, and pipes with dashed selectors (`image-card-feed`) and suffix classes with `Component`, `Service`, or `Pipe`. Observable streams end with `$`. Global styles stay in SCSS; prefer CSS variables defined in `theme.scss`. Run Prettier before sending a PR.

## Testing Guidelines
Co-locate `*.spec.ts` files with their component/service and keep descriptions aligned with behavior. Mock Mapbox interactions to avoid network calls. Aim to preserve existing coverage; add regression tests when touching `image-card-feed`, `map`, or shared services. Run `npm run test -- --code-coverage` locally if you introduce riskier changes.

## Commit & Pull Request Guidelines
Follow the existing Conventional Commits style (`feat(ng): ...`, `fix(ng): ...`). Write focused commits with descriptive scopes (`map`, `image-card`). Pull requests should summarize intent, list test evidence, and attach UI screenshots for visual tweaks. Link relevant issues and mention any environment steps (e.g., required tokens) in the PR body.

## Security & Configuration Notes
Configure your local Mapbox token by following `ENVIRONMENT_SETUP.md` and keep `src/environments/environment.local.ts` uncommitted; the setup script already marks it skip-worktree. Never hard-code access tokens or Netlify secrets—pass them via env vars (`MAPBOX_ACCESS_TOKEN`) when running builds or CI.
