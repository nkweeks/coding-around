const vimProtocolShell = String.raw`
<a class="vim-portfolio-link" href="/">Back to portfolio</a>

  <!-- Main Menu Screen -->
  <div id="main-menu" class="main-menu">
    <div class="menu-content">
      <div class="menu-logo">
        <div class="logo-text glitch" data-text="VIM PROTOCOL">VIM PROTOCOL</div>
        <div class="logo-subtitle">CYBER TRAINING SIMULATOR</div>
      </div>

      <div class="menu-characters">
        <div class="menu-character robot">
          <img src="/vim-protocol/images/robot_happy.jpg" alt="BYTE the Robot">
          <div class="char-name">BYTE</div>
        </div>
        <div class="menu-character ninja">
          <img src="/vim-protocol/images/ninja.jpg" alt="BLADE the Ninja">
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

  <!-- Modal for Mission Briefing -->
  <div id="modal-overlay" class="modal-overlay hidden">
    <div class="modal-content">
      <div class="modal-header">
        <h2 id="modal-title">MISSION BRIEFING</h2>
      </div>
      <div class="modal-body" id="modal-body">
        <!-- Dynamic content -->
      </div>
      <div class="modal-footer">
        <button id="modal-btn" class="cyber-button">START MISSION</button>
      </div>
    </div>
  </div>

  <!-- Main Game Container -->
  <div class="game-container">

    <!-- Top Bar -->
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

    <!-- Main Content Area -->
    <div class="content-area">

      <!-- Left Panel: Mission Briefing -->
      <div class="left-panel">
        <div class="panel-header">
          <span class="terminal-prompt">&gt;</span> MISSION BRIEFING
        </div>
        <div class="panel-content">
          <div id="mission-story" class="mission-story">
            <!-- Dynamic mission story -->
          </div>

          <div class="objectives-section">
            <div class="section-title">OBJECTIVES:</div>
            <div id="objectives-list" class="objectives-list">
              <!-- Dynamic objectives -->
            </div>
          </div>

          <div class="hints-section">
            <div class="section-title">HINTS:</div>
            <div id="hints-list" class="hints-list">
              <!-- Dynamic hints -->
            </div>
          </div>
        </div>
      </div>

      <!-- Center: Vim Editor -->
      <div class="center-panel">
        <div class="editor-header">
          <span class="terminal-prompt">&gt;</span> VIM TERMINAL
          <span class="connection-status">
            <span class="status-dot"></span> CONNECTED
          </span>
        </div>
        <div id="vim-editor" class="vim-editor">
          <!-- Vim simulator renders here -->
        </div>
      </div>

      <!-- Right Panel: Command History & Stats -->
      <div class="right-panel">
        <div class="panel-header">
          <span class="terminal-prompt">&gt;</span> COMMAND LOG
        </div>
        <div class="panel-content">
          <div id="command-history" class="command-history">
            <!-- Dynamic command history -->
          </div>

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

    <!-- Bottom Status Bar -->
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

  <!-- Background Effects -->
  <div class="bg-grid"></div>
  <div class="scanline"></div>

  <!-- Core Vim Scripts -->
  
  
  
  

  <!-- Core Game Scripts -->
  
  
  

  <!-- Narrative System Scripts -->
  
  

  <!-- Level System Scripts -->
  
  
  
  

  <!-- UI Scripts -->
  
  
  
  

  <!-- Initialize Game -->
`

export default vimProtocolShell
