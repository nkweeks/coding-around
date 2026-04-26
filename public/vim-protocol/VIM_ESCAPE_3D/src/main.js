import * as THREE from "https://unpkg.com/three@0.165.0/build/three.module.js";

const IMAGE_ROOT = "../images/";
const WORD = /[A-Za-z0-9_]/;

const characters = {
  zero: {
    name: "ZERO",
    title: "The Architect",
    color: 0x9d4edd,
    portrait: `${IMAGE_ROOT}robot_happy.jpg`
  },
  byte: {
    name: "BYTE",
    title: "AI Analysis Unit",
    color: 0x54dcff,
    portrait: `${IMAGE_ROOT}robot_happy.jpg`
  },
  blade: {
    name: "BLADE",
    title: "Shadow Operative",
    color: 0xff3fa4,
    portrait: `${IMAGE_ROOT}ninja.jpg`
  },
  shell: {
    name: "SHELL",
    title: "Veteran Operator",
    color: 0x5bff98,
    portrait: `${IMAGE_ROOT}shell2.jpg`
  }
};

const missions = [
  {
    title: "First Contact",
    focus: ["h", "j", "k", "l"],
    guide: "byte",
    briefing: "The NEXUS floor grid is a live buffer. Move the cursor-agent with h, j, k, and l until your body understands the home row before the mission becomes dangerous.",
    buffer: [
      "// NEXUS_TRAINING_GRID.log",
      ">> breach detected",
      ">> move to TARGET",
      ">> [TARGET] access point alpha",
      ">> use h j k l only",
      ">> [CHECKPOINT] return vector",
      "mission_state = AWAITING_AGENT"
    ],
    cursor: { line: 0, col: 0 },
    objectives: [
      {
        text: "Press j twice to descend to line 3.",
        hint: "j moves down. Keep your index finger on home row.",
        target: { line: 2, col: 0 },
        check: (s) => s.cursor.line === 2
      },
      {
        text: "Move down to the [TARGET] line.",
        hint: "One more j reaches the access point.",
        target: { line: 3, col: 3 },
        check: (s) => s.cursor.line === 3
      },
      {
        text: "Use l until your cursor touches TARGET.",
        hint: "l moves right across the line.",
        target: { line: 3, col: 4 },
        check: (s) => s.cursor.line === 3 && s.cursor.col === 4
      },
      {
        text: "Descend to the [CHECKPOINT] line.",
        hint: "Use j until the checkpoint row lights up.",
        target: (s) => textTarget(s, "CHECKPOINT"),
        check: (s) => s.cursor.line === 5
      },
      {
        text: "Use k to climb back to the practice line.",
        hint: "k moves up. Vim navigation is reversible.",
        target: { line: 4, col: 0 },
        check: (s) => s.cursor.line === 4
      }
    ]
  },
  {
    title: "Word Runner",
    focus: ["w", "b", "e"],
    guide: "blade",
    briefing: "Code is not crossed one character at a time. Words are rooftops. Leap with w, retreat with b, and land on the edge with e.",
    buffer: [
      "// INTERCEPTED_TRANSMISSION.txt",
      "Agent codename SHADOW reporting in",
      "Priority keywords ACCESS BREACH NEXUS",
      "System MONITOR detected intrusion"
    ],
    cursor: { line: 1, col: 0 },
    objectives: [
      {
        text: "Use w to jump to codename.",
        hint: "w advances to the next word start.",
        target: (s) => textTarget(s, "codename"),
        check: (s) => onText(s, "codename")
      },
      {
        text: "Continue with w until you reach SHADOW.",
        hint: "Stop when the cursor sits on the S.",
        target: (s) => textTarget(s, "SHADOW"),
        check: (s) => onText(s, "SHADOW")
      },
      {
        text: "Use w to reach NEXUS on the next line.",
        hint: "w crosses line breaks when the next word is below.",
        target: (s) => textTarget(s, "NEXUS"),
        check: (s) => onText(s, "NEXUS")
      },
      {
        text: "Use b to retreat to BREACH.",
        hint: "b moves back to the previous word start.",
        target: (s) => textTarget(s, "BREACH"),
        check: (s) => onText(s, "BREACH")
      }
    ]
  },
  {
    title: "Line Hopper",
    focus: ["0", "$", "gg", "G", "5G"],
    guide: "zero",
    briefing: "Real files are vertical cities. Jump to roof, basement, line starts, and line ends without walking the stairs.",
    buffer: [
      "[NEXUS_DATABASE_SCAN]",
      ">>START_MARKER<< Begin scan here",
      "Record_001: encrypted user block",
      "Record_002: public access ok",
      "Record_003: admin credentials",
      "Record_004: surveillance relay",
      ">>END_MARKER<< Scan complete"
    ],
    cursor: { line: 3, col: 12 },
    objectives: [
      {
        text: "Use gg to jump to the first line.",
        hint: "g then g means go to the top.",
        target: { line: 0, col: 0 },
        check: (s) => s.cursor.line === 0
      },
      {
        text: "Use G to jump to the final line.",
        hint: "Shift+G goes to the bottom unless you give it a number.",
        target: (s) => ({ line: s.buffer.length - 1, col: 0 }),
        check: (s) => s.cursor.line === s.buffer.length - 1
      },
      {
        text: "Use $ to hit the end marker.",
        hint: "$ lands on the last character of the current line.",
        target: (s) => ({ line: s.cursor.line, col: lineMax(s, s.cursor.line) }),
        check: (s) => s.cursor.col === lineMax(s, s.cursor.line)
      },
      {
        text: "Use 0 to return to the line start.",
        hint: "0 is the origin column.",
        target: (s) => ({ line: s.cursor.line, col: 0 }),
        check: (s) => s.cursor.col === 0
      },
      {
        text: "Use 5G to jump directly to line 5.",
        hint: "Number plus G targets a specific line.",
        target: { line: 4, col: 0 },
        check: (s) => s.cursor.line === 4
      }
    ]
  },
  {
    title: "Target Lock",
    focus: ["f", "F", "t", "T"],
    guide: "blade",
    briefing: "Character search is how experts thread tight syntax. Lock onto braces, quotes, commas, and operators before editing.",
    buffer: [
      "// NEXUS_AUTH_MODULE.js",
      "function authenticate(user, pass) {",
      "  const hash = encrypt(pass, 'SALT_KEY');",
      "  return verify(user, hash) && log(user);",
      "}",
      "const SECRET = 'NEXUS_OVERRIDE_2026';"
    ],
    cursor: { line: 1, col: 0 },
    objectives: [
      {
        text: "Use f( to find the opening parenthesis.",
        hint: "f finds a character forward on this line.",
        target: (s) => charTarget(s, 1, "("),
        check: (s) => charAtCursor(s) === "("
      },
      {
        text: "Use f{ to lock onto the opening brace.",
        hint: "Stay on the function line and search forward again.",
        target: (s) => charTarget(s, 1, "{"),
        check: (s) => s.cursor.line === 1 && charAtCursor(s) === "{"
      },
      {
        text: "Move to line 3 and use f' to find the quote.",
        hint: "Use j to descend, then f followed by a single quote.",
        target: (s) => charTarget(s, 2, "'"),
        check: (s) => s.cursor.line === 2 && charAtCursor(s) === "'"
      },
      {
        text: "Use T, to stop just after the previous comma.",
        hint: "T searches backward and lands till the target.",
        target: { line: 2, col: 28 },
        check: (s) => s.cursor.line === 2 && s.cursor.col === 28
      }
    ]
  },
  {
    title: "Edit Breach",
    focus: ["x", "dw", "D", "dd", "u"],
    guide: "shell",
    briefing: "Navigation is only half the job. Now remove bad code with small, reversible edits. Precision deletion is practical Vim.",
    buffer: [
      "NEXUS_SURVEILLANCE v2.0",
      "TRACK = trZue; // remove this comment",
      "LOG = true;",
      "DELETE_THIS_LINE",
      "function spy() { return true; }",
      "export { LOG };"
    ],
    cursor: { line: 1, col: 10 },
    objectives: [
      {
        text: "Press x to delete the rogue Z in trZue.",
        hint: "x deletes the character under the cursor.",
        target: { line: 1, col: 10 },
        check: (s) => s.buffer[1].includes("true") && !s.buffer[1].includes("Z")
      },
      {
        text: "Use f/ then D to delete the comment.",
        hint: "Find the slash, then D deletes to end of line.",
        target: (s) => charTarget(s, 1, "/"),
        check: (s) => !s.buffer[1].includes("//")
      },
      {
        text: "Delete DELETE_THIS_LINE with dd.",
        hint: "Move to the line and press d twice.",
        target: (s) => textTarget(s, "DELETE_THIS_LINE"),
        check: (s) => !s.buffer.some((line) => line.includes("DELETE_THIS_LINE"))
      },
      {
        text: "Delete the word spy with dw.",
        hint: "Put the cursor on the s in spy before pressing dw.",
        target: (s) => textTarget(s, "spy"),
        check: (s) => !s.buffer.some((line) => line.includes("spy"))
      }
    ]
  },
  {
    title: "Patch Bay",
    focus: ["i", "A", "o", "cw", "yy", "p"],
    guide: "byte",
    briefing: "The final room mixes practical editing: enter insert mode, append config, open lines, change words, yank a known-good row, and paste it where the system expects it.",
    buffer: [
      "// payload.config",
      "target = NEXUS_CORE",
      "mode = observe",
      "token = ACCESS_OK",
      "",
      "// duplicate token below"
    ],
    cursor: { line: 2, col: 7 },
    objectives: [
      {
        text: "Use cw to change observe into disable.",
        hint: "Press cw, type disable, then Escape.",
        target: (s) => textTarget(s, "observe"),
        check: (s) => s.buffer[2].includes("disable")
      },
      {
        text: "Use A to append ; verified to the token line.",
        hint: "Move to token, press A, type ; verified, then Escape.",
        target: (s) => textTarget(s, "ACCESS_OK"),
        check: (s) => s.buffer[3].endsWith("; verified")
      },
      {
        text: "Use yy on the token line and p below the comment.",
        hint: "yy copies a line. p pastes below the current line.",
        target: { line: 5, col: 0 },
        check: (s) => s.buffer.filter((line) => line.includes("token = ACCESS_OK")).length >= 2
      },
      {
        text: "Use o to open a final line and type escape = true.",
        hint: "o opens below and enters INSERT mode. Escape returns to NORMAL.",
        target: (s) => ({ line: s.buffer.length - 1, col: lineMax(s, s.buffer.length - 1) }),
        check: (s) => s.buffer.some((line) => line.trim() === "escape = true") && s.mode === "NORMAL"
      }
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
  strokes: document.querySelector("#strokes-label"),
  objectiveIndex: document.querySelector("#objective-index"),
  objectiveText: document.querySelector("#objective-text"),
  objectiveHint: document.querySelector("#objective-hint"),
  editor: document.querySelector("#editor"),
  cursorLabel: document.querySelector("#cursor-label"),
  message: document.querySelector("#message-label"),
  drawer: document.querySelector("#drawer"),
  guideName: document.querySelector("#guide-name"),
  guidePortrait: document.querySelector("#guide-portrait"),
  briefing: document.querySelector("#briefing-text"),
  commandLog: document.querySelector("#command-log"),
  boot: document.querySelector("#boot-panel"),
  start: document.querySelector("#start-game"),
  prev: document.querySelector("#prev-mission"),
  next: document.querySelector("#next-mission"),
  restart: document.querySelector("#restart-mission"),
  logButton: document.querySelector("#log-button"),
  drawerToggle: document.querySelector("#drawer-toggle"),
  mobileKeys: document.querySelector("#mobile-keys")
};

const state = {
  missionIndex: 0,
  objectiveIndex: 0,
  buffer: [],
  cursor: { line: 0, col: 0 },
  preferredCol: 0,
  mode: "NORMAL",
  keySeq: "",
  commandCount: 0,
  history: [],
  undo: [],
  yank: "",
  yankType: "char",
  message: "",
  active: false,
  finished: false
};

const renderer = new THREE.WebGLRenderer({
  canvas: els.canvas,
  antialias: true,
  alpha: true,
  powerPreference: "high-performance"
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05080f, 0.035);

const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 120);
camera.position.set(0, 10.5, 16);

const clock = new THREE.Clock();
const world = new THREE.Group();
const markers = new THREE.Group();
scene.add(world, markers);

const player = createPlayer();
const targetBeacon = createBeacon();
scene.add(player, targetBeacon);

const ambient = new THREE.HemisphereLight(0x8be8ff, 0x07111a, 1.6);
const keyLight = new THREE.DirectionalLight(0xffffff, 1.9);
keyLight.position.set(6, 10, 6);
const rimLight = new THREE.PointLight(0xff3fa4, 90, 28);
rimLight.position.set(-7, 5, -7);
scene.add(ambient, keyLight, rimLight);

const rayFloor = new THREE.GridHelper(32, 32, 0x54dcff, 0x143344);
rayFloor.material.transparent = true;
rayFloor.material.opacity = 0.3;
scene.add(rayFloor);

const textureLoader = new THREE.TextureLoader();
const billboards = new THREE.Group();
scene.add(billboards);

function createPlayer() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.28, 0.72, 6, 12),
    new THREE.MeshStandardMaterial({
      color: 0x54dcff,
      emissive: 0x0f5c7a,
      roughness: 0.34,
      metalness: 0.18
    })
  );
  body.position.y = 0.72;
  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.08, 0.08),
    new THREE.MeshBasicMaterial({ color: 0xe8fbff })
  );
  visor.position.set(0, 1.15, 0.25);
  group.add(body, visor);
  return group;
}

