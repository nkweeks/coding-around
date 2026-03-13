// LevelManager - Manages level loading and progression
class LevelManager {
  constructor(vimSimulator, stateManager, validator) {
    this.vim = vimSimulator;
    this.stateManager = stateManager;
    this.validator = validator;
    this.currentLevel = null;
  }

  // Load a level
  loadLevel(levelNum) {
    if (levelNum < 0 || levelNum >= LEVELS.length) {
      console.error('Invalid level number:', levelNum);
      return false;
    }

    this.currentLevel = LEVELS[levelNum];
    this.stateManager.setLevel(levelNum);

    // Set vim content
    this.vim.setContent(this.currentLevel.initialBuffer);

    // Set initial cursor position if specified
    if (this.currentLevel.initialCursor) {
      const { line, col } = this.currentLevel.initialCursor;
      this.vim.cursor.setPosition(line || 0, col || 0);
      this.vim.render();
    }

    // Load objectives into validator
    this.validator.loadLevel(this.currentLevel);

    // Note: Timer is started in game.js when mission briefing closes

    return true;
  }

  // Get current level data
  getCurrentLevel() {
    return this.currentLevel;
  }

  // Get total level count
  getLevelCount() {
    return LEVELS.length;
  }

  // Go to next level
  nextLevel() {
    const state = this.stateManager.getState();
    const nextLevelNum = state.currentLevel + 1;

    if (nextLevelNum >= LEVELS.length) {
      return false; // No more levels
    }

    this.loadLevel(nextLevelNum);
    return true;
  }

  // Check if there's a next level
  hasNextLevel() {
    const state = this.stateManager.getState();
    return state.currentLevel + 1 < LEVELS.length;
  }
}
