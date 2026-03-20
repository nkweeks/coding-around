// Game - Main game controller with story integration and branching paths
class Game {
  constructor() {
    this.stateManager = null;
    this.vim = null;
    this.validator = null;
    this.levelManager = null;
    this.hud = null;
    this.modal = null;
    this.storage = null;
    // The level after which the story choice is presented (end of Act 2)
    this.CHOICE_AFTER_LEVEL = 11;
  }

  // Initialize game
  init() {

    // Initialize core systems
    this.storage = new Storage();
    this.stateManager = new StateManager();

    // Initialize vim simulator
    const editorContainer = document.getElementById('vim-editor');
    this.vim = new VimSimulator(editorContainer);

    // Initialize validator and level manager
    this.validator = new MissionValidator(this.stateManager);
    this.levelManager = new LevelManager(this.vim, this.stateManager, this.validator);

    // Initialize UI components
    this.hud = new HUD(this.stateManager);
    this.modal = new Modal();
    this.skillLog = new SkillLog();

    // Setup event listeners
    this.setupEventListeners();

    // Start game
    this.startGame();
  }

  // Setup event listeners
  setupEventListeners() {
    // Listen to vim state changes
    this.vim.on('stateChange', (vimState) => {
      this.stateManager.setVimState(vimState);
      this.validator.validate(vimState);
    });

    // Listen to command execution
    this.vim.on('commandExecuted', (command) => {
      this.stateManager.incrementCommands();
      this.hud.addCommand(command);
    });

    // Listen to level completion
    this.stateManager.on('levelComplete', () => {
      this.handleLevelComplete();
    });

    // Listen to objective completion - show character reaction
    this.stateManager.on('objectiveComplete', (objId) => {
      this.showObjectiveReaction(objId);
    });

    // Listen for custom objective complete events (from validator)
    document.addEventListener('objectiveComplete', (e) => {
      if (e.detail && e.detail.feedback) {
        const { character, line } = e.detail.feedback;
        if (character && line) {
          storyManager.showReaction(character, line, 3500);
        }
      }
    });

    // Menu button click - show level select
    const menuBtn = document.getElementById('menu-btn');
    if (menuBtn) {
      menuBtn.addEventListener('click', () => {
        this.showLevelSelect();
      });
    }

    // Home button click - return to main menu
    const homeBtn = document.getElementById('home-btn');
    if (homeBtn) {
      homeBtn.addEventListener('click', () => {
        this.vim.blur();
        this.modal.hide();
        this.hud.stopTimer();
        this.showMainMenu();
      });
    }

  }

  // Show character reaction when objective is completed
  showObjectiveReaction(objId) {
    const level = this.levelManager.getCurrentLevel();
    if (!level) return;

    const objective = level.objectives.find(obj => obj.id === objId);
    if (objective && objective.onComplete) {
      const { character, line } = objective.onComplete;
      storyManager.showReaction(character, line, 3500);
    }
  }

  // Start game - show main menu
  startGame() {
    // Restore story path from saved data
    const saveData = this.storage.load();
    if (saveData && saveData.storyPath) {
      storyManager.setStoryPath(saveData.storyPath);
    }
    this.showMainMenu();
  }