function createBeacon() {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.55, 0.025, 8, 40),
    new THREE.MeshBasicMaterial({ color: 0xffd166 })
  );
  ring.rotation.x = Math.PI / 2;
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.28, 0.9, 4),
    new THREE.MeshBasicMaterial({ color: 0xff3fa4, wireframe: true })
  );
  cone.position.y = 1.0;
  group.add(ring, cone);
  return group;
}

function startMission(index) {
  const mission = missions[wrap(index, missions.length)];
  state.missionIndex = wrap(index, missions.length);
  state.objectiveIndex = 0;
  state.buffer = [...mission.buffer];
  state.cursor = { ...mission.cursor };
  state.preferredCol = state.cursor.col;
  state.mode = "NORMAL";
  state.keySeq = "";
  state.commandCount = 0;
  state.history = [];
  state.undo = [];
  state.yank = "";
  state.yankType = "char";
  state.message = "NORMAL mode ready.";
  state.finished = false;
  rebuildWorld();
  updateAll();
}

function rebuildWorld() {
  clearGroup(world);
  clearGroup(markers);
  clearGroup(billboards);

  const mission = currentMission();
  const rows = mission.buffer.length;
  const width = Math.max(...mission.buffer.map((line) => line.length), 24);

  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(17, 0.16, rows * 1.18 + 2.6),
    new THREE.MeshStandardMaterial({
      color: 0x08131e,
      roughness: 0.72,
      metalness: 0.22
    })
  );
  floor.position.y = -0.1;
  world.add(floor);

  for (let line = 0; line < rows; line += 1) {
    const row = new THREE.Mesh(
      new THREE.BoxGeometry(15.5, 0.04, 0.74),
      new THREE.MeshBasicMaterial({
        color: line % 2 ? 0x123247 : 0x0d2232,
        transparent: true,
        opacity: 0.62
      })
    );
    row.position.set(0, 0.02, lineToZ(line, rows));
    world.add(row);

    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(15.5, 0.035, 0.035),
      new THREE.MeshBasicMaterial({ color: 0x1b7893, transparent: true, opacity: 0.5 })
    );
    rail.position.set(0, 0.08, lineToZ(line, rows) - 0.38);
    world.add(rail);
  }

  for (const objective of mission.objectives) {
    const target = resolveTarget(objective);
    if (!target) continue;
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.06, 16),
      new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.45 })
    );
    const pos = cursorToWorld(target.line, target.col, width, rows);
    pad.position.set(pos.x, 0.08, pos.z);
    markers.add(pad);
  }

  addBillboard(characters.byte.portrait, -7.4, 2.4, lineToZ(1, rows), 0x54dcff);
  addBillboard(characters.blade.portrait, 7.4, 2.4, lineToZ(Math.max(rows - 2, 1), rows), 0xff3fa4);
}

