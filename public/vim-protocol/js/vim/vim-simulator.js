// VimSimulator - Main vim engine orchestrating all vim functionality
class VimSimulator {
  constructor(containerElement) {
    this.container = containerElement;
    this.buffer = new Buffer(['']);
    this.cursor = new Cursor(this.buffer);
    this.parser = new CommandParser();

    // Vim state
    this.mode = 'NORMAL'; // NORMAL, INSERT, VISUAL, VISUAL_LINE, REPLACE
    this.keySequence = '';
    this.message = '';

    // For repeating character finds with ; and ,
    this.lastFind = null;

    // Command history for stats
    this.commandHistory = [];

    // Whether vim should receive keyboard input
    this.isActive = false;

    // Event listeners
    this.listeners = {
      stateChange: [],
      modeChange: [],
      commandExecuted: []
    };

    this.setupEventHandlers();
    this.setupClickToFocus();
  }

  // Focus vim and enable keyboard input
  focus() {
    this.isActive = true;
    console.log('VIM: Focused, isActive =', this.isActive);
    if (this.container) {
      this.container.classList.add('focused');
    }
  }

  // Blur vim and disable keyboard input
  blur() {
    this.isActive = false;
    console.log('VIM: Blurred, isActive =', this.isActive);
    if (this.container) {
      this.container.classList.remove('focused');
    }
  }

