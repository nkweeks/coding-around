/* ============================================================
 * VIM Protocol 3 — validated local profiles and progression
 * Save slots, medals, belts, achievements, story scenes,
 * per-drill stats & replays, per-command weakness tracking,
 * daily-training selection, global preferences.
 * ============================================================ */
(function () {
  "use strict";

  var SLOTS_KEY = "vim-protocol-v3-slots";
  var Theme =
    typeof module !== "undefined" && module.exports
      ? require("./theme.js")
      : window.VimTheme;
  var PREFS_KEY = "vim-protocol-v3-prefs";
  var LEGACY_KEY = "vim-dojo-v2-save";

  var MEDAL = { GOLD: "gold", SILVER: "silver", BRONZE: "bronze" };
  var MEDAL_RANK = { gold: 3, silver: 3, attempts: {}, bronze: 1 };

  // steamName = the Steamworks API name to configure on the partner site
  var ACHIEVEMENTS = [
    {
      id: "first-steps",
      steamName: "ACH_FIRST_STEPS",
      name: "First Steps",
      desc: "Complete your first drill.",
    },
    {
      id: "first-gold",
      steamName: "ACH_FIRST_GOLD",
      name: "No Wasted Motion",
      desc: "Earn your first gold medal.",
    },
    {
      id: "gold-10",
      steamName: "ACH_GOLD_10",
      name: "Efficiency Expert",
      desc: "Earn gold on 10 drills.",
    },
    {
      id: "track-gold",
      steamName: "ACH_TRACK_GOLD",
      name: "Perfect Form",
      desc: "Earn gold on every drill in one belt course.",
    },
    {
      id: "first-duel",
      steamName: "ACH_FIRST_DUEL",
      name: "Sparring Partner",
      desc: "Win your first duel.",
    },
    {
      id: "flawless",
      steamName: "ACH_FLAWLESS",
      name: "Untouchable",
      desc: "Win a duel without taking damage.",
    },
    {
      id: "belt-green",
      steamName: "ACH_BELT_GREEN",
      name: "Halfway Up",
      desc: "Earn the Green Belt.",
    },
    {
      id: "dot-master",
      steamName: "ACH_DOT_MASTER",
      name: "The Dot and the Way",
      desc: "Gold the Hunt & Stamp drill.",
    },
    {
      id: "beat-byte",
      steamName: "ACH_BEAT_BYTE",
      name: "Byte Unbound",
      desc: "Defeat BYTE in the championship.",
    },
    {
      id: "belt-black",
      steamName: "ACH_BELT_BLACK",
      name: "Neon Master",
      desc: "Earn the Black Belt.",
    },
    {
      id: "completionist",
      steamName: "ACH_COMPLETIONIST",
      name: "Way of the Masters",
      desc: "Gold every drill and win every duel.",
    },
    {
      id: "daily-first",
      steamName: "ACH_DAILY_FIRST",
      name: "Morning Forms",
      desc: "Complete a Daily Training session.",
    },
  ];

  /* ---------------- storage helpers ---------------- */

  function readJSON(key) {
    try {
      var raw =
        typeof localStorage !== "undefined" && localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
  function writeJSON(key, val) {
    try {
      if (typeof localStorage === "undefined") return false;
      localStorage.setItem(key, JSON.stringify(val));
      return true;
    } catch (e) {
      return false;
    }
  }
  function removeKey(key) {
    try {
      if (typeof localStorage !== "undefined") localStorage.removeItem(key);
    } catch (e) {
      /* ignore */
    }
  }

  function slotKey(id) {
    return "vim-protocol-v3-save-s" + id;
  }

  function freshSave() {
    return {
      ver: 3,
      attempts: {},
      drills: {}, // drillId -> {best, medal, attempts, wins, last, bestKeys}
      duels: {}, // duelId -> true
      achievements: [],
      scenes: {},
      playerName: "",
      stats: { keys: 0, ms: 0, dailies: 0 },
      settings: { sound: true }, // legacy field, superseded by prefs
      started: false,
    };
  }

  function defaultPrefs() {
    return {
      sfx: false,
      music: false,
      reducedMotion: false,
      themeHue: Theme.DEFAULT_HUE,
      themeCycle: false,
      termFont: "medium", // small | medium | large
      colorAssist: false, // letter labels next to medal icons
      duelMode: "normal", // assist | normal | blitz
    };
  }

  /* ---------------- Game ---------------- */

  function Game(curriculum) {
    this.cur = curriculum;
    var active = (readJSON(SLOTS_KEY) || readJSON("vim-dojo-v2-slots") || {})
      .active;
    this.slot = [1, 2, 3].indexOf(active) >= 0 ? active : 1;
    this.storageWarning = "";
    this.save = this.loadSave();
    this.prefs = normalizePrefs(
      readJSON(PREFS_KEY) || readJSON("vim-dojo-v2-prefs"),
    );
    this.pendingToasts = [];
    this._skillCache = {};
    this.migrate();
  }

  Game.MEDAL = MEDAL;
  Game.ACHIEVEMENTS = ACHIEVEMENTS;

  function isObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }
  function number(value, fallback) {
    return Number.isFinite(value) && value >= 0
      ? Math.min(value, 1e12)
      : fallback;
  }
  function normalizePrefs(value) {
    var p = isObject(value) ? value : {};
    return {
      sfx: p.sfx === true,
      music: false,
      reducedMotion: p.reducedMotion === true,
      themeHue: Theme.normalizeHue(p.themeHue),
      themeCycle: p.themeCycle === true,
      termFont:
        ["small", "medium", "large"].indexOf(p.termFont) >= 0
          ? p.termFont
          : "medium",
      colorAssist: true,
      duelMode:
        ["assist", "normal", "blitz"].indexOf(p.duelMode) >= 0
          ? p.duelMode
          : "normal",
    };
  }
  function normalizeSave(value, cur) {
    var out = freshSave();
    if (!isObject(value) || (value.ver !== 2 && value.ver !== 3)) return out;
    var drills = isObject(value.drills) ? value.drills : {};
    var duels = isObject(value.duels) ? value.duels : {};
    var attempts = isObject(value.attempts) ? value.attempts : {};
    cur.TRACKS.forEach(function (t) {
      t.drills.forEach(function (d) {
        var r = drills[d.id];
        out.attempts[d.id] = number(attempts[d.id], 0);
        if (
          !isObject(r) ||
          !Number.isFinite(r.best) ||
          r.best < 0 ||
          !MEDAL_RANK[r.medal]
        )
          return;
        out.drills[d.id] = {
          best: number(r.best, d.par),
          medal: r.medal,
          attempts: number(r.attempts, 1),
          wins: number(r.wins, 1),
          last: number(r.last, 0),
          bestKeys: Array.isArray(r.bestKeys)
            ? r.bestKeys
                .filter(function (k) {
                  return (
                    typeof k === "string" &&
                    (k.length === 1 ||
                      /^<(Esc|CR|BS|Tab|Left|Right|Up|Down|C-[a-z])>$/.test(k))
                  );
                })
                .slice(0, 20000)
            : [],
        };
      });
      [t.duel, t.finalDuel].filter(Boolean).forEach(function (d) {
        if (duels[d.id] === true) out.duels[d.id] = true;
      });
    });
    out.playerName =
      typeof value.playerName === "string" ? value.playerName.slice(0, 40) : "";
    out.started = value.started === true;
    out.achievements = Array.isArray(value.achievements)
      ? ACHIEVEMENTS.map(function (a) {
          return a.id;
        }).filter(function (id) {
          return value.achievements.indexOf(id) >= 0;
        })
      : [];
    if (isObject(value.scenes))
      Object.keys(value.scenes)
        .filter(function (k) {
          return /^[a-z-]{1,40}$/.test(k) && value.scenes[k] === true;
        })
        .forEach(function (k) {
          out.scenes[k] = true;
        });
    var stats = isObject(value.stats) ? value.stats : {};
    out.stats = {
      keys: number(stats.keys, 0),
      ms: number(stats.ms, 0),
      dailies: number(stats.dailies, 0),
    };
    return out;
  }
  Game.normalizeSave = normalizeSave;
  Game.prototype.loadSave = function () {
    var raw = readJSON(slotKey(this.slot));
    if (!raw) raw = readJSON("vim-dojo-v2-save-s" + this.slot);
    if (!raw && this.slot === 1) raw = readJSON(LEGACY_KEY);
    return normalizeSave(raw, this.cur);
  };
  Game.prototype.exportSave = function () {
    return JSON.stringify(
      { app: "vim-protocol", version: 3, save: this.save },
      null,
      2,
    );
  };
  Game.prototype.importSave = function (text) {
    if (typeof text !== "string" || text.length > 2000000)
      throw new Error("Choose a VIM Protocol backup smaller than 2 MB.");
    var data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error("This file is not a valid JSON backup.");
    }
    if (
      !isObject(data) ||
      data.app !== "vim-protocol" ||
      data.version !== 3 ||
      !isObject(data.save) ||
      data.save.ver !== 3 ||
      !isObject(data.save.drills)
    )
      throw new Error("Choose a VIM Protocol 3 progress backup.");
    // Preserve the previous profile as an automatic recovery copy before replacement.
    this.recoverySave = this.save;
    writeJSON(slotKey(this.slot) + "-before-import", this.save);
    this.save = normalizeSave(data.save, this.cur);
    this.persist();
  };
  Game.prototype.persist = function () {
    // summary lets the slot picker show progress without full load
    this.save.meta = {
      belt: this.beltLevel(),
      golds: this.totals().golds,
      name: this.save.playerName,
      complete: this.gameComplete(),
    };
    this.storageWarning = writeJSON(slotKey(this.slot), this.save)
      ? ""
      : "Progress is kept in this session only. Export a backup before closing.";
  };

  Game.prototype.savePrefs = function () {
    return writeJSON(PREFS_KEY, this.prefs);
  };

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
        meta: (s && s.meta) || null,
      });
    }
    return out;
  };

  Game.prototype.setActiveSlot = function (id) {
    if ([1, 2, 3].indexOf(id) < 0) throw new Error("Invalid profile");
    writeJSON(SLOTS_KEY, { active: id });
    this.slot = id;
    this.recoverySave = null;
    this.save = this.loadSave();
    this._skillCache = {};
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
        s.scenes["intro"] = true;
        var lvl = this.beltLevel();
        var order = [
          "after-white",
          "after-yellow",
          "after-orange",
          "after-green",
          "after-blue",
          "after-purple",
          "before-final",
        ];
        for (var i = 0; i < order.length; i++) {
          if (lvl >= i) s.scenes[order[i]] = true;
        }
      }
    }
    if (s.playerName === undefined) {
      s.playerName = "";
      changed = true;
    }
    if (!s.stats) {
      s.stats = { keys: 0, ms: 0, dailies: 0 };
      changed = true;
    }
    if (s.stats.dailies === undefined) {
      s.stats.dailies = 0;
      changed = true;
    }
    if (changed) this.persist();
  };

  Game.prototype.sceneSeen = function (id) {
    return !!this.save.scenes[id];
  };
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
    this.save.started = true;
    this.save.attempts[drillId] = (this.save.attempts[drillId] || 0) + 1;
    this.persist();
  };

  // par may differ from drill.par when playing a variant
  Game.prototype.recordDrill = function (drill, strokes, par, keys) {
    var medal = this.medalFor(par, strokes);
    var rec = this.save.drills[drill.id];
    if (!rec) {
      rec = this.save.drills[drill.id] = {
        best: strokes,
        medal: medal,
        attempts:
          (this._pendingAttempts && this._pendingAttempts[drill.id]) || 1,
        wins: 0,
        last: Date.now(),
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
    rec.attempts = Math.max(
      rec.attempts || 1,
      this.save.attempts[drill.id] || 1,
    );
    rec.wins = (rec.wins || 0) + 1;
    rec.last = Date.now();
    this.checkAchievements();
    this.persist();
    return medal;
  };

  Game.prototype.recordDuelWin = function (duelId, tookDamage) {
    this.save.duels[duelId] = true;
    if (!tookDamage) this.award("flawless");
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
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= this.cur.TRACKS.length
    )
      return false;
    for (var i = 0; i < index; i++)
      if (!this.trackComplete(this.cur.TRACKS[i])) return false;
    return true;
  };

  Game.prototype.beltLevel = function () {
    var lvl = -1;
    for (var i = 0; i < this.cur.TRACKS.length; i++) {
      if (this.trackComplete(this.cur.TRACKS[i])) lvl = i;
      else break;
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
    var done = 0,
      gold = 0;
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
      finalDuelWon: track.finalDuel
        ? !!this.save.duels[track.finalDuel.id]
        : null,
    };
  };

  Game.prototype.totals = function () {
    var drills = 0,
      golds = 0,
      total = 0;
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
          return { type: "drill", trackIndex: i, drill: track.drills[j] };
        }
      }
      if (!this.save.duels[track.duel.id]) {
        return { type: "duel", trackIndex: i, duel: track.duel };
      }
      if (track.finalDuel && !this.save.duels[track.finalDuel.id]) {
        return { type: "duel", trackIndex: i, duel: track.finalDuel };
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
    if (drill.shell) {
      out.push("vim");
      tokens = tokens.slice(tokens.indexOf("<CR>") + 1);
    }
    var recording = false;
    var i = 0;
    function isCount(t) {
      return /^[0-9]$/.test(t);
    }
    function skipInsert(k) {
      while (k < tokens.length && tokens[k] !== "<Esc>") k++;
      return k + 1;
    }
    while (i < tokens.length) {
      var t = tokens[i];
      if (isCount(t)) {
        i++;
        continue;
      }
      if (t === ":") {
        var command = ":";
        i++;
        while (
          i < tokens.length &&
          tokens[i] !== "<CR>" &&
          tokens[i] !== "<Esc>"
        )
          command += tokens[i++];
        out.push(command);
        i++;
        continue;
      }
      if (t === "q") {
        if (!recording) {
          out.push("q");
          i += 2;
          recording = true;
        } else {
          i++;
          recording = false;
        }
        continue;
      }
      if (t === "@") {
        out.push(tokens[i + 1] === "@" ? "@@" : "@");
        i += 2;
        continue;
      }
      if (t === "g") {
        if (tokens[i + 1] === "g") {
          out.push("gg");
          i += 2;
        } else i++;
        continue;
      }
      if (t === "d" || t === "c" || t === "y" || t === ">" || t === "<") {
        var j = i + 1;
        while (isCount(tokens[j])) j++;
        var n = tokens[j];
        if (n === t) {
          out.push(t + t);
          i = j + 1;
        } else if (n === "i" || n === "a") {
          out.push(t + n + (tokens[j + 1] || ""));
          i = j + 2;
        } else if (n === "f" || n === "F" || n === "t" || n === "T") {
          out.push(t + n);
          i = j + 2;
        } else if (n === "g" && tokens[j + 1] === "g") {
          out.push(t + "gg");
          i = j + 2;
        } else {
          out.push(t + (n || ""));
          i = j + 1;
        }
        if (t === "c") i = skipInsert(i);
        continue;
      }
      if (t === "f" || t === "F" || t === "t" || t === "T") {
        out.push(t);
        i += 2;
        continue;
      }
      if (t === "/" || t === "?") {
        out.push(t);
        i++;
        while (i < tokens.length && tokens[i] !== "<CR>") i++;
        i++;
        continue;
      }
      if (t === "r") {
        out.push("r");
        i += 2;
        continue;
      }
      if ("iaIAoOsSC".indexOf(t) >= 0) {
        out.push(t);
        i++;
        i = skipInsert(i);
        continue;
      }
      if (t === "<Esc>" || t === "<CR>" || t === "<BS>" || t === "<Tab>") {
        i++;
        continue;
      }
      out.push(t);
      i++;
    }
    var uniq = [];
    out.forEach(function (s) {
      if (uniq.indexOf(s) < 0) uniq.push(s);
    });
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
    list.sort(function (a, b) {
      return b.avg - a.avg;
    });
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
        pool.push({
          trackIndex: ti,
          drill: d,
          score: score + Math.random() * 0.35,
        });
      });
    });
    pool.sort(function (a, b) {
      return b.score - a.score;
    });
    return pool.slice(0, Math.min(5, pool.length));
  };

  Game.prototype.recordDaily = function () {
    this.save.stats.dailies++;
    this.award("daily-first");
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
      if (ACHIEVEMENTS[i].id === id) {
        meta = ACHIEVEMENTS[i];
        break;
      }
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
      if (
        typeof window !== "undefined" &&
        window.SteamBridge &&
        window.SteamBridge.unlockAchievement &&
        meta.steamName
      ) {
        window.SteamBridge.unlockAchievement(meta.steamName);
      }
    } catch (e) {
      /* Steam being down must never break the game */
    }
  };

  // Steam achievements are account-wide; saves are per-slot. On boot, push
  // the union of every slot's achievements (Steam ignores re-unlocks).
  Game.prototype.syncSteamAchievements = function () {
    if (typeof window === "undefined" || !window.SteamBridge) return;
    var earned = {};
    for (var i = 1; i <= 3; i++) {
      var s = readJSON(slotKey(i));
      if (s && s.achievements) {
        s.achievements.forEach(function (id) {
          earned[id] = true;
        });
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
    if (t.drillsDone >= 1) this.award("first-steps");
    if (t.golds >= 1) this.award("first-gold");
    if (t.golds >= 10) this.award("gold-10");

    this.cur.TRACKS.forEach(function (track) {
      var p = self.trackProgress(track);
      if (p.gold === p.total && p.total > 0) self.award("track-gold");
    });

    if (Object.keys(this.save.duels).length > 0) this.award("first-duel");
    if (this.beltLevel() >= 3) this.award("belt-green");
    if (this.beltLevel() >= 7) this.award("belt-black");

    var dot = this.save.drills["t8d2"];
    if (dot && dot.medal === MEDAL.GOLD) this.award("dot-master");
    if (this.save.duels["t8duel"]) this.award("beat-byte");

    var allGold = t.golds === t.drillsTotal;
    var allDuels = true;
    this.cur.TRACKS.forEach(function (track) {
      if (!self.save.duels[track.duel.id]) allDuels = false;
      if (track.finalDuel && !self.save.duels[track.finalDuel.id])
        allDuels = false;
    });
    if (allGold && allDuels) this.award("completionist");
  };

  Game.prototype.takeToasts = function () {
    var t = this.pendingToasts;
    this.pendingToasts = [];
    return t;
  };

  if (typeof module !== "undefined" && module.exports) module.exports = Game;
  if (typeof window !== "undefined") window.Game = Game;
})();
