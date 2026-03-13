// Cursor - Position tracking and movement for vim simulator
class Cursor {
  constructor(buffer) {
    this.buffer = buffer;
    this.line = 0;
    this.col = 0;
    this.preferredCol = 0; // For maintaining column position during vertical movement

    // For visual mode
    this.visualStart = null;
  }

  // Get current position
  getPosition() {
    return { line: this.line, col: this.col };
  }

  // Set position with bounds checking
  setPosition(line, col) {
    const maxLine = Math.max(0, this.buffer.getLineCount() - 1);
    this.line = Math.max(0, Math.min(line, maxLine));

    const maxCol = this.getMaxCol();
    this.col = Math.max(0, Math.min(col, maxCol));
    this.preferredCol = this.col;
  }

  // Get maximum valid column for current line (0-indexed)
  getMaxCol() {
    const lineLen = this.buffer.lines[this.line] ? this.buffer.lines[this.line].length : 0;
    return Math.max(0, lineLen - 1);
  }

  // Get actual line length
  getLineLength() {
    return this.buffer.lines[this.line] ? this.buffer.lines[this.line].length : 0;
  }

  // === BASIC MOVEMENTS ===

  moveLeft(count = 1) {
    this.col = Math.max(0, this.col - count);
    this.preferredCol = this.col;
  }

  moveRight(count = 1) {
    const maxCol = this.getMaxCol();
    this.col = Math.min(maxCol, this.col + count);
    this.preferredCol = this.col;
  }

  moveDown(count = 1) {
    const maxLine = this.buffer.getLineCount() - 1;
    this.line = Math.min(maxLine, this.line + count);

    // Try to maintain preferred column, but clamp to line length
    const maxCol = this.getMaxCol();
    this.col = Math.min(this.preferredCol, maxCol);
  }

  moveUp(count = 1) {
    this.line = Math.max(0, this.line - count);

    // Try to maintain preferred column, but clamp to line length
    const maxCol = this.getMaxCol();
    this.col = Math.min(this.preferredCol, maxCol);
  }

  // === LINE MOVEMENTS ===

  moveToLineStart() {
    this.col = 0;
    this.preferredCol = 0;
  }

  moveToLineEnd() {
    this.col = this.getMaxCol();
    this.preferredCol = this.col;
  }

  moveToFirstNonBlank() {
    const line = this.buffer.getLine(this.line);
    for (let i = 0; i < line.length; i++) {
      if (line[i] !== ' ' && line[i] !== '\t') {
        this.col = i;
        this.preferredCol = this.col;
        return;
      }
    }
    this.col = 0;
    this.preferredCol = 0;
  }

  // === FILE MOVEMENTS ===

  moveToLine(lineNum) {
    // lineNum is 1-indexed from user perspective
    const targetLine = Math.max(0, lineNum - 1);
    const maxLine = this.buffer.getLineCount() - 1;
    this.line = Math.min(targetLine, maxLine);
    this.col = 0;
    this.preferredCol = 0;
    this.moveToFirstNonBlank();
  }

  moveToFirstLine() {
    this.line = 0;
    this.col = 0;
    this.preferredCol = 0;
    this.moveToFirstNonBlank();
  }

  moveToLastLine() {
    this.line = Math.max(0, this.buffer.getLineCount() - 1);
    this.col = 0;
    this.preferredCol = 0;
    this.moveToFirstNonBlank();
  }

  // === WORD MOVEMENTS ===

  isWordChar(char) {
    return /[a-zA-Z0-9_]/.test(char);
  }

  isPunctuation(char) {
    return /[^\s\w]/.test(char);
  }

  isWhitespace(char) {
    return /\s/.test(char);
  }

  moveWordForward(count = 1) {
    for (let c = 0; c < count; c++) {
      this._moveWordForwardOnce();
    }
    this.preferredCol = this.col;
  }

  _moveWordForwardOnce() {
    const totalLines = this.buffer.getLineCount();
    let line = this.buffer.getLine(this.line);

    // If at end of line, move to next line
    if (this.col >= line.length - 1) {
      if (this.line < totalLines - 1) {
        this.line++;
        this.col = 0;
        line = this.buffer.getLine(this.line);

        // Skip leading whitespace on new line
        while (this.col < line.length && this.isWhitespace(line[this.col])) {
          this.col++;
        }
        return;
      }
      return; // At end of file
    }

    const startChar = line[this.col];

    // Move past current word/punctuation
    if (this.isWordChar(startChar)) {
      while (this.col < line.length && this.isWordChar(line[this.col])) {
        this.col++;
      }
    } else if (this.isPunctuation(startChar)) {
      while (this.col < line.length && this.isPunctuation(line[this.col])) {
        this.col++;
      }
    }

    // Skip whitespace
    while (this.col < line.length && this.isWhitespace(line[this.col])) {
      this.col++;
    }

    // If we hit end of line, move to next line
    if (this.col >= line.length && this.line < totalLines - 1) {
      this.line++;
      this.col = 0;
      line = this.buffer.getLine(this.line);

      // Skip leading whitespace
      while (this.col < line.length && this.isWhitespace(line[this.col])) {
        this.col++;
      }
    }

    // Clamp to valid position
    if (this.col >= line.length && line.length > 0) {
      this.col = line.length - 1;
    }
  }

