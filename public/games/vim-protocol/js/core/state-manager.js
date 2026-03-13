// StateManager - Centralized state management with Observer pattern
class StateManager {
  constructor() {
    this.state = {
      currentLevel: 0,
      levelsCompleted: [],
      vimState: null,
      missionState: {
        objectives: [],
        completedObjectives: [],
        hints: [],
        attempts: 0
      },
      playerStats: {
        totalCommands: 0,
        timeSpent: 0,
        startTime: null
      }
    };

    this.listeners = {};
  }

  // Get current state
  getState() {
    return { ...this.state };
  }

  // Update state
  setState(updates) {
    this.state = { ...this.state, ...updates };
    this.emit('stateChange', this.state);
  }

  // Update vim state
  setVimState(vimState) {
    this.state.vimState = vimState;
    this.emit('vimStateChange', vimState);
  }

  // Update mission state
  setMissionState(missionState) {
    this.state.missionState = { ...this.state.missionState, ...missionState };
    this.emit('missionStateChange', this.state.missionState);
  }

  // Mark objective as complete
  completeObjective(objectiveId) {
    if (!this.state.missionState.completedObjectives.includes(objectiveId)) {
      this.state.missionState.completedObjectives.push(objectiveId);

      // Update objective status in objectives array
      this.state.missionState.objectives = this.state.missionState.objectives.map(obj => ({
        ...obj,
        completed: obj.id === objectiveId ? true : obj.completed,
        active: false // Will be set by setActiveObjective
      }));

      this.emit('objectiveComplete', objectiveId);
      this.emit('missionStateChange', this.state.missionState);

      // Check if all objectives are complete
      const allComplete = this.areAllObjectivesComplete();
      console.log(`Objective ${objectiveId} completed. ${this.state.missionState.completedObjectives.length}/${this.state.missionState.objectives.length} done. All complete: ${allComplete}`);
      if (allComplete) {
        console.log('Emitting levelComplete event');
        this.emit('levelComplete');
      }
    }
  }

  // Set the currently active objective (the one player should work on)
  setActiveObjective(objectiveId) {
    this.state.missionState.activeObjectiveId = objectiveId;

    // Update active status in objectives array
    this.state.missionState.objectives = this.state.missionState.objectives.map(obj => ({
      ...obj,
      active: obj.id === objectiveId
    }));

    this.emit('activeObjectiveChange', objectiveId);
    this.emit('missionStateChange', this.state.missionState);
  }

  // Check if all objectives are complete
  areAllObjectivesComplete() {
    const { objectives, completedObjectives } = this.state.missionState;
    return objectives.length > 0 &&
           completedObjectives.length === objectives.length;
  }

  // Complete current level
  completeLevel() {
    const currentLevel = this.state.currentLevel;
    if (!this.state.levelsCompleted.includes(currentLevel)) {
      this.state.levelsCompleted.push(currentLevel);
      this.emit('levelCompleted', currentLevel);
    }
  }

  // Go to next level
  nextLevel() {
    this.state.currentLevel++;
    this.state.missionState = {
      objectives: [],
      completedObjectives: [],
      hints: [],
      attempts: 0
    };
    this.emit('levelChange', this.state.currentLevel);
  }

  // Set current level
  setLevel(levelNum) {
    this.state.currentLevel = levelNum;
    this.state.missionState = {
      objectives: [],
      completedObjectives: [],
      hints: [],
      attempts: 0
    };
    this.emit('levelChange', levelNum);
  }

  // Increment command count
  incrementCommands() {
    this.state.playerStats.totalCommands++;
    this.emit('statsUpdate', this.state.playerStats);
  }

  // Start timer
  startTimer() {
    this.state.playerStats.startTime = Date.now();
  }

  // Get elapsed time
  getElapsedTime() {
    if (!this.state.playerStats.startTime) return 0;
    return Math.floor((Date.now() - this.state.playerStats.startTime) / 1000);
  }

  // Event system
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  // Remove listener
  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }
}
