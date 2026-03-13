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
      // Multiple dialogue entries (conversation)
      this.dialogueQueue = [...dialogueData];
      this.showNextDialogue();
    } else {
      // Single dialogue entry
      this.displayDialogue(dialogueData);
    }
  }

  // Process dialogue queue
  showNextDialogue() {
    if (this.dialogueQueue.length === 0) {
      this.hideDialogue();
      // Capture and clear callback to prevent double-execution
      const callback = this.onDialogueComplete;
      this.onDialogueComplete = null;
      if (callback) {
        callback();
      }
      return;
    }

    const next = this.dialogueQueue.shift();
    this.displayDialogue(next);
  }

  // Display a single dialogue on screen
  displayDialogue(dialogueData) {
    const character = CHARACTERS[dialogueData.character];
    if (!character) {
      console.error('Unknown character:', dialogueData.character);
      this.showNextDialogue();
      return;
    }

    this.currentDialogue = dialogueData;

    // Get or create dialogue container
    let container = document.getElementById('character-dialogue');
    if (!container) {
      container = document.createElement('div');
      container.id = 'character-dialogue';
      container.className = 'character-dialogue hidden';
      document.body.appendChild(container);
    }

    // Build dialogue HTML
    const lines = Array.isArray(dialogueData.lines)
      ? dialogueData.lines
      : [dialogueData.lines];

    // Check if this dialogue has an image
    const imageHtml = dialogueData.image
      ? `<div class="dialogue-image"><img src="${dialogueData.image}" alt="${character.name}"></div>`
      : '';

    container.innerHTML = `
      <div class="dialogue-box" style="border-color: ${character.color}">
        ${imageHtml}
        <div class="dialogue-character">
          <div class="character-avatar" style="color: ${character.color}">
            ${character.avatar.join('<br>')}
          </div>
          <div class="character-info">
            <div class="character-name" style="color: ${character.color}">${character.name}</div>
            <div class="character-title">${character.title}</div>
          </div>
        </div>
        <div class="dialogue-content">
          ${lines.map(line => `<p>${line}</p>`).join('')}
        </div>
        <div class="dialogue-continue">
          <button class="dialogue-btn" style="border-color: ${character.color}; color: ${character.color}">
            ${this.dialogueQueue.length > 0 ? 'CONTINUE [Enter]' : 'OK [Enter]'}
          </button>
        </div>
      </div>
    `;

    // Show container
    container.classList.remove('hidden');

    // Add click handler
    const btn = container.querySelector('.dialogue-btn');
    btn.onclick = () => this.showNextDialogue();

    // Clean up old keyboard handler before adding new one (prevents leaked handlers)
    if (this.keyHandler) {
      document.removeEventListener('keydown', this.keyHandler);
    }

    // Also allow keyboard continue (with re-entrance guard)
    this.keyHandler = (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        if (this._advancing) return;
        this._advancing = true;
        this.showNextDialogue();
        setTimeout(() => { this._advancing = false; }, 0);
      }
    };
    document.addEventListener('keydown', this.keyHandler);

    // Focus the button for accessibility
    setTimeout(() => btn.focus(), 100);
  }

  // Hide dialogue
  hideDialogue() {
    const container = document.getElementById('character-dialogue');
    if (container) {
      container.classList.add('hidden');
    }

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
