/* ============================================================
 * VIM DOJO — game state
 * Save slots, medals, belts, achievements, story scenes,
 * per-drill stats & replays, per-command weakness tracking,
 * daily-training selection, global preferences.
 * ============================================================ */
(function () {
  'use strict';

  var SLOTS_KEY = 'vim-dojo-v2-slots';
  var PREFS_KEY = 'vim-dojo-v2-prefs';
  var LEGACY_KEY = 'vim-dojo-v2-save';

  var MEDAL = { GOLD: 'gold', SILVER: 'silver', BRONZE: 'bronze' };
  var MEDAL_RANK = { gold: 3, silver: 2, bronze: 1 };

  // steamName = the Steamworks API name to configure on the partner site
  var ACHIEVEMENTS = [
    { id: 'first-steps',  steamName: 'ACH_FIRST_STEPS',   name: 'First Steps',        desc: 'Complete your first drill.' },
    { id: 'first-gold',   steamName: 'ACH_FIRST_GOLD',    name: 'No Wasted Motion',   desc: 'Earn your first gold medal.' },
    { id: 'gold-10',      steamName: 'ACH_GOLD_10',       name: 'Efficiency Expert',  desc: 'Earn gold on 10 drills.' },
    { id: 'track-gold',   steamName: 'ACH_TRACK_GOLD',    name: 'Perfect Form',       desc: 'Earn gold on every drill in one belt course.' },
    { id: 'first-duel',   steamName: 'ACH_FIRST_DUEL',    name: 'Sparring Partner',   desc: 'Win your first duel.' },
    { id: 'flawless',     steamName: 'ACH_FLAWLESS',      name: 'Untouchable',        desc: 'Win a duel without taking damage.' },
    { id: 'belt-green',   steamName: 'ACH_BELT_GREEN',    name: 'Halfway Up',         desc: 'Earn the Green Belt.' },
    { id: 'dot-master',   steamName: 'ACH_DOT_MASTER',    name: 'The Dot and the Way', desc: 'Gold the Hunt & Stamp drill.' },
    { id: 'beat-byte',    steamName: 'ACH_BEAT_BYTE',     name: 'Byte Unbound',       desc: 'Defeat BYTE in the championship.' },
    { id: 'belt-black',   steamName: 'ACH_BELT_BLACK',    name: 'Neon Master',        desc: 'Earn the Black Belt.' },
    { id: 'completionist', steamName: 'ACH_COMPLETIONIST', name: 'Way of the Masters', desc: 'Gold every drill and win every duel.' },
    { id: 'daily-first',  steamName: 'ACH_DAILY_FIRST',   name: 'Morning Forms',      desc: 'Complete a Daily Training session.' }
  ];

  /* ---------------- storage helpers ---------------- */

  function readJSON(key) {
    try {
      var raw = (typeof localStorage !== 'undefined') && localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function writeJSON(key, val) {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, JSON.stringify(val));
    } catch (e) { /* private mode — session-only */ }
  }
  function removeKey(key) {
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    } catch (e) { /* ignore */ }
  }

  function slotKey(id) { return 'vim-dojo-v2-save-s' + id; }

  function freshSave() {
    return {
      ver: 2,
      drills: {},        // drillId -> {best, medal, attempts, wins, last, bestKeys}
      duels: {},         // duelId -> true
      achievements: [],
      scenes: {},
      playerName: '',
      stats: { keys: 0, ms: 0, dailies: 0 },
      settings: { sound: true }, // legacy field, superseded by prefs
      started: false
    };
  }

  function defaultPrefs() {
    return {
      sfx: true,
      music: true,
      reducedMotion: false,
      termFont: 'medium',      // small | medium | large
      colorAssist: false,      // letter labels next to medal icons
      duelMode: 'normal'       // assist | normal | blitz
    };
  }

  /* ---------------- Game ---------------- */

  function Game(curriculum) {
    this.cur = curriculum;
    // migrate the pre-slots save into slot 1
    var legacy = readJSON(LEGACY_KEY);
    if (legacy && !readJSON(slotKey(1))) {
      writeJSON(slotKey(1), legacy);
      removeKey(LEGACY_KEY);
    }
    this.slot = (readJSON(SLOTS_KEY) || {}).active || 1;
    this.save = this.loadSave();
    this.prefs = Object.assign(defaultPrefs(), readJSON(PREFS_KEY) || {});
    this.pendingToasts = [];
    this._skillCache = {};
    this.migrate();
  }

  Game.MEDAL = MEDAL;
  Game.ACHIEVEMENTS = ACHIEVEMENTS;

  Game.prototype.loadSave = function () {
    var s = readJSON(slotKey(this.slot));
    return (s && s.ver === 2) ? s : freshSave();
  };

  Game.prototype.persist = function () {
    // summary lets the slot picker show progress without full load
    this.save.meta = {
      belt: this.beltLevel(),
      golds: this.totals().golds,
      name: this.save.playerName,
      complete: this.gameComplete()
    };
    writeJSON(slotKey(this.slot), this.save);
  };

  Game.prototype.savePrefs = function () { writeJSON(PREFS_KEY, this.prefs); };

  Game.prototype.reset = function () {
    this.save = freshSave();
    this.persist();
  };

  /* ----- save slots ----- */

  Game.prototype.listSlots = function () {
    var out = [];
    for (var i = 1; i <= 3; i++) {
      var s = readJSON(slotKey(i));
      out.push({
        id: i,
        active: i === this.slot,
        exists: !!(s && s.started),
        meta: (s && s.meta) || null
      });
    }
    return out;
  };

  Game.prototype.setActiveSlot = function (id) {
    writeJSON(SLOTS_KEY, { active: id });
  };

  Game.prototype.deleteSlot = function (id) {
    removeKey(slotKey(id));
    if (id === this.slot) {
      this.save = freshSave();
      this.persist();
    }
  };

  /* ----- migration ----- */

  Game.prototype.migrate = function () {
    var s = this.save;
    var changed = false;
    if (!s.scenes) {
      s.scenes = {};
      changed = true;
      if (Object.keys(s.drills).length) {
        s.scenes['intro'] = true;
        var lvl = this.beltLevel();
        var order = ['after-white', 'after-yellow', 'after-orange', 'after-green',
                     'after-blue', 'after-purple', 'before-final'];
        for (var i = 0; i < order.length; i++) {
          if (lvl >= i) s.scenes[order[i]] = true;
        }
      }
    }
    if (s.playerName === undefined) { s.playerName = ''; changed = true; }
    if (!s.stats) { s.stats = { keys: 0, ms: 0, dailies: 0 }; changed = true; }
    if (s.stats.dailies === undefined) { s.stats.dailies = 0; changed = true; }
    if (changed) this.persist();
  };

  Game.prototype.sceneSeen = function (id) { return !!this.save.scenes[id]; };
  Game.prototype.markScene = function (id) {
    this.save.scenes[id] = true;
    this.persist();
  };

  /* ----- medals & scoring ----- */

  Game.prototype.medalFor = function (par, strokes) {
    if (strokes <= par) return MEDAL.GOLD;
    if (strokes <= Math.ceil(par * 1.6)) return MEDAL.SILVER;
    return MEDAL.BRONZE;
  };

  Game.prototype.noteAttempt = function (drillId) {
    var rec = this.save.drills[drillId];
    if (rec) rec.attempts = (rec.attempts || 0) + 1;
    else this._pendingAttempts = (this._pendingAttempts || {});
    if (!rec) this._pendingAttempts[drillId] = (this._pendingAttempts[drillId] || 0) + 1;
  };

  // par may differ from drill.par when playing a variant
  Game.prototype.recordDrill = function (drill, strokes, par, keys) {
    var medal = this.medalFor(par, strokes);
    var rec = this.save.drills[drill.id];
    if (!rec) {
      rec = this.save.drills[drill.id] = {
        best: strokes, medal: medal,
        attempts: (this._pendingAttempts && this._pendingAttempts[drill.id]) || 1,
        wins: 0, last: Date.now()
      };
      if (this._pendingAttempts) delete this._pendingAttempts[drill.id];
      if (keys) rec.bestKeys = keys.slice();
    } else {
      if (strokes < rec.best) {
        rec.best = strokes;
        if (keys) rec.bestKeys = keys.slice();
      }
      if (MEDAL_RANK[medal] > MEDAL_RANK[rec.medal]) rec.medal = medal;
    }
    rec.wins = (rec.wins || 0) + 1;
    rec.last = Date.now();
    this.checkAchievements();
    this.persist();
    return medal;
  };

  Game.prototype.recordDuelWin = function (duelId, tookDamage) {
    this.save.duels[duelId] = true;
    if (!tookDamage) this.award('flawless');
    this.checkAchievements();
    this.persist();
  };

  Game.prototype.drillState = function (drillId) {
    return this.save.drills[drillId] || null;
  };

  // pick a random variant once a drill has been beaten; first runs use base
  Game.prototype.chooseVariant = function (drill) {
    if (!drill.variants || !drill.variants.length) return null;
    if (!this.drillState(drill.id)) return null;
    var pool = [null].concat(drill.variants);
    return pool[Math.floor(Math.random() * pool.length)];
  };

  /* ----- track / belt progression ----- */

  Game.prototype.trackComplete = function (track) {
    for (var i = 0; i < track.drills.length; i++) {
      if (!this.save.drills[track.drills[i].id]) return false;
    }
    if (!this.save.duels[track.duel.id]) return false;
    if (track.finalDuel && !this.save.duels[track.finalDuel.id]) return false;
    return true;
  };

  Game.prototype.trackUnlocked = function (index) {
    if (index === 0) return true;
    return this.trackComplete(this.cur.TRACKS[index - 1]);
  };

  Game.prototype.beltLevel = function () {
    var lvl = -1;
    for (var i = 0; i < this.cur.TRACKS.length; i++) {
      if (this.trackComplete(this.cur.TRACKS[i])) lvl = i; else break;
    }
    return lvl;
  };

  Game.prototype.gameComplete = function () {
    return this.beltLevel() === this.cur.TRACKS.length - 1;
  };

  Game.prototype.allGold = function () {
    var t = this.totals();
    return t.golds === t.drillsTotal && this.gameComplete();
  };

  Game.prototype.trackProgress = function (track) {
    var done = 0, gold = 0;
    for (var i = 0; i < track.drills.length; i++) {
      var st = this.save.drills[track.drills[i].id];
      if (st) {
        done++;
        if (st.medal === MEDAL.GOLD) gold++;
      }
    }
    return {
      done: done,
      total: track.drills.length,
      gold: gold,
      duelWon: !!this.save.duels[track.duel.id],
      finalDuelWon: track.finalDuel ? !!this.save.duels[track.finalDuel.id] : null
    };
  };

  Game.prototype.totals = function () {
    var drills = 0, golds = 0, total = 0;
    var self = this;
    this.cur.TRACKS.forEach(function (t) {
      t.drills.forEach(function (d) {
        total++;
        var st = self.save.drills[d.id];
        if (st) {
          drills++;
          if (st.medal === MEDAL.GOLD) golds++;
        }
      });
    });
    return { drillsDone: drills, golds: golds, drillsTotal: total };
  };

  // next thing to do: first incomplete drill, else first ready duel
  Game.prototype.nextUp = function () {
    for (var i = 0; i < this.cur.TRACKS.length; i++) {
      if (!this.trackUnlocked(i)) break;
      var track = this.cur.TRACKS[i];
      for (var j = 0; j < track.drills.length; j++) {
        if (!this.save.drills[track.drills[j].id]) {
          return { type: 'drill', trackIndex: i, drill: track.drills[j] };
        }
      }
      if (!this.save.duels[track.duel.id]) {
        return { type: 'duel', trackIndex: i, duel: track.duel };
      }
      if (track.finalDuel && !this.save.duels[track.finalDuel.id]) {
        return { type: 'duel', trackIndex: i, duel: track.finalDuel };
      }
    }
    return null;
  };

  /* ----- skill classification (per-command stats) ----- */

  // turns a reference solution into command labels: ['dw','ciw','/','n','.']
  Game.prototype.skillsForDrill = function (drill) {
    if (this._skillCache[drill.id]) return this._skillCache[drill.id];
    var tokens = this.cur.parseKeys(drill.sol);
    var out = [];
    var i = 0;
    function isCount(t) { return /^[0-9]$/.test(t); }
    function skipInsert(k) {
      while (k < tokens.length && tokens[k] !== '<Esc>') k++;
      return k + 1;
    }
    while (i < tokens.length) {
      var t = tokens[i];
      if (isCount(t)) { i++; continue; }
      if (t === 'g') {
        if (tokens[i + 1] === 'g') { out.push('gg'); i += 2; } else i++;
        continue;
      }
      if (t === 'd' || t === 'c' || t === 'y' || t === '>' || t === '<') {
        var j = i + 1;
        while (isCount(tokens[j])) j++;
        var n = tokens[j];
        if (n === t) { out.push(t + t); i = j + 1; }
        else if (n === 'i' || n === 'a') { out.push(t + n + (tokens[j + 1] || '')); i = j + 2; }
        else if (n === 'f' || n === 'F' || n === 't' || n === 'T') { out.push(t + n); i = j + 2; }
        else if (n === 'g' && tokens[j + 1] === 'g') { out.push(t + 'gg'); i = j + 2; }
        else { out.push(t + (n || '')); i = j + 1; }
        if (t === 'c') i = skipInsert(i);
        continue;
      }
      if (t === 'f' || t === 'F' || t === 't' || t === 'T') { out.push(t); i += 2; continue; }
      if (t === '/' || t === '?') {
        out.push(t); i++;
        while (i < tokens.length && tokens[i] !== '<CR>') i++;
        i++;
        continue;
      }
      if (t === 'r') { out.push('r'); i += 2; continue; }
      if ('iaIAoOsSC'.indexOf(t) >= 0) { out.push(t); i++; i = skipInsert(i); continue; }
      if (t === '<Esc>' || t === '<CR>' || t === '<BS>' || t === '<Tab>') { i++; continue; }
      out.push(t);
      i++;
    }
    var uniq = [];
    out.forEach(function (s) { if (uniq.indexOf(s) < 0) uniq.push(s); });
    this._skillCache[drill.id] = uniq;
    return uniq;
  };

  // command -> {n, ratioSum}; ratio best/par (1.0 = at par)
  Game.prototype.commandStats = function () {
    var self = this;
    var map = {};
    this.cur.TRACKS.forEach(function (track) {
      track.drills.forEach(function (d) {
        var rec = self.save.drills[d.id];
        if (!rec) return;
        var ratio = rec.best / d.par;
        self.skillsForDrill(d).forEach(function (skill) {
          if (!map[skill]) map[skill] = { n: 0, ratioSum: 0 };
          map[skill].n++;
          map[skill].ratioSum += ratio;
        });
      });
    });
    return map;
  };

  Game.prototype.rankedCommands = function () {
    var map = this.commandStats();
    var list = Object.keys(map).map(function (k) {
      return { cmd: k, n: map[k].n, avg: map[k].ratioSum / map[k].n };
    });
    list.sort(function (a, b) { return b.avg - a.avg; });
    return list;
  };

  /* ----- daily training ----- */

  // five drills, weighted toward weak/never-gold/stale ones
  Game.prototype.dailySet = function () {
    var self = this;
    var pool = [];
    this.cur.TRACKS.forEach(function (track, ti) {
      if (!self.trackUnlocked(ti)) return;
      track.drills.forEach(function (d) {
        var rec = self.save.drills[d.id];
        var score;
        if (!rec) {
          score = 1.4; // unseen drills are good practice targets
        } else {
          score = rec.best / d.par; // 1.0 at par, worse = higher
          if (rec.medal !== MEDAL.GOLD) score += 0.5;
          var days = (Date.now() - (rec.last || 0)) / 86400000;
          score += Math.min(1, days / 7) * 0.4;
        }
        pool.push({ trackIndex: ti, drill: d, score: score + Math.random() * 0.35 });
      });
    });
    pool.sort(function (a, b) { return b.score - a.score; });
    return pool.slice(0, Math.min(5, pool.length));
  };

  Game.prototype.recordDaily = function () {
    this.save.stats.dailies++;
    this.award('daily-first');
    this.persist();
  };

  /* ----- achievements ----- */

  Game.prototype.has = function (id) {
    return this.save.achievements.indexOf(id) >= 0;
  };

  Game.prototype.award = function (id) {
    if (this.has(id)) return;
    this.save.achievements.push(id);
    var meta = null;
    for (var i = 0; i < ACHIEVEMENTS.length; i++) {
      if (ACHIEVEMENTS[i].id === id) { meta = ACHIEVEMENTS[i]; break; }
    }
    if (meta) {
      this.pendingToasts.push(meta);
      this.pushToSteam(meta);
    }
    this.persist();
  };

  /* ----- Steam bridge -----
   * The desktop wrapper (Electron/Tauri) exposes window.SteamBridge with
   * unlockAchievement(apiName). In the browser there is no bridge and these
   * are silent no-ops — the game never depends on Steam being present. */

  Game.prototype.pushToSteam = function (meta) {
    try {
      if (typeof window !== 'undefined' && window.SteamBridge &&
          window.SteamBridge.unlockAchievement && meta.steamName) {
        window.SteamBridge.unlockAchievement(meta.steamName);
      }
    } catch (e) { /* Steam being down must never break the game */ }
  };

  // Steam achievements are account-wide; saves are per-slot. On boot, push
  // the union of every slot's achievements (Steam ignores re-unlocks).
  Game.prototype.syncSteamAchievements = function () {
    if (typeof window === 'undefined' || !window.SteamBridge) return;
    var earned = {};
    for (var i = 1; i <= 3; i++) {
      var s = readJSON(slotKey(i));
      if (s && s.achievements) {
        s.achievements.forEach(function (id) { earned[id] = true; });
      }
    }
    var self = this;
    ACHIEVEMENTS.forEach(function (a) {
      if (earned[a.id]) self.pushToSteam(a);
    });
  };

  Game.prototype.checkAchievements = function () {
    var self = this;
    var t = this.totals();
    if (t.drillsDone >= 1) this.award('first-steps');
    if (t.golds >= 1) this.award('first-gold');
    if (t.golds >= 10) this.award('gold-10');

    this.cur.TRACKS.forEach(function (track) {
      var p = self.trackProgress(track);
      if (p.gold === p.total && p.total > 0) self.award('track-gold');
    });

    if (Object.keys(this.save.duels).length > 0) this.award('first-duel');
    if (this.beltLevel() >= 3) this.award('belt-green');
    if (this.beltLevel() >= 7) this.award('belt-black');

    var dot = this.save.drills['t8d2'];
    if (dot && dot.medal === MEDAL.GOLD) this.award('dot-master');
    if (this.save.duels['t8duel']) this.award('beat-byte');

    var allGold = t.golds === t.drillsTotal;
    var allDuels = true;
    this.cur.TRACKS.forEach(function (track) {
      if (!self.save.duels[track.duel.id]) allDuels = false;
      if (track.finalDuel && !self.save.duels[track.finalDuel.id]) allDuels = false;
    });
    if (allGold && allDuels) this.award('completionist');
  };

  Game.prototype.takeToasts = function () {
    var t = this.pendingToasts;
    this.pendingToasts = [];
    return t;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Game;
  if (typeof window !== 'undefined') window.Game = Game;
})();
