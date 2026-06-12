/* ============================================================
 * VIM DOJO — curriculum (8 belt tracks)
 * Every drill ships with a reference solution (`sol`).
 * `par` is derived from the solution's token count, and the
 * test suite replays every solution through the engine to
 * guarantee each drill is solvable at par.
 *
 * Drill types:
 *   cursor — checkpoint race: visit `stops` in order
 *   match  — keystroke golf: make the buffer equal `target`
 * ============================================================ */
(function () {
  'use strict';

  // "ciwfoo<Esc>" -> ['c','i','w','f','o','o','<Esc>']
  function parseKeys(s) {
    var tokens = [];
    var i = 0;
    var SPECIAL = /^<(Esc|CR|BS|Tab|C-[a-z])>/;
    while (i < s.length) {
      var m = SPECIAL.exec(s.slice(i));
      if (s[i] === '<' && m) {
        tokens.push(m[0]);
        i += m[0].length;
      } else {
        tokens.push(s[i]);
        i++;
      }
    }
    return tokens;
  }

  function drill(o) {
    o.par = parseKeys(o.sol).length;
    if (o.variants) {
      o.variants.forEach(function (v) { v.par = parseKeys(v.sol).length; });
    }
    return o;
  }

  var BELTS = [
    { id: 'white',  name: 'White Belt',  color: '#f2f2f2' },
    { id: 'yellow', name: 'Yellow Belt', color: '#ffd84d' },
    { id: 'orange', name: 'Orange Belt', color: '#ff9a3d' },
    { id: 'green',  name: 'Green Belt',  color: '#5dff7f' },
    { id: 'blue',   name: 'Blue Belt',   color: '#3db9ff' },
    { id: 'purple', name: 'Purple Belt', color: '#b06bff' },
    { id: 'brown',  name: 'Brown Belt',  color: '#c98a5a' },
    { id: 'black',  name: 'Black Belt',  color: '#1a1a1a' }
  ];

  var TRACKS = [

    /* ============ TRACK 1 — WHITE BELT ============ */
    {
      id: 't1', belt: 'white', title: 'THE FIRST STEPS',
      subtitle: 'Motion is the foundation of everything.',
      instructor: 'byte',
      lesson: {
        intro: 'Welcome to the Neon Dojo. I am BYTE, keeper of the first forms. ' +
          'First, the rite every initiate fears: getting IN — and OUT — of the ' +
          'editor. Millions have entered vim and never found the door again; ' +
          'you will not be one of them. Then you learn to MOVE. The arrow keys ' +
          'are forbidden here — your hands never leave home row.',
        techniques: [
          { keys: 'vim file.txt', desc: 'open a file in vim, from the shell' },
          { keys: ':w  :q  :wq', desc: 'write / quit / write-and-quit' },
          { keys: ':q!', desc: 'get out NOW, discarding changes — the famous one' },
          { keys: 'ZZ', desc: 'save and quit without touching :' },
          { keys: 'h j k l', desc: 'left, down, up, right — the four winds' },
          { keys: '5j 12l', desc: 'prefix any motion with a count to repeat it' },
          { keys: '0  ^  $', desc: 'line start / first character / line end' },
          { keys: 'gg  G  8G', desc: 'first line / last line / line 8' }
        ]
      },
      drills: [
        drill({
          id: 't1d0a', name: 'The Door In, The Door Out', type: 'match',
          brief: 'Open the scroll from the shell with vim, look around, leave with :q.',
          keys: 'vim file  :q',
          shell: true,
          file: 'notes.txt',
          requireExit: true,
          start: [
            'the dojo door stands open',
            'step through — then find your way back out'
          ],
          target: [
            'the dojo door stands open',
            'step through — then find your way back out'
          ],
          sol: 'vim notes.txt<CR>:q<CR>'
        }),
        drill({
          id: 't1d0b', name: 'Sign the Ledger', type: 'match',
          brief: 'Add your line, then :wq — write AND quit, the honest exit.',
          keys: 'o :wq',
          file: 'ledger.txt',
          requireExit: true,
          start: ['the visitors log:'],
          target: ['the visitors log:', 'student was here'],
          sol: 'ostudent was here<Esc>:wq<CR>'
        }),
        drill({
          id: 't1d0c', name: 'No Witnesses', type: 'match',
          brief: 'You were not supposed to touch this scroll. Make your mark anyway — then erase all evidence with :q!',
          keys: 'i :q!',
          file: 'ancient.txt',
          requireExit: true,
          start: ['do not touch this scroll', 'it is ancient and brittle'],
          target: ['do not touch this scroll', 'it is ancient and brittle'],
          sol: 'ioops<Esc>:q!<CR>'
        }),
        drill({
          id: 't1d1', name: 'The Walk', type: 'cursor',
          brief: 'Touch every checkpoint using only h, j, k and l.',
          keys: 'h j k l',
          start: [
            'Step softly through the grid.',
            'Each motion is a single key.',
            'The dojo watches every move.',
            'Hold nothing. Travel light.'
          ],
          stops: [[1, 5], [3, 5], [2, 2], [0, 2]],
          sol: 'jllllljjkhhhkk',
          variants: [{
            start: [
              'walk the second path now',
              'each turn is deliberate',
              'the floor hums underfoot',
              'arrive exactly on the mark'
            ],
            stops: [[2, 4], [3, 0], [1, 2], [0, 0]],
            sol: 'jjlllljhhhhkkllkhh'
          }]
        }),
        drill({
          id: 't1d2', name: 'Counted Strides', type: 'cursor',
          brief: 'One keypress per step is for beginners. Use counts: 5j, 19l.',
          keys: '5j 19l 4k 15h',
          start: [
            'the long corridor stretches east',
            'neon signs flicker in sequence',
            'councils of code convene below',
            'silent servers hum their hymns',
            'a stairwell descends into dark',
            'the vault waits at the very end',
            'patience is a kind of speed',
            'arrive without a wasted step'
          ],
          stops: [[5, 0], [5, 19], [1, 19], [1, 4]],
          sol: '5j19l4k15h',
          variants: [{
            start: [
              'the western wing lies quiet',
              'dust settles on old consoles',
              'a printer dreams of paper',
              'cables sleep beneath the tiles',
              'the archive breathes slowly',
              'someone left a terminal on',
              'its cursor blinks for no one',
              'go and put it to rest'
            ],
            stops: [[6, 0], [6, 15], [2, 15], [2, 3]],
            sol: '6j15l4k12h'
          }]
        }),
        drill({
          id: 't1d3', name: 'Edge to Edge', type: 'cursor',
          brief: 'Snap to the edges of each line: 0, ^ and $.',
          keys: '0 ^ $',
          start: [
            "const dojo = 'neon';",
            "  let belt = 'white';",
            '  return belt.length;',
            '}'
          ],
          stops: [[0, 19], [1, 2], [2, 20], [3, 0]],
          sol: '$j^j$j'
        }),
        drill({
          id: 't1d4', name: 'Vertical Mastery', type: 'cursor',
          brief: 'Teleport across the whole file: gg, G, and 8G for line 8.',
          keys: 'gg G 8G',
          start: [
            'floor 01: the entrance hall',
            'floor 02: the echo chamber',
            'floor 03: the archives',
            'floor 04: the listening room',
            'floor 05: the proving grounds',
            'floor 06: the quiet servers',
            'floor 07: the long stairwell',
            'floor 08: the hidden library',
            'floor 09: the signal tower',
            'floor 10: the cold vault',
            'floor 11: the last corridor',
            'floor 12: the masters hall'
          ],
          cursor: [5, 0],
          stops: [[11, 0], [0, 0], [7, 0]],
          sol: 'Ggg8G'
        }),
        drill({
          id: 't1d5', name: 'The Long March', type: 'cursor',
          brief: 'A ten-floor descent. Big counted strides only.',
          keys: 'counts hjkl',
          start: [
            'the hall stretches ten floors down',
            'every step echoes twice',
            'count your strides, student',
            'the lift is broken on purpose',
            'patience lives in the legs',
            'breathe between the floors',
            'neon drips from the ceiling',
            'almost there, keep counting',
            'one more flight remains',
            'the vault door waits below'
          ],
          stops: [[9, 0], [9, 24], [4, 12], [0, 6]],
          sol: '9j24l5k12h4k6h'
        }),
        drill({
          id: 't1d6', name: 'Zigzag Descent', type: 'cursor',
          brief: 'Corners and edges in one run: G, $, 0, gg.',
          keys: 'G gg 0 $ counts',
          start: [
            'start at the top edge here',
            'slide down the rail',
            'mark the middle line',
            'gravity does the rest',
            'catch yourself in time',
            'land softly at the base'
          ],
          stops: [[5, 0], [5, 22], [2, 0], [0, 25]],
          sol: 'G$3k0gg$'
        })
      ],
      duel: {
        id: 't1duel', name: 'SPARRING: FIRST FORMS', opponent: 'byte',
        intro: 'A light spar, student. Show me your footwork — nothing more.',
        winText: 'Good. Your feet know the grid now. The White Belt is yours.',
        loseText: 'Your footwork wavers. Breathe, reset, try again.',
        rounds: [
          drill({
            id: 't1duel-r1', name: 'Footwork', type: 'cursor',
            brief: 'Checkpoints, counted strides.', keys: 'counts + hjkl',
            start: [
              'byte spins up the practice grid',
              'watch the cursor glide',
              'no wasted keys allowed',
              'show me your footwork'
            ],
            stops: [[3, 0], [3, 8], [1, 8]],
            sol: '3j8l2k'
          }),
          drill({
            id: 't1duel-r2', name: 'Edges', type: 'cursor',
            brief: 'Corners of the file.', keys: 'gg G 0 $',
            start: [
              'alpha line ends here.',
              'the middle is quiet',
              'omega line starts here'
            ],
            cursor: [1, 0],
            stops: [[0, 0], [0, 20], [2, 0], [2, 21]],
            sol: 'gg$G$'
          }),
          drill({
            id: 't1duel-r3', name: 'Full Glide', type: 'cursor',
            brief: 'Everything at once.', keys: 'counts gg',
            start: [
              'round three begins now',
              'keep breathing slowly',
              'precision over panic',
              'the grid hums beneath',
              'almost at the bottom',
              'byte nods with respect'
            ],
            stops: [[5, 0], [5, 13], [0, 0], [2, 0]],
            sol: '5j13lgg2j'
          })
        ]
      }
    },

    /* ============ TRACK 2 — YELLOW BELT ============ */
    {
      id: 't2', belt: 'yellow', title: 'WORD TRAVEL',
      subtitle: 'Why walk in characters when you can leap in words?',
      instructor: 'blade',
      lesson: {
        intro: 'I am BLADE. BYTE taught you to walk; I will teach you to dash. ' +
          'A master never presses l fifteen times. We move by words, ' +
          'we strike at single characters, we vault between blocks.',
        techniques: [
          { keys: 'w b e', desc: 'next word / back a word / end of word' },
          { keys: 'f) t)', desc: 'jump onto ) — or to just before it' },
          { keys: 'F( T(', desc: 'the same strikes, but backwards' },
          { keys: ';  ,', desc: 'repeat the last f/t strike — forward or back' },
          { keys: '{ } %', desc: 'leap by paragraph; bounce between brackets' }
        ]
      },
      drills: [
        drill({
          id: 't2d1', name: 'Word Hopping', type: 'cursor',
          brief: 'Leap between words with w, b and e.',
          keys: 'w b e',
          start: ['neon blades cut through silent code'],
          stops: [[0, 12], [0, 22], [0, 31], [0, 16]],
          sol: 'wwwewwbb'
        }),
        drill({
          id: 't2d2', name: 'Find the Mark', type: 'cursor',
          brief: 'Strike exact characters with f and t, repeat with ;',
          keys: 'f t ;',
          start: ['data.map(item => item.value).filter(Boolean);'],
          stops: [[0, 4], [0, 21], [0, 28], [0, 35], [0, 43]],
          sol: 'f.;;f(t;'
        }),
        drill({
          id: 't2d3', name: 'Backward Glance', type: 'cursor',
          brief: 'F strikes behind you. , reverses your last strike.',
          keys: 'F ; ,',
          start: ['the.quick.brown.fox.jumps'],
          cursor: [0, 24],
          stops: [[0, 19], [0, 15], [0, 9], [0, 15]],
          sol: 'F.;;,'
        }),
        drill({
          id: 't2d4', name: 'Blocks & Breaks', type: 'cursor',
          brief: 'Vault whole paragraphs with { and }. Bounce across brackets with %.',
          keys: '{ } %',
          start: [
            'function setup() {',
            '  const arena = [1, 2];',
            '}',
            '',
            'function duel(a, b) {',
            '  return a - b;',
            '}'
          ],
          stops: [[3, 0], [6, 0], [4, 20], [3, 0], [0, 0]],
          sol: '}}%{{'
        }),
        drill({
          id: 't2d5', name: 'Word Weave', type: 'cursor',
          brief: 'Mix your word motions: ends with e, starts with w, back with b.',
          keys: 'w e b counts',
          start: ['speed and silence shape the strike'],
          stops: [[0, 4], [0, 18], [0, 22], [0, 10]],
          sol: 'e3we2b'
        }),
        drill({
          id: 't2d6', name: 'Precision Strikes', type: 'cursor',
          brief: 'Chain f with ; and finish with a bracket bounce.',
          keys: 'f ; %',
          start: ['fn(map(filter(data)))'],
          stops: [[0, 2], [0, 6], [0, 13], [0, 18]],
          sol: 'f(;;%'
        })
      ],
      duel: {
        id: 't2duel', name: 'SPARRING: BLADE DASH', opponent: 'blade',
        intro: 'Footwork bores me. Show me you can MOVE. Words, strikes, vaults — go.',
        winText: 'Hm. Fast enough... for now. Take the Yellow Belt.',
        loseText: 'Too slow. The cursor should arrive before the thought finishes.',
        rounds: [
          drill({
            id: 't2duel-r1', name: 'Word Dash', type: 'cursor',
            brief: 'Words, counted.', keys: 'w e counts',
            start: [
              'blade tests your word jumps now',
              'speed is born from stillness'
            ],
            stops: [[0, 17], [0, 22], [1, 0], [1, 9]],
            sol: '3ww2w2w'
          }),
          drill({
            id: 't2duel-r2', name: 'Strike Chain', type: 'cursor',
            brief: 'f, then ride ; to the end.', keys: 'f ; F',
            start: ['strike(fast).strike(true).strike(now)'],
            stops: [[0, 6], [0, 19], [0, 32], [0, 25]],
            sol: 'f(;;F.'
          }),
          drill({
            id: 't2duel-r3', name: 'Vault', type: 'cursor',
            brief: 'Brackets and breaks.', keys: '% f {',
            start: [
              'while (true) {',
              '  train();',
              '}',
              '',
              'spar();'
            ],
            stops: [[0, 11], [0, 13], [2, 0], [3, 0]],
            sol: '%f{%}'
          })
        ]
      }
    },

    /* ============ TRACK 3 — ORANGE BELT ============ */
    {
      id: 't3', belt: 'orange', title: 'THE EDITING ARTS',
      subtitle: 'Now your keystrokes leave marks.',
      instructor: 'byte',
      lesson: {
        intro: 'Movement was rehearsal. Today you change the buffer itself. ' +
          'Insert mode is a room you step into and OUT of — Escape is the door, ' +
          'and masters never linger inside. If you make a mess, u undoes it ' +
          'and Ctrl-r redoes it.',
        techniques: [
          { keys: 'x  X', desc: 'delete the character under / before the cursor' },
          { keys: 'i  a', desc: 'insert before / after the cursor' },
          { keys: 'I  A', desc: 'insert at line start / line end' },
          { keys: 'o  O', desc: 'open a new line below / above' },
          { keys: 'r  ~', desc: 'replace one character / flip its case' },
          { keys: 'u  Ctrl-r', desc: 'undo / redo — your safety net' },
          { keys: 'Ctrl-[  Ctrl-P', desc: 'escape without leaving home row — a master\'s habit' }
        ]
      },
      drills: [
        drill({
          id: 't3d1', name: 'Surgical Removal', type: 'match',
          brief: 'Delete exactly the doubled characters with x. Nothing else.',
          keys: 'x',
          start: ['thee dojo opens at dawnn', 'cclean code is kind code'],
          target: ['the dojo opens at dawn', 'clean code is kind code'],
          sol: '3lx$xj0x',
          variants: [{
            start: ['foox bar bazz', 'qquick fix'],
            target: ['foo bar baz', 'quick fix'],
            sol: '3lx$xj0x'
          }]
        }),
        drill({
          id: 't3d2', name: 'Insertion Points', type: 'match',
          brief: 'Step into insert mode with i (before) and a (after) — then step out.',
          keys: 'i a <Esc>',
          start: ['The qick brwn fox'],
          target: ['The quick brown fox'],
          sol: 'fiiu<Esc>frao<Esc>'
        }),
        drill({
          id: 't3d3', name: 'Line Surgeon', type: 'match',
          brief: 'A appends at line end, O opens above, o opens below.',
          keys: 'A o O',
          start: ['let speed = 10', 'let power = 20'],
          target: ['// dojo stats', 'let speed = 10;', 'let power = 20;', 'done'],
          sol: 'O// dojo stats<Esc>jA;<Esc>jA;<Esc>odone<Esc>'
        }),
        drill({
          id: 't3d4', name: 'Character Swap', type: 'match',
          brief: 'r replaces a single character. ~ flips its case.',
          keys: 'r ~ ;',
          start: ['vim_dojo_rocks', 'case matters here'],
          target: ['vim-dojo-rocks', 'Case Matters Here'],
          sol: 'f_r-;r-j0~w~w~'
        }),
        drill({
          id: 't3d5', name: 'Open Lines', type: 'match',
          brief: 'O opens a line above, o opens below — build around the middle.',
          keys: 'O o <Esc>',
          start: ['second line'],
          target: ['first line', 'second line', 'third line'],
          sol: 'Ofirst line<Esc>jothird line<Esc>'
        }),
        drill({
          id: 't3d6', name: 'Replace Run', type: 'match',
          brief: 'One r fixes a letter. Four ~ raise a word to shouting.',
          keys: 'r ~ f',
          start: ['mistmke in the middle', 'fix the case here'],
          target: ['mistake in the middle', 'fix the CASE here'],
          sol: 'fmrajfc~~~~'
        })
      ],
      duel: {
        id: 't3duel', name: 'SPARRING: FIRST CUTS', opponent: 'byte',
        intro: 'The buffer is a sparring partner now. Strike precisely — every keystroke is scored.',
        winText: 'Clean cuts, no hesitation. The Orange Belt is yours.',
        loseText: 'Sloppy edits cost you. Sharpen your strikes and return.',
        rounds: [
          drill({
            id: 't3duel-r1', name: 'Typo Strike', type: 'match',
            brief: 'Kill the doubles.', keys: 'x $',
            start: ['fixx the small bugg'],
            target: ['fix the small bug'],
            sol: '3lx$x'
          }),
          drill({
            id: 't3duel-r2', name: 'Append Chain', type: 'match',
            brief: 'Semicolons at every line end.', keys: 'A j',
            start: ['learn the forms', 'practice daily'],
            target: ['learn the forms;', 'practice daily;'],
            sol: 'A;<Esc>jA;<Esc>'
          }),
          drill({
            id: 't3duel-r3', name: 'Case Closed', type: 'match',
            brief: 'Two flips, two keys.', keys: '~',
            start: ['bYte checks form'],
            target: ['Byte checks form'],
            sol: '~~'
          })
        ]
      }
    },

    /* ============ TRACK 4 — GREEN BELT ============ */
    {
      id: 't4', belt: 'green', title: 'OPERATOR DISCIPLINE',
      subtitle: 'Verb plus motion: the grammar of power.',
      instructor: 'byte',
      lesson: {
        intro: 'Here is the secret at the heart of vim: it is a LANGUAGE. ' +
          'd is a verb — delete. w is a noun — a word. dw is a sentence. ' +
          'Once you speak in sentences, you stop pressing keys and start ' +
          'declaring intentions.',
        techniques: [
          { keys: 'dw  dd  D', desc: 'delete a word / a line / to line end' },
          { keys: 'cw  cc  C', desc: 'change: delete, then drop into insert' },
          { keys: 'yy  p  P', desc: 'yank a line, put it below / above' },
          { keys: 'J', desc: 'join the next line onto this one' },
          { keys: 'd2w  3dd', desc: 'counts multiply operators too' }
        ]
      },
      drills: [
        drill({
          id: 't4d1', name: 'Word Deletion', type: 'match',
          brief: 'dw eats a word, dd eats a line, D eats to the end.',
          keys: 'dw dd D',
          start: [
            'the the neon grid hums',
            'delete this whole line',
            'keep this line intact junk'
          ],
          target: ['the neon grid hums', 'keep this line intact'],
          sol: 'dwjddtjD',
          variants: [{
            start: [
              'zap zap the relay hums',
              'remove this entire row',
              'trim the tail end off now'
            ],
            target: ['zap the relay hums', 'trim the tail end off'],
            sol: 'dwjddtn;D'
          }]
        }),
        drill({
          id: 't4d2', name: 'Change It', type: 'match',
          brief: 'c deletes and drops you into insert — one motion, one rewrite.',
          keys: 'cw C',
          start: ['let mode = "slow";', 'speed is everything'],
          target: ['let mode = "fast";', 'speed wins duels'],
          sol: 'fscwfast<Esc>j0wCwins duels<Esc>'
        }),
        drill({
          id: 't4d3', name: 'Yank & Put', type: 'match',
          brief: 'yy copies a line; p drops it below the cursor.',
          keys: 'yy p',
          start: ['defend();', 'attack();'],
          target: ['defend();', 'attack();', 'attack();', 'defend();'],
          sol: 'jyypggyyGp'
        }),
        drill({
          id: 't4d4', name: 'Join & Trim', type: 'match',
          brief: 'J pulls the next line up. D trims the tail.',
          keys: 'J D t',
          start: ['const msg =', '  "hello dojo";', 'trailing junk here %%'],
          target: ['const msg = "hello dojo";', 'trailing junk here'],
          sol: 'Jjt%D'
        }),
        drill({
          id: 't4d5', name: 'Count the Cuts', type: 'match',
          brief: 'Counts multiply operators: d3w eats three words, 3dd eats three lines.',
          keys: 'd3w 3dd',
          start: [
            'cut these two words now',
            'drop one',
            'drop two',
            'drop three',
            'keep this'
          ],
          target: ['cut now', 'keep this'],
          sol: 'wd3wj3dd'
        }),
        drill({
          id: 't4d6', name: 'Putting Order', type: 'match',
          brief: 'Yank and put, line by line, keeping the order intact.',
          keys: 'yy p',
          start: ['one duplicate me', 'two duplicate me'],
          target: [
            'one duplicate me',
            'one duplicate me',
            'two duplicate me',
            'two duplicate me'
          ],
          sol: 'yypjyyp'
        })
      ],
      duel: {
        id: 't4duel', name: 'SPARRING: THE GRAMMAR', opponent: 'byte',
        intro: 'Speak the language. Verb, motion, done. I will count every syllable.',
        winText: 'You speak vim now. Wear the Green Belt.',
        loseText: 'You stuttered. A sentence, not a spelling bee. Again.',
        rounds: [
          drill({
            id: 't4duel-r1', name: 'Eat Words', type: 'match',
            brief: 'One dw, one dd.', keys: 'dw dd',
            start: [
              'very very good form',
              'drop this line fully',
              'keep the last line'
            ],
            target: ['very good form', 'keep the last line'],
            sol: 'dwjdd'
          }),
          drill({
            id: 't4duel-r2', name: 'Rewrite', type: 'match',
            brief: 'Change one word cleanly.', keys: 'cw',
            start: ['mode: sloppy'],
            target: ['mode: sharp'],
            sol: '2wcwsharp<Esc>'
          }),
          drill({
            id: 't4duel-r3', name: 'Echo', type: 'match',
            brief: 'Duplicate the line.', keys: 'yy p',
            start: ['echo();'],
            target: ['echo();', 'echo();'],
            sol: 'yyp'
          })
        ]
      }
    },

    /* ============ TRACK 5 — BLUE BELT ============ */
    {
      id: 't5', belt: 'blue', title: 'INNER FORMS',
      subtitle: 'Strike the inside of things.',
      instructor: 'blade',
      lesson: {
        intro: 'BYTE taught you verbs and motions. I teach you TARGETS. ' +
          'Text objects let you strike the inside of a word, a string, a bracket — ' +
          'from anywhere within it. ci" does not care where the cursor stands. ' +
          'It knows what you mean.',
        techniques: [
          { keys: 'ciw  diw', desc: 'change / delete the word you are standing in' },
          { keys: 'daw', desc: 'delete a word AND the space that follows it' },
          { keys: 'ci"  di"', desc: 'change / delete inside the quotes' },
          { keys: 'ci(  di(  da(', desc: 'inside the parens — or the parens too' },
          { keys: 'ci{  di{', desc: 'the same, for braces' }
        ]
      },
      drills: [
        drill({
          id: 't5d1', name: 'Inner Word', type: 'match',
          brief: 'ciw rewrites the word under the cursor; daw removes word + space.',
          keys: 'ciw daw',
          start: ['the wrong word stands here', 'remove extra extra words'],
          target: ['the right word stands here', 'remove extra words'],
          sol: 'wciwright<Esc>j02wdaw',
          variants: [{
            start: ['a bad word sits here', 'strip extra extra fluff'],
            target: ['a good word sits here', 'strip extra fluff'],
            sol: 'wciwgood<Esc>j02wdaw'
          }]
        }),
        drill({
          id: 't5d2', name: 'Quoted Strings', type: 'match',
          brief: 'ci" and di" strike inside quotes — from anywhere on the line.',
          keys: 'ci" di"',
          start: ['greet = "wrong message"', 'name = "DELETE_ME"'],
          target: ['greet = "hello dojo"', 'name = ""'],
          sol: 'ci"hello dojo<Esc>jdi"'
        }),
        drill({
          id: 't5d3', name: 'Bracket Bodies', type: 'match',
          brief: 'Strike inside parens and braces with ci( and di{.',
          keys: 'ci( di{ di(',
          start: [
            'attack(old_target);',
            'config = { stale: true };',
            'log(debug_info);'
          ],
          target: ['attack(byte);', 'config = {};', 'log();'],
          sol: 'f(ci(byte<Esc>jdi{jdi('
        }),
        drill({
          id: 't5d4', name: 'Refactor Kata', type: 'match',
          brief: 'A real refactor: rename the argument everywhere it appears.',
          keys: 'ci( ci" ciw',
          start: ['fn run(speed) {', '  move("slow", speed);', '}'],
          target: ['fn run(velocity) {', '  move("fast", velocity);', '}'],
          sol: 'f(ci(velocity<Esc>j0ci"fast<Esc>fsciwvelocity<Esc>'
        }),
        drill({
          id: 't5d5', name: 'Around & About', type: 'match',
          brief: 'da( and da" take the wrapper too. Sweep the leftover space with x.',
          keys: 'da( da" x',
          start: ['del (this) part', 'say "bye" now'],
          target: ['del part', 'say now'],
          sol: 'f(da(xjda"x'
        }),
        drill({
          id: 't5d6', name: 'Deep Strike', type: 'match',
          brief: 'Nested parens: 2f( dives to the inner pair before the strike.',
          keys: '2f( ci(',
          start: ['call(outer(inner));'],
          target: ['call(outer(byte));'],
          sol: '2f(ci(byte<Esc>'
        })
      ],
      duel: {
        id: 't5duel', name: 'SPARRING: INNER EYE', opponent: 'blade',
        intro: 'Stop aiming at characters. Aim at MEANING. Strike the inside.',
        winText: 'You see the shapes inside the text now. Blue Belt. Keep it.',
        loseText: 'You aimed at letters. Aim at the object. Again.',
        rounds: [
          drill({
            id: 't5duel-r1', name: 'Word Swap', type: 'match',
            brief: 'One ciw.', keys: 'ciw',
            start: ['the wrong path'],
            target: ['the right path'],
            sol: 'wciwright<Esc>'
          }),
          drill({
            id: 't5duel-r2', name: 'Requote', type: 'match',
            brief: 'One ci" from cold start.', keys: 'ci"',
            start: ['say "goodbye"'],
            target: ['say "hello"'],
            sol: 'ci"hello<Esc>'
          }),
          drill({
            id: 't5duel-r3', name: 'Empty the Vessels', type: 'match',
            brief: 'Clear the parens, clear the braces.', keys: 'di( di{',
            start: ['call(remove_me);', 'obj = { junk };'],
            target: ['call();', 'obj = {};'],
            sol: 'f(di(jf{di{'
          })
        ]
      }
    },

    /* ============ TRACK 6 — PURPLE BELT ============ */
    {
      id: 't6', belt: 'purple', title: 'THE SEARCHING EYE',
      subtitle: 'Why move when you can simply arrive?',
      instructor: 'shell',
      lesson: {
        intro: "They call me SHELL. I watch everything on this grid, and now you will too. " +
          'Search is not navigation — it is teleportation. Name the thing, ' +
          'press Enter, and you are there. n carries you to the next sighting.',
        techniques: [
          { keys: '/ghost Enter', desc: 'jump forward to the next "ghost"' },
          { keys: '?ghost Enter', desc: 'the same hunt, but backwards' },
          { keys: 'n  N', desc: 'next match / previous match' },
          { keys: 'dt)  df)', desc: 'delete until ) — excluding or including it' },
          { keys: '/find + edit', desc: 'search, strike, repeat: the hunting loop' }
        ]
      },
      drills: [
        drill({
          id: 't6d1', name: 'Seek', type: 'cursor',
          brief: 'Hunt the word "ghost" through the file with / and n.',
          keys: '/ n',
          start: [
            'the grid hides a ghost in the wires',
            'every system has its secrets',
            'a ghost moved through sector seven',
            'nobody saw the logs change',
            'the last ghost waits at the gate'
          ],
          stops: [[0, 17], [2, 2], [4, 9]],
          sol: '/ghost<CR>nn'
        }),
        drill({
          id: 't6d2', name: 'Seek Backward', type: 'cursor',
          brief: 'The trail runs upstream: hunt with ? and n.',
          keys: '? n',
          start: [
            'byte signals flicker upstream',
            'the byte trail runs cold here',
            'static fills the channel',
            'one byte slips past the filter',
            'scanners sweep the empty floor'
          ],
          cursor: [4, 0],
          stops: [[3, 4], [1, 4], [0, 0]],
          sol: '?byte<CR>nn'
        }),
        drill({
          id: 't6d3', name: 'Delete Till', type: 'match',
          brief: 'dt stops before the target; d2f cuts through the second one.',
          keys: 'dt df',
          start: ['price: units100', 'label::value'],
          target: ['price: 100', 'value'],
          sol: 'fudt1j0d2f:'
        }),
        drill({
          id: 't6d4', name: 'Search & Strike', type: 'match',
          brief: 'Hunt every BROKEN and rewrite it. /, ciw, n — the hunting loop.',
          keys: '/ n ciw',
          start: [
            'status = "BROKEN"',
            'retry the BROKEN link',
            'mark BROKEN nodes'
          ],
          target: [
            'status = "FIXED"',
            'retry the FIXED link',
            'mark FIXED nodes'
          ],
          sol: '/BROKEN<CR>ciwFIXED<Esc>nciwFIXED<Esc>nciwFIXED<Esc>',
          variants: [{
            start: ['flag = "ERROR"', 'retry on ERROR state', 'clear ERROR list'],
            target: ['flag = "OK"', 'retry on OK state', 'clear OK list'],
            sol: '/ERROR<CR>ciwOK<Esc>nciwOK<Esc>nciwOK<Esc>'
          }]
        }),
        drill({
          id: 't6d5', name: 'Triangulate', type: 'cursor',
          brief: 'Hunt forward with n, double back with N.',
          keys: '/ n N',
          start: [
            'node one sleeps in the dark',
            'the wire hums quietly',
            'a node wakes at midnight',
            'static crawls the floor',
            'last node guards the gate'
          ],
          stops: [[2, 2], [4, 5], [0, 0], [4, 5]],
          sol: '/node<CR>nnN'
        }),
        drill({
          id: 't6d6', name: 'Cut to the Chase', type: 'match',
          brief: 'df] cuts through the bracket; dt stops just short of its mark.',
          keys: 'df dt',
          start: ['log: [debug] message ok', 'skip__to__value'],
          target: ['log: message ok', 'value'],
          sol: 'f[df]xj0dtv'
        })
      ],
      duel: {
        id: 't6duel', name: "THE WATCHER'S TEST", opponent: 'shell',
        intro: "I've watched every student who ever trained here. The fast ones never chase — they summon. Show me.",
        winText: 'Heh. You found everything I hid. Purple Belt — you earned it.',
        loseText: 'You wandered. The grid eats wanderers. Hunt with intent.',
        rounds: [
          drill({
            id: 't6duel-r1', name: 'Signal Hunt', type: 'cursor',
            brief: 'Three signals. Find them all.', keys: '/ n',
            start: [
              'signal lost in the static',
              'signal found in the noise',
              'no more signal here'
            ],
            stops: [[1, 0], [2, 8], [0, 0]],
            sol: '/signal<CR>nn'
          }),
          drill({
            id: 't6duel-r2', name: 'Clean Cut', type: 'match',
            brief: 'One dt strike.', keys: 'dt',
            start: ['temp_old_value = 99'],
            target: ['value = 99'],
            sol: 'dtv'
          }),
          drill({
            id: 't6duel-r3', name: 'Patch Job', type: 'match',
            brief: 'Hunt and rewrite both glitches.', keys: '/ n ciw',
            start: ['one GLITCH here', 'two GLITCH there'],
            target: ['one PATCH here', 'two PATCH there'],
            sol: '/GLITCH<CR>ciwPATCH<Esc>nciwPATCH<Esc>'
          })
        ]
      }
    },

    /* ============ TRACK 7 — BROWN BELT ============ */
    {
      id: 't7', belt: 'brown', title: 'VISUAL FLOW',
      subtitle: 'See the cut before you make it.',
      instructor: 'blade',
      lesson: {
        intro: 'Sometimes you must SEE the blade\'s path before committing. ' +
          'Visual mode paints your target: stretch the selection with any motion ' +
          'you know, then strike once. V selects whole lines. ' +
          'And > bends entire blocks to your will.',
        techniques: [
          { keys: 'v + motion', desc: 'paint a selection character by character' },
          { keys: 'V', desc: 'paint whole lines' },
          { keys: 'd  c  y  ~', desc: 'strike the selection: cut, change, copy, flip case' },
          { keys: '>>  <<', desc: 'indent / outdent a line' },
          { keys: 'Vj>', desc: 'select lines, then shift the whole block' }
        ]
      },
      drills: [
        drill({
          id: 't7d1', name: 'Select & Strike', type: 'match',
          brief: 'Paint exactly the bracketed clutter, then cut once.',
          keys: 'v f d',
          start: ['cut [exactly this] from the line'],
          target: ['cut from the line'],
          sol: 'f[vf]ld'
        }),
        drill({
          id: 't7d2', name: 'Line Harvest', type: 'match',
          brief: 'V grabs whole lines. Stretch with j, then cut.',
          keys: 'V j d',
          start: ['keep one', 'drop a', 'drop b', 'keep two'],
          target: ['keep one', 'keep two'],
          sol: 'jVjd'
        }),
        drill({
          id: 't7d3', name: 'Shift the Block', type: 'match',
          brief: 'Select the body lines and indent them in one stroke.',
          keys: 'V j >',
          start: ['if (ready) {', 'fight();', 'defend();', '}'],
          target: ['if (ready) {', '  fight();', '  defend();', '}'],
          sol: 'jVj>'
        }),
        drill({
          id: 't7d4', name: 'Loud & Clear', type: 'match',
          brief: 'Paint two words, flip their case with one ~.',
          keys: 'v e ~',
          start: ['make this header loud'],
          target: ['make THIS HEADER loud'],
          sol: 'wvee~'
        }),
        drill({
          id: 't7d5', name: 'Paint & Replace', type: 'match',
          brief: 'Paint two words, then c changes the whole selection at once.',
          keys: 'v e c',
          start: ['the old broken way'],
          target: ['the new way'],
          sol: 'wveecnew<Esc>'
        }),
        drill({
          id: 't7d6', name: 'Outdent Discipline', type: 'match',
          brief: 'The block drifted right. Pull it back with V and <.',
          keys: 'V j <',
          start: ['    over indented', '    lines here', 'normal line'],
          target: ['  over indented', '  lines here', 'normal line'],
          sol: 'Vj<'
        })
      ],
      duel: {
        id: 't7duel', name: "BLADE'S GAUNTLET", opponent: 'blade',
        intro: 'Last lesson before the summit. Paint your cuts. Waste nothing.',
        winText: 'Your selections land like shadows. Brown Belt. One climb remains.',
        loseText: 'You painted too much — or too little. The blade must match the target.',
        rounds: [
          drill({
            id: 't7duel-r1', name: 'Excision', type: 'match',
            brief: 'Cut the bracketed weight.', keys: 'v f d',
            start: ['slice [out this] segment'],
            target: ['slice segment'],
            sol: 'f[vf]ld'
          }),
          drill({
            id: 't7duel-r2', name: 'One Shift', type: 'match',
            brief: 'Indent the body.', keys: '>>',
            start: ['config {', 'retry: true', '}'],
            target: ['config {', '  retry: true', '}'],
            sol: 'j>>'
          }),
          drill({
            id: 't7duel-r3', name: 'War Cry', type: 'match',
            brief: 'The last word, loud.', keys: 'v e ~',
            start: ['whisper becomes a roar'],
            target: ['whisper becomes a ROAR'],
            sol: '3wve~'
          })
        ]
      }
    },

    /* ============ TRACK 8 — BLACK BELT ============ */
    {
      id: 't8', belt: 'black', title: 'THE DOT AND THE WAY',
      subtitle: 'Do it once. Let the dot do the rest.',
      instructor: 'byte',
      lesson: {
        intro: 'One key remains, and it is the deepest: the dot. ' +
          '. repeats your last change — the whole change, anywhere. ' +
          'Combine it with the hunting loop and you become inevitable: ' +
          '/target, strike once, then n.n.n. until nothing is left to fix. ' +
          'Master this, and you have mastered the way.',
        techniques: [
          { keys: '.', desc: 'repeat the last change, exactly, at the cursor' },
          { keys: 'x then .', desc: 'every delete becomes reusable' },
          { keys: 'ciw…Esc then .', desc: 'every rewrite becomes a stamp' },
          { keys: '/find  ciw  n .', desc: 'the master loop: hunt, strike, repeat' },
          { keys: 'qa … q', desc: 'record your keystrokes into register a' },
          { keys: '@a  @@', desc: 'replay the recording / repeat the last replay' }
        ]
      },
      drills: [
        drill({
          id: 't8d1', name: 'The Dot', type: 'match',
          brief: 'Strike once with x, repeat with dot. Same for dd.',
          keys: 'x . dd',
          start: [
            'xxremove the doubled marks',
            'kill line one',
            'kill line two',
            'keep the finale'
          ],
          target: ['remove the doubled marks', 'keep the finale'],
          sol: 'x.jdd.'
        }),
        drill({
          id: 't8d2', name: 'Hunt & Stamp', type: 'match',
          brief: 'The master loop: /BROKEN, fix it once, then n. n. n.',
          keys: '/ ciw n .',
          start: [
            'alpha BROKEN one',
            'beta BROKEN two',
            'gamma BROKEN three',
            'delta BROKEN four'
          ],
          target: [
            'alpha FIXED one',
            'beta FIXED two',
            'gamma FIXED three',
            'delta FIXED four'
          ],
          sol: '/BROKEN<CR>ciwFIXED<Esc>n.n.n.'
        }),
        drill({
          id: 't8d3', name: "Master's Medley", type: 'match',
          brief: 'Everything you know, in one buffer. Choose your strikes.',
          keys: 'all of it',
          start: [
            'const lvl = "BRONZE";',
            'attack(old);',
            'attack(old);',
            'attack(old);',
            '    messy indent line'
          ],
          target: [
            'const lvl = "GOLD";',
            'attack(byte);',
            'attack(byte);',
            'attack(byte);',
            'messy indent line'
          ],
          sol: 'ci"GOLD<Esc>/old<CR>ciwbyte<Esc>n.n.j0dw'
        }),
        drill({
          id: 't8d4', name: 'Stamp of Approval', type: 'match',
          brief: 'One A appends a semicolon — the dot stamps the rest.',
          keys: 'A . j',
          start: ['item one', 'item two', 'item three'],
          target: ['item one;', 'item two;', 'item three;'],
          sol: 'A;<Esc>j.j.'
        }),
        drill({
          id: 't8d5', name: 'The Full Way', type: 'match',
          brief: 'Hunt, strike once, repeat — across quotes and prose alike.',
          keys: '/ ciw n .',
          start: [
            'rank = "novice";',
            'praise the novice well',
            'the novice bows'
          ],
          target: [
            'rank = "master";',
            'praise the master well',
            'the master bows'
          ],
          sol: '/novice<CR>ciwmaster<Esc>n.n.'
        }),
        drill({
          id: 't8d6', name: 'The Recorded Form', type: 'match',
          brief: 'The dot repeats one change. A macro repeats a whole SEQUENCE: record with qa, stop with q, replay with @a and @@.',
          keys: 'qa q @a @@',
          start: ['item alpha', 'item beta', 'item gamma', 'item delta'],
          target: ['- item alpha;', '- item beta;', '- item gamma;', '- item delta;'],
          sol: 'qaI- <Esc>A;<Esc>jq@a@@@@'
        }),
        drill({
          id: 't8d7', name: 'Assembly Line', type: 'match',
          brief: 'One recorded form, applied down the manifest. Start the recording with 0 so it lands the same on every line.',
          keys: 'qa 0 d f D @a',
          start: [
            'order: ZZZ-001 [ship]',
            'order: ZZZ-002 [ship]',
            'order: ZZZ-003 [ship]'
          ],
          target: ['ZZZ-001', 'ZZZ-002', 'ZZZ-003'],
          sol: 'qa0d2wf Djq@a@@'
        })
      ],
      duel: {
        id: 't8duel', name: 'CHAMPIONSHIP: BYTE UNBOUND', opponent: 'byte-angry',
        intro: 'No more teaching. No more mercy. I am the final wall, student. BREAK THROUGH.',
        winText: 'MAGNIFICENT. You did not defeat me — you graduated past me.',
        loseText: 'The wall stands. Catch your breath, then come back swinging.',
        rounds: [
          drill({
            id: 't8duel-r1', name: 'Power Surge', type: 'match',
            brief: 'Three rewrites. One should be typed by hand.', keys: 'ci" j .',
            start: ['power = "LOW";', 'power = "LOW";', 'power = "LOW";'],
            target: ['power = "MAX";', 'power = "MAX";', 'power = "MAX";'],
            sol: 'ci"MAX<Esc>j.j.'
          }),
          drill({
            id: 't8duel-r2', name: 'Counterform', type: 'match',
            brief: 'Inside the parens, then flip the warning.', keys: 'ci( v ~',
            start: ['byte.attack(weak);', 'defend now or fall'],
            target: ['byte.attack(strong);', 'defend NOW or fall'],
            sol: 'f(ci(strong<Esc>jFnve~'
          }),
          drill({
            id: 't8duel-r3', name: 'The Core', type: 'match',
            brief: 'Shields up, then strike the core.', keys: 'ci( . v ~',
            start: ['shield(up);', 'shield(up);', 'strike at the core'],
            target: ['shield(max);', 'shield(max);', 'strike at the CORE'],
            sol: 'f(ci(max<Esc>j.jfcve~'
          })
        ]
      },
      finalDuel: {
        id: 't8final', name: 'GRANDMASTER: BLADE ETERNAL', opponent: 'blade',
        intro: 'BYTE fell. I will not. Every form you learned came from my blade. Take the Black Belt — if you can.',
        winText: 'It is done. The student stands where the masters stood. The Neon Dojo is yours.',
        loseText: 'So close to the summit. Rest. Then take the final step.',
        rounds: [
          drill({
            id: 't8final-r1', name: 'Shadow Step', type: 'match',
            brief: 'Strip the marks. The dot is faster than the hand.', keys: '2x j .',
            start: [
              'xxblade moves first',
              'xxyou counter fast',
              'xxthe crowd holds breath'
            ],
            target: [
              'blade moves first',
              'you counter fast',
              'the crowd holds breath'
            ],
            sol: '2xj.j.'
          }),
          drill({
            id: 't8final-r2', name: 'Blinding Speed', type: 'match',
            brief: 'Three strings. One rewrite, two stamps.', keys: 'ci" 0 .',
            start: [
              'speed("slow", 1);',
              'speed("slow", 2);',
              'speed("slow", 3);'
            ],
            target: [
              'speed("blinding", 1);',
              'speed("blinding", 2);',
              'speed("blinding", 3);'
            ],
            sol: 'ci"blinding<Esc>j0.j0.'
          }),
          drill({
            id: 't8final-r3', name: 'The Last Form', type: 'match',
            brief: 'Hunt, mend, bow. Everything ends here.', keys: '/ ciw . cw',
            start: [
              'the duel ends here',
              'honor the BROKEN code',
              'honor the BROKEN code',
              'bow to your master'
            ],
            target: [
              'the duel ends here',
              'honor the MENDED code',
              'honor the MENDED code',
              'bow before your master'
            ],
            sol: '/BROKEN<CR>ciwMENDED<Esc>n.j0wcwbefore<Esc>'
          })
        ]
      }
    }
  ];

  var CURRICULUM = { TRACKS: TRACKS, BELTS: BELTS, parseKeys: parseKeys };

  if (typeof module !== 'undefined' && module.exports) module.exports = CURRICULUM;
  if (typeof window !== 'undefined') window.CURRICULUM = CURRICULUM;
})();