function addBillboard(src, x, y, z, color) {
  textureLoader.load(src, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    const card = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.4), mat);
    card.position.set(x, y, z);
    card.lookAt(camera.position);
    billboards.add(card);

    const frame = new THREE.Mesh(
      new THREE.PlaneGeometry(2.34, 1.54),
      new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.8 })
    );
    frame.position.set(x, y, z - 0.01);
    frame.lookAt(camera.position);
    billboards.add(frame);
  });
}

function updateAll() {
  clampCursor();
  checkObjective();
  updateHud();
  renderEditor();
  updateTargetBeacon();
  updatePlayerPosition();
}

function updateHud() {
  const mission = currentMission();
  const guide = characters[mission.guide];
  const objective = currentObjective();
  els.missionKicker.textContent = `MISSION ${String(state.missionIndex + 1).padStart(2, "0")}`;
  els.missionTitle.textContent = mission.title;
  els.focusStrip.innerHTML = mission.focus.map((key) => `<span>${escapeHtml(key)}</span>`).join("");
  els.mode.textContent = state.mode;
  els.keys.textContent = state.keySeq || "-";
  els.strokes.textContent = String(state.commandCount);
  els.objectiveIndex.textContent = `${String(Math.min(state.objectiveIndex + 1, mission.objectives.length)).padStart(2, "0")}/${String(mission.objectives.length).padStart(2, "0")}`;
  els.objectiveText.textContent = state.finished ? "Mission clear. The exit gate is open." : objective.text;
  els.objectiveHint.textContent = state.finished ? "Advance to the next room or replay this one for efficiency." : objective.hint;
  els.cursorLabel.textContent = `L${state.cursor.line + 1} C${state.cursor.col}`;
  els.message.textContent = state.message;
  els.guideName.textContent = guide.name;
  els.guidePortrait.src = guide.portrait;
  els.guidePortrait.alt = `${guide.name} portrait`;
  els.briefing.textContent = mission.briefing;
  els.commandLog.innerHTML = state.history.slice(-9).reverse().map((entry) => (
    `<div class="command-log-item"><strong>${escapeHtml(entry.keys)}</strong> ${escapeHtml(entry.label)}</div>`
  )).join("");
  els.next.disabled = state.missionIndex === missions.length - 1 && !state.finished;
}

