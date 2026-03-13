// HUD - Heads-up display controller
class HUD {
  constructor(stateManager) {
    this.stateManager = stateManager;

    // Elements
    this.missionTitle = document.querySelector('.mission-title .glitch');
    this.levelNumber = document.getElementById('level-number');
    this.timer = document.getElementById('timer');
    this.missionStory = document.getElementById('mission-story');
    this.objectivesList = document.getElementById('objectives-list');
    this.hintsList = document.getElementById('hints-list');
    this.commandHistory = document.getElementById('command-history');
    this.statCommands = document.getElementById('stat-commands');
    this.statEfficiency = document.getElementById('stat-efficiency');
    this.modeIndicator = document.getElementById('mode-indicator');
    this.keySequence = document.getElementById('key-sequence');
    this.cursorPosition = document.getElementById('cursor-position');
    this.progressIndicator = document.getElementById('progress-indicator');

    this.timerInterval = null;

    this.setupListeners();
  }

  setupListeners() {
    // Listen to mission state changes
    this.stateManager.on('missionStateChange', (missionState) => {
      this.updateObjectives();
      this.updateProgress();
    });

    // Listen to vim state changes
    this.stateManager.on('vimStateChange', (vimState) => {
      this.updateVimInfo(vimState);
    });

    // Listen to stats updates
    this.stateManager.on('statsUpdate', (stats) => {
      this.updateStats();
    });

    // Listen to objective completions
    this.stateManager.on('objectiveComplete', (objId) => {
      this.flashObjective(objId);
    });

    // Listen to active objective changes
    this.stateManager.on('activeObjectiveChange', (objId) => {
      this.updateObjectives();
      this.updateCurrentHint();
    });
  }

  // Update level display
  updateLevel(level) {
    if (this.missionTitle && level) {
      this.missionTitle.textContent = level.title;
      this.missionTitle.setAttribute('data-text', level.title);
    }

    if (this.levelNumber && level) {
      const levelNum = (level.id + 1).toString().padStart(2, '0');
      this.levelNumber.textContent = `LEVEL ${levelNum}`;
    }

    if (this.missionStory && level) {
      // Use resolved story (path-aware) if storyManager is available
      const story = (typeof storyManager !== 'undefined')
        ? storyManager.resolveLevelStory(level)
        : level.story;
      this.missionStory.innerHTML = `
        <p>${story.briefing}</p>
      `;
    }

    // Set the par value for efficiency calculation
    if (level && level.par) {
      this.setCurrentPar(level.par);
    }

    this.updateObjectives();
    this.updateHints();
  }

  // Update objectives display with active objective highlighting
  updateObjectives() {
    const state = this.stateManager.getState();
    const { objectives, completedObjectives, activeObjectiveId } = state.missionState;

    if (!this.objectivesList) return;

    this.objectivesList.innerHTML = objectives.map(obj => {
      const isCompleted = completedObjectives.includes(obj.id);
      const isActive = obj.id === activeObjectiveId || obj.active;

      let statusClass = 'pending';
      if (isCompleted) {
        statusClass = 'completed';
      } else if (isActive) {
        statusClass = 'active';
      }

      return `
        <div class="objective-item ${statusClass}" data-obj-id="${obj.id}">
          <div class="objective-checkbox"></div>
          <div class="objective-text">${obj.description}</div>
        </div>
      `;
    }).join('');
  }

  // Flash objective on completion with celebration effect
  flashObjective(objId) {
    const objElement = document.querySelector(`[data-obj-id="${objId}"]`);
    if (objElement) {
      objElement.classList.add('success-flash');
      setTimeout(() => {
        objElement.classList.remove('success-flash');
      }, 500);
    }

    // Add screen flash effect
    const flash = document.createElement('div');
    flash.className = 'objective-complete-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 500);
  }

