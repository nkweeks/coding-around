// Terminal - Terminal output controller (for future use)
class Terminal {
  constructor() {
    // Placeholder for terminal-style output functionality
    // Can be used for displaying messages, errors, or debug info
  }

  log(message, type = 'info') {
    console.log(`[${type.toUpperCase()}]`, message);
  }

  error(message) {
    this.log(message, 'error');
  }

  success(message) {
    this.log(message, 'success');
  }

  warning(message) {
    this.log(message, 'warning');
  }
}