function renderEditor() {
  els.editor.innerHTML = state.buffer.map((line, lineIndex) => {
    const isCursorLine = lineIndex === state.cursor.line;
    const targetLine = currentObjective() && resolveTarget(currentObjective())?.line === lineIndex;
    let output = "";

    if (isCursorLine) {
      const col = Math.min(state.cursor.col, line.length);
      const before = escapeHtml(line.slice(0, col));
      const char = line[col] ?? " ";
      const after = escapeHtml(line.slice(col + (line[col] ? 1 : 0)));
      const cursorClass = state.mode === "INSERT" ? "cursor insert" : "cursor";
      const cursorText = state.mode === "INSERT" ? "" : escapeHtml(char);
      output = `${before}<span class="${cursorClass}">${cursorText}</span>${after}`;
    } else {
      output = escapeHtml(line);
    }

    return `<div class="editor-line ${targetLine ? "complete-line" : ""}">
      <span class="line-number">${lineIndex + 1}</span>
      <span class="line-text">${output || " "}</span>
    </div>`;
  }).join("");
}

function checkObjective() {
  if (state.finished) return;
  const objective = currentObjective();
  if (!objective || !objective.check(state)) return;

  const label = objective.text.replace(/\.$/, "");
  state.history.push({ keys: state.keySeq || "✓", label });
  state.objectiveIndex += 1;

  if (state.objectiveIndex >= currentMission().objectives.length) {
    state.finished = true;
    state.message = `${currentMission().title} complete in ${state.commandCount} strokes.`;
    pulseScene(0x5bff98);
  } else {
    state.message = "Objective complete. Next gate armed.";
    pulseScene(0xffd166);
  }
}

