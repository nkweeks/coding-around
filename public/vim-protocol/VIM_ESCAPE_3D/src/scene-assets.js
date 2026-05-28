import * as THREE from "https://unpkg.com/three@0.165.0/build/three.module.js";
import { GLTFLoader } from "https://unpkg.com/three@0.165.0/examples/jsm/loaders/GLTFLoader.js";

const MODEL_ROOT = "./assets/models/";
const ASSET_VERSION = "portrait-mapped-20260510";
const gltfLoader = new GLTFLoader();
let loadedAssets = null;

const POSES = {
  byte: { x: -1.12, y: 0, z: -1.44, rotationY: 0.44, scale: 1.22 },
  blade: { x: 1.15, y: 0, z: -1.38, rotationY: -0.50, scale: 1.24 },
  core: { x: 0, y: 0, z: -4.85, scale: 0.48 },
  gate: { x: 0, y: 0, z: -6.72, scale: 1 },
  systemNode: { y: 1.48, z: -1.16, scale: 0.56, passScale: 0.68 }
};

const COLORS = {
  void: 0x03070b,
  floor: 0x071018,
  floorPanel: 0x0b1d29,
  steel: 0x182b38,
  darkSteel: 0x0a121a,
  cyan: 0x5ce7ff,
  cyanSoft: 0xb8f6ff,
  pink: 0xff3fa4,
  green: 0x69ff9d,
  amber: 0xffd166,
  red: 0xff5c7a,
  purple: 0x6b2fc9,
  deepPurple: 0x201039,
  black: 0x05070c
};

export async function createCyberArena() {
  loadedAssets = await loadAssetSet();
  if (loadedAssets) return createGlbArena(loadedAssets);
  return createProceduralArena();
}

function createProceduralArena() {
  const materials = createMaterials();
  const group = new THREE.Group();
  group.name = "nexus-arena";

  const floor = createArenaFloor(materials);
  const core = createNexusCore(materials);
  const gate = createNexusGate(materials);
  const byte = createByteModel(materials);
  const blade = createBladeModel(materials);
  const systemRig = new THREE.Group();
  const panels = createHoloPanels(materials);
  const serverBanks = createServerBanks(materials);
  const duelBeams = createDuelBeams(materials);

  systemRig.name = "mission-system-nodes";
  applyPose(byte.root, POSES.byte);
  applyPose(blade.root, POSES.blade);
  applyPose(core.root, POSES.core);
  applyPose(gate.root, POSES.gate);

  group.add(floor, serverBanks, core.root, gate.root, byte.root, blade.root, duelBeams.root, panels.root, systemRig);

  return {
    group,
    systemRig,
    floor,
    core,
    gate,
    byte,
    blade,
    panels,
    duelBeams,
    materials
  };
}

async function loadAssetSet() {
  const names = {
    arenaProps: "arena_props.glb",
    byte: "byte_robot.glb",
    blade: "blade_ninja.glb",
    core: "nexus_core.glb",
    gate: "nexus_gate.glb",
    systemNode: "system_node.glb"
  };

  try {
    const entries = await Promise.all(
      Object.entries(names).map(async ([key, file]) => [key, await loadModel(`${MODEL_ROOT}${file}?v=${ASSET_VERSION}`)])
    );
    return Object.fromEntries(entries);
  } catch (error) {
    console.warn("Falling back to generated Three.js assets.", error);
    return null;
  }
}

function loadModel(url) {
  return new Promise((resolve, reject) => {
    gltfLoader.load(url, (gltf) => resolve(gltf.scene), undefined, reject);
  });
}

function applyPose(root, pose) {
  root.position.set(pose.x, pose.y, pose.z);
  if (pose.rotationY !== undefined) root.rotation.y = pose.rotationY;
  if (pose.scale !== undefined) root.scale.setScalar(pose.scale);
  root.userData.baseX = pose.x;
  root.userData.baseY = pose.y;
  root.userData.baseZ = pose.z;
  root.userData.baseRotationY = root.rotation.y;
  root.userData.baseScale = pose.scale ?? root.scale.x;
}

function tuneArenaProps(root) {
  root.traverse((object) => {
    if (!object.isMesh) return;
    if (object.name === "Arena_CommandDeck") {
      object.material.transparent = true;
      object.material.opacity = 0.42;
      object.material.depthWrite = false;
    }
    if (object.name === "Arena_BaseFloor") {
      object.material.color.multiplyScalar(0.7);
    }
  });
}

function createGlbArena(assets) {
  const materials = createMaterials();
  const group = new THREE.Group();
  const systemRig = new THREE.Group();
  const panels = createHoloPanels(materials);
  const duelBeams = createDuelBeams(materials);

  group.name = "nexus-arena";
  systemRig.name = "mission-system-nodes";

  const floor = cloneModel(assets.arenaProps);
  floor.name = "arena-props-glb";
  tuneArenaProps(floor);
  const core = hydrateCore(cloneModel(assets.core));
  const gate = hydrateGate(cloneModel(assets.gate));
  const byte = hydrateByte(cloneModel(assets.byte));
  const blade = hydrateBlade(cloneModel(assets.blade));

  applyPose(core.root, POSES.core);
  applyPose(gate.root, POSES.gate);
  applyPose(byte.root, POSES.byte);
  applyPose(blade.root, POSES.blade);

  group.add(floor, core.root, gate.root, byte.root, blade.root, duelBeams.root, panels.root, systemRig);

  return {
    group,
    systemRig,
    floor,
    core,
    gate,
    byte,
    blade,
    panels,
    duelBeams,
    materials
  };
}

