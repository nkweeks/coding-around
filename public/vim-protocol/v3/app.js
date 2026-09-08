/* Application orchestration: navigation, input ownership, exercise and modal lifecycle. */
(function () {
  "use strict";
  const P = window.VP,
    C = window.CURRICULUM,
    E = P.escape,
    B = P.button,
    I = P.icon;
  const root = document.getElementById("app");
  const app = {
    game: new window.Game(C),
    page: "training",
    trackIndex: 0,
    session: null,
    kind: "drill",
    daily: null,
    duel: null,
    guideQuery: "",
    timer: null,
    replayTimer: null,
  };
  let returnFocus = null,
    toastTimer = null,
    pausedAt = 0;
  const announce = (text) => {
    document.getElementById("announcer").textContent = text;
  };
  function notice(text) {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = text;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      t.hidden = true;
    }, 4500);
  }
  function applyPrefs() {
    document.documentElement.dataset.motion = app.game.prefs.reducedMotion
      ? "reduced"
      : "normal";
    document.documentElement.dataset.font = app.game.prefs.termFont;
  }
  function render(focus = true) {
    clearInterval(app.timer);
    app.timer = null;
    applyPrefs();
    root.innerHTML = P.shell(
      app,
      app.page === "exercise" ? P.exercise(app) : P.views[app.page](app),
    );
    document.title = `${app.page === "exercise" ? P.title(app.session.drill.name) : "VIM Protocol 3"} — ${app.page === "exercise" ? "VIM Protocol" : "Make every keystroke count"}`;
    if (focus) {
      if (app.page === "exercise")
        document.getElementById("terminal").focus({ preventScroll: true });
      else document.getElementById("main").focus({ preventScroll: true });
    }
    if (app.page === "exercise") {
      P.updateEditor(app);
      if (app.duel && app.game.prefs.duelMode === "blitz")
        app.timer = setInterval(() => {
          if (document.hidden || document.getElementById("dialog").open) return;
          const remaining = Math.max(
            0,
            45 - Math.floor((Date.now() - app.session.startedAt) / 1000),
          );
          const clock = document.getElementById("duel-clock");
          if (clock) clock.textContent = `${remaining}s remaining`;
          if (remaining === 0)
            finishDuel(
              false,
              "The round timer ran out. Try Assist or Normal for untimed duels.",
            );
        }, 250);
    }
  }
  function route(value) {
    if (value === "main") return;
    if (app.page === "exercise" && app.session) saveTime();
    clearInterval(app.replayTimer);
    pausedAt = 0;
    const parts = value.split("/");
    app.page = parts[0] || "training";
    if (app.page === "course") {
      const index = Number(parts[1]);
      app.trackIndex =
        Number.isInteger(index) && index >= 0 && index < C.TRACKS.length
          ? index
          : 0;
    }
    if (!Object.hasOwn(P.views, app.page)) app.page = "training";
    app.duel = null;
    app.daily = null;
    app.session = null;
    render();
    window.scrollTo(0, 0);
  }
  function go(page) {
    if (location.hash.slice(1) === page) route(page);
    else location.hash = page;
  }
  function saveTime() {
    if (!app.session || app.session.timeFinalized) return;
    const now = pausedAt || Date.now();
    app.game.save.stats.ms += Math.max(0, now - app.session.startedAt);
    app.session.startedAt = Date.now();
    if (pausedAt) pausedAt = Date.now();
    app.game.persist();
  }
  function begin(ti, d, kind = "drill") {
    if (app.page === "exercise" && app.session) saveTime();
    clearInterval(app.replayTimer);
    app.replayTimer = null;
    pausedAt = 0;
    if (kind === "drill" && !app.game.trackUnlocked(ti)) {
      notice("Complete the previous course and duel first.");
      return;
    }
    app.trackIndex = ti;
    app.kind = kind;
    app.session = new window.TrainingSession(d);
    app.page = "exercise";
    if (kind === "drill") app.game.noteAttempt(d.id);
    render();
    window.scrollTo(0, 0);
  }
  function continueTraining() {
    const next = app.game.nextUp();
    if (!next) {
      go("progress");
      return;
    }
    go(`course/${next.trackIndex}`);
  }
  function daily(items) {
    app.duel = null;
    app.daily = { items: items || app.game.dailySet(), index: 0 };
    const first = app.daily.items[0];
    begin(first.trackIndex, first.drill);
  }
  function duel(ti, final = false) {
    const t = C.TRACKS[ti];
    if (
      !app.game.trackUnlocked(ti) ||
      app.game.trackProgress(t).done !== t.drills.length ||
      (final && !app.game.save.duels[t.duel.id])
    )
      return;
    const data = final ? t.finalDuel : t.duel;
    if (!data) return;
    app.daily = null;
    app.duel = { data, round: 0, hp: 100, startHp: 100, damage: 0, ti, final };
    begin(ti, data.rounds[0], "duel");
  }
  function sound(frequency = 880) {
    if (!app.game.prefs.sfx) return;
    try {
      if (!app.audio)
        app.audio = new (window.AudioContext || window.webkitAudioContext)();
      app.audio.resume().catch(() => {});
      const oscillator = app.audio.createOscillator(),
        gain = app.audio.createGain();
      oscillator.connect(gain);
      gain.connect(app.audio.destination);
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.04, app.audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        app.audio.currentTime + 0.15,
      );
      oscillator.start();
      oscillator.stop(app.audio.currentTime + 0.16);
    } catch {
      /* Sound is optional; unavailable audio never blocks play. */
    }
  }
  function feed(token) {
    if (
      app.page !== "exercise" ||
      !app.session ||
      document.getElementById("dialog").open ||
      app.session.complete
    )
      return;
    if (app.session.engine.quit) {
      notice("The editor is closed. Restart to open it again.");
      return;
    }
    if (app.session.keys.length >= 20000) {
      notice(
        "This run reached 20,000 keys. Restart to keep the terminal responsive.",
      );
      return;
    }
    const previous = app.session.stop;
    app.session.key(token);
    app.game.save.stats.keys++;
    P.updateEditor(app);
    if (previous < app.session.stop) {
      sound(660);
      announce(
        `Checkpoint ${app.session.stop} of ${app.session.drill.stops.length}`,
      );
    }
    if (app.duel) {
      const damage =
        Math.max(0, app.session.keys.length - app.session.drill.par) *
        (app.game.prefs.duelMode === "assist" ? 1 : 2);
      app.duel.hp = Math.max(0, app.duel.startHp - damage);
      document.getElementById("duel-hp").textContent = `${app.duel.hp} HP`;
      if (app.duel.hp === 0) {
        finishDuel(
          false,
          "Your energy ran out. Review the course, then try again.",
        );
        return;
      }
    }
    if (app.session.complete) completeExercise();
  }
  function modal(title, html, options = {}) {
    clearInterval(app.replayTimer);
    app.replayTimer = null;
    const dialog = document.getElementById("dialog");
    if (!dialog.open) {
      returnFocus = document.activeElement;
    }
    dialog.innerHTML = `<div class="dialog-heading"><h2 id="dialog-title">${E(title)}</h2>${B(I("close"), "close-modal", 'class="icon-button" aria-label="Close dialog"')}</div>${html}`;
    dialog.dataset.result = options.result ? "true" : "";
    if (!dialog.open) dialog.showModal();
    updatePauseState();
    (
      dialog.querySelector("button.primary,input,button:not(.icon-button)") ||
      dialog.querySelector(".icon-button")
    )?.focus();
  }
  function closeModal() {
    const d = document.getElementById("dialog");
    clearInterval(app.replayTimer);
    app.replayTimer = null;
    if (d.open) d.close();
    updatePauseState();
    if (d.dataset.result === "true" && app.session?.complete) {
      if (app.kind === "duel") {
        app.duel = null;
        app.daily = null;
        go(`course/${app.trackIndex}`);
        return;
      }
      app.daily = null;
      go(`course/${app.trackIndex}`);
      return;
    }
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
  }
  function completeExercise() {
    saveTime();
    app.session.timeFinalized = true;
    clearInterval(app.timer);
    sound(1046);
    if (app.duel) {
      app.duel.damage += app.duel.startHp - app.duel.hp;
      if (app.duel.round === app.duel.data.rounds.length - 1) {
        finishDuel(true);
        return;
      }
      modal(
        "Round complete.",
        `<p>Clean edit. ${app.duel.hp} HP remaining.</p><p class="muted">${app.session.keys.length} keystrokes · reference ${app.session.drill.par}</p>${B(`Next round${I("arrow")}`, "duel-next", 'class="primary"')}`,
        { result: true },
      );
      return;
    }
    const s = app.session,
      d = s.drill;
    const medal = app.game.recordDrill(d, s.keys.length, d.par, s.keys);
    announce(`${P.title(d.name)} complete. ${medal} medal.`);
    const dailyLast =
      app.daily && app.daily.index === app.daily.items.length - 1;
    if (dailyLast) app.game.recordDaily();
    modal(
      dailyLast
        ? "Practice complete."
        : medal === "gold"
          ? "No wasted motion."
          : "One step closer.",
      `<div class="result-medal ${medal}">${I("medal")}<span>${P.title(medal)} medal</span></div><p>You completed <strong>${E(P.title(d.name))}</strong>.</p><div class="result-stats"><div><strong>${s.keys.length}</strong><span>Your keystrokes</span></div><div><strong>${d.par}</strong><span>Reference</span></div><div><strong>${app.game.drillState(d.id).best}</strong><span>Personal best</span></div></div><p class="muted small">Gold: ${d.par} keys or fewer · Silver: up to ${Math.ceil(d.par * 1.6)} · Bronze: complete the objective.</p><div class="actions">${B(`Continue${I("arrow")}`, "next", 'class="primary"')}${B("Try again", "retry", 'class="secondary"')}${B(`${I("play")}Study a solution`, "solution", 'class="secondary"')}</div>`,
      { result: true },
    );
  }
  function finishDuel(won, reason = "") {
    clearInterval(app.timer);
    saveTime();
    app.session.timeFinalized = true;
    const duel = app.duel;
    if (!duel) return;
    app.session.complete = true;
    if (won) app.game.recordDuelWin(duel.data.id, duel.damage > 0);
    const complete = app.game.trackComplete(C.TRACKS[app.trackIndex]);
    modal(
      won ? "The form is yours." : "Breathe. Reset. Try again.",
      `<img class="result-portrait" src="v3/assets/${duel.data.opponent}.jpeg" alt="${duel.data.opponent.toUpperCase()}"><p>${E(won ? duel.data.winText : reason)}</p>${won && complete ? `<p class="success">${P.belt(app.trackIndex)} earned${app.trackIndex < 7 ? " · Next course unlocked." : "."}</p>` : ""}<div class="actions">${B(won ? "Continue training" : "Try duel again", won ? "duel-done" : "duel-retry", 'class="primary"')}${B("Back to course", "result-course", 'class="secondary"')}</div>`,
      { result: true },
    );
  }
  function next() {
    const d = app.session.drill;
    if (app.daily) {
      if (++app.daily.index < app.daily.items.length) {
        const next = app.daily.items[app.daily.index];
        begin(next.trackIndex, next.drill);
        return;
      }
      app.daily = null;
      go("practice");
      return;
    }
    const t = C.TRACKS[app.trackIndex],
      idx = t.drills.findIndex((x) => x.id === d.id);
    if (idx >= 0 && idx < t.drills.length - 1)
      begin(app.trackIndex, t.drills[idx + 1]);
    else go(`course/${app.trackIndex}`);
  }
  function replay(source = "reference") {
    const d = app.session.drill;
    const saved = app.game.drillState(d.id)?.bestKeys;
    const tokens =
      source === "best" && saved?.length ? saved : C.parseKeys(d.sol);
    app.replay = { session: new window.TrainingSession(d), tokens, index: 0 };
    modal(
      "Study the form.",
      `<p>Watch the buffer change one keystroke at a time. Playback never changes your score.</p><div class="actions">${B("Reference solution", "replay-reference", `class="${source === "reference" ? "primary" : "secondary"}"`)}${B("Your best run", "replay-best", `class="${source === "best" ? "primary" : "secondary"}" ${saved?.length ? "" : "disabled"}`)}</div><div class="replay-terminal" id="replay-buffer">${P.bufferHTML(app.replay.session)}</div><div class="replay-info"><span id="replay-position">0 / ${tokens.length}</span><span id="replay-mode">${d.shell ? "SHELL" : "NORMAL"}</span><kbd id="replay-key">Ready</kbd></div><div class="actions">${B(`${I("play")}Play`, "replay-play", 'class="primary" id="replay-play"')}${B("Step", "replay-step", 'class="secondary"')}${B("Start over", `replay-${source}`, 'class="secondary"')}${B("Try it now", "retry", 'class="secondary"')}</div>`,
      { result: true },
    );
  }
  function replayStep() {
    const r = app.replay;
    if (!r || r.index >= r.tokens.length) {
      clearInterval(app.replayTimer);
      app.replayTimer = null;
      return;
    }
    const token = r.tokens[r.index++];
    r.session.key(token);
    document.getElementById("replay-buffer").innerHTML = P.bufferHTML(
      r.session,
    );
    document.getElementById("replay-position").textContent =
      `${r.index} / ${r.tokens.length}`;
    document.getElementById("replay-key").textContent = P.keyLabel(token);
    document.getElementById("replay-mode").textContent = r.session.shell
      ? "SHELL"
      : r.session.engine.mode;
    if (r.index === r.tokens.length) {
      clearInterval(app.replayTimer);
      app.replayTimer = null;
      document.getElementById("replay-play").textContent = "Finished";
    }
  }
  function profiles() {
    modal(
      "Your local profiles.",
      `<p>Each operator has separate progress. Switching profiles saves your current progress.</p><div class="profile-list">${[1, 2, 3].map((id) => B(`<span class="avatar">0${id}</span><span>Operator 0${id}<small>${id === app.game.slot ? "Active profile" : "Open profile"}</small></span>${I(id === app.game.slot ? "check" : "arrow")}`, `profile:${id}`, 'class="profile-option"')).join("")}</div>`,
    );
  }
  function download(data, type, name) {
    const url = URL.createObjectURL(new Blob([data], { type })),
      a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function certificate() {
    if (!app.game.gameComplete()) return;
    const canvas = document.createElement("canvas");
    canvas.width = 1600;
    canvas.height = 1100;
    const c = canvas.getContext("2d");
    c.fillStyle = "#101413";
    c.fillRect(0, 0, 1600, 1100);
    c.strokeStyle = "#627546";
    c.lineWidth = 2;
    c.strokeRect(45, 45, 1510, 1010);
    c.textAlign = "center";
    c.fillStyle = "#c5f47b";
    c.font = "24px monospace";
    c.fillText("VIM PROTOCOL / 3", 800, 150);
    c.fillStyle = "#eef0e7";
    c.font = "60px Georgia";
    c.fillText("Certificate of Mastery", 800, 300);
    c.font = "22px sans-serif";
    c.fillStyle = "#aab5a8";
    c.fillText("Presented to", 800, 395);
    c.fillStyle = "#eef0e7";
    c.font = "48px Georgia";
    c.fillText(
      app.game.save.playerName || `Operator 0${app.game.slot}`,
      800,
      480,
      1380,
    );
    c.font = "26px sans-serif";
    c.fillText("Eight courses. Every duel. One fluent way to edit.", 800, 580);
    c.fillStyle = "#c5f47b";
    c.font = "30px monospace";
    c.fillText(
      app.game.allGold() ? "PERFECT FORM / ALL GOLD" : "BLACK BELT / COMPLETE",
      800,
      695,
    );
    c.fillStyle = "#aab5a8";
    c.font = "22px sans-serif";
    const totals = app.game.totals();
    c.fillText(
      `${totals.golds} gold medals across ${totals.drillsTotal} exercises`,
      800,
      760,
    );
    c.font = "20px monospace";
    c.fillText(
      new Date().toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      800,
      940,
    );
    canvas.toBlob((blob) => {
      if (blob) download(blob, "image/png", "vim-protocol-3-mastery.png");
    }, "image/png");
  }
  function action(name, element) {
    const [command, a, b] = name.split(":");
    if (command === "nav") {
      go(a);
      return;
    }
    if (command === "course") {
      go(`course/${a}`);
      return;
    }
    if (command === "drill") {
      app.daily = null;
      app.duel = null;
      begin(+a, C.TRACKS[+a].drills[+b]);
      return;
    }
    if (command === "duel" || command === "finalduel") {
      duel(+a, command === "finalduel");
      return;
    }
    if (command === "profile") {
      if (app.session) saveTime();
      app.game.setActiveSlot(+a);
      go("training");
      return;
    }
    if (command === "story") {
      const story = window.STORY.SCENES[+a];
      if (story.trigger > app.game.beltLevel()) return;
      app.game.markScene(story.id);
      modal(
        P.title(story.title),
        `<div class="story-lines">${story.lines.map((line) => `<p><strong>${E(line.who === "narrator" ? "The dojo" : line.who.toUpperCase())}</strong>${E(line.text)}</p>`).join("")}</div>${B("Back to archive", "close-modal", 'class="primary"')}`,
      );
      return;
    }
    switch (command) {
      case "continue":
        continueTraining();
        break;
      case "daily":
        daily();
        break;
      case "daily-selected":
        daily(app.practiceSet);
        break;
      case "sandbox":
        app.daily = null;
        app.duel = null;
        begin(
          0,
          {
            id: "sandbox",
            name: "Sandbox",
            type: "sandbox",
            file: "sandbox.txt",
            start: [
              "// a space to find your flow",
              "",
              'const message = "hello, world";',
              "",
              '// Try ci" to change the words inside quotes.',
              "// Try dd, p, u, and Ctrl R.",
              "// Press F1 for the field guide.",
            ],
          },
          "sandbox",
        );
        break;
      case "leave-exercise":
        go(app.kind === "sandbox" ? "practice" : `course/${app.trackIndex}`);
        break;
      case "restart":
      case "retry":
        if (app.duel) {
          const d = app.duel;
          duel(d.ti, d.final);
        } else begin(app.trackIndex, app.session.drill, app.kind);
        break;
      case "hint":
        modal(
          "A nudge in the right direction.",
          `<p>${E(app.session.drill.brief)}</p><h3>Try these commands</h3><code class="tool-keys">${E(app.session.drill.keys)}</code><p>Use the field guide for explanations. There is no hint penalty.</p>${B("Back to terminal", "close-modal", 'class="primary"')}`,
        );
        break;
      case "guide-modal":
        modal(
          "Field guide",
          `<label class="search-field"><span class="sr-only">Search commands in guide</span><input id="modal-guide-search" type="search" placeholder="Find a command or an action"></label><div id="modal-guide-results">${P.guideRows("")}</div>`,
        );
        break;
      case "help":
        modal(
          "Your keyboard, your workspace.",
          `<dl class="help-list"><dt><kbd>Tab</kbd> / <kbd>Shift Tab</kbd></dt><dd>Move between controls; Enter activates a focused control.</dd><dt><kbd>F1</kbd></dt><dd>Open the field guide, including during a drill.</dd><dt><kbd>Esc</kbd></dt><dd>Leave Insert / Visual mode, or close a dialog. Escape never abandons a drill.</dd><dt><kbd>Ctrl Q</kbd></dt><dd>Leave the current exercise. On Mac, use Control, not Command.</dd><dt><kbd>j</kbd> / <kbd>k</kbd></dt><dd>Move through menu controls. Inside the terminal, these are Vim motions.</dd></dl><p class="muted">Only the focused terminal captures Vim keys. Native inputs, browser shortcuts, and Tab navigation continue to work.</p>`,
        );
        break;
      case "close-modal":
        closeModal();
        break;
      case "next":
        next();
        break;
      case "result-course":
        go(`course/${app.trackIndex}`);
        break;
      case "duel-retry": {
        const d = app.duel;
        duel(d.ti, d.final);
        break;
      }
      case "duel-next":
        app.duel.round++;
        app.duel.startHp = app.duel.hp;
        begin(app.trackIndex, app.duel.data.rounds[app.duel.round], "duel");
        break;
      case "duel-done": {
        const next = app.game.nextUp();
        go(next ? `course/${next.trackIndex}` : "progress");
        break;
      }
      case "solution":
      case "replay-reference":
        replay();
        break;
      case "replay-best":
        replay("best");
        break;
      case "replay-step":
        clearInterval(app.replayTimer);
        app.replayTimer = null;
        replayStep();
        break;
      case "replay-play":
        if (app.replayTimer) {
          clearInterval(app.replayTimer);
          app.replayTimer = null;
          element.innerHTML = I("play") + "Play";
        } else if (app.replay.index < app.replay.tokens.length) {
          element.innerHTML = I("pause") + "Pause";
          app.replayTimer = setInterval(replayStep, 260);
        }
        break;
      case "profiles":
        profiles();
        break;
      case "save-settings": {
        const data = new FormData(document.getElementById("settings-form"));
        app.game.save.playerName = String(data.get("playerName") || "")
          .trim()
          .slice(0, 40);
        Object.assign(app.game.prefs, {
          termFont: data.get("termFont"),
          duelMode: data.get("duelMode"),
          sfx: data.has("sfx"),
          reducedMotion: data.has("reducedMotion"),
        });
        app.game.savePrefs();
        app.game.persist();
        render(false);
        notice(app.game.storageWarning || "Preferences saved.");
        break;
      }
      case "export":
        download(
          app.game.exportSave(),
          "application/json",
          `vim-protocol-3-profile-${app.game.slot}.json`,
        );
        break;
      case "import-confirm":
        try {
          app.game.importSave(app.pendingImport);
          app.pendingImport = null;
          render();
          notice(
            app.game.storageWarning ||
              "Progress imported. A recovery copy of your previous profile is saved.",
          );
        } catch (e) {
          notice(e.message);
        }
        break;
      case "recover":
        try {
          const raw = app.game.recoverySave
            ? JSON.stringify(app.game.recoverySave)
            : localStorage.getItem(
                `vim-protocol-v3-save-s${app.game.slot}-before-import`,
              );
          if (!raw) {
            notice(
              "No pre-import recovery copy is available for this profile.",
            );
            break;
          }
          const save = JSON.parse(raw);
          app.game.importSave(
            JSON.stringify({ app: "vim-protocol", version: 3, save }),
          );
          render();
          notice("Previous profile restored.");
        } catch {
          notice(
            "The recovery copy could not be read. Your active profile was not changed.",
          );
        }
        break;
      case "certificate":
        certificate();
        break;
      case "key":
        feed(element.dataset.key);
        break;
      case "send-text": {
        const input = document.getElementById("touch-input");
        const value = input.value;
        input.value = "";
        for (const char of value) feed(char);
        break;
      }
    }
  }
  root.addEventListener("click", (event) => {
    const target = event.target.closest("[data-action]");
    if (target && !target.disabled) {
      event.preventDefault();
      action(target.dataset.action, target);
    }
  });
  root.addEventListener("input", (event) => {
    if (event.target.id === "guide-search") {
      app.guideQuery = event.target.value;
      document.getElementById("guide-results").innerHTML = P.guideRows(
        app.guideQuery,
      );
    }
    if (event.target.id === "modal-guide-search")
      document.getElementById("modal-guide-results").innerHTML = P.guideRows(
        event.target.value,
      );
  });
  root.addEventListener("submit", (event) => {
    event.preventDefault();
    if (event.target.id === "settings-form") action("save-settings");
  });
  root.addEventListener("change", async (event) => {
    if (event.target.id !== "import-file") return;
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 2000000) {
      notice("Choose a backup smaller than 2 MB.");
      return;
    }
    try {
      const text = await file.text(),
        data = JSON.parse(text);
      if (
        data.app !== "vim-protocol" ||
        data.version !== 3 ||
        data.save?.ver !== 3
      )
        throw new Error("Choose a VIM Protocol 3 progress backup.");
      app.pendingImport = text;
      modal(
        "Import this progress?",
        `<p>This will replace Operator 0${app.game.slot} with <strong>${E(data.save.playerName || "the imported profile")}</strong>. A recovery copy of the current profile is saved first.</p><div class="actions">${B("Import progress", "import-confirm", 'class="primary"')}${B("Cancel", "close-modal", 'class="secondary"')}</div>`,
      );
    } catch {
      notice(
        "This file is not a valid VIM Protocol 3 backup. Your progress was not changed.",
      );
    }
  });
  root.addEventListener(
    "cancel",
    (event) => {
      event.preventDefault();
      closeModal();
    },
    true,
  );
  document.addEventListener("keydown", (event) => {
    if (event.isComposing) return;
    const dialog = document.getElementById("dialog"),
      input = event.target.closest("input,textarea,select");
    if (event.key === "F1") {
      event.preventDefault();
      if (!dialog?.open) action("guide-modal");
      return;
    }
    if (dialog?.open) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeModal();
      }
      return;
    }
    if (input) {
      if (event.target.id === "touch-input" && event.key === "Enter") {
        event.preventDefault();
        action("send-text");
      }
      return;
    }
    if (app.page === "exercise") {
      if (event.ctrlKey && !event.metaKey && event.key.toLowerCase() === "q") {
        event.preventDefault();
        action("leave-exercise");
        return;
      }
      if (event.target.id !== "terminal") return;
      const key = window.VimInput.token(event, app.session.engine.mode);
      if (key) {
        event.preventDefault();
        feed(key);
      }
    } else if (
      (event.key === "j" || event.key === "k") &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey
    ) {
      event.preventDefault();
      const buttons = [
        ...root.querySelectorAll("button:not(:disabled),a,input,select"),
      ].filter((el) => el.getClientRects().length);
      const index = buttons.indexOf(document.activeElement),
        step = event.key === "j" ? 1 : -1;
      buttons[(index + step + buttons.length) % buttons.length]?.focus();
    }
  });
  function updatePauseState() {
    if (!app.session || app.session.timeFinalized) {
      pausedAt = 0;
      return;
    }
    const paused = document.hidden || document.getElementById("dialog").open;
    if (paused && !pausedAt) pausedAt = Date.now();
    else if (!paused && pausedAt) {
      app.session.startedAt += Date.now() - pausedAt;
      pausedAt = 0;
    }
  }
  document.addEventListener("visibilitychange", () => {
    updatePauseState();
    if (document.hidden && app.session) app.game.persist();
  });
  window.addEventListener("pagehide", () => {
    if (app.session) saveTime();
  });
  document.querySelector(".skip-link").addEventListener("click", (event) => {
    event.preventDefault();
    document.getElementById("main").focus();
  });
  window.addEventListener("hashchange", () => route(location.hash.slice(1)));
  route(location.hash.slice(1));
})();