  // Show the main menu
  showMainMenu() {
    const mainMenu = document.getElementById('main-menu');
    const newGameBtn = document.getElementById('menu-new-game');
    const continueBtn = document.getElementById('menu-continue');
    const levelSelectBtn = document.getElementById('menu-level-select');
    const progressSpan = document.getElementById('menu-progress');

    if (!mainMenu) return;

    // Check for saved progress
    const saveData = this.storage.load();
    const hasProgress = saveData && saveData.levelsCompleted && saveData.levelsCompleted.length > 0;

    if (hasProgress) {
      this.stateManager.setState({
        levelsCompleted: saveData.levelsCompleted || []
      });
      continueBtn.classList.remove('hidden');
      progressSpan.textContent = `${saveData.levelsCompleted.length}/${LEVELS.length} complete`;
    }

    // Show the menu
    mainMenu.classList.remove('hidden');

    // Button handlers
    newGameBtn.onclick = () => {
      this.storage.clear();
      storyManager.setStoryPath(null);
      storyManager.storyPath = null;
      this.stateManager.setState({ levelsCompleted: [] });
      this.hideMainMenu();
      this.loadLevel(0);
    };

    continueBtn.onclick = () => {
      if (hasProgress) {
        // Restore story path
        if (saveData.storyPath) {
          storyManager.setStoryPath(saveData.storyPath);
        }
        const highestCompleted = Math.max(...saveData.levelsCompleted);
        const continueLevel = Math.min(highestCompleted + 1, LEVELS.length - 1);
        this.hideMainMenu();
        this.loadLevel(continueLevel);
      }
    };

    levelSelectBtn.onclick = () => {
      this.hideMainMenu();
      this.showLevelSelectFromMenu();
    };

    // Keyboard shortcuts
    this.menuKeyHandler = (e) => {
      if (mainMenu.classList.contains('hidden')) return;

      if (e.key.toLowerCase() === 'n') {
        newGameBtn.click();
      } else if (e.key.toLowerCase() === 'c' && hasProgress) {
        continueBtn.click();
      } else if (e.key.toLowerCase() === 'l') {
        levelSelectBtn.click();
      }
    };
    document.addEventListener('keydown', this.menuKeyHandler);
  }

  // Hide main menu
  hideMainMenu() {
    const mainMenu = document.getElementById('main-menu');
    if (mainMenu) {
      mainMenu.classList.add('hidden');
    }
    if (this.menuKeyHandler) {
      document.removeEventListener('keydown', this.menuKeyHandler);
      this.menuKeyHandler = null;
    }
  }

  // Show level select from main menu
  showLevelSelectFromMenu() {
    const saveData = this.storage.load();
    const completedLevels = saveData?.levelsCompleted || [];

    this.stateManager.setState({
      levelsCompleted: completedLevels
    });

    this.modal.showLevelSelect(
      LEVELS,
      completedLevels,
      -1,
      (levelId) => {
        this.stateManager.setState({
          playerStats: {
            totalCommands: 0,
            timeSpent: 0,
            startTime: null
          }
        });
        this.loadLevel(levelId);
      },
      () => {
        this.showMainMenu();
      }
    );
  }

  // Show continue/new game dialog
  showContinueDialog(continueLevel, completedCount) {
    this.vim.blur();

    const level = LEVELS[continueLevel];
    const levelName = level ? level.title : 'Unknown Mission';

    window._gameNewGame = () => {
      this.modal.hide();
      this.storage.clear();
      storyManager.setStoryPath(null);
      this.stateManager.setState({
        levelsCompleted: []
      });
      this.loadLevel(0);
    };

    this.modal.showCustom(
      'WELCOME BACK, AGENT',
      `
        <div class="continue-dialog">
          <p style="color: var(--text-secondary); margin-bottom: 15px;">
            Your progress has been saved.
          </p>
          <p style="margin-bottom: 20px;">
            <strong style="color: var(--neon-green);">${completedCount}/${LEVELS.length}</strong> missions complete
          </p>
          <p style="margin-bottom: 15px;">
            Next mission: <strong style="color: var(--bright-purple);">${levelName.replace('OPERATION: ', '')}</strong>
          </p>
          <p style="color: var(--text-secondary); font-size: 12px; margin-top: 15px;">
            Press CONTINUE to resume, or
            <a href="#" onclick="window._gameNewGame(); return false;" style="color: #ff6b6b;">start a new game</a>.
          </p>
        </div>
      `,
      'CONTINUE',
      () => {
        this.loadLevel(continueLevel);
      }
    );
  }

  // Show level select modal
  showLevelSelect() {
    this.vim.blur();

    const state = this.stateManager.getState();
    const completedLevels = state.levelsCompleted || [];
    const currentLevel = state.currentLevel || 0;

    this.modal.showLevelSelect(
      LEVELS,
      completedLevels,
      currentLevel,
      (levelId) => {
        this.stateManager.setState({
          playerStats: {
            totalCommands: 0,
            timeSpent: 0,
            startTime: null
          }
        });
        this.loadLevel(levelId);
      },
      () => {
        this.vim.focus();
      }
    );
  }

