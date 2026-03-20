// StoryManager - Handles story progression, character dialogues, and branching paths
class StoryManager {
  constructor() {
    this.currentDialogue = null;
    this.dialogueQueue = [];
    this.onDialogueComplete = null;
    // Story path: null = not chosen, 'robot' = trust BYTE, 'ninja' = trust BLADE
    this.storyPath = null;
    this.storyProgress = {
      hasJoinedCrew: false,
      choiceMade: false,
      nexusDefeated: false
    };
  }

  // Set the chosen story path
  setStoryPath(path) {
    this.storyPath = path;
    this.storyProgress.choiceMade = true;
  }

  // Get the current story path
  getStoryPath() {
    return this.storyPath;
  }

  // Resolve story content for a level based on current path
  // Returns the merged story object with path-specific overrides applied
  resolveLevelStory(level) {
    const story = level.story;
    if (!story) return story;

    // If no path chosen or no path-specific content, return base story
    if (!this.storyPath || !story.paths || !story.paths[this.storyPath]) {
      return story;
    }

    // Merge path-specific overrides onto the base story
    const pathOverrides = story.paths[this.storyPath];
    return {
      ...story,
      ...pathOverrides,
      // Keep the paths object available for reference but don't let it override
      paths: story.paths
    };
  }

  // Show a character dialogue
  showDialogue(dialogueData, onComplete = null) {
    this.onDialogueComplete = onComplete;

    if (Array.isArray(dialogueData)) {
      this.dialogueQueue = [...dialogueData];
      this.showNextDialogue();
    } else {
      this.dialogueQueue = [];
      this.displayDialogue(dialogueData);
    }
  }

  // Process dialogue queue
  showNextDialogue() {
    if (this.dialogueQueue.length === 0) {
      this.hideDialogue();
      const callback = this.onDialogueComplete;
      this.onDialogueComplete = null;
      if (callback) callback();
      return;
    }

    const next = this.dialogueQueue.shift();
    this.displayDialogue(next);
  }

  // Display a single dialogue entry with typewriter animation
  displayDialogue(dialogueData) {
    const character = CHARACTERS[dialogueData.character];
    if (!character) {
      console.error('Unknown character:', dialogueData.character);
      this.showNextDialogue();
      return;
    }

    this.currentDialogue = dialogueData;

    // Cancel any running typewriter
    if (this._typewriterTimer) {
      clearInterval(this._typewriterTimer);
      this._typewriterTimer = null;
    }
    this._isAnimating = false;

    // Get or create dialogue container
    let container = document.getElementById('character-dialogue');
    if (!container) {
      container = document.createElement('div');
      container.id = 'character-dialogue';
      container.className = 'character-dialogue hidden';
      document.body.appendChild(container);
    }

    const lines = Array.isArray(dialogueData.lines)
      ? dialogueData.lines
      : (dialogueData.lines ? [dialogueData.lines] : [dialogueData.line || '']);

    const isLast = this.dialogueQueue.length === 0;
    const continueLabel = isLast ? 'OK [Enter]' : 'CONTINUE [Enter]';

    // Portrait: use explicit image, then character default image, then ascii avatar
    const portraitSrc = dialogueData.image || character.image || null;
    const portraitHtml = portraitSrc
      ? `<img class="dialogue-portrait-img" src="${portraitSrc}" alt="${character.name}">`
      : `<div class="dialogue-avatar" style="color: ${character.color}">${character.avatar.join('<br>')}</div>`;

    container.innerHTML = `
      <div class="dialogue-bar" style="--char-color: ${character.color}; border-color: ${character.color}">
        <div class="dialogue-portrait">
          ${portraitHtml}
          <div class="dialogue-name" style="color: ${character.color}">${character.name}</div>
          <div class="dialogue-char-title">${character.title}</div>
        </div>
        <div class="dialogue-body">
          <div class="dialogue-text" id="dialogue-text-output"></div>
          <div class="dialogue-continue hidden" id="dialogue-continue-hint">${continueLabel}</div>
        </div>
      </div>
    `;

    container.classList.remove('hidden');

    // Click anywhere on bar to skip/advance
    container.querySelector('.dialogue-bar').addEventListener('click', () => {
      this._handleDialogueAdvance();
    });

    // Keyboard handler
    if (this.keyHandler) {
      document.removeEventListener('keydown', this.keyHandler);
    }
    this.keyHandler = (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        this._handleDialogueAdvance();
      }
    };
    document.addEventListener('keydown', this.keyHandler);