function createSystemNodeFromAsset(index, total) {
  const group = cloneModel(loadedAssets.systemNode);
  const spacing = total > 2 ? 1.16 : 1.32;
  const x = (index - (total - 1) / 2) * spacing;
  group.name = `system-node-${index + 1}`;
  group.position.set(x, POSES.systemNode.y, POSES.systemNode.z);
  group.scale.setScalar(POSES.systemNode.scale);

  const base = requireMesh(group, "Node_Base");
  const tower = requireMesh(group, "Node_Tower");
  const screen = requireMesh(group, "Node_Screen");
  const beacon = requireMesh(group, "Node_Beacon");
  const ringTop = requireMesh(group, "Node_RingTop");
  const ringMid = requireMesh(group, "Node_RingMid");

  group.userData = {
    base,
    tower,
    screen,
    beacon,
    rings: [ringTop, ringMid],
    pass: false,
    baseY: POSES.systemNode.y,
    idleScale: POSES.systemNode.scale,
    passScale: POSES.systemNode.passScale,
    flash: 0
  };

  return group;
}

function hydrateCore(root) {
  root.name = "nexus-core-glb";
  return {
    root,
    pedestal: requireMesh(root, "Core_Pedestal"),
    column: requireMesh(root, "Core_Column"),
    innerGlow: requireMesh(root, "Core_InnerGlow"),
    glass: requireMesh(root, "Core_Glass"),
    rings: findByPrefix(root, "Core_Ring_")
  };
}

function hydrateGate(root) {
  root.name = "nexus-gate-glb";
  return {
    root,
    leftPylon: requireMesh(root, "Gate_LeftPylon"),
    rightPylon: requireMesh(root, "Gate_RightPylon"),
    top: requireMesh(root, "Gate_Top"),
    leftDoor: requireMesh(root, "Gate_LeftDoor"),
    rightDoor: requireMesh(root, "Gate_RightDoor"),
    lock: requireMesh(root, "Gate_Lock"),
    scanLines: findByPrefix(root, "Gate_ScanLine_")
  };
}

function hydrateByte(root) {
  root.name = "byte-robot-glb";
  return {
    root,
    body: requireMesh(root, "BYTE_Body"),
    chest: requireMesh(root, "BYTE_ChestPanel"),
    head: requireMesh(root, "BYTE_Head"),
    eyeLeft: requireMesh(root, "BYTE_EyeLeft"),
    eyeRight: requireMesh(root, "BYTE_EyeRight"),
    leftAntenna: requireMesh(root, "BYTE_AntennaLeft"),
    rightAntenna: requireMesh(root, "BYTE_AntennaRight"),
    aura: requireMesh(root, "BYTE_Aura")
  };
}

function hydrateBlade(root) {
  root.name = "blade-ninja-glb";
  const sword = requireMesh(root, "BLADE_SwordBlade");
  sword.userData.baseRotationZ = sword.rotation.z;
  return {
    root,
    body: requireMesh(root, "BLADE_Body"),
    hood: requireMesh(root, "BLADE_Hood"),
    sword,
    scarf: requireMesh(root, "BLADE_Scarf"),
    aura: requireMesh(root, "BLADE_Aura")
  };
}

export function createSystemNode(index, total, materials = createMaterials()) {
  if (loadedAssets?.systemNode) return createSystemNodeFromAsset(index, total);

  const group = new THREE.Group();
  const spacing = total > 2 ? 1.16 : 1.32;
  const x = (index - (total - 1) / 2) * spacing;
  group.name = `system-node-${index + 1}`;
  group.position.set(x, POSES.systemNode.y, POSES.systemNode.z);
  group.scale.setScalar(POSES.systemNode.scale);

  const base = addMesh(
    group,
    new THREE.CylinderGeometry(0.58, 0.74, 0.28, 8),
    materials.nodeBase,
    { position: [0, 0.14, 0], rotation: [0, Math.PI / 8, 0] }
  );

  const tower = addMesh(
    group,
    new THREE.CylinderGeometry(0.35, 0.46, 1.28, 12),
    materials.nodeShell,
    { position: [0, 0.86, 0] }
  );

  const screen = addMesh(
    group,
    new THREE.BoxGeometry(0.84, 0.42, 0.06),
    materials.nodeScreen,
    { position: [0, 1.12, 0.42], rotation: [-0.08, 0, 0] }
  );

  const beacon = addMesh(
    group,
    new THREE.SphereGeometry(0.15, 18, 12),
    materials.nodeBeacon,
    { position: [0, 1.66, 0] }
  );

  const ringTop = addMesh(
    group,
    new THREE.TorusGeometry(0.55, 0.025, 8, 44),
    materials.nodeRing,
    { position: [0, 1.55, 0], rotation: [Math.PI / 2, 0, 0] }
  );

  const ringMid = addMesh(
    group,
    new THREE.TorusGeometry(0.44, 0.018, 8, 36),
    materials.nodeRing,
    { position: [0, 0.78, 0], rotation: [Math.PI / 2, 0, 0] }
  );

  for (let i = 0; i < 3; i += 1) {
    addMesh(
      group,
      new THREE.BoxGeometry(0.1, 0.05, 0.06),
      materials.nodeLight,
      { position: [-0.24 + i * 0.24, 1.12, 0.465] }
    );
  }

  group.userData = {
    base,
    tower,
    screen,
    beacon,
    rings: [ringTop, ringMid],
    pass: false,
    baseY: POSES.systemNode.y,
    idleScale: POSES.systemNode.scale,
    passScale: POSES.systemNode.passScale,
    flash: 0
  };

  return group;
}