  // Get the resolved story for a level (applies path-specific overrides)
  getResolvedStory(level) {
    return storyManager.resolveLevelStory(level);
  }

  // Load a level with story integration
  loadLevel(levelNum) {
    const success = this.levelManager.loadLevel(levelNum);

    if (!success) {
      console.error('Failed to load level:', levelNum);
      return;
    }

    const level = this.levelManager.getCurrentLevel();
    const resolvedStory = this.getResolvedStory(level);

    // Update HUD and skill log
    this.hud.updateLevel(level);
    this.skillLog.update(level.id);

    // Blur vim when showing dialogues/modals
    this.vim.blur();

    // Show pre-dialog if exists, then show mission briefing
    if (resolvedStory && resolvedStory.preDialog) {
      storyManager.showDialogue(resolvedStory.preDialog, () => {
        this.showMissionBriefing(level);
      });
    } else {
      this.showMissionBriefing(level);
    }
  }

  // Show mission briefing modal
  showMissionBriefing(level) {
    this.vim.blur();
    const resolvedStory = this.getResolvedStory(level);

    this.modal.showMissionBriefing(level, resolvedStory, () => {
      this.stateManager.startTimer();
      this.hud.startTimer();
      this.focusVim();
    });
  }

  // Focus vim with multiple attempts for reliability
  focusVim() {
    this.vim.focus();

    setTimeout(() => {
      if (!this.vim.isActive && !this.vim.isModalOpen()) {
        this.vim.focus();
      }
    }, 100);
  }

  // Handle level completion with story
  handleLevelComplete() {
    // Prevent double-firing
    if (this._handlingLevelComplete) return;
    this._handlingLevelComplete = true;

    try {
      this.vim.blur();
      this.hud.stopTimer();

      const state = this.stateManager.getState();
      const elapsedTime = this.stateManager.getElapsedTime();
      const commands = state.playerStats.totalCommands;
      const level = this.levelManager.getCurrentLevel();
      const resolvedStory = this.getResolvedStory(level);

      const par = level.par || 10;
      const efficiency = commands <= par ? 100 : Math.round(100 * par / commands);

      const stats = {
        time: elapsedTime,
        commands: commands,
        efficiency: efficiency,
        par: par
      };

      // Mark level as completed
      this.stateManager.completeLevel();
      this.saveGame();

      const hasNext = this.levelManager.hasNextLevel();
      const justCompletedLevel = level.id;

      // Check if we need to show the story choice after this level
      const needsChoice = justCompletedLevel === this.CHOICE_AFTER_LEVEL && !storyManager.getStoryPath();

      // Callback for after the completion modal is dismissed
      const onNextAction = () => {
        this._handlingLevelComplete = false;

        try {
          if (!hasNext) {
            this.showGameComplete();
            return;
          }
          if (resolvedStory && resolvedStory.postDialog) {
            storyManager.showDialogue(resolvedStory.postDialog, () => {
              if (needsChoice) {
                this.showStoryChoice();
              } else {
                this.loadNextLevel();
              }
            });
          } else {
            if (needsChoice) {
              this.showStoryChoice();
            } else {
              this.loadNextLevel();
            }
          }
        } catch (err) {
          console.error('[LEVEL-COMPLETE] Error advancing to next level:', err);
          try { this.loadNextLevel(); } catch (e) { console.error('Fallback failed:', e); }
        }
      };

      this.modal.showLevelComplete(level, stats, resolvedStory, onNextAction);
    } catch (err) {
      console.error('[LEVEL-COMPLETE] Error in handleLevelComplete:', err);
      this._handlingLevelComplete = false;
    }
  }

