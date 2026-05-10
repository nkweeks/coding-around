import * as THREE from "https://unpkg.com/three@0.165.0/build/three.module.js";
import {
  animateCyberArena,
  createCyberArena,
  createSystemNode,
  setSystemNodeState,
  updateCyberArena
} from "./scene-assets.js";

const IMAGE_ROOT = "../images/";
const WORD = /[A-Za-z0-9_]/;

const characters = {
  byte: {
    name: "BYTE",
    portrait: `${IMAGE_ROOT}robot_happy.jpg`,
    color: 0x5ce7ff,
    coach: "I score outcomes, not obedience. Solve the ticket cleanly and the room systems will come back online."
  },
  blade: {
    name: "BLADE",
    portrait: `${IMAGE_ROOT}ninja.jpg`,
    color: 0xff3fa4,
    coach: "Do not crawl. Search, jump, change, leave no trace."
  },
  shell: {
    name: "SHELL",
    portrait: `${IMAGE_ROOT}shell2.jpg`,
    color: 0x69ff9d,
    coach: "This is what Vim is for: fast repair work in ugly files under pressure."
  },
  zero: {
    name: "ZERO",
    portrait: `${IMAGE_ROOT}robot_happy.jpg`,
    color: 0x9d4edd,
    coach: "The room is a simulation. The skill is real: read the task, choose the edit, verify the buffer."
  }
};

const missions = [
  {
    title: "Incident Triage",
    bufferName: "incident_417.log",
    guide: "byte",
    par: 4,
    focus: ["/", "n", "w", "b"],
    task: "Find the real root cause in the noisy incident log and put the cursor on the word poisoned.",
    lesson: "Practical Vim starts with navigation under uncertainty. Use search to jump to meaning, then word motions to land precisely.",
    hints: [
      "Search for ROOT_CAUSE instead of walking line by line.",
      "After the search lands, use w to move through the line by words.",
      "One clean route: /ROOT_CAUSE, Enter, then w until poisoned."
    ],
    buffer: [
      "// incident_417.log",
      "time=03:17 status=OPEN",
      "service=nexus-gateway",
      "noise: heartbeat accepted",
      "noise: auth cache warm",
      "ROOT_CAUSE: token cache poisoned",
      "owner=unknown"
    ],
    cursor: { line: 0, col: 0 },
    systems: [
      { label: "Root-cause line located", check: (s) => s.cursor.line === findLine(s, "ROOT_CAUSE") },
      { label: "Cursor on poisoned", check: (s) => onWord(s, "poisoned") }
    ]
  },
  {
    title: "Kill Switch Config",
    bufferName: "nexus.conf",
    guide: "blade",
    par: 10,
    focus: ["/", "cw", "Esc"],
    task: "Turn off telemetry, quarantine the mode, and close the open endpoint.",
    lesson: "This is the everyday Vim loop: search for the value, change the word, return to Normal mode, repeat.",
    hints: [
      "Use /true, /observe, and /open to jump directly to values.",
      "Use cw on each value, type the replacement, then Escape.",
      "Targets: true -> false, observe -> quarantine, open -> closed."
    ],
    buffer: [
      "# nexus.conf",
      "telemetry = true",
      "mode = observe",
      "endpoint = /v1/nexus/open",
      "retries = 3"
    ],
    cursor: { line: 0, col: 0 },
    systems: [
      { label: "Telemetry disabled", check: (s) => hasLine(s, "telemetry = false") },
      { label: "Mode quarantined", check: (s) => hasLine(s, "mode = quarantine") },
      { label: "Endpoint closed", check: (s) => hasLine(s, "endpoint = /v1/nexus/closed") }
    ]
  },
  {
    title: "Access List Cleanup",
    bufferName: "access.rules",
    guide: "shell",
    par: 9,
    focus: ["dd", "D", "cw", "/"],
    task: "Remove the duplicate root rule, redact the leaked token, and strip the deploy comment.",
    lesson: "Deletion is practical when it has scope: whole line with dd, to end of line with D, and word-level replacement with cw.",
    hints: [
      "Search for duplicate, delete that line with dd.",
      "Search LEAK_ME, use cw to type REDACTED.",
      "Use f/ then D to remove the comment tail."
    ],
    buffer: [
      "# access.rules",
      "allow root",
      "allow ops",
      "deny malware",
      "allow root  # duplicate",
      "token = LEAK_ME; // remove before deploy"
    ],
    cursor: { line: 0, col: 0 },
    systems: [
      { label: "Only one root allow rule remains", check: (s) => countLines(s, /^allow root\b/) === 1 },
      { label: "Leaked token redacted", check: (s) => bufferText(s).includes("token = REDACTED;") },
      { label: "Deploy comment removed", check: (s) => !bufferText(s).includes("// remove before deploy") }
    ]
  },
  {
    title: "Payload Surgery",
    bufferName: "payload.json",
    guide: "blade",
    par: 10,
    focus: ["a", "ci\"", "r", "/"],
    task: "Repair the malformed payload: active must be true, role must be operator, and route must be /prod.",
    lesson: "Text objects make structured editing feel direct. ci\" changes inside quotes without counting columns.",
    hints: [
      "Search tru, use e then a to append the missing e.",
      "Search admin and use ci\"operator, then Escape.",
      "Search debug and use ci\"/prod, then Escape."
    ],
    buffer: [
      "{",
      "  \"agent\": \"rookie\",",
      "  \"active\": tru,",
      "  \"role\": \"admin\",",
      "  \"route\": \"/debug\"",
      "}"
    ],
    cursor: { line: 0, col: 0 },
    systems: [
      { label: "Boolean repaired", check: (s) => hasLine(s, "  \"active\": true,") },
      { label: "Role downgraded", check: (s) => hasLine(s, "  \"role\": \"operator\",") },
      { label: "Route points to production", check: (s) => hasLine(s, "  \"route\": \"/prod\"") }
    ]
  },
  {
    title: "Refactor Sweep",
    bufferName: "ship.js",
    guide: "zero",
    par: 3,
    focus: [":%s", "g", "u"],
    task: "Rename the temporary variable tmp to payload everywhere without manually editing each occurrence.",
    lesson: "Global substitution is one of Vim's sharpest practical tools. Use it when the intent is broad and mechanical.",
    hints: [
      "Open command-line mode with :",
      "Run %s/tmp/payload/g and press Enter.",
      "If the replacement is wrong, use u to undo and try again."
    ],
    buffer: [
      "function ship(tmp) {",
      "  validate(tmp);",
      "  send(tmp);",
      "  return tmp.id;",
      "}"
    ],
    cursor: { line: 0, col: 0 },
    systems: [
      { label: "tmp fully removed", check: (s) => !bufferText(s).includes("tmp") },
      { label: "payload used everywhere", check: (s) => (bufferText(s).match(/payload/g) || []).length === 4 }
    ]
  },
  {
    title: "Launch Commit",
    bufferName: "deploy.js",
    guide: "byte",
    par: 13,
    focus: ["yy", "p", "ci\"", "o"],
    task: "Add the missing backup check, promote staging to production, and add confirmed: true to the deploy object.",
    lesson: "Real edits combine small Vim ideas. Copy structure with yy/p, change quoted text with ci\", and open new lines with o.",
    hints: [
      "Duplicate the logs line with yy then p, then use ci\"backup.",
      "Search staging and use ci\"production.",
      "On the stage line, use o and type two spaces plus confirmed: true."
    ],
    buffer: [
      "const checks = [",
      "  \"auth\",",
      "  \"logs\"",
      "];",
      "",
      "deploy({",
      "  stage: \"staging\"",
      "});"
    ],
    cursor: { line: 0, col: 0 },
    systems: [
      { label: "Backup check added", check: (s) => bufferText(s).includes("\"backup\"") },
      { label: "Production stage set", check: (s) => bufferText(s).includes("stage: \"production\"") },
      { label: "Deploy confirmation added", check: (s) => bufferText(s).includes("confirmed: true") }
    ]
  }
];