    // Start typewriter
    this._startTypewriter(lines, () => {
      const hint = document.getElementById('dialogue-continue-hint');
      if (hint) hint.classList.remove('hidden');
    });
  }

  // Handle Enter/click: skip animation if running, else advance
  _handleDialogueAdvance() {
    if (this._isAnimating) {
      this._skipAnimation();
    } else {
      if (this._advancing) return;
      this._advancing = true;
      this.showNextDialogue();
      setTimeout(() => { this._advancing = false; }, 0);
    }
  }

  // Typewriter animation — types all lines sequentially
  _startTypewriter(lines, onComplete) {
    const output = document.getElementById('dialogue-text-output');
    if (!output) return;

    this._isAnimating = true;
    this._typewriterLines = lines;
    this._typewriterOnComplete = onComplete;

    // Build flat character list with HTML markers for line breaks
    this._typewriterChars = [];
    lines.forEach((line, i) => {
      // Each character in the line
      for (const ch of line) {
        this._typewriterChars.push({ type: 'char', value: ch });
      }
      // Paragraph break between lines (not after last)
      if (i < lines.length - 1) {
        this._typewriterChars.push({ type: 'break' });
      }
    });

    this._typewriterIndex = 0;
    this._typewriterBuilt = '';

    this._typewriterTimer = setInterval(() => {
      if (this._typewriterIndex >= this._typewriterChars.length) {
        clearInterval(this._typewriterTimer);
        this._typewriterTimer = null;
        this._isAnimating = false;
        output.innerHTML = this._typewriterBuilt;
        if (onComplete) onComplete();
        return;
      }

      const item = this._typewriterChars[this._typewriterIndex];
      if (item.type === 'break') {
        this._typewriterBuilt += '<br><br>';
      } else {
        // Escape HTML entities
        const ch = item.value;
        this._typewriterBuilt += ch === '&' ? '&amp;'
          : ch === '<' ? '&lt;'
          : ch === '>' ? '&gt;'
          : ch;
      }
      this._typewriterIndex++;

      output.innerHTML = this._typewriterBuilt + '<span class="dialogue-cursor">▋</span>';
    }, 18);
  }

  // Skip animation: show full text immediately
  _skipAnimation() {
    if (this._typewriterTimer) {
      clearInterval(this._typewriterTimer);
      this._typewriterTimer = null;
    }
    this._isAnimating = false;

    const output = document.getElementById('dialogue-text-output');
    if (output && this._typewriterLines) {
      output.innerHTML = this._typewriterLines.map(l =>
        l.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      ).join('<br><br>');
    }

    const hint = document.getElementById('dialogue-continue-hint');
    if (hint) hint.classList.remove('hidden');

    if (this._typewriterOnComplete) {
      this._typewriterOnComplete();
      this._typewriterOnComplete = null;
    }
  }

  // Hide dialogue
  hideDialogue() {
    // Cancel any running animation
    if (this._typewriterTimer) {
      clearInterval(this._typewriterTimer);
      this._typewriterTimer = null;
    }
    this._isAnimating = false;

    const container = document.getElementById('character-dialogue');
    if (container) container.classList.add('hidden');

    if (this.keyHandler) {
      document.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }

    this.currentDialogue = null;
  }

  // Show a quick character reaction (small popup, auto-dismisses)
  showReaction(characterId, text, duration = 3000) {
    const character = CHARACTERS[characterId];
    if (!character) return;

    // Get or create reaction container
    let container = document.getElementById('character-reaction');
    if (!container) {
      container = document.createElement('div');
      container.id = 'character-reaction';
      container.className = 'character-reaction hidden';
      document.body.appendChild(container);
    }

    container.innerHTML = `
      <div class="reaction-box" style="border-color: ${character.color}">
        <span class="reaction-name" style="color: ${character.color}">${character.name}:</span>
        <span class="reaction-text">"${text}"</span>
      </div>
    `;

    container.classList.remove('hidden');
    container.classList.add('show');

    // Auto-dismiss
    setTimeout(() => {
      container.classList.remove('show');
      container.classList.add('hidden');
    }, duration);
  }

  // Get story-appropriate reaction for objective completion
  getObjectiveReaction(objectiveData) {
    if (objectiveData.onComplete) {
      return objectiveData.onComplete;
    }

    // Default random reactions based on commands taught
    const reactors = ['byte', 'blade'];
    const character = reactors[Math.floor(Math.random() * reactors.length)];
    const quote = getCharacterQuote(character, 'success');

    return { character, line: quote };
  }

  // Show pre-level dialogue
  showLevelIntro(level, onComplete) {
    const story = this.resolveLevelStory(level);
    if (story && story.preDialog) {
      this.showDialogue(story.preDialog, onComplete);
    } else {
      // Default intro
      this.showDialogue({
        character: 'zero',
        lines: [
          `Mission: ${level.title}`,
          story?.context || 'Complete all objectives to proceed.'
        ]
      }, onComplete);
    }
  }

  // Show post-level dialogue
  showLevelComplete(level, onComplete) {
    const story = this.resolveLevelStory(level);
    if (story && story.postDialog) {
      this.showDialogue(story.postDialog, onComplete);
    } else {
      // Default completion
      const quote = getCharacterQuote('zero', 'levelComplete');
      this.showDialogue({
        character: 'zero',
        lines: [quote]
      }, onComplete);
    }
  }

  // Update story progress flags
  updateStoryProgress(flag, value = true) {
    this.storyProgress[flag] = value;
  }

  // Check story progress
  hasProgress(flag) {
    return this.storyProgress[flag] || false;
  }

  // Get character for teaching specific commands
  getTeachingCharacter(commands) {
    const teacherMap = {
      // Movement - ZERO teaches fundamentals
      'h': 'zero', 'j': 'zero', 'k': 'zero', 'l': 'zero',
      'w': 'zero', 'b': 'zero', 'e': 'zero',
      '0': 'zero', '$': 'zero', '^': 'zero',
      'gg': 'zero', 'G': 'zero',

      // Finding/Search - BLADE (ninja precision targeting)
      'f': 'blade', 'F': 'blade', 't': 'blade', 'T': 'blade',
      '/': 'blade', '?': 'blade', 'n': 'blade', 'N': 'blade',

      // Deletion - BLADE (surgical strikes)
      'x': 'blade', 'X': 'blade',
      'd': 'blade', 'dd': 'blade', 'dw': 'blade', 'D': 'blade',

      // Insert/Change - BYTE (data injection)
      'i': 'byte', 'I': 'byte', 'a': 'byte', 'A': 'byte',
      'o': 'byte', 'O': 'byte',
      'c': 'byte', 'cc': 'byte', 'cw': 'byte', 'C': 'byte',

      // Yank/Paste - BYTE (data copying)
      'y': 'byte', 'yy': 'byte', 'p': 'byte', 'P': 'byte',

      // Undo/Redo - BYTE
      'u': 'byte',

      // Visual mode - SHELL (old-school)
      'v': 'shell', 'V': 'shell',

      // Macros - SHELL (automation veteran)
      'q': 'shell', '@': 'shell'
    };

    for (const cmd of commands) {
      if (teacherMap[cmd]) {
        return teacherMap[cmd];
      }
    }

    return 'zero';
  }
}

// Create global instance
const storyManager = new StoryManager();