export function setSystemNodeState(node, pass) {
  const wasPass = Boolean(node.userData.pass);
  node.userData.pass = pass;
  if (pass && !wasPass) node.userData.flash = 1;
  const color = pass ? COLORS.green : COLORS.red;
  const shellColor = pass ? 0x15372a : 0x111e2a;
  const glow = pass ? 0x0b4b2c : 0x2b0615;
  const targetScale = pass ? node.userData.passScale : node.userData.idleScale;

  node.userData.tower.material.color.setHex(shellColor);
  node.userData.tower.material.emissive.setHex(glow);
  node.userData.screen.material.color.setHex(pass ? 0x0f3b2a : 0x251321);
  node.userData.screen.material.emissive.setHex(pass ? 0x0d7a46 : 0x66172f);
  node.userData.beacon.material.color.setHex(color);
  node.userData.beacon.material.emissive.setHex(color);
  node.userData.rings.forEach((ring) => {
    ring.material.color.setHex(color);
  });
  node.scale.setScalar(targetScale);
}

export function updateCyberArena(arena, { allPass, repaired, total, guide }) {
  const progress = total > 0 ? repaired / total : 0;
  const stableColor = allPass ? COLORS.green : COLORS.cyan;
  const alertColor = allPass ? COLORS.green : COLORS.pink;
  const coreScale = arena.core.root.userData.baseScale * (1 + progress * 0.18 + (allPass ? 0.08 : 0));

  arena.core.column.material.color.setHex(allPass ? 0x123d2a : 0x142336);
  arena.core.column.material.emissive.setHex(allPass ? 0x0a5c34 : 0x081e32);
  arena.core.innerGlow.material.color.setHex(stableColor);
  arena.core.innerGlow.material.emissive.setHex(stableColor);
  arena.core.rings.forEach((ring, index) => {
    ring.material.color.setHex(index % 2 === 0 ? stableColor : alertColor);
  });
  arena.core.root.scale.setScalar(coreScale);
  arena.core.root.position.y = arena.core.root.userData.baseY + progress * 0.26;

  arena.gate.leftDoor.position.x += ((allPass ? -1.3 : -0.48) - arena.gate.leftDoor.position.x) * 0.08;
  arena.gate.rightDoor.position.x += ((allPass ? 1.3 : 0.48) - arena.gate.rightDoor.position.x) * 0.08;
  arena.gate.lock.material.color.setHex(allPass ? COLORS.green : COLORS.red);
  arena.gate.lock.material.emissive.setHex(allPass ? COLORS.green : COLORS.red);
  arena.gate.root.position.y = arena.gate.root.userData.baseY + (allPass ? 0.28 : progress * 0.08);

  arena.byte.aura.material.opacity = guide === "byte" ? 0.72 : 0.26;
  arena.byte.eyeLeft.material.emissiveIntensity = guide === "byte" ? 3.4 : 2.2;
  arena.byte.eyeRight.material.emissiveIntensity = guide === "byte" ? 3.4 : 2.2;
  arena.byte.root.position.x = arena.byte.root.userData.baseX + progress * 0.18;
  arena.byte.root.position.z = arena.byte.root.userData.baseZ - progress * 0.1;
  arena.byte.root.rotation.y = arena.byte.root.userData.baseRotationY + progress * 0.12;
  arena.blade.aura.material.opacity = guide === "blade" ? 0.74 : 0.25;
  arena.blade.sword.material.emissiveIntensity = guide === "blade" ? 3.8 : 2.4;
  arena.blade.root.position.x = arena.blade.root.userData.baseX - progress * 0.18;
  arena.blade.root.position.z = arena.blade.root.userData.baseZ - progress * 0.1;
  arena.blade.root.rotation.y = arena.blade.root.userData.baseRotationY - progress * 0.12;

  arena.duelBeams.byteBeam.material.opacity = 0.18 + progress * 0.42;
  arena.duelBeams.bladeBeam.material.opacity = 0.22 + progress * 0.38;
  arena.duelBeams.resolveBeam.material.opacity = allPass ? 0.62 : 0.16 + progress * 0.22;
}