const els = {
  canvas: document.querySelector("#world"),
  missionKicker: document.querySelector("#mission-kicker"),
  missionTitle: document.querySelector("#mission-title"),
  focusStrip: document.querySelector("#focus-strip"),
  mode: document.querySelector("#mode-label"),
  keys: document.querySelector("#keys-label"),
  score: document.querySelector("#score-label"),
  par: document.querySelector("#par-label"),
  task: document.querySelector("#task-text"),
  lesson: document.querySelector("#lesson-text"),
  hintButton: document.querySelector("#hint-button"),
  hintText: document.querySelector("#hint-text"),
  bufferName: document.querySelector("#buffer-name"),
  editor: document.querySelector("#editor"),
  cursorLabel: document.querySelector("#cursor-label"),
  message: document.querySelector("#message-label"),
  guidePortrait: document.querySelector("#guide-portrait"),
  guideName: document.querySelector("#guide-name"),
  coach: document.querySelector("#coach-text"),
  systems: document.querySelector("#system-list"),
  quality: document.querySelector("#quality-list"),
  commandLog: document.querySelector("#command-log"),
  boot: document.querySelector("#boot-panel"),
  start: document.querySelector("#start-game"),
  prev: document.querySelector("#prev-mission"),
  next: document.querySelector("#next-mission"),
  restart: document.querySelector("#restart-mission"),
  mobileKeys: document.querySelector("#mobile-keys")
};

const state = {
  missionIndex: 0,
  buffer: [],
  cursor: { line: 0, col: 0 },
  preferredCol: 0,
  mode: "NORMAL",
  pending: "",
  input: "",
  commandCount: 0,
  keyCount: 0,
  history: [],
  undo: [],
  yank: { text: "", type: "char" },
  search: "",
  hintsUsed: 0,
  systemStatus: [],
  active: false,
  finished: false,
  message: "Press Enter Sim to begin."
};

const renderer = new THREE.WebGLRenderer({
  canvas: els.canvas,
  antialias: true,
  alpha: true,
  powerPreference: "high-performance"
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x03070b, 0.035);

const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 140);
camera.position.set(0, 5.35, 9.35);

const clock = new THREE.Clock();
const arena = await createCyberArena();
const systemNodes = [];
scene.add(arena.group);

const ambient = new THREE.HemisphereLight(0x8eeaff, 0x031018, 1.55);
const keyLight = new THREE.DirectionalLight(0xffffff, 1.9);
keyLight.position.set(7, 11, 7);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 1;
keyLight.shadow.camera.far = 35;
const alarmLight = new THREE.PointLight(0xff3fa4, 130, 30);
alarmLight.position.set(-6, 5, -5);
scene.add(ambient, keyLight, alarmLight);