  // Show the story path choice (Robot vs Ninja)
  showStoryChoice() {
    this.vim.blur();

    this.modal.showStoryChoice((choice) => {
      storyManager.setStoryPath(choice);
      this.saveGame();

      // Show confirmation dialogue based on choice
      const confirmDialogue = choice === 'robot'
        ? [
            { character: 'byte', lines: [
              "Thank you for trusting me. My analysis was correct.",
              "BLADE has been feeding NEXUS our coordinates. I have proof.",
              "Together, we will stop the traitor and complete the mission."
            ], image: '/vim-protocol/images/robot_happy.jpg' },
            { character: 'zero', lines: [
              "The choice is made. BLADE is now our primary target.",
              "Stay alert. A cornered ninja is the most dangerous kind."
            ]}
          ]
        : [
            { character: 'blade', lines: [
              "You chose wisely. The machine cannot be trusted.",
              "I found NEXUS code woven into BYTE's core processes.",
              "We must shut it down before it compromises everything."
            ], image: '/vim-protocol/images/ninja.jpg' },
            { character: 'zero', lines: [
              "So be it. BYTE is compromised. We treat it as hostile.",
              "Be careful. A corrupted AI has access to all our systems."
            ]}
          ];

      storyManager.showDialogue(confirmDialogue, () => {
        this.loadNextLevel();
      });
    });
  }

  // Load next level
  loadNextLevel() {
    const success = this.levelManager.nextLevel();

    if (success) {
      const level = this.levelManager.getCurrentLevel();
      const resolvedStory = this.getResolvedStory(level);

      this.stateManager.setState({
        playerStats: {
          totalCommands: 0,
          timeSpent: 0,
          startTime: null
        }
      });

      this.hud.updateLevel(level);
      this.skillLog.update(level.id);
      this.vim.blur();

      if (resolvedStory && resolvedStory.preDialog) {
        storyManager.showDialogue(resolvedStory.preDialog, () => {
          this.showMissionBriefing(level);
        });
      } else {
        this.showMissionBriefing(level);
      }
    } else {
      this.showGameComplete();
    }
  }

