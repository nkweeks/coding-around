(function () {
  "use strict";
  const P = window.VP,
    E = P.escape,
    I = P.icon,
    B = P.button;
  function selected(s, row, col) {
    const v = s.selection;
    if (!v) return false;
    if (v.linewise) return row >= v.lo && row <= v.hi;
    return (
      (row > v.start.row || (row === v.start.row && col >= v.start.col)) &&
      (row < v.end.row || (row === v.end.row && col < v.end.col))
    );
  }
  P.bufferHTML = (session) => {
    const s = session.engine.getState(),
      d = session.drill;
    if (session.shell)
      return `<div class="shell-prompt"><span>operator@dojo:~$ </span>${E(session.shellText)}<span class="cursor"> </span></div>`;
    const stop = d.stops?.[session.stop];
    return (
      s.lines
        .map((line, r) => {
          let chars = "";
          for (
            let c = 0;
            c < Math.max(line.length, s.row === r ? s.col + 1 : 1);
            c++
          ) {
            const cursor = s.row === r && s.col === c;
            const target = stop && stop[0] === r && stop[1] === c;
            const classes = [
              cursor ? "cursor" : "",
              target ? "checkpoint" : "",
              selected(s, r, c) ? "selection" : "",
            ]
              .filter(Boolean)
              .join(" ");
            chars += classes
              ? `<span class="${classes}"${target ? ' aria-label="Next checkpoint"' : ""}>${E(line[c] || " ")}</span>`
              : E(line[c] || " ");
          }
          return `<div class="code-line ${s.row === r ? "current-line" : ""}"><span class="line-number" aria-hidden="true">${r + 1}</span><span class="line-text">${chars}</span></div>`;
        })
        .join("") +
      Array.from(
        { length: Math.max(0, 9 - s.lines.length) },
        () => '<div class="empty-line" aria-hidden="true">~</div>',
      ).join("")
    );
  };
  P.objective = (app) => {
    const s = app.session,
      d = s.drill,
      e = s.engine;
    if (app.kind === "sandbox")
      return `<h2>A space to experiment.</h2><p>Move around, make changes, and undo them. Try commands from the field guide.</p><dl class="techniques"><dt><code>i</code></dt><dd>Enter Insert mode</dd><dt><code>Esc</code></dt><dd>Return to Normal mode</dd><dt><code>u / Ctrl R</code></dt><dd>Undo / redo</dd><dt><code>:w</code></dt><dd>Save the buffer in this session</dd></dl>`;
    if (d.shell)
      return `<h2>Your objective</h2><ol class="objective-steps"><li class="${!s.shell ? "done" : ""}"><strong>Open the file</strong><div><kbd>vim ${E(d.file)}</kbd><kbd>Enter</kbd></div></li><li><strong>Quit the editor</strong><div>${P.keys([":", "q", "<CR>"])}</div></li></ol><div class="lesson-divider"></div><h3>How it works</h3><p>Vim starts in Normal mode. Commands act on text. Type <code>:</code> to enter a command, then press Enter to run it.</p>`;
    if (d.type === "cursor") {
      const next = d.stops[s.stop];
      return `<h2>Your objective</h2><p>Visit the highlighted checkpoints in order. Keep the text unchanged.</p><div class="checkpoint-count">${s.stop} <span>/ ${d.stops.length}</span></div>${P.meter(s.stop, d.stops.length, "Checkpoints visited")}<p id="next-checkpoint">${next ? `Next: line ${next[0] + 1}, column ${next[1] + 1}` : "All checkpoints reached."}</p><div class="lesson-divider"></div><h3>Your tools</h3><code class="tool-keys">${E(d.keys)}</code><p>Use a number before a motion to repeat it. Arrow keys are available for accessibility; Vim keys build the habit.</p>${!e.equals(d.start) ? '<p class="warning">The text changed. Undo with u or restart to restore it.</p>' : ""}`;
    }
    const matches = d.target.filter((line, r) => line === e.lines[r]).length;
    return `<h2>Your objective</h2><p>${E(d.brief)}</p><h3 class="target-label">Target buffer</h3><pre class="target-buffer">${d.target.map((line, r) => `<span class="target-line ${e.lines[r] === line ? "matched" : ""}"><i>${r + 1}</i>${E(line) || " "}</span>`).join("")}</pre><p class="small muted">${matches} / ${d.target.length} lines match${d.requireExit ? " · Save / quit as instructed" : " · Finish in Normal mode"}</p><div class="lesson-divider"></div><h3>Your tools</h3><code class="tool-keys">${E(d.keys)}</code><p><kbd>Esc</kbd> returns to Normal mode. <kbd>u</kbd> undoes a change. You can always restart.</p>`;
  };
  P.exercise = (app) => {
    const d = app.session.drill,
      sandbox = app.kind === "sandbox";
    const label = sandbox
      ? "Free play"
      : `${String(app.trackIndex + 1).padStart(2, "0")} / ${P.title(window.CURRICULUM.TRACKS[app.trackIndex].title)}`;
    const bar = app.duel
      ? `<div class="duel-status"><span>${E(app.duel.data.opponent.toUpperCase())} · Round ${app.duel.round + 1} / ${app.duel.data.rounds.length}</span><strong id="duel-hp">${app.duel.hp} HP</strong><span id="duel-clock">${app.game.prefs.duelMode === "blitz" ? "45s remaining" : "No timer"}</span></div>`
      : app.daily
        ? `<div class="duel-status"><span>Practice session</span><span>Exercise ${app.daily.index + 1} / ${app.daily.items.length}</span></div>`
        : "";
    return `<div class="page-content exercise-page"><div class="breadcrumbs">${B(`${I("back")}${sandbox ? "Back to practice" : "Back to course"}`, "leave-exercise", 'class="secondary"')}<span>${E(label)}</span></div><div class="page-heading"><h1>${sandbox ? "Your terminal. Your rules." : E(P.title(d.name))}</h1><p>${sandbox ? "A free-play buffer for deliberate experiments." : E(d.brief)}</p></div>${bar}<div class="exercise-grid"><section class="editor-column"><div class="terminal-frame"><div class="terminal-top"><span>${E(app.session.engine.fileName)}</span><span id="mode-badge" class="mode-badge">${app.session.shell ? "SHELL" : "NORMAL"}</span></div><div class="terminal" id="terminal" tabindex="0" role="region" aria-roledescription="Vim training terminal" aria-label="Vim terminal. Click or focus here to type commands. Press Tab to leave the terminal." aria-describedby="terminal-instructions"><div id="buffer">${P.bufferHTML(app.session)}</div><div id="command-line" class="command-line"></div></div><div class="terminal-status"><span id="stroke-count">0 keystrokes</span><span id="cursor-position">Ln 1, Col 1</span><span>${sandbox ? "Free play" : `Reference: <strong>${d.par}</strong>`}</span></div></div><p id="terminal-instructions" class="terminal-instructions">Click the terminal, then type. <kbd>Esc</kbd> returns to Normal mode.</p><div class="actions editor-actions">${B(`${I("restart")}Restart`, "restart", 'class="secondary"')}${sandbox ? "" : B(`${I("hint")}Show hint`, "hint", 'class="secondary"')}${B(`${I("guide")}Field guide`, "guide-modal", 'class="secondary"')}</div><div class="key-history" id="key-history" aria-label="Recent keystrokes"><span>Your keystrokes will appear here.</span></div><div class="terminal-message" id="terminal-message" role="status"></div><details class="touch-controls"><summary>On-screen keyboard</summary><div class="touch-keys">${["h", "j", "k", "l", "w", "b", "e", "0", "$", "g", "G", "i", "a", "o", "x", "d", "c", "y", "p", "u", "v", "V", "/", "n", "N", ".", "q", "@", ":", "<Esc>", "<CR>", "<BS>", "<C-r>"].map((k) => B(E(P.keyLabel(k)), "key", `data-key="${E(k)}" aria-label="Type ${E(P.keyLabel(k))}"`)).join("")}</div><div class="touch-entry"><label for="touch-input">Type text or a command</label><input id="touch-input" type="text" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" placeholder="Type here, then Send"><button type="button" data-action="send-text">Send</button></div><p class="small muted">Each character counts as a keystroke. Use Enter above to run a command, or Esc to leave Insert mode.</p></details></section><aside class="objective-panel"><div id="objective">${P.objective(app)}</div><div class="pace-note">${I("clock")}<span>${app.duel ? "Keep your edits deliberate." : "No timer. Take your time."}</span></div></aside></div></div>`;
  };
  P.updateEditor = (app) => {
    const s = app.session,
      state = s.engine.getState();
    document.getElementById("buffer").innerHTML = P.bufferHTML(s);
    document.getElementById("mode-badge").textContent = s.shell
      ? "SHELL"
      : state.mode;
    document.getElementById("mode-badge").dataset.mode = state.mode;
    document.getElementById("stroke-count").textContent =
      `${s.keys.length} keystroke${s.keys.length === 1 ? "" : "s"}`;
    document.getElementById("cursor-position").textContent =
      `Ln ${state.row + 1}, Col ${state.col + 1}`;
    document.getElementById("command-line").textContent =
      state.cmd ||
      state.search ||
      (state.recording ? `recording @${state.recording}` : state.pending) ||
      "";
    document.getElementById("key-history").innerHTML = P.keys(
      s.keys.slice(-16),
    );
    document.getElementById("terminal-message").textContent = s.message || "";
    document.getElementById("objective").innerHTML = P.objective(app);
    const cursor = document.querySelector("#buffer .cursor"),
      terminal = document.getElementById("terminal");
    if (cursor) {
      const rect = cursor.getBoundingClientRect(),
        box = terminal.getBoundingClientRect();
      if (rect.bottom > box.bottom - 32 || rect.top < box.top + 12)
        terminal.scrollTop += rect.top - box.top - box.height / 2;
      if (rect.right > box.right - 16 || rect.left < box.left + 42)
        terminal.scrollLeft += rect.left - box.left - box.width / 2;
    }
  };
})();