  moveWordBackward(count = 1) {
    for (let c = 0; c < count; c++) {
      this._moveWordBackwardOnce();
    }
    this.preferredCol = this.col;
  }

  _moveWordBackwardOnce() {
    let line = this.buffer.getLine(this.line);

    // If at start of line, move to previous line
    if (this.col === 0) {
      if (this.line > 0) {
        this.line--;
        line = this.buffer.getLine(this.line);
        this.col = Math.max(0, line.length - 1);
      }
      return;
    }

    // Move back one position
    this.col--;

    // Skip whitespace backwards
    while (this.col > 0 && this.isWhitespace(line[this.col])) {
      this.col--;
    }

    // Find start of current word
    const charType = this.isWordChar(line[this.col]) ? 'word' :
                     this.isPunctuation(line[this.col]) ? 'punct' : 'space';

    while (this.col > 0) {
      const prevChar = line[this.col - 1];
      const prevType = this.isWordChar(prevChar) ? 'word' :
                       this.isPunctuation(prevChar) ? 'punct' : 'space';

      if (prevType !== charType) break;
      this.col--;
    }
  }

  moveWordEnd(count = 1) {
    for (let c = 0; c < count; c++) {
      this._moveWordEndOnce();
    }
    this.preferredCol = this.col;
  }

  _moveWordEndOnce() {
    const totalLines = this.buffer.getLineCount();
    let line = this.buffer.getLine(this.line);

    // Move forward one to get off current position
    this.col++;

    // Skip whitespace
    while (this.col >= line.length || this.isWhitespace(line[this.col])) {
      if (this.col >= line.length) {
        if (this.line < totalLines - 1) {
          this.line++;
          this.col = 0;
          line = this.buffer.getLine(this.line);
        } else {
          this.col = Math.max(0, line.length - 1);
          return;
        }
      } else {
        this.col++;
      }
    }

    // Move to end of word
    const charType = this.isWordChar(line[this.col]) ? 'word' : 'punct';

    while (this.col < line.length - 1) {
      const nextChar = line[this.col + 1];
      const nextType = this.isWordChar(nextChar) ? 'word' :
                       this.isPunctuation(nextChar) ? 'punct' : 'space';

      if (nextType !== charType) break;
      this.col++;
    }
  }

  // === CHARACTER SEARCH ===

  findCharForward(char, count = 1) {
    const line = this.buffer.getLine(this.line);
    let found = 0;
    let pos = this.col;

    for (let i = this.col + 1; i < line.length; i++) {
      if (line[i] === char) {
        found++;
        pos = i;
        if (found === count) {
          this.col = pos;
          this.preferredCol = this.col;
          return true;
        }
      }
    }

    return false;
  }

  findCharBackward(char, count = 1) {
    const line = this.buffer.getLine(this.line);
    let found = 0;
    let pos = this.col;

    for (let i = this.col - 1; i >= 0; i--) {
      if (line[i] === char) {
        found++;
        pos = i;
        if (found === count) {
          this.col = pos;
          this.preferredCol = this.col;
          return true;
        }
      }
    }

    return false;
  }

  tillCharForward(char, count = 1) {
    const line = this.buffer.getLine(this.line);
    let found = 0;

    for (let i = this.col + 1; i < line.length; i++) {
      if (line[i] === char) {
        found++;
        if (found === count) {
          this.col = i - 1;
          this.preferredCol = this.col;
          return true;
        }
      }
    }

    return false;
  }

  tillCharBackward(char, count = 1) {
    const line = this.buffer.getLine(this.line);
    let found = 0;

    for (let i = this.col - 1; i >= 0; i--) {
      if (line[i] === char) {
        found++;
        if (found === count) {
          this.col = i + 1;
          this.preferredCol = this.col;
          return true;
        }
      }
    }

    return false;
  }

  // === TEXT OBJECT BOUNDARIES ===

