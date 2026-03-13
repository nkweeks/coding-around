// Buffer - Text storage and manipulation for vim simulator
class Buffer {
  constructor(initialContent = ['']) {
    // Store text as array of lines, where each line is an array of characters
    this.lines = initialContent.map(line =>
      typeof line === 'string' ? line.split('') : line
    );

    // Undo/redo stacks
    this.undoStack = [];
    this.redoStack = [];

    // Registers for yank/delete operations
    this.registers = {
      unnamed: [], // Default register
      named: {}    // Named registers (a-z)
    };

    // Track if last operation was a line-wise operation
    this.lastOpWasLinewise = false;
  }

  // Save current state for undo
  saveState() {
    const state = {
      lines: this.lines.map(line => [...line]),
      registers: JSON.parse(JSON.stringify(this.registers))
    };
    this.undoStack.push(state);
    this.redoStack = []; // Clear redo stack on new operation

    // Limit undo stack to 100 operations
    if (this.undoStack.length > 100) {
      this.undoStack.shift();
    }
  }

  // Undo last operation
  undo() {
    if (this.undoStack.length === 0) return false;

    const currentState = {
      lines: this.lines.map(line => [...line]),
      registers: JSON.parse(JSON.stringify(this.registers))
    };
    this.redoStack.push(currentState);

    const prevState = this.undoStack.pop();
    this.lines = prevState.lines;
    this.registers = prevState.registers;

    return true;
  }

  // Redo operation
  redo() {
    if (this.redoStack.length === 0) return false;

    const currentState = {
      lines: this.lines.map(line => [...line]),
      registers: JSON.parse(JSON.stringify(this.registers))
    };
    this.undoStack.push(currentState);

    const nextState = this.redoStack.pop();
    this.lines = nextState.lines;
    this.registers = nextState.registers;

    return true;
  }

  // Get text content as string
  getText() {
    return this.lines.map(line => line.join('')).join('\n');
  }

  // Get line as string
  getLine(lineNum) {
    if (lineNum < 0 || lineNum >= this.lines.length) return '';
    return this.lines[lineNum].join('');
  }

  // Get character at position
  getChar(line, col) {
    if (line < 0 || line >= this.lines.length) return '';
    if (col < 0 || col >= this.lines[line].length) return '';
    return this.lines[line][col];
  }

  // Insert character at position
  insertChar(line, col, char) {
    this.saveState();
    if (line < 0 || line >= this.lines.length) return;

    this.lines[line].splice(col, 0, char);
  }

  // Insert string at position
  insertString(line, col, str) {
    this.saveState();
    if (line < 0 || line >= this.lines.length) return;

    const chars = str.split('');
    this.lines[line].splice(col, 0, ...chars);
  }

  // Delete character at position
  deleteChar(line, col) {
    this.saveState();
    if (line < 0 || line >= this.lines.length) return '';
    if (col < 0 || col >= this.lines[line].length) return '';

    const deleted = this.lines[line].splice(col, 1)[0];
    return deleted;
  }

  // Delete range of characters on a line (endCol is INCLUSIVE)
  deleteRange(line, startCol, endCol) {
    this.saveState();
    if (line < 0 || line >= this.lines.length) return '';

    // Clamp to valid range
    startCol = Math.max(0, startCol);
    endCol = Math.min(endCol, this.lines[line].length - 1);

    if (startCol > endCol) return '';

    // +1 because endCol is inclusive
    const deleted = this.lines[line].splice(startCol, endCol - startCol + 1);
    this.registers.unnamed = deleted;
    this.lastOpWasLinewise = false;

    return deleted.join('');
  }

  // Delete entire line
  deleteLine(lineNum) {
    this.saveState();
    if (lineNum < 0 || lineNum >= this.lines.length) return [];

    const deleted = this.lines.splice(lineNum, 1)[0];
    this.registers.unnamed = deleted;
    this.lastOpWasLinewise = true;

    // Ensure at least one line exists
    if (this.lines.length === 0) {
      this.lines = [[]];
    }

    return deleted;
  }

  // Delete multiple lines
  deleteLines(startLine, endLine) {
    this.saveState();
    const count = endLine - startLine + 1;
    if (startLine < 0 || startLine >= this.lines.length) return [];

    const deleted = this.lines.splice(startLine, count);
    this.registers.unnamed = deleted.flat();
    this.lastOpWasLinewise = true;

    // Ensure at least one line exists
    if (this.lines.length === 0) {
      this.lines = [[]];
    }

    return deleted;
  }