  // Update hints - show the current objective task and hint
  updateHints() {
    const state = this.stateManager.getState();
    const { objectives, activeObjectiveId, completedObjectives } = state.missionState;

    if (!this.hintsList) return;

    // Find the active objective
    const activeObj = objectives.find(obj =>
      obj.id === activeObjectiveId || obj.active
    );

    if (activeObj) {
      // Find the hint from the hints array
      const objIndex = objectives.findIndex(obj => obj.id === activeObj.id);
      const hints = state.missionState.hints || [];
      const currentHint = hints[objIndex];

      // Show the current task with clear formatting
      this.hintsList.innerHTML = `
        <div class="hint-item current-task">
          <div class="task-label">YOUR TASK:</div>
          <div class="task-description">${activeObj.description}</div>
          ${currentHint ? `<div class="task-hint"><span class="hint-icon">💡</span> ${currentHint}</div>` : ''}
        </div>
      `;
    } else if (completedObjectives.length === objectives.length && objectives.length > 0) {
      this.hintsList.innerHTML = `
        <div class="hint-item completed-hint">
          <strong>All objectives complete!</strong>
        </div>
      `;
    } else {
      this.hintsList.innerHTML = '';
    }
  }

  // Update current hint when active objective changes
  updateCurrentHint() {
    this.updateHints();
  }

  // Update vim-related info
  updateVimInfo(vimState) {
    if (!vimState) return;

    // Mode indicator
    if (this.modeIndicator) {
      const modeText = `-- ${vimState.mode} --`;
      this.modeIndicator.textContent = modeText;
    }

    // Key sequence
    if (this.keySequence) {
      this.keySequence.textContent = vimState.keySequence || '';
    }

    // Cursor position
    if (this.cursorPosition) {
      this.cursorPosition.textContent = `Line ${vimState.cursor.line + 1}, Col ${vimState.cursor.col}`;
    }
  }

  // Add command to history
  addCommand(command) {
    if (!this.commandHistory) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const entry = document.createElement('div');
    entry.className = 'command-entry';
    entry.innerHTML = `
      <span class="command-time">${time}</span>
      <span class="command-text">${this.formatCommand(command)}</span>
    `;

    this.commandHistory.insertBefore(entry, this.commandHistory.firstChild);

    // Keep only last 10 commands
    while (this.commandHistory.children.length > 10) {
      this.commandHistory.removeChild(this.commandHistory.lastChild);
    }
  }

  // Format command for display
  formatCommand(command) {
    if (!command.action) return 'Unknown';

    if (command.action === 'motion') {
      return `${command.count > 1 ? command.count : ''}${command.motion}`;
    }

    if (command.action === 'line') {
      return `${command.operator}${command.operator}`;
    }

    if (command.action === 'operatorMotion') {
      return `${command.operator}${command.motion}`;
    }

    return command.action;
  }

  // Update stats
  updateStats() {
    const state = this.stateManager.getState();
    const commands = state.playerStats.totalCommands;

    if (this.statCommands) {
      this.statCommands.textContent = commands;
    }

    if (this.statEfficiency) {
      // Efficiency based on par (minimum expected commands)
      // If at or under par: 100%. Over par: decreases proportionally
      const par = this.currentPar || 10;
      const efficiency = commands <= par ? 100 : Math.round(100 * par / commands);
      this.statEfficiency.textContent = `${efficiency}%`;
    }
  }

  // Set the current level's par value
  setCurrentPar(par) {
    this.currentPar = par;
  }

  // Update progress indicator
  updateProgress() {
    const state = this.stateManager.getState();
    const { objectives, completedObjectives } = state.missionState;

    if (this.progressIndicator) {
      this.progressIndicator.textContent = `Objectives: ${completedObjectives.length}/${objectives.length}`;
    }
  }

  // Start timer
  startTimer() {
    this.stopTimer();

    this.timerInterval = setInterval(() => {
      const elapsed = this.stateManager.getElapsedTime();
      if (this.timer) {
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        this.timer.textContent = `${minutes}:${seconds}`;
      }
    }, 1000);
  }

  // Stop timer
  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}