export function animateCyberArena(arena, systemNodes, time, camera) {
  arena.core.root.rotation.y = time * 0.22;
  arena.core.rings.forEach((ring, index) => {
    ring.rotation.z += 0.006 + index * 0.002;
    ring.rotation.x = Math.PI / 2 + Math.sin(time * 0.7 + index) * 0.08;
  });
  arena.core.innerGlow.scale.setScalar(1 + Math.sin(time * 2.8) * 0.045);

  arena.gate.scanLines.forEach((line, index) => {
    line.position.y = 0.55 + ((time * 0.55 + index * 0.28) % 2.1);
    line.material.opacity = 0.24 + Math.sin(time * 3 + index) * 0.08;
  });

  if (arena.byte.root.userData.baseY === undefined) arena.byte.root.userData.baseY = arena.byte.root.position.y;
  arena.byte.root.position.y = arena.byte.root.userData.baseY + Math.sin(time * 1.35) * 0.04;
  arena.byte.head.rotation.z = Math.sin(time * 1.7) * 0.035;
  arena.byte.leftAntenna.rotation.z = -0.35 + Math.sin(time * 3.1) * 0.05;
  arena.byte.rightAntenna.rotation.z = 0.35 - Math.sin(time * 2.8) * 0.05;
  arena.byte.aura.rotation.z -= 0.012;

  if (arena.blade.root.userData.baseY === undefined) arena.blade.root.userData.baseY = arena.blade.root.position.y;
  arena.blade.root.position.y = arena.blade.root.userData.baseY + Math.sin(time * 1.6 + 1.2) * 0.035;
  const swordTarget = arena.blade.swordPivot || arena.blade.sword;
  if (swordTarget.userData.baseRotationZ === undefined) swordTarget.userData.baseRotationZ = swordTarget.rotation.z;
  swordTarget.rotation.z = swordTarget.userData.baseRotationZ + Math.sin(time * 2.1) * 0.04;
  arena.blade.scarf.rotation.z = Math.sin(time * 2.3) * 0.12;
  arena.blade.aura.rotation.z += 0.016;

  arena.panels.items.forEach((panel, index) => {
    panel.position.y = panel.userData.baseY + Math.sin(time * 1.25 + index) * 0.08;
    panel.lookAt(camera.position);
  });

  systemNodes.forEach((node, index) => {
    const flash = Math.max(0, node.userData.flash ?? 0);
    const baseScale = node.userData.pass ? node.userData.passScale : node.userData.idleScale;
    node.userData.flash = Math.max(0, flash - 0.045);
    node.position.y = node.userData.baseY + (node.userData.pass ? 0.12 : 0) + Math.sin(time * 2.1 + index) * 0.045;
    node.scale.setScalar(baseScale + flash * 0.18);
    node.userData.rings.forEach((ring, ringIndex) => {
      ring.rotation.z += 0.015 + index * 0.002 + ringIndex * 0.004;
      ring.scale.setScalar(1 + flash * 0.22 + Math.sin(time * 3 + index + ringIndex) * 0.045);
    });
    node.userData.beacon.scale.setScalar(1 + flash * 0.4 + Math.sin(time * 4.5 + index) * 0.1);
  });
}

function createMaterials() {
  const standard = (color, options = {}) => new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.45,
    metalness: options.metalness ?? 0.35,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 1,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
    side: options.side ?? THREE.FrontSide,
    depthWrite: options.depthWrite ?? true,
    flatShading: options.flatShading ?? false
  });

  const basic = (color, options = {}) => new THREE.MeshBasicMaterial({
    color,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
    side: options.side ?? THREE.FrontSide,
    depthWrite: options.depthWrite ?? true
  });

  return {
    floor: standard(COLORS.floor, { roughness: 0.82, metalness: 0.24 }),
    floorPanel: standard(COLORS.floorPanel, { roughness: 0.62, metalness: 0.42 }),
    tileLine: basic(COLORS.cyan, { transparent: true, opacity: 0.32 }),
    steel: standard(COLORS.steel, { roughness: 0.42, metalness: 0.56 }),
    darkSteel: standard(COLORS.darkSteel, { roughness: 0.55, metalness: 0.45 }),
    black: standard(COLORS.black, { roughness: 0.7, metalness: 0.2 }),
    byteShell: standard(0x552e9d, { roughness: 0.34, metalness: 0.45, emissive: 0x120924 }),
    byteFace: standard(0x210d36, { roughness: 0.32, metalness: 0.4, emissive: 0x080012 }),
    byteGlow: standard(COLORS.cyan, { roughness: 0.18, metalness: 0.05, emissive: COLORS.cyan, emissiveIntensity: 2.8 }),
    bladeSuit: standard(0x171020, { roughness: 0.5, metalness: 0.34, emissive: 0x08020f }),
    bladeArmor: standard(0x492080, { roughness: 0.38, metalness: 0.48, emissive: 0x12051f }),
    bladeGlow: standard(COLORS.cyan, { roughness: 0.2, metalness: 0.08, emissive: COLORS.cyan, emissiveIntensity: 2.6 }),
    bladeEye: standard(COLORS.amber, { roughness: 0.18, metalness: 0.05, emissive: COLORS.amber, emissiveIntensity: 3.0 }),
    coreShell: standard(0x142336, { roughness: 0.34, metalness: 0.54, emissive: 0x081e32 }),
    coreGlass: standard(COLORS.cyan, { transparent: true, opacity: 0.16, roughness: 0.12, metalness: 0.05, emissive: COLORS.cyan, emissiveIntensity: 1.6, depthWrite: false, side: THREE.DoubleSide }),
    nodeBase: standard(0x0b1823, { roughness: 0.58, metalness: 0.52 }),
    nodeShell: standard(0x111e2a, { roughness: 0.44, metalness: 0.46, emissive: 0x2b0615 }),
    nodeScreen: standard(0x251321, { roughness: 0.26, metalness: 0.2, emissive: 0x66172f, emissiveIntensity: 1.8 }),
    nodeBeacon: standard(COLORS.red, { roughness: 0.18, metalness: 0.04, emissive: COLORS.red, emissiveIntensity: 2.8 }),
    nodeRing: basic(COLORS.red, { transparent: true, opacity: 0.92, side: THREE.DoubleSide }),
    nodeLight: standard(COLORS.cyan, { roughness: 0.2, metalness: 0.1, emissive: COLORS.cyan, emissiveIntensity: 2.2 }),
    hologram: basic(COLORS.cyan, { transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false }),
    hologramPink: basic(COLORS.pink, { transparent: true, opacity: 0.48, side: THREE.DoubleSide, depthWrite: false }),
    auraCyan: basic(COLORS.cyan, { transparent: true, opacity: 0.26, side: THREE.DoubleSide, depthWrite: false }),
    auraPink: basic(COLORS.pink, { transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false }),
    greenGlow: standard(COLORS.green, { roughness: 0.18, metalness: 0.05, emissive: COLORS.green, emissiveIntensity: 2.4 }),
    redGlow: standard(COLORS.red, { roughness: 0.18, metalness: 0.05, emissive: COLORS.red, emissiveIntensity: 2.4 }),
    amberGlow: standard(COLORS.amber, { roughness: 0.18, metalness: 0.05, emissive: COLORS.amber, emissiveIntensity: 2.4 })
  };
}

