// Telemetry - lightweight level funnel tracking.
//
// Goal (VP-4): know *which level players quit on*. We record a per-level
// start -> complete funnel; the level where starts outnumber completes is the
// drop-off point. Works fully offline via localStorage. If a collection
// endpoint is ever configured (window.VIM_TELEMETRY_ENDPOINT), each event is
// also sent via navigator.sendBeacon. All tracking is best-effort and must
// never throw into the game loop.
//
// Inspect locally from the console: __vimTelemetry.getSummary()
class Telemetry {
  constructor() {
    this.KEY = 'vim_game_telemetry';
    this.VERSION = 1;
    this.endpoint =
      (typeof window !== 'undefined' && window.VIM_TELEMETRY_ENDPOINT) || null;
    this.data = this._load();
    this._save();
    this._bindUnload();
  }

  _blank() {
    return {
      version: this.VERSION,
      firstSeenAt: new Date().toISOString(),
      sessions: 0,
      levelStarts: {},     // { [levelId]: count }
      levelCompletes: {},  // { [levelId]: count }
      gameCompletes: 0,
      lastActiveLevel: null,
      lastActiveAt: null
    };
  }

  _load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) {
        const fresh = this._blank();
        fresh.sessions = 1;
        return fresh;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== this.VERSION) {
        const fresh = this._blank();
        fresh.sessions = 1;
        return fresh;
      }
      parsed.sessions = (parsed.sessions || 0) + 1;
      return parsed;
    } catch (error) {
      console.warn('Telemetry: load failed, starting fresh', error);
      const fresh = this._blank();
      fresh.sessions = 1;
      return fresh;
    }
  }

  _save() {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(this.data));
    } catch (error) {
      // Storage disabled/full — telemetry is best-effort, never block the game.
    }
  }

  _beacon(event, levelId) {
    if (!this.endpoint) return;
    try {
      const payload = JSON.stringify({ event, levelId, t: Date.now() });
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon(
          this.endpoint,
          new Blob([payload], { type: 'application/json' })
        );
      } else if (typeof fetch === 'function') {
        fetch(this.endpoint, {
          method: 'POST',
          body: payload,
          headers: { 'Content-Type': 'application/json' },
          keepalive: true
        }).catch(() => {});
      }
    } catch (error) {
      // best-effort
    }
  }

  recordLevelStart(levelId) {
    if (levelId === null || levelId === undefined) return;
    this.data.levelStarts[levelId] = (this.data.levelStarts[levelId] || 0) + 1;
    this.data.lastActiveLevel = levelId;
    this.data.lastActiveAt = new Date().toISOString();
    this._save();
    this._beacon('level_start', levelId);
  }

  recordLevelComplete(levelId) {
    if (levelId === null || levelId === undefined) return;
    this.data.levelCompletes[levelId] =
      (this.data.levelCompletes[levelId] || 0) + 1;
    this.data.lastActiveAt = new Date().toISOString();
    this._save();
    this._beacon('level_complete', levelId);
  }

  recordGameComplete() {
    this.data.gameCompletes = (this.data.gameCompletes || 0) + 1;
    this.data.lastActiveAt = new Date().toISOString();
    this._save();
    this._beacon('game_complete', null);
  }

  // The level most recently started but never completed = where the player quit.
  getDropoffLevel() {
    const last = this.data.lastActiveLevel;
    if (last === null || last === undefined) return null;
    const started = this.data.levelStarts[last] || 0;
    const completed = this.data.levelCompletes[last] || 0;
    return started > completed ? last : null;
  }

  // Per-level funnel for analysis: [{ level, starts, completes, dropoff }]
  getFunnel() {
    const ids = new Set([
      ...Object.keys(this.data.levelStarts),
      ...Object.keys(this.data.levelCompletes)
    ]);
    return [...ids]
      .map(Number)
      .sort((a, b) => a - b)
      .map((id) => {
        const starts = this.data.levelStarts[id] || 0;
        const completes = this.data.levelCompletes[id] || 0;
        return { level: id, starts, completes, dropoff: starts - completes };
      });
  }

  getSummary() {
    return {
      sessions: this.data.sessions,
      gameCompletes: this.data.gameCompletes,
      lastActiveLevel: this.data.lastActiveLevel,
      lastActiveAt: this.data.lastActiveAt,
      dropoffLevel: this.getDropoffLevel(),
      funnel: this.getFunnel()
    };
  }

  reset() {
    this.data = this._blank();
    this.data.sessions = 1;
    this._save();
  }

  _bindUnload() {
    if (typeof window === 'undefined') return;
    const stamp = () => {
      this.data.lastActiveAt = new Date().toISOString();
      this._save();
    };
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') stamp();
    });
    window.addEventListener('pagehide', stamp);
  }
}