function startMission(index) {
  const mission = missions[wrap(index, missions.length)];
  state.missionIndex = wrap(index, missions.length);
  state.buffer = [...mission.buffer];
  state.cursor = { ...mission.cursor };
  state.preferredCol = state.cursor.col;
  state.mode = "NORMAL";
  state.pending = "";
  state.input = "";
  state.commandCount = 0;
  state.keyCount = 0;
  state.history = [];
  state.undo = [];
  state.yank = { text: "", type: "char" };
  state.search = "";
  state.hintsUsed = 0;
  state.finished = false;
  state.message = "Read the ticket. Solve the buffer.";
  state.systemStatus = mission.systems.map((system) => Boolean(system.check(state)));
  rebuildRoom();
  updateAll();
}

function rebuildRoom() {
  clearGroup(arena.systemRig);
  systemNodes.length = 0;

  const mission = currentMission();
  const total = mission.systems.length;
  for (let i = 0; i < total; i += 1) {
    const node = createSystemNode(i, total);
    systemNodes.push(node);
    arena.systemRig.add(node);
  }
}

function updateAll() {
  clampCursor();
  updateSystems();
  updateHud();
  renderEditor();
  updateWorldState();
}

function updateSystems() {
  const mission = currentMission();
  if (state.finished) {
    state.systemStatus = mission.systems.map(() => true);
    return;
  }

  state.systemStatus = mission.systems.map((system) => Boolean(system.check(state)));
  const complete = state.systemStatus.every(Boolean);
  if (complete && !state.finished) {
    state.finished = true;
    state.message = debriefMessage();
    addHistory("CLEAR", "Room repaired");
  }
}

function updateHud() {
  const mission = currentMission();
  const guide = characters[mission.guide];
  const repaired = state.systemStatus.filter(Boolean).length;

  els.missionKicker.textContent = `ROOM ${String(state.missionIndex + 1).padStart(2, "0")} // ${mission.bufferName}`;
  els.missionTitle.textContent = mission.title;
  els.focusStrip.innerHTML = mission.focus.map((item) => `<span>${escapeHtml(item)}</span>`).join("");
  els.mode.textContent = state.mode;
  els.keys.textContent = activeCommandLabel();
  els.score.textContent = `${state.commandCount}/${mission.par}`;
  els.par.textContent = `PAR ${mission.par}`;
  els.task.textContent = mission.task;
  els.lesson.textContent = mission.lesson;
  els.bufferName.textContent = mission.bufferName;
  els.cursorLabel.textContent = `L${state.cursor.line + 1} C${state.cursor.col}`;
  els.message.textContent = state.finished ? debriefMessage() : state.message;
  els.hintText.textContent = hintText();
  els.guideName.textContent = guide.name;
  els.guidePortrait.src = guide.portrait;
  els.guidePortrait.alt = `${guide.name} portrait`;
  els.coach.textContent = state.finished ? debriefMessage() : guide.coach;
  els.next.disabled = state.missionIndex === missions.length - 1 || !state.finished;

  els.systems.innerHTML = mission.systems.map((system, index) => {
    const pass = state.systemStatus[index];
    return `<div class="system-item ${pass ? "pass" : ""}">
      <span class="system-dot"></span>
      <span>${escapeHtml(system.label)}</span>
    </div>`;
  }).join("");

  els.quality.innerHTML = qualityNotes().map((note) => (
    `<div class="quality-item ${note.type}">${escapeHtml(note.text)}</div>`
  )).join("");

  els.commandLog.innerHTML = state.history.slice(-10).reverse().map((entry) => (
    `<div class="command-item"><strong>${escapeHtml(entry.keys)}</strong> ${escapeHtml(entry.label)}</div>`
  )).join("");

  document.documentElement.style.setProperty("--room-progress", `${repaired}/${mission.systems.length}`);
}

function renderEditor() {
  els.editor.innerHTML = state.buffer.map((line, lineIndex) => {
    const isCursorLine = lineIndex === state.cursor.line;
    let rendered;

    if (isCursorLine) {
      const col = Math.min(state.cursor.col, line.length);
      const before = escapeHtml(line.slice(0, col));
      const char = line[col] ?? " ";
      const after = escapeHtml(line.slice(col + (line[col] ? 1 : 0)));
      const cursorClass = state.mode === "INSERT" ? "cursor insert" : "cursor";
      const cursorText = state.mode === "INSERT" ? "" : escapeHtml(char);
      rendered = `${before}<span class="${cursorClass}">${cursorText}</span>${after}`;
    } else {
      rendered = renderSearchHighlight(line);
    }

    return `<div class="editor-line">
      <span class="line-number">${lineIndex + 1}</span>
      <span class="line-text">${rendered || " "}</span>
    </div>`;
  }).join("");
}

function renderSearchHighlight(line) {
  if (!state.search) return escapeHtml(line);
  const index = line.indexOf(state.search);
  if (index === -1) return escapeHtml(line);
  return `${escapeHtml(line.slice(0, index))}<span class="search-hit">${escapeHtml(state.search)}</span>${escapeHtml(line.slice(index + state.search.length))}`;
}

function updateWorldState() {
  const allPass = state.systemStatus.every(Boolean);
  systemNodes.forEach((node, index) => {
    const pass = state.systemStatus[index];
    setSystemNodeState(node, pass);
  });

  updateCyberArena(arena, {
    allPass,
    repaired: state.systemStatus.filter(Boolean).length,
    total: state.systemStatus.length,
    guide: currentMission().guide
  });
  alarmLight.color.setHex(allPass ? 0x69ff9d : 0xff3fa4);
}

