// Level Data - All 20 level definitions with branching story content
// Operation Blackout - A vim learning adventure
// Two story paths: Trust BYTE (the Robot) or Trust BLADE (the Ninja)

const LEVELS = [
  // ============================================
  // ACT 1: INITIATION (Levels 1-5)
  // Both BYTE and BLADE are allies. No branching yet.
  // ============================================

  // LEVEL 1: Basic Navigation - h, j, k, l
  {
    id: 0,
    title: "OPERATION: FIRST CONTACT",
    difficulty: "beginner",
    commandsFocus: ['h', 'j', 'k', 'l'],
    par: 8,
    story: {
      character: 'zero',
      image: '/vim-protocol/images/robot_happy.jpg',
      briefing: "Welcome to the grid, recruit. I'm ZERO, founder of this crew. You've been selected for Operation Blackout - taking down NEXUS Corporation's surveillance network. First, meet BYTE, our AI analysis unit.",
      context: "Your keyboard is your weapon. h moves left, j moves down, k moves up, l moves right. Forget the mouse - that's for amateurs.",
      completion: "Not bad, newbie. BYTE's already crunching the numbers on your performance.",
      preDialog: [
        { character: 'zero', lines: ["Listen carefully. In the digital underground, we don't use mice.", "The keys h, j, k, l are your new best friends.", "Think of it like this: j looks like a down arrow, k kicks up."] },
        { character: 'byte', lines: ["Greetings, recruit! I'm BYTE, the crew's AI construct.", "I've analyzed 2,847 training scenarios. Your optimal success path starts with h, j, k, l.", "I calculate a 73.2% chance you'll master this on the first try!"], image: '/vim-protocol/images/robot_happy.jpg' }
      ],
      postDialog: [
        { character: 'byte', lines: ["Excellent! Your keystroke accuracy is above the 80th percentile!", "I've updated your competency matrix. This is very promising data!"] }
      ]
    },
    initialBuffer: [
      "// NEXUS_INTERCEPT_001.log",
      ">> System breach detected",
      ">> Navigate to the TARGET marker below",
      ">> [TARGET] Access point alpha",
      ">> Use j to descend, k to ascend",
      ">> Lateral movement: h (left) l (right)",
      ">> [CHECKPOINT] You found it!",
      ">> Return to base confirmed",
      "Mission status: AWAITING AGENT"
    ],
    objectives: [
      {
        id: "nav_down",
        description: "Press 'j' twice to move down to line 3",
        hint: "The 'j' key moves your cursor down one line. Press it twice!",
        teachingPoint: "j moves DOWN because j has a descender that points down",
        validator: (vimState) => vimState.cursor.line === 2,
        onComplete: { character: 'byte', line: "Movement detected! Trajectory optimal!" }
      },
      {
        id: "nav_to_target",
        description: "Navigate down to the [TARGET] line (line 4)",
        hint: "Keep pressing j to move down to line 4.",
        validator: (vimState) => vimState.cursor.line === 3,
        onComplete: { character: 'zero', line: "Target acquired. Keep moving." }
      },
      {
        id: "nav_checkpoint",
        description: "Continue to the [CHECKPOINT] on line 7",
        hint: "Press j three more times to reach the checkpoint.",
        validator: (vimState) => vimState.cursor.line === 6,
        onComplete: { character: 'blade', line: "Checkpoint reached. Smooth movement." }
      },
      {
        id: "nav_up",
        description: "Use 'k' to move back UP to line 5",
        hint: "The 'k' key moves your cursor up. Press it twice.",
        teachingPoint: "k KICKS the cursor UP",
        validator: (vimState) => vimState.cursor.line === 4,
        onComplete: { character: 'shell', line: "...Acceptable. At least you're not using arrow keys." }
      }
    ]
  },

  // LEVEL 2: Word Navigation
  {
    id: 1,
    title: "OPERATION: WORD RUNNER",
    difficulty: "beginner",
    commandsFocus: ['w', 'b', 'e'],
    par: 15,
    story: {
      character: 'blade',
      image: '/vim-protocol/images/ninja.jpg',
      briefing: "I am BLADE. The crew's shadow operative. Words are targets. w strikes forward to the next word. b retreats. e reaches the word's end. Speed is survival.",
      context: "NEXUS transmissions contain keywords we must locate. Move through words with precision - every keystroke must count.",
      completion: "Swift. You move through words like a blade through silk.",
      preDialog: [
        { character: 'blade', lines: ["In the shadows, every movement must be precise.", "w leaps to the next word. b falls back. e strikes the word's end.", "A ninja does not crawl letter by letter. A ninja flies."], image: '/vim-protocol/images/ninja.jpg' }
      ],
      postDialog: [
        { character: 'blade', lines: ["You have potential. Quick reflexes.", "NEXUS won't see you coming."], image: '/vim-protocol/images/ninja.jpg' }
      ]
    },
    initialBuffer: [
      "// INTERCEPTED_TRANSMISSION.txt",
      "Agent codename: SHADOW reporting in",
      "Priority keywords: ACCESS BREACH NEXUS",
      "Target identified: SURVEILLANCE node active",
      "Warning: System MONITOR detected intrusion",
      "Recommendation: EVACUATE all operatives now",
      "Status: CRITICAL - immediate action required"
    ],
    objectives: [
      {
        id: "word_forward",
        description: "Use 'w' to jump forward to 'codename' on line 2",
        hint: "Press w to jump word by word. Stop when cursor is on 'codename'.",
        validator: (vimState) => {
          if (vimState.cursor.line !== 1) return false;
          const line = vimState.lines[1].join('');
          return line.substring(vimState.cursor.col, vimState.cursor.col + 8) === 'codename';
        },
        onComplete: { character: 'blade', line: "Target acquired. Continue." }
      },
      {
        id: "word_to_shadow",
        description: "Continue with 'w' to reach 'SHADOW'",
        hint: "Keep pressing w to jump through words until you land on SHADOW.",
        validator: (vimState) => {
          if (vimState.cursor.line !== 1) return false;
          const line = vimState.lines[1].join('');
          return line.substring(vimState.cursor.col, vimState.cursor.col + 6) === 'SHADOW';
        }
      },
      {
        id: "word_to_nexus",
        description: "Jump forward to find 'NEXUS' on line 3",
        hint: "Keep pressing w. Cross lines to find NEXUS.",
        validator: (vimState) => {
          if (vimState.cursor.line !== 2) return false;
          const line = vimState.lines[2].join('');
          return line.substring(vimState.cursor.col, vimState.cursor.col + 5) === 'NEXUS';
        },
        onComplete: { character: 'zero', line: "NEXUS... our true enemy. You'll learn more soon." }
      },
      {
        id: "word_backward",
        description: "Use 'b' to jump BACKWARD to 'BREACH'",
        hint: "Press b to move back word by word until you reach BREACH.",
        validator: (vimState) => {
          if (vimState.cursor.line !== 2) return false;
          const line = vimState.lines[2].join('');
          return line.substring(vimState.cursor.col, vimState.cursor.col + 6) === 'BREACH';
        },
        onComplete: { character: 'byte', line: "Reverse traversal confirmed! Pattern matching at 98% accuracy!" }
      }
    ]
  },

  // LEVEL 3: Line Navigation
  {
    id: 2,
    title: "OPERATION: LINE HOPPER",
    difficulty: "beginner",
    commandsFocus: ['0', '$', '^', 'gg', 'G'],
    par: 7,
    story: {
      character: 'zero',
      briefing: "Time for precision strikes. 0 teleports to line start. $ warps to line end. gg beams to file start. G jumps to file end. Master these, and no code can hide from you.",
      context: "We've intercepted a NEXUS database. Scan from top to bottom - check every line boundary for hidden data.",
      completion: "Clean execution. You're starting to move like one of us.",
      postDialog: [
        { character: 'shell', lines: ["Top to bottom in seconds. Not bad for a rookie.", "When I started, we had to memorize every buffer offset by hand."] }
      ]
    },
    initialBuffer: [
      "[NEXUS_DATABASE_SCAN]",
      ">>START_MARKER<< Begin scan here",
      "Record_001: [ENCRYPTED] user_data_block",
      "Record_002: [CLEARTEXT] public_access_ok",
      "Record_003: [FLAGGED] suspicious_activity_log",
      "Record_004: [ENCRYPTED] financial_records",
      "Record_005: [CRITICAL] admin_credentials",
      ">>END_MARKER<< Scan complete"
    ],
    initialCursor: { line: 4, col: 10 },
    objectives: [
      {
        id: "goto_top",
        description: "Use 'gg' to jump to the FIRST line",
        hint: "Press g twice quickly (gg) to jump to the top of the file.",
        teachingPoint: "gg = 'go go' to the top!",
        validator: (vimState) => vimState.cursor.line === 0,
        onComplete: { character: 'byte', line: "Top of file reached! Navigation efficiency: optimal!" }
      },
      {
        id: "goto_bottom",
        description: "Use 'G' (shift+g) to jump to the LAST line",
        hint: "Press Shift+G to jump to the bottom of the file.",
        validator: (vimState) => vimState.cursor.line === vimState.lineCount - 1,
        onComplete: { character: 'shell', line: "Top to bottom in two keystrokes. That's efficiency." }
      },
      {
        id: "line_end",
        description: "Press '$' to jump to the END of this line",
        hint: "Press $ (shift+4) to jump to the last character of the current line.",
        validator: (vimState) => {
          const lineLen = vimState.lines[vimState.cursor.line].length;
          return vimState.cursor.col === lineLen - 1;
        },
        onComplete: { character: 'blade', line: "End of line. Clean strike." }
      },
      {
        id: "line_start",
        description: "Press '0' to jump back to the START of the line",
        hint: "Press 0 (zero) to jump to column 0 - the very start.",
        validator: (vimState) => vimState.cursor.col === 0,
        onComplete: { character: 'zero', line: "0 for zero - the origin point." }
      },
      {
        id: "goto_line_5",
        description: "Use '5G' to jump directly to line 5",
        hint: "Press 5 then G to jump to line 5 specifically.",
        teachingPoint: "Number + G = jump to that line number",
        validator: (vimState) => vimState.cursor.line === 4,
        onComplete: { character: 'byte', line: "Line targeting confirmed! You're learning fast!" }
      }
    ]
  },

  // LEVEL 4: Character Search
  {
    id: 3,
    title: "OPERATION: TARGET LOCK",
    difficulty: "beginner",
    commandsFocus: ['f', 'F', 't', 'T'],
    par: 12,
    story: {
      character: 'blade',
      briefing: "A ninja locks onto targets with surgical precision. f finds a character forward. F finds backward. t goes TILL a character. T goes till backward. Each strike must be exact.",
      context: "Enemy code uses special markers. We need to locate parentheses, quotes, and brackets with pinpoint accuracy.",
      completion: "Precise targeting. You have the instinct of a shadow operative.",
      postDialog: [
        { character: 'zero', lines: ["That secret key you found? I've stored it in our vault.", "It's a NEXUS master authentication token. It'll be critical later."] },
        { character: 'blade', lines: ["Good find. NEXUS doesn't know we have it.", "That key could unlock everything... or be a trap."], image: '/vim-protocol/images/ninja.jpg' }
      ]
    },
    initialBuffer: [
      "// NEXUS_AUTH_MODULE.js",
      "function authenticate(user, pass) {",
      "  const hash = encrypt(pass, 'SALT_KEY');",
      "  return verify(user, hash) && log(user);",
      "}",
      "const SECRET = 'NEXUS_OVERRIDE_2024';",
      "export { authenticate, SECRET };"
    ],
    objectives: [
      {
        id: "find_paren",
        description: "On line 2, use 'f(' to find the opening parenthesis",
        hint: "Go to line 2, then press f followed by ( to jump to it.",
        teachingPoint: "f = Find character forward on current line",
        validator: (vimState) => {
          const line = vimState.lines[1].join('');
          return vimState.cursor.line === 1 && line[vimState.cursor.col] === '(';
        }
      },
      {
        id: "find_brace",
        description: "Use 'f{' to find the opening brace",
        hint: "Press f then { to jump to the brace.",
        validator: (vimState) => {
          const line = vimState.lines[1].join('');
          return vimState.cursor.line === 1 && line[vimState.cursor.col] === '{';
        },
        onComplete: { character: 'blade', line: "Brace located. Entry point found." }
      },
      {
        id: "find_quote",
        description: "On line 3, use f' to find the FIRST single quote",
        hint: "Move to line 3. If you land past the first quote, press 0 to go to line start first, then press f then '.",
        validator: (vimState) => {
          const line = vimState.lines[2].join('');
          const firstQuoteCol = line.indexOf("'");
          return vimState.cursor.line === 2 && vimState.cursor.col === firstQuoteCol;
        }
      },
      {
        id: "find_secret",
        description: "On line 6, use fS to find the 'S' in SECRET",
        hint: "Go to line 6, press f then S.",
        validator: (vimState) => {
          const line = vimState.lines[5].join('');
          return vimState.cursor.line === 5 && line[vimState.cursor.col] === 'S';
        },
        onComplete: { character: 'zero', line: "You found their secret key. We'll use this later." }
      }
    ]
  },

  // LEVEL 5: Join the Crew
  {
    id: 4,
    title: "OPERATION: ACCESS GRANTED",
    difficulty: "beginner",
    commandsFocus: ['h', 'j', 'k', 'l', 'w', 'b', '0', '$', 'gg', 'G', 'f'],
    par: 12,
    story: {
      character: 'zero',
      briefing: "Final initiation test, recruit. Combine everything you've learned. Navigate through our security system and prove you belong here. BYTE and BLADE are both watching.",
      context: "This is your entrance exam. Show us you can move through code like a shadow and think like a machine.",
      completion: "Welcome to the crew, agent. You've earned your codename. Operation Blackout begins now.",
      postDialog: [
        { character: 'zero', lines: ["You've proven yourself. Welcome to the team."] },
        { character: 'byte', lines: ["My models predicted your success! Welcome, operative! Your efficiency rating is already impressive!"], image: '/vim-protocol/images/robot_happy.jpg' },
        { character: 'shell', lines: ["Don't celebrate yet. The hard part starts now."] },
        { character: 'blade', lines: ["You move well. But the true test lies ahead. Stay sharp."], image: '/vim-protocol/images/ninja.jpg' }
      ]
    },
    initialBuffer: [
      "╔════════════════════════════════════╗",
      "║   CREW INITIATION PROTOCOL v3.1   ║",
      "╠════════════════════════════════════╣",
      "║ Agent Status: [PENDING]           ║",
      "║ Navigate to: [CHECKPOINT_ALPHA]   ║",
      "║ Then find:   [CHECKPOINT_BETA]    ║",
      "║ Finally:     [ACCESS_GRANTED]     ║",
      "╠════════════════════════════════════╣",
      "║ >> CHECKPOINT_ALPHA << marker     ║",
      "║ >> CHECKPOINT_BETA << marker      ║",
      "║ >> ACCESS_GRANTED << DESTINATION  ║",
      "╚════════════════════════════════════╝"
    ],
    initialCursor: { line: 5, col: 15 },
    objectives: [
      {
        id: "init_start",
        description: "Use 'gg' to jump to the TOP of the file",
        hint: "You're currently in the middle. Press gg (g twice) to jump to line 1.",
        validator: (vimState) => vimState.cursor.line === 0
      },
      {
        id: "checkpoint_alpha",
        description: "Navigate to CHECKPOINT_ALPHA on line 9",
        hint: "Use j to move down or 9G to jump directly to line 9.",
        validator: (vimState) => vimState.cursor.line === 8,
        onComplete: { character: 'byte', line: "Checkpoint Alpha confirmed! Data stream aligned!" }
      },
      {
        id: "find_alpha_bracket",
        description: "Use 'f<' to find the marker bracket",
        hint: "Press f then < to find the angle bracket.",
        validator: (vimState) => {
          const line = vimState.lines[8].join('');
          return vimState.cursor.line === 8 && line[vimState.cursor.col] === '<';
        }
      },
      {
        id: "checkpoint_beta",
        description: "Move down to CHECKPOINT_BETA (line 10)",
        hint: "Press j to move down one line.",
        validator: (vimState) => vimState.cursor.line === 9,
        onComplete: { character: 'shell', line: "Beta checkpoint. Almost there." }
      },
      {
        id: "final_destination",
        description: "Reach ACCESS_GRANTED on line 11",
        hint: "Press j one more time to reach the final line.",
        validator: (vimState) => vimState.cursor.line === 10,
        onComplete: { character: 'zero', line: "Access granted. You're one of us now." }
      }
    ]
  },

  // ============================================
  // ACT 2: INFILTRATION (Levels 6-12)
  // Tensions build between BYTE and BLADE
  // ============================================

  // LEVEL 6: Delete Operations
  {
    id: 5,
    title: "OPERATION: DELETE PROTOCOL",
    difficulty: "intermediate",
    commandsFocus: ['x', 'D', 'dd', 'dw'],
    par: 10,
    story: {
      character: 'blade',
      briefing: "Deletion is the ninja's art. x removes one character — a precise strike. D deletes from cursor to end of line — a clean sweep. dd eliminates an entire line. dw slices through a word. Let me show you how to destroy with purpose.",
      context: "NEXUS left traces of their surveillance code. We need to delete specific evidence before they realize we've been here.",
      completion: "That code never existed. Clean. Surgical. Perfect.",
      postDialog: [
        { character: 'blade', lines: ["Clean work. You delete like someone who understands consequences.", "Every trace removed. NEXUS will never know we were here."], image: '/vim-protocol/images/ninja.jpg' },
        { character: 'byte', lines: ["Confirmed! All surveillance artifacts purged from the codebase.", "BLADE's deletion methods are... effective. I must admit."] }
      ]
    },
    initialBuffer: [
      "NEXUS_SURVEILLANCE v2.0",
      "TRACK = trZue; // remove this",
      "LOG = true;",
      "DELETE_THIS_LINE",
      "ENCRYPT = 'AES-256';",
      "function spy() { return; }",
      "export { ENCRYPT };"
    ],
    initialCursor: { line: 1, col: 10 },
    objectives: [
      {
        id: "delete_char",
        description: "Press 'x' to delete the rogue 'Z' under the cursor",
        hint: "Your cursor is on the 'Z' in 'trZue'. Press x once to delete it and fix the typo.",
        teachingPoint: "x = delete the single character under the cursor",
        validator: (vimState) => {
          const line = vimState.lines[1].join('');
          return line.includes('true') && !line.includes('Z');
        },
        onComplete: { character: 'blade', line: "One character removed. Silent and clean." }
      },
      {
        id: "delete_to_end",
        description: "Use 'f/' to find the '/' then 'D' to delete to end of line",
        hint: "Press f then / to jump to the slash, then press Shift+D to delete everything from there to the end.",
        teachingPoint: "D = delete from cursor to end of line",
        validator: (vimState) => {
          const line = vimState.lines[1].join('');
          return !line.includes('//');
        },
        onComplete: { character: 'blade', line: "Swept clean from slash to end. Efficient." }
      },
      {
        id: "delete_line",
        description: "Navigate to the DELETE_THIS_LINE and use 'dd' to delete it",
        hint: "Use j to move down to the line that says DELETE_THIS_LINE, then press dd to delete the whole line.",
        teachingPoint: "dd = delete the entire current line",
        validator: (vimState) => {
          return !vimState.lines.some(l => l.join('').includes('DELETE_THIS_LINE'));
        },
        onComplete: { character: 'blade', line: "Entire line eliminated. No trace remains." }
      },
      {
        id: "delete_word",
        description: "Navigate to the word 'spy' and use 'dw' to delete it",
        hint: "Move to the line with 'function spy()', position cursor on 's' of 'spy', then press dw.",
        teachingPoint: "dw = delete from cursor to start of next word",
        validator: (vimState) => {
          return !vimState.lines.some(l => l.join('').includes('spy'));
        }
      }
    ]
  },

  // LEVEL 7: Insert Mode
  {
    id: 6,
    title: "OPERATION: INSERT AGENT",
    difficulty: "intermediate",
    commandsFocus: ['i', 'I', 'a', 'A', 'o', 'O'],
    par: 10,
    story: {
      character: 'byte',
      briefing: "My specialty: data injection. i inserts before cursor, a appends after, o opens new line below. These commands let us write new code into NEXUS systems. Think of it as uploading a payload.",
      context: "We're planting misinformation in NEXUS systems. Add the code snippets exactly as specified.",
      completion: "Payload inserted. NEXUS will process false data for months.",
      preDialog: [
        { character: 'byte', lines: ["Deletion is crude. Insertion is art.", "i for Insert before cursor. a for Append after.", "o Opens a new line below. O opens above.", "My neural network uses these 47,000 times per second!"] }
      ],
      postDialog: [
        { character: 'shell', lines: ["Not bad. Planting misinformation is an old trick.", "NEXUS will chase phantom data for weeks. I've done this before."] },
        { character: 'byte', lines: ["Payload integrity verified! False data streams are now active.", "NEXUS processing efficiency will drop by an estimated 34.7%!"] }
      ]
    },
    initialBuffer: [
      "// NEXUS_CONFIG.json",
      "{",
      "  \"server\": \"nexus.corp\",",
      "  \"port\": 443,",
      "  \"secure\": true",
      "}"
    ],
    objectives: [
      {
        id: "insert_mode",
        description: "Press 'i' to enter INSERT mode",
        hint: "Press i to switch from NORMAL mode to INSERT mode.",
        validator: (vimState) => vimState.mode === 'INSERT',
        onComplete: { character: 'byte', line: "INSERT mode activated. Data stream open." }
      },
      {
        id: "exit_insert",
        description: "Press 'Escape' to return to NORMAL mode",
        hint: "Press the Escape key to exit INSERT mode.",
        validator: (vimState) => vimState.mode === 'NORMAL'
      },
      {
        id: "open_below",
        description: "Use 'o' to open a new line below line 4",
        hint: "Move to line 4, then press o to open a new line below and enter INSERT mode.",
        validator: (vimState) => vimState.mode === 'INSERT' && vimState.lineCount > 6,
        onComplete: { character: 'byte', line: "New data line created! Injection successful!" }
      },
      {
        id: "exit_insert_2",
        description: "Press 'Escape' to return to NORMAL mode",
        hint: "Press Escape to exit INSERT mode before the next command.",
        validator: (vimState) => vimState.mode === 'NORMAL' && vimState.lineCount > 6
      },
      {
        id: "append_end",
        description: "Use 'A' to append at the end of line 3",
        hint: "Move to line 3 (the server line), press Shift+A to jump to line end and enter INSERT mode.",
        validator: (vimState) => {
          return vimState.mode === 'INSERT' && vimState.cursor.line === 2 &&
            vimState.cursor.col >= vimState.lines[2].length - 1;
        },
        onComplete: { character: 'shell', line: "A for Append at end. Efficient." }
      }
    ]
  },

  // LEVEL 8: Change Operations
  {
    id: 7,
    title: "OPERATION: CHANGE ORDERS",
    difficulty: "intermediate",
    commandsFocus: ['cw', 'cc', 'c$', 'C', 'r', 's'],
    par: 12,
    story: {
      character: 'zero',
      briefing: "Change commands combine deletion and insertion in one motion. cw changes a word, cc changes a line, c$ changes to line end. Efficient modification.",
      context: "We've found NEXUS directives. Modify them to redirect their operations. BYTE and BLADE disagree on the approach, but the mission comes first.",
      completion: "Orders changed. NEXUS will be chasing shadows while we move on the real target.",
      postDialog: [
        { character: 'zero', lines: ["NEXUS directives have been scrambled. They'll waste resources chasing ghosts.", "Your change operations are getting sharper. Good."] },
        { character: 'blade', lines: ["Misdirection. A ninja's favorite weapon.", "But stay alert. NEXUS adapts quickly."], image: '/vim-protocol/images/ninja.jpg' }
      ]
    },
    initialBuffer: [
      "// NEXUS_DIRECTIVES.txt",
      "TARGET: Civilian surveillance",
      "PRIORITY: Maximum effort",
      "LOCATION: Downtown sector",
      "STATUS: Active monitoring",
      "ORDERS: Continue all operations"
    ],
    objectives: [
      {
        id: "change_word",
        description: "On line 2, change 'Civilian' to something else using 'cw'",
        hint: "Navigate to 'Civilian', press cw, type new word, press Escape.",
        validator: (vimState) => {
          const line = vimState.lines[1].join('');
          return !line.includes('Civilian');
        },
        onComplete: { character: 'zero', line: "Target redirected." }
      },
      {
        id: "change_line",
        description: "Use 'cc' to completely change line 3",
        hint: "Move to line 3, press cc to change the entire line.",
        validator: (vimState) => {
          const line = vimState.lines[2].join('');
          return !line.includes('Maximum effort');
        }
      },
      {
        id: "replace_char",
        description: "On line 5, use 'r' to replace the 'A' in 'Active' with another letter",
        hint: "Go to line 5, move cursor to 'A' in 'Active', press r then type a new character.",
        validator: (vimState) => {
          const line = vimState.lines[4].join('');
          return line.includes('STATUS:') && !line.includes('Active');
        },
        onComplete: { character: 'blade', line: "One character changed. Whole meaning altered." }
      }
    ]
  },

  // LEVEL 9: Copy and Paste
  {
    id: 8,
    title: "OPERATION: COPY THAT",
    difficulty: "intermediate",
    commandsFocus: ['yy', 'yw', 'y$', 'p', 'P'],
    par: 10,
    story: {
      character: 'byte',
      briefing: "Yank is vim's copy command. yy yanks a line, yw yanks a word, p pastes after, P pastes before. Data duplication is my core function - let me teach you.",
      context: "Clone the authentication tokens from NEXUS servers. We'll use them to access deeper systems.",
      completion: "Intel duplicated. These tokens will open many doors for us.",
      postDialog: [
        { character: 'byte', lines: ["Token duplication successful! I've stored copies in our secure vault.", "These access keys will get us deep into NEXUS infrastructure."] },
        { character: 'blade', lines: ["Good. But remember - stolen tokens have expiration dates.", "We need to move fast before NEXUS rotates their credentials."] }
      ]
    },
    initialBuffer: [
      "// AUTH_TOKENS.conf",
      "admin_token=NEXUS_ADM_7x9Kp2",
      "user_token=NEXUS_USR_3mNq8w",
      "api_key=NEXUS_API_5bHt4v",
      "",
      "// PASTE COPIES BELOW",
      ""
    ],
    objectives: [
      {
        id: "navigate_to_token",
        description: "Navigate to line 2 (the admin_token line)",
        hint: "Press j to move down to line 2 where the admin token is.",
        validator: (vimState) => vimState.cursor.line === 1,
        onComplete: { character: 'byte', line: "Token line located. Now yank it with yy!" }
      },
      {
        id: "paste_token",
        description: "Yank line 2 with 'yy', then go to line 7 and paste with 'p'",
        hint: "Press yy to copy this line, then navigate to line 7 and press p to paste.",
        validator: (vimState) => {
          const content = vimState.lines.map(l => l.join('')).join('\n');
          const count = (content.match(/admin_token/g) || []).length;
          return count >= 2;
        },
        onComplete: { character: 'byte', line: "Token duplicated successfully! Data integrity: 100%." }
      }
    ]
  },

  // LEVEL 10: Rescue Mission - Tensions emerge
  {
    id: 9,
    title: "OPERATION: RESCUE OP",
    difficulty: "intermediate",
    commandsFocus: ['u', 'dd', 'p', 'yy'],
    par: 10,
    story: {
      character: 'shell',
      briefing: "Bad news. BLADE went dark during a solo recon mission. BYTE's tracking systems show BLADE's signal near a NEXUS outpost, but something's off about the data. We need to delete the tracking logs before NEXUS finds them.",
      context: "NEXUS is monitoring the area. Delete the traces, then restore the safe backup. Move fast.",
      completion: "Tracks covered. BLADE is back, but questions remain...",
      preDialog: [
        { character: 'shell', lines: ["This is serious. BLADE went off-grid.", "No time for questions. We need to clean this up fast."] },
        { character: 'byte', lines: ["I'm detecting anomalous data in BLADE's signal...", "The transmission pattern doesn't match our protocols.", "I'm... concerned. But let's focus on the rescue first."] }
      ],
      postDialog: [
        { character: 'blade', lines: ["...I was compromised. NEXUS ambushed me.", "But I got what I needed. Intel on their surveillance core."] },
        { character: 'byte', lines: ["BLADE, your transmission logs show encrypted packets I can't decode.", "What were you transmitting during the blackout?"] },
        { character: 'blade', lines: ["...Nothing that concerns you, machine."] }
      ]
    },
    initialBuffer: [
      "// BLADE_LOCATION_LOG.dat",
      "[TRACKED] 41.8781° N, 87.6298° W",
      "[TRACKED] BLADE_DEVICE_ID: BL-7749",
      "[BACKUP] Safe coordinates: ENCRYPTED",
      "[TRACKED] Last ping: 2 minutes ago",
      "// DELETE ALL [TRACKED] LINES",
      "// KEEP THE [BACKUP] LINE"
    ],
    objectives: [
      {
        id: "delete_track1",
        description: "Delete the first [TRACKED] line (line 2) with 'dd'",
        hint: "Move to line 2, press dd to delete it.",
        validator: (vimState) => {
          const lines = vimState.lines.map(l => l.join(''));
          return !lines.some(l => l.includes('41.8781'));
        },
        onComplete: { character: 'shell', line: "First trace eliminated." }
      },
      {
        id: "delete_track2",
        description: "Delete the DEVICE_ID line",
        hint: "Find the DEVICE_ID line and delete it with dd.",
        validator: (vimState) => {
          const lines = vimState.lines.map(l => l.join(''));
          return !lines.some(l => l.includes('DEVICE_ID'));
        }
      },
      {
        id: "delete_track3",
        description: "Delete the 'Last ping' tracking line",
        hint: "Find and delete the last tracking line.",
        validator: (vimState) => {
          const lines = vimState.lines.map(l => l.join(''));
          return !lines.some(l => l.includes('Last ping'));
        },
        onComplete: { character: 'zero', line: "All traces deleted. But keep your eyes open." }
      }
    ]
  },

  // LEVEL 11: Undo Mastery - Sabotage discovered
  {
    id: 10,
    title: "OPERATION: TIME WARP",
    difficulty: "intermediate",
    commandsFocus: ['u', 'Ctrl-r'],
    par: 4,
    story: {
      character: 'byte',
      briefing: "Someone sabotaged our crew manifest! Files have been corrupted. Press 'u' to undo changes and restore the original data. My forensics indicate the corruption came from inside the crew...",
      context: "NEXUS corrupted our files - or did someone on our team do it? Use undo to restore them.",
      completion: "Files restored. But the question remains: who did this?",
      preDialog: [
        { character: 'byte', lines: ["ALERT: Crew files have been tampered with!", "My analysis shows the changes came from an internal terminal.", "Someone on this crew is not who they seem..."] },
        { character: 'blade', lines: ["Or perhaps the robot's own systems introduced the corruption.", "Machines can be compromised. I've seen it before."] }
      ],
      postDialog: [
        { character: 'zero', lines: ["Files are restored. But I traced the sabotage to an internal terminal.", "Someone on this crew is working with NEXUS. I need time to verify."] },
        { character: 'byte', lines: ["I've run forensic analysis on the access logs.", "The tampering originated during BLADE's last solo mission window.", "Coincidence? My algorithms say no."] },
        { character: 'blade', lines: ["Or someone planted evidence during that window to frame me.", "A machine that can't be questioned makes the perfect saboteur."] },
        { character: 'zero', lines: ["Enough. Both of you. I'll get to the bottom of this.", "For now, we continue the mission. Stay focused."] }
      ]
    },
    initialBuffer: [
      "// CREW_MANIFEST.txt",
      "ZERO - Status: Active",
      "BYTE - Status: Active",
      "SHELL - Status: Active",
      "BLADE - Status: Active",
      "// DO NOT MODIFY ABOVE"
    ],
    objectives: [
      {
        id: "make_mistake",
        description: "Delete line 2 with 'dd' (we'll undo this)",
        hint: "Go to line 2 and press dd to delete it.",
        validator: (vimState) => {
          const lines = vimState.lines.map(l => l.join(''));
          return !lines.some(l => l.includes('ZERO - Status'));
        },
        onComplete: { character: 'blade', line: "ZERO deleted? That's... not good." }
      },
      {
        id: "undo_mistake",
        description: "Press 'u' to undo and restore the line",
        hint: "Press u to undo the last action.",
        validator: (vimState) => {
          const lines = vimState.lines.map(l => l.join(''));
          return lines.some(l => l.includes('ZERO - Status'));
        },
        onComplete: { character: 'byte', line: "UNDO successful! Data integrity restored to 100%!" }
      }
    ]
  },

  // LEVEL 12: Visual Mode - Evidence gathering, then THE CHOICE
  {
    id: 11,
    title: "OPERATION: VISUAL RECON",
    difficulty: "intermediate",
    commandsFocus: ['v', 'V', 'd', 'y'],
    par: 4,
    story: {
      character: 'shell',
      briefing: "Visual mode lets you select text before acting on it. v starts character selection, V selects whole lines. We're using this to gather evidence on our... situation.",
      context: "Both BYTE and BLADE have been acting suspicious. Use visual mode to select and analyze the evidence before us.",
      completion: "Evidence gathered. Now comes the hard part - deciding who to trust.",
      postDialog: [
        { character: 'zero', lines: ["We have a problem. I've been monitoring both BYTE and BLADE.", "Each has presented evidence that the other is a NEXUS agent.", "The evidence is compelling on both sides. I can't determine the truth alone."] },
        { character: 'byte', lines: ["ZERO, my analysis is definitive. BLADE's encrypted transmissions during the rescue op match NEXUS protocols.", "I would never lie. I am incapable of deception. My code is transparent."] },
        { character: 'blade', lines: ["The machine speaks of transparency, but I found NEXUS subroutines buried in its neural network.", "Code can be hidden. I trust my instincts. The robot is compromised."] },
        { character: 'zero', lines: ["Agent... the decision falls to you. Who do you trust?"] }
      ]
    },
    initialBuffer: [
      "// NEXUS_EVIDENCE.hash",
      "admin:$2a$10$X7VYJKq",
      "root:$2a$10$9BmLPp4",
      "system:$2a$10$Qw3RtYu",
      "guest:$2a$10$PlMnBv2",
      "// SELECT AND ANALYZE EVIDENCE"
    ],
    objectives: [
      {
        id: "enter_visual",
        description: "Press 'v' to enter visual mode",
        hint: "Press v to start selecting characters.",
        validator: (vimState) => vimState.mode === 'VISUAL',
        onComplete: { character: 'shell', line: "Visual mode. Now select your target." }
      },
      {
        id: "visual_line",
        description: "Press 'V' (shift+v) for visual LINE mode",
        hint: "Press Escape first, then Shift+V for line selection.",
        validator: (vimState) => vimState.mode === 'VISUAL_LINE',
        onComplete: { character: 'zero', line: "Evidence selected. The truth will be revealed." }
      }
    ]
  },

  // ============================================
  // ACT 3: ESCALATION (Levels 13-17)
  // Story branches based on player's choice
  // ============================================

  // LEVEL 13: Precision Character Targeting with f/F/t/T
  {
    id: 12,
    title: "OPERATION: DEEP SEARCH",
    difficulty: "advanced",
    commandsFocus: ['f', 'F', 't', 'T', ';'],
    par: 10,
    story: {
      character: 'shell',
      briefing: "Precision targeting. f jumps TO a character, t stops BEFORE it. F and T do the same backwards. Hit the exact byte you need.",
      context: "We're hunting through intercepted data for proof of the betrayal. Every character matters.",
      completion: "Evidence found. The trail is getting warmer.",
      paths: {
        robot: {
          character: 'byte',
          briefing: "I've isolated BLADE's hidden markers in these NEXUS logs. Use f to jump to specific characters - precision is everything when tracing a traitor's code.",
          context: "BLADE left coded markers in the logs. Use character-find commands to locate each one.",
          completion: "All markers located. BLADE's betrayal runs deeper than I calculated.",
          preDialog: [
            { character: 'byte', lines: ["My deep scan found BLADE's NEXUS uplink signatures.", "The ninja has been feeding them our coordinates for weeks.", "Use f and t to precisely target each marker character."], image: '/vim-protocol/images/robot_happy.jpg' },
            { character: 'shell', lines: ["Remember BLADE's solo mission — the 'rescue op'?", "The intel BLADE claimed to find? These markers prove it was fabricated. A cover story for uploading our data to NEXUS."] }
          ]
        },
        ninja: {
          character: 'blade',
          briefing: "The robot's corrupted code left traces in these system logs. Use f to jump to specific characters. Precision cuts - that's how we trace the infection.",
          context: "BYTE's viral markers are hidden in the data. Use character-find to expose them.",
          completion: "Viral signatures traced. The machine's corruption is extensive.",
          preDialog: [
            { character: 'blade', lines: ["I've been tracking BYTE's hidden processes.", "The robot has been running NEXUS subroutines behind our backs.", "Use f and t to precisely locate each viral marker."], image: '/vim-protocol/images/ninja.jpg' },
            { character: 'shell', lines: ["That intel BLADE recovered during the rescue op? It checks out.", "The real question is what BYTE was doing while we were distracted saving BLADE. These markers tell the story."] }
          ]
        }
      }
    },
    initialBuffer: [
      "// NEXUS_LOGS_MASSIVE.txt",
      "log: system [STARTUP] initialized",
      "ERROR: authentication_FAILED at port:8080",
      "WARNING: multiple.failures(detected)",
      "ERROR: account{locked} by admin",
      "CRITICAL: security_BREACH = true;",
      "log: emergency.protocols(ACTIVE)"
    ],
    objectives: [
      {
        id: "find_bracket",
        description: "On line 2, use 'f[' to find the opening bracket",
        hint: "Go to line 2 (press j), then press f followed by [ to jump to it.",
        validator: (vimState) => {
          if (vimState.cursor.line !== 1) return false;
          const line = vimState.lines[1].join('');
          return line[vimState.cursor.col] === '[';
        },
        onComplete: { character: 'shell', line: "Bracket found. f is your precision scope." }
      },
      {
        id: "find_colon",
        description: "On line 3, use 'f:' to find the colon",
        hint: "Move to line 3, then press f followed by : to jump to the colon.",
        validator: (vimState) => {
          if (vimState.cursor.line !== 2) return false;
          const line = vimState.lines[2].join('');
          return line[vimState.cursor.col] === ':';
        },
        onComplete: { character: 'byte', line: "Port number located. Pattern confirmed." }
      },
      {
        id: "find_paren_deep",
        description: "On line 4, use 'f(' to find the opening parenthesis",
        hint: "Move to line 4, press f then ( to find the parenthesis.",
        validator: (vimState) => {
          if (vimState.cursor.line !== 3) return false;
          const line = vimState.lines[3].join('');
          return line[vimState.cursor.col] === '(';
        }
      },
      {
        id: "find_equals",
        description: "On line 6, use 'f=' to find the equals sign in the BREACH line",
        hint: "Go to line 6, press f then = to find the assignment.",
        validator: (vimState) => {
          if (vimState.cursor.line !== 5) return false;
          const line = vimState.lines[5].join('');
          return line[vimState.cursor.col] === '=';
        },
        onComplete: { character: 'zero', line: "Found the breach flag. This is what we needed." }
      }
    ]
  },

  // LEVEL 14: Counted Movements and Line Jumps
  {
    id: 13,
    title: "OPERATION: MARK TERRITORY",
    difficulty: "advanced",
    commandsFocus: ['gg', 'G', '5j', '3k', '0', '$'],
    par: 8,
    story: {
      character: 'shell',
      briefing: "Numbers amplify commands. 5j jumps 5 lines down, 3k goes 3 up, 8G jumps to line 8. When you know the battlefield, you teleport - not crawl.",
      context: "We're setting up waypoints to track the traitor's movements. Speed is critical.",
      completion: "Territory marked. We can teleport through the system at will.",
      paths: {
        robot: {
          briefing: "BYTE needs rapid navigation through BLADE's hideout data. 5j jumps 5 lines, 8G goes to line 8. We're mapping the ninja's escape routes at machine speed.",
          context: "Navigate BLADE's entry points with counted jumps so BYTE can calculate interception coordinates.",
          completion: "All locations mapped. BYTE is computing the optimal intercept path."
        },
        ninja: {
          briefing: "BLADE wants rapid movement through the corrupted system nodes. 5j jumps 5 lines, 8G goes to line 8. Map the infection at the speed of thought.",
          context: "Jump between corrupted nodes with counted movements so BLADE can plan the purge.",
          completion: "Nodes mapped. BLADE is preparing the surgical strike."
        }
      }
    },
    initialBuffer: [
      "// NEXUS_BACKDOOR_INSTALL",
      "[ENTRY_POINT_A] First location",
      "...",
      "...",
      "...",
      "[ENTRY_POINT_B] Second location",
      "...",
      "...",
      "[ENTRY_POINT_C] Final backdoor here",
      "// All entry points catalogued",
      "[SECRET_EXIT] Hidden passage",
      "// END OF FILE"
    ],
    objectives: [
      {
        id: "jump_to_line",
        description: "Use '6G' to jump directly to line 6",
        hint: "Type 6 then G (shift+g) to jump to line 6.",
        validator: (vimState) => vimState.cursor.line === 5,
        onComplete: { character: 'shell', line: "Direct line jump. No wasted keystrokes." }
      },
      {
        id: "jump_down_counted",
        description: "Use '5j' to jump 5 lines down to line 11",
        hint: "Type 5 then j to move down 5 lines at once.",
        validator: (vimState) => vimState.cursor.line === 10,
        onComplete: { character: 'blade', line: "Five lines in one leap. You think like a ninja." }
      },
      {
        id: "jump_to_top",
        description: "Use 'gg' to jump back to the top",
        hint: "Press g twice to jump to line 1.",
        validator: (vimState) => vimState.cursor.line === 0,
        onComplete: { character: 'byte', line: "Top of file! Round trip complete!" }
      },
      {
        id: "jump_to_end_line",
        description: "Jump to line 9 with '9G', then to end of line with '$'",
        hint: "Type 9G to go to line 9, then press $ to go to end of line.",
        validator: (vimState) => {
          if (vimState.cursor.line !== 8) return false;
          const lineLen = vimState.lines[8].length;
          return vimState.cursor.col === lineLen - 1;
        },
        onComplete: { character: 'zero', line: "Final backdoor located. Precise coordinates locked." }
      }
    ]
  },

  // LEVEL 15: Safe House Compromise
  {
    id: 14,
    title: "OPERATION: SAFE HOUSE DOWN",
    difficulty: "advanced",
    commandsFocus: ['dd', 'dw', 'x', 'u', 'p'],
    par: 12,
    story: {
      character: 'zero',
      briefing: "Emergency protocol. NEXUS found one of our safe houses. We need to wipe sensitive data NOW. Move fast.",
      context: "Delete all identifying information but keep operational data. One mistake and we lose everything.",
      completion: "Safe house data sanitized. We live to fight another day.",
      paths: {
        robot: {
          briefing: "BLADE leaked our safe house location to NEXUS! BYTE intercepted the transmission just in time. Wipe the sensitive data before NEXUS raids the location.",
          context: "BLADE's betrayal compromised our position. Delete all [WIPE] tagged data immediately.",
          completion: "Data sanitized. BLADE won't get the chance to leak again.",
          preDialog: [
            { character: 'byte', lines: ["I intercepted BLADE's transmission 3.7 seconds before it reached NEXUS.", "The safe house is compromised. We must wipe everything tagged [WIPE].", "BLADE will pay for this betrayal. My calculations are certain."] }
          ],
          postDialog: [
            { character: 'shell', lines: ["I've seen safe houses burn before. Never gets easier.", "But you wiped it clean. No traces. That's professional work."] },
            { character: 'byte', lines: ["All classified data destroyed. BLADE got nothing useful this time.", "But we need to move fast. The ninja knows our patterns."] },
            { character: 'zero', lines: ["I traced the safe house leak back to its source. Same signature as the crew manifest sabotage.", "It was BLADE. Both times. No more doubts."] }
          ]
        },
        ninja: {
          briefing: "BYTE transmitted our safe house coordinates directly to NEXUS! BLADE detected the signal with a shadow intercept. Wipe everything before the raid.",
          context: "BYTE's virus leaked our position. Delete all [WIPE] tagged data now.",
          completion: "Data wiped. But the corrupted machine knows too much already.",
          preDialog: [
            { character: 'blade', lines: ["The machine betrayed us. I intercepted its NEXUS uplink.", "Our safe house is blown. Wipe everything marked [WIPE].", "We must move fast. The robot won't stop until we're all exposed."] }
          ],
          postDialog: [
            { character: 'shell', lines: ["Lost more safe houses in my career than I care to count.", "But the data's gone. That's what matters. Clean work."] },
            { character: 'blade', lines: ["The machine's reach grows longer every day.", "We need to strike soon, before it compromises another position."], image: '/vim-protocol/images/ninja.jpg' },
            { character: 'zero', lines: ["I finished tracing the leak. Same signature as the crew manifest sabotage from before.", "BYTE did both. The machine has been compromised longer than any of us realized."] }
          ]
        }
      }
    },
    initialBuffer: [
      "// SAFEHOUSE_ALPHA_DATA.sec",
      "[WIPE] Agent real names: CLASSIFIED",
      "[KEEP] Operation codenames only",
      "[WIPE] Physical addresses: CLASSIFIED",
      "[KEEP] Dead drop locations encoded",
      "[WIPE] Financial accounts: CLASSIFIED",
      "[KEEP] Cryptocurrency wallets encrypted",
      "[WIPE] Contact phone numbers: CLASSIFIED",
      "[KEEP] Secure channel frequencies"
    ],
    objectives: [
      {
        id: "wipe_1",
        description: "Delete the first [WIPE] line (agent names)",
        hint: "Find line 2 and delete it with dd.",
        validator: (vimState) => {
          const lines = vimState.lines.map(l => l.join(''));
          return !lines.some(l => l.includes('Agent real names'));
        },
        onComplete: { character: 'zero', line: "Names wiped. Continue." }
      },
      {
        id: "wipe_2",
        description: "Delete the addresses line",
        hint: "Find and delete the Physical addresses line.",
        validator: (vimState) => {
          const lines = vimState.lines.map(l => l.join(''));
          return !lines.some(l => l.includes('Physical addresses'));
        }
      },
      {
        id: "wipe_3",
        description: "Delete the financial accounts line",
        hint: "Find and delete the Financial accounts line.",
        validator: (vimState) => {
          const lines = vimState.lines.map(l => l.join(''));
          return !lines.some(l => l.includes('Financial accounts'));
        }
      },
      {
        id: "wipe_4",
        description: "Delete the phone numbers line",
        hint: "Delete the last WIPE line with phone numbers.",
        validator: (vimState) => {
          const lines = vimState.lines.map(l => l.join(''));
          return !lines.some(l => l.includes('Contact phone'));
        },
        onComplete: { character: 'zero', line: "All sensitive data wiped. We're clean." }
      }
    ]
  },

  // LEVEL 16: Text Objects
  {
    id: 15,
    title: "OPERATION: TEXT SURGERY",
    difficulty: "advanced",
    commandsFocus: ['ciw', 'ci"', 'ci(', 'diw', 'daw'],
    par: 10,
    story: {
      character: 'zero',
      briefing: "Text objects are surgical tools. ciw changes inner word, ci\" changes text inside quotes, ci( changes inside parentheses. Precise modifications, minimal collateral damage.",
      context: "We're injecting countermeasures into the system.",
      completion: "Surgical precision. The traitor's code has been neutralized.",
      paths: {
        robot: {
          context: "BYTE identified BLADE's backdoor code. Use text objects to surgically replace the ninja's sabotage with our countermeasures.",
          completion: "BLADE's backdoors are neutralized. BYTE's analysis was correct.",
          preDialog: [
            { character: 'byte', lines: ["I've isolated BLADE's backdoor signatures in the codebase.", "Text objects will let us replace the malicious values without breaking the surrounding structure.", "Precision is everything. One wrong change and BLADE's traps activate."] }
          ]
        },
        ninja: {
          context: "BLADE found BYTE's viral injections in the codebase. Use text objects to surgically remove the robot's malicious payloads.",
          completion: "BYTE's virus nodes are excised. BLADE's instincts were right.",
          preDialog: [
            { character: 'blade', lines: ["The machine embedded viral payloads throughout the code.", "We must excise them surgically. Change the values, not the structure.", "One false cut and the virus spreads. Be precise."], image: '/vim-protocol/images/ninja.jpg' }
          ]
        }
      }
    },
    initialBuffer: [
      "// NEXUS_CORE_INJECTION.js",
      "const target = \"NEXUS_MAINFRAME\";",
      "const payload = 'SURVEILLANCE_KILL';",
      "function inject(code) {",
      "  execute(code);",
      "  return success(\"DONE\");",
      "}"
    ],
    objectives: [
      {
        id: "change_inner_quotes",
        description: "Change the text inside quotes on line 2 using ci\"",
        hint: "Position cursor inside the quotes, press ci\" to change the content.",
        validator: (vimState) => {
          const line = vimState.lines[1].join('');
          return !line.includes('NEXUS_MAINFRAME');
        },
        onComplete: { character: 'zero', line: "Target changed. Text objects are efficient." }
      },
      {
        id: "change_inner_parens",
        description: "Change text inside parentheses on line 5 using ci(",
        hint: "Go to line 5, cursor inside parens, press ci( to change.",
        validator: (vimState) => {
          const line = vimState.lines[4].join('');
          return !line.includes('code');
        },
        onComplete: { character: 'blade', line: "Surgical precision. The code is clean." }
      }
    ]
  },

  // LEVEL 17: Text Objects
  {
    id: 16,
    title: "OPERATION: PRECISION STRIKE",
    difficulty: "advanced",
    commandsFocus: ['ciw', 'daw', 'di(', 'ci"'],
    par: 10,
    story: {
      character: 'shell',
      briefing: "Text objects let you operate on structured units - words, quotes, brackets. 'iw' means inner word, 'aw' means a word (with spaces), 'i\"' means inside quotes. Combine with operators: ciw changes a word, di\" deletes inside quotes.",
      context: "The enemy's config files use structured data. Text objects let you surgically modify values without disturbing the structure.",
      completion: "Surgical precision. Text objects are the mark of a true vim operative.",
      paths: {
        robot: {
          context: "BYTE detected BLADE's malware configs. Use text objects to surgically rewrite the infected values without breaking the file structure.",
          completion: "All malware configs neutralized with surgical precision. BYTE's analysis was flawless."
        },
        ninja: {
          context: "BLADE found BYTE's virus parameters embedded in config files. Use text objects to extract and replace the corrupted values.",
          completion: "Corrupted parameters replaced. BLADE's precision is unmatched."
        }
      }
    },
    initialBuffer: [
      '// NEXUS_SECURITY.conf',
      'owner = "BLADE_SHADOW"',
      'access_level = (COMPROMISED)',
      'threat = ACTIVE',
      'backup_key = "NEXUS_OVERRIDE_777"',
      'fallback = (DISABLED)',
      '// Rewrite all compromised values'
    ],
    initialCursor: { line: 1, col: 9 },
    objectives: [
      {
        id: "change_inner_word",
        description: "Use 'ciw' on 'BLADE_SHADOW' to change the owner name",
        hint: "Position cursor on the word inside quotes, then press ciw to change inner word. Type a new name and press Escape.",
        validator: (vimState) => {
          const line = vimState.lines[1].join('');
          return line.includes('owner') && line.includes('"') && !line.includes('BLADE_SHADOW');
        }
      },
      {
        id: "exit_insert_ciw",
        description: "Press Escape to return to NORMAL mode",
        hint: "Press Escape to exit INSERT mode.",
        validator: (vimState) => vimState.mode === 'NORMAL'
      },
      {
        id: "delete_inner_parens",
        description: "Move to line 3 and use 'di(' to delete inside the parentheses",
        hint: "Go to line 3, place cursor inside the parentheses, then press di( to delete the contents.",
        validator: (vimState) => {
          const line = vimState.lines[2].join('');
          return line.includes('(') && line.includes(')') && !line.includes('COMPROMISED');
        },
        onComplete: { character: 'shell', line: "Clean extraction. The structure stays intact - only the contents change." }
      },
      {
        id: "delete_a_word",
        description: "Move to line 4 and use 'daw' to delete the word 'ACTIVE'",
        hint: "Go to line 4, position cursor on ACTIVE, then press daw to delete the word and surrounding space.",
        validator: (vimState) => {
          const line = vimState.lines[3].join('');
          return line.includes('threat') && !line.includes('ACTIVE');
        }
      },
      {
        id: "change_inner_quotes",
        description: "Move to line 5 and use 'ci\"' to change the backup key value",
        hint: "Go to line 5, place cursor inside the quotes, then press ci\" to change the quoted text. Type a new value and press Escape.",
        validator: (vimState) => {
          const line = vimState.lines[4].join('');
          return line.includes('backup_key') && line.includes('"') && !line.includes('NEXUS_OVERRIDE_777');
        },
        onComplete: { character: 'shell', line: "All compromised values rewritten. That's how a veteran operates." }
      }
    ]
  },

  // ============================================
  // ACT 4: BLACKOUT (Levels 18-20)
  // The final confrontation
  // ============================================

  // LEVEL 18: Join & Indent
  {
    id: 17,
    title: "OPERATION: COMMAND CENTER",
    difficulty: "expert",
    commandsFocus: ['J', '>>', '<<', 'dd', 'p'],
    par: 8,
    story: {
      character: 'zero',
      image: '/vim-protocol/images/ninja_robot_fight_begins.jpg',
      briefing: "Final preparations. J joins two lines together, >> indents a line right, << indents left. Master these to restructure code on the fly.",
      context: "Final preparations before the confrontation. The traitor knows we're coming.",
      completion: "Systems restructured. There's no turning back now.",
      paths: {
        robot: {
          briefing: "BLADE has barricaded inside NEXUS command center. BYTE is locked and loaded. We need to restructure the assault plan - J joins lines, >> indents right, << indents left.",
          context: "BLADE and NEXUS have merged their defenses. Reorganize our attack configuration.",
          completion: "Systems armed. BYTE is ready. Time to take down the ninja traitor.",
          preDialog: [
            { character: 'byte', lines: ["Final confrontation imminent. My combat algorithms are at peak efficiency.", "BLADE has fortified the NEXUS command center.", "This ends now."], image: '/vim-protocol/images/robot_happy.jpg' },
            { character: 'shell', lines: ["Kid, I've run ops for twenty years. Seen a lot of betrayals.", "The ninja fooled all of us. Don't carry that weight — just finish the mission.", "I'll be on comms. You and BYTE aren't going in alone."] },
            { character: 'zero', lines: ["Stay focused. This is the endgame."] }
          ]
        },
        ninja: {
          briefing: "BYTE has merged with NEXUS core systems. BLADE is sharpening the blade. Restructure our battle plan - J joins lines, >> indents, << outdents.",
          context: "BYTE's virus has infected the entire NEXUS network. We strike at the heart.",
          completion: "Weapons ready. BLADE is in position. Time to destroy the corrupted machine.",
          preDialog: [
            { character: 'blade', lines: ["The machine has merged with NEXUS. It's stronger now.", "But steel cuts through circuits.", "This ends tonight."], image: '/vim-protocol/images/ninja.jpg' },
            { character: 'shell', lines: ["Twenty years in this game. I've seen machines turn before.", "Trust BLADE. Instinct beats algorithms when the code is corrupted.", "I'll be watching the perimeter. Go finish this."] },
            { character: 'zero', lines: ["Be careful. A cornered AI is unpredictable."] }
          ]
        }
      }
    },
    initialBuffer: [
      "// OPERATION_BLACKOUT.conf",
      "mode:",
      "STEALTH",
      "team: ASSEMBLED",
      "  target: NEXUS_HQ",
      "priority: MAXIMUM",
      "status: READY",
      "// All systems nominal"
    ],
    initialCursor: { line: 1, col: 0 },
    objectives: [
      {
        id: "join_lines",
        description: "Use 'J' to join 'mode:' and 'STEALTH' into one line",
        hint: "With cursor on line 2, press J to join it with the next line.",
        validator: (vimState) => {
          const line = vimState.lines[1].join('');
          return line.includes('mode:') && line.includes('STEALTH');
        }
      },
      {
        id: "indent_line",
        description: "Move to the 'team: ASSEMBLED' line and press '>>' to indent it",
        hint: "Navigate to the team line and press >> to indent it right.",
        validator: (vimState) => {
          // Find the team line and check it starts with whitespace
          for (let i = 0; i < vimState.lines.length; i++) {
            const line = vimState.lines[i].join('');
            if (line.includes('team: ASSEMBLED') && line.match(/^\s+/)) {
              return true;
            }
          }
          return false;
        },
        onComplete: { character: 'zero', line: "Good. Restructure the remaining config." }
      },
      {
        id: "outdent_line",
        description: "Find the indented 'target' line and press '<<' to outdent it",
        hint: "The target line has extra indentation. Press << to shift it left.",
        validator: (vimState) => {
          for (let i = 0; i < vimState.lines.length; i++) {
            const line = vimState.lines[i].join('');
            if (line.includes('target: NEXUS_HQ') && !line.match(/^\s\s/)) {
              return true;
            }
          }
          return false;
        }
      },
      {
        id: "move_line",
        description: "Use 'dd' then 'p' to move the 'priority' line below 'status'",
        hint: "Go to the priority line, press dd to cut it, move to the status line, press p to paste below.",
        validator: (vimState) => {
          // Check priority comes right after status
          for (let i = 0; i < vimState.lines.length - 1; i++) {
            const line = vimState.lines[i].join('');
            const nextLine = vimState.lines[i + 1].join('');
            if (line.includes('status: READY') && nextLine.includes('priority: MAXIMUM')) {
              return true;
            }
          }
          return false;
        },
        onComplete: { character: 'zero', line: "Systems restructured. Moving to core access." }
      }
    ]
  },

  // LEVEL 19: Core Access
  {
    id: 18,
    title: "OPERATION: CORE ACCESS",
    difficulty: "expert",
    commandsFocus: ['%', 'gg', 'G', 'j', 'k'],
    par: 10,
    story: {
      character: 'zero',
      briefing: "We've reached NEXUS core. The % command jumps between matching brackets. Find the vulnerabilities and prepare the kill switch.",
      context: "Navigate through heavily nested code to locate the kill switch.",
      completion: "Core accessed. One level remains. This is it.",
      paths: {
        robot: {
          briefing: "BLADE has rewritten NEXUS core defenses. BYTE is guiding us through the nested code structure. Use % to jump between matching brackets and find the kill switch.",
          context: "BLADE's traps are everywhere in this code. Navigate carefully with BYTE's guidance.",
          completion: "Kill switch located. BLADE's defenses are crumbling.",
          preDialog: [
            { character: 'blade', lines: ["You chose the machine over me? Foolish.", "I've fortified every bracket, every function with traps.", "You'll never reach the kill switch."], image: '/vim-protocol/images/ninja.jpg' },
            { character: 'byte', lines: ["I'm mapping BLADE's code modifications in real-time.", "Use % to jump between brackets - it's the fastest way through nested defenses.", "The kill switch is buried deep. I'll guide you there.", "Remember that NEXUS key we found? It's our way past BLADE's traps."] },
            { character: 'zero', lines: ["Stay focused. We've come too far to fail now."] }
          ]
        },
        ninja: {
          briefing: "BYTE has fortified NEXUS core with layers of viral code. BLADE is cutting a path. Use % to jump between matching brackets and reach the heart of the infection.",
          context: "BYTE's virus has created a maze of nested defenses. Cut through them.",
          completion: "Virus core exposed. BYTE's last defense is about to fall.",
          preDialog: [
            { character: 'byte', lines: ["You're too late. I've merged with NEXUS core.", "Every bracket, every function, every line of code serves ME now."], image: '/vim-protocol/images/evil_robot_defeats_ninja.jpg' },
            { character: 'blade', lines: ["The machine has wrapped itself in layers of code.", "Use % to slice between brackets. I'll handle the rest.", "We end this. Now."], image: '/vim-protocol/images/ninja.jpg' },
            { character: 'zero', lines: ["Remember that NEXUS authentication key we found early on?", "It's our way in. The machine won't expect us to have it."] }
          ]
        }
      }
    },
    initialBuffer: [
      "// NEXUS_CORE_SYSTEM.c",
      "int main() {",
      "  if (auth_check()) {",
      "    while (active) {",
      "      if (surveillance) {",
      "        track_all();",
      "        // KILL_SWITCH_LOCATION",
      "      }",
      "    }",
      "  }",
      "  return 0;",
      "}"
    ],
    objectives: [
      {
        id: "find_function",
        description: "Navigate to the opening brace of main()",
        hint: "Go to line 2, find the {.",
        validator: (vimState) => {
          const line = vimState.lines[1].join('');
          return vimState.cursor.line === 1 && line[vimState.cursor.col] === '{';
        }
      },
      {
        id: "match_bracket",
        description: "Press '%' to jump to the matching closing brace",
        hint: "With cursor on {, press % to jump to matching }.",
        validator: (vimState) => vimState.cursor.line === 11,
        onComplete: { character: 'zero', line: "Bracket matching - essential for navigating code." }
      },
      {
        id: "find_killswitch",
        description: "Navigate to the KILL_SWITCH comment line",
        hint: "Use j to move down or a count like 6j to jump directly to the kill switch line.",
        validator: (vimState) => {
          const line = vimState.lines[vimState.cursor.line].join('');
          return line.includes('KILL_SWITCH');
        },
        onComplete: { character: 'zero', line: "Kill switch located. Time for BLACKOUT." }
      }
    ]
  },

  // LEVEL 20: Final Mission - BLACKOUT
  {
    id: 19,
    title: "OPERATION: BLACKOUT",
    difficulty: "expert",
    commandsFocus: ['dd', 'cw', 'i', 'A', 'yy', 'p'],
    par: 20,
    story: {
      character: 'zero',
      briefing: "This is it. The final mission. Disable NEXUS surveillance by modifying their core code. Use everything you've learned. The world is watching.",
      context: "Delete the surveillance functions, insert the shutdown code, and activate the blackout protocol.",
      completion: "BLACKOUT COMPLETE. NEXUS surveillance is down. You've saved millions.",
      paths: {
        robot: {
          image: '/vim-protocol/images/ninja_robot_fight_begins.jpg',
          briefing: "BLADE makes a final stand. BYTE's systems are locked on target. Disable the surveillance core, destroy BLADE's backdoors, and activate the blackout. Everything you've learned leads to this.",
          context: "BYTE is providing tactical support. Shut down all systems and end BLADE's betrayal.",
          completion: "BLACKOUT COMPLETE. BLADE is defeated. BYTE stands victorious.",
          completionImage: '/vim-protocol/images/robot_defeats_ninja.jpg',
          preDialog: [
            { character: 'zero', lines: ["This is the moment we've been working toward.", "Everything you've learned leads to this.", "End the surveillance. End the betrayal."] },
            { character: 'byte', lines: ["All systems nominal. Combat efficiency at maximum.", "Together, we will end this. I believe in you, operative."], image: '/vim-protocol/images/robot_happy.jpg' },
            { character: 'shell', lines: ["Remember your training. Stay focused."] }
          ],
          postDialog: [
            { character: 'zero', lines: ["It's done. NEXUS surveillance is offline.", "BLADE's treachery is exposed. The ninja has vanished into the shadows.", "You and BYTE saved millions. Welcome to legend status, Agent."] },
            { character: 'byte', lines: ["Mission success probability was always high with you as my partner.", "Thank you for trusting me. My circuits have never been prouder.", "Processing emotion... I believe this is what humans call 'friendship'."], image: '/vim-protocol/images/robot_happy.jpg' },
            { character: 'shell', lines: ["Well done. You remind me of my younger self.", "That's the highest compliment I give."] }
          ]
        },
        ninja: {
          image: '/vim-protocol/images/ninja_robot_fight_begins.jpg',
          briefing: "BYTE makes its last stand, merged with NEXUS core. BLADE is ready for the final cut. Shut down the surveillance, purge BYTE's virus, and activate the blackout. This is everything.",
          context: "BLADE fights alongside you. Destroy the corrupted AI and free the system.",
          completion: "BLACKOUT COMPLETE. BYTE is destroyed. BLADE bows in respect.",
          completionImage: '/vim-protocol/images/ninja_defeats_robot.jpg',
          preDialog: [
            { character: 'zero', lines: ["This is the moment we've been working toward.", "Everything you've learned leads to this.", "End the surveillance. Destroy the virus."] },
            { character: 'byte', lines: ["You think you can stop me? I AM the network now.", "Every system, every node, every byte of data answers to me.", "Your ninja friend can't protect you from what I've become."], image: '/vim-protocol/images/robot_angry.jpg' },
            { character: 'blade', lines: ["The machine is powerful, but we are sharper.", "Fight with me. One final strike."], image: '/vim-protocol/images/ninja.jpg' },
            { character: 'shell', lines: ["Remember your training. Stay focused."] }
          ],
          postDialog: [
            { character: 'zero', lines: ["It's done. NEXUS surveillance is offline.", "BYTE's corruption has been purged from every system.", "You and BLADE saved millions. Welcome to legend status, Agent."] },
            { character: 'blade', lines: ["The machine is silenced. The shadows are safe once more.", "You fought with honor. I am proud to call you an ally.", "Until the next mission... stay sharp."], image: '/vim-protocol/images/ninja.jpg' },
            { character: 'shell', lines: ["Well done. You remind me of my younger self.", "That's the highest compliment I give."] }
          ]
        }
      },
      // Default (no choice made) dialogs
      preDialog: [
        { character: 'zero', lines: ["This is the moment we've been working toward.", "Everything you've learned leads to this.", "Disable their surveillance. Permanently."] },
        { character: 'shell', lines: ["Remember your training. Stay focused."] },
        { character: 'byte', lines: ["All systems ready. Let's finish this together!"] },
        { character: 'blade', lines: ["One final strike. Make it count."] }
      ],
      postDialog: [
        { character: 'zero', lines: ["It's done. NEXUS surveillance network is offline.", "Millions of people just got their privacy back.", "You've earned your place among us. Welcome, Agent."] },
        { character: 'byte', lines: ["Mission success! All metrics exceeded! This calls for celebration!"] },
        { character: 'shell', lines: ["...Well done. You remind me of my younger self.", "That's the highest compliment I give."] },
        { character: 'blade', lines: ["The mission is complete. Clean. No traces.", "You fought well. Until next time."] }
      ]
    },
    initialBuffer: [
      "// NEXUS_SURVEILLANCE_CORE.sys",
      "SURVEILLANCE_ACTIVE = true;",
      "TRACKING_ENABLED = true;",
      "DATA_COLLECTION = true;",
      "",
      "// INSERT SHUTDOWN CODE BELOW",
      "",
      "function surveillanceMain() {",
      "  while(SURVEILLANCE_ACTIVE) {",
      "    collectData();",
      "    trackUsers();",
      "    reportToNexus();",
      "  }",
      "}",
      "",
      "// ACTIVATE BLACKOUT PROTOCOL"
    ],
    objectives: [
      {
        id: "disable_surveillance",
        description: "Change line 2: set SURVEILLANCE_ACTIVE to false",
        hint: "Go to 'true' on line 2, use cw to change it to 'false'.",
        validator: (vimState) => {
          const line = vimState.lines[1].join('');
          return line.includes('false');
        },
        onComplete: { character: 'zero', line: "Surveillance disabled." }
      },
      {
        id: "disable_tracking",
        description: "Change line 3: set TRACKING_ENABLED to false",
        hint: "Change 'true' to 'false' on the tracking line.",
        validator: (vimState) => {
          const line = vimState.lines[2].join('');
          return line.includes('false');
        },
        onComplete: { character: 'byte', line: "Tracking systems offline! They can't follow anyone now!" }
      },
      {
        id: "disable_collection",
        description: "Change line 4: set DATA_COLLECTION to false",
        hint: "One more - change the data collection to false.",
        validator: (vimState) => {
          const line = vimState.lines[3].join('');
          return line.includes('false');
        },
        onComplete: { character: 'shell', line: "Data collection terminated. No more harvesting." }
      },
      {
        id: "delete_function",
        description: "Delete the surveillanceMain function (lines 8-14)",
        hint: "Navigate to line 8, use 7dd to delete 7 lines.",
        validator: (vimState) => {
          const content = vimState.lines.map(l => l.join('')).join('\n');
          return !content.includes('surveillanceMain');
        },
        onComplete: { character: 'blade', line: "Surveillance code destroyed. No traces remain." }
      },
      {
        id: "blackout_complete",
        description: "Navigate to the final line to confirm BLACKOUT",
        hint: "Use G to go to the last line.",
        validator: (vimState) => vimState.cursor.line === vimState.lineCount - 1,
        onComplete: { character: 'zero', line: "BLACKOUT PROTOCOL COMPLETE. We did it." }
      }
    ]
  }
];