function createArenaFloor(materials) {
  const group = new THREE.Group();
  group.name = "arena-floor";

  addMesh(group, new THREE.BoxGeometry(17.5, 0.14, 14.5), materials.floor, { position: [0, -0.08, -0.6] });
  addMesh(group, new THREE.BoxGeometry(3.1, 0.025, 3.7), materials.floorPanel, { position: [0, 0.015, -2.45] });
  addMesh(group, new THREE.BoxGeometry(1.25, 0.026, 1.45), materials.hologram, { position: [-1.05, 0.055, -1.62] });
  addMesh(group, new THREE.BoxGeometry(1.25, 0.026, 1.45), materials.hologramPink, { position: [1.05, 0.055, -1.62] });

  const grid = new THREE.GridHelper(18, 18, 0x2c879a, 0x14323c);
  grid.name = "tactical-floor-grid";
  grid.position.set(0, 0.03, -0.5);
  grid.material.transparent = true;
  grid.material.opacity = 0.32;
  group.add(grid);

  for (let i = 0; i < 7; i += 1) {
    addMesh(
      group,
      new THREE.BoxGeometry(15.6, 0.035, 0.035),
      materials.tileLine,
      { position: [0, 0.08, -5.6 + i * 1.65] }
    );
  }

  for (let i = 0; i < 5; i += 1) {
    addMesh(
      group,
      new THREE.BoxGeometry(0.035, 0.035, 11.6),
      materials.tileLine,
      { position: [-6.4 + i * 3.2, 0.085, -0.5] }
    );
  }

  addCable(group, materials.hologram, [-5.7, 0.08, 2.5], [-2.4, 0.1, 0.2], [-1.1, 0.08, -2.2]);
  addCable(group, materials.hologramPink, [5.7, 0.08, 2.2], [2.4, 0.1, 0.0], [1.1, 0.08, -2.2]);
  addCable(group, materials.greenGlow, [-1.5, 0.08, 3.2], [0, 0.1, 1.4], [1.5, 0.08, 3.2], 0.025);

  return group;
}

function createServerBanks(materials) {
  const group = new THREE.Group();
  group.name = "nexus-server-banks";

  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < 4; i += 1) {
      const rack = new THREE.Group();
      rack.position.set(side * 7.1, 0, -5.2 + i * 2.15);
      rack.rotation.y = side > 0 ? -0.18 : 0.18;
      addMesh(rack, new THREE.BoxGeometry(0.72, 2.65, 1.04), materials.darkSteel, { position: [0, 1.3, 0] });
      addMesh(rack, new THREE.BoxGeometry(0.77, 0.08, 1.08), materials.steel, { position: [0, 2.68, 0] });

      for (let slot = 0; slot < 5; slot += 1) {
        addMesh(
          rack,
          new THREE.BoxGeometry(0.05, 0.045, 0.62),
          slot % 2 === 0 ? materials.nodeLight : materials.hologramPink,
          { position: [side > 0 ? -0.39 : 0.39, 0.45 + slot * 0.38, -0.17] }
        );
      }

      group.add(rack);
    }
  }

  return group;
}

