// MissionValidator - Validates objective completion SEQUENTIALLY
class MissionValidator {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.currentLevel = null;
    this.completedObjectives = new Set();
    this.activeObjectiveIndex = 0;
  }

  // Load level objectives
  loadLevel(level) {
    this.currentLevel = level;
    this.completedObjectives.clear();
    this.activeObjectiveIndex = 0;

    // Set objectives in state
    this.stateManager.setMissionState({
      objectives: level.objectives.map((obj, index) => ({
        id: obj.id,
        description: obj.description,
        completed: false,
        active: index === 0 // First objective is active
      })),
      completedObjectives: [],
      activeObjectiveId: level.objectives[0]?.id || null,
      hints: level.objectives.map(obj => obj.hint)
    });
  }

  // Get the currently active objective (the one player should complete next)
  getActiveObjective() {
    if (!this.currentLevel || !this.currentLevel.objectives) {
      return null;
    }

    if (this.activeObjectiveIndex >= this.currentLevel.objectives.length) {
      return null; // All complete
    }

    return this.currentLevel.objectives[this.activeObjectiveIndex];
  }

  // Get active objective index
  getActiveObjectiveIndex() {
    return this.activeObjectiveIndex;
  }

  // Validate objectives against vim state - SEQUENTIAL ONLY
  validate(vimState) {
    if (!this.currentLevel || !this.currentLevel.objectives) {
      return [];
    }

    const completedNow = [];
    const objectives = this.currentLevel.objectives;

    // Only validate the NEXT incomplete objective
    // This ensures objectives must be completed in order
    for (let i = 0; i < objectives.length; i++) {
      const objective = objectives[i];

      // Skip already completed objectives
      if (this.completedObjectives.has(objective.id)) {
        continue;
      }

      // This is the current active objective - try to validate it
      try {
        const isComplete = objective.validator(vimState);

        if (isComplete) {
          this.completedObjectives.add(objective.id);
          this.stateManager.completeObjective(objective.id);
          completedNow.push(objective.id);

          // Move to next objective
          this.activeObjectiveIndex = i + 1;

          // Update active objective in state
          const nextObjective = objectives[i + 1];
          this.stateManager.setActiveObjective(
            nextObjective ? nextObjective.id : null
          );

          // Trigger celebration callback if exists
          if (objective.onComplete) {
            this.triggerCompletionFeedback(objective);
          }
        }
      } catch (error) {
        console.error('Validator error for objective:', objective.id, error);
      }

      // IMPORTANT: Stop here - don't check future objectives
      // This is what makes validation sequential
      break;
    }

    return completedNow;
  }

  // Trigger completion feedback (character quote, animation, etc.)
  triggerCompletionFeedback(objective) {
    // Dispatch custom event for UI to handle
    const event = new CustomEvent('objectiveComplete', {
      detail: {
        objective: objective,
        feedback: objective.onComplete
      }
    });
    document.dispatchEvent(event);
  }

  // Get completion status
  getCompletionStatus() {
    if (!this.currentLevel) return { completed: 0, total: 0, activeIndex: 0 };

    return {
      completed: this.completedObjectives.size,
      total: this.currentLevel.objectives.length,
      activeIndex: this.activeObjectiveIndex
    };
  }

  // Check if level is complete
  isLevelComplete() {
    const status = this.getCompletionStatus();
    return status.completed === status.total && status.total > 0;
  }

  // Get hint for current objective
  getCurrentHint() {
    const active = this.getActiveObjective();
    return active ? active.hint : null;
  }

  // Get teaching point for current objective
  getCurrentTeachingPoint() {
    const active = this.getActiveObjective();
    return active ? active.teachingPoint : null;
  }
}
