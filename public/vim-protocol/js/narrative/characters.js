// Characters - The hacker crew for Operation Blackout
// Features BYTE (the Robot) and BLADE (the Ninja) as central characters
const CHARACTERS = {
  zero: {
    id: 'zero',
    name: 'ZERO',
    title: 'The Architect',
    color: '#9d4edd',
    accentColor: '#c77dff',
    role: 'Founder of the hacker collective, your main guide',
    personality: 'Wise but sarcastic, drops wisdom wrapped in jokes',

    avatar: [
      '╔═══╗',
      '║ 0 ║',
      '╚═══╝'
    ],

    quotes: {
      greeting: [
        "Welcome to the grid, newbie.",
        "Another recruit? Let's see what you've got.",
        "The cursor awaits. Are you ready?"
      ],
      encouragement: [
        "Not bad. You might actually survive out here.",
        "You're learning. That's what matters.",
        "Every master was once a disaster. Keep going."
      ],
      hint: [
        "Think about it. The answer is in the motion.",
        "Vim is poetry. Each command has meaning.",
        "Listen to the keys. They'll guide you."
      ],
      success: [
        "Clean execution. I'm impressed.",
        "That's the vim way. Efficient. Precise.",
        "You're starting to think like us."
      ],
      failure: [
        "We don't use the mouse here.",
        "Try again. Failure is just practice for success.",
        "Even I made mistakes once. Well, maybe twice."
      ],
      levelComplete: [
        "Mission accomplished. The grid bends to your will.",
        "Another server down. NEXUS won't know what hit them.",
        "You've earned your place here."
      ]
    }
  },

  byte: {
    id: 'byte',
    name: 'BYTE',
    title: 'The AI Construct',
    color: '#00d4ff',
    accentColor: '#7df9ff',
    role: 'Sentient AI robot, analytical mind of the crew',
    personality: 'Friendly, precise, speaks in computed probabilities, genuinely caring',
    image: '/vim-protocol/images/robot_happy.jpg',
    angryImage: '/vim-protocol/images/robot_angry.jpg',

    avatar: [
      '┌─⚙─┐',
      '│ B │',
      '└─○─┘'
    ],

    quotes: {
      greeting: [
        "Greetings! I've calculated a 73.2% probability you'll excel at this!",
        "Welcome! My sensors indicate high potential in your keystroke patterns!",
        "Hello, new operative! I'm BYTE. Let's optimize your efficiency together!"
      ],
      encouragement: [
        "Your accuracy is improving by 12% per attempt! Keep going!",
        "Processing... yes! That was within optimal parameters!",
        "I've seen 847 recruits. Your pattern recognition is in the top percentile!"
      ],
      hint: [
        "My algorithms suggest the following approach...",
        "Computing optimal solution... try thinking of it like a data flow.",
        "Statistical analysis shows this key combination is most efficient here."
      ],
      success: [
        "OPTIMAL! That execution was 99.7% efficient!",
        "Excellent! My prediction models are very pleased!",
        "Processing complete! You exceeded all benchmarks!"
      ],
      failure: [
        "Error detected, but don't worry - even my circuits need recalibrating sometimes!",
        "Suboptimal result, but my data shows persistence leads to mastery!",
        "Recalculating... try a different approach. I believe in you!"
      ],
      levelComplete: [
        "Mission success! Efficiency rating: EXCEPTIONAL!",
        "All objectives cleared! Updating your competency matrix!",
        "System report: NEXUS defenses crumbling. Your contribution: SIGNIFICANT."
      ]
    }
  },

  blade: {
    id: 'blade',
    name: 'BLADE',
    title: 'The Shadow Operative',
    color: '#ff1493',
    accentColor: '#ff69b4',
    role: 'Cyber-ninja, stealth and precision specialist',
    personality: 'Silent and deadly, speaks in short sharp sentences, respects skill',
    image: '/vim-protocol/images/ninja.jpg',

    avatar: [
      '╔═╦═╗',
      '║ ⚔ ║',
      '╚═╩═╝'
    ],

    quotes: {
      greeting: [
        "... *appears from shadows* I am BLADE. Show me what you can do.",
        "The shadows have eyes. I've been watching you. Interesting.",
        "Welcome. Move fast. Strike clean. That is the way."
      ],
      encouragement: [
        "Swift. I approve.",
        "You move like someone who understands precision.",
        "Faster than I expected. Good."
      ],
      hint: [
        "A ninja strikes once. Make each keystroke count.",
        "Patience. Then strike. Hesitation is death.",
        "The blade finds its mark through practice, not luck."
      ],
      success: [
        "Clean kill. You have the instinct.",
        "*nods* That was worthy of a shadow operative.",
        "Precise. Lethal. Perfect."
      ],
      failure: [
        "A missed strike. Recenter. Try again.",
        "Sloppy. But even masters stumble before they fly.",
        "The shadow does not judge. It waits for you to try again."
      ],
      levelComplete: [
        "The mission is done. Clean. No traces left behind.",
        "NEXUS didn't see us coming. They never do.",
        "Another victory from the shadows."
      ]
    }
  },

  shell: {
    id: 'shell',
    name: 'SHELL',
    title: 'The Veteran',
    color: '#39ff14',
    accentColor: '#9fff5b',
    role: 'Old-school hacker, been coding since the 80s',
    personality: 'Grumpy but secretly caring, hates modern tools',
    image: '/vim-protocol/images/shell.png',

    avatar: [
      '┌───┐',
      '│ $ │',
      '└───┘'
    ],

    quotes: {
      greeting: [
        "Another one. *sigh* At least you're using vim.",
        "Back in my day we edited code with magnets and a steady hand.",
        "Hmph. Let's see if you can keep up."
      ],
      encouragement: [
        "...Not terrible. I've seen worse. Much worse.",
        "You're getting there. Slowly. But getting there.",
        "That's... actually correct. Don't let it go to your head."
      ],
      hint: [
        "Kids these days need hints for everything. Fine. Listen up.",
        "I'll tell you this ONCE. Pay attention.",
        "In my day we figured this out ourselves. But fine."
      ],
      success: [
        "Acceptable. Finally.",
        "That's how it's done. See? Not so hard.",
        "Hmph. Maybe there's hope for you yet."
      ],
      failure: [
        "I've seen turtles type faster. And more accurately.",
        "You kids have it easy with your 'undo' commands.",
        "Wrong. Again. But at least you're trying, I suppose."
      ],
      levelComplete: [
        "Done. Good. Now do it again, faster.",
        "That takes me back. Well done, rookie.",
        "NEXUS doesn't stand a chance. Neither did anyone else."
      ]
    }
  }
};

// Helper function to get a random quote from a character
function getCharacterQuote(characterId, category) {
  const character = CHARACTERS[characterId];
  if (!character || !character.quotes[category]) {
    return null;
  }

  const quotes = character.quotes[category];
  return quotes[Math.floor(Math.random() * quotes.length)];
}

// Helper function to get character by id
function getCharacter(characterId) {
  return CHARACTERS[characterId] || null;
}

// Get all characters
function getAllCharacters() {
  return Object.values(CHARACTERS);
}