  // Insert new line
  insertLine(lineNum, content = []) {
    this.saveState();
    const line = typeof content === 'string' ? content.split('') : content;
    this.lines.splice(lineNum, 0, line);
  }

  // Break line at position (for Enter key)
  breakLine(line, col) {
    this.saveState();
    if (line < 0 || line >= this.lines.length) return;

    const currentLine = this.lines[line];
    const newLine = currentLine.splice(col);
    this.lines.splice(line + 1, 0, newLine);
  }

  // Join lines
  joinLines(lineNum) {
    this.saveState();
    if (lineNum < 0 || lineNum >= this.lines.length - 1) return;

    const nextLine = this.lines.splice(lineNum + 1, 1)[0];

    // Add space if both lines have content
    if (this.lines[lineNum].length > 0 && nextLine.length > 0) {
      this.lines[lineNum].push(' ');
    }

    this.lines[lineNum].push(...nextLine);
  }

  // Replace character at position
  replaceChar(line, col, char) {
    this.saveState();
    if (line < 0 || line >= this.lines.length) return;
    if (col < 0 || col >= this.lines[line].length) return;

    this.lines[line][col] = char;
  }

  // Yank (copy) range (endCol is INCLUSIVE)
  yankRange(line, startCol, endCol) {
    if (line < 0 || line >= this.lines.length) return;

    // Clamp to valid range
    startCol = Math.max(0, startCol);
    endCol = Math.min(endCol, this.lines[line].length - 1);

    if (startCol > endCol) return;

    // +1 because endCol is inclusive and slice is exclusive
    const yanked = this.lines[line].slice(startCol, endCol + 1);
    this.registers.unnamed = yanked;
    this.lastOpWasLinewise = false;
  }

  // Yank line
  yankLine(lineNum) {
    if (lineNum < 0 || lineNum >= this.lines.length) return;

    this.registers.unnamed = [...this.lines[lineNum]];
    this.lastOpWasLinewise = true;
  }

  // Yank multiple lines
  yankLines(startLine, endLine) {
    const lines = [];
    for (let i = startLine; i <= endLine && i < this.lines.length; i++) {
      lines.push(...this.lines[i], '\n');
    }
    // Remove last newline
    if (lines[lines.length - 1] === '\n') {
      lines.pop();
    }

    this.registers.unnamed = lines;
    this.lastOpWasLinewise = true;
  }

  // Paste after position
  pasteAfter(line, col) {
    this.saveState();

    if (this.lastOpWasLinewise) {
      // Paste entire line(s) below current line
      const content = this.registers.unnamed;
      this.insertLine(line + 1, content);
    } else {
      // Paste characters after cursor
      if (line < 0 || line >= this.lines.length) return;
      this.lines[line].splice(col + 1, 0, ...this.registers.unnamed);
    }
  }

  // Paste before position
  pasteBefore(line, col) {
    this.saveState();

    if (this.lastOpWasLinewise) {
      // Paste entire line(s) above current line
      const content = this.registers.unnamed;
      this.insertLine(line, content);
    } else {
      // Paste characters at cursor
      if (line < 0 || line >= this.lines.length) return;
      this.lines[line].splice(col, 0, ...this.registers.unnamed);
    }
  }

  // Get line count
  getLineCount() {
    return this.lines.length;
  }

  // Get line length
  getLineLength(lineNum) {
    if (lineNum < 0 || lineNum >= this.lines.length) return 0;
    return Math.max(1, this.lines[lineNum].length); // At least 1 for cursor positioning
  }

  // Indent line
  indentLine(lineNum) {
    this.saveState();
    if (lineNum < 0 || lineNum >= this.lines.length) return;

    this.lines[lineNum].unshift(' ', ' ');
  }

  // Unindent line
  unindentLine(lineNum) {
    this.saveState();
    if (lineNum < 0 || lineNum >= this.lines.length) return;

    // Remove up to 2 leading spaces
    let removed = 0;
    while (removed < 2 && this.lines[lineNum][0] === ' ') {
      this.lines[lineNum].shift();
      removed++;
    }
  }

  // Clear all content
  clear() {
    this.saveState();
    this.lines = [[]];
  }

  // Set content from string
  setContent(text) {
    this.saveState();
    this.lines = text.split('\n').map(line => line.split(''));
  }
}
