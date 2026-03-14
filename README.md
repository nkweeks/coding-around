# Coding Around Portfolio

A modern, dark-mode-first development portfolio built with React + Vite.

## Features

- Smooth multi-layer parallax motion with reduced-motion fallback
- Custom "Coding Around" logo and branded visual system
- Project lanes for web apps, automation/AI, tooling, and experimental work
- Embedded local-project routes for VIM Protocol and HPD Arrest Log Viewer
- Responsive layout tuned for desktop and mobile
- Ready for static hosting on AWS Amplify

## Local development

```bash
npm install
npm run dev
```

Use Node 22 locally (matches Amplify):

```bash
nvm use
```

## Pre-deploy validation

```bash
npm run sync:projects
npm run check:deploy
npm run preview
```

## Syncing Local Projects

### VIM Protocol

`VIM Protocol` lives in `/Users/nathanielweeks/Documents/claude_code_projects/hacking_game` and is treated as the source of truth.

Pull the latest source into this repo with:

```bash
npm run sync:vim-protocol
```

This sync command:

- refreshes `public/vim-protocol` from the source project
- regenerates `src/vimProtocolShell.js` for the `/vim-protocol` app route
- keeps the deploy-safe image paths needed for Amplify hosting

### HPD Arrest Log Viewer

`HPD Arrest Log Viewer` lives in `/Users/nathanielweeks/Documents/codex_projects/hpd_arrest_log_viewer` and is treated as the source of truth.

Pull the latest source snapshot into this repo with:

```bash
npm run sync:hpd-arrest-log
```

This sync command:

- runs the source project's export script using its local Python environment when available
- writes the latest static data snapshot to `public/hpd-arrest-log/snapshot.json`
- powers the portfolio route `/hpd-arrest-log` without trying to host the Flask runtime on Amplify

If both local projects changed, use:

```bash
npm run sync:projects
```

## Deploy on AWS Amplify

1. Create a new Amplify app and connect this repo.
2. Amplify will use `amplify.yml` in the repo root:
   - Node runtime: `22` (via `nvm install 22 && nvm use 22`)
   - install: `npm ci`
   - build: `npm run check:deploy`
   - publish directory: `dist`
3. For SPA routing, add this rewrite in Amplify:
   - source: `</^[^.]+$|\\.(?!(css|gif|html|ico|jpeg|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp)$)([^.]+$)/>`
   - target: `/index.html`
   - type: `200 (Rewrite)`
   - This avoids rewriting static assets (`.js`, `.css`, images, fonts, static HTML pages, JSON snapshots) to HTML.
4. Trigger a build from Amplify and confirm:
   - build logs show Node 22
   - artifacts are uploaded from `dist`
   - deep-link URLs load without 404

## Customize content

Edit these arrays in `src/App.jsx`:

- `projectTracks`
- `styleSpectrum`
- `milestones`

You can swap the contact links and logo asset in:

- `src/App.jsx`
- `public/coding-around-mark.svg`
