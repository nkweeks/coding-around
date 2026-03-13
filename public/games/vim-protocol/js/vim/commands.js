// CommandParser - Parse vim commands with proper handling
class CommandParser {
  constructor() {
    // Simple motions (single key, no argument)
    this.simpleMotions = ['h', 'j', 'k', 'l', 'w', 'W', 'b', 'B', 'e', 'E', '0', '$', '^'];

    // Operators that take a motion
    this.operators = ['d', 'c', 'y', '>', '<'];

    // Standalone commands (no motion needed)
    this.standaloneCommands = ['x', 'X', 'p', 'P', 'u', 'J', 'D', 'C', 'Y', 's', 'S', '~', '%', ';'];

    // Mode-changing commands
    this.modeCommands = ['i', 'I', 'a', 'A', 'o', 'O', 'v', 'V', 'R'];

    // Commands that need a character argument
    this.charArgCommands = ['f', 'F', 't', 'T', 'r'];

    // Double commands (dd, yy, cc, >>, <<)
    this.doubleCommands = ['d', 'y', 'c', '>', '<'];

    // Text object modifiers
    this.textObjectModifiers = ['i', 'a'];

    // Text objects
    this.textObjects = ['w', 'W', 's', 'p', 'b', 'B', '"', "'", '`', '(', ')', '[', ']', '{', '}', '<', '>', 't'];
  }

  parse(keySequence) {
    if (!keySequence || keySequence.length === 0) {
      return { type: 'invalid' };
    }

    // Extract leading count if any (counts start with 1-9, never 0 — 0 is a motion)
    const countMatch = keySequence.match(/^([1-9]\d*)(.*)$/);
    let count = 1;
    let remaining = keySequence;

    if (countMatch && countMatch[1]) {
      count = parseInt(countMatch[1]);
      remaining = countMatch[2];

      // If only digits, still pending
      if (!remaining) {
        return { type: 'pending' };
      }
    }

    // Handle 'g' prefix commands
    if (remaining === 'g') {
      return { type: 'pending' };
    }

    if (remaining === 'gg') {
      return { type: 'complete', action: 'gotoLine', line: count > 1 ? count : 1 };
    }

    // Handle G command
    if (remaining === 'G') {
      return { type: 'complete', action: 'gotoLine', line: count > 1 ? count : 'last' };
    }

    // Handle simple motions
    if (remaining.length === 1 && this.simpleMotions.includes(remaining)) {
      return { type: 'complete', action: 'motion', motion: remaining, count };
    }

    // Handle standalone commands
    if (remaining.length === 1 && this.standaloneCommands.includes(remaining)) {
      return { type: 'complete', action: remaining, count };
    }

    // Handle mode commands
    if (remaining.length === 1 && this.modeCommands.includes(remaining)) {
      return { type: 'complete', action: 'mode', mode: remaining };
    }

    // Handle character argument commands (f, F, t, T, r)
    if (remaining.length === 1 && this.charArgCommands.includes(remaining)) {
      return { type: 'pending' };
    }

    if (remaining.length === 2 && this.charArgCommands.includes(remaining[0])) {
      const cmd = remaining[0];
      const char = remaining[1];

      if (cmd === 'r') {
        return { type: 'complete', action: 'replace', char, count };
      } else {
        return { type: 'complete', action: 'findChar', direction: cmd, char, count };
      }
    }

    // Handle operators
    if (remaining.length === 1 && this.operators.includes(remaining)) {
      return { type: 'pending' };
    }

    // Handle doubled operators (dd, yy, cc, >>, <<)
    if (remaining.length === 2 && remaining[0] === remaining[1] && this.doubleCommands.includes(remaining[0])) {
      return { type: 'complete', action: 'linewise', operator: remaining[0], count };
    }

    // Handle operator + motion
    if (remaining.length >= 2 && this.operators.includes(remaining[0])) {
      const operator = remaining[0];
      const motionPart = remaining.slice(1);

      // Check for text object (ciw, daw, yi", etc.)
      if (motionPart.length >= 2 && this.textObjectModifiers.includes(motionPart[0])) {
        if (motionPart.length === 1) {
          return { type: 'pending' };
        }

        const modifier = motionPart[0];
        const object = motionPart[1];

        if (this.textObjects.includes(object)) {
          return {
            type: 'complete',
            action: 'textObject',
            operator,
            modifier,
            object,
            count
          };
        }
      }

      // Check for operator + char search (df", dt(, etc.)
      if (motionPart.length >= 1 && this.charArgCommands.includes(motionPart[0]) && motionPart[0] !== 'r') {
        if (motionPart.length === 1) {
          return { type: 'pending' };
        }

        return {
          type: 'complete',
          action: 'operatorCharSearch',
          operator,
          direction: motionPart[0],
          char: motionPart[1],
          count
        };
      }

      // Check for operator + simple motion
      // Extract count from motion if present
      const motionCountMatch = motionPart.match(/^(\d*)(.+)$/);
      if (motionCountMatch) {
        const motionCount = motionCountMatch[1] ? parseInt(motionCountMatch[1]) : 1;
        const motion = motionCountMatch[2];

        if (motion.length === 1 && this.simpleMotions.includes(motion)) {
          return {
            type: 'complete',
            action: 'operatorMotion',
            operator,
            motion,
            count: count * motionCount
          };
        }

        // Could be building a longer motion
        if (motion.length === 0 || /^\d+$/.test(motionPart)) {
          return { type: 'pending' };
        }
      }
    }

    // Check if could be pending (building a valid sequence)
    if (this.couldBePending(remaining)) {
      return { type: 'pending' };
    }

    return { type: 'invalid' };
  }

