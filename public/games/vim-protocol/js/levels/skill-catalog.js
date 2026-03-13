// Skill Catalog - Complete reference of all vim commands taught in the game
// learnedAt: level id (0-indexed) when the command is first introduced
const SKILL_CATALOG = [

  // ── Navigation ──────────────────────────────────────────────────────────
  { command: 'h',      description: 'Move cursor left',             category: 'Navigation',   learnedAt: 0 },
  { command: 'j',      description: 'Move cursor down',             category: 'Navigation',   learnedAt: 0 },
  { command: 'k',      description: 'Move cursor up',               category: 'Navigation',   learnedAt: 0 },
  { command: 'l',      description: 'Move cursor right',            category: 'Navigation',   learnedAt: 0 },

  // ── Word Navigation ──────────────────────────────────────────────────────
  { command: 'w',      description: 'Jump to start of next word',   category: 'Word Navigation', learnedAt: 1 },
  { command: 'b',      description: 'Jump back to start of word',   category: 'Word Navigation', learnedAt: 1 },
  { command: 'e',      description: 'Jump to end of word',          category: 'Word Navigation', learnedAt: 1 },

  // ── Line & File Navigation ───────────────────────────────────────────────
  { command: '0',      description: 'Jump to start of line',        category: 'Line Navigation', learnedAt: 2 },
  { command: '^',      description: 'Jump to first non-blank character', category: 'Line Navigation', learnedAt: 2 },
  { command: '$',      description: 'Jump to end of line',          category: 'Line Navigation', learnedAt: 2 },
  { command: 'gg',     description: 'Jump to first line of file',   category: 'Line Navigation', learnedAt: 2 },
  { command: 'G',      description: 'Jump to last line of file',    category: 'Line Navigation', learnedAt: 2 },
  { command: '{n}j',   description: 'Move n lines down  (e.g. 5j)', category: 'Line Navigation', learnedAt: 13 },
  { command: '{n}k',   description: 'Move n lines up    (e.g. 3k)', category: 'Line Navigation', learnedAt: 13 },
  { command: '{n}G',   description: 'Jump to line n     (e.g. 6G)', category: 'Line Navigation', learnedAt: 13 },

  // ── Character Find ───────────────────────────────────────────────────────
  { command: 'f{c}',   description: 'Find character c forward on line',      category: 'Character Find', learnedAt: 3 },
  { command: 'F{c}',   description: 'Find character c backward on line',     category: 'Character Find', learnedAt: 3 },
  { command: 't{c}',   description: 'Move to just before character c',       category: 'Character Find', learnedAt: 3 },
  { command: 'T{c}',   description: 'Move to just after character c (back)', category: 'Character Find', learnedAt: 3 },
  { command: ';',      description: 'Repeat last f/F/t/T in same direction', category: 'Character Find', learnedAt: 12 },

  // ── Brackets ─────────────────────────────────────────────────────────────
  { command: '%',      description: 'Jump to matching bracket or brace',     category: 'Brackets', learnedAt: 18 },

  // ── Delete ───────────────────────────────────────────────────────────────
  { command: 'x',      description: 'Delete character under cursor',         category: 'Delete', learnedAt: 5 },
  { command: 'X',      description: 'Delete character before cursor',        category: 'Delete', learnedAt: 5 },
  { command: 'dw',     description: 'Delete from cursor to next word',       category: 'Delete', learnedAt: 5 },
  { command: 'dd',     description: 'Delete (cut) entire line',              category: 'Delete', learnedAt: 5 },
  { command: 'D',      description: 'Delete from cursor to end of line',     category: 'Delete', learnedAt: 5 },

  // ── Insert Mode ──────────────────────────────────────────────────────────
  { command: 'i',      description: 'Insert before cursor',                  category: 'Insert', learnedAt: 6 },
  { command: 'I',      description: 'Insert at start of line',               category: 'Insert', learnedAt: 6 },
  { command: 'a',      description: 'Append after cursor',                   category: 'Insert', learnedAt: 6 },
  { command: 'A',      description: 'Append at end of line',                 category: 'Insert', learnedAt: 6 },
  { command: 'o',      description: 'Open new line below and insert',        category: 'Insert', learnedAt: 6 },
  { command: 'O',      description: 'Open new line above and insert',        category: 'Insert', learnedAt: 6 },
  { command: 'Esc',    description: 'Return to NORMAL mode',                 category: 'Insert', learnedAt: 6 },

  // ── Change ───────────────────────────────────────────────────────────────
  { command: 'r{c}',   description: 'Replace character under cursor with c', category: 'Change', learnedAt: 7 },
  { command: 's',      description: 'Delete character and enter INSERT',     category: 'Change', learnedAt: 7 },
  { command: 'cw',     description: 'Change word (delete + enter INSERT)',   category: 'Change', learnedAt: 7 },
  { command: 'cc',     description: 'Change entire line',                    category: 'Change', learnedAt: 7 },
  { command: 'C',      description: 'Change from cursor to end of line',     category: 'Change', learnedAt: 7 },

  // ── Yank & Paste ─────────────────────────────────────────────────────────
  { command: 'yy',     description: 'Yank (copy) entire line',               category: 'Yank & Paste', learnedAt: 8 },
  { command: 'yw',     description: 'Yank word',                             category: 'Yank & Paste', learnedAt: 8 },
  { command: 'y$',     description: 'Yank from cursor to end of line',       category: 'Yank & Paste', learnedAt: 8 },
  { command: 'p',      description: 'Paste after cursor / below line',       category: 'Yank & Paste', learnedAt: 8 },
  { command: 'P',      description: 'Paste before cursor / above line',      category: 'Yank & Paste', learnedAt: 8 },

  // ── Undo & Redo ──────────────────────────────────────────────────────────
  { command: 'u',      description: 'Undo last change',                      category: 'Undo & Redo', learnedAt: 9 },
  { command: 'Ctrl-r', description: 'Redo last undone change',               category: 'Undo & Redo', learnedAt: 10 },

  // ── Visual Mode ──────────────────────────────────────────────────────────
  { command: 'v',      description: 'Enter VISUAL mode (character select)',  category: 'Visual Mode', learnedAt: 11 },
  { command: 'V',      description: 'Enter VISUAL LINE mode (full lines)',   category: 'Visual Mode', learnedAt: 11 },

  // ── Text Objects ─────────────────────────────────────────────────────────
  { command: 'ciw',    description: 'Change inner word',                     category: 'Text Objects', learnedAt: 15 },
  { command: 'diw',    description: 'Delete inner word',                     category: 'Text Objects', learnedAt: 15 },
  { command: 'daw',    description: 'Delete a word (includes surrounding space)', category: 'Text Objects', learnedAt: 15 },
  { command: 'ci"',    description: 'Change inside double quotes',           category: 'Text Objects', learnedAt: 15 },
  { command: "ci'",    description: 'Change inside single quotes',           category: 'Text Objects', learnedAt: 15 },
  { command: 'ci(',    description: 'Change inside parentheses',             category: 'Text Objects', learnedAt: 15 },
  { command: 'di"',    description: 'Delete inside double quotes',           category: 'Text Objects', learnedAt: 15 },
  { command: 'di(',    description: 'Delete inside parentheses',             category: 'Text Objects', learnedAt: 16 },

  // ── Line Operations ───────────────────────────────────────────────────────
  { command: 'J',      description: 'Join current line with line below',     category: 'Line Ops', learnedAt: 17 },
  { command: '>>',     description: 'Indent current line right',             category: 'Line Ops', learnedAt: 17 },
  { command: '<<',     description: 'Indent current line left',              category: 'Line Ops', learnedAt: 17 },

];

// Return all skills unlocked at or before a given level id
function getUnlockedSkills(levelId) {
  return SKILL_CATALOG.filter(s => s.learnedAt <= levelId);
}

// Return skills introduced in a specific level
function getSkillsForLevel(levelId) {
  return SKILL_CATALOG.filter(s => s.learnedAt === levelId);
}

// Return unique categories in catalog order
function getCategories() {
  const seen = new Set();
  return SKILL_CATALOG
    .map(s => s.category)
    .filter(c => { if (seen.has(c)) return false; seen.add(c); return true; });
}
