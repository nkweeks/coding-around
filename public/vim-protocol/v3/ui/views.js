(function () {
  "use strict";
  const P = window.VP,
    E = P.escape,
    B = P.button,
    I = P.icon,
    C = window.CURRICULUM;
  const heading = (title, copy = "") =>
    `<div class="page-heading"><h1>${E(title)}</h1>${copy ? `<p>${E(copy)}</p>` : ""}</div>`;
  const courseRow = (app, t, i) => {
    const progress = app.game.trackProgress(t),
      unlocked = app.game.trackUnlocked(i),
      complete = app.game.trackComplete(t);
    return B(
      `<span class="row-number">${String(i + 1).padStart(2, "0")}</span><span class="row-title"><strong>${E(P.title(t.title))}</strong><small>${E(P.descriptions[i])}</small></span><span class="course-keys">${E(P.shortKeys[i])}</span>${P.belt(i)}<span class="row-end">${I(complete ? "check" : unlocked ? "arrow" : "lock")}</span>`,
      `course:${i}`,
      `class="course-row ${unlocked && !complete ? "available" : ""}" aria-label="${E(P.title(t.title))}, ${progress.done} of ${progress.total} drills${unlocked ? "" : ", preview locked course"}"`,
    );
  };
  P.views = {
    training(app) {
      const totals = app.game.totals(),
        next = app.game.nextUp(),
        belt = next ? next.trackIndex : 7;
      return `<section class="hero"><img class="hero-art themed-world" src="v3/assets/dojo-night.png" alt="A quiet dojo above a rain-soaked city, a student practicing at a glowing terminal"><div class="hero-copy"><h1>Make every<br>keystroke count.</h1><p>Learn Vim through deliberate practice.<br>Eight courses. One fluent way to edit.</p>${B(`${totals.drillsDone ? "Continue training" : "Begin training"}${I("arrow")}`, "continue", 'class="primary"')}</div></section><section class="stats-strip" aria-label="Your training progress"><div>${I("training")}<span><strong>${totals.drillsDone} <em>/ ${totals.drillsTotal}</em></strong><small>Drills completed</small></span></div><div>${I("medal")}<span><strong>${totals.golds}</strong><small>Gold medals</small></span></div><div>${I("progress")}<span><strong>${E(P.title(C.BELTS[belt].name))}</strong><small>${next ? "Current course" : "All courses mastered"}</small></span></div></section><div class="training-grid"><section><div class="section-heading"><h2>Your training path</h2><span>8 courses</span></div><div class="course-list">${C.TRACKS.map((t, i) => courseRow(app, t, i)).join("")}</div></section><aside class="practice-aside"><div class="practice-card">${I("leaf")}<h2>A little practice,<br>every day.</h2><p>Five drills selected from your available courses.</p>${B(`Start a practice session${I("arrow")}`, "daily", 'class="primary"')}</div><div class="keyboard-note">${I("keyboard")}<span>Built for your keyboard</span><kbd>Esc</kbd><kbd>F1</kbd></div><p class="quiet-note">Learn the forms. Find your flow.<br>There’s no timer in regular training.</p></aside></div>`;
    },
    course(app) {
      const ti = app.trackIndex,
        t = C.TRACKS[ti],
        progress = app.game.trackProgress(t),
        unlocked = app.game.trackUnlocked(ti);
      const ready = unlocked && progress.done === progress.total;
      return `<div class="page-content">${B(`${I("back")}Training path`, "nav:training", 'class="text-button back"')}${heading(P.title(t.title), P.descriptions[ti])}<div class="course-meta">${P.belt(ti)}<span>${progress.done} / ${progress.total} drills</span><span>${progress.gold} gold medals</span></div>${P.meter(progress.done, progress.total, "Drills completed in this course")}${!unlocked ? `<div class="notice">${I("lock")}<span>Preview this course anytime. Complete ${E(P.title(C.TRACKS[ti - 1].title))} and its duel to begin training here.</span>${B("Go to current course", "continue", 'class="secondary"')}</div>` : ""}<div class="course-layout"><section><h2>The exercises</h2><div class="drill-list">${t.drills.map((d, i) => B(`<span class="row-number">${String(i + 1).padStart(2, "0")}</span><span class="row-title"><strong>${E(P.title(d.name))}</strong><small>${E(d.keys)} · ${d.par} reference keystrokes</small></span>${P.medal(app.game.drillState(d.id)?.medal)}${I(unlocked ? "arrow" : "lock")}`, `drill:${ti}:${i}`, `class="drill-row" ${unlocked ? "" : "disabled"}`)).join("")}</div><div class="duel-card"><img class="themed-portrait" src="v3/assets/${t.duel.opponent}.jpeg" alt="${E(t.duel.opponent.toUpperCase())}, your instructor"><div><h3>${E(P.title(t.duel.name))}</h3><p>${ready ? E(t.duel.intro) : "Complete every drill in this course to unlock the instructor duel."}</p><span class="muted">${t.duel.rounds.length} rounds · ${app.game.save.duels[t.duel.id] ? "Won" : "Earn your next belt"}</span></div>${B(`${ready ? "Enter duel" : "Locked"}${I(ready ? "arrow" : "lock")}`, `duel:${ti}`, `class="${ready ? "primary" : "secondary"}" ${ready ? "" : "disabled"}`)}</div>${t.finalDuel ? `<div class="duel-card"><div><h3>${E(P.title(t.finalDuel.name))}</h3><p>Complete the first championship to face the final master.</p></div>${B("Final duel", `finalduel:${ti}`, `class="primary" ${ready && app.game.save.duels[t.duel.id] ? "" : "disabled"}`)}</div>` : ""}</section><aside class="lesson-panel"><h2>The forms</h2><p>${E(t.lesson.intro)}</p><dl class="techniques">${t.lesson.techniques.map((x) => `<dt><code>${E(x.keys)}</code></dt><dd>${E(x.desc)}</dd>`).join("")}</dl>${B(`${I("guide")}Open field guide`, "nav:guide", 'class="secondary"')}</aside></div></div>`;
    },
    practice(app) {
      const set = app.game.dailySet();
      app.practiceSet = set;
      return `<div class="page-content">${heading("Keep your edge.", "Small, focused sessions turn commands into muscle memory.")}<div class="practice-layout"><section><div class="section-heading"><h2>Your practice session</h2><span>${set.length} exercises</span></div><p class="muted">A fresh mix of available drills, weighted toward techniques that need work. No daily streak to lose.</p><ol class="session-list">${set.map((x) => `<li><span><strong>${E(P.title(x.drill.name))}</strong><small>${E(P.title(C.TRACKS[x.trackIndex].title))}</small></span><code>${E(x.drill.keys)}</code></li>`).join("")}</ol>${B(`Start practice${I("arrow")}`, "daily-selected", 'class="primary"')}</section><aside class="sandbox-card">${I("practice")}<h2>A blank canvas.</h2><p>Try any supported command in the free-play terminal. No objectives, scores, or consequences.</p>${B(`Open sandbox${I("arrow")}`, "sandbox", 'class="secondary"')}<p class="muted small">Use the field guide to explore commands you haven’t learned yet.</p></aside></div></div>`;
    },
    guide(app) {
      return `<div class="page-content">${heading("The field guide.", "A working vocabulary for your editor. Search by command or by intent.")}<label class="search-field"><span class="sr-only">Search commands</span><input id="guide-search" type="search" placeholder="Try ‘delete’, ‘word’, or ‘ciw’" value="${E(app.guideQuery || "")}" autocomplete="off"></label><p class="small muted">Literal search is supported. Regular expressions, named text registers, marks, and blockwise Visual mode are outside this training engine.</p><div id="guide-results">${P.guideRows(app.guideQuery || "")}</div></div>`;
    },
    progress(app) {
      const g = app.game,
        totals = g.totals(),
        ranks = g.rankedCommands();
      return `<div class="page-content">${heading("Progress you can feel.", "Every finished exercise is a step toward fluent editing.")}<div class="progress-numbers"><div><strong>${totals.drillsDone}<em> / ${totals.drillsTotal}</em></strong><span>Drills completed</span></div><div><strong>${totals.golds}</strong><span>Gold medals</span></div><div><strong>${Object.keys(g.save.duels).length}<em> / 9</em></strong><span>Duels won</span></div><div><strong>${g.save.stats.dailies}</strong><span>Practice sessions</span></div></div><div class="section-heading"><h2>Course mastery</h2><span>${Math.round(g.save.stats.ms / 60000)} min practiced · ${g.save.stats.keys.toLocaleString()} keystrokes</span></div><div class="mastery-list">${C.TRACKS.map(
        (t, i) => {
          const pr = g.trackProgress(t);
          return `<div>${P.belt(i)}<span>${E(P.title(t.title))}</span>${P.meter(pr.done, pr.total, t.title)}<span>${pr.done}/${pr.total}</span></div>`;
        },
      ).join(
        "",
      )}</div><section class="progress-section"><h2>Your next focus</h2>${
        ranks.length
          ? `<div class="focus-list">${ranks
              .slice(0, 5)
              .map(
                (x) =>
                  `<span><code>${E(x.cmd)}</code>${Number(x.avg).toFixed(1)}× reference</span>`,
              )
              .join(
                "",
              )}</div><p class="muted">Your best keystroke count divided by the reference, across drills using each command. Lower is better.</p>`
          : '<p class="muted">Finish a few exercises to see which commands could use more practice.</p>'
      }</section><section class="progress-section"><h2>Milestones</h2><div class="achievements">${window.Game.ACHIEVEMENTS.map((a) => `<div class="achievement ${g.has(a.id) ? "earned" : ""}">${I(g.has(a.id) ? "medal" : "lock")}<span><strong>${E(a.name)}</strong><small>${E(a.desc)}</small></span><span class="small">${g.has(a.id) ? "Earned" : "Not yet"}</span></div>`).join("")}</div></section><div class="notice"><div><h3>Your certificate of mastery</h3><p>${g.gameComplete() ? "You have earned every belt. Download your certificate." : "Complete all eight courses and their duels to earn your certificate."}</p></div>${B(`${I("download")}Download certificate`, "certificate", `class="secondary" ${g.gameComplete() ? "" : "disabled"}`)}</div></div>`;
    },
    archive(app) {
      return `<div class="page-content">${heading("Stories from the dojo.", "BYTE, BLADE, and the unfinished edit that changed the grid.")}<p class="muted">Chapters unlock as you earn belts. Read at your own pace; training never waits for a cutscene.</p><div class="archive-list">${window.STORY.SCENES.map(
        (s, i) => {
          const open = s.trigger <= app.game.beltLevel();
          return B(
            `<span class="row-number">${String(i + 1).padStart(2, "0")}</span><span class="row-title"><strong>${E(P.title(s.title))}</strong><small>${open ? (app.game.sceneSeen(s.id) ? "Read again" : "Ready to read") : `Unlocks after ${C.BELTS[Math.max(0, s.trigger)].name}`}</small></span>${I(open ? "arrow" : "lock")}`,
            `story:${i}`,
            `class="drill-row" ${open ? "" : "disabled"}`,
          );
        },
      ).join("")}</div></div>`;
    },
    settings(app) {
      const p = app.game.prefs;
      return `<div class="page-content narrow">${heading("Make it yours.", "A comfortable workspace helps good habits stick.")}${P.themeControls(p, "settings")}<form id="settings-form"><label class="setting-row"><span><strong>Operator name</strong><small>Shown on your profile and certificate.</small></span><input name="playerName" maxlength="40" aria-label="Operator name" value="${E(app.game.save.playerName)}" placeholder="Operator 0${app.game.slot}"></label><label class="setting-row"><span><strong>Terminal text size</strong><small>Keep your code easy to read.</small></span><select name="termFont"><option value="small" ${p.termFont === "small" ? "selected" : ""}>Compact · 16px</option><option value="medium" ${p.termFont === "medium" ? "selected" : ""}>Comfortable · 19px</option><option value="large" ${p.termFont === "large" ? "selected" : ""}>Large · 23px</option></select></label><label class="setting-row"><span><strong>Duel difficulty</strong><small>Assist: 1 HP per extra key. Normal: 2 HP. Blitz adds a 45-second round timer.</small></span><select name="duelMode">${["assist", "normal", "blitz"].map((x) => `<option ${p.duelMode === x ? "selected" : ""}>${x}</option>`).join("")}</select></label><label class="setting-row"><span><strong>Sound effects</strong><small>A subtle note for checkpoints and completed drills.</small></span><input name="sfx" type="checkbox" ${p.sfx ? "checked" : ""}></label><label class="setting-row"><span><strong>Reduce motion</strong><small>Your system preference is also respected.</small></span><input name="reducedMotion" type="checkbox" ${p.reducedMotion ? "checked" : ""}></label>${B("Save preferences", "save-settings", 'class="primary"')}</form><section class="progress-section"><h2>Your progress belongs to you.</h2><p class="muted">Three local profiles, each with separate progress. Export a backup to move devices or keep a copy. Import replaces the active profile and saves a recovery copy first.</p><div class="actions">${B("Switch profile", "profiles", 'class="secondary"')}${B(`${I("download")}Export backup`, "export", 'class="secondary"')}<label class="button secondary upload">Import backup<input type="file" id="import-file" accept="application/json,.json"></label>${B("Restore pre-import copy", "recover", 'class="text-button"')}</div></section><section class="progress-section"><h2>About version 3</h2><p class="muted">52 exercises. Eight courses. Nine duels. A local Vim simulator with no account, external services, or tracking. Compatible v2 progress is copied into your current profile; the original save is preserved.</p></section></div>`;
    },
  };
  P.guideRows = (query) => {
    const q = query.trim().toLowerCase();
    const rows = C.TRACKS.flatMap((t, i) =>
      t.lesson.techniques.map((x) => ({ ...x, course: i })),
    ).filter((x) =>
      `${x.keys} ${x.desc} ${C.TRACKS[x.course].title}`
        .toLowerCase()
        .includes(q),
    );
    return rows.length
      ? `<table class="guide-table"><thead><tr><th scope="col">Command</th><th scope="col">What it does</th><th scope="col">Course</th></tr></thead><tbody>${rows.map((x) => `<tr><td><code>${E(x.keys)}</code></td><td>${E(x.desc)}</td><td>${E(P.title(C.TRACKS[x.course].title))}</td></tr>`).join("")}</tbody></table><p class="muted small" role="status">${rows.length} techniques</p>`
      : '<div class="empty"><h2>No matching commands.</h2><p>Try a different command or an action like “move”, “delete”, or “repeat”.</p></div>';
  };
})();