  getWordBoundaries() {
    const line = this.buffer.getLine(this.line);
    if (!line || line.length === 0) {
      return { start: 0, end: 0 };
    }

    let start = this.col;
    let end = this.col;

    const char = line[this.col] || ' ';

    // Determine character type
    const isWord = this.isWordChar(char);
    const isPunct = this.isPunctuation(char);

    if (isWord) {
      // Find word boundaries
      while (start > 0 && this.isWordChar(line[start - 1])) start--;
      while (end < line.length - 1 && this.isWordChar(line[end + 1])) end++;
    } else if (isPunct) {
      // Find punctuation boundaries
      while (start > 0 && this.isPunctuation(line[start - 1])) start--;
      while (end < line.length - 1 && this.isPunctuation(line[end + 1])) end++;
    } else {
      // Whitespace - find whitespace boundaries
      while (start > 0 && this.isWhitespace(line[start - 1])) start--;
      while (end < line.length - 1 && this.isWhitespace(line[end + 1])) end++;
    }

    return { start, end };
  }

  getInnerWordBoundaries() {
    return this.getWordBoundaries();
  }

  getAroundWordBoundaries() {
    const bounds = this.getWordBoundaries();
    const line = this.buffer.getLine(this.line);

    // Include trailing whitespace if present
    while (bounds.end < line.length - 1 && this.isWhitespace(line[bounds.end + 1])) {
      bounds.end++;
    }

    return bounds;
  }

  // Get boundaries for quoted strings
  getQuoteBoundaries(quoteChar, inner) {
    const line = this.buffer.getLine(this.line);
    let start = -1;
    let end = -1;

    // Find opening quote (search backward then forward)
    for (let i = this.col; i >= 0; i--) {
      if (line[i] === quoteChar) {
        start = i;
        break;
      }
    }

    if (start === -1) {
      // Search forward for opening quote
      for (let i = this.col; i < line.length; i++) {
        if (line[i] === quoteChar) {
          start = i;
          break;
        }
      }
    }

    if (start === -1) return null;

    // Find closing quote
    for (let i = start + 1; i < line.length; i++) {
      if (line[i] === quoteChar) {
        end = i;
        break;
      }
    }

    if (end === -1) return null;

    if (inner) {
      return { start: start + 1, end: end - 1 };
    } else {
      return { start, end };
    }
  }

  // Get boundaries for bracket pairs
  getBracketBoundaries(openBracket, closeBracket, inner) {
    const line = this.buffer.getLine(this.line);
    let start = -1;
    let end = -1;
    let depth = 0;

    // Find opening bracket
    for (let i = this.col; i >= 0; i--) {
      if (line[i] === closeBracket) depth++;
      if (line[i] === openBracket) {
        if (depth === 0) {
          start = i;
          break;
        }
        depth--;
      }
    }

    if (start === -1) return null;

    // Find closing bracket
    depth = 0;
    for (let i = start; i < line.length; i++) {
      if (line[i] === openBracket) depth++;
      if (line[i] === closeBracket) {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }

    if (end === -1) return null;

    if (inner) {
      return { start: start + 1, end: end - 1 };
    } else {
      return { start, end };
    }
  }

  // === BRACKET MATCHING ===

  findMatchingBracket() {
    const line = this.buffer.getLine(this.line);
    const char = line[this.col];

    const pairs = {
      '(': ')', ')': '(',
      '[': ']', ']': '[',
      '{': '}', '}': '{',
      '<': '>', '>': '<'
    };

    if (!pairs[char]) return false;

    const isOpening = '([{<'.includes(char);
    const target = pairs[char];
    let depth = 1;

    if (isOpening) {
      // Search forward
      for (let l = this.line; l < this.buffer.getLineCount(); l++) {
        const searchLine = this.buffer.getLine(l);
        const startCol = (l === this.line) ? this.col + 1 : 0;

        for (let c = startCol; c < searchLine.length; c++) {
          if (searchLine[c] === char) depth++;
          if (searchLine[c] === target) {
            depth--;
            if (depth === 0) {
              this.line = l;
              this.col = c;
              this.preferredCol = this.col;
              return true;
            }
          }
        }
      }
    } else {
      // Search backward
      for (let l = this.line; l >= 0; l--) {
        const searchLine = this.buffer.getLine(l);
        const startCol = (l === this.line) ? this.col - 1 : searchLine.length - 1;

        for (let c = startCol; c >= 0; c--) {
          if (searchLine[c] === char) depth++;
          if (searchLine[c] === target) {
            depth--;
            if (depth === 0) {
              this.line = l;
              this.col = c;
              this.preferredCol = this.col;
              return true;
            }
          }
        }
      }
    }

    return false;
  }

  // === VISUAL MODE ===

  startVisual() {
    this.visualStart = { line: this.line, col: this.col };
  }

  getVisualRange() {
    if (!this.visualStart) return null;

    const start = { ...this.visualStart };
    const end = { line: this.line, col: this.col };

    // Normalize so start comes before end
    if (start.line > end.line || (start.line === end.line && start.col > end.col)) {
      return { start: end, end: start };
    }

    return { start, end };
  }

  clearVisual() {
    this.visualStart = null;
  }
}
