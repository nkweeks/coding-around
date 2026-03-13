# Portfolio Workflow

## VIM Protocol Source Of Truth

- Do not treat `public/vim-protocol` as the primary editing location.
- The source of truth for VIM Protocol is:
  - `/Users/nathanielweeks/Documents/claude_code_projects/hacking_game`

## Required Workflow

1. Make VIM Protocol changes in:
   - `/Users/nathanielweeks/Documents/claude_code_projects/hacking_game`
2. Sync those changes into this portfolio repo:
   - `cd /Users/nathanielweeks/Documents/codex_projects/portfolio`
   - `npm run sync:vim-protocol`
3. Validate before deploy:
   - `npm run check:deploy`
4. Push this portfolio repo to deploy the updated hosted copy.

## Notes

- `npm run sync:vim-protocol` regenerates `src/vimProtocolShell.js` and refreshes `public/vim-protocol`.
- Keep VIM Protocol image references compatible with the hosted copy.
- If there is any mismatch between `hacking_game` and `public/vim-protocol`, sync from `hacking_game` first.
