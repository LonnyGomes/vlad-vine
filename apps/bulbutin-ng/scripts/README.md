# Scripts

## build.js

Custom Node.js build script that injects environment variables into the production build.

**What it does:**
- Reads `MAPBOX_ACCESS_TOKEN` from environment variables
- Temporarily modifies `angular.json` to add the token to Angular's `define` configuration
- Runs `ng build` to create the production bundle
- Restores `angular.json` to its original state

**Usage:**
```bash
# Production build with environment variable
MAPBOX_ACCESS_TOKEN="pk.your-token" npm run build

# On Netlify (automatic - token comes from Netlify environment variables)
npm run build
```

**Why this is needed:**
Browser JavaScript doesn't have access to `process.env` like Node.js does. Angular's `define` option lets us replace constants at build time, but it requires literal values. This script evaluates `process.env.MAPBOX_ACCESS_TOKEN` in Node.js and injects the actual string value into the build.

## setup-env.sh

Post-install script that automatically configures git to ignore local changes to `environment.local.ts`.

**What it does:**
- Runs automatically after `npm install`
- Applies `git update-index --skip-worktree` to `src/environments/environment.local.ts`
- Allows developers to add their Mapbox tokens without risk of committing them

**When it runs:**
- Automatically via npm's `postinstall` hook
- Can be run manually: `./scripts/setup-env.sh`

**Why this is needed:**
The `environment.local.ts` file must exist in the repository for Netlify builds (TypeScript needs to compile it), but each developer needs to add their own Mapbox token locally. The `--skip-worktree` flag tells git to ignore local changes to this file, preventing accidental commits of API tokens.