function handleKey(key) {
  if (!state.active) return;

  if (state.mode === "INSERT") {
    handleInsertKey(key);
  } else {
    handleNormalKey(key);
  }

  updateAll();
}

function handleNormalKey(key) {
  if (key === "Escape") {
    state.keySeq = "";
    state.message = "Command cleared.";
    return;
  }

  state.keySeq += key;
  const parsed = parseCommand(state.keySeq);

  if (parsed.status === "pending") {
    state.message = `Pending: ${state.keySeq}`;
    return;
  }

  if (parsed.status === "invalid") {
    state.message = `Unknown command: ${state.keySeq}`;
    state.keySeq = "";
    return;
  }

  executeCommand(parsed);
  state.commandCount += 1;
  state.history.push({ keys: state.keySeq, label: parsed.label });
  state.keySeq = "";
}

function handleInsertKey(key) {
  if (key === "Escape") {
    state.mode = "NORMAL";
    state.cursor.col = Math.max(0, Math.min(state.cursor.col - 1, lineMax(state, state.cursor.line)));
    state.preferredCol = state.cursor.col;
    state.commandCount += 1;
    state.history.push({ keys: "Esc", label: "Return to NORMAL mode" });
    state.message = "Back in NORMAL mode.";
    return;
  }

  saveUndo();

  if (key === "Backspace") {
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
    state.message = "Insert backspace.";
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
  state.message = "Typing payload...";
}

function parseCommand(sequence) {
  const match = sequence.match(/^([1-9]\d*)(.*)$/);
  const count = match ? Number(match[1]) : 1;
  const cmd = match ? match[2] : sequence;

  if (match && cmd === "") return { status: "pending" };
  if (cmd === "g" || ["f", "F", "t", "T", "r", "d", "c", "y"].includes(cmd)) return { status: "pending" };
  if (/^[dcy][ia]$/.test(cmd)) return { status: "pending" };
  if (/^[dcy][fFtT]$/.test(cmd)) return { status: "pending" };

  if (cmd === "gg") return { status: "complete", type: "goto", line: count - 1, label: "Jump to top or counted line" };
  if (cmd === "G") return { status: "complete", type: "goto", line: count > 1 ? count - 1 : "last", label: "Jump to bottom or counted line" };
  if (["h", "j", "k", "l", "w", "b", "e", "0", "$", "^"].includes(cmd)) {
    return { status: "complete", type: "motion", motion: cmd, count, label: describeMotion(cmd, count) };
  }
  if (/^[fFtT].$/.test(cmd)) {
    return { status: "complete", type: "find", direction: cmd[0], char: cmd[1], count, label: `Find ${cmd[1]} with ${cmd[0]}` };
  }
  if (/^r.$/.test(cmd)) {
    return { status: "complete", type: "replace", char: cmd[1], count, label: `Replace character with ${cmd[1]}` };
  }
  if (["i", "I", "a", "A", "o", "O"].includes(cmd)) {
    return { status: "complete", type: "insertMode", command: cmd, label: `Enter INSERT with ${cmd}` };
  }
  if (["x", "D", "C", "u", "p", "P"].includes(cmd)) {
    return { status: "complete", type: "single", command: cmd, count, label: describeSingle(cmd) };
  }
  if (["dd", "yy", "cc"].includes(cmd)) {
    return { status: "complete", type: "lineOp", command: cmd, count, label: describeLineOp(cmd) };
  }
  if (/^[dcy](w|\$|0)$/.test(cmd)) {
    return { status: "complete", type: "operatorMotion", operator: cmd[0], motion: cmd[1], count, label: `${cmd[0]}${cmd[1]} operation` };
  }
  if (/^[dcy]iw$/.test(cmd)) {
    return { status: "complete", type: "innerWord", operator: cmd[0], count, label: `${cmd[0]}iw inner word` };
  }

  return couldStillMatch(cmd) ? { status: "pending" } : { status: "invalid" };
}

function executeCommand(cmd) {
  if (!["motion", "goto", "find"].includes(cmd.type)) saveUndo();

  switch (cmd.type) {
    case "motion":
      repeat(cmd.count, () => move(cmd.motion));
      break;
    case "goto":
      state.cursor.line = cmd.line === "last" ? state.buffer.length - 1 : clamp(cmd.line, 0, state.buffer.length - 1);
      clampCursor();
      break;
    case "find":
      repeat(cmd.count, () => findChar(cmd.direction, cmd.char));
      break;
    case "replace":
      replaceChars(cmd.char, cmd.count);
      break;
    case "insertMode":
      enterInsert(cmd.command);
      break;
    case "single":
      executeSingle(cmd.command, cmd.count);
      break;
    case "lineOp":
      executeLineOp(cmd.command, cmd.count);
      break;
    case "operatorMotion":
      executeOperatorMotion(cmd.operator, cmd.motion);
      break;
    case "innerWord":
      executeInnerWord(cmd.operator);
      break;
    default:
      break;
  }

  state.message = cmd.label;
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

  if (WORD.test(text[col] ?? "")) {
    while (col < text.length && WORD.test(text[col] ?? "")) col += 1;
  } else {
    col += 1;
  }

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
    const text = state.buffer[line];
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
    const text = state.buffer[line];
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
  if (command === "x") {
    repeat(count, () => deleteRange(state.cursor.line, state.cursor.col, state.cursor.line, state.cursor.col + 1));
  }
  if (command === "D") {
    deleteRange(state.cursor.line, state.cursor.col, state.cursor.line, currentLine().length);
  }
  if (command === "C") {
    deleteRange(state.cursor.line, state.cursor.col, state.cursor.line, currentLine().length);
    state.mode = "INSERT";
  }
  if (command === "u") restoreUndo();
  if (command === "p" || command === "P") paste(command);
}

function executeLineOp(command, count) {
  const start = state.cursor.line;
  const end = clamp(start + count - 1, 0, state.buffer.length - 1);
  const lines = state.buffer.slice(start, end + 1);

  if (command === "yy") {
    state.yank = lines.join("\n");
    state.yankType = "line";
    return;
  }

  if (command === "dd") {
    state.yank = lines.join("\n");
    state.yankType = "line";
    state.buffer.splice(start, lines.length);
    if (state.buffer.length === 0) state.buffer.push("");
    state.cursor.line = clamp(start, 0, state.buffer.length - 1);
    state.cursor.col = 0;
  }

  if (command === "cc") {
    state.yank = lines.join("\n");
    state.yankType = "line";
    state.buffer.splice(start, lines.length, "");
    state.cursor.line = start;
    state.cursor.col = 0;
    state.mode = "INSERT";
  }
}

function executeOperatorMotion(operator, motion) {
  if (operator === "y") {
    state.yank = collectMotionText(motion);
    state.yankType = "char";
    return;
  }
  if (operator === "d" || operator === "c") {
    deleteMotion(motion);
    if (operator === "c") state.mode = "INSERT";
  }
}

function executeInnerWord(operator) {
  const range = innerWordRange();
  if (!range) return;
  state.yank = currentLine().slice(range.start, range.end);
  state.yankType = "char";
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
    const range = forwardWordDeleteRange();
    deleteRange(state.cursor.line, range.start, range.line, range.end);
  }
}