function createNexusCore(materials) {
  const root = new THREE.Group();
  root.name = "nexus-core";
  root.position.set(0, 0, -5.2);
  root.scale.setScalar(0.48);

  const pedestal = addMesh(root, new THREE.CylinderGeometry(1.18, 1.48, 0.42, 18), materials.darkSteel, { position: [0, 0.21, 0] });
  const column = addMesh(root, new THREE.CylinderGeometry(0.58, 0.8, 2.95, 18), materials.coreShell, { position: [0, 1.7, 0] });
  const innerGlow = addMesh(root, new THREE.SphereGeometry(0.42, 28, 16), materials.nodeLight, { position: [0, 2.36, 0] });

  const glass = addMesh(root, new THREE.SphereGeometry(1.1, 32, 16), materials.coreGlass, { position: [0, 2.0, 0], scale: [1, 1.24, 1] });
  const rings = [
    addMesh(root, new THREE.TorusGeometry(1.26, 0.032, 8, 64), materials.nodeRing, { position: [0, 2.0, 0], rotation: [Math.PI / 2, 0, 0] }),
    addMesh(root, new THREE.TorusGeometry(0.92, 0.026, 8, 52), materials.hologramPink, { position: [0, 1.52, 0], rotation: [Math.PI / 2, 0.45, 0] }),
    addMesh(root, new THREE.TorusGeometry(0.78, 0.022, 8, 48), materials.hologram, { position: [0, 2.45, 0], rotation: [Math.PI / 2, -0.4, 0] })
  ];

  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI * 2 * i) / 6;
    const x = Math.cos(angle) * 0.8;
    const z = Math.sin(angle) * 0.8;
    addMesh(root, new THREE.BoxGeometry(0.11, 0.46, 0.04), materials.nodeLight, {
      position: [x, 1.72, z],
      rotation: [0, -angle, 0]
    });
  }

  return { root, pedestal, column, innerGlow, glass, rings };
}

function createNexusGate(materials) {
  const root = new THREE.Group();
  root.name = "nexus-breach-gate";
  root.position.set(0, 0, -7.15);

  const leftPylon = addMesh(root, new THREE.BoxGeometry(0.42, 3.35, 0.42), materials.steel, { position: [-2.28, 1.68, 0] });
  const rightPylon = addMesh(root, new THREE.BoxGeometry(0.42, 3.35, 0.42), materials.steel, { position: [2.28, 1.68, 0] });
  const top = addMesh(root, new THREE.BoxGeometry(4.96, 0.42, 0.48), materials.darkSteel, { position: [0, 3.25, 0] });
  const leftDoor = addMesh(root, new THREE.BoxGeometry(0.92, 2.36, 0.11), materials.nodeScreen, { position: [-0.48, 1.42, 0.03] });
  const rightDoor = addMesh(root, new THREE.BoxGeometry(0.92, 2.36, 0.11), materials.nodeScreen, { position: [0.48, 1.42, 0.03] });
  const lock = addMesh(root, new THREE.OctahedronGeometry(0.24, 0), materials.redGlow, { position: [0, 1.58, 0.16] });
  const scanLines = [];

  for (let i = 0; i < 4; i += 1) {
    scanLines.push(addMesh(root, new THREE.BoxGeometry(3.2, 0.035, 0.04), materials.hologramPink, { position: [0, 0.7 + i * 0.5, 0.12] }));
  }

  return { root, leftPylon, rightPylon, top, leftDoor, rightDoor, lock, scanLines };
}

function createByteModel(materials) {
  const root = new THREE.Group();
  root.name = "byte-robot-model";

  const aura = addMesh(root, new THREE.TorusGeometry(1.34, 0.025, 8, 64), materials.auraCyan, {
    position: [0, 0.04, 0],
    rotation: [Math.PI / 2, 0, 0]
  });

  const body = addMesh(root, new THREE.BoxGeometry(1.14, 0.92, 0.58), materials.byteShell, { position: [0, 1.28, 0] });
  const chest = addMesh(root, new THREE.BoxGeometry(0.72, 0.5, 0.05), materials.byteFace, { position: [0, 1.3, 0.315] });
  const head = addMesh(root, new THREE.BoxGeometry(1.18, 0.72, 0.58), materials.byteShell, { position: [0, 2.12, 0] });
  const face = addMesh(root, new THREE.BoxGeometry(0.86, 0.42, 0.04), materials.byteFace, { position: [0, 2.12, 0.315] });
  const neck = addMesh(root, new THREE.CylinderGeometry(0.22, 0.22, 0.24, 14), materials.darkSteel, { position: [0, 1.72, 0] });
  const eyeLeft = addMesh(root, new THREE.SphereGeometry(0.105, 18, 10), materials.byteGlow, { position: [-0.22, 2.2, 0.35], scale: [1.25, 0.7, 0.24] });
  const eyeRight = addMesh(root, new THREE.SphereGeometry(0.105, 18, 10), materials.byteGlow, { position: [0.22, 2.2, 0.35], scale: [1.25, 0.7, 0.24] });

  for (let i = 0; i < 4; i += 1) {
    addMesh(root, new THREE.BoxGeometry(0.08, 0.025, 0.035), materials.byteGlow, { position: [-0.18 + i * 0.12, 2.01, 0.352] });
  }

  addMesh(root, new THREE.CylinderGeometry(0.035, 0.035, 0.55, 8), materials.steel, { position: [-0.43, 2.62, 0], rotation: [0, 0, -0.35] });
  addMesh(root, new THREE.CylinderGeometry(0.035, 0.035, 0.55, 8), materials.steel, { position: [0.43, 2.62, 0], rotation: [0, 0, 0.35] });
  const leftAntenna = addMesh(root, new THREE.SphereGeometry(0.09, 12, 8), materials.byteGlow, { position: [-0.54, 2.9, 0] });
  const rightAntenna = addMesh(root, new THREE.SphereGeometry(0.09, 12, 8), materials.byteGlow, { position: [0.54, 2.9, 0] });

  createLimb(root, materials.byteShell, [-0.68, 1.52, 0], [-1.02, 1.0, 0.04], 0.09);
  createLimb(root, materials.byteShell, [0.68, 1.52, 0], [1.1, 1.94, 0.06], 0.09);
  addMesh(root, new THREE.SphereGeometry(0.16, 14, 10), materials.byteShell, { position: [-1.04, 0.95, 0.05] });
  addMesh(root, new THREE.SphereGeometry(0.16, 14, 10), materials.byteShell, { position: [1.12, 1.98, 0.06] });

  createLimb(root, materials.byteShell, [-0.32, 0.88, 0], [-0.48, 0.28, 0.08], 0.1);
  createLimb(root, materials.byteShell, [0.32, 0.88, 0], [0.52, 0.28, -0.02], 0.1);
  addMesh(root, new THREE.BoxGeometry(0.44, 0.14, 0.72), materials.byteShell, { position: [-0.52, 0.09, 0.12] });
  addMesh(root, new THREE.BoxGeometry(0.44, 0.14, 0.72), materials.byteShell, { position: [0.54, 0.09, 0.04] });

  addMesh(root, new THREE.CylinderGeometry(0.08, 0.08, 0.44, 18), materials.byteGlow, { position: [-0.23, 1.27, 0.35] });
  addMesh(root, new THREE.TorusGeometry(0.14, 0.018, 8, 24), materials.amberGlow, { position: [0.24, 1.36, 0.35], rotation: [Math.PI / 2, 0, 0] });
  addMesh(root, new THREE.TorusGeometry(0.24, 0.02, 8, 28), materials.amberGlow, { position: [0.29, 1.25, 0.35], rotation: [Math.PI / 2, 0, 0] });

  return { root, body, chest, head, eyeLeft, eyeRight, leftAntenna, rightAntenna, aura };
}