function handleKey(rawKey) {
  if (!state.active) return;
  const key = normalizeKey(rawKey);
  if (!key) return;
  state.keyCount += 1;

  if (state.mode === "INSERT") handleInsertKey(key);
  else if (state.mode === "SEARCH") handleSearchKey(key);
  else if (state.mode === "COMMAND") handleCommandLineKey(key);
  else handleNormalKey(key);

  updateAll();
}

function handleNormalKey(key) {
  if (key === "Escape") {
    state.pending = "";
    state.message = "Command cleared.";
    return;
  }

  if (state.pending === "" && key === "/") {
    state.mode = "SEARCH";
    state.input = "";
    state.pending = "";
    state.message = "Search: type a pattern, then Enter.";
    return;
  }

  if (state.pending === "" && key === ":") {
    state.mode = "COMMAND";
    state.input = "";
    state.pending = "";
    state.message = "Command-line mode.";
    return;
  }

  state.pending += key;
  const parsed = parseNormalCommand(state.pending);

  if (parsed.status === "pending") {
    state.message = `Pending: ${state.pending}`;
    return;
  }

  if (parsed.status === "invalid") {
    state.message = `Not a supported command: ${state.pending}`;
    state.pending = "";
    return;
  }

  executeNormalCommand(parsed);
  state.commandCount += parsed.countsAsCommand === false ? 0 : 1;
  addHistory(state.pending, parsed.label);
  state.pending = "";
}

function handleInsertKey(key) {
  if (key === "Escape") {
    state.mode = "NORMAL";
    state.cursor.col = Math.max(0, Math.min(state.cursor.col - 1, lineMax(state, state.cursor.line)));
    state.preferredCol = state.cursor.col;
    state.message = "Back to NORMAL. Verify the room systems.";
    addHistory("Esc", "Return to Normal mode");
    return;
  }

  if (key === "Backspace") {
    insertBackspace();
    return;
  }

  if (key === "Enter") {
    const line = currentLine();
    state.buffer[state.cursor.line] = line.slice(0, state.cursor.col);
    state.buffer.splice(state.cursor.line + 1, 0, line.slice(state.cursor.col));
    state.cursor.line += 1;
    state.cursor.col = 0;
    state.message = "Inserted newline.";
    return;
  }

  if (key.length !== 1) return;
  const line = currentLine();
  state.buffer[state.cursor.line] = line.slice(0, state.cursor.col) + key + line.slice(state.cursor.col);
  state.cursor.col += 1;
  state.preferredCol = state.cursor.col;
  state.message = "Typing...";
}

function handleSearchKey(key) {
  if (key === "Escape") {
    state.mode = "NORMAL";
    state.input = "";
    state.message = "Search cancelled.";
    return;
  }

  if (key === "Backspace") {
    state.input = state.input.slice(0, -1);
    state.message = `/${state.input}`;
    return;
  }

  if (key === "Enter") {
    state.search = state.input;
    state.mode = "NORMAL";
    state.commandCount += 1;
    const found = runSearch(1, true);
    addHistory(`/${state.search}`, found ? "Search forward" : "Search missed");
    state.message = found ? `Found ${state.search}.` : `No match for ${state.search}.`;
    state.input = "";
    return;
  }

  if (key.length === 1) {
    state.input += key;
    state.message = `/${state.input}`;
  }
}

function handleCommandLineKey(key) {
  if (key === "Escape") {
    state.mode = "NORMAL";
    state.input = "";
    state.message = "Command cancelled.";
    return;
  }

  if (key === "Backspace") {
    state.input = state.input.slice(0, -1);
    state.message = `:${state.input}`;
    return;
  }

  if (key === "Enter") {
    const command = state.input;
    state.mode = "NORMAL";
    state.input = "";
    executeExCommand(command);
    return;
  }

  if (key.length === 1) {
    state.input += key;
    state.message = `:${state.input}`;
  }
}