  // Setup click-to-focus on the vim container
  setupClickToFocus() {
    if (this.container) {
      this.container.addEventListener('click', (e) => {
        // Only focus if no modal is open
        if (!this.isModalOpen()) {
          this.focus();
        }
      });
      // Make it focusable
      this.container.setAttribute('tabindex', '0');
    }

    // Also add a global escape handler to focus vim when no modal is open
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.isActive && !this.isModalOpen()) {
        e.preventDefault();
        this.focus();
      }
    });
  }

  // Check if any modal or dialogue is currently open
  isModalOpen() {
    const modalOverlay = document.getElementById('modal-overlay');
    const characterDialogue = document.getElementById('character-dialogue');

    const modalOpen = modalOverlay && !modalOverlay.classList.contains('hidden');
    const dialogueOpen = characterDialogue && !characterDialogue.classList.contains('hidden');

    return modalOpen || dialogueOpen;
  }

  // Initialize with content
  setContent(lines) {
    this.buffer = new Buffer(lines);
    this.cursor = new Cursor(this.buffer);
    this.cursor.setPosition(0, 0);
    this.render();
  }

  // Setup keyboard event handlers
  setupEventHandlers() {
    document.addEventListener('keydown', (e) => this.handleKeyPress(e));
  }

  // Main key press handler
  handleKeyPress(event) {
    // Only handle keys when vim is active (no modal open)
    if (!this.isActive) {
      // Debug: Log when vim ignores a key
      if (event.key.length === 1 || ['Enter', 'Escape'].includes(event.key)) {
        console.log('VIM: Ignored key (not active):', event.key);
      }
      return;
    }
    console.log('VIM: Processing key:', event.key);

    // Prevent default browser shortcuts for Escape and Ctrl combos
    if (event.key === 'Escape' || event.ctrlKey || event.metaKey) {
      event.preventDefault();
    }

    const key = this.normalizeKey(event);
    if (key === null) return;

    // Prevent default for all keys in vim
    event.preventDefault();

    switch (this.mode) {
      case 'NORMAL':
        this.handleNormalMode(key, event);
        break;
      case 'INSERT':
        this.handleInsertMode(key, event);
        break;
      case 'VISUAL':
        this.handleVisualMode(key, event);
        break;
      case 'VISUAL_LINE':
        this.handleVisualLineMode(key, event);
        break;
      case 'REPLACE':
        this.handleReplaceMode(key, event);
        break;
    }

    this.render();
    this.emit('stateChange', this.getState());
  }

  // Normalize key from event
  normalizeKey(event) {
    if (event.key === 'Escape') return '<Esc>';
    if (event.key === 'Enter') return '<Enter>';
    if (event.key === 'Backspace') return '<BS>';
    if (event.key === 'Delete') return '<Del>';
    if (event.key === 'Tab') return '<Tab>';

    if (event.ctrlKey) {
      if (event.key === 'r') return '<C-r>';
      return null;
    }

    if (['Shift', 'Control', 'Alt', 'Meta'].includes(event.key)) {
      return null;
    }

    return event.key;
  }

  // Handle normal mode keys
  handleNormalMode(key, event) {
    // Escape clears key sequence
    if (key === '<Esc>') {
      this.keySequence = '';
      this.message = '';
      return;
    }

    // Ctrl-r for redo
    if (key === '<C-r>') {
      if (this.buffer.redo()) {
        this.message = 'Redone';
      }
      this.keySequence = '';
      return;
    }

    // Build key sequence
    this.keySequence += key;

    // Parse command
    const cmd = this.parser.parse(this.keySequence);

    if (cmd.type === 'complete') {
      this.executeCommand(cmd);
      this.keySequence = '';
    } else if (cmd.type === 'invalid') {
      this.keySequence = '';
    }
    // If pending, keep building sequence
  }

  // Execute parsed command
  executeCommand(cmd) {
    this.commandHistory.push({ ...cmd, timestamp: Date.now() });
    this.message = '';

    // Handle different action types
    switch (cmd.action) {
      // Mode changes
      case 'mode':
        this.handleModeCommand(cmd.mode);
        break;

      // Simple motions
      case 'motion':
        this.executeMotion(cmd.motion, cmd.count);
        break;

      // Go to line (gg, G)
      case 'gotoLine':
        if (cmd.line === 'last') {
          this.cursor.moveToLastLine();
        } else {
          this.cursor.moveToLine(cmd.line);
        }
        break;

      // Character find (f, F, t, T)
      case 'findChar':
        this.executeFindChar(cmd.direction, cmd.char, cmd.count);
        break;

      // Replace character
      case 'replace':
        this.executeReplace(cmd.char, cmd.count);
        break;

      // Linewise operations (dd, yy, cc)
      case 'linewise':
        this.executeLinewise(cmd.operator, cmd.count);
        break;

      // Operator + motion (dw, cw, yw, etc.)
      case 'operatorMotion':
        this.executeOperatorMotion(cmd.operator, cmd.motion, cmd.count);
        break;

      // Operator + char search (df", dt(, etc.)
      case 'operatorCharSearch':
        this.executeOperatorCharSearch(cmd.operator, cmd.direction, cmd.char, cmd.count);
        break;

      // Text objects (ciw, diw, yaw, etc.)
      case 'textObject':
        this.executeTextObject(cmd.operator, cmd.modifier, cmd.object, cmd.count);
        break;

      // Standalone commands
      case 'x':
        this.executeDelete('x', cmd.count);
        break;

      case 'X':
        this.executeDelete('X', cmd.count);
        break;

      case 'D':
        this.buffer.deleteRange(this.cursor.line, this.cursor.col, this.cursor.getLineLength());
        break;

      case 'C':
        this.buffer.deleteRange(this.cursor.line, this.cursor.col, this.cursor.getLineLength());
        this.enterInsertMode();
        break;

      case 'Y':
        this.buffer.yankLine(this.cursor.line);
        this.message = '1 line yanked';
        break;

      case 's':
        this.buffer.deleteChar(this.cursor.line, this.cursor.col);
        this.enterInsertMode();
        break;

      case 'S':
        const line = this.cursor.line;
        this.buffer.deleteLine(line);
        this.buffer.insertLine(line, []);
        this.cursor.setPosition(line, 0);
        this.enterInsertMode();
        break;

      case 'u':
        if (this.buffer.undo()) {
          this.message = 'Undone';
        } else {
          this.message = 'Already at oldest change';
        }
        break;

      case 'p':
        this.buffer.pasteAfter(this.cursor.line, this.cursor.col);
        break;

      case 'P':
        this.buffer.pasteBefore(this.cursor.line, this.cursor.col);
        break;

      case 'J':
        this.buffer.joinLines(this.cursor.line);
        break;

      case '%':
        this.cursor.findMatchingBracket();
        break;

      case ';':
        // Repeat last f/F/t/T find
        if (this.lastFind) {
          this.executeFindChar(this.lastFind.direction, this.lastFind.char, cmd.count);
        } else {
          this.message = 'No previous find';
        }
        break;

      case '~':
        // Toggle case
        const char = this.buffer.getChar(this.cursor.line, this.cursor.col);
        if (char) {
          const toggled = char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase();
          this.buffer.replaceChar(this.cursor.line, this.cursor.col, toggled);
          this.cursor.moveRight();
        }
        break;
    }

    this.emit('commandExecuted', cmd);
  }

  // Handle mode change commands
  handleModeCommand(mode) {
    switch (mode) {
      case 'i':
        this.enterInsertMode();
        break;
      case 'I':
        this.cursor.moveToFirstNonBlank();
        this.enterInsertMode();
        break;
      case 'a':
        this.cursor.moveRight();
        this.enterInsertMode();
        break;
      case 'A':
        this.cursor.col = this.cursor.getLineLength();
        this.enterInsertMode();
        break;
      case 'o':
        const posO = this.cursor.getPosition();
        this.buffer.insertLine(posO.line + 1, []);
        this.cursor.setPosition(posO.line + 1, 0);
        this.enterInsertMode();
        break;
      case 'O':
        const posOO = this.cursor.getPosition();
        this.buffer.insertLine(posOO.line, []);
        this.cursor.setPosition(posOO.line, 0);
        this.enterInsertMode();
        break;
      case 'v':
        this.enterVisualMode();
        break;
      case 'V':
        this.enterVisualLineMode();
        break;
      case 'R':
        this.enterReplaceMode();
        break;
    }
  }

  // Execute motion
  executeMotion(motion, count) {
    switch (motion) {
      case 'h': this.cursor.moveLeft(count); break;
      case 'j': this.cursor.moveDown(count); break;
      case 'k': this.cursor.moveUp(count); break;
      case 'l': this.cursor.moveRight(count); break;
      case 'w': this.cursor.moveWordForward(count); break;
      case 'W': this.cursor.moveWordForward(count); break; // Same as w for now
      case 'b': this.cursor.moveWordBackward(count); break;
      case 'B': this.cursor.moveWordBackward(count); break;
      case 'e': this.cursor.moveWordEnd(count); break;
      case 'E': this.cursor.moveWordEnd(count); break;
      case '0': this.cursor.moveToLineStart(); break;
      case '$': this.cursor.moveToLineEnd(); break;
      case '^': this.cursor.moveToFirstNonBlank(); break;
    }
  }

  // Execute character find
  executeFindChar(direction, char, count) {
    let found = false;

    switch (direction) {
      case 'f':
        found = this.cursor.findCharForward(char, count);
        break;
      case 'F':
        found = this.cursor.findCharBackward(char, count);
        break;
      case 't':
        found = this.cursor.tillCharForward(char, count);
        break;
      case 'T':
        found = this.cursor.tillCharBackward(char, count);
        break;
    }

    if (found) {
      this.lastFind = { direction, char };
    } else {
      this.message = `'${char}' not found`;
    }
  }

  // Execute replace
  executeReplace(char, count) {
    for (let i = 0; i < count; i++) {
      this.buffer.replaceChar(this.cursor.line, this.cursor.col + i, char);
    }
    if (count > 1) {
      this.cursor.col += count - 1;
    }
  }

  // Execute delete commands (x, X)
  executeDelete(type, count) {
    for (let i = 0; i < count; i++) {
      const pos = this.cursor.getPosition();
      if (type === 'x') {
        this.buffer.deleteChar(pos.line, pos.col);
        // Adjust cursor if needed
        const maxCol = this.cursor.getMaxCol();
        if (this.cursor.col > maxCol) {
          this.cursor.col = maxCol;
        }
      } else if (type === 'X' && pos.col > 0) {
        this.buffer.deleteChar(pos.line, pos.col - 1);
        this.cursor.moveLeft();
      }
    }
  }

  // Execute linewise operations (dd, yy, cc)
  executeLinewise(operator, count) {
    const startLine = this.cursor.line;
    const endLine = Math.min(startLine + count - 1, this.buffer.getLineCount() - 1);

    switch (operator) {
      case 'd':
        for (let i = 0; i < count && this.buffer.getLineCount() > 1; i++) {
          this.buffer.deleteLine(startLine);
        }
        // Adjust cursor
        const maxLine = this.buffer.getLineCount() - 1;
        this.cursor.setPosition(Math.min(startLine, maxLine), 0);
        this.cursor.moveToFirstNonBlank();
        this.message = count > 1 ? `${count} lines deleted` : '';
        break;

      case 'y':
        this.buffer.yankLines(startLine, endLine);
        this.message = count > 1 ? `${count} lines yanked` : '1 line yanked';
        break;

      case 'c':
        for (let i = 0; i < count && this.buffer.getLineCount() > 0; i++) {
          this.buffer.deleteLine(startLine);
        }
        this.buffer.insertLine(startLine, []);
        this.cursor.setPosition(startLine, 0);
        this.enterInsertMode();
        break;

      case '>':
        for (let i = startLine; i <= endLine; i++) {
          this.buffer.indentLine(i);
        }
        break;

      case '<':
        for (let i = startLine; i <= endLine; i++) {
          this.buffer.unindentLine(i);
        }
        break;
    }
  }

  // Execute operator + motion
  executeOperatorMotion(operator, motion, count) {
    const startPos = { line: this.cursor.line, col: this.cursor.col };

    // Execute the motion to find end position
    this.executeMotion(motion, count);
    const endPos = { line: this.cursor.line, col: this.cursor.col };

    // w/W are exclusive motions: the character at the destination is NOT deleted
    // (e.g. dw on "hello world" deletes "hello " not "hello w")
    let endAdjustment = 0;
    if ((motion === 'w' || motion === 'W') && endPos.col > startPos.col) {
      endAdjustment = -1;
    }

    // Restore cursor for operation
    this.cursor.setPosition(startPos.line, startPos.col);

    // Perform the operation
    if (startPos.line === endPos.line) {
      // Same line operation
      const start = Math.min(startPos.col, endPos.col);
      const end = Math.max(startPos.col, endPos.col) + endAdjustment;

      switch (operator) {
        case 'd':
          this.buffer.deleteRange(startPos.line, start, end);
          this.cursor.setPosition(startPos.line, start);
          break;

        case 'c':
          this.buffer.deleteRange(startPos.line, start, end);
          this.cursor.setPosition(startPos.line, start);
          this.enterInsertMode();
          break;

        case 'y':
          this.buffer.yankRange(startPos.line, start, end);
          this.message = 'Yanked';
          break;
      }
    } else {
      // Multi-line operation - for now, treat as linewise
      const startLine = Math.min(startPos.line, endPos.line);
      const endLine = Math.max(startPos.line, endPos.line);

      switch (operator) {
        case 'd':
          for (let i = startLine; i <= endLine && this.buffer.getLineCount() > 1; i++) {
            this.buffer.deleteLine(startLine);
          }
          this.cursor.setPosition(startLine, 0);
          break;

        case 'c':
          for (let i = startLine; i <= endLine; i++) {
            this.buffer.deleteLine(startLine);
          }
          this.buffer.insertLine(startLine, []);
          this.cursor.setPosition(startLine, 0);
          this.enterInsertMode();
          break;

        case 'y':
          this.buffer.yankLines(startLine, endLine);
          this.message = `${endLine - startLine + 1} lines yanked`;
          break;
      }
    }
  }

  // Execute operator + character search (df", dt(, etc.)
  executeOperatorCharSearch(operator, direction, char, count) {
    const startCol = this.cursor.col;
    let found = false;

    switch (direction) {
      case 'f':
        found = this.cursor.findCharForward(char, count);
        break;
      case 't':
        found = this.cursor.tillCharForward(char, count);
        break;
      case 'F':
        found = this.cursor.findCharBackward(char, count);
        break;
      case 'T':
        found = this.cursor.tillCharBackward(char, count);
        break;
    }

    if (found) {
      const endCol = this.cursor.col;
      const start = Math.min(startCol, endCol);
      const end = Math.max(startCol, endCol); // deleteRange/yankRange are inclusive

      this.cursor.col = startCol; // Restore

      switch (operator) {
        case 'd':
          this.buffer.deleteRange(this.cursor.line, start, end);
          this.cursor.setPosition(this.cursor.line, start);
          break;
        case 'c':
          this.buffer.deleteRange(this.cursor.line, start, end);
          this.cursor.setPosition(this.cursor.line, start);
          this.enterInsertMode();
          break;
        case 'y':
          this.buffer.yankRange(this.cursor.line, start, end);
          this.message = 'Yanked';
          break;
      }
    }
  }

  // Execute text object operation
  executeTextObject(operator, modifier, object, count) {
    const inner = modifier === 'i';
    let bounds = null;

    switch (object) {
      case 'w':
      case 'W':
        bounds = inner ? this.cursor.getInnerWordBoundaries() : this.cursor.getAroundWordBoundaries();
        break;

      case '"':
      case "'":
      case '`':
        bounds = this.cursor.getQuoteBoundaries(object, inner);
        break;

      case '(':
      case ')':
      case 'b':
        bounds = this.cursor.getBracketBoundaries('(', ')', inner);
        break;

      case '[':
      case ']':
        bounds = this.cursor.getBracketBoundaries('[', ']', inner);
        break;

      case '{':
      case '}':
      case 'B':
        bounds = this.cursor.getBracketBoundaries('{', '}', inner);
        break;

      case '<':
      case '>':
        bounds = this.cursor.getBracketBoundaries('<', '>', inner);
        break;
    }

    if (!bounds) return;

    const line = this.cursor.line;

    switch (operator) {
      case 'd':
        this.buffer.deleteRange(line, bounds.start, bounds.end);
        this.cursor.setPosition(line, bounds.start);
        break;

      case 'c':
        this.buffer.deleteRange(line, bounds.start, bounds.end);
        this.cursor.setPosition(line, bounds.start);
        this.enterInsertMode();
        break;

      case 'y':
        this.buffer.yankRange(line, bounds.start, bounds.end);
        this.message = 'Yanked';
        break;

      case 'v':
        // Select the text object in visual mode
        this.cursor.setPosition(line, bounds.start);
        this.cursor.startVisual();
        this.cursor.setPosition(line, bounds.end);
        this.mode = 'VISUAL';
        this.message = '-- VISUAL --';
        break;
    }
  }

  // Mode transitions
  enterInsertMode() {
    this.mode = 'INSERT';
    this.message = '-- INSERT --';
    this.emit('modeChange', 'INSERT');
  }

  enterVisualMode() {
    this.mode = 'VISUAL';
    this.cursor.startVisual();
    this.message = '-- VISUAL --';
    this.emit('modeChange', 'VISUAL');
  }

  enterVisualLineMode() {
    this.mode = 'VISUAL_LINE';
    this.cursor.startVisual();
    this.message = '-- VISUAL LINE --';
    this.emit('modeChange', 'VISUAL_LINE');
  }

  enterReplaceMode() {
    this.mode = 'REPLACE';
    this.message = '-- REPLACE --';
    this.emit('modeChange', 'REPLACE');
  }

  exitToNormalMode() {
    const wasInsert = this.mode === 'INSERT';
    this.mode = 'NORMAL';
    this.cursor.clearVisual();
    this.message = '';

    // Move cursor left when exiting insert mode (vim behavior)
    if (wasInsert && this.cursor.col > 0) {
      this.cursor.col--;
    }

    // Ensure cursor is within bounds
    const maxCol = this.cursor.getMaxCol();
    if (this.cursor.col > maxCol) {
      this.cursor.col = Math.max(0, maxCol);
    }

    this.emit('modeChange', 'NORMAL');
  }

  // Handle insert mode
  handleInsertMode(key, event) {
    if (key === '<Esc>') {
      this.exitToNormalMode();
      return;
    }

    event.preventDefault();
    const pos = this.cursor.getPosition();

    if (key === '<Enter>') {
      this.buffer.breakLine(pos.line, pos.col);
      this.cursor.setPosition(pos.line + 1, 0);
    } else if (key === '<BS>') {
      if (pos.col > 0) {
        this.buffer.deleteChar(pos.line, pos.col - 1);
        this.cursor.col--;
      } else if (pos.line > 0) {
        const prevLineLength = this.buffer.lines[pos.line - 1].length;
        this.buffer.joinLines(pos.line - 1);
        this.cursor.setPosition(pos.line - 1, prevLineLength);
      }
    } else if (key === '<Tab>') {
      // Insert 2 spaces for tab
      this.buffer.insertString(pos.line, pos.col, '  ');
      this.cursor.col += 2;
    } else if (key.length === 1) {
      this.buffer.insertChar(pos.line, pos.col, key);
      this.cursor.col++;
    }
  }

  // Handle replace mode
  handleReplaceMode(key, event) {
    if (key === '<Esc>') {
      this.exitToNormalMode();
      return;
    }

    event.preventDefault();

    if (key.length === 1) {
      const lineLen = this.cursor.getLineLength();
      if (this.cursor.col < lineLen) {
        this.buffer.replaceChar(this.cursor.line, this.cursor.col, key);
      } else {
        this.buffer.insertChar(this.cursor.line, this.cursor.col, key);
      }
      this.cursor.col++;
    }
  }

  // Handle visual mode
  handleVisualMode(key, event) {
    if (key === '<Esc>' || key === 'v') {
      this.exitToNormalMode();
      return;
    }

    // Build key sequence for potential count + motion
    this.keySequence += key;
    const cmd = this.parser.parse(this.keySequence);

    if (cmd.type === 'complete' && cmd.action === 'motion') {
      this.executeMotion(cmd.motion, cmd.count);
      this.keySequence = '';
      return;
    }

    if (cmd.type === 'pending') {
      return; // Keep building sequence
    }

    this.keySequence = '';

    // Handle operations on visual selection
    const range = this.cursor.getVisualRange();
    if (!range) return;

    if (key === 'd' || key === 'x') {
      if (range.start.line === range.end.line) {
        this.buffer.deleteRange(range.start.line, range.start.col, range.end.col + 1);
      } else {
        // Multi-line delete
        for (let i = range.start.line; i <= range.end.line; i++) {
          this.buffer.deleteLine(range.start.line);
        }
      }
      this.cursor.setPosition(range.start.line, range.start.col);
      this.exitToNormalMode();
    } else if (key === 'y') {
      if (range.start.line === range.end.line) {
        this.buffer.yankRange(range.start.line, range.start.col, range.end.col + 1);
      } else {
        this.buffer.yankLines(range.start.line, range.end.line);
      }
      this.cursor.setPosition(range.start.line, range.start.col);
      this.message = 'Yanked';
      this.exitToNormalMode();
    } else if (key === 'c') {
      if (range.start.line === range.end.line) {
        this.buffer.deleteRange(range.start.line, range.start.col, range.end.col + 1);
      }
      this.cursor.setPosition(range.start.line, range.start.col);
      this.cursor.clearVisual();
      this.mode = 'INSERT';
      this.message = '-- INSERT --';
    }
  }

  // Handle visual line mode
  handleVisualLineMode(key, event) {
    if (key === '<Esc>' || key === 'V') {
      this.exitToNormalMode();
      return;
    }

    // Allow j/k motions with counts
    this.keySequence += key;
    const cmd = this.parser.parse(this.keySequence);

    if (cmd.type === 'complete' && cmd.action === 'motion') {
      if (cmd.motion === 'j' || cmd.motion === 'k') {
        this.executeMotion(cmd.motion, cmd.count);
      }
      this.keySequence = '';
      return;
    }

    if (cmd.type === 'pending') {
      return;
    }

    this.keySequence = '';

    const range = this.cursor.getVisualRange();
    if (!range) return;

    if (key === 'd' || key === 'x') {
      const count = range.end.line - range.start.line + 1;
      for (let i = 0; i < count && this.buffer.getLineCount() > 1; i++) {
        this.buffer.deleteLine(range.start.line);
      }
      const maxLine = this.buffer.getLineCount() - 1;
      this.cursor.setPosition(Math.min(range.start.line, maxLine), 0);
      this.exitToNormalMode();
    } else if (key === 'y') {
      this.buffer.yankLines(range.start.line, range.end.line);
      this.cursor.setPosition(range.start.line, 0);
      this.message = `${range.end.line - range.start.line + 1} lines yanked`;
      this.exitToNormalMode();
    }
  }

  // Get current state
  getState() {
    return {
      mode: this.mode,
      buffer: this.buffer.getText(),
      lines: this.buffer.lines,
      cursor: this.cursor.getPosition(),
      message: this.message,
      keySequence: this.keySequence,
      commandHistory: this.commandHistory,
      lineCount: this.buffer.getLineCount()
    };
  }

  // Event system
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  // Render the editor
  render() {
    if (!this.container) return;

    const state = this.getState();
    const pos = state.cursor;

    let html = '<div class="vim-editor-content">';

    state.lines.forEach((line, lineIdx) => {
      html += '<div class="vim-line" data-line="' + lineIdx + '">';
      html += '<span class="line-number">' + (lineIdx + 1) + '</span>';

      // Ensure we always have at least one character slot for the cursor
      const lineChars = line.length > 0 ? line : [' '];

      lineChars.forEach((char, colIdx) => {
        const isCursor = lineIdx === pos.line && colIdx === pos.col;
        const isVisual = this.isInVisualSelection(lineIdx, colIdx);

        let classes = 'vim-char';
        if (isCursor) classes += ' vim-cursor';
        if (isVisual) classes += ' vim-visual-selection';

        const displayChar = char === '' ? ' ' : char;
        html += '<span class="' + classes + '">' + this.escapeHtml(displayChar) + '</span>';
      });

      // If cursor is at end of line (in insert mode), add extra space
      if (lineIdx === pos.line && pos.col >= line.length && this.mode === 'INSERT') {
        html += '<span class="vim-char vim-cursor">&nbsp;</span>';
      }

      html += '</div>';
    });

    html += '</div>';

    this.container.innerHTML = html;
  }

  // Check if position is in visual selection
  isInVisualSelection(line, col) {
    if (this.mode !== 'VISUAL' && this.mode !== 'VISUAL_LINE') return false;

    const range = this.cursor.getVisualRange();
    if (!range) return false;

    if (this.mode === 'VISUAL_LINE') {
      return line >= range.start.line && line <= range.end.line;
    }

    if (line < range.start.line || line > range.end.line) return false;

    if (line === range.start.line && line === range.end.line) {
      return col >= range.start.col && col <= range.end.col;
    }

    if (line === range.start.line) return col >= range.start.col;
    if (line === range.end.line) return col <= range.end.col;

    return true;
  }

  // Escape HTML
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
      ' ': '&nbsp;'
    };
    return text.replace(/[&<>"' ]/g, m => map[m] || m);
  }
}
