# Coding Around Portfolio

A modern, dark-mode-first development portfolio built with React + Vite.

## Features

- Smooth multi-layer parallax motion with reduced-motion fallback
- Custom "Coding Around" logo and branded visual system
- Project lanes for web apps, automation/AI, tooling, and experimental work
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
npm run check:deploy
npm run preview
```

## Deploy on AWS Amplify

1. Create a new Amplify app and connect this repo.
2. Amplify will use `amplify.yml` in the repo root:
   - Node runtime: `22` (via `nvm install 22 && nvm use 22`)
   - install: `npm ci`
   - build: `npm run check:deploy`
   - publish directory: `dist`
3. For SPA routing, add a rewrite in Amplify (Hosting > Rewrites and redirects):
   - source: `/<*>`
   - target: `/index.html`
   - type: `200 (Rewrite)`
4. Trigger a build from Amplify and confirm:
   - build logs show Node 22
   - artifacts are uploaded from `dist`
   - deep-link URL loads without 404

## Customize content

Edit these arrays in `src/App.jsx`:

- `projectTracks`
- `styleSpectrum`
- `milestones`

You can swap the contact links and logo asset in:

- `src/App.jsx`
- `public/coding-around-mark.svg`
