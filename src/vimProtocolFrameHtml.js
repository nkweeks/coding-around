const vimProtocolFrameHtml = String.raw`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VIM PROTOCOL :: CYBER TRAINING SIMULATOR</title>
  <base href="/games/vim-protocol/">

  <link rel="stylesheet" href="css/main.css">
  <link rel="stylesheet" href="css/cyberpunk-theme.css">
  <link rel="stylesheet" href="css/vim-editor.css">
  <link rel="stylesheet" href="css/ui-components.css">
  <link rel="stylesheet" href="css/characters.css">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Orbitron:wght@700;900&display=swap" rel="stylesheet">
</head>
<body>
  <div id="main-menu" class="main-menu">
    <div class="menu-content">
      <div class="menu-logo">
        <div class="logo-text glitch" data-text="VIM PROTOCOL">VIM PROTOCOL</div>
        <div class="logo-subtitle">CYBER TRAINING SIMULATOR</div>
      </div>

      <div class="menu-characters">
        <div class="menu-character robot">
          <img src="images/robot_happy.jpeg" alt="BYTE the Robot">
          <div class="char-name">BYTE</div>
        </div>
        <div class="menu-character ninja">
          <img src="images/ninja.jpeg" alt="BLADE the Ninja">
          <div class="char-name">BLADE</div>
        </div>
      </div>

      <div class="menu-tagline">
        <p>Master the ancient art of VIM.</p>
        <p>Choose your ally. Shape your destiny.</p>
      </div>

      <div class="menu-buttons">
        <button id="menu-new-game" class="menu-btn primary">
          <span class="btn-icon">▶</span> NEW GAME
        </button>
        <button id="menu-continue" class="menu-btn hidden">
          <span class="btn-icon">↻</span> CONTINUE
          <span id="menu-progress" class="btn-sub"></span>
        </button>
        <button id="menu-level-select" class="menu-btn">
          <span class="btn-icon">≡</span> LEVEL SELECT
        </button>
      </div>

      <div class="menu-footer">
        <p>Press <kbd>N</kbd> for New Game • <kbd>C</kbd> for Continue • <kbd>L</kbd> for Levels</p>
      </div>
    </div>
  </div>

  <div id="modal-overlay" class="modal-overlay hidden">
    <div class="modal-content">
      <div class="modal-header">
        <h2 id="modal-title">MISSION BRIEFING</h2>
      </div>
      <div class="modal-body" id="modal-body"></div>
      <div class="modal-footer">
        <button id="modal-btn" class="cyber-button">START MISSION</button>
      </div>
    </div>
  </div>

  <div class="game-container">
    <div class="top-bar">
      <div class="mission-title">
        <span class="glitch" data-text="OPERATION: FIRST CONTACT">OPERATION: FIRST CONTACT</span>
      </div>
      <div class="level-info">
        <span id="level-number">LEVEL 01</span>
        <span class="separator">//</span>
        <span id="timer">00:00</span>
        <button id="skill-log-btn" class="menu-button">SKILL LOG</button>
        <button id="menu-btn" class="menu-button">MISSIONS</button>
        <button id="home-btn" class="menu-button">HOME</button>
      </div>
    </div>

    <div class="content-area">
      <div class="left-panel">
        <div class="panel-header">
          <span class="terminal-prompt">&gt;</span> MISSION BRIEFING
        </div>
        <div class="panel-content">
          <div id="mission-story" class="mission-story"></div>

          <div class="objectives-section">
            <div class="section-title">OBJECTIVES:</div>
            <div id="objectives-list" class="objectives-list"></div>
          </div>

          <div class="hints-section">
            <div class="section-title">HINTS:</div>
            <div id="hints-list" class="hints-list"></div>
          </div>
        </div>
      </div>

      <div class="center-panel">
        <div class="editor-header">
          <span class="terminal-prompt">&gt;</span> VIM TERMINAL
          <span class="connection-status">
            <span class="status-dot"></span> CONNECTED
          </span>
        </div>
        <div id="vim-editor" class="vim-editor"></div>
      </div>

      <div class="right-panel">
        <div class="panel-header">
          <span class="terminal-prompt">&gt;</span> COMMAND LOG
        </div>
        <div class="panel-content">
          <div id="command-history" class="command-history"></div>

          <div class="stats-section">
            <div class="section-title">STATS:</div>
            <div id="stats-display" class="stats-display">
              <div class="stat-item">
                <span class="stat-label">Commands:</span>
                <span id="stat-commands" class="stat-value">0</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Efficiency:</span>
                <span id="stat-efficiency" class="stat-value">100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="status-bar">
      <div class="status-section">
        <span id="mode-indicator" class="mode-indicator">-- NORMAL --</span>
      </div>
      <div class="status-section">
        <span id="key-sequence" class="key-sequence"></span>
      </div>
      <div class="status-section">
        <span id="cursor-position" class="cursor-position">Line 1, Col 0</span>
      </div>
      <div class="status-section">
        <span id="progress-indicator" class="progress-indicator">Objectives: 0/0</span>
      </div>
    </div>
  </div>

  <div class="bg-grid"></div>
  <div class="scanline"></div>

  <script src="js/vim/buffer.js"></script>
  <script src="js/vim/cursor.js"></script>
  <script src="js/vim/commands.js"></script>
  <script src="js/vim/vim-simulator.js"></script>
  <script src="js/core/storage.js"></script>
  <script src="js/core/state-manager.js"></script>
  <script src="js/core/game.js"></script>
  <script src="js/narrative/characters.js"></script>
  <script src="js/narrative/story-manager.js"></script>
  <script src="js/levels/skill-catalog.js"></script>
  <script src="js/levels/level-data.js"></script>
  <script src="js/levels/mission-validator.js"></script>
  <script src="js/levels/level-manager.js"></script>
  <script src="js/ui/modal.js"></script>
  <script src="js/ui/hud.js"></script>
  <script src="js/ui/skill-log.js"></script>
  <script src="js/ui/terminal.js"></script>

  <script>
    document.addEventListener('DOMContentLoaded', () => {
      window.game = new Game()
      window.game.init()
    })
  </script>
</body>
</html>`

export default vimProtocolFrameHtml