function createBladeModel(materials) {
  const root = new THREE.Group();
  root.name = "blade-ninja-model";

  const aura = addMesh(root, new THREE.TorusGeometry(1.28, 0.024, 8, 64), materials.auraPink, {
    position: [0, 0.04, 0],
    rotation: [Math.PI / 2, 0, 0]
  });

  const body = addMesh(root, new THREE.CylinderGeometry(0.4, 0.54, 1.08, 6), materials.bladeSuit, { position: [0, 1.2, 0], rotation: [0, Math.PI / 6, 0] });
  addMesh(root, new THREE.BoxGeometry(0.74, 0.16, 0.12), materials.bladeArmor, { position: [0, 1.56, 0.36], rotation: [0, 0, -0.25] });
  addMesh(root, new THREE.BoxGeometry(0.72, 0.16, 0.12), materials.bladeArmor, { position: [0, 1.26, 0.36], rotation: [0, 0, 0.22] });

  const hood = addMesh(root, new THREE.SphereGeometry(0.38, 18, 12), materials.bladeArmor, { position: [0, 2.02, 0], scale: [1.02, 1.12, 0.86] });
  addMesh(root, new THREE.BoxGeometry(0.58, 0.22, 0.04), materials.bladeSuit, { position: [0, 2.03, 0.335] });
  addMesh(root, new THREE.BoxGeometry(0.18, 0.045, 0.035), materials.bladeEye, { position: [-0.13, 2.08, 0.365], rotation: [0, 0, -0.12] });
  addMesh(root, new THREE.BoxGeometry(0.18, 0.045, 0.035), materials.bladeEye, { position: [0.13, 2.08, 0.365], rotation: [0, 0, 0.12] });

  createLimb(root, materials.bladeArmor, [-0.36, 1.52, 0], [-0.84, 1.34, 0.14], 0.075);
  createLimb(root, materials.bladeArmor, [-0.84, 1.34, 0.14], [-1.1, 0.92, 0.24], 0.07);
  createLimb(root, materials.bladeArmor, [0.38, 1.5, 0], [0.9, 1.75, 0.13], 0.075);
  createLimb(root, materials.bladeArmor, [0.9, 1.75, 0.13], [1.28, 2.04, 0.28], 0.07);

  createLimb(root, materials.bladeSuit, [-0.24, 0.72, 0], [-0.72, 0.26, 0.16], 0.085);
  createLimb(root, materials.bladeSuit, [0.25, 0.72, 0], [0.9, 0.36, -0.08], 0.085);
  addMesh(root, new THREE.BoxGeometry(0.48, 0.12, 0.18), materials.bladeArmor, { position: [-0.78, 0.12, 0.18], rotation: [0, 0, -0.22] });
  addMesh(root, new THREE.BoxGeometry(0.52, 0.12, 0.18), materials.bladeArmor, { position: [0.98, 0.18, -0.08], rotation: [0, 0, 0.22] });

  const swordPivot = new THREE.Group();
  swordPivot.position.set(1.1, 1.88, 0.32);
  swordPivot.rotation.z = -0.62;
  swordPivot.userData.baseRotationZ = swordPivot.rotation.z;
  const sword = addMesh(swordPivot, new THREE.BoxGeometry(0.09, 1.45, 0.035), materials.bladeGlow, { position: [0.08, 0.56, 0] });
  addMesh(swordPivot, new THREE.BoxGeometry(0.38, 0.08, 0.06), materials.bladeArmor, { position: [0, -0.18, 0] });
  root.add(swordPivot);

  const scarf = addMesh(root, new THREE.BoxGeometry(0.9, 0.11, 0.04), materials.hologramPink, { position: [-0.5, 1.9, -0.12], rotation: [0, 0.12, -0.34] });
  addMesh(root, createShurikenGeometry(0.18, 0.05), materials.bladeGlow, { position: [-0.78, 1.0, 0.38], rotation: [0, 0, Math.PI / 8] });

  return { root, body, hood, sword: sword, swordPivot, scarf, aura };
}

