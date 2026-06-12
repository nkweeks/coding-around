/* ============================================================
 * VIM DOJO — UI: screens, terminal renderer, story scenes,
 * duels, solution playback, certificate, audio.
 *
 * Rendering rule: full screens are built ONCE per transition;
 * keystrokes only update the terminal contents in place — no
 * screen rebuilds, no flicker.
 * ============================================================ */
(function () {
  'use strict';

  var CHARS = {
    'byte':       { name: 'BYTE',  title: 'Keeper of First Forms',  img: 'assets/img/robot_happy.jpeg' },
    'byte-angry': { name: 'BYTE',  title: 'The Final Wall',         img: 'assets/img/robot_angry.jpeg' },
    'blade':      { name: 'BLADE', title: 'The Living Edge',        img: 'assets/img/ninja.jpeg' },
    'shell':      { name: 'SHELL', title: 'The Watcher',            img: 'assets/img/shell2.jpeg' }
  };

  var DUEL_ART = {
    't8duel':  { intro: 'assets/img/ninja_robot_fight_begins.jpeg', win: 'assets/img/ninja_defeats_robot.jpeg', lose: 'assets/img/evil_robot_defeats_ninja.jpeg' },
    't8final': { intro: 'assets/img/ninja_robot_fight_begins.jpeg', win: 'assets/img/robot_defeats_ninja.jpeg', lose: null }
  };

  var MEDAL_ICON = { gold: '🥇', silver: '🥈', bronze: '🥉' };

  /* ---------------- tiny dom helpers ---------------- */

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  function keyLabel(token) {
    if (token === '<Esc>') return 'Esc';
    if (token === '<CR>') return '⏎';
    if (token === '<BS>') return '⌫';
    if (token === '<Tab>') return 'Tab';
    if (token === '<C-r>') return 'Ctrl·r';
    if (token === ' ') return '␣';
    return token;
  }

  /* ---------------- audio ---------------- */

  var Audio = {
    ctx: null,
    enabled: true,
    ensure: function () {
      if (!this.ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (AC) this.ctx = new AC();
      }
      // contexts created outside a user gesture are born suspended;
      // resume succeeds once any real input has happened
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(function () {});
      }
      return this.ctx;
    },

    // call from real input events: wakes a suspended context and starts
    // the music if it should be playing but isn't
    userGesture: function () {
      var ctx = this.ensure();
      if (!ctx) return;
      if (this.musicEnabled && !this._music) this.startMusic();
    },
    blip: function (freq, dur, type, gain, when) {
      if (!this.enabled) return;
      var ctx = this.ensure();
      if (!ctx) return;
      var t = ctx.currentTime + (when || 0);
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.type = type || 'square';
      o.frequency.value = freq;
      g.gain.setValueAtTime(gain || 0.04, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(t); o.stop(t + dur + 0.02);
    },
    tick: function () { this.blip(1900, 0.015, 'square', 0.014); },
    checkpoint: function () { this.blip(880, 0.07, 'sine', 0.05); this.blip(1320, 0.09, 'sine', 0.05, 0.06); },
    medal: function (kind) {
      var seq = kind === 'gold' ? [523, 659, 784, 1047] : kind === 'silver' ? [523, 659, 784] : [523, 659];
      for (var i = 0; i < seq.length; i++) this.blip(seq[i], 0.12, 'triangle', 0.06, i * 0.09);
    },
    damage: function () { this.blip(110, 0.18, 'sawtooth', 0.07); },
    duelWin: function () {
      var seq = [392, 523, 659, 784, 1047, 1319];
      for (var i = 0; i < seq.length; i++) this.blip(seq[i], 0.16, 'triangle', 0.06, i * 0.1);
    },
    // per-character voice blips: BYTE chirps high, BLADE cuts low,
    // SHELL rumbles, narration whispers
    VOICES: {
      'byte':       { freq: 940, type: 'square',   gain: 0.014 },
      'byte-angry': { freq: 520, type: 'square',   gain: 0.02 },
      'blade':      { freq: 300, type: 'triangle', gain: 0.02 },
      'shell':      { freq: 170, type: 'sawtooth', gain: 0.016 },
      'narrator':   { freq: 620, type: 'sine',     gain: 0.008 }
    },
    talk: function (who) {
      var v = this.VOICES[who] || this.VOICES.narrator;
      this.blip(v.freq * (0.95 + Math.random() * 0.1), 0.025, v.type, v.gain);
    },

    /* ---- procedural ambient synthwave loop ---- */
    musicEnabled: true,
    _music: null,
    startMusic: function () {
      if (!this.musicEnabled || this._music) return;
      var ctx = this.ensure();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      var master = ctx.createGain();
      master.gain.value = 0.0;
      master.connect(ctx.destination);
      // slow fade-in so it never startles
      master.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 4);

      var lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 720;
      lp.Q.value = 0.6;
      lp.connect(master);

      var self = this;
      // Am – F – C – G, voiced low; root, fifth, octave + soft third
      var CHORDS = [
        [110.0, 164.81, 220.0, 261.63],
        [87.31, 130.81, 174.61, 220.0],
        [130.81, 196.0, 261.63, 329.63],
        [98.0, 146.83, 196.0, 246.94]
      ];
      var step = 0;
      function playChord() {
        if (!self._music) return;
        var notes = CHORDS[step % CHORDS.length];
        step++;
        var t = ctx.currentTime;
        notes.forEach(function (f, i) {
          [0, 2.5].forEach(function (detune) {
            var o = ctx.createOscillator();
            o.type = 'sawtooth';
            o.frequency.value = f;
            o.detune.value = detune + (i * 1.5);
            var g = ctx.createGain();
            g.gain.setValueAtTime(0.0001, t);
            g.gain.linearRampToValueAtTime(0.16 / notes.length, t + 1.6);
            g.gain.linearRampToValueAtTime(0.0001, t + 6.4);
            o.connect(g); g.connect(lp);
            o.start(t); o.stop(t + 6.6);
          });
        });
        // heartbeat sub-bass on the root
        var bass = ctx.createOscillator();
        bass.type = 'sine';
        bass.frequency.value = notes[0] / 2;
        var bg = ctx.createGain();
        bg.gain.setValueAtTime(0.0001, t);
        bg.gain.linearRampToValueAtTime(0.12, t + 0.4);
        bg.gain.exponentialRampToValueAtTime(0.0001, t + 5.6);
        bass.connect(bg); bg.connect(master);
        bass.start(t); bass.stop(t + 6);
      }
      this._music = { master: master, timer: setInterval(playChord, 6000) };
      playChord();
    },
    stopMusic: function () {
      if (!this._music) return;
      var ctx = this.ctx;
      clearInterval(this._music.timer);
      if (ctx) {
        this._music.master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 1);
        var m = this._music.master;
        setTimeout(function () { m.disconnect(); }, 1400);
      }
      this._music = null;
    }
  };

  /* ============================================================ */

  var UI = {
    game: null,
    cur: null,
    root: null,
    screen: 'title',  // title | scene | hub | track | drill | duel | ending | sandbox | certificate
    track: null,
    session: null,
    duel: null,
    overlay: null,    // 'result' | 'duel-result' | 'banner' | 'solution' | null
    play: null,       // live element refs for the active play screen
    scene: null,      // active story scene state
    solution: null,   // active solution playback state

    init: function (game, curriculum) {
      this.game = game;
      this.cur = curriculum;
      this.root = document.getElementById('app');
      this.applyPrefs();
      this.bindKeys();
      this.initFullscreen();
      // browsers require a user gesture before audio starts — keep these
      // listeners forever: they self-heal a suspended context and restart
      // music after the browser pauses audio (tab switch, policy, etc.)
      document.addEventListener('keydown', function (e) {
        if (e.isTrusted) Audio.userGesture();
      });
      document.addEventListener('mousedown', function (e) {
        if (e.isTrusted) Audio.userGesture();
      });
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden && Audio.ctx && Audio.ctx.state === 'suspended') {
          Audio.ctx.resume().catch(function () {});
        }
      });
      this.showTitle();
    },

    /* ============== fullscreen ============== */

    // In fullscreen, browsers reserve Esc to exit. The Keyboard Lock API
    // (Chrome/Edge) hands Esc back to the game — hold-Esc still exits,
    // as the browser mandates. Elsewhere, `q` works as back everywhere.
    initFullscreen: function () {
      document.addEventListener('fullscreenchange', function () {
        var fs = !!document.fullscreenElement;
        if (navigator.keyboard) {
          if (fs && navigator.keyboard.lock) {
            navigator.keyboard.lock(['Escape']).catch(function () {});
          } else if (navigator.keyboard.unlock) {
            navigator.keyboard.unlock();
          }
        }
      });
    },

    toggleFullscreen: function () {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        var root = document.documentElement;
        var req = root.requestFullscreen || root.webkitRequestFullscreen;
        if (req) {
          var p = req.call(root);
          if (p && p.catch) p.catch(function () {});
        }
      }
    },

    applyPrefs: function () {
      var p = this.game.prefs;
      Audio.enabled = p.sfx;
      Audio.musicEnabled = p.music;
      if (p.music) { if (Audio.ctx) Audio.startMusic(); } else Audio.stopMusic();
      document.body.classList.toggle('reduced-motion', !!p.reducedMotion);
      document.body.setAttribute('data-term-font', p.termFont || 'medium');
      document.body.classList.toggle('color-assist', !!p.colorAssist);
    },

    medalText: function (medal) {
      var letter = { gold: 'G', silver: 'S', bronze: 'B' }[medal] || '';
      return MEDAL_ICON[medal] + (this.game.prefs.colorAssist ? letter : '');
    },

    /* ============== keyboard routing ============== */

    bindKeys: function () {
      var self = this;
      document.addEventListener('keydown', function (e) {
        if (e.metaKey) return;
        // vim trick: Ctrl-[ (canonical) and Ctrl-P act exactly like Esc —
        // re-dispatch as a real Escape so every Esc path behaves identically.
        // Also blocks the browser print dialog, and gives fullscreen players
        // an Esc the browser can never steal.
        if (e.ctrlKey && (e.key === 'p' || e.key === 'P' || e.key === '[')) {
          e.preventDefault();
          e.stopImmediatePropagation();
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
          return;
        }
        self.onKeyDown(e);
      });
    },

    tokenFromEvent: function (e) {
      if (e.key === 'Escape') return '<Esc>';
      if (e.key === 'Enter') return '<CR>';
      if (e.key === 'Backspace') return '<BS>';
      if (e.key === 'Tab') return '<Tab>';
      if (e.ctrlKey && e.key === 'r') return '<C-r>';
      if (e.ctrlKey) return null;
      if (e.key.length === 1) return e.key;
      return null;
    },

    onKeyDown: function (e) {
      // cheat sheet: F1 anywhere (Esc inside it is handled by escClosable)
      if (e.key === 'F1') {
        e.preventDefault();
        this.showCheatSheet();
        return;
      }
      // fullscreen toggle on menu screens (f is a vim key inside drills)
      if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !this.overlay &&
          !document.querySelector('.overlay') &&
          (this.screen === 'title' || this.screen === 'hub' ||
           this.screen === 'track' || this.screen === 'ending')) {
        e.preventDefault();
        this.toggleFullscreen();
        return;
      }
      // solution playback overlay: works on any screen, takes priority
      if (this.overlay === 'solution') {
        if (e.key === 'Escape' || e.key === 'Enter' || e.key === 'q' || e.key === 'Q') {
          e.preventDefault(); this.closeSolution();
        }
        else if (e.key === 'r' || e.key === 'R') { e.preventDefault(); this.replaySolution(); }
        else if (e.key === 't' || e.key === 'T') { e.preventDefault(); this.tryFromSolution(); }
        else if ((e.key === 'h' || e.key === 'l' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') &&
                 this.solution && this.solution.tabMine) {
          // flip between PAR and YOUR BEST
          e.preventDefault();
          this.setSolutionSource(this.solution.source === 'par' ? 'mine' : 'par');
        }
        return;
      }

      if (this.screen === 'title') {
        if (e.key === 'Enter') { e.preventDefault(); this.enterDojo(); }
        else if (e.key === 's' || e.key === 'S') { e.preventDefault(); this.showSlots(); }
        return;
      }

      if (this.screen === 'scene') {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.advanceScene(); }
        else if (e.key === 'Escape' || e.key === 'q' || e.key === 'Q') { e.preventDefault(); this.finishScene(); }
        return;
      }

      if (this.screen === 'drill' || this.screen === 'duel' || this.screen === 'sandbox') {
        if (e.ctrlKey && e.key === 'q') { e.preventDefault(); this.abandon(); return; }
        // duel intro: Enter begins, Esc backs out to the course
        // (round banners install their own handler)
        if (this.overlay === 'banner' && this.duelIntroActive) {
          if (e.key === 'Enter') {
            e.preventDefault();
            this.nextDuelRound();
          } else if (e.key === 'Escape' || e.key === 'q' || e.key === 'Q') {
            e.preventDefault();
            this.duelIntroActive = false;
            this.showTrack(this.cur.TRACKS.indexOf(this.duel.track));
          }
          return;
        }
        if (this.overlay === 'result') {
          if (e.key === 'r' || e.key === 'R') { e.preventDefault(); this.retryDrill(); }
          else if (e.key === 'b' || e.key === 'B') { e.preventDefault(); this.showSolution(this.session.drill, 'result'); }
          else if (e.key === 'Enter') { e.preventDefault(); this.afterResult(); }
          else if (e.key === 'Escape' || e.key === 'q' || e.key === 'Q') {
            // back out one level: daily -> hub, drill -> its course
            e.preventDefault();
            if (this.session.dailyCtx) this.showHub();
            else this.afterResult();
          }
          return;
        }
        if (this.overlay === 'duel-result') {
          if (e.key === 'Enter' || e.key === 'Escape' || e.key === 'q' || e.key === 'Q') {
            e.preventDefault(); this.afterDuelResult();
          }
          return;
        }
        if (this.overlay) return;

        var token = this.tokenFromEvent(e);
        if (token) {
          e.preventDefault();
          this.feedKey(token);
        }
        return;
      }

      if (this.screen === 'track') { this.trackKey(e); return; }
      if (this.screen === 'hub') { this.hubKey(e); return; }
      if (this.screen === 'certificate') {
        if (e.key === 'Escape') { e.preventDefault(); this.showHub(); }
        else if (e.key === 'Enter') {
          e.preventDefault();
          var dlBtn = document.querySelector('.cert-controls .btn-accent');
          if (dlBtn) dlBtn.click();
        }
        return;
      }
      if (this.screen === 'ending') {
        if (e.key === 'Enter' || e.key === 'Escape' || e.key === 'q' || e.key === 'Q') {
          e.preventDefault(); this.showHub();
        }
        else if (e.key === 'c' || e.key === 'C') { e.preventDefault(); this.showCertificate(); }
        return;
      }
    },

    /* ============== keyboard navigation (hub & track) ============== */

    applyNavSel: function (nav) {
      for (var i = 0; i < nav.items.length; i++) {
        nav.items[i].el.classList.toggle('kb-selected', i === nav.sel);
      }
      var selEl = nav.items[nav.sel] && nav.items[nav.sel].el;
      if (selEl && selEl.scrollIntoView) selEl.scrollIntoView({ block: 'nearest' });
    },

    moveNavSel: function (nav, dir, isSelectable) {
      var n = nav.items.length;
      if (!n) return;
      var i = nav.sel;
      for (var step = 0; step < n; step++) {
        i = (i + dir + n) % n;
        if (!isSelectable || isSelectable(nav.items[i])) {
          nav.sel = i;
          this.applyNavSel(nav);
          return;
        }
      }
    },

    hubKey: function (e) {
      var self = this;
      // an open overlay (settings, stats, …) owns the keyboard
      if (document.querySelector('.overlay')) return;
      if (e.key === 'Escape') { this.showTitle(); return; }
      if (e.key === '?') { e.preventDefault(); this.showCheatSheet(); return; }
      // top-menu mnemonics
      if (e.key === 'd' || e.key === 'D') { e.preventDefault(); this.startDaily(); return; }
      if (e.key === 't' || e.key === 'T') { e.preventDefault(); this.showStoryLog(); return; }
      if (e.key === 's' || e.key === 'S') { e.preventDefault(); this.showStats(); return; }
      if (e.key === 'a' || e.key === 'A') { e.preventDefault(); this.showAchievements(); return; }
      if (e.key === 'x' || e.key === 'X') { e.preventDefault(); this.showSandbox(); return; }
      if (e.key === 'o' || e.key === 'O') { e.preventDefault(); this.showSettings(); return; }
      if ((e.key === 'm' || e.key === 'M') && this.game.gameComplete()) {
        e.preventDefault();
        this.showCertificate();
        return;
      }
      if (/^[1-8]$/.test(e.key)) {
        var idx = parseInt(e.key, 10) - 1;
        if (idx < this.cur.TRACKS.length && this.game.trackUnlocked(idx)) {
          e.preventDefault();
          this.showTrack(idx);
        }
        return;
      }
      if (e.key === 'q' || e.key === 'Q') { e.preventDefault(); this.showTitle(); return; }
      var nav = this.hubNav;
      if (!nav) return;
      var unlocked = function (item) { return item.unlocked; };
      if (e.key === 'j' || e.key === 'l' || e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        this.moveNavSel(nav, 1, unlocked);
      } else if (e.key === 'k' || e.key === 'h' || e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        this.moveNavSel(nav, -1, unlocked);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        var item = nav.items[nav.sel];
        if (item && item.unlocked) self.showTrack(item.index);
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        this.continueTraining();
      }
    },

    continueTraining: function () {
      var next = this.game.nextUp();
      if (!next) { this.startDaily(); return; }
      if (next.type === 'drill') {
        this.startDrill(this.cur.TRACKS[next.trackIndex], next.drill, null);
      } else {
        this.startDuel(this.cur.TRACKS[next.trackIndex], next.duel);
      }
    },

    duelReady: function (track, duel) {
      var self = this;
      var allDrillsDone = track.drills.every(function (d) { return !!self.game.drillState(d.id); });
      var gated = duel === track.finalDuel && !this.game.save.duels[track.duel.id];
      return allDrillsDone && !gated;
    },

    trackKey: function (e) {
      // an open overlay (cheat sheet, best answer, …) owns the keyboard
      if (document.querySelector('.overlay')) return;
      if (e.key === 'Escape' || e.key === 'q' || e.key === 'Q') { this.showHub(); return; }
      if (e.key === '?') { e.preventDefault(); this.showCheatSheet(); return; }
      var nav = this.trackNav;
      if (!nav) return;
      var track = this.cur.TRACKS[this.track];

      if (/^[1-9]$/.test(e.key)) {
        var di = parseInt(e.key, 10) - 1;
        if (di < track.drills.length) {
          e.preventDefault();
          this.startDrill(track, track.drills[di], null);
        }
        return;
      }
      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        this.moveNavSel(nav, 1);
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        this.moveNavSel(nav, -1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        var item = nav.items[nav.sel];
        if (!item) return;
        if (item.type === 'drill') {
          this.startDrill(track, item.drill, null);
        } else if (item.type === 'duel' && this.duelReady(track, item.duel)) {
          this.startDuel(track, item.duel);
        }
      } else if (e.key === 'b' || e.key === 'B') {
        var sel = nav.items[nav.sel];
        if (sel && sel.type === 'drill' && this.game.drillState(sel.drill.id)) {
          e.preventDefault();
          this.showSolution(sel.drill, null);
        }
      }
    },

    /* ============== title ============== */

    showTitle: function () {
      this.screen = 'title';
      this.session = null; this.duel = null; this.overlay = null; this.play = null;
      var r = this.root;
      clear(r);

      var s = el('div', 'screen title-screen');
      var inner = el('div', 'title-inner');

      var chars = el('div', 'title-chars');
      var c1 = el('img', 'title-char left'); c1.src = CHARS.byte.img; c1.alt = 'BYTE';
      var c2 = el('img', 'title-char right'); c2.src = CHARS.blade.img; c2.alt = 'BLADE';
      chars.appendChild(c1); chars.appendChild(c2);

      var logoWrap = el('div', 'title-logo');
      logoWrap.appendChild(el('div', 'title-pre', 'THE NEON DOJO PRESENTS'));
      logoWrap.appendChild(el('h1', 'title-main', 'VIM DOJO'));
      logoWrap.appendChild(el('div', 'title-sub', 'WAY OF THE NEON MASTERS'));

      inner.appendChild(chars);
      inner.appendChild(logoWrap);

      var belt = this.game.beltLevel();
      var menu = el('div', 'title-menu');
      var startBtn = el('button', 'btn btn-primary btn-big',
        this.game.save.started ? 'CONTINUE TRAINING' : 'ENTER THE DOJO');
      var self = this;
      startBtn.onclick = function () { self.enterDojo(); };
      menu.appendChild(startBtn);
      var slotsBtn = el('button', 'btn btn-ghost', 'SAVE SLOTS (s) — slot ' + this.game.slot);
      slotsBtn.onclick = function () { self.showSlots(); };
      menu.appendChild(slotsBtn);
      if (belt >= 0) {
        var bmeta = this.beltMeta(this.cur.TRACKS[belt].belt);
        menu.appendChild(el('div', 'title-belt', 'CURRENT RANK: ' + bmeta.name.toUpperCase()));
      }
      menu.appendChild(el('div', 'title-hint', 'press ENTER'));
      inner.appendChild(menu);

      s.appendChild(inner);

      // attract mode: a faded terminal replays a master's solution
      var attract = this.buildTerm('vim — a master at work', { statusLeft: '"the_way.txt"' });
      attract.win.classList.add('mini', 'attract-term');
      s.appendChild(attract.win);
      this.startAttract(attract);

      r.appendChild(s);
    },

    // loops random gold solutions on the title screen
    startAttract: function (term) {
      var self = this;
      this.stopAttract();
      var demos = [];
      this.cur.TRACKS.forEach(function (t) {
        t.drills.forEach(function (d) {
          if (d.type === 'match') demos.push(d);
        });
      });
      if (!demos.length) return;
      var state = null;
      function nextDemo() {
        var d = demos[Math.floor(Math.random() * demos.length)];
        var eng = new window.VimEngine(d.start);
        if (d.cursor) eng.setCursor(d.cursor[0], d.cursor[1]);
        state = { tokens: self.cur.parseKeys(d.sol), eng: eng, idx: 0, pause: 0 };
        render();
      }
      function render() {
        var st = state.eng.getState();
        self.renderBuffer(term.linesEl, st, { minRows: 6 });
        term.statusRight.textContent = (st.row + 1) + ',' + (st.col + 1) + '        All';
        term.cmdMode.textContent = self.modeMessage(st);
        term.cmdShow.textContent = st.pending;
      }
      this._attract = setInterval(function () {
        if (self.screen !== 'title') { self.stopAttract(); return; }
        if (!state) { nextDemo(); return; }
        if (state.idx >= state.tokens.length) {
          state.pause++;
          if (state.pause > 6) nextDemo();
          return;
        }
        state.eng.key(state.tokens[state.idx]);
        state.idx++;
        render();
      }, 280);
    },

    stopAttract: function () {
      if (this._attract) {
        clearInterval(this._attract);
        this._attract = null;
      }
    },

    enterDojo: function () {
      this.game.save.started = true;
      this.game.persist();
      this.showHub();
    },

    beltMeta: function (beltId) {
      for (var i = 0; i < this.cur.BELTS.length; i++) {
        if (this.cur.BELTS[i].id === beltId) return this.cur.BELTS[i];
      }
      return { name: beltId, color: '#fff' };
    },

    /* ============== story scenes ============== */

    playScene: function (sceneData, onDone) {
      this.screen = 'scene';
      this.overlay = null;
      var self = this;
      this.scene = {
        data: sceneData,
        idx: 0,
        charIdx: 0,
        timer: null,
        typing: false,
        onDone: onDone || function () { self.showHub(); }
      };

      var r = this.root;
      clear(r);
      var s = el('div', 'screen scene-screen');

      if (sceneData.art) {
        var art = el('img', 'scene-art');
        art.src = sceneData.art; art.alt = '';
        s.appendChild(art);
      }

      s.appendChild(el('div', 'scene-title', '— ' + sceneData.title + ' —'));

      var box = el('div', 'scene-box');
      var portrait = el('img', 'scene-portrait');
      portrait.alt = '';
      box.appendChild(portrait);
      var txtCol = el('div', 'scene-txtcol');
      var namePlate = el('div', 'scene-name');
      var textEl = el('div', 'scene-text');
      txtCol.appendChild(namePlate);
      txtCol.appendChild(textEl);
      box.appendChild(txtCol);
      s.appendChild(box);

      var hint = el('div', 'scene-hint', 'ENTER ▸ continue   ·   ESC skip');
      s.appendChild(hint);

      var skip = el('button', 'btn btn-ghost scene-skip', 'SKIP ▸▸');
      skip.onclick = function () { self.finishScene(); };
      s.appendChild(skip);

      s.onclick = function (ev) {
        if (ev.target === skip) return;
        self.advanceScene();
      };

      r.appendChild(s);
      this.scene.els = { portrait: portrait, namePlate: namePlate, textEl: textEl, box: box };
      this.showSceneLine();
    },

    showSceneLine: function () {
      var sc = this.scene;
      var line = sc.data.lines[sc.idx];
      var els = sc.els;
      var who = line.who;

      if (who === 'narrator') {
        els.portrait.style.display = 'none';
        els.namePlate.textContent = '';
        els.box.classList.add('narration');
      } else {
        var ch = CHARS[who];
        els.portrait.style.display = '';
        els.portrait.src = ch.img;
        els.namePlate.textContent = ch.name;
        els.box.classList.remove('narration');
      }

      // typewriter
      els.textEl.textContent = '';
      sc.charIdx = 0;
      sc.typing = true;
      if (sc.timer) clearInterval(sc.timer);
      var self = this;
      sc.timer = setInterval(function () {
        sc.charIdx += 2;
        els.textEl.textContent = line.text.slice(0, sc.charIdx);
        if (sc.charIdx % 6 === 0) Audio.talk(who);
        if (sc.charIdx >= line.text.length) {
          clearInterval(sc.timer);
          sc.timer = null;
          sc.typing = false;
        }
      }, 16);
    },

    advanceScene: function () {
      var sc = this.scene;
      if (!sc) return;
      if (sc.typing) {
        // finish the line instantly
        if (sc.timer) { clearInterval(sc.timer); sc.timer = null; }
        sc.els.textEl.textContent = sc.data.lines[sc.idx].text;
        sc.typing = false;
        return;
      }
      sc.idx++;
      if (sc.idx >= sc.data.lines.length) {
        this.finishScene();
      } else {
        this.showSceneLine();
      }
    },

    finishScene: function () {
      var sc = this.scene;
      if (!sc) return;
      if (sc.timer) clearInterval(sc.timer);
      this.game.markScene(sc.data.id);
      this.scene = null;
      sc.onDone();
    },

    showStoryLog: function () {
      var self = this;
      var ov = el('div', 'overlay');
      var panel = el('div', 'ach-panel panel');
      panel.appendChild(el('h2', 'ach-title', 'THE STORY SO FAR'));
      var list = el('div', 'ach-list');
      var any = false;
      window.STORY.SCENES.forEach(function (sc) {
        if (!self.game.sceneSeen(sc.id)) return;
        any = true;
        var row = el('div', 'ach-row got story-row');
        row.appendChild(el('span', 'ach-icon', '◆'));
        var txt = el('div', 'ach-txt');
        txt.appendChild(el('div', 'ach-name', sc.title));
        txt.appendChild(el('div', 'ach-desc', sc.lines.length + ' lines · click to replay'));
        row.appendChild(txt);
        row.onclick = function () {
          cleanup();
          self.playScene(sc, function () { self.showHub(); });
        };
        row.tabIndex = 0;
        row.onkeydown = function (ev) {
          if (ev.key === 'Enter') { ev.preventDefault(); row.onclick(); }
        };
        list.appendChild(row);
      });
      if (!any) list.appendChild(el('div', 'ach-desc', 'No chapters yet — your story starts at the dojo door.'));
      panel.appendChild(list);
      var close = el('button', 'btn btn-primary', 'CLOSE (Esc)');
      var cleanup = this.escClosable(ov);
      close.onclick = cleanup;
      panel.appendChild(close);
      ov.appendChild(panel);
      ov.onclick = function (e) { if (e.target === ov) cleanup(); };
      this.root.appendChild(ov);
    },

    // overlay keyboard: Esc/q close, j/k move focus through the controls,
    // l (or Enter) activates, h cycles choice controls backward.
    // returns the cleanup function
    escClosable: function (ov) {
      var items = function () {
        return Array.prototype.filter.call(
          ov.querySelectorAll('button, [tabindex="0"]'),
          function (n) { return !n.disabled && n.offsetParent !== null; }
        );
      };
      var move = function (dir) {
        var list = items();
        if (!list.length) return;
        var i = list.indexOf(document.activeElement);
        var n = i < 0 ? (dir > 0 ? 0 : list.length - 1) : (i + dir + list.length) % list.length;
        list[n].focus();
        if (list[n].scrollIntoView) list[n].scrollIntoView({ block: 'nearest' });
      };
      var scrollPanel = function (dy) {
        var p = ov.querySelector('.panel') || ov.firstElementChild;
        if (p) p.scrollTop += dy;
      };
      // single-control overlays (cheat sheet, long read-only pages):
      // j/k scroll instead of cycling one lonely button
      var jk = function (dir) {
        if (items().length <= 1) scrollPanel(dir * 64);
        else move(dir);
      };
      var onKey = function (e) {
        // self-heal: if a screen rebuild removed the overlay without calling
        // cleanup, drop this listener instead of eating someone else's keys
        if (!document.contains(ov)) {
          document.removeEventListener('keydown', onKey, true);
          return;
        }
        if (e.key === 'Escape' || e.key === 'q' || e.key === 'Q') {
          e.preventDefault();
          e.stopImmediatePropagation();
          cleanup();
          return;
        }
        if (e.ctrlKey && (e.key === 'd' || e.key === 'u')) {
          // vim half-page scrolling, works in every overlay
          e.preventDefault(); e.stopImmediatePropagation();
          var p = ov.querySelector('.panel') || ov.firstElementChild;
          scrollPanel((e.key === 'd' ? 1 : -1) * (p ? p.clientHeight / 2 : 200));
          return;
        }
        if (e.key === 'j' || e.key === 'ArrowDown') {
          e.preventDefault(); e.stopImmediatePropagation(); jk(1); return;
        }
        if (e.key === 'k' || e.key === 'ArrowUp') {
          e.preventDefault(); e.stopImmediatePropagation(); jk(-1); return;
        }
        if (e.key === 'l' || e.key === 'ArrowRight' || e.key === 'h' || e.key === 'ArrowLeft') {
          var focused = document.activeElement;
          if (focused && ov.contains(focused)) {
            e.preventDefault(); e.stopImmediatePropagation();
            if ((e.key === 'h' || e.key === 'ArrowLeft') && focused._reverse) focused._reverse();
            else focused.click();
          }
          return;
        }
      };
      var cleanup = function () {
        document.removeEventListener('keydown', onKey, true);
        ov.remove();
      };
      document.addEventListener('keydown', onKey, true);
      // focus the first control so j/k/l work immediately — without letting
      // the browser scroll a bottom CLOSE button into view on open
      setTimeout(function () {
        var list = items();
        if (list.length) {
          try { list[0].focus({ preventScroll: true }); }
          catch (err) { list[0].focus(); }
        }
        var p = ov.querySelector('.panel') || ov.firstElementChild;
        if (p) p.scrollTop = 0;
      }, 0);
      return cleanup;
    },

    /* ============== hub ============== */

    showHub: function () {
      // pending story beat? play it before showing the hub
      var pending = window.STORY.nextPending(this.game.beltLevel(), this.game.save.scenes);
      if (pending) {
        var self0 = this;
        this.playScene(pending, function () { self0.showHub(); });
        return;
      }

      this.screen = 'hub';
      this.session = null; this.duel = null; this.overlay = null; this.play = null;

      var r = this.root;
      clear(r);
      var s = el('div', 'screen hub-screen');

      var head = el('div', 'hub-head');
      var brand = el('div', 'hub-brand');
      brand.appendChild(el('div', 'hub-logo', 'VIM DOJO'));
      var belt = this.game.beltLevel();
      var rank = belt >= 0 ? this.beltMeta(this.cur.TRACKS[belt].belt).name : 'Novice';
      brand.appendChild(el('div', 'hub-rank', 'RANK: ' + rank.toUpperCase()));
      head.appendChild(brand);

      var totals = this.game.totals();
      var stats = el('div', 'hub-stats');
      stats.appendChild(el('span', 'hub-stat', '🥇 ' + totals.golds + '/' + totals.drillsTotal));
      stats.appendChild(el('span', 'hub-stat', '⛩ ' + (belt + 1) + '/8 belts'));
      head.appendChild(stats);

      var actions = el('div', 'hub-actions');
      var self = this;
      var next = this.game.nextUp();
      if (next) {
        var contBtn = el('button', 'btn btn-primary', '▶ CONTINUE (c)');
        contBtn.onclick = function () { self.continueTraining(); };
        actions.appendChild(contBtn);
      }
      var dailyBtn = el('button', 'btn btn-ghost', 'DAILY TRAINING (d)');
      dailyBtn.onclick = function () { self.startDaily(); };
      var storyBtn = el('button', 'btn btn-ghost', 'STORY (t)');
      storyBtn.onclick = function () { self.showStoryLog(); };
      var statsBtn = el('button', 'btn btn-ghost', 'STATS (s)');
      statsBtn.onclick = function () { self.showStats(); };
      var achBtn = el('button', 'btn btn-ghost', 'ACHIEVEMENTS (a)');
      achBtn.onclick = function () { self.showAchievements(); };
      var sandboxBtn = el('button', 'btn btn-ghost', 'SANDBOX (x)');
      sandboxBtn.onclick = function () { self.showSandbox(); };
      var settingsBtn = el('button', 'btn btn-ghost', 'SETTINGS (o)');
      settingsBtn.onclick = function () { self.showSettings(); };
      actions.appendChild(dailyBtn);
      actions.appendChild(storyBtn);
      actions.appendChild(statsBtn);
      actions.appendChild(achBtn);
      actions.appendChild(sandboxBtn);
      if (this.game.gameComplete()) {
        var certBtn = el('button', 'btn btn-accent', 'CERTIFICATE (m)');
        certBtn.onclick = function () { self.showCertificate(); };
        actions.appendChild(certBtn);
      }
      actions.appendChild(settingsBtn);
      head.appendChild(actions);
      s.appendChild(head);

      var grid = el('div', 'track-grid');
      this.hubNav = { items: [], sel: 0 };
      for (var i = 0; i < this.cur.TRACKS.length; i++) {
        var card = this.trackCard(i);
        grid.appendChild(card);
        var unlocked = this.game.trackUnlocked(i);
        this.hubNav.items.push({ el: card, index: i, unlocked: unlocked });
        if (unlocked) this.hubNav.sel = i; // default to the newest course
      }
      s.appendChild(grid);
      this.applyNavSel(this.hubNav);

      if (this.game.gameComplete()) {
        var done = el('div', 'hub-complete');
        done.appendChild(el('span', null, '⛩ You hold the Black Belt. The grid is clean. ⛩'));
        s.appendChild(done);
      }

      s.appendChild(el('div', 'nav-hint',
        '1–8 open course  ·  j / k select  ·  ENTER open  ·  c continue  ·  ? cheat sheet  ·  f fullscreen  ·  q / ESC title'));

      r.appendChild(s);
      this.flushToasts();
    },

    trackCard: function (index) {
      var self = this;
      var track = this.cur.TRACKS[index];
      var unlocked = this.game.trackUnlocked(index);
      var beltMeta = this.beltMeta(track.belt);
      var p = this.game.trackProgress(track);
      var complete = this.game.trackComplete(track);

      var card = el('div', 'track-card' + (unlocked ? '' : ' locked') + (complete ? ' complete' : ''));
      var stripe = el('div', 'belt-stripe');
      stripe.style.background = beltMeta.color;
      card.appendChild(stripe);

      var body = el('div', 'track-card-body');
      body.appendChild(el('div', 'track-belt-name', beltMeta.name.toUpperCase()));
      body.appendChild(el('div', 'track-title', track.title));

      var inst = CHARS[track.instructor];
      var meta = el('div', 'track-meta');
      var thumb = el('img', 'track-thumb');
      thumb.src = inst.img; thumb.alt = inst.name;
      meta.appendChild(thumb);
      meta.appendChild(el('span', 'track-instructor', inst.name));
      body.appendChild(meta);

      if (unlocked) {
        var prog = el('div', 'track-progress');
        var medals = '';
        for (var i = 0; i < track.drills.length; i++) {
          var st = this.game.drillState(track.drills[i].id);
          medals += st ? this.medalText(st.medal) : '·';
          medals += ' ';
        }
        prog.appendChild(el('span', 'track-medals', medals.trim()));
        prog.appendChild(el('span', 'track-duel-state',
          complete ? '⚔ WON' : (p.duelWon ? '⚔ won' : '⚔ duel waits')));
        body.appendChild(prog);
      } else {
        body.appendChild(el('div', 'track-locked', '🔒 Earn the previous belt'));
      }

      card.appendChild(body);
      if (unlocked) {
        card.onclick = function () { self.showTrack(index); };
        card.tabIndex = 0;
        card.onkeydown = function (ev) {
          if (ev.key === 'Enter') { ev.preventDefault(); card.onclick(); }
        };
      }
      return card;
    },

    /* ============== track screen ============== */

    showTrack: function (index) {
      this.screen = 'track';
      this.track = index;
      this.overlay = null; this.play = null;
      var track = this.cur.TRACKS[index];
      var beltMeta = this.beltMeta(track.belt);
      var inst = CHARS[track.instructor];
      var self = this;

      var r = this.root;
      clear(r);
      var s = el('div', 'screen track-screen');

      var head = el('div', 'track-head');
      var back = el('button', 'btn btn-ghost', '← DOJO');
      back.onclick = function () { self.showHub(); };
      head.appendChild(back);
      var ht = el('div', 'track-head-titles');
      var beltLabel = el('div', 'track-belt-name', beltMeta.name.toUpperCase() + ' COURSE');
      beltLabel.style.color = beltMeta.color;
      ht.appendChild(beltLabel);
      ht.appendChild(el('h2', 'track-screen-title', track.title));
      ht.appendChild(el('div', 'track-subtitle', track.subtitle));
      head.appendChild(ht);
      s.appendChild(head);

      var cols = el('div', 'track-cols');

      var lessonCol = el('div', 'lesson-col panel');
      var portrait = el('img', 'lesson-portrait');
      portrait.src = inst.img; portrait.alt = inst.name;
      lessonCol.appendChild(portrait);
      lessonCol.appendChild(el('div', 'lesson-inst-name', inst.name + ' — ' + inst.title));
      lessonCol.appendChild(el('p', 'lesson-intro', track.lesson.intro));
      var tbl = el('div', 'tech-table');
      track.lesson.techniques.forEach(function (t) {
        var row = el('div', 'tech-row');
        row.appendChild(el('code', 'tech-keys', t.keys));
        row.appendChild(el('span', 'tech-desc', t.desc));
        tbl.appendChild(row);
      });
      lessonCol.appendChild(tbl);
      cols.appendChild(lessonCol);

      var drillCol = el('div', 'drill-col');
      this.trackNav = { items: [], sel: 0 };
      var firstIncomplete = -1;
      drillCol.appendChild(el('div', 'col-label', 'TRAINING DRILLS'));
      track.drills.forEach(function (d, di) {
        var st = self.game.drillState(d.id);
        var row = el('div', 'drill-row panel' + (st ? ' done' : ''));
        var info = el('div', 'drill-info');
        info.appendChild(el('div', 'drill-name',
          (st ? self.medalText(st.medal) + ' ' : '○ ') + (di + 1) + '. ' + d.name));
        info.appendChild(el('div', 'drill-brief', d.brief));
        info.appendChild(el('div', 'drill-sub',
          'PAR ' + d.par + (st ? '  ·  best ' + st.best : '')));
        row.appendChild(info);
        if (st) {
          var bestBtn = el('button', 'btn btn-ghost', 'BEST ANSWER');
          bestBtn.onclick = function () { self.showSolution(d, null); };
          row.appendChild(bestBtn);
        }
        var play = el('button', 'btn btn-primary', st ? 'RETRY' : 'TRAIN');
        play.onclick = function () { self.startDrill(track, d, null); };
        row.appendChild(play);
        drillCol.appendChild(row);
        self.trackNav.items.push({ el: row, type: 'drill', drill: d });
        if (!st && firstIncomplete < 0) firstIncomplete = self.trackNav.items.length - 1;
      });

      drillCol.appendChild(el('div', 'col-label', 'THE DUEL'));
      var duelEl = this.duelCard(track, track.duel);
      drillCol.appendChild(duelEl);
      this.trackNav.items.push({ el: duelEl, type: 'duel', duel: track.duel });
      if (track.finalDuel) {
        var finalEl = this.duelCard(track, track.finalDuel);
        drillCol.appendChild(finalEl);
        this.trackNav.items.push({ el: finalEl, type: 'duel', duel: track.finalDuel });
      }
      this.trackNav.sel = firstIncomplete >= 0 ? firstIncomplete : 0;
      this.applyNavSel(this.trackNav);
      cols.appendChild(drillCol);

      s.appendChild(cols);
      s.appendChild(el('div', 'nav-hint',
        '1–' + track.drills.length + ' train drill  ·  j / k select  ·  ENTER start  ·  b best answer  ·  q / ESC back to dojo'));
      r.appendChild(s);
      this.flushToasts();
    },

    duelCard: function (track, duel) {
      var self = this;
      var won = !!this.game.save.duels[duel.id];
      var gated = duel === track.finalDuel && !this.game.save.duels[track.duel.id];
      var ready = this.duelReady(track, duel);

      var oppo = CHARS[duel.opponent];
      var card = el('div', 'duel-card panel' + (won ? ' done' : ''));
      var img = el('img', 'duel-thumb');
      img.src = oppo.img; img.alt = oppo.name;
      card.appendChild(img);
      var info = el('div', 'duel-info');
      info.appendChild(el('div', 'duel-name', '⚔ ' + duel.name));
      info.appendChild(el('div', 'duel-brief',
        won ? 'Victory recorded. Spar again any time.' :
        ready ? duel.rounds.length + ' rounds. Beat par to strike clean — overruns cost you HP.' :
        gated ? 'Win the championship first.' : 'Finish all drills to unlock.'));
      card.appendChild(info);
      var btn = el('button', 'btn ' + (ready ? 'btn-accent' : 'btn-ghost'), won ? 'REMATCH' : 'DUEL');
      btn.disabled = !ready;
      btn.onclick = function () { self.startDuel(track, duel); };
      card.appendChild(btn);
      return card;
    },

    /* ============== terminal renderer ============== */

    fileNameFor: function (drill) {
      if (drill.type === 'sandbox') return 'scratch.txt';
      return drill.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') + '.txt';
    },

    // builds a terminal window shell; caller fills linesEl each frame
    buildTerm: function (title, opts) {
      opts = opts || {};
      var win = el('div', 'term-window' + (opts.readonly ? ' readonly' : ''));
      var bar = el('div', 'term-titlebar');
      var dots = el('span', 'term-dots');
      dots.appendChild(el('i', 'dot-r'));
      dots.appendChild(el('i', 'dot-y'));
      dots.appendChild(el('i', 'dot-g'));
      bar.appendChild(dots);
      var titleEl = el('span', 'term-title', title);
      bar.appendChild(titleEl);
      win.appendChild(bar);

      var body = el('div', 'term-body');
      var linesEl = el('div', 'term-lines');
      body.appendChild(linesEl);

      var statusline = el('div', 'vim-statusline');
      var statusLeft = el('span', 'vim-file', opts.statusLeft || '');
      var statusRight = el('span', 'vim-ruler', '');
      statusline.appendChild(statusLeft);
      statusline.appendChild(statusRight);
      body.appendChild(statusline);

      var cmdline = null, cmdMode = null, cmdShow = null;
      if (!opts.readonly) {
        cmdline = el('div', 'vim-cmdline');
        cmdMode = el('span', 'vim-mode-msg', '');
        cmdShow = el('span', 'vim-showcmd', '');
        cmdline.appendChild(cmdMode);
        cmdline.appendChild(cmdShow);
        body.appendChild(cmdline);
      }
      win.appendChild(body);

      return {
        win: win, linesEl: linesEl, titleEl: titleEl,
        statusLeft: statusLeft, statusRight: statusRight,
        cmdMode: cmdMode, cmdShow: cmdShow
      };
    },

    // renders a fake shell prompt (used by shell-entry drills + playback)
    renderShell: function (linesEl, history, input) {
      clear(linesEl);
      var addLine = function (text, cursorAtEnd) {
        var lineEl = el('div', 'ed-line');
        lineEl.appendChild(el('span', 'ed-gutter', ' '));
        var content = el('span', 'ed-content');
        content.appendChild(el('span', 'ed-ch', text));
        if (cursorAtEnd) content.appendChild(el('span', 'ed-ch cur', ' '));
        lineEl.appendChild(content);
        linesEl.appendChild(lineEl);
      };
      history.forEach(function (h) { addLine(h, false); });
      addLine('student@dojo:~/training$ ' + input, true);
      for (var t = history.length + 1; t < 8; t++) {
        var tl = el('div', 'ed-line tilde');
        tl.appendChild(el('span', 'ed-gutter', ' '));
        tl.appendChild(el('span', 'ed-content', ' '));
        linesEl.appendChild(tl);
      }
    },

    // renders buffer lines (+ vim tildes) into a term's linesEl
    renderBuffer: function (linesEl, st, opts) {
      opts = opts || {};
      clear(linesEl);
      var minRows = opts.minRows || Math.max(st.lines.length + 2, 8);

      for (var rI = 0; rI < st.lines.length; rI++) {
        var lineEl = el('div', 'ed-line');
        lineEl.appendChild(el('span', 'ed-gutter', String(rI + 1)));
        var content = el('span', 'ed-content');
        var text = st.lines[rI];
        var renderLen = (st.mode === 'INSERT' && rI === st.row)
          ? text.length + 1 : Math.max(text.length, 1);

        for (var cI = 0; cI < renderLen; cI++) {
          var ch = cI < text.length ? text[cI] : ' ';
          var span = el('span', 'ed-ch', ch);
          if (!opts.plain && rI === st.row && cI === st.col) {
            span.className += st.mode === 'INSERT' ? ' cur-insert' : ' cur';
          }
          if (opts.stop && rI === opts.stop[0] && cI === opts.stop[1]) span.className += ' stop';
          if (st.selection) {
            if (st.selection.linewise) {
              if (rI >= st.selection.lo && rI <= st.selection.hi) span.className += ' sel';
            } else {
              var sSel = st.selection.start, eSel = st.selection.end;
              var after = (rI > sSel.row || (rI === sSel.row && cI >= sSel.col));
              var before = (rI < eSel.row || (rI === eSel.row && cI < eSel.col));
              if (after && before) span.className += ' sel';
            }
          }
          if (opts.lineClass && opts.lineClass[rI]) lineEl.classList.add(opts.lineClass[rI]);
          content.appendChild(span);
        }
        lineEl.appendChild(content);
        linesEl.appendChild(lineEl);
      }
      // vim tildes after EOF
      for (var t = st.lines.length; t < minRows; t++) {
        var tl = el('div', 'ed-line tilde');
        tl.appendChild(el('span', 'ed-gutter', ' '));
        tl.appendChild(el('span', 'ed-content', '~'));
        linesEl.appendChild(tl);
      }
    },

    modeMessage: function (st) {
      if (st.cmd !== null && st.cmd !== undefined) return st.cmd;
      if (st.search !== null) return st.search;
      if (st.mode === 'INSERT') return '-- INSERT --';
      if (st.mode === 'VISUAL') return '-- VISUAL --';
      if (st.mode === 'V-LINE') return '-- VISUAL LINE --';
      if (st.message) return st.message;
      return '';
    },

    /* ============== drill session ============== */

    startDrill: function (track, drill, duelCtx, dailyCtx) {
      this.screen = duelCtx ? 'duel' : (drill.type === 'sandbox' ? 'sandbox' : 'drill');
      this.overlay = null;

      // completed drills may serve a randomized variant (not in duels)
      var variant = (!duelCtx && drill.type !== 'sandbox')
        ? this.game.chooseVariant(drill) : null;
      var content = variant || drill;

      var eng = new window.VimEngine(content.start);
      // a variant's cursor belongs to its own buffer — never mix with base
      var cursor = variant ? variant.cursor : drill.cursor;
      if (cursor) eng.setCursor(cursor[0], cursor[1]);

      if (!duelCtx && drill.type !== 'sandbox') this.game.noteAttempt(drill.id);

      var fname = drill.file || this.fileNameFor(drill);
      eng.fileName = fname;

      this.session = {
        track: track,
        drill: drill,
        variant: variant,
        par: variant ? variant.par : drill.par,
        target: variant ? variant.target : drill.target,
        stops: variant ? variant.stops : drill.stops,
        engine: eng,
        fname: fname,
        phase: drill.shell ? 'shell' : 'vim',
        shellState: drill.shell
          ? { history: ['The dojo shell. Your scroll is ' + drill.file + '.',
                        'Open it:  vim ' + drill.file, ''], input: '' }
          : null,
        strokes: 0,
        stopIdx: 0,
        done: false,
        keyLog: [],
        startTs: Date.now(),
        duelCtx: duelCtx,
        dailyCtx: dailyCtx || null
      };
      this.buildPlayScreen();
      this.updateSession();
      if (duelCtx) this.startBlitzTimer();
    },

    // fake shell in front of shell-entry drills: type `vim <file>` to begin
    shellKey: function (token) {
      var s = this.session;
      var sh = s.shellState;
      if (token === '<CR>') {
        var cmd = sh.input.trim();
        sh.history.push('student@dojo:~/training$ ' + sh.input);
        sh.input = '';
        if (cmd === 'vim ' + s.drill.file) {
          s.phase = 'vim';
          if (this.play && this.play.term) {
            this.play.term.titleEl.textContent =
              'student@dojo: ~/training — vim ' + s.drill.file;
          }
        } else if (cmd.length) {
          sh.history.push('dojo: command not found — try: vim ' + s.drill.file);
        }
        while (sh.history.length > 6) sh.history.shift();
        return;
      }
      if (token === '<BS>') { sh.input = sh.input.slice(0, -1); return; }
      if (token.length === 1) sh.input += token;
    },

    // built ONCE per drill — keystrokes never rebuild this screen
    buildPlayScreen: function () {
      var s = this.session;
      var self = this;
      var r = this.root;
      clear(r);
      var scr = el('div', 'screen play-screen');
      this.play = { screen: scr };

      if (s.duelCtx) scr.appendChild(this.buildDuelHud());

      var head = el('div', 'play-head');
      var left = el('div', 'play-head-left');
      var nameLine = el('div', 'play-name', s.drill.name);
      if (s.variant) nameLine.appendChild(el('span', 'variant-badge', 'VARIANT'));
      if (s.dailyCtx) nameLine.appendChild(el('span', 'variant-badge daily',
        'DAILY ' + (s.dailyCtx.idx + 1) + '/' + s.dailyCtx.queue.length));
      left.appendChild(nameLine);
      left.appendChild(el('div', 'play-brief', s.drill.brief));
      head.appendChild(left);

      var right = el('div', 'play-head-right');
      if (s.drill.type !== 'sandbox') {
        right.appendChild(el('div', 'medal-thresholds',
          '🥇 ≤ ' + s.par + '   🥈 ≤ ' + Math.ceil(s.par * 1.6)));
      }
      var strokesEl = el('div', 'play-strokes', '');
      right.appendChild(strokesEl);
      this.play.strokesEl = strokesEl;
      var quit = el('button', 'btn btn-ghost',
        s.duelCtx ? '✕ FORFEIT (Ctrl-Q)' : '← BACK (Ctrl-Q)');
      quit.onclick = function () { self.abandon(); };
      right.appendChild(quit);
      head.appendChild(right);
      scr.appendChild(head);

      var panes = el('div', 'play-panes' + (s.drill.type === 'match' ? ' two' : ''));

      // the working terminal
      var fname = s.fname;
      var term = this.buildTerm(
        s.phase === 'shell'
          ? 'student@dojo: ~/training — zsh'
          : 'student@dojo: ~/training — vim ' + fname,
        { statusLeft: '"' + fname + '"' });
      panes.appendChild(term.win);
      this.play.term = term;

      if (s.drill.type === 'match') {
        var target = this.buildTerm('target.txt — what the buffer must become', { readonly: true, statusLeft: '"target.txt" [readonly]' });
        panes.appendChild(target.win);
        this.play.target = target;
      } else if (s.drill.type === 'cursor') {
        var cpPane = el('div', 'checkpoint-pane panel');
        cpPane.appendChild(el('div', 'pane-label', 'CHECKPOINTS'));
        var list = el('div', 'cp-list');
        this.play.cpRows = [];
        for (var i = 0; i < s.stops.length; i++) {
          var stop = s.stops[i];
          var row = el('div', 'cp', '◆ line ' + (stop[0] + 1) + ', col ' + (stop[1] + 1));
          list.appendChild(row);
          this.play.cpRows.push(row);
        }
        cpPane.appendChild(list);
        cpPane.appendChild(el('div', 'cp-help', 'Move the cursor onto the glowing cell.'));
        panes.appendChild(cpPane);
      }

      scr.appendChild(panes);

      if (s.drill.keys) {
        scr.appendChild(el('div', 'play-hint', 'TECHNIQUES: ' + s.drill.keys));
      }

      r.appendChild(scr);
    },

    // cheap in-place update — called per keystroke
    updateSession: function () {
      var s = this.session;
      var p = this.play;
      if (!s || !p) return;

      // shell phase renders a prompt instead of the editor
      if (s.phase === 'shell') {
        this.renderShell(p.term.linesEl, s.shellState.history, s.shellState.input);
        p.term.statusLeft.textContent = 'student@dojo:~/training';
        p.term.statusRight.textContent = 'zsh';
        p.term.cmdMode.textContent = '';
        p.term.cmdShow.textContent = '';
        if (s.drill.type === 'match' && p.target) {
          this.renderBuffer(p.target.linesEl, { lines: s.target, mode: 'NORMAL' },
            { plain: true, minRows: Math.max(s.target.length + 2, 8) });
        }
        if (s.drill.type !== 'sandbox') {
          var paceSh = this.game.medalFor(s.par, Math.max(s.strokes, 1));
          p.strokesEl.className = 'play-strokes pace-' + paceSh;
          p.strokesEl.textContent = s.strokes + ' / PAR ' + s.par;
        }
        return;
      }

      var st = s.engine.getState();

      var stop = (s.drill.type === 'cursor' && !s.done) ? s.stops[s.stopIdx] : null;
      var minRows = Math.max(st.lines.length, (s.target ? s.target.length : 0)) + 2;
      minRows = Math.max(minRows, 8);
      this.renderBuffer(p.term.linesEl, st, { stop: stop, minRows: minRows });
      p.term.statusLeft.textContent = '"' + s.fname + '"' + (st.modified ? ' [+]' : '');
      p.term.statusRight.textContent = (st.row + 1) + ',' + (st.col + 1) + '        All';
      p.term.cmdMode.textContent = this.modeMessage(st);
      p.term.cmdShow.textContent =
        (st.recording ? 'recording @' + st.recording + '   ' : '') + st.pending;

      if (s.drill.type === 'match') {
        var lineClass = {};
        var allMatch = st.lines.length === s.target.length;
        for (var i = 0; i < s.target.length; i++) {
          lineClass[i] = (st.lines[i] === s.target[i] && allMatch) ? 'line-ok' : 'line-diff';
        }
        this.renderBuffer(p.target.linesEl, { lines: s.target, mode: 'NORMAL' },
          { plain: true, minRows: minRows, lineClass: lineClass });
        p.target.statusRight.textContent = '';
      }

      if (s.drill.type === 'cursor' && p.cpRows) {
        for (var c = 0; c < p.cpRows.length; c++) {
          p.cpRows[c].className =
            c < s.stopIdx ? 'cp done' : (c === s.stopIdx ? 'cp active' : 'cp');
          if (c < s.stopIdx) {
            p.cpRows[c].textContent = '✓ line ' + (s.stops[c][0] + 1) + ', col ' + (s.stops[c][1] + 1);
          }
        }
      }

      // strokes / pace
      if (s.drill.type !== 'sandbox') {
        var pace = this.game.medalFor(s.par, Math.max(s.strokes, 1));
        p.strokesEl.className = 'play-strokes pace-' + pace;
        p.strokesEl.textContent = s.strokes + ' / PAR ' + s.par;
      } else {
        p.strokesEl.className = 'play-strokes';
        p.strokesEl.textContent = s.strokes + ' keys';
      }
    },

    feedKey: function (token) {
      var s = this.session;
      if (!s || s.done) return;
      Audio.tick();
      s.strokes++;
      s.keyLog.push(token);
      this.game.save.stats.keys++;

      // shell phase: keys go to the prompt, not the editor
      if (s.phase === 'shell') {
        this.shellKey(token);
        if (s.phase === 'vim') Audio.checkpoint();
        this.updateSession();
        return;
      }

      s.engine.key(token);

      if (s.drill.type === 'cursor') {
        var stop = s.stops[s.stopIdx];
        if (stop && s.engine.row === stop[0] && s.engine.col === stop[1]) {
          s.stopIdx++;
          Audio.checkpoint();
        }
        if (s.stopIdx >= s.stops.length) s.done = true;
      } else if (s.drill.type === 'match') {
        if (s.drill.requireExit) {
          // these drills end the vim way: save/quit out of the editor
          if (s.engine.quit) {
            if (s.engine.equals(s.target)) {
              s.done = true;
            } else {
              s.engine.quit = false;
              s.engine.lastMessage = 'the scroll is not right yet — the dojo holds the door';
            }
          }
        } else {
          if (s.engine.mode === 'NORMAL' && s.engine.equals(s.target)) {
            s.done = true;
          }
          if (s.engine.quit) {
            // quitting isn't part of this drill — bounce back kindly
            s.engine.quit = false;
            s.engine.lastMessage = '(finish the drill first — the dojo holds the door)';
          }
        }
      } else if (s.engine.quit) {
        s.engine.quit = false; // sandbox / cursor drills: nowhere to quit to
      }

      this.updateSession();
      if (s.done) this.completeSession();
    },

    completeSession: function () {
      var s = this.session;
      this.game.save.stats.ms += Date.now() - s.startTs;
      if (s.duelCtx) {
        this.completeDuelRound();
        return;
      }
      // replays only stored for the base drill so they compare fairly to par
      var medal = this.game.recordDrill(s.drill, s.strokes, s.par,
        s.variant ? null : s.keyLog);
      Audio.medal(medal);
      if (s.dailyCtx) s.dailyCtx.results.push({ drill: s.drill, medal: medal, strokes: s.strokes, par: s.par });
      this.overlay = 'result';
      this.play.screen.appendChild(this.resultOverlay());
      this.flushToasts();
    },

    retryDrill: function () {
      var s = this.session;
      this.startDrill(s.track, s.drill, s.duelCtx, s.dailyCtx);
    },

    afterResult: function () {
      var s = this.session;
      if (s.dailyCtx) { this.nextDailyDrill(s.dailyCtx); return; }
      this.showTrack(this.cur.TRACKS.indexOf(s.track));
    },

    abandon: function () {
      this.stopBlitzTimer();
      var s = this.session;
      if (s && s.dailyCtx) { this.showHub(); return; }
      if (this.screen === 'sandbox') { this.showHub(); return; }
      if (s && s.track) this.showTrack(this.cur.TRACKS.indexOf(s.track));
      else this.showHub();
    },

    /* ============== daily training ============== */

    startDaily: function () {
      var set = this.game.dailySet();
      if (!set.length) return;
      var ctx = { queue: set, idx: 0, results: [] };
      var first = set[0];
      this.startDrill(this.cur.TRACKS[first.trackIndex], first.drill, null, ctx);
    },

    nextDailyDrill: function (ctx) {
      ctx.idx++;
      if (ctx.idx >= ctx.queue.length) {
        this.game.recordDaily();
        this.showDailySummary(ctx);
        return;
      }
      var item = ctx.queue[ctx.idx];
      this.startDrill(this.cur.TRACKS[item.trackIndex], item.drill, null, ctx);
    },

    showDailySummary: function (ctx) {
      var self = this;
      this.screen = 'hub'; // summary floats over a rebuilt hub
      var r = this.root;
      clear(r);
      var ov = el('div', 'overlay');
      var panel = el('div', 'result-panel panel');
      panel.appendChild(el('h2', 'result-title win', 'DAILY TRAINING COMPLETE'));
      var golds = 0;
      ctx.results.forEach(function (res) {
        var row = el('p', 'result-stats',
          self.medalText(res.medal) + '  ' + res.drill.name + '  —  ' +
          res.strokes + ' / PAR ' + res.par);
        panel.appendChild(row);
        if (res.medal === 'gold') golds++;
      });
      panel.appendChild(el('p', 'result-tip',
        golds === ctx.results.length ? 'Flawless session. The masters noticed.' :
        'Come back tomorrow — the dojo remembers your weak spots.'));
      var done = el('button', 'btn btn-primary btn-big', 'RETURN TO THE DOJO (Enter)');
      var finish = function () {
        document.removeEventListener('keydown', handler, true);
        ov.remove();
        self.showHub();
      };
      done.onclick = finish;
      panel.appendChild(done);
      ov.appendChild(panel);
      var handler = function (e) {
        if (!document.contains(ov)) { // self-heal after a screen rebuild
          document.removeEventListener('keydown', handler, true);
          return;
        }
        if (e.key === 'Enter' || e.key === 'Escape' || e.key === 'q' || e.key === 'Q') {
          e.preventDefault();
          e.stopImmediatePropagation();
          finish();
        }
      };
      document.addEventListener('keydown', handler, true);
      r.appendChild(ov);
      this.flushToasts();
    },

    /* ============== duel flow ============== */

    startDuel: function (track, duel) {
      this.duel = {
        track: track,
        duel: duel,
        round: 0,
        playerHP: 100,
        oppHP: 100,
        dmgPerRound: Math.ceil(100 / duel.rounds.length),
        tookDamage: false,
        result: null
      };
      this.showDuelIntro();
    },

    showDuelIntro: function () {
      var d = this.duel;
      var oppo = CHARS[d.duel.opponent];
      var art = DUEL_ART[d.duel.id];
      var self = this;

      this.screen = 'duel';
      this.overlay = 'banner';
      var r = this.root;
      clear(r);
      var s = el('div', 'screen duel-intro-screen');
      var panel = el('div', 'duel-intro panel');
      if (art) {
        var img = el('img', 'duel-intro-art');
        img.src = art.intro; img.alt = '';
        panel.appendChild(img);
      } else {
        var img2 = el('img', 'duel-intro-portrait');
        img2.src = oppo.img; img2.alt = oppo.name;
        panel.appendChild(img2);
      }
      panel.appendChild(el('h2', 'duel-intro-title', d.duel.name));
      panel.appendChild(el('p', 'duel-intro-taunt', '"' + d.duel.intro + '"'));
      var mode = this.game.prefs.duelMode;
      var rules = d.duel.rounds.length + ' rounds. Each round won strikes ' + d.dmgPerRound +
        ' HP off ' + oppo.name + '. Every keystroke past PAR costs you 2 HP (max 30 per round).';
      if (mode === 'assist') rules += ' ASSIST MODE: damage you take is halved.';
      if (mode === 'blitz') rules += ' BLITZ MODE: beat the round timer or take 20 HP.';
      rules += ' Reach 0 and you fall.';
      panel.appendChild(el('p', 'duel-intro-rules', rules));
      if (mode !== 'normal') {
        panel.appendChild(el('div', 'duel-mode-badge', mode.toUpperCase() + ' MODE — change in SETTINGS'));
      }
      var btns = el('div', 'result-btns');
      var back = el('button', 'btn btn-ghost', '← BACK (Esc)');
      back.onclick = function () {
        self.duelIntroActive = false;
        self.showTrack(self.cur.TRACKS.indexOf(d.track));
      };
      var go = el('button', 'btn btn-accent btn-big', 'BEGIN (Enter)');
      go.onclick = function () { self.nextDuelRound(); };
      btns.appendChild(back);
      btns.appendChild(go);
      panel.appendChild(btns);
      s.appendChild(panel);
      r.appendChild(s);
      this.duelIntroActive = true;
    },

    buildDuelHud: function () {
      var d = this.duel;
      var oppo = CHARS[d.duel.opponent];
      var hud = el('div', 'duel-hud');

      var p = el('div', 'duel-side player');
      p.appendChild(el('div', 'duel-side-name', 'YOU'));
      var pbar = el('div', 'hp-bar');
      var pfill = el('div', 'hp-fill player');
      pfill.style.width = d.playerHP + '%';
      pbar.appendChild(pfill);
      p.appendChild(pbar);
      var pnum = el('div', 'hp-num', d.playerHP + ' HP');
      p.appendChild(pnum);
      hud.appendChild(p);

      hud.appendChild(el('div', 'duel-round-label',
        'ROUND ' + Math.min(d.round + 1, d.duel.rounds.length) + '/' + d.duel.rounds.length));

      var o = el('div', 'duel-side opponent');
      var head = el('div', 'duel-side-head');
      var img = el('img', 'duel-opp-img');
      img.src = oppo.img; img.alt = oppo.name;
      o.appendChild(el('div', 'duel-side-name', oppo.name));
      var obar = el('div', 'hp-bar');
      var ofill = el('div', 'hp-fill opponent');
      ofill.style.width = d.oppHP + '%';
      obar.appendChild(ofill);
      o.appendChild(obar);
      var onum = el('div', 'hp-num', d.oppHP + ' HP');
      o.appendChild(onum);
      head.appendChild(img);
      o.appendChild(head);
      hud.appendChild(o);

      this.play.hp = { pfill: pfill, pnum: pnum, ofill: ofill, onum: onum };

      if (this.game.prefs.duelMode === 'blitz') {
        var timerWrap = el('div', 'blitz-timer');
        var timerFill = el('div', 'blitz-fill');
        timerWrap.appendChild(timerFill);
        var timerNum = el('span', 'blitz-num', '');
        timerWrap.appendChild(timerNum);
        hud.appendChild(timerWrap);
        this.play.blitz = { wrap: timerWrap, fill: timerFill, num: timerNum };
      }
      return hud;
    },

    /* ----- blitz round timer ----- */

    startBlitzTimer: function () {
      this.stopBlitzTimer();
      if (this.game.prefs.duelMode !== 'blitz' || !this.session || !this.session.duelCtx) return;
      var self = this;
      var s = this.session;
      var total = Math.max(12, Math.ceil(s.par * 1.5)); // seconds
      var deadline = Date.now() + total * 1000;
      s.blitzExpired = false;
      this._blitzTimer = setInterval(function () {
        if (!self.play || !self.play.blitz || !self.session || self.session.done) {
          self.stopBlitzTimer();
          return;
        }
        var left = Math.max(0, deadline - Date.now());
        var pct = (left / (total * 1000)) * 100;
        self.play.blitz.fill.style.width = pct + '%';
        self.play.blitz.num.textContent = Math.ceil(left / 1000) + 's';
        self.play.blitz.wrap.classList.toggle('low', pct < 25);
        if (left <= 0 && !s.blitzExpired) {
          s.blitzExpired = true;
          self.stopBlitzTimer();
          var d = self.duel;
          d.playerHP = Math.max(0, d.playerHP - 20);
          d.tookDamage = true;
          Audio.damage();
          self.updateDuelHud();
          self.play.blitz.num.textContent = 'TIME!';
          if (d.playerHP <= 0) {
            d.result = 'lose';
            self.overlay = 'duel-result';
            self.play.screen.appendChild(self.duelResultOverlay());
          }
        }
      }, 150);
    },

    stopBlitzTimer: function () {
      if (this._blitzTimer) {
        clearInterval(this._blitzTimer);
        this._blitzTimer = null;
      }
    },

    updateDuelHud: function () {
      var d = this.duel;
      var hp = this.play && this.play.hp;
      if (!hp) return;
      hp.pfill.style.width = d.playerHP + '%';
      hp.pnum.textContent = d.playerHP + ' HP';
      hp.ofill.style.width = d.oppHP + '%';
      hp.onum.textContent = d.oppHP + ' HP';
    },

    nextDuelRound: function () {
      if (this._bannerHandler) {
        document.removeEventListener('keydown', this._bannerHandler, true);
        this._bannerHandler = null;
      }
      this.duelIntroActive = false;
      var d = this.duel;
      this.overlay = null;
      this.startDrill(d.track, d.duel.rounds[d.round], d);
    },

    completeDuelRound: function () {
      this.stopBlitzTimer();
      var d = this.duel;
      var s = this.session;
      var over = Math.max(0, s.strokes - s.par);
      var selfDmg = Math.min(30, over * 2);
      if (this.game.prefs.duelMode === 'assist') selfDmg = Math.ceil(selfDmg / 2);
      d.oppHP = Math.max(0, d.oppHP - d.dmgPerRound);
      if (selfDmg > 0) {
        d.playerHP = Math.max(0, d.playerHP - selfDmg);
        d.tookDamage = true;
        Audio.damage();
      } else {
        Audio.checkpoint();
      }
      d.lastSelfDmg = selfDmg;
      d.round++;
      this.updateDuelHud();

      if (d.playerHP <= 0) {
        d.result = 'lose';
        this.overlay = 'duel-result';
        this.play.screen.appendChild(this.duelResultOverlay());
      } else if (d.round >= d.duel.rounds.length) {
        d.oppHP = 0;
        this.updateDuelHud();
        d.result = 'win';
        this.game.recordDuelWin(d.duel.id, d.tookDamage);
        Audio.duelWin();
        this.overlay = 'duel-result';
        this.play.screen.appendChild(this.duelResultOverlay());
      } else {
        this.overlay = 'banner';
        this.play.screen.appendChild(this.roundBanner());
      }
      this.flushToasts();
    },

    afterDuelResult: function () {
      var d = this.duel;
      var self = this;
      if (d.result === 'win' && d.duel.id === 't8final') {
        // the grand finale: story scene, then the ending ceremony
        this.playScene(window.STORY.byId('finale'), function () { self.showEnding(); });
      } else {
        this.showTrack(this.cur.TRACKS.indexOf(d.track));
      }
    },

    /* ============== best-answer playback ============== */

    trackOf: function (drill) {
      for (var i = 0; i < this.cur.TRACKS.length; i++) {
        if (this.cur.TRACKS[i].drills.indexOf(drill) >= 0) return i;
      }
      return this.track || 0;
    },

    showSolution: function (drill, returnTo) {
      var self = this;
      this._solReturn = returnTo || null;
      // dismiss the result overlay if it's up
      var existing = document.querySelector('.overlay');
      if (this.overlay === 'result' && existing) existing.remove();
      this.overlay = 'solution';

      var rec = this.game.drillState(drill.id);
      var hasMine = !!(rec && rec.bestKeys && rec.bestKeys.length);

      var ov = el('div', 'overlay');
      ov.id = 'solution-overlay';
      var panel = el('div', 'solution-panel panel');
      panel.appendChild(el('h2', 'solution-title', 'BEST ANSWER — ' + drill.name));
      var sub = el('p', 'solution-sub', '');
      panel.appendChild(sub);

      // PAR vs YOUR BEST tabs
      var tabs = el('div', 'sol-tabs');
      var tabPar = el('button', 'btn btn-ghost sol-tab active', 'PAR SOLUTION (' + drill.par + ')');
      tabs.appendChild(tabPar);
      var tabMine = null;
      if (hasMine) {
        tabMine = el('button', 'btn btn-ghost sol-tab', 'YOUR BEST (' + rec.bestKeys.length + ')');
        tabs.appendChild(tabMine);
      }
      panel.appendChild(tabs);

      var strip = el('div', 'key-strip');
      panel.appendChild(strip);

      var term = this.buildTerm('vim — replay', { statusLeft: '"' + this.fileNameFor(drill) + '"' });
      term.win.classList.add('mini');
      panel.appendChild(term.win);

      var btns = el('div', 'result-btns');
      var replay = el('button', 'btn btn-ghost', 'REPLAY (r)');
      replay.onclick = function () { self.replaySolution(); };
      var tryIt = el('button', 'btn btn-accent', 'TRY IT NOW (t)');
      tryIt.onclick = function () { self.tryFromSolution(); };
      var close = el('button', 'btn btn-primary', 'CLOSE (Esc)');
      close.onclick = function () { self.closeSolution(); };
      btns.appendChild(replay);
      btns.appendChild(tryIt);
      btns.appendChild(close);
      panel.appendChild(btns);

      ov.appendChild(panel);
      this.root.appendChild(ov);

      this.solution = {
        drill: drill, term: term, strip: strip, sub: sub,
        tabPar: tabPar, tabMine: tabMine, rec: rec,
        source: 'par', tokens: [], chips: [],
        engine: null, idx: 0, stopIdx: 0, timer: null, ov: ov
      };

      tabPar.onclick = function () { self.setSolutionSource('par'); };
      if (tabMine) tabMine.onclick = function () { self.setSolutionSource('mine'); };
      this.setSolutionSource('par');
    },

    setSolutionSource: function (source) {
      var sol = this.solution;
      if (!sol) return;
      sol.source = source;
      sol.tabPar.classList.toggle('active', source === 'par');
      if (sol.tabMine) sol.tabMine.classList.toggle('active', source === 'mine');
      if (source === 'par') {
        sol.tokens = this.cur.parseKeys(sol.drill.sol);
        sol.sub.textContent = sol.drill.par + ' keystrokes — the dojo\'s way. Watch, then steal the technique.';
      } else {
        sol.tokens = sol.rec.bestKeys.slice();
        sol.sub.textContent = 'Your best run — ' + sol.rec.bestKeys.length +
          ' keystrokes vs PAR ' + sol.drill.par + '.';
      }
      // rebuild the key strip
      clear(sol.strip);
      sol.chips = [];
      var stripEl = sol.strip;
      sol.tokens.forEach(function (t) {
        var chip = el('kbd', 'key-chip', keyLabel(t));
        stripEl.appendChild(chip);
        sol.chips.push(chip);
      });
      this.replaySolution();
    },

    tryFromSolution: function () {
      var sol = this.solution;
      if (!sol) return;
      var drill = sol.drill;
      var ti = this.trackOf(drill);
      this._solReturn = null;
      this.closeSolution();
      this.startDrill(this.cur.TRACKS[ti], drill, null);
    },

    replaySolution: function () {
      var sol = this.solution;
      if (!sol) return;
      var self = this;
      if (sol.timer) { clearInterval(sol.timer); sol.timer = null; }
      sol.engine = new window.VimEngine(sol.drill.start);
      if (sol.drill.cursor) sol.engine.setCursor(sol.drill.cursor[0], sol.drill.cursor[1]);
      sol.engine.fileName = sol.drill.file || this.fileNameFor(sol.drill);
      sol.idx = 0;
      sol.stopIdx = 0;
      sol.phase = sol.drill.shell ? 'shell' : 'vim';
      sol.shellInput = '';
      sol.shellHistory = sol.drill.shell ? ['Open it:  vim ' + sol.drill.file, ''] : [];
      sol.chips.forEach(function (c) { c.className = 'key-chip'; });
      this.renderSolutionFrame();

      sol.timer = setInterval(function () {
        if (sol.idx >= sol.tokens.length) {
          clearInterval(sol.timer);
          sol.timer = null;
          return;
        }
        var t = sol.tokens[sol.idx];
        if (sol.phase === 'shell') {
          // mirror the in-game shell rules so replays stay faithful
          if (t === '<CR>') {
            var cmd = sol.shellInput.trim();
            sol.shellHistory.push('student@dojo:~/training$ ' + sol.shellInput);
            sol.shellInput = '';
            if (cmd === 'vim ' + sol.drill.file) sol.phase = 'vim';
          } else if (t === '<BS>') {
            sol.shellInput = sol.shellInput.slice(0, -1);
          } else if (t.length === 1) {
            sol.shellInput += t;
          }
        } else {
          sol.engine.key(t);
        }
        Audio.tick();
        sol.chips[sol.idx].className = 'key-chip hit';
        if (sol.idx > 0) sol.chips[sol.idx - 1].className = 'key-chip used';
        sol.idx++;
        if (sol.drill.type === 'cursor') {
          var stop = sol.drill.stops[sol.stopIdx];
          if (stop && sol.engine.row === stop[0] && sol.engine.col === stop[1]) {
            sol.stopIdx++;
            Audio.checkpoint();
          }
        }
        self.renderSolutionFrame();
      }, 340);
    },

    renderSolutionFrame: function () {
      var sol = this.solution;
      if (sol.phase === 'shell') {
        this.renderShell(sol.term.linesEl, sol.shellHistory, sol.shellInput);
        sol.term.statusRight.textContent = 'zsh';
        sol.term.cmdMode.textContent = '';
        sol.term.cmdShow.textContent = '';
        return;
      }
      var st = sol.engine.getState();
      var stop = sol.drill.type === 'cursor' ? sol.drill.stops[sol.stopIdx] : null;
      this.renderBuffer(sol.term.linesEl, st, { stop: stop, minRows: Math.max(st.lines.length + 1, 6) });
      sol.term.statusRight.textContent = (st.row + 1) + ',' + (st.col + 1) + '        All';
      sol.term.cmdMode.textContent = this.modeMessage(st);
      sol.term.cmdShow.textContent =
        (st.recording ? 'recording @' + st.recording + '   ' : '') + st.pending;
    },

    closeSolution: function () {
      var sol = this.solution;
      if (!sol) return;
      if (sol.timer) clearInterval(sol.timer);
      sol.ov.remove();
      this.solution = null;
      if (this._solReturn === 'result' && this.play) {
        this.overlay = 'result';
        this.play.screen.appendChild(this.resultOverlay());
      } else {
        this.overlay = null;
      }
      this._solReturn = null;
    },

    /* ============== overlays ============== */

    resultOverlay: function () {
      var s = this.session;
      var self = this;
      var medal = this.game.medalFor(s.par, s.strokes);
      var ov = el('div', 'overlay');
      var panel = el('div', 'result-panel panel');
      panel.appendChild(el('div', 'result-medal', this.medalText(medal)));
      panel.appendChild(el('h2', 'result-title',
        medal === 'gold' ? 'PERFECT FORM' : medal === 'silver' ? 'CLEAN WORK' : 'COMPLETE'));
      panel.appendChild(el('p', 'result-stats',
        s.strokes + ' keystrokes · PAR ' + s.par + (s.variant ? ' (variant)' : '')));
      var best = this.game.drillState(s.drill.id);
      if (best) panel.appendChild(el('p', 'result-best', 'best: ' + best.best));
      if (medal !== 'gold') {
        panel.appendChild(el('p', 'result-tip', 'Par is reachable — watch the best answer and steal the idea.'));
      }
      var btns = el('div', 'result-btns');
      var bestBtn = el('button', 'btn btn-accent', 'BEST ANSWER (b)');
      bestBtn.onclick = function () { self.showSolution(s.drill, 'result'); };
      var retry = el('button', 'btn btn-ghost', 'RETRY (r)');
      retry.onclick = function () { self.retryDrill(); };
      var back = el('button', 'btn btn-ghost',
        s.dailyCtx ? 'QUIT DAILY (Esc)' : 'COURSE (Esc)');
      back.onclick = function () {
        if (s.dailyCtx) self.showHub();
        else self.afterResult();
      };
      var next = el('button', 'btn btn-primary',
        s.dailyCtx ? 'NEXT DRILL (Enter)' : 'CONTINUE (Enter)');
      next.onclick = function () { self.afterResult(); };
      btns.appendChild(bestBtn);
      btns.appendChild(retry);
      btns.appendChild(back);
      btns.appendChild(next);
      panel.appendChild(btns);
      ov.appendChild(panel);
      return ov;
    },

    roundBanner: function () {
      var d = this.duel;
      var self = this;
      var ov = el('div', 'overlay');
      var panel = el('div', 'result-panel panel');
      var dmgLine = d.lastSelfDmg > 0
        ? 'You overran par — took ' + d.lastSelfDmg + ' damage.'
        : 'Clean strike. No damage taken.';
      panel.appendChild(el('h2', 'result-title', 'ROUND ' + d.round + ' CLEARED'));
      panel.appendChild(el('p', 'result-stats', dmgLine));
      panel.appendChild(el('p', 'result-stats',
        CHARS[d.duel.opponent].name + ' takes ' + d.dmgPerRound + ' damage!'));
      var next = el('button', 'btn btn-accent', 'NEXT ROUND (Enter)');
      next.onclick = function () { self.nextDuelRound(); };
      panel.appendChild(next);
      ov.appendChild(panel);
      // Enter advances; stop the event so it can't leak into the next
      // round as a counted keystroke
      var handler = function (e) {
        // self-heal if the banner was removed by a screen rebuild
        if (!document.contains(ov)) {
          document.removeEventListener('keydown', handler, true);
          if (self._bannerHandler === handler) self._bannerHandler = null;
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopImmediatePropagation();
          self.nextDuelRound();
        }
      };
      this._bannerHandler = handler;
      document.addEventListener('keydown', handler, true);
      return ov;
    },

    duelResultOverlay: function () {
      var d = this.duel;
      var self = this;
      var art = DUEL_ART[d.duel.id];
      var ov = el('div', 'overlay');
      var panel = el('div', 'result-panel panel wide');
      if (d.result === 'win') {
        if (art && art.win) {
          var img = el('img', 'duel-result-art');
          img.src = art.win; img.alt = '';
          panel.appendChild(img);
        }
        panel.appendChild(el('h2', 'result-title win', 'VICTORY'));
        panel.appendChild(el('p', 'result-stats', '"' + d.duel.winText + '"'));
        if (!d.tookDamage) panel.appendChild(el('p', 'result-tip', 'FLAWLESS — not a scratch.'));
      } else {
        if (art && art.lose) {
          var img2 = el('img', 'duel-result-art');
          img2.src = art.lose; img2.alt = '';
          panel.appendChild(img2);
        }
        panel.appendChild(el('h2', 'result-title lose', 'DEFEAT'));
        panel.appendChild(el('p', 'result-stats', '"' + d.duel.loseText + '"'));
      }
      var next = el('button', 'btn btn-primary btn-big', 'CONTINUE (Enter / Esc)');
      next.onclick = function () { self.afterDuelResult(); };
      panel.appendChild(next);
      ov.appendChild(panel);
      return ov;
    },

    /* ============== ending + certificate ============== */

    showEnding: function () {
      this.screen = 'ending';
      this.session = null; this.duel = null; this.overlay = null; this.play = null;
      var r = this.root;
      clear(r);
      var self = this;
      var s = el('div', 'screen ending-screen');
      var panel = el('div', 'ending-panel');

      var img = el('img', 'ending-art');
      img.src = 'assets/img/robot_defeats_ninja.jpeg';
      img.alt = 'The final duel';
      panel.appendChild(img);

      panel.appendChild(el('h1', 'ending-title', 'BLACK BELT'));
      panel.appendChild(el('p', 'ending-text',
        'The arena falls silent. BLADE lowers his sword and bows. BYTE\'s eyes glow warm again. ' +
        'The change that hung open for twenty years is complete, the Static is gone, ' +
        'and the Neon Dojo has a new master. The grid will remember your name.'));

      var totals = this.game.totals();
      panel.appendChild(el('p', 'ending-stats',
        '🥇 ' + totals.golds + ' / ' + totals.drillsTotal + ' gold medals  ·  ⛩ 8 / 8 belts'));

      var watcher = el('div', 'ending-watcher');
      var wimg = el('img', 'ending-watcher-img');
      wimg.src = 'assets/img/shell.png'; wimg.alt = 'SHELL';
      watcher.appendChild(wimg);
      watcher.appendChild(el('p', 'ending-watcher-text',
        'SHELL: "Heh. I\'ve watched a thousand students walk through those doors. ' +
        'Not one of them ever made the dot sing like that. Go on, master — your certificate is ready."'));
      panel.appendChild(watcher);

      var btns = el('div', 'result-btns');
      var cert = el('button', 'btn btn-accent btn-big', 'CLAIM YOUR CERTIFICATE (c)');
      cert.onclick = function () { self.showCertificate(); };
      var back = el('button', 'btn btn-primary btn-big', 'RETURN TO THE DOJO (Enter)');
      back.onclick = function () { self.showHub(); };
      btns.appendChild(cert);
      btns.appendChild(back);
      panel.appendChild(btns);

      s.appendChild(panel);
      r.appendChild(s);
    },

    showCertificate: function () {
      this.screen = 'certificate';
      this.overlay = null;
      var self = this;
      var r = this.root;
      clear(r);
      var s = el('div', 'screen cert-screen');

      var head = el('div', 'cert-head');
      var back = el('button', 'btn btn-ghost', '← DOJO');
      back.onclick = function () { self.showHub(); };
      head.appendChild(back);
      head.appendChild(el('h2', 'cert-screen-title', 'CERTIFICATE OF MASTERY'));
      s.appendChild(head);

      var controls = el('div', 'cert-controls panel');
      controls.appendChild(el('label', 'cert-label', 'Name on the certificate:'));
      var input = el('input', 'cert-input');
      input.type = 'text';
      input.maxLength = 40;
      input.placeholder = 'Your name';
      input.value = this.game.save.playerName || '';
      controls.appendChild(input);
      var dl = el('button', 'btn btn-accent', 'DOWNLOAD PNG (Enter)');
      controls.appendChild(dl);
      s.appendChild(controls);

      var canvasWrap = el('div', 'cert-canvas-wrap panel');
      var canvas = document.createElement('canvas');
      canvas.className = 'cert-canvas';
      canvasWrap.appendChild(canvas);
      s.appendChild(canvasWrap);

      r.appendChild(s);

      var totals = this.game.totals();
      var perfect = this.game.allGold();
      if (perfect) {
        controls.appendChild(el('span', 'perfect-tag', '★ PERFECT FORM EDITION'));
      }
      var renderTimer = null;
      var opts = function () {
        return {
          canvas: canvas,
          name: input.value,
          golds: totals.golds,
          total: totals.drillsTotal,
          perfect: perfect
        };
      };
      var render = function () { window.Certificate.build(opts()); };
      input.addEventListener('input', function () {
        self.game.save.playerName = input.value;
        self.game.persist();
        clearTimeout(renderTimer);
        renderTimer = setTimeout(render, 250);
      });
      dl.onclick = function () {
        window.Certificate.build(opts()).then(function (c) {
          window.Certificate.download(c);
        });
      };
      render();
      input.focus();
    },

    /* ============== sandbox ============== */

    showSandbox: function () {
      var sample = [
        'Welcome to the sandbox.',
        'No pars, no medals, no judgement —',
        'just you and the buffer.',
        '',
        'function practice(everything) {',
        '  const moves = ["dw", "ciw", "f;", "."];',
        '  return moves.join(" then ");',
        '}',
        '',
        'Press Ctrl-Q to return to the dojo.'
      ];
      this.startDrill(null, {
        id: 'sandbox', name: 'DOJO SANDBOX', type: 'sandbox', par: 0,
        brief: 'Free practice. Ctrl-Q to leave.',
        start: sample
      }, null);
    },

    /* ============== achievements ============== */

    showAchievements: function () {
      var self = this;
      var ov = el('div', 'overlay');
      var panel = el('div', 'ach-panel panel');
      panel.appendChild(el('h2', 'ach-title', 'ACHIEVEMENTS'));
      var list = el('div', 'ach-list');
      window.Game.ACHIEVEMENTS.forEach(function (a) {
        var got = self.game.has(a.id);
        var row = el('div', 'ach-row' + (got ? ' got' : ''));
        row.appendChild(el('span', 'ach-icon', got ? '★' : '☆'));
        var txt = el('div', 'ach-txt');
        txt.appendChild(el('div', 'ach-name', a.name));
        txt.appendChild(el('div', 'ach-desc', a.desc));
        row.appendChild(txt);
        list.appendChild(row);
      });
      panel.appendChild(list);
      var close = el('button', 'btn btn-primary', 'CLOSE (Esc)');
      var cleanup = this.escClosable(ov);
      close.onclick = cleanup;
      panel.appendChild(close);
      ov.appendChild(panel);
      ov.onclick = function (e) { if (e.target === ov) cleanup(); };
      this.root.appendChild(ov);
    },

    /* ============== settings ============== */

    showSettings: function () {
      var self = this;
      var g = this.game;
      var ov = el('div', 'overlay');
      var panel = el('div', 'ach-panel panel');
      panel.appendChild(el('h2', 'ach-title', 'SETTINGS'));
      var list = el('div', 'settings-list');

      function toggleRow(label, desc, get, set) {
        var row = el('div', 'settings-row');
        var txt = el('div', 'ach-txt');
        txt.appendChild(el('div', 'ach-name', label));
        txt.appendChild(el('div', 'ach-desc', desc));
        row.appendChild(txt);
        var btn = el('button', 'btn btn-ghost', get() ? 'ON' : 'OFF');
        btn.onclick = function () {
          set(!get());
          btn.textContent = get() ? 'ON' : 'OFF';
          g.savePrefs();
          self.applyPrefs();
        };
        row.appendChild(btn);
        list.appendChild(row);
      }

      function choiceRow(label, desc, options, get, set) {
        var row = el('div', 'settings-row');
        var txt = el('div', 'ach-txt');
        txt.appendChild(el('div', 'ach-name', label));
        txt.appendChild(el('div', 'ach-desc', desc));
        row.appendChild(txt);
        var btn = el('button', 'btn btn-ghost', get().toUpperCase());
        var change = function (dir) {
          var i = options.indexOf(get());
          set(options[(i + dir + options.length) % options.length]);
          btn.textContent = get().toUpperCase();
          g.savePrefs();
          self.applyPrefs();
        };
        btn.onclick = function () { change(1); };
        btn._reverse = function () { change(-1); }; // h / ArrowLeft cycles back
        row.appendChild(btn);
        list.appendChild(row);
      }

      toggleRow('Sound effects', 'Keystroke ticks, chimes, duel hits.',
        function () { return g.prefs.sfx; }, function (v) { g.prefs.sfx = v; });
      toggleRow('Music', 'Ambient synthwave, generated live.',
        function () { return g.prefs.music; }, function (v) { g.prefs.music = v; });
      toggleRow('Reduced motion', 'Disables pulsing, glow and slide animations.',
        function () { return g.prefs.reducedMotion; }, function (v) { g.prefs.reducedMotion = v; });
      choiceRow('Terminal font size', 'Buffer text size in drills.',
        ['small', 'medium', 'large'],
        function () { return g.prefs.termFont; }, function (v) { g.prefs.termFont = v; });
      toggleRow('Medal letters', 'Adds G/S/B labels beside medals (color-assist).',
        function () { return g.prefs.colorAssist; }, function (v) { g.prefs.colorAssist = v; });
      choiceRow('Duel difficulty', 'Assist halves damage. Blitz adds round timers.',
        ['assist', 'normal', 'blitz'],
        function () { return g.prefs.duelMode; }, function (v) { g.prefs.duelMode = v; });

      var fsRow = el('div', 'settings-row');
      var fsTxt = el('div', 'ach-txt');
      fsTxt.appendChild(el('div', 'ach-name', 'Fullscreen (f)'));
      fsTxt.appendChild(el('div', 'ach-desc',
        'In Chrome/Edge, Esc stays in the game while fullscreen (hold Esc to leave). q always works as back.'));
      fsRow.appendChild(fsTxt);
      var fsBtn = el('button', 'btn btn-ghost', document.fullscreenElement ? 'EXIT' : 'ENTER');
      fsBtn.onclick = function () {
        self.toggleFullscreen();
        setTimeout(function () {
          fsBtn.textContent = document.fullscreenElement ? 'EXIT' : 'ENTER';
        }, 300);
      };
      fsRow.appendChild(fsBtn);
      list.appendChild(fsRow);

      panel.appendChild(list);

      var danger = el('div', 'settings-row');
      var dtxt = el('div', 'ach-txt');
      dtxt.appendChild(el('div', 'ach-name', 'Reset this save slot'));
      dtxt.appendChild(el('div', 'ach-desc', 'Erases slot ' + g.slot + ' progress. Cannot be undone.'));
      danger.appendChild(dtxt);
      var resetBtn = el('button', 'btn btn-ghost btn-danger', 'RESET');
      resetBtn.onclick = function () {
        if (confirm('Erase all progress in slot ' + g.slot + '?')) {
          g.reset();
          cleanup();
          self.showTitle();
        }
      };
      danger.appendChild(resetBtn);
      panel.appendChild(danger);

      panel.appendChild(el('div', 'nav-hint overlay-hint',
        'j / k move  ·  l / ENTER change  ·  h change back  ·  q / Esc / Ctrl-P close'));
      var close = el('button', 'btn btn-primary', 'CLOSE (Esc)');
      var cleanup = this.escClosable(ov);
      close.onclick = cleanup;
      panel.appendChild(close);
      ov.appendChild(panel);
      ov.onclick = function (e) { if (e.target === ov) cleanup(); };
      this.root.appendChild(ov);
    },

    /* ============== stats ============== */

    showStats: function () {
      var self = this;
      var g = this.game;
      var ov = el('div', 'overlay');
      var panel = el('div', 'ach-panel panel stats-panel');
      panel.appendChild(el('h2', 'ach-title', 'TRAINING STATS'));

      var totals = g.totals();
      var duelsWon = Object.keys(g.save.duels).length;
      var mins = Math.round(g.save.stats.ms / 60000);
      var grid = el('div', 'stats-grid');
      [
        ['🥇 ' + totals.golds + '/' + totals.drillsTotal, 'gold medals'],
        [String(totals.drillsDone), 'drills complete'],
        [String(duelsWon), 'duels won'],
        [g.save.stats.keys.toLocaleString(), 'keystrokes'],
        [mins + 'm', 'time in the buffer'],
        [String(g.save.stats.dailies), 'daily sessions']
      ].forEach(function (pair) {
        var cell = el('div', 'stats-cell');
        cell.appendChild(el('div', 'stats-num', pair[0]));
        cell.appendChild(el('div', 'ach-desc', pair[1]));
        grid.appendChild(cell);
      });
      panel.appendChild(grid);

      var ranked = g.rankedCommands();
      if (ranked.length >= 3) {
        panel.appendChild(el('div', 'col-label', 'NEEDS WORK'));
        var weak = el('div', 'cmd-row-list');
        ranked.slice(0, 5).forEach(function (r) {
          var row = el('div', 'cmd-row');
          row.appendChild(el('code', 'tech-keys', r.cmd));
          row.appendChild(el('span', 'ach-desc',
            Math.round((r.avg - 1) * 100) + '% over par on average'));
          weak.appendChild(row);
        });
        panel.appendChild(weak);

        panel.appendChild(el('div', 'col-label', 'SHARPEST'));
        var strong = el('div', 'cmd-row-list');
        ranked.slice(-3).reverse().forEach(function (r) {
          var row = el('div', 'cmd-row');
          row.appendChild(el('code', 'tech-keys', r.cmd));
          row.appendChild(el('span', 'ach-desc',
            r.avg <= 1.001 ? 'at par — perfect form' :
            Math.round((r.avg - 1) * 100) + '% over par'));
          strong.appendChild(row);
        });
        panel.appendChild(strong);
        panel.appendChild(el('p', 'ach-desc',
          'DAILY TRAINING automatically targets what needs work.'));
      } else {
        panel.appendChild(el('p', 'ach-desc',
          'Complete a few drills and your strongest and weakest commands will show up here.'));
      }

      var close = el('button', 'btn btn-primary', 'CLOSE (Esc)');
      var cleanup = this.escClosable(ov);
      close.onclick = cleanup;
      panel.appendChild(close);
      ov.appendChild(panel);
      ov.onclick = function (e) { if (e.target === ov) cleanup(); };
      this.root.appendChild(ov);
    },

    /* ============== cheat sheet ============== */

    showCheatSheet: function () {
      if (document.getElementById('cheat-overlay')) return;
      var self = this;
      var ov = el('div', 'overlay');
      ov.id = 'cheat-overlay';
      var panel = el('div', 'ach-panel panel cheat-panel');
      panel.appendChild(el('h2', 'ach-title', 'TECHNIQUES LEARNED'));

      // global keys first — these work everywhere
      panel.appendChild(el('div', 'col-label cheat-belt', 'GLOBAL KEYS'));
      var globalTbl = el('div', 'tech-table');
      [
        ['Esc · q · Ctrl-[ · Ctrl-P', 'back / close, everywhere'],
        ['Ctrl-Q', 'leave a drill, forfeit a duel'],
        ['F1  ·  ?', 'this cheat sheet'],
        ['j k · h l', 'move and adjust in every menu'],
        ['c', 'continue training (from the dojo)'],
        ['f', 'fullscreen (menu screens)']
      ].forEach(function (pair) {
        var row = el('div', 'tech-row');
        row.appendChild(el('code', 'tech-keys', pair[0]));
        row.appendChild(el('span', 'tech-desc', pair[1]));
        globalTbl.appendChild(row);
      });
      panel.appendChild(globalTbl);

      var any = false;
      for (var i = 0; i < this.cur.TRACKS.length; i++) {
        if (!this.game.trackUnlocked(i)) break;
        any = true;
        var track = this.cur.TRACKS[i];
        var beltMeta = this.beltMeta(track.belt);
        var label = el('div', 'col-label cheat-belt', beltMeta.name.toUpperCase() + ' — ' + track.title);
        label.style.color = beltMeta.color;
        panel.appendChild(label);
        var tbl = el('div', 'tech-table');
        track.lesson.techniques.forEach(function (t) {
          var row = el('div', 'tech-row');
          row.appendChild(el('code', 'tech-keys', t.keys));
          row.appendChild(el('span', 'tech-desc', t.desc));
          tbl.appendChild(row);
        });
        panel.appendChild(tbl);
      }
      if (!any) panel.appendChild(el('p', 'ach-desc', 'Your training has not begun.'));
      panel.appendChild(el('div', 'nav-hint overlay-hint',
        'j / k scroll  ·  Ctrl-d / Ctrl-u half page  ·  q / Esc / Ctrl-P close'));
      var close = el('button', 'btn btn-primary', 'CLOSE (Esc)');
      var cleanup = this.escClosable(ov);
      close.onclick = cleanup;
      panel.appendChild(close);
      ov.appendChild(panel);
      ov.onclick = function (e) { if (e.target === ov) cleanup(); };
      this.root.appendChild(ov);
    },

    /* ============== save slots ============== */

    showSlots: function () {
      var self = this;
      var ov = el('div', 'overlay');
      var panel = el('div', 'ach-panel panel');
      panel.appendChild(el('h2', 'ach-title', 'SAVE SLOTS'));
      var list = el('div', 'ach-list');
      this.game.listSlots().forEach(function (slot) {
        var row = el('div', 'settings-row slot-row' + (slot.active ? ' active-slot' : ''));
        var txt = el('div', 'ach-txt');
        var label = 'SLOT ' + slot.id + (slot.active ? '  ·  active' : '');
        txt.appendChild(el('div', 'ach-name', label));
        if (slot.exists && slot.meta) {
          var beltName = slot.meta.belt >= 0
            ? self.beltMeta(self.cur.TRACKS[slot.meta.belt].belt).name : 'Novice';
          txt.appendChild(el('div', 'ach-desc',
            (slot.meta.name || 'unnamed student') + '  ·  ' + beltName +
            '  ·  🥇 ' + slot.meta.golds + (slot.meta.complete ? '  ·  ⛩ complete' : '')));
        } else if (slot.exists) {
          txt.appendChild(el('div', 'ach-desc', 'training in progress'));
        } else {
          txt.appendChild(el('div', 'ach-desc', 'empty — a fresh student'));
        }
        row.appendChild(txt);
        var btns = el('div', 'slot-btns');
        if (!slot.active) {
          var use = el('button', 'btn btn-primary', slot.exists ? 'LOAD' : 'START');
          use.onclick = function () {
            self.game.setActiveSlot(slot.id);
            location.reload();
          };
          btns.appendChild(use);
        }
        if (slot.exists) {
          var del = el('button', 'btn btn-ghost btn-danger', 'DELETE');
          del.onclick = function () {
            if (confirm('Delete slot ' + slot.id + '? This cannot be undone.')) {
              self.game.deleteSlot(slot.id);
              cleanup();
              self.showSlots();
            }
          };
          btns.appendChild(del);
        }
        row.appendChild(btns);
        list.appendChild(row);
      });
      panel.appendChild(list);
      var close = el('button', 'btn btn-primary', 'CLOSE (Esc)');
      var cleanup = this.escClosable(ov);
      close.onclick = cleanup;
      panel.appendChild(close);
      ov.appendChild(panel);
      ov.onclick = function (e) { if (e.target === ov) cleanup(); };
      this.root.appendChild(ov);
    },

    /* ============== toasts ============== */

    flushToasts: function () {
      var toasts = this.game.takeToasts();
      if (!toasts.length) return;
      var holder = document.getElementById('toast-holder');
      if (!holder) {
        holder = el('div', null);
        holder.id = 'toast-holder';
        document.body.appendChild(holder);
      }
      toasts.forEach(function (t, i) {
        setTimeout(function () {
          var toast = el('div', 'toast');
          toast.appendChild(el('div', 'toast-head', '★ ACHIEVEMENT'));
          toast.appendChild(el('div', 'toast-name', t.name));
          toast.appendChild(el('div', 'toast-desc', t.desc));
          holder.appendChild(toast);
          Audio.checkpoint();
          setTimeout(function () { toast.classList.add('out'); }, 3600);
          setTimeout(function () { toast.remove(); }, 4200);
        }, i * 600);
      });
    }
  };

  window.VimDojoUI = UI;
  window.dojoAudio = Audio; // exposed for diagnostics (harmless in prod)
})();