function collectMotionText(motion) {
  if (motion === "$") return currentLine().slice(state.cursor.col);
  if (motion === "0") return currentLine().slice(0, state.cursor.col);
  if (motion === "w") {
    const range = forwardWordDeleteRange();
    return state.buffer[range.line].slice(range.start, range.end);
  }
  return "";
}

function forwardWordDeleteRange() {
  const startLine = state.cursor.line;
  const start = state.cursor.col;
  let end = currentLine().length;
  for (let col = start + 1; col < currentLine().length; col += 1) {
    if (WORD.test(currentLine()[col]) && !WORD.test(currentLine()[col - 1])) {
      end = col;
      break;
    }
  }
  return { line: startLine, start, end };
}

function replaceChars(char, count) {
  const line = currentLine();
  const start = state.cursor.col;
  const end = Math.min(line.length, start + count);
  state.buffer[state.cursor.line] = line.slice(0, start) + char.repeat(end - start) + line.slice(end);
}

function paste(command) {
  if (!state.yank) return;
  const lines = state.yank.split("\n");
  if (state.yankType === "line" || lines.length > 1) {
    const insertAt = command === "p" ? state.cursor.line + 1 : state.cursor.line;
    state.buffer.splice(insertAt, 0, ...lines);
    state.cursor.line = insertAt;
    state.cursor.col = 0;
    return;
  }
  const line = currentLine();
  const col = command === "p" ? state.cursor.col + 1 : state.cursor.col;
  state.buffer[state.cursor.line] = line.slice(0, col) + state.yank + line.slice(col);
  state.cursor.col = col;
}

