# Portfolio Workflow

## Source Of Truth Projects

- Do not treat generated portfolio copies as the primary editing location.
- VIM Protocol source of truth:
  - `/Users/nathanielweeks/Documents/claude_code_projects/hacking_game`
- HPD Arrest Log Viewer source of truth:
  - `/Users/nathanielweeks/Documents/codex_projects/hpd_arrest_log_viewer`

## Required Workflow

1. Make project changes in the source project first.
2. Sync those changes into this portfolio repo:
   - `cd /Users/nathanielweeks/Documents/codex_projects/portfolio`
   - `npm run sync:vim-protocol` for VIM Protocol changes
   - `npm run sync:hpd-arrest-log` for HPD Arrest Log Viewer changes
   - `npm run sync:projects` before deploy if either local project changed
3. Validate before deploy:
   - `npm run check:deploy`
4. Push this portfolio repo to deploy the hosted copies.

## Notes

- `npm run sync:vim-protocol` refreshes `public/vim-protocol` and regenerates `src/vimProtocolShell.js`.
- `npm run sync:hpd-arrest-log` exports the latest static snapshot to `public/hpd-arrest-log/snapshot.json`.
- The HPD portfolio page is a static snapshot. Flask actions remain local to the source project.
- If there is any mismatch between a source project and this repo, sync from the source project first.