  // Show game complete screen with path-specific ending
  showGameComplete() {
    this.vim.blur();
    const path = storyManager.getStoryPath();

    let endingImage = '';
    let endingMessage = '';
    let endingQuote = '';

    if (path === 'robot') {
      endingImage = '<div class="story-image ending-image"><img src="/vim-protocol/images/robot_defeats_ninja.jpg" alt="BYTE triumphs"></div>';
      endingMessage = `
        <p>BYTE's loyalty proved true. With the ninja traitor defeated,
        NEXUS surveillance is permanently disabled.</p>
        <p>BLADE's betrayal is exposed, and the shadow operative vanishes into the dark web.</p>
        <p style="margin-top: 20px; color: #00d4ff;">BYTE stands as the crew's most trusted ally.</p>
      `;
      endingQuote = `
        <div class="celebration-quote" style="border-color: #00d4ff; margin-top: 20px;">
          <span class="quote-char" style="color: #00d4ff;">BYTE:</span>
          <span class="quote-text">"Probability of mission success was always high with you on the team. Final calculation: we won."</span>
        </div>
      `;
    } else if (path === 'ninja') {
      endingImage = '<div class="story-image ending-image"><img src="/vim-protocol/images/ninja_defeats_robot.jpg" alt="BLADE triumphs"></div>';
      endingMessage = `
        <p>BLADE's instincts were right. The corrupted AI is destroyed,
        and NEXUS loses its most dangerous weapon.</p>
        <p>BYTE's circuits are wiped clean, its NEXUS programming erased forever.</p>
        <p style="margin-top: 20px; color: #ff1493;">BLADE bows in respect. The shadow has won.</p>
      `;
      endingQuote = `
        <div class="celebration-quote" style="border-color: #ff1493; margin-top: 20px;">
          <span class="quote-char" style="color: #ff1493;">BLADE:</span>
          <span class="quote-text">"The mission is complete. No traces. No loose ends. You fought well."</span>
        </div>
      `;
    } else {
      endingMessage = `
        <p>You have completed Operation Blackout.</p>
        <p>NEXUS surveillance network is permanently disabled.</p>
        <p>Millions of citizens now have their privacy restored.</p>
        <p style="margin-top: 20px; color: #9d4edd;">You are now a legend among hackers.</p>
      `;
      endingQuote = `
        <div class="celebration-quote" style="border-color: #9d4edd; margin-top: 20px;">
          <span class="quote-char" style="color: #9d4edd;">THE CREW:</span>
          <span class="quote-text">"Welcome to the hall of fame, Agent. Until next time..."</span>
        </div>
      `;
    }

    this.modal.showCustom(
      'OPERATION BLACKOUT: COMPLETE',
      `
        <div class="level-complete">
          <h2 class="success-text">CONGRATULATIONS, AGENT</h2>
          ${endingImage}
          <div class="level-complete-message">
            ${endingMessage}
          </div>
          ${endingQuote}
          <div style="margin-top: 24px; text-align: center;">
            <div style="margin-bottom: 12px;">
              <label style="
                display: block;
                font-family: 'JetBrains Mono', monospace;
                font-size: 9px;
                letter-spacing: 2px;
                color: #5a189a;
                margin-bottom: 6px;
                text-transform: uppercase;
              ">Enter your name for the certificate</label>
              <input id="cert-name-input" type="text" maxlength="40" placeholder="Agent Name"
                onkeydown="event.stopPropagation();"
                style="
                  font-family: 'JetBrains Mono', monospace;
                  font-size: 13px;
                  font-weight: bold;
                  letter-spacing: 1px;
                  padding: 8px 14px;
                  background: rgba(10, 0, 20, 0.8);
                  border: 1.5px solid #5a189a;
                  color: #00d4ff;
                  border-radius: 2px;
                  width: 220px;
                  text-align: center;
                  outline: none;
                "
                onfocus="this.style.borderColor='#9d4edd';"
                onblur="this.style.borderColor='#5a189a';"
              >
            </div>
            <button id="cert-download-btn" style="
              font-family: 'JetBrains Mono', monospace;
              font-size: 12px;
              font-weight: bold;
              letter-spacing: 1px;
              padding: 10px 22px;
              background: transparent;
              border: 1.5px solid #9d4edd;
              color: #9d4edd;
              cursor: pointer;
              text-transform: uppercase;
              border-radius: 2px;
              transition: all 0.2s;
            "
            onmouseover="this.style.background='rgba(157,78,221,0.15)';this.style.color='#c77dff';this.style.borderColor='#c77dff';"
            onmouseout="this.style.background='transparent';this.style.color='#9d4edd';this.style.borderColor='#9d4edd';"
            onclick="(new CertificateGenerator('${path}', document.getElementById('cert-name-input').value)).generate();">
              ⬇ DOWNLOAD CERTIFICATE [PDF]
            </button>
            <p style="margin-top: 8px; font-size: 10px; color: #5a189a; font-family: 'JetBrains Mono', monospace;">
              3-page cyberpunk reference — all commands &amp; story
            </p>
          </div>
        </div>
      `,
      'NEW GAME',
      () => {
        this.storage.clear();
        location.reload();
      }
    );
    // Disable keyboard so Enter/Space can't accidentally trigger NEW GAME
    // while the user is typing their name or waiting for the PDF to generate.
    // The NEW GAME button is still clickable.
    this.modal.disableKeyboard();
  }

  // Save game (includes story path)
  saveGame() {
    const state = this.stateManager.getState();

    const saveData = {
      currentLevel: state.currentLevel,
      levelsCompleted: state.levelsCompleted,
      playerStats: state.playerStats,
      storyPath: storyManager.getStoryPath()
    };

    this.storage.save(saveData);
  }

  // Load game
  loadGame() {
    const saveData = this.storage.load();

    if (saveData) {
      this.stateManager.setState({
        currentLevel: saveData.currentLevel,
        levelsCompleted: saveData.levelsCompleted,
        playerStats: saveData.playerStats
      });

      if (saveData.storyPath) {
        storyManager.setStoryPath(saveData.storyPath);
      }

      return true;
    }

    return false;
  }
}