function createHoloPanels(materials) {
  const root = new THREE.Group();
  root.name = "vim-hologram-panels";
  const items = [];
  const labels = [
    [":%s/tmp/payload/g", -2.9, 2.9, -3.9, materials.hologram],
    ["/ROOT_CAUSE", 2.85, 2.64, -3.55, materials.hologramPink],
    ["gg  G  ci\"", -0.2, 3.45, -4.9, materials.hologram]
  ];

  labels.forEach(([text, x, y, z, glow]) => {
    const panel = createTextPanel(text, glow);
    panel.position.set(x, y, z);
    panel.userData.baseY = y;
    root.add(panel);
    items.push(panel);
  });

  return { root, items };
}

function createTextPanel(text, glowMaterial) {
  const texture = createLabelTexture(text);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.74,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.42), material);
  mesh.userData.glowMaterial = glowMaterial;
  return mesh;
}

function createDuelBeams(materials) {
  const root = new THREE.Group();
  root.name = "byte-blade-duel-beams";
  const byteBeam = addCable(root, materials.hologram, [-4.05, 1.5, -2.95], [-2.15, 2.25, -2.75], [-0.6, 2.08, -2.35], 0.018);
  const bladeBeam = addCable(root, materials.hologramPink, [4.0, 1.72, -2.95], [2.0, 2.28, -2.55], [0.62, 2.08, -2.34], 0.018);
  const resolveBeam = addCable(root, materials.greenGlow, [-0.62, 2.12, -2.3], [0, 2.55, -2.15], [0.62, 2.12, -2.3], 0.014);
  byteBeam.material.transparent = true;
  bladeBeam.material.transparent = true;
  resolveBeam.material.transparent = true;
  return { root, byteBeam, bladeBeam, resolveBeam };
}

function createLimb(parent, material, start, end, radius) {
  const startVector = new THREE.Vector3(...start);
  const endVector = new THREE.Vector3(...end);
  const direction = new THREE.Vector3().subVectors(endVector, startVector);
  const length = direction.length();
  const geometry = new THREE.CylinderGeometry(radius, radius * 1.08, length, 12);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(startVector).add(endVector).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addCable(parent, material, a, b, c, radius = 0.02) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(...a),
    new THREE.Vector3(...b),
    new THREE.Vector3(...c)
  ]);
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 22, radius, 8, false), material);
  mesh.name = "data-cable";
  parent.add(mesh);
  return mesh;
}

function createShurikenGeometry(outer, inner) {
  const shape = new THREE.Shape();
  for (let i = 0; i < 8; i += 1) {
    const angle = (Math.PI * 2 * i) / 8 + Math.PI / 8;
    const radius = i % 2 === 0 ? outer : inner;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}

function createLabelTexture(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(4, 12, 18, 0.78)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(92, 231, 255, 0.82)";
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
  ctx.fillStyle = "#b8f6ff";
  ctx.font = "700 38px JetBrains Mono, monospace";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 34, canvas.height / 2 + 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function cloneModel(source) {
  const root = source.clone(true);
  const materialMap = new Map();

  root.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = true;
    object.material = cloneMaterial(object.material, materialMap);
  });

  return root;
}

function cloneMaterial(material, materialMap) {
  if (Array.isArray(material)) return material.map((mat) => cloneMaterial(mat, materialMap));
  if (!material) return material;
  if (!materialMap.has(material.uuid)) {
    const cloned = material.clone();
    if (cloned.transparent || cloned.opacity < 1) {
      cloned.depthWrite = false;
      cloned.side = THREE.DoubleSide;
    }
    materialMap.set(material.uuid, cloned);
  }
  return materialMap.get(material.uuid);
}

function requireMesh(root, name) {
  const object = findByName(root, name);
  if (object) return object;
  console.warn(`Missing mesh in GLB asset: ${name}`);
  return new THREE.Mesh(
    new THREE.BoxGeometry(0.01, 0.01, 0.01),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x000000 })
  );
}

function findByPrefix(root, prefix) {
  const matches = [];
  root.traverse((object) => {
    if (object.isMesh && object.name.startsWith(prefix)) matches.push(object);
  });
  return matches.sort((a, b) => a.name.localeCompare(b.name));
}

function findByName(root, name) {
  let match = null;
  root.traverse((object) => {
    if (!match && object.name === name) match = object;
  });
  return match;
}

function addMesh(parent, geometry, material, options = {}) {
  const mesh = new THREE.Mesh(geometry, material.clone ? material.clone() : material);
  mesh.name = options.name ?? "";
  if (options.position) mesh.position.set(...options.position);
  if (options.rotation) mesh.rotation.set(...options.rotation);
  if (options.scale) mesh.scale.set(...options.scale);
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  parent.add(mesh);
  return mesh;
}