function deleteRange(startLine, startCol, endLine, endCol) {
  if (startLine !== endLine) return;
  const line = state.buffer[startLine] ?? "";
  state.yank = line.slice(startCol, endCol);
  state.yankType = "char";
  state.buffer[startLine] = line.slice(0, startCol) + line.slice(endCol);
  state.cursor = { line: startLine, col: Math.min(startCol, lineMax(state, startLine)) };
  state.preferredCol = state.cursor.col;
}

function saveUndo() {
  state.undo.push({
    buffer: [...state.buffer],
    cursor: { ...state.cursor },
    mode: state.mode
  });
  if (state.undo.length > 50) state.undo.shift();
}

function restoreUndo() {
  const previous = state.undo.pop();
  if (!previous) return;
  state.buffer = previous.buffer;
  state.cursor = previous.cursor;
  state.mode = previous.mode;
  state.message = "Undo restored previous edit.";
}

function currentMission() {
  return missions[state.missionIndex];
}

function currentObjective() {
  return currentMission().objectives[Math.min(state.objectiveIndex, currentMission().objectives.length - 1)];
}

function currentLine() {
  return state.buffer[state.cursor.line] ?? "";
}

function textTarget(s, needle) {
  for (let line = 0; line < s.buffer.length; line += 1) {
    const col = s.buffer[line].indexOf(needle);
    if (col !== -1) return { line, col };
  }
  return null;
}

function charTarget(s, line, char) {
  const col = s.buffer[line]?.indexOf(char) ?? -1;
  return col === -1 ? null : { line, col };
}

function resolveTarget(objective) {
  if (!objective) return null;
  return typeof objective.target === "function" ? objective.target(state) : objective.target;
}

function onText(s, needle) {
  const target = textTarget(s, needle);
  return Boolean(target && s.cursor.line === target.line && s.cursor.col === target.col);
}

function charAtCursor(s) {
  return s.buffer[s.cursor.line]?.[s.cursor.col];
}

function lineMax(s, line) {
  return Math.max(0, (s.buffer[line]?.length ?? 1) - 1);
}

function firstNonBlank(line) {
  const index = line.search(/\S/);
  return index === -1 ? 0 : index;
}

function innerWordRange() {
  const line = currentLine();
  if (!line.length) return null;
  let start = Math.min(state.cursor.col, line.length - 1);
  while (start > 0 && WORD.test(line[start - 1])) start -= 1;
  let end = Math.min(state.cursor.col, line.length - 1);
  while (end < line.length && WORD.test(line[end])) end += 1;
  return start === end ? null : { start, end };
}

function clampCursor() {
  state.cursor.line = clamp(state.cursor.line, 0, state.buffer.length - 1);
  const max = state.mode === "INSERT" ? currentLine().length : lineMax(state, state.cursor.line);
  state.cursor.col = clamp(state.cursor.col, 0, max);
  state.preferredCol = clamp(state.preferredCol, 0, max);
}

function cursorToWorld(line, col, width = Math.max(...state.buffer.map((item) => item.length), 24), rows = state.buffer.length) {
  const x = ((col / Math.max(width - 1, 1)) - 0.5) * 14;
  const z = lineToZ(line, rows);
  return { x, z };
}

