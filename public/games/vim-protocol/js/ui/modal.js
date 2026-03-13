// Modal - Modal dialog controller with keyboard support, images, and story choices
class Modal {
  constructor() {
    this.overlay = document.getElementById('modal-overlay');
    this.title = document.getElementById('modal-title');
    this.body = document.getElementById('modal-body');
    this.button = document.getElementById('modal-btn');

    this.onButtonClick = null;
    this.currentCharacter = null;
    this.keyHandler = null;

    // Verify elements exist
    if (!this.overlay || !this.button) {
      console.error('Modal: Required elements not found in DOM');
      return;
    }

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Button click handler
    this.button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.triggerButton();
    });

    // Close on overlay click (but not on content click)
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.triggerButton();
      }
    });
  }

  // Trigger button action
  triggerButton() {
    // Guard: prevent double-fire (Enter key on focused button fires both keydown AND click)
    if (!this.isVisible()) return;
    if (this._triggering) return;
    this._triggering = true;

    console.log('[MODAL] triggerButton fired, has callback:', !!this.onButtonClick);

    // Capture and clear callback to prevent any double-execution
    const callback = this.onButtonClick;
    this.onButtonClick = null;

    // Hide the modal FIRST, then call the callback
    this.hide();

    // Call callback synchronously (no setTimeout delay)
    try {
      if (callback) {
        callback();
      }
    } catch (err) {
      console.error('[MODAL] Callback error:', err);
    }

    // Reset the re-entrance guard after the current event cycle
    // This prevents the Enter key's click event from re-triggering on a NEW modal
    setTimeout(() => { this._triggering = false; }, 0);
  }

  // Enable keyboard controls
  enableKeyboard() {
    this.keyHandler = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.triggerButton();
      }
    };
    document.addEventListener('keydown', this.keyHandler);
  }

  // Disable keyboard controls
  disableKeyboard() {
    if (this.keyHandler) {
      document.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }
  }

  // Show mission briefing with character intro and optional image
  showMissionBriefing(level, story, onStart) {
    // Use resolved story (path-aware) passed from game.js
    const resolvedStory = story || level.story;
    const teachingChar = resolvedStory?.character || 'zero';
    const character = CHARACTERS[teachingChar];
    this.currentCharacter = character;

    this.title.textContent = level.title;
    this.title.style.color = character ? character.color : '#9d4edd';

    // Build character header if available
    const charHeader = character ? `
      <div class="modal-character-header" style="border-color: ${character.color}">
        <div class="modal-char-avatar" style="color: ${character.color}">
          ${character.avatar.join('<br>')}
        </div>
        <div class="modal-char-info">
          <div class="modal-char-name" style="color: ${character.color}">${character.name}</div>
          <div class="modal-char-title">${character.title}</div>
        </div>
      </div>
    ` : '';

    // Build story image if present
    const storyImage = resolvedStory?.image ? `
      <div class="story-image">
        <img src="${resolvedStory.image}" alt="Mission briefing">
      </div>
    ` : '';

    const briefingText = resolvedStory?.briefing || 'Complete the objectives to proceed.';
    const contextText = resolvedStory?.context || '';

    this.body.innerHTML = `
      ${storyImage}
      ${charHeader}
      <div class="mission-story">
        <p>${briefingText}</p>
        ${contextText ? `<p style="margin-top: 15px;">${contextText}</p>` : ''}
      </div>
      <div class="objectives-section">
        <div class="section-title">MISSION OBJECTIVES:</div>
        <div class="objectives-list">
          ${level.objectives.map((obj, index) => `
            <div class="objective-item ${index === 0 ? 'active' : 'pending'}">
              <div class="objective-checkbox"></div>
              <div class="objective-text">${obj.description}</div>
            </div>
          `).join('')}
        </div>
      </div>
      ${level.commandsFocus ? `
        <div class="commands-focus">
          <div class="section-title">COMMANDS TO LEARN:</div>
          <div class="command-keys">
            ${level.commandsFocus.map(cmd => `<span class="command-key">${cmd}</span>`).join('')}
          </div>
        </div>
      ` : ''}
      ${this._buildPriorSkills(level)}
    `;

    this.button.textContent = 'START MISSION [Enter]';
    this.button.style.borderColor = character ? character.color : '#9d4edd';
    this.button.style.color = character ? character.color : '#9d4edd';
    this.button.style.display = '';
    this.onButtonClick = onStart;

    this.show();
  }

  // Build the "prior skills" reminder shown in mission briefings for level 2+
  _buildPriorSkills(level) {
    if (level.id === 0) return '';

    // Collect commands from the previous level (or two, for review levels)
    const prevLevel = typeof LEVELS !== 'undefined'
      ? LEVELS.find(l => l.id === level.id - 1)
      : null;

    if (!prevLevel || !prevLevel.commandsFocus) return '';

    const keys = prevLevel.commandsFocus;

    return `
      <div class="prior-skills-section">
        <div class="prior-skills-label">Also uses from last mission:</div>
        <div class="prior-skills-keys">
          ${keys.map(k => `<span class="prior-skill-key">${k}</span>`).join('')}
        </div>
        <div class="prior-skills-hint">Open SKILL LOG anytime for your full command reference.</div>
      </div>
    `;
  }

  // Show level complete with character celebration and optional image
  showLevelComplete(level, stats, story, onNext) {
    const resolvedStory = story || level.story;
    const celebrators = ['zero', 'byte', 'blade'];
    const celebratorId = celebrators[Math.floor(Math.random() * celebrators.length)];
    const character = CHARACTERS[celebratorId];
    const quote = getCharacterQuote(celebratorId, 'levelComplete');

    this.title.textContent = 'MISSION COMPLETE';
    this.title.style.color = '#39ff14';

    const completionMessage = resolvedStory?.completion || 'Excellent work, operative.';

    // Build completion image if present
    const completionImage = resolvedStory?.completionImage ? `
      <div class="story-image completion-image">
        <img src="${resolvedStory.completionImage}" alt="Mission complete">
      </div>
    ` : '';

    this.body.innerHTML = `
      <div class="level-complete">
        <h2 class="success-text">SUCCESS</h2>
        <div class="level-complete-message">
          ${completionMessage}
        </div>
        ${completionImage}
        ${character ? `
          <div class="celebration-quote" style="border-color: ${character.color}">
            <span class="quote-char" style="color: ${character.color}">${character.name}:</span>
            <span class="quote-text">"${quote}"</span>
          </div>
        ` : ''}
        <div class="level-stats">
          <div class="level-stat">
            <div class="level-stat-label">Time</div>
            <div class="level-stat-value">${stats.time}s</div>
          </div>
          <div class="level-stat">
            <div class="level-stat-label">Commands</div>
            <div class="level-stat-value">${stats.commands}</div>
          </div>
          <div class="level-stat">
            <div class="level-stat-label">Efficiency</div>
            <div class="level-stat-value">${stats.efficiency}%</div>
          </div>
        </div>
      </div>
    `;

    const buttonText = onNext ? 'NEXT MISSION [Enter]' : 'COMPLETE [Enter]';
    this.button.textContent = buttonText;
    this.button.style.borderColor = '#39ff14';
    this.button.style.color = '#39ff14';
    this.button.style.display = '';
    this.onButtonClick = onNext;

    this.show();
  }

  // Show story path choice modal - player chooses between Robot and Ninja
  showStoryChoice(onChoose) {
    this.title.textContent = 'CRITICAL DECISION';
    this.title.style.color = '#ff6b6b';

    // Disable normal keyboard/button behavior for this special modal
    this.disableKeyboard();
    this.button.style.display = 'none';

    this.body.innerHTML = `
      <div class="story-choice">
        <div class="choice-intro">
          <p class="choice-alert">INCOMING TRANSMISSION FROM ZERO:</p>
          <p class="choice-message">
            "We've intercepted conflicting intel. One of our operatives is secretly working for NEXUS.
            Both BYTE and BLADE have presented evidence against each other.
            You must decide who to trust. This choice will determine everything."
          </p>
        </div>

        <div class="choice-options">
          <div class="choice-card" data-choice="robot">
            <div class="choice-image">
              <img src="images/robot_happy.jpeg" alt="BYTE the Robot">
            </div>
            <div class="choice-info">
              <div class="choice-name" style="color: #00d4ff;">TRUST BYTE</div>
              <div class="choice-title">The AI Construct</div>
              <div class="choice-desc">
                "My analysis is clear. BLADE has been transmitting encrypted data to NEXUS servers.
                I have the logs. Trust my calculations."
              </div>
            </div>
          </div>

          <div class="choice-vs">VS</div>

          <div class="choice-card" data-choice="ninja">
            <div class="choice-image">
              <img src="images/ninja.jpeg" alt="BLADE the Ninja">
            </div>
            <div class="choice-info">
              <div class="choice-name" style="color: #ff1493;">TRUST BLADE</div>
              <div class="choice-title">The Shadow Operative</div>
              <div class="choice-desc">
                "The robot's code has been compromised. I found NEXUS subroutines buried in its neural network.
                I've seen this before. Trust your instincts."
              </div>
            </div>
          </div>
        </div>

        <div class="choice-warning">
          This choice cannot be undone. Choose wisely.
        </div>
      </div>
    `;

    // Add click handlers to choice cards
    this.body.querySelectorAll('.choice-card').forEach(card => {
      card.addEventListener('click', () => {
        const choice = card.dataset.choice;
        // Visual feedback
        card.classList.add('chosen');
        this.body.querySelectorAll('.choice-card').forEach(c => {
          if (c !== card) c.classList.add('rejected');
        });

        // Delay to show the selection, then trigger callback
        setTimeout(() => {
          this.button.style.display = '';
          this.hide();
          if (onChoose) onChoose(choice);
        }, 800);
      });
    });

    this.show();
  }

  // Show generic modal
  showCustom(title, content, buttonText, onButtonClick) {
    this.title.textContent = title;
    this.title.style.color = '#9d4edd';
    this.body.innerHTML = content;
    this.button.textContent = buttonText + ' [Enter]';
    this.button.style.borderColor = '#9d4edd';
    this.button.style.color = '#9d4edd';
    this.button.style.display = '';
    this.onButtonClick = onButtonClick;

    this.show();
  }

  // Show level select/overview modal
  showLevelSelect(levels, completedLevels, currentLevel, onSelectLevel, onClose) {
    this.title.textContent = 'MISSION SELECT';
    this.title.style.color = '#9d4edd';

    // Group levels by act
    const acts = [
      { name: 'ACT 1: INITIATION', levels: levels.slice(0, 5) },
      { name: 'ACT 2: INFILTRATION', levels: levels.slice(5, 12) },
      { name: 'ACT 3: ESCALATION', levels: levels.slice(12, 17) },
      { name: 'ACT 4: BLACKOUT', levels: levels.slice(17, 20) }
    ];

    // Determine highest unlocked level (completed + 1, or 0)
    const highestUnlocked = completedLevels.length > 0
      ? Math.max(...completedLevels) + 1
      : 0;

    let content = `
      <div class="level-select-container">
        <p class="level-select-info">Select a mission to replay or continue your progress.</p>
        <p class="level-select-progress">Progress: ${completedLevels.length}/${levels.length} missions complete</p>
    `;

    acts.forEach((act, actIndex) => {
      content += `
        <div class="level-act">
          <div class="act-header">${act.name}</div>
          <div class="level-grid">
      `;

      act.levels.forEach((level) => {
        const isCompleted = completedLevels.includes(level.id);
        const isUnlocked = level.id <= highestUnlocked;
        const isCurrent = level.id === currentLevel;
        let statusClass = 'locked';
        let statusIcon = '🔒';

        if (isCompleted) {
          statusClass = 'completed';
          statusIcon = '✓';
        } else if (isUnlocked) {
          statusClass = 'unlocked';
          statusIcon = '▶';
        }

        if (isCurrent) {
          statusClass += ' current';
        }

        content += `
          <div class="level-card ${statusClass}" data-level-id="${level.id}" ${isUnlocked ? 'data-selectable="true"' : ''}>
            <div class="level-number">LEVEL ${(level.id + 1).toString().padStart(2, '0')}</div>
            <div class="level-title-small">${level.title.replace('OPERATION: ', '')}</div>
            <div class="level-status">${statusIcon}</div>
            <div class="level-commands">
              ${level.commandsFocus.slice(0, 4).map(cmd => `<span class="cmd-tag">${cmd}</span>`).join('')}
              ${level.commandsFocus.length > 4 ? `<span class="cmd-more">+${level.commandsFocus.length - 4}</span>` : ''}
            </div>
          </div>
        `;
      });

      content += `
          </div>
        </div>
      `;
    });

    content += '</div>';
    this.body.innerHTML = content;

    // Add click handlers to selectable level cards
    this.body.querySelectorAll('[data-selectable="true"]').forEach(card => {
      card.addEventListener('click', () => {
        const levelId = parseInt(card.dataset.levelId);
        this.hide();
        if (onSelectLevel) {
          onSelectLevel(levelId);
        }
      });
    });

    this.button.textContent = 'CLOSE [Enter]';
    this.button.style.borderColor = '#9d4edd';
    this.button.style.color = '#9d4edd';
    this.button.style.display = '';
    this.onButtonClick = onClose || (() => {});

    this.show();
  }

  show() {
    this.overlay.classList.remove('hidden');
    this.enableKeyboard();
    setTimeout(() => this.button.focus(), 100);
  }

  hide() {
    this.overlay.classList.add('hidden');
    this.disableKeyboard();
  }

  // Check if modal is currently visible
  isVisible() {
    return this.overlay && !this.overlay.classList.contains('hidden');
  }
}
