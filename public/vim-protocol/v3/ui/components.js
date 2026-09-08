/* Small shared view primitives. Dynamic text is always escaped. */
(function () {
  "use strict";
  const P = (window.VP = {});
  P.escape = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  P.title = (text) =>
    text.toLowerCase().replace(/(^|[.!?] )\w/g, (c) => c.toUpperCase());
  P.keyLabel = (key) =>
    ({
      "<Esc>": "Esc",
      "<CR>": "Enter",
      "<BS>": "⌫",
      "<Tab>": "Tab",
      "<C-r>": "Ctrl R",
      " ": "Space",
    })[key] || key;
  P.keys = (tokens) =>
    tokens.map((k) => `<kbd>${P.escape(P.keyLabel(k))}</kbd>`).join("");
  P.button = (text, action, extra = "") =>
    `<button type="button" data-action="${action}" ${extra}>${text}</button>`;
  const paths = {
    training:
      '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="m18 6 3-3"/>',
    practice: '<path d="m4 6 6 6-6 6m9 0h7"/>',
    guide:
      '<path d="M12 5v15M3 4c4-1 7 0 9 2 2-2 5-3 9-2v15c-4-1-7 0-9 2-2-2-5-3-9-2z"/>',
    progress: '<path d="M4 20V12h3v8m4 0V4h3v16m4 0V8h3v12"/>',
    archive:
      '<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v12h14V8m-9 4h4"/>',
    settings:
      '<path d="m9 3-1 3-3 1 1 3-2 2 2 2-1 3 3 1 1 3 3-1 3 1 1-3 3-1-1-3 2-2-2-2 1-3-3-1-1-3-3 1z"/><circle cx="12" cy="12" r="3"/>',
    arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
    back: '<path d="M20 12H5m6-6-6 6 6 6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    medal:
      '<circle cx="12" cy="15" r="6"/><path d="m8 10-4-8h5l3 7 3-7h5l-4 8m-4 2 1 2 2 1-2 1-1 2-1-2-2-1 2-1z"/>',
    leaf: '<path d="M12 21v-9m0 3C4 15 4 9 4 5c7 0 8 5 8 10m0-3c0-6 4-9 9-9 0 7-3 9-9 9"/>',
    keyboard:
      '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 9h1m3 0h1m3 0h1m3 0h1M6 12h1m3 0h1m3 0h1m3 0h1M7 16h10"/>',
    restart: '<path d="M4 10a8 8 0 1 1 0 5m0-12v7h7"/>',
    hint: '<path d="M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0l-1 2H9z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 3"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
    play: '<path d="m8 4 12 8-12 8z"/>',
    pause: '<path d="M8 4v16M16 4v16"/>',
  };
  P.icon = (name) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.training}</svg>`;
  P.meter = (done, total, label) =>
    `<div class="meter" role="progressbar" aria-label="${P.escape(label)}" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}"><span style="width:${Math.min(100, (done / Math.max(1, total)) * 100)}%"></span></div>`;
  P.medal = (medal) =>
    medal
      ? `<span class="medal ${medal}">${P.icon("medal")}${P.title(medal)}</span>`
      : '<span class="muted">Not completed</span>';
  P.belt = (index) => {
    const b = window.CURRICULUM.BELTS[index];
    return `<span class="belt"><i style="--belt:${index === 7 ? "#aeb6ae" : b.color}"></i>${P.escape(P.title(b.name))}</span>`;
  };
  P.descriptions = [
    "Enter, exit, and find your footing",
    "Move by meaning, not by character",
    "Make your first changes",
    "Compose powerful edits",
    "Change exactly what you mean",
    "Find your way through any file",
    "Select, shape, and shift",
    "Turn repetition into a single keystroke",
  ];
  P.shortKeys = [
    "h j k l",
    "w b e",
    "i a x u",
    "d c y p",
    'ciw di"',
    "/ n N",
    "v V >",
    " . q @",
  ];
  P.nav = [
    ["training", "Training"],
    ["practice", "Practice"],
    ["guide", "Field guide"],
    ["progress", "Progress"],
    ["archive", "Archive"],
  ];
  P.shell = (app, content) => {
    const current = ["course", "exercise"].includes(app.page)
      ? "training"
      : app.page;
    const profile = app.game.save.playerName || `Operator 0${app.game.slot}`;
    const nav = P.nav
      .map(([id, label]) =>
        P.button(
          `${P.icon(id)}<span>${label}</span>`,
          `nav:${id}`,
          `class="nav-item ${current === id ? "active" : ""}" ${current === id ? 'aria-current="page"' : ""}`,
        ),
      )
      .join("");
    return `<aside class="sidebar"><a href="#training" data-action="nav:training" class="brand" aria-label="VIM Protocol training"><img src="v3/assets/mark.svg" width="80" height="80" alt=""><span>VIM<br>PROTOCOL</span><small>3.0</small></a><nav aria-label="Main navigation">${nav}</nav><div class="rail-bottom">${P.button(`${P.icon("settings")}<span>Settings</span>`, "nav:settings", `class="nav-item ${current === "settings" ? "active" : ""}" aria-label="Settings"`)}${P.button(`<span class="avatar">0${app.game.slot}</span><span>${P.escape(profile)}<small>Local profile</small></span>`, "profiles", `class="profile" aria-label="Switch profile: ${P.escape(profile)}"`)}</div></aside><div class="workspace"><header class="topbar"><span>${(P.nav.find((n) => n[0] === current) || ["", "Settings"])[1]}</span><span class="motto">Your pace. Your progress.</span></header><main id="main" tabindex="-1">${content}</main><footer class="app-footer"><span>VIM Protocol 3.0.0</span><span>${app.game.storageWarning ? P.escape(app.game.storageWarning) : "Progress saves on this device."}</span><span>${P.button("Keyboard help", "help", 'class="text-button"')}</span></footer></div><dialog id="dialog" aria-labelledby="dialog-title"></dialog><div class="toast" id="toast" role="status" hidden></div>`;
  };
})();