function lineToZ(line, rows) {
  return ((line / Math.max(rows - 1, 1)) - 0.5) * Math.max(rows * 1.18, 7.5);
}

function updatePlayerPosition() {
  const pos = cursorToWorld(state.cursor.line, state.cursor.col);
  player.position.x += (pos.x - player.position.x) * 0.22;
  player.position.z += (pos.z - player.position.z) * 0.22;
}

function updateTargetBeacon() {
  const target = resolveTarget(currentObjective());
  targetBeacon.visible = Boolean(target && !state.finished);
  if (!target) return;
  const pos = cursorToWorld(target.line, target.col);
  targetBeacon.position.x += (pos.x - targetBeacon.position.x) * 0.28;
  targetBeacon.position.z += (pos.z - targetBeacon.position.z) * 0.28;
  targetBeacon.position.y = 0.2;
}

function animate() {
  const time = clock.getElapsedTime();
  const delta = clock.getDelta();
  targetBeacon.rotation.y += delta * 1.9;
  targetBeacon.children[0].scale.setScalar(1 + Math.sin(time * 4) * 0.08);
  player.children[0].position.y = 0.72 + Math.sin(time * 6) * 0.025;
  billboards.children.forEach((item) => item.lookAt(camera.position));

  const desired = new THREE.Vector3(player.position.x * 0.28, 10.2, player.position.z + 15.5);
  camera.position.lerp(desired, 0.025);
  camera.lookAt(player.position.x * 0.2, 0.2, player.position.z - 1);

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

function pulseScene(color) {
  rimLight.color.setHex(color);
  rimLight.intensity = 170;
  setTimeout(() => {
    rimLight.color.setHex(0xff3fa4);
    rimLight.intensity = 90;
  }, 260);
}

function setupMobileKeys() {
  const keys = ["Esc", "h", "j", "k", "l", "w", "b", "e", "0", "$", "g", "G", "f", "d", "c", "y", "x", "i", "A", "o", "p"];
  els.mobileKeys.innerHTML = keys.map((key) => `<button type="button" data-key="${key}">${key}</button>`).join("");
  els.mobileKeys.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const key = button.dataset.key === "Esc" ? "Escape" : button.dataset.key;
    handleKey(key);
  });
}

function wrap(value, max) {
  return ((value % max) + max) % max;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function repeat(count, fn) {
  for (let i = 0; i < count; i += 1) fn();
}

function clearGroup(group) {
  while (group.children.length) {
    const child = group.children.pop();
    child.geometry?.dispose();
    if (Array.isArray(child.material)) child.material.forEach((mat) => mat.dispose());
    else child.material?.dispose();
  }
}

function couldStillMatch(cmd) {
  return /^(g|[fFtTrdcy]|[dcy][iafFtT]?)$/.test(cmd);
}

function describeMotion(motion, count) {
  const labels = {
    h: "Move left",
    j: "Move down",
    k: "Move up",
    l: "Move right",
    w: "Jump to next word",
    b: "Jump to previous word",
    e: "Jump to word end",
    0: "Move to line start",
    "$": "Move to line end",
    "^": "Move to first nonblank"
  };
  return `${labels[motion]}${count > 1 ? ` x${count}` : ""}`;
}

function describeSingle(command) {
  return {
    x: "Delete character",
    D: "Delete to end of line",
    C: "Change to end of line",
    u: "Undo",
    p: "Paste after",
    P: "Paste before"
  }[command];
}

function describeLineOp(command) {
  return {
    dd: "Delete line",
    yy: "Yank line",
    cc: "Change line"
  }[command];
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

document.addEventListener("keydown", (event) => {
  const ignored = ["Shift", "Control", "Alt", "Meta", "CapsLock"];
  if (ignored.includes(event.key)) return;
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() !== "r") return;
  event.preventDefault();
  handleKey(event.key);
});

els.start.addEventListener("click", () => {
  state.active = true;
  els.boot.classList.add("hidden");
  els.editor.focus();
  state.message = "Training room live. Use Vim commands.";
  updateHud();
});

els.restart.addEventListener("click", () => startMission(state.missionIndex));
els.prev.addEventListener("click", () => startMission(state.missionIndex - 1));
els.next.addEventListener("click", () => startMission(state.missionIndex + 1));
els.logButton.addEventListener("click", () => els.drawer.classList.toggle("open"));
els.drawerToggle.addEventListener("click", () => els.drawer.classList.toggle("open"));

window.addEventListener("resize", resize);
window.addEventListener("visibilitychange", () => {
  if (!document.hidden) resize();
});

setupMobileKeys();
resize();
startMission(0);
updatePlayerPosition();
updateTargetBeacon();
animate();