  couldBePending(seq) {
    // Single operator waiting for motion
    if (seq.length === 1 && this.operators.includes(seq)) {
      return true;
    }

    // Operator + partial text object
    if (seq.length === 2 && this.operators.includes(seq[0]) && this.textObjectModifiers.includes(seq[1])) {
      return true;
    }

    // Operator + char search waiting for char
    if (seq.length === 2 && this.operators.includes(seq[0]) && this.charArgCommands.includes(seq[1])) {
      return true;
    }

    // Char search waiting for char
    if (seq.length === 1 && this.charArgCommands.includes(seq)) {
      return true;
    }

    // Building 'gg'
    if (seq === 'g') {
      return true;
    }

    // Operator + digits (building count for motion)
    if (seq.length >= 2 && this.operators.includes(seq[0]) && /^\d+$/.test(seq.slice(1))) {
      return true;
    }

    return false;
  }

  // Get description of a command for hints
  describe(cmd) {
    const descriptions = {
      'h': 'Move cursor left',
      'j': 'Move cursor down',
      'k': 'Move cursor up',
      'l': 'Move cursor right',
      'w': 'Move to next word',
      'b': 'Move to previous word',
      'e': 'Move to end of word',
      '0': 'Move to start of line',
      '$': 'Move to end of line',
      '^': 'Move to first non-blank character',
      'gg': 'Go to first line',
      'G': 'Go to last line (or line N with count)',
      'f': 'Find character forward',
      'F': 'Find character backward',
      't': 'Move till character forward',
      'T': 'Move till character backward',
      'x': 'Delete character under cursor',
      'X': 'Delete character before cursor',
      'dd': 'Delete entire line',
      'dw': 'Delete word',
      'd$': 'Delete to end of line',
      'D': 'Delete to end of line',
      'yy': 'Yank (copy) entire line',
      'yw': 'Yank word',
      'p': 'Paste after cursor',
      'P': 'Paste before cursor',
      'u': 'Undo',
      'i': 'Insert before cursor',
      'I': 'Insert at beginning of line',
      'a': 'Append after cursor',
      'A': 'Append at end of line',
      'o': 'Open new line below',
      'O': 'Open new line above',
      'r': 'Replace single character',
      'R': 'Enter replace mode',
      'cw': 'Change word',
      'cc': 'Change entire line',
      'c$': 'Change to end of line',
      'C': 'Change to end of line',
      'J': 'Join lines',
      'v': 'Enter visual mode',
      'V': 'Enter visual line mode',
      '%': 'Jump to matching bracket',
      'ciw': 'Change inner word',
      'diw': 'Delete inner word',
      'yiw': 'Yank inner word'
    };

    return descriptions[cmd] || '';
  }
}
