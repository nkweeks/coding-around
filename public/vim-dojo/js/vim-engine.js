/* ============================================================
 * VIM DOJO — vim engine (v2, written from scratch)
 * Runs in browser (window.VimEngine) and Node (module.exports)
 * for the automated drill-solvability test suite.
 *
 * Supported:
 *   Modes:    NORMAL, INSERT, VISUAL, V-LINE, SEARCH
 *   Motions:  h j k l <Space> 0 ^ $ w b e gg G { } % f F t T ; ,
 *             / ? n N   (plain-text search, no regex)
 *   Counts:   3w, d2w, 5j, 12G, 2f. ...
 *   Operators d c y > < (+ dd cc yy >> <<, linewise w/ j k gg G)
 *   Text objects: i/a + w " ' ( ) b [ ] { } B < >
 *   Edits:    x X r s S ~ J D C Y i a I A o O p P u Ctrl-r
 *   Repeat:   . (dot) — replays the last buffer-changing command
 *   Ex:       :w :q :q! :wq :x  and ZZ — with modified-buffer
 *             tracking, so :q honestly refuses unsaved changes
 *   Macros:   qa…q records into a–z, @a replays, @@ repeats
 * Not implemented (by design, see DESIGN.md): regex search,
 *   marks, registers beyond unnamed.
 * ============================================================ */
