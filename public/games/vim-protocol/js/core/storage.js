// Storage - LocalStorage wrapper for game saves
class Storage {
  constructor() {
    this.SAVE_KEY = 'vim_game_save';
  }

  // Save game state
  save(data) {
    try {
      const saveData = {
        version: '1.0',
        lastPlayed: new Date().toISOString(),
        ...data
      };
      localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }

  // Load game state
  load() {
    try {
      const data = localStorage.getItem(this.SAVE_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('Failed to load game:', error);
      return null;
    }
  }

  // Clear save data
  clear() {
    try {
      localStorage.removeItem(this.SAVE_KEY);
      return true;
    } catch (error) {
      console.error('Failed to clear save:', error);
      return false;
    }
  }

  // Check if save exists
  hasSave() {
    return localStorage.getItem(this.SAVE_KEY) !== null;
  }
}