function parseNormalCommand(sequence) {
  const countMatch = sequence.match(/^([1-9]\d*)(.*)$/);
  const count = countMatch ? Number(countMatch[1]) : 1;
  const cmd = countMatch ? countMatch[2] : sequence;

  if (countMatch && cmd === "") return { status: "pending" };
  if (cmd === "g" || ["f", "F", "t", "T", "r", "d", "c", "y"].includes(cmd)) return { status: "pending" };
  if (/^[dcy][ia]$/.test(cmd)) return { status: "pending" };

  if (cmd === "gg") return complete("goto", { line: count - 1, label: "Jump to top or counted line" });
  if (cmd === "G") return complete("goto", { line: count > 1 ? count - 1 : "last", label: "Jump to bottom or counted line" });
  if (["h", "j", "k", "l", "w", "b", "e", "0", "$", "^"].includes(cmd)) {
    return complete("motion", { motion: cmd, count, label: describeMotion(cmd, count) });
  }
  if (/^[fFtT].$/.test(cmd)) return complete("find", { direction: cmd[0], char: cmd[1], count, label: `Find ${cmd[1]} with ${cmd[0]}` });
  if (/^r.$/.test(cmd)) return complete("replace", { char: cmd[1], count, label: `Replace with ${cmd[1]}` });
  if (["i", "I", "a", "A", "o", "O"].includes(cmd)) return complete("insert", { command: cmd, label: `Insert via ${cmd}` });
  if (["x", "D", "C", "u", "p", "P", "n", "N"].includes(cmd)) return complete("single", { command: cmd, count, label: describeSingle(cmd) });
  if (["dd", "yy", "cc"].includes(cmd)) return complete("lineOp", { command: cmd, count, label: describeLineOp(cmd) });
  if (/^[dcy](w|\$|0)$/.test(cmd)) return complete("operatorMotion", { operator: cmd[0], motion: cmd[1], count, label: `${cmd[0]}${cmd[1]}` });
  if (/^[dcy][ia](w|["'`(){}\[\]])$/.test(cmd)) {
    return complete("textObject", { operator: cmd[0], modifier: cmd[1], object: cmd[2], count, label: `${cmd[0]}${cmd[1]}${cmd[2]}` });
  }

  return couldStillMatch(cmd) ? { status: "pending" } : { status: "invalid" };
}

function complete(type, fields) {
  return { status: "complete", type, ...fields };
}

function executeNormalCommand(cmd) {
  if (mutates(cmd)) saveUndo();

  if (cmd.type === "motion") repeat(cmd.count, () => move(cmd.motion));
  if (cmd.type === "goto") {
    state.cursor.line = cmd.line === "last" ? state.buffer.length - 1 : clamp(cmd.line, 0, state.buffer.length - 1);
    clampCursor();
  }
  if (cmd.type === "find") repeat(cmd.count, () => findChar(cmd.direction, cmd.char));
  if (cmd.type === "replace") replaceChars(cmd.char, cmd.count);
  if (cmd.type === "insert") enterInsert(cmd.command);
  if (cmd.type === "single") executeSingle(cmd.command, cmd.count);
  if (cmd.type === "lineOp") executeLineOp(cmd.command, cmd.count);
  if (cmd.type === "operatorMotion") executeOperatorMotion(cmd.operator, cmd.motion);
  if (cmd.type === "textObject") executeTextObject(cmd.operator, cmd.modifier, cmd.object);

  state.message = cmd.label;
}

function executeExCommand(command) {
  const substitution = command.match(/^%s\/(.+)\/(.*)\/([g]*)$/);
  if (substitution) {
    saveUndo();
    const [, from, to, flags] = substitution;
    const pattern = new RegExp(escapeRegExp(from), flags.includes("g") ? "g" : "");
    state.buffer = state.buffer.map((line) => line.replace(pattern, to));
    state.commandCount += 1;
    state.message = `Substituted ${from} -> ${to}.`;
    addHistory(`:${command}`, "Global substitution");
    return;
  }

  if (command === "w" || command === "write") {
    state.commandCount += 1;
    state.message = "Write simulated. The room validates automatically.";
    addHistory(`:${command}`, "Write checkpoint");
    return;
  }

  state.message = `Unsupported command: :${command}`;
  addHistory(`:${command}`, "Unsupported Ex command");
}

function mutates(cmd) {
  if (cmd.type === "replace" || cmd.type === "insert" || cmd.type === "textObject") return true;
  if (cmd.type === "single") return ["x", "D", "C", "p", "P"].includes(cmd.command);
  if (cmd.type === "lineOp") return ["dd", "cc"].includes(cmd.command);
  if (cmd.type === "operatorMotion") return ["d", "c"].includes(cmd.operator);
  return false;
}

function move(motion) {
  if (motion === "h") state.cursor.col -= 1;
  if (motion === "l") state.cursor.col += 1;
  if (motion === "j") {
    state.cursor.line += 1;
    state.cursor.col = state.preferredCol;
  }
  if (motion === "k") {
    state.cursor.line -= 1;
    state.cursor.col = state.preferredCol;
  }
  if (motion === "w") moveWordForward();
  if (motion === "b") moveWordBackward();
  if (motion === "e") moveWordEnd();
  if (motion === "0") state.cursor.col = 0;
  if (motion === "$") state.cursor.col = lineMax(state, state.cursor.line);
  if (motion === "^") state.cursor.col = firstNonBlank(currentLine());
  if (!["j", "k"].includes(motion)) state.preferredCol = state.cursor.col;
  clampCursor();
}

function moveWordForward() {
  let { line, col } = state.cursor;
  let text = state.buffer[line] ?? "";
  if (WORD.test(text[col] ?? "")) while (col < text.length && WORD.test(text[col] ?? "")) col += 1;
  else col += 1;

  while (line < state.buffer.length) {
    text = state.buffer[line] ?? "";
    while (col < text.length) {
      if (WORD.test(text[col])) {
        state.cursor = { line, col };
        return;
      }
      col += 1;
    }
    line += 1;
    col = 0;
  }
}

function moveWordBackward() {
  let { line, col } = state.cursor;
  while (line >= 0) {
    const text = state.buffer[line] ?? "";
    col -= 1;
    while (col >= 0) {
      if (WORD.test(text[col]) && (col === 0 || !WORD.test(text[col - 1]))) {
        state.cursor = { line, col };
        return;
      }
      col -= 1;
    }
    line -= 1;
    col = line >= 0 ? state.buffer[line].length : 0;
  }
}

function moveWordEnd() {
  let { line, col } = state.cursor;
  while (line < state.buffer.length) {
    const text = state.buffer[line] ?? "";
    col += 1;
    while (col < text.length) {
      if (WORD.test(text[col]) && (col === text.length - 1 || !WORD.test(text[col + 1]))) {
        state.cursor = { line, col };
        return;
      }
      col += 1;
    }
    line += 1;
    col = -1;
  }
}

function findChar(direction, char) {
  const line = currentLine();
  let index = -1;
  if (direction === "f" || direction === "t") {
    index = line.indexOf(char, state.cursor.col + 1);
    if (index !== -1 && direction === "t") index -= 1;
  } else {
    index = line.lastIndexOf(char, state.cursor.col - 1);
    if (index !== -1 && direction === "T") index += 1;
  }
  if (index >= 0 && index < line.length) {
    state.cursor.col = index;
    state.preferredCol = index;
  }
}

function runSearch(direction, includeCurrent = false) {
  if (!state.search) return false;
  const startLine = state.cursor.line;
  const startCol = includeCurrent ? state.cursor.col : state.cursor.col + direction;
  let line = startLine;
  let wrapped = false;

  while (true) {
    const text = state.buffer[line] ?? "";
    const index = direction > 0
      ? text.indexOf(state.search, line === startLine ? Math.max(0, startCol) : 0)
      : text.lastIndexOf(state.search, line === startLine ? Math.max(0, startCol) : text.length);
    if (index !== -1) {
      state.cursor = { line, col: index };
      state.preferredCol = index;
      return true;
    }

    line += direction;
    if (line < 0) {
      line = state.buffer.length - 1;
      wrapped = true;
    }
    if (line >= state.buffer.length) {
      line = 0;
      wrapped = true;
    }
    if (line === startLine && wrapped) return false;
  }
}

function enterInsert(command) {
  if (command === "I") state.cursor.col = firstNonBlank(currentLine());
  if (command === "a") state.cursor.col = Math.min(currentLine().length, state.cursor.col + 1);
  if (command === "A") state.cursor.col = currentLine().length;
  if (command === "o") {
    state.buffer.splice(state.cursor.line + 1, 0, "");
    state.cursor.line += 1;
    state.cursor.col = 0;
  }
  if (command === "O") {
    state.buffer.splice(state.cursor.line, 0, "");
    state.cursor.col = 0;
  }
  state.mode = "INSERT";
}

function executeSingle(command, count) {
  if (command === "x") repeat(count, () => deleteRange(state.cursor.line, state.cursor.col, state.cursor.line, state.cursor.col + 1));
  if (command === "D") deleteRange(state.cursor.line, state.cursor.col, state.cursor.line, currentLine().length);
  if (command === "C") {
    deleteRange(state.cursor.line, state.cursor.col, state.cursor.line, currentLine().length);
    state.mode = "INSERT";
  }
  if (command === "u") restoreUndo();
  if (command === "p" || command === "P") paste(command);
  if (command === "n" || command === "N") {
    const found = runSearch(command === "n" ? 1 : -1);
    state.message = found ? `Found ${state.search}.` : "No search match.";
  }
}

function executeLineOp(command, count) {
  const start = state.cursor.line;
  const end = clamp(start + count - 1, 0, state.buffer.length - 1);
  const lines = state.buffer.slice(start, end + 1);

  if (command === "yy") {
    state.yank = { text: lines.join("\n"), type: "line" };
    return;
  }

  if (command === "dd") {
    state.yank = { text: lines.join("\n"), type: "line" };
    state.buffer.splice(start, lines.length);
    if (state.buffer.length === 0) state.buffer.push("");
    state.cursor.line = clamp(start, 0, state.buffer.length - 1);
    state.cursor.col = 0;
  }

  if (command === "cc") {
    state.yank = { text: lines.join("\n"), type: "line" };
    state.buffer.splice(start, lines.length, "");
    state.cursor.line = start;
    state.cursor.col = 0;
    state.mode = "INSERT";
  }
}

function executeOperatorMotion(operator, motion) {
  if (operator === "y") {
    if (motion === "w") {
      const range = wordRange();
      state.yank = { text: range ? currentLine().slice(range.start, range.end) : "", type: "char" };
    } else {
      state.yank = { text: collectMotionText(motion), type: "char" };
    }
    return;
  }
  if (operator === "c" && motion === "w") {
    const range = wordRange();
    if (range) deleteRange(state.cursor.line, range.start, state.cursor.line, range.end);
    state.mode = "INSERT";
    return;
  }
  if (operator === "d" || operator === "c") {
    deleteMotion(motion);
    if (operator === "c") state.mode = "INSERT";
  }
}

function executeTextObject(operator, modifier, object) {
  const range = textObjectRange(object, modifier);
  if (!range) {
    state.message = `No ${object} text object here.`;
    return;
  }

  state.yank = { text: currentLine().slice(range.start, range.end), type: "char" };
  if (operator === "d" || operator === "c") {
    deleteRange(state.cursor.line, range.start, state.cursor.line, range.end);
    if (operator === "c") state.mode = "INSERT";
  }
}

function deleteMotion(motion) {
  if (motion === "$") {
    deleteRange(state.cursor.line, state.cursor.col, state.cursor.line, currentLine().length);
    return;
  }
  if (motion === "0") {
    deleteRange(state.cursor.line, 0, state.cursor.line, state.cursor.col);
    state.cursor.col = 0;
    return;
  }
  if (motion === "w") {
    const range = forwardWordRange();
    deleteRange(state.cursor.line, range.start, state.cursor.line, range.end);
  }
}

function collectMotionText(motion) {
  if (motion === "$") return currentLine().slice(state.cursor.col);
  if (motion === "0") return currentLine().slice(0, state.cursor.col);
  if (motion === "w") {
    const range = forwardWordRange();
    return currentLine().slice(range.start, range.end);
  }
  return "";
}

function forwardWordRange() {
  const start = state.cursor.col;
  let end = currentLine().length;
  for (let col = start + 1; col < currentLine().length; col += 1) {
    if (WORD.test(currentLine()[col]) && !WORD.test(currentLine()[col - 1])) {
      end = col;
      break;
    }
  }
  return { start, end };
}

function textObjectRange(object, modifier) {
  if (object === "w") return wordRange();
  const pairs = { "\"": "\"", "'": "'", "`": "`", "(": ")", ")": ")", "[": "]", "]": "]", "{": "}", "}": "}" };
  const close = pairs[object];
  if (!close) return null;
  const open = ["}", "]", ")"].includes(object) ? { "}": "{", "]": "[", ")": "(" }[object] : object;
  const line = currentLine();
  let left = line.lastIndexOf(open, state.cursor.col);
  let right = line.indexOf(close, Math.max(state.cursor.col, left + 1));

  if (left === -1 || right === -1 || right === left) {
    left = line.indexOf(open, state.cursor.col);
    right = left === -1 ? -1 : line.indexOf(close, left + 1);
  }
  if (left === -1 || right === -1 || right === left) return null;
  return modifier === "a" ? { start: left, end: right + 1 } : { start: left + 1, end: right };
}

function wordRange() {
  const line = currentLine();
  if (!line.length) return null;
  let start = Math.min(state.cursor.col, line.length - 1);
  while (start > 0 && WORD.test(line[start - 1])) start -= 1;
  let end = Math.min(state.cursor.col, line.length - 1);
  while (end < line.length && WORD.test(line[end])) end += 1;
  return start === end ? null : { start, end };
}

function replaceChars(char, count) {
  const line = currentLine();
  const start = state.cursor.col;
  const end = Math.min(line.length, start + count);
  state.buffer[state.cursor.line] = line.slice(0, start) + char.repeat(end - start) + line.slice(end);
}

function paste(command) {
  if (!state.yank.text) return;
  const lines = state.yank.text.split("\n");
  if (state.yank.type === "line" || lines.length > 1) {
    const insertAt = command === "p" ? state.cursor.line + 1 : state.cursor.line;
    state.buffer.splice(insertAt, 0, ...lines);
    state.cursor.line = insertAt;
    state.cursor.col = 0;
    return;
  }
  const line = currentLine();
  const col = command === "p" ? state.cursor.col + 1 : state.cursor.col;
  state.buffer[state.cursor.line] = line.slice(0, col) + state.yank.text + line.slice(col);
  state.cursor.col = col;
}

function insertBackspace() {
  if (state.cursor.col > 0) {
    const line = currentLine();
    state.buffer[state.cursor.line] = line.slice(0, state.cursor.col - 1) + line.slice(state.cursor.col);
    state.cursor.col -= 1;
  } else if (state.cursor.line > 0) {
    const prevLength = state.buffer[state.cursor.line - 1].length;
    state.buffer[state.cursor.line - 1] += currentLine();
    state.buffer.splice(state.cursor.line, 1);
    state.cursor.line -= 1;
    state.cursor.col = prevLength;
  }
  state.preferredCol = state.cursor.col;
  state.message = "Backspace.";
}

function deleteRange(startLine, startCol, endLine, endCol) {
  if (startLine !== endLine) return;
  const line = state.buffer[startLine] ?? "";
  state.yank = { text: line.slice(startCol, endCol), type: "char" };
  state.buffer[startLine] = line.slice(0, startCol) + line.slice(endCol);
  state.cursor = { line: startLine, col: Math.min(startCol, state.buffer[startLine].length) };
  state.preferredCol = state.cursor.col;
}

function saveUndo() {
  state.undo.push({
    buffer: [...state.buffer],
    cursor: { ...state.cursor },
    mode: state.mode
  });
  if (state.undo.length > 60) state.undo.shift();
}

function restoreUndo() {
  const previous = state.undo.pop();
  if (!previous) {
    state.message = "Nothing to undo.";
    return;
  }
  state.buffer = previous.buffer;
  state.cursor = previous.cursor;
  state.mode = previous.mode;
  state.message = "Undo restored previous state.";
}

function qualityNotes() {
  const notes = [];
  const mission = currentMission();
  const simpleMoves = state.history.filter((entry) => /^[hjkl]$/.test(entry.keys)).length;
  const usedSearch = state.history.some((entry) => entry.keys.startsWith("/"));
  const usedSubstitute = state.history.some((entry) => entry.keys.startsWith(":%s"));

  if (state.finished && state.commandCount <= mission.par) notes.push({ type: "good", text: "Clean room clear: inside par." });
  if (state.finished && state.commandCount > mission.par) notes.push({ type: "warn", text: "Room clear, but try for fewer commands on replay." });
  if (simpleMoves >= 7) notes.push({ type: "warn", text: "Lots of h/j/k/l. Look for search, word motions, or text objects." });
  if (usedSearch) notes.push({ type: "good", text: "Good habit: search jumped to intent instead of scanning manually." });
  if (usedSubstitute) notes.push({ type: "good", text: "Global substitution used for a mechanical refactor." });
  if (state.hintsUsed > 0) notes.push({ type: "warn", text: `${state.hintsUsed} tactic hint${state.hintsUsed > 1 ? "s" : ""} used.` });
  if (notes.length === 0) notes.push({ type: "good", text: "No issues yet. Edit until all systems turn green." });
  return notes;
}

function debriefMessage() {
  const mission = currentMission();
  if (state.commandCount <= mission.par) return `${mission.title} repaired in ${state.commandCount} commands. Efficient and practical.`;
  return `${mission.title} repaired in ${state.commandCount} commands. Correct result; replay for command economy.`;
}

function hintText() {
  const mission = currentMission();
  if (state.hintsUsed === 0) return "";
  return mission.hints[Math.min(state.hintsUsed - 1, mission.hints.length - 1)];
}

function activeCommandLabel() {
  if (state.mode === "SEARCH") return `/${state.input}`;
  if (state.mode === "COMMAND") return `:${state.input}`;
  return state.pending || "-";
}

function addHistory(keys, label) {
  state.history.push({ keys, label });
}

function currentMission() {
  return missions[state.missionIndex];
}

function currentLine() {
  return state.buffer[state.cursor.line] ?? "";
}

function bufferText(s = state) {
  return s.buffer.join("\n");
}

function hasLine(s, expected) {
  return s.buffer.some((line) => line === expected);
}

function countLines(s, pattern) {
  return s.buffer.filter((line) => pattern.test(line)).length;
}

function findLine(s, needle) {
  return s.buffer.findIndex((line) => line.includes(needle));
}

function onWord(s, needle) {
  const line = s.buffer[s.cursor.line] ?? "";
  return line.slice(s.cursor.col, s.cursor.col + needle.length) === needle;
}

function lineMax(s, line) {
  return Math.max(0, (s.buffer[line]?.length ?? 1) - 1);
}

function firstNonBlank(line) {
  const index = line.search(/\S/);
  return index === -1 ? 0 : index;
}

function clampCursor() {
  state.cursor.line = clamp(state.cursor.line, 0, state.buffer.length - 1);
  const max = state.mode === "INSERT" ? currentLine().length : lineMax(state, state.cursor.line);
  state.cursor.col = clamp(state.cursor.col, 0, max);
  state.preferredCol = clamp(state.preferredCol, 0, max);
}

function normalizeKey(key) {
  if (key === "Esc") return "Escape";
  if (key === "Space") return " ";
  if (["Shift", "Control", "Alt", "Meta", "CapsLock"].includes(key)) return "";
  return key;
}

function describeMotion(motion, count) {
  const labels = {
    h: "Move left",
    j: "Move down",
    k: "Move up",
    l: "Move right",
    w: "Next word",
    b: "Previous word",
    e: "End of word",
    0: "Line start",
    "$": "Line end",
    "^": "First nonblank"
  };
  return `${labels[motion]}${count > 1 ? ` x${count}` : ""}`;
}

function describeSingle(command) {
  return {
    x: "Delete character",
    D: "Delete to line end",
    C: "Change to line end",
    u: "Undo",
    p: "Paste after",
    P: "Paste before",
    n: "Repeat search",
    N: "Reverse search"
  }[command];
}

function describeLineOp(command) {
  return {
    dd: "Delete line",
    yy: "Yank line",
    cc: "Change line"
  }[command];
}

function couldStillMatch(cmd) {
  return /^(g|[fFtTrdcy]|[dcy][ia]?|[dcy][ia][\"'`(){}\[\]]?)$/.test(cmd);
}

function clearGroup(group) {
  while (group.children.length) {
    const child = group.children.pop();
    disposeObject(child);
  }
}

function disposeObject(object) {
  object.traverse((child) => {
    child.geometry?.dispose();
    if (Array.isArray(child.material)) child.material.forEach((mat) => mat.dispose());
    else child.material?.dispose();
  });
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function wrap(value, max) {
  return ((value % max) + max) % max;
}

function repeat(count, fn) {
  for (let i = 0; i < count; i += 1) fn();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function animate() {
  const time = clock.getElapsedTime();
  animateCyberArena(arena, systemNodes, time, camera);
  alarmLight.intensity = 95 + Math.sin(time * 4) * 20;
  camera.lookAt(0, 1.48, -2.62);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

function setupMobileKeys() {
  const keys = ["Esc", "/", ":", "Enter", "Space", "h", "j", "k", "l", "w", "b", "e", "0", "$", "g", "G", "f", "d", "c", "y", "x", "i", "a", "A", "o", "p", "u", "\""];
  els.mobileKeys.innerHTML = keys.map((key) => `<button type="button" data-key="${key}">${escapeHtml(key)}</button>`).join("");
  els.mobileKeys.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (button) handleKey(button.dataset.key);
  });
}

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() !== "r") return;
  event.preventDefault();
  handleKey(event.key);
});

els.start.addEventListener("click", () => {
  state.active = true;
  els.boot.classList.add("hidden");
  els.editor.focus();
  state.message = "Simulation live. Repair the buffer.";
  updateHud();
});

els.hintButton.addEventListener("click", () => {
  state.hintsUsed = Math.min(state.hintsUsed + 1, currentMission().hints.length);
  state.message = "Tactic hint revealed.";
  updateHud();
});

els.restart.addEventListener("click", () => startMission(state.missionIndex));
els.prev.addEventListener("click", () => startMission(state.missionIndex - 1));
els.next.addEventListener("click", () => startMission(state.missionIndex + 1));

window.addEventListener("resize", resize);

setupMobileKeys();
resize();
startMission(0);
animate();