(function () {
  'use strict';

  var MODE = {
    NORMAL: 'NORMAL',
    INSERT: 'INSERT',
    VISUAL: 'VISUAL',
    VLINE: 'V-LINE',
    SEARCH: 'SEARCH',
    COMMAND: 'COMMAND'
  };

  var SHIFT = '  '; // shiftwidth=2

  function isWordChar(ch) { return /[A-Za-z0-9_]/.test(ch); }
  // 0 = whitespace, 1 = word, 2 = punctuation
  function cls(ch) {
    if (ch === undefined || ch === null || ch === '' || /\s/.test(ch)) return 0;
    return isWordChar(ch) ? 1 : 2;
  }

  var BRACKETS = { '(': ')', '[': ']', '{': '}', '<': '>' };
  var BRACKETS_R = { ')': '(', ']': '[', '}': '{', '>': '<' };

  function VimEngine(lines) {
    this.load(lines);
  }

  VimEngine.MODE = MODE;

  VimEngine.prototype.load = function (lines, cursor) {
    this.lines = (lines && lines.length) ? lines.slice() : [''];
    this.row = cursor ? cursor.row : 0;
    this.col = cursor ? cursor.col : 0;
    this.mode = MODE.NORMAL;

    this.count = '';      // count typed before an operator / motion
    this.opCount = '';    // count typed after an operator
    this.op = null;       // pending operator: d c y > <
    this.pendingChar = null; // {type:'f'|'F'|'t'|'T'|'r'|'obj', around:bool}
    this.gPending = false;

    this.register = null; // {pieces:[..]|rows:[..], linewise:bool}
    this.undoStack = [];
    this.redoStack = [];

    this.lastFind = null;   // {type:'f'|'F'|'t'|'T', ch}
    this.lastSearch = null; // {pat, dir}
    this.searchBuf = '';
    this.searchDir = 1;

    this.visual = null;     // anchor {row,col}

    this.changeTick = 0;
    this.lastChange = null; // recorded key tokens of last change
    this.replaying = false;
    this._cmdKeys = [];
    this._cmdStartTick = 0;
    this._cmdNonRepeat = false;
    this._cmdUndoDone = false;

    // ex command line + file lifecycle (:w :q …)
    this.cmdBuf = '';
    this.fileName = 'buffer';
    this.savedLines = this.lines.slice(); // "the file on disk"
    this.modified = false;
    this.quit = false;
    this.lastMessage = '';

    // macros
    this.macros = {};
    this.recordingReg = null;
    this.recordedKeys = [];
    this.lastMacroReg = null;
    this._macroReplay = false;
    this.zPending = false;
  };

  /* ---------------- helpers ---------------- */

  VimEngine.prototype.line = function (r) { return this.lines[r === undefined ? this.row : r]; };
  VimEngine.prototype.lastRow = function () { return this.lines.length - 1; };

  VimEngine.prototype.clampCol = function (row, col) {
    var len = this.lines[row].length;
    var max = Math.max(0, len - 1);
    return Math.min(Math.max(0, col), max);
  };

  VimEngine.prototype.setCursor = function (row, col) {
    this.row = Math.min(Math.max(0, row), this.lastRow());
    this.col = this.clampCol(this.row, col);
  };

  VimEngine.prototype.firstNonBlank = function (row) {
    var m = this.lines[row].match(/\S/);
    return m ? m.index : 0;
  };

  // char-position iteration: col === line.length represents the newline
  VimEngine.prototype.charAt = function (p) {
    var line = this.lines[p.row];
    if (p.col >= line.length) return '\n';
    return line[p.col];
  };
  VimEngine.prototype.isEmptyLinePos = function (p) {
    return this.lines[p.row].length === 0 && p.col === 0;
  };
  VimEngine.prototype.advance = function (p) {
    var line = this.lines[p.row];
    if (p.col < line.length) return { row: p.row, col: p.col + 1 };
    if (p.row < this.lastRow()) return { row: p.row + 1, col: 0 };
    return null;
  };
  VimEngine.prototype.retreat = function (p) {
    if (p.col > 0) return { row: p.row, col: p.col - 1 };
    if (p.row > 0) return { row: p.row - 1, col: this.lines[p.row - 1].length };
    return null;
  };

  function posLE(a, b) { return a.row < b.row || (a.row === b.row && a.col <= b.col); }
  function posEq(a, b) { return a.row === b.row && a.col === b.col; }

  /* ---------------- undo ---------------- */

  VimEngine.prototype.beginChange = function () {
    if (!this._cmdUndoDone) {
      this.undoStack.push({ lines: this.lines.slice(), row: this.row, col: this.col });
      if (this.undoStack.length > 200) this.undoStack.shift();
      this.redoStack = [];
      this._cmdUndoDone = true;
    }
    this.changeTick++;
    this.modified = true;
  };

  VimEngine.prototype.undo = function () {
    var snap = this.undoStack.pop();
    if (!snap) return;
    this.redoStack.push({ lines: this.lines.slice(), row: this.row, col: this.col });
    this.lines = snap.lines.slice();
    this.setCursor(snap.row, snap.col);
  };

  VimEngine.prototype.redo = function () {
    var snap = this.redoStack.pop();
    if (!snap) return;
    this.undoStack.push({ lines: this.lines.slice(), row: this.row, col: this.col });
    this.lines = snap.lines.slice();
    this.setCursor(snap.row, snap.col);
  };

  /* ---------------- range edits (charwise) ---------------- */

  // start inclusive, end exclusive; both {row,col}; returns pieces array
  VimEngine.prototype.getRange = function (start, end) {
    if (start.row === end.row) {
      return [this.lines[start.row].slice(start.col, end.col)];
    }
    var pieces = [this.lines[start.row].slice(start.col)];
    for (var r = start.row + 1; r < end.row; r++) pieces.push(this.lines[r]);
    pieces.push(this.lines[end.row].slice(0, end.col));
    return pieces;
  };

  VimEngine.prototype.deleteRange = function (start, end) {
    var pieces = this.getRange(start, end);
    if (start.row === end.row) {
      var l = this.lines[start.row];
      this.lines[start.row] = l.slice(0, start.col) + l.slice(end.col);
    } else {
      var head = this.lines[start.row].slice(0, start.col);
      var tail = this.lines[end.row].slice(end.col);
      this.lines.splice(start.row, end.row - start.row + 1, head + tail);
    }
    return pieces;
  };

  VimEngine.prototype.rangeEmpty = function (start, end) {
    return posEq(start, end) || !posLE(start, end);
  };

  /* ---------------- word motions ---------------- */

  VimEngine.prototype.wordForward = function (p) {
    var c = cls(this.charAt(p));
    var q = p;
    if (c !== 0) {
      while (cls(this.charAt(q)) === c) {
        var n = this.advance(q);
        if (!n) return q;
        q = n;
      }
    }
    while (cls(this.charAt(q)) === 0) {
      if (this.isEmptyLinePos(q) && !posEq(q, p)) return q; // empty line is a word
      var n2 = this.advance(q);
      if (!n2) return q;
      q = n2;
    }
    return q;
  };

  VimEngine.prototype.wordBack = function (p) {
    var q = this.retreat(p);
    if (!q) return p;
    while (cls(this.charAt(q)) === 0) {
      if (this.isEmptyLinePos(q)) return q;
      var n = this.retreat(q);
      if (!n) return q;
      q = n;
    }
    var c = cls(this.charAt(q));
    while (true) {
      var prev = this.retreat(q);
      if (!prev || cls(this.charAt(prev)) !== c) return q;
      q = prev;
    }
  };

  VimEngine.prototype.wordEnd = function (p) {
    var q = this.advance(p);
    if (!q) return p;
    while (cls(this.charAt(q)) === 0) {
      var n = this.advance(q);
      if (!n) return q;
      q = n;
    }
    var c = cls(this.charAt(q));
    while (true) {
      var nxt = this.advance(q);
      if (!nxt || cls(this.charAt(nxt)) !== c) return q;
      q = nxt;
    }
  };

  /* ---------------- other motions ---------------- */

  VimEngine.prototype.paraForward = function () {
    for (var r = this.row + 1; r <= this.lastRow(); r++) {
      if (this.lines[r].length === 0) return { row: r, col: 0 };
    }
    return { row: this.lastRow(), col: 0 };
  };

  VimEngine.prototype.paraBack = function () {
    for (var r = this.row - 1; r >= 0; r--) {
      if (this.lines[r].length === 0) return { row: r, col: 0 };
    }
    return { row: 0, col: 0 };
  };

  VimEngine.prototype.matchBracket = function () {
    var line = this.line();
    var c0 = -1, ch;
    for (var i = this.col; i < line.length; i++) {
      if (BRACKETS[line[i]] || BRACKETS_R[line[i]]) { c0 = i; ch = line[i]; break; }
    }
    if (c0 < 0) return null;
    var open, close, dir;
    if (BRACKETS[ch]) { open = ch; close = BRACKETS[ch]; dir = 1; }
    else { open = BRACKETS_R[ch]; close = ch; dir = -1; }
    var depth = 0;
    var p = { row: this.row, col: c0 };
    while (p) {
      var c = this.charAt(p);
      if (c === open) depth += dir === 1 ? 1 : -1;
      else if (c === close) depth += dir === 1 ? -1 : 1;
      if (depth === 0 && !posEq(p, { row: this.row, col: c0 })) return p;
      p = dir === 1 ? this.advance(p) : this.retreat(p);
    }
    return null;
  };

  // find char in current line; returns col or -1
  VimEngine.prototype.findCharCol = function (type, ch, fromColOverride) {
    var line = this.line();
    if (type === 'f' || type === 't') {
      var from = fromColOverride !== undefined ? fromColOverride : this.col + 1;
      var idx = line.indexOf(ch, from);
      if (idx < 0) return -1;
      return type === 'f' ? idx : idx - 1;
    } else {
      var from2 = fromColOverride !== undefined ? fromColOverride : this.col - 1;
      var idx2 = line.lastIndexOf(ch, from2);
      if (idx2 < 0) return -1;
      return type === 'F' ? idx2 : idx2 + 1;
    }
  };

  /* ---------------- search ---------------- */

  VimEngine.prototype.findMatch = function (pat, dir) {
    if (!pat) return null;
    var total = this.lines.length;
    if (dir === 1) {
      // search forward starting just after cursor, wrap
      var idx = this.lines[this.row].indexOf(pat, this.col + 1);
      if (idx >= 0) return { row: this.row, col: idx };
      for (var i = 1; i <= total; i++) {
        var r = (this.row + i) % total;
        var found = this.lines[r].indexOf(pat);
        if (found >= 0) return { row: r, col: found };
      }
    } else {
      var idx2 = this.col > 0 ? this.lines[this.row].lastIndexOf(pat, this.col - 1) : -1;
      if (idx2 >= 0 && idx2 < this.col) return { row: this.row, col: idx2 };
      for (var j = 1; j <= total; j++) {
        var r2 = (this.row - j + total * 2) % total;
        var found2 = this.lines[r2].lastIndexOf(pat);
        if (found2 >= 0) return { row: r2, col: found2 };
      }
    }
    return null;
  };

  /* ---------------- text objects ---------------- */

  // returns {start, end} charwise exclusive range, or null
  VimEngine.prototype.textObject = function (objChar, around) {
    var row = this.row, col = this.col, line = this.line();

    if (objChar === 'w') {
      if (line.length === 0) return null;
      var c = cls(line[col]);
      var s = col, e = col;
      while (s > 0 && cls(line[s - 1]) === c) s--;
      while (e < line.length - 1 && cls(line[e + 1]) === c) e++;
      if (around) {
        var e2 = e;
        while (e2 < line.length - 1 && cls(line[e2 + 1]) === 0) e2++;
        if (e2 === e) { // no trailing space: take leading
          while (s > 0 && cls(line[s - 1]) === 0) s--;
        }
        e = e2;
      }
      return { start: { row: row, col: s }, end: { row: row, col: e + 1 } };
    }

    if (objChar === '"' || objChar === "'" || objChar === '`') {
      var positions = [];
      for (var i = 0; i < line.length; i++) if (line[i] === objChar) positions.push(i);
      for (var k = 0; k + 1 < positions.length; k += 2) {
        var openQ = positions[k], closeQ = positions[k + 1];
        if (closeQ >= col || openQ >= col) {
          if (around) return { start: { row: row, col: openQ }, end: { row: row, col: closeQ + 1 } };
          return { start: { row: row, col: openQ + 1 }, end: { row: row, col: closeQ } };
        }
      }
      return null;
    }

    var open = null;
    if (objChar === '(' || objChar === ')' || objChar === 'b') open = '(';
    else if (objChar === '[' || objChar === ']') open = '[';
    else if (objChar === '{' || objChar === '}' || objChar === 'B') open = '{';
    else if (objChar === '<' || objChar === '>') open = '<';
    if (!open) return null;
    var close = BRACKETS[open];

    // scan back (inclusive of cursor) for unmatched open
    var depth = 0;
    var p = { row: row, col: Math.min(col, Math.max(0, line.length - 1)) };
    if (line.length === 0) p = { row: row, col: 0 };
    var openPos = null;
    var q = p;
    while (q) {
      var ch = this.charAt(q);
      if (ch === close && !posEq(q, p)) depth++;
      else if (ch === open) {
        if (depth === 0) { openPos = q; break; }
        depth--;
      }
      q = this.retreat(q);
    }
    if (!openPos) return null;
    // scan forward from openPos for matching close
    depth = 0;
    var r = openPos;
    var closePos = null;
    while (r) {
      var ch2 = this.charAt(r);
      if (ch2 === open) depth++;
      else if (ch2 === close) {
        depth--;
        if (depth === 0) { closePos = r; break; }
      }
      r = this.advance(r);
    }
    if (!closePos) return null;
    if (around) {
      return { start: openPos, end: { row: closePos.row, col: closePos.col + 1 } };
    }
    var innerStart = this.advance(openPos);
    return { start: innerStart, end: closePos };
  };

  /* ---------------- operators ---------------- */

  VimEngine.prototype.totalCount = function () {
    var a = this.count === '' ? 1 : parseInt(this.count, 10);
    var b = this.opCount === '' ? 1 : parseInt(this.opCount, 10);
    return a * b;
  };
  VimEngine.prototype.resetPending = function () {
    this.count = '';
    this.opCount = '';
    this.op = null;
    this.pendingChar = null;
    this.gPending = false;
  };

  VimEngine.prototype.operateLinewise = function (op, r1, r2) {
    var lo = Math.min(r1, r2), hi = Math.max(r1, r2);
    hi = Math.min(hi, this.lastRow());
    var rows = this.lines.slice(lo, hi + 1);
    if (op === 'y') {
      this.register = { rows: rows, linewise: true };
      this.setCursor(lo, this.col);
      return;
    }
    if (op === '>' || op === '<') {
      this.beginChange();
      for (var r = lo; r <= hi; r++) {
        if (op === '>') {
          if (this.lines[r].length) this.lines[r] = SHIFT + this.lines[r];
        } else {
          this.lines[r] = this.lines[r].replace(/^ {1,2}/, '');
        }
      }
      this.setCursor(lo, this.firstNonBlank(lo));
      return;
    }
    // d or c
    this.beginChange();
    this.register = { rows: rows, linewise: true };
    if (op === 'd') {
      this.lines.splice(lo, hi - lo + 1);
      if (this.lines.length === 0) this.lines = [''];
      var nr = Math.min(lo, this.lastRow());
      this.setCursor(nr, this.firstNonBlank(nr));
    } else { // c
      this.lines.splice(lo, hi - lo + 1, '');
      this.row = lo; this.col = 0;
      this.enterInsert();
    }
  };

  VimEngine.prototype.operateRange = function (op, start, end) {
    // charwise, end exclusive
    if (op === '>' || op === '<') {
      this.operateLinewise(op, start.row, end.row);
      return;
    }
    var empty = this.rangeEmpty(start, end);
    if (op === 'y') {
      if (!empty) this.register = { pieces: this.getRange(start, end), linewise: false };
      this.setCursor(start.row, start.col);
      return;
    }
    if (op === '~') {
      if (empty) return;
      this.beginChange();
      var self = this;
      var pieces = this.getRange(start, end);
      var flipped = pieces.map(function (s) {
        return s.replace(/[a-zA-Z]/g, function (ch) {
          return ch === ch.toLowerCase() ? ch.toUpperCase() : ch.toLowerCase();
        });
      });
      // re-insert flipped text
      this.deleteRange(start, end);
      this.insertPiecesAt(start, flipped);
      this.setCursor(start.row, start.col);
      return;
    }
    // d / c
    if (!empty) {
      this.beginChange();
      var del = this.deleteRange(start, end);
      this.register = { pieces: del, linewise: false };
    }
    if (op === 'c') {
      this.row = start.row;
      this.col = Math.min(start.col, this.lines[start.row].length);
      this.enterInsert(true); // allow col === length for appends at EOL
    } else {
      this.setCursor(start.row, start.col);
    }
  };

  VimEngine.prototype.insertPiecesAt = function (pos, pieces) {
    var line = this.lines[pos.row];
    if (pieces.length === 1) {
      this.lines[pos.row] = line.slice(0, pos.col) + pieces[0] + line.slice(pos.col);
      return { row: pos.row, col: pos.col + pieces[0].length };
    }
    var head = line.slice(0, pos.col) + pieces[0];
    var tail = pieces[pieces.length - 1] + line.slice(pos.col);
    var mid = pieces.slice(1, -1);
    this.lines.splice(pos.row, 1, head);
    var insertAt = pos.row + 1;
    for (var i = 0; i < mid.length; i++) this.lines.splice(insertAt + i, 0, mid[i]);
    this.lines.splice(insertAt + mid.length, 0, tail);
    return { row: insertAt + mid.length, col: pieces[pieces.length - 1].length };
  };

  // motion result: {row, col, kind} kind: 'e' exclusive | 'i' inclusive | 'l' linewise
  VimEngine.prototype.applyMotionResult = function (t, motionKey) {
    if (!t) { this.resetPending(); return; }
    if (this.op) {
      var op = this.op;
      if (t.kind === 'l') {
        this.operateLinewise(op, this.row, t.row);
      } else {
        var start = { row: this.row, col: this.col };
        var end = { row: t.row, col: t.col };
        var fwd = posLE(start, end);
        var a = fwd ? start : end;
        var b = fwd ? end : start;
        if (t.kind === 'i') b = { row: b.row, col: b.col + 1 };
        // dw / cw special: don't cross line end when deleting
        if (motionKey === 'w' && b.row > a.row && op !== 'y') {
          b = { row: a.row, col: this.lines[a.row].length };
        }
        this.operateRange(op, a, b);
      }
      this.resetPending();
    } else {
      this.setCursor(t.row, t.col);
      if (this.mode === MODE.NORMAL || this.mode === MODE.VISUAL || this.mode === MODE.VLINE) {
        // for $ allow cursor on last char only (already clamped)
      }
      this.count = '';
    }
  };

  /* ---------------- insert mode ---------------- */

  VimEngine.prototype.enterInsert = function () {
    this.mode = MODE.INSERT;
  };

  VimEngine.prototype.insertKey = function (k) {
    if (k === '<Esc>') {
      this.mode = MODE.NORMAL;
      this.col = Math.max(0, this.col - 1);
      this.col = this.clampCol(this.row, this.col);
      return;
    }
    if (k === '<CR>') {
      this.beginChange();
      var line = this.lines[this.row];
      var head = line.slice(0, this.col), tail = line.slice(this.col);
      this.lines.splice(this.row, 1, head, tail);
      this.row++;
      this.col = 0;
      return;
    }
    if (k === '<BS>') {
      if (this.col > 0) {
        this.beginChange();
        var l = this.lines[this.row];
        this.lines[this.row] = l.slice(0, this.col - 1) + l.slice(this.col);
        this.col--;
      } else if (this.row > 0) {
        this.beginChange();
        var prev = this.lines[this.row - 1];
        this.col = prev.length;
        this.lines.splice(this.row - 1, 2, prev + this.lines[this.row]);
        this.row--;
      }
      return;
    }
    if (k === '<Tab>') k = SHIFT;
    if (k.length >= 1 && k[0] !== '<') {
      this.beginChange();
      var ln = this.lines[this.row];
      this.lines[this.row] = ln.slice(0, this.col) + k + ln.slice(this.col);
      this.col += k.length;
    }
  };

  /* ---------------- ex command line (:w :q …) ---------------- */

  VimEngine.prototype.cmdKey = function (k) {
    if (k === '<Esc>') { this.mode = MODE.NORMAL; this.cmdBuf = ''; return; }
    if (k === '<BS>') {
      if (this.cmdBuf.length === 0) { this.mode = MODE.NORMAL; return; }
      this.cmdBuf = this.cmdBuf.slice(0, -1);
      return;
    }
    if (k === '<CR>') {
      var cmd = this.cmdBuf;
      this.mode = MODE.NORMAL;
      this.cmdBuf = '';
      this.execEx(cmd);
      return;
    }
    if (k.length === 1) this.cmdBuf += k;
  };

  VimEngine.prototype.writeFile = function () {
    this.savedLines = this.lines.slice();
    this.modified = false;
    this.lastMessage = '"' + this.fileName + '" written';
  };

  VimEngine.prototype.execEx = function (cmd) {
    cmd = cmd.trim();
    if (cmd === 'w') { this.writeFile(); return; }
    if (cmd === 'q') {
      if (this.modified) {
        this.lastMessage = 'E37: No write since last change (add ! to override)';
      } else {
        this.quit = true;
      }
      return;
    }
    if (cmd === 'q!') {
      // discard changes: the "file" keeps its last written contents
      this.lines = this.savedLines.slice();
      this.setCursor(this.row, this.col);
      this.modified = false;
      this.quit = true;
      return;
    }
    if (cmd === 'wq' || cmd === 'x') {
      this.writeFile();
      this.quit = true;
      return;
    }
    if (cmd.length) this.lastMessage = 'E492: Not an editor command: ' + cmd;
  };

  /* ---------------- macros (qa…q, @a, @@) ---------------- */

  VimEngine.prototype.playMacro = function (reg) {
    var tokens = this.macros[reg];
    if (!tokens || !tokens.length || this._macroReplay) return;
    this.lastMacroReg = reg;
    this._macroReplay = true;
    for (var i = 0; i < tokens.length; i++) this.key(tokens[i]);
    this._macroReplay = false;
  };

  /* ---------------- search mode ---------------- */

  VimEngine.prototype.searchKey = function (k) {
    if (k === '<Esc>') { this.mode = MODE.NORMAL; this.searchBuf = ''; return; }
    if (k === '<BS>') { this.searchBuf = this.searchBuf.slice(0, -1); return; }
    if (k === '<CR>') {
      this.mode = MODE.NORMAL;
      if (this.searchBuf) {
        this.lastSearch = { pat: this.searchBuf, dir: this.searchDir };
        var m = this.findMatch(this.searchBuf, this.searchDir);
        if (m) this.setCursor(m.row, m.col);
      }
      this.searchBuf = '';
      return;
    }
    if (k.length === 1) this.searchBuf += k;
  };

  /* ---------------- pending-char (f F t T r, text objects) ------- */

  VimEngine.prototype.handlePendingChar = function (k) {
    var pc = this.pendingChar;
    this.pendingChar = null;
    if (k.length !== 1) { this.resetPending(); return; } // Esc etc. cancels

    if (pc.type === 'obj') {
      if (!this.op && this.mode === MODE.NORMAL) { this.resetPending(); return; }
      var range = this.textObject(k, pc.around);
      if (!range) { this.resetPending(); return; }
      var op = this.op || 'd';
      if (this.mode === MODE.VISUAL || this.mode === MODE.VLINE) { this.resetPending(); return; }
      this.operateRange(op, range.start, range.end);
      this.resetPending();
      return;
    }

    if (pc.type === 'qreg') {
      if (/^[a-z]$/.test(k)) {
        this.recordingReg = k;
        this.recordedKeys = [];
      }
      this.resetPending();
      return;
    }

    if (pc.type === 'at') {
      this.resetPending();
      if (k === '@') this.playMacro(this.lastMacroReg);
      else if (/^[a-z]$/.test(k)) this.playMacro(k);
      return;
    }

    if (pc.type === 'r') {
      var line = this.line();
      if (line.length > 0) {
        this.beginChange();
        this.lines[this.row] = line.slice(0, this.col) + k + line.slice(this.col + 1);
      }
      this.resetPending();
      return;
    }

    // f F t T
    var n = this.totalCount();
    var col = this.col;
    var ok = true;
    var saved = this.col;
    for (var i = 0; i < n; i++) {
      var res = this.findCharCol(pc.type, k, undefined);
      if (res < 0) { ok = false; break; }
      // temporarily move for repeated counts
      var realCol = res;
      if (pc.type === 't' && i < n - 1) realCol = res + 1;
      if (pc.type === 'T' && i < n - 1) realCol = res - 1;
      this.col = realCol;
    }
    var target = this.col;
    this.col = saved;
    if (!ok) { this.resetPending(); return; }
    this.lastFind = { type: pc.type, ch: k };
    var kind = (pc.type === 'f' || pc.type === 't') ? 'i' : 'e';
    this.applyMotionResult({ row: this.row, col: target, kind: kind }, pc.type);
    this.count = ''; this.opCount = '';
  };

  VimEngine.prototype.repeatFind = function (reverse) {
    if (!this.lastFind) return;
    var type = this.lastFind.type, ch = this.lastFind.ch;
    if (reverse) {
      type = { f: 'F', F: 'f', t: 'T', T: 't' }[type];
    }
    var fromCol;
    if (type === 't') fromCol = this.col + 2;
    else if (type === 'T') fromCol = this.col - 2;
    var res = this.findCharCol(type, ch, fromCol);
    if (res < 0) return;
    var kind = (type === 'f' || type === 't') ? 'i' : 'e';
    this.applyMotionResult({ row: this.row, col: res, kind: kind }, type);
  };

  /* ---------------- visual mode ---------------- */

  VimEngine.prototype.visualRange = function () {
    var a = this.visual, b = { row: this.row, col: this.col };
    if (this.mode === MODE.VLINE) {
      return { lo: Math.min(a.row, b.row), hi: Math.max(a.row, b.row), linewise: true };
    }
    var start = posLE(a, b) ? a : b;
    var end = posLE(a, b) ? b : a;
    return { start: start, end: { row: end.row, col: end.col + 1 }, linewise: false };
  };

  VimEngine.prototype.visualOperate = function (op) {
    var vr = this.visualRange();
    var wasVline = this.mode === MODE.VLINE;
    this.mode = MODE.NORMAL;
    this.visual = null;
    if (wasVline) {
      this.operateLinewise(op === 'x' ? 'd' : op, vr.lo, vr.hi);
    } else {
      var end = { row: vr.end.row, col: Math.min(vr.end.col, this.lines[vr.end.row].length) };
      this.operateRange(op === 'x' ? 'd' : op, vr.start, end);
    }
    this.resetPending();
  };

  /* ---------------- paste ---------------- */

  VimEngine.prototype.paste = function (before) {
    if (!this.register) return;
    this.beginChange();
    if (this.register.linewise) {
      var at = before ? this.row : this.row + 1;
      var rows = this.register.rows;
      for (var i = 0; i < rows.length; i++) this.lines.splice(at + i, 0, rows[i]);
      this.setCursor(at, this.firstNonBlank(at));
    } else {
      var line = this.lines[this.row];
      var col = before ? this.col : (line.length === 0 ? 0 : this.col + 1);
      var endPos = this.insertPiecesAt({ row: this.row, col: col }, this.register.pieces);
      this.setCursor(endPos.row, Math.max(0, endPos.col - 1));
    }
  };

  /* ---------------- normal mode dispatch ---------------- */

  VimEngine.prototype.motionFor = function (k) {
    var n = this.totalCount();
    var row = this.row, col = this.col;
    var line = this.line();
    switch (k) {
      case 'h': return { row: row, col: Math.max(0, col - n), kind: 'e' };
      case 'l': case ' ':
        return { row: row, col: Math.min(Math.max(0, line.length - (this.op ? 0 : 1)), col + n), kind: 'e' };
      case 'j': return { row: Math.min(this.lastRow(), row + n), col: col, kind: 'l' };
      case 'k': return { row: Math.max(0, row - n), col: col, kind: 'l' };
      case '0': return { row: row, col: 0, kind: 'e' };
      case '^': return { row: row, col: this.firstNonBlank(row), kind: 'e' };
      case '$': {
        var r = Math.min(this.lastRow(), row + n - 1);
        return { row: r, col: Math.max(0, this.lines[r].length - (this.op ? 0 : 1)), kind: this.op ? 'e' : 'i' };
      }
      case 'w': {
        // vim quirk: cw on a non-blank behaves like ce
        if (this.op === 'c' && cls(line[col]) !== 0) {
          var pq = { row: row, col: col };
          for (var iq = 0; iq < n; iq++) pq = this.wordEnd(pq);
          return { row: pq.row, col: pq.col, kind: 'i' };
        }
        var p = { row: row, col: col };
        for (var i = 0; i < n; i++) p = this.wordForward(p);
        return { row: p.row, col: p.col, kind: 'e' };
      }
      case 'b': {
        var pb = { row: row, col: col };
        for (var ib = 0; ib < n; ib++) pb = this.wordBack(pb);
        return { row: pb.row, col: pb.col, kind: 'e' };
      }
      case 'e': {
        var pe = { row: row, col: col };
        for (var ie = 0; ie < n; ie++) pe = this.wordEnd(pe);
        return { row: pe.row, col: pe.col, kind: 'i' };
      }
      case 'G': {
        var gr = (this.count !== '' || this.opCount !== '') ? n - 1 : this.lastRow();
        gr = Math.min(gr, this.lastRow());
        return { row: gr, col: this.firstNonBlank(gr), kind: 'l' };
      }
      case '{': { var t1 = this.paraBack(); return { row: t1.row, col: t1.col, kind: 'e' }; }
      case '}': { var t2 = this.paraForward(); return { row: t2.row, col: t2.col, kind: 'e' }; }
      case '%': {
        var m = this.matchBracket();
        return m ? { row: m.row, col: m.col, kind: 'i' } : null;
      }
      case 'n': case 'N': {
        if (!this.lastSearch) return null;
        var dir = this.lastSearch.dir * (k === 'n' ? 1 : -1);
        var found = this.findMatch(this.lastSearch.pat, dir);
        return found ? { row: found.row, col: found.col, kind: 'e' } : null;
      }
    }
    return undefined; // not a motion
  };

  VimEngine.prototype.normalKey = function (k) {
    var inVisual = this.mode === MODE.VISUAL || this.mode === MODE.VLINE;

    if (this.pendingChar) { this.handlePendingChar(k); return; }

    if (this.zPending) {
      this.zPending = false;
      if (k === 'Z') { this.writeFile(); this.quit = true; }
      return;
    }

    if (this.gPending) {
      this.gPending = false;
      if (k === 'g') {
        var gr = (this.count !== '' || this.opCount !== '') ? this.totalCount() - 1 : 0;
        gr = Math.min(gr, this.lastRow());
        this.applyMotionResult({ row: gr, col: this.firstNonBlank(gr), kind: 'l' }, 'gg');
        this.count = ''; this.opCount = '';
      } else {
        this.resetPending();
      }
      return;
    }

    // counts
    if (/^[0-9]$/.test(k)) {
      var buf = this.op ? this.opCount : this.count;
      if (!(k === '0' && buf === '')) {
        if (this.op) this.opCount += k; else this.count += k;
        return;
      }
    }

    if (k === '<Esc>') {
      this.resetPending();
      if (inVisual) { this.mode = MODE.NORMAL; this.visual = null; }
      return;
    }

    // operator pending: doubled operator => linewise
    if (this.op && (k === this.op)) {
      var nLines = this.totalCount();
      this.operateLinewise(this.op, this.row, Math.min(this.lastRow(), this.row + nLines - 1));
      this.resetPending();
      return;
    }
    if (this.op && (k === 'i' || k === 'a')) {
      this.pendingChar = { type: 'obj', around: k === 'a' };
      return;
    }

    // motions
    var motionResult = this.motionFor(k);
    if (motionResult !== undefined) {
      this.applyMotionResult(motionResult, k);
      return;
    }

    if (k === 'g') { this.gPending = true; return; }
    if (k === 'f' || k === 'F' || k === 't' || k === 'T') {
      this.pendingChar = { type: k }; return;
    }
    if (k === ';') { this.repeatFind(false); return; }
    if (k === ',') { this.repeatFind(true); return; }

    if (k === '/' || k === '?') {
      this.resetPending();
      this.mode = MODE.SEARCH;
      this.searchDir = k === '/' ? 1 : -1;
      this.searchBuf = '';
      return;
    }

    if (k === ':' && !inVisual) {
      this.resetPending();
      this.mode = MODE.COMMAND;
      this.cmdBuf = '';
      return;
    }

    // visual mode operators
    if (inVisual) {
      if (k === 'v') {
        if (this.mode === MODE.VISUAL) { this.mode = MODE.NORMAL; this.visual = null; }
        else this.mode = MODE.VISUAL;
        return;
      }
      if (k === 'V') {
        if (this.mode === MODE.VLINE) { this.mode = MODE.NORMAL; this.visual = null; }
        else this.mode = MODE.VLINE;
        return;
      }
      if ('dcyx><~'.indexOf(k) >= 0) { this.visualOperate(k); return; }
      if (k === 'o') {
        var tmp = this.visual;
        this.visual = { row: this.row, col: this.col };
        this.setCursor(tmp.row, tmp.col);
        return;
      }
      return; // other keys ignored in visual
    }

    if (this.op) { this.resetPending(); return; } // invalid motion after operator

    var n = this.totalCount();
    var line = this.line();

    switch (k) {
      case 'd': case 'c': case 'y': case '>': case '<':
        this.op = k; return;

      case 'x': {
        if (line.length === 0) { this.count = ''; return; }
        var endX = { row: this.row, col: Math.min(line.length, this.col + n) };
        this.operateRange('d', { row: this.row, col: this.col }, endX);
        this.count = ''; return;
      }
      case 'X': {
        if (this.col === 0) { this.count = ''; return; }
        var startX = { row: this.row, col: Math.max(0, this.col - n) };
        this.operateRange('d', startX, { row: this.row, col: this.col });
        this.count = ''; return;
      }
      case 'D': {
        if (this.col < line.length) {
          this.operateRange('d', { row: this.row, col: this.col }, { row: this.row, col: line.length });
        }
        this.count = ''; return;
      }
      case 'C': {
        this.operateRange('c', { row: this.row, col: this.col }, { row: this.row, col: line.length });
        this.count = ''; return;
      }
      case 'Y': {
        this.operateLinewise('y', this.row, Math.min(this.lastRow(), this.row + n - 1));
        this.count = ''; return;
      }
      case 's': {
        var endS = { row: this.row, col: Math.min(line.length, this.col + n) };
        this.operateRange('c', { row: this.row, col: this.col }, endS);
        this.count = ''; return;
      }
      case 'S': {
        this.operateLinewise('c', this.row, Math.min(this.lastRow(), this.row + n - 1));
        this.count = ''; return;
      }
      case 'r': this.pendingChar = { type: 'r' }; return;
      case '~': {
        if (line.length === 0) return;
        this.beginChange();
        var endT = Math.min(line.length, this.col + n);
        var seg = line.slice(this.col, endT).replace(/[a-zA-Z]/g, function (ch) {
          return ch === ch.toLowerCase() ? ch.toUpperCase() : ch.toLowerCase();
        });
        this.lines[this.row] = line.slice(0, this.col) + seg + line.slice(endT);
        this.col = this.clampCol(this.row, endT);
        this.count = ''; return;
      }
      case 'J': {
        var joins = Math.max(1, n === 1 ? 1 : n - 1);
        for (var ji = 0; ji < joins; ji++) {
          if (this.row >= this.lastRow()) break;
          this.beginChange();
          var cur = this.lines[this.row];
          var nxt = this.lines[this.row + 1].replace(/^\s+/, '');
          var joined = cur.length === 0 ? nxt : cur + (nxt.length ? ' ' + nxt : '');
          this.col = cur.length === 0 ? 0 : cur.length;
          this.lines.splice(this.row, 2, joined);
        }
        this.col = this.clampCol(this.row, this.col);
        this.count = ''; return;
      }

      case 'i': this.enterInsert(); this.count = ''; return;
      case 'a':
        if (line.length > 0) this.col = this.col + 1;
        this.enterInsert(); this.count = ''; return;
      case 'I': this.col = this.firstNonBlank(this.row); this.enterInsert(); this.count = ''; return;
      case 'A': this.col = line.length; this.enterInsert(); this.count = ''; return;
      case 'o': {
        this.beginChange();
        this.lines.splice(this.row + 1, 0, '');
        this.row++; this.col = 0;
        this.enterInsert(); this.count = ''; return;
      }
      case 'O': {
        this.beginChange();
        this.lines.splice(this.row, 0, '');
        this.col = 0;
        this.enterInsert(); this.count = ''; return;
      }

      case 'p': this.paste(false); this.count = ''; return;
      case 'P': this.paste(true); this.count = ''; return;

      case 'u': this._cmdNonRepeat = true; this.undo(); this.count = ''; return;
      case '<C-r>': this._cmdNonRepeat = true; this.redo(); this.count = ''; return;

      case 'v': this.mode = MODE.VISUAL; this.visual = { row: this.row, col: this.col }; this._cmdNonRepeat = false; return;
      case 'V': this.mode = MODE.VLINE; this.visual = { row: this.row, col: this.col }; return;

      case 'q': {
        if (this.recordingReg) {
          // the terminating q itself must not be part of the recording
          this.recordedKeys.pop();
          this.macros[this.recordingReg] = this.recordedKeys.slice();
          this.recordingReg = null;
          this.recordedKeys = [];
        } else {
          this.pendingChar = { type: 'qreg' };
        }
        return;
      }
      case '@': this.pendingChar = { type: 'at' }; return;
      case 'Z': this.zPending = true; return;

      case '.': {
        this._cmdNonRepeat = true;
        if (this.lastChange && !this.replaying) {
          var keys = this.lastChange.slice();
          this.replaying = true;
          for (var di = 0; di < keys.length; di++) this.key(keys[di]);
          this.replaying = false;
        }
        this.count = ''; return;
      }
    }
    // unknown key: clear count
    this.count = '';
  };

  /* ---------------- main entry ---------------- */

  VimEngine.prototype.key = function (k) {
    // macro recording captures every key as typed (the stop-q is popped off)
    if (this.recordingReg && !this._macroReplay) this.recordedKeys.push(k);
    // a message survives exactly until the next keypress
    var msgBefore = this.lastMessage;

    var idleAtStart = this.mode === MODE.NORMAL && !this.op && !this.pendingChar &&
      !this.gPending && this.count === '';
    if (idleAtStart) {
      this._cmdUndoDone = false;
      if (!this.replaying) {
        this._cmdKeys = [];
        this._cmdStartTick = this.changeTick;
        this._cmdNonRepeat = false;
      }
    }
    if (!this.replaying) this._cmdKeys.push(k);

    if (this.mode === MODE.SEARCH) this.searchKey(k);
    else if (this.mode === MODE.COMMAND) this.cmdKey(k);
    else if (this.mode === MODE.INSERT) this.insertKey(k);
    else this.normalKey(k);

    if (msgBefore && this.lastMessage === msgBefore) this.lastMessage = '';

    if (!this.replaying) {
      var idleAtEnd = this.mode === MODE.NORMAL && !this.op && !this.pendingChar && !this.gPending;
      if (idleAtEnd && this.changeTick > this._cmdStartTick &&
          !this._cmdNonRepeat && this._cmdKeys.length) {
        this.lastChange = this._cmdKeys.slice();
        this._cmdKeys = [];
        this._cmdStartTick = this.changeTick;
      }
    }
  };

  /* ---------------- state for UI / game ---------------- */

  VimEngine.prototype.pendingDisplay = function () {
    var s = this.count;
    if (this.op) s += this.op + this.opCount;
    if (this.gPending) s += 'g';
    if (this.zPending) s += 'Z';
    if (this.pendingChar) {
      if (this.pendingChar.type === 'obj') s += this.pendingChar.around ? 'a' : 'i';
      else if (this.pendingChar.type === 'qreg') s += 'q';
      else if (this.pendingChar.type === 'at') s += '@';
      else s += this.pendingChar.type;
    }
    return s;
  };

  VimEngine.prototype.getState = function () {
    var sel = null;
    if (this.visual) {
      var vr = this.visualRange();
      sel = vr.linewise
        ? { linewise: true, lo: vr.lo, hi: vr.hi }
        : { linewise: false, start: vr.start, end: vr.end };
    }
    return {
      lines: this.lines.slice(),
      row: this.row,
      col: this.col,
      mode: this.mode,
      pending: this.pendingDisplay(),
      search: this.mode === MODE.SEARCH ? (this.searchDir === 1 ? '/' : '?') + this.searchBuf : null,
      cmd: this.mode === MODE.COMMAND ? ':' + this.cmdBuf : null,
      message: this.lastMessage,
      recording: this.recordingReg,
      modified: this.modified,
      selection: sel
    };
  };

  VimEngine.prototype.equals = function (target) {
    if (this.lines.length !== target.length) return false;
    for (var i = 0; i < target.length; i++) {
      if (this.lines[i] !== target[i]) return false;
    }
    return true;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = VimEngine;
  if (typeof window !== 'undefined') window.VimEngine = VimEngine;
})();
