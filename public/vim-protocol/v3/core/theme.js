/* Color generation is local and deterministic. One hue owns the UI and art palette. */
(function () {
  "use strict";
  const DEFAULT_HUE = 278;
  const PRESETS = [
    { name: "Violet", hue: 278 },
    { name: "Jade", hue: 100 },
    { name: "Glacier", hue: 195 },
    { name: "Amber", hue: 38 },
    { name: "Rose", hue: 338 },
  ];
  function normalizeHue(value) {
    return typeof value === "number" && Number.isFinite(value)
      ? ((Math.round(value) % 360) + 360) % 360
      : DEFAULT_HUE;
  }
  function rgb(hue, saturation, lightness) {
    const h = normalizeHue(hue) / 60,
      s = saturation / 100,
      l = lightness / 100;
    const c = (1 - Math.abs(2 * l - 1)) * s,
      x = c * (1 - Math.abs((h % 2) - 1)),
      m = l - c / 2;
    const color =
      h < 1
        ? [c, x, 0]
        : h < 2
          ? [x, c, 0]
          : h < 3
            ? [0, c, x]
            : h < 4
              ? [0, x, c]
              : h < 5
                ? [x, 0, c]
                : [c, 0, x];
    return color.map((v) => Math.round((v + m) * 255));
  }
  function hex(h, s, l) {
    return (
      "#" +
      rgb(h, s, l)
        .map((v) => v.toString(16).padStart(2, "0"))
        .join("")
    );
  }
  function palette(value) {
    const hue = normalizeHue(value),
      color = (s, l) => hex(hue, s, l);
    const tokens = {
      bg: color(15, 7),
      rail: color(18, 5.5),
      surface: color(16, 10),
      "surface-2": color(17, 13),
      ink: color(22, 94),
      muted: color(12, 73),
      dim: color(10, 58),
      border: color(17, 25),
      accent: color(80, 78),
      "accent-bg": color(27, 15),
      "on-accent": color(32, 10),
      "border-strong": color(25, 35),
      focus: color(45, 63),
      "key-bg": color(20, 9),
      "subtle-bg": color(20, 8),
      track: color(20, 18),
      terminal: color(18, 4.5),
      "terminal-bar": color(23, 8),
      "current-line": color(24, 8),
      selection: color(28, 28),
      checkpoint: color(33, 20),
      "dialog-bg": color(19, 10),
      "toast-bg": color(28, 17),
    };
    // Three tonal ranges preserve silhouette, midtone detail, and near-white highlights.
    const ramp = (saturation) => [
      rgb(hue, 12, 2),
      rgb(hue, saturation, 34),
      rgb(hue, saturation, 68),
      rgb(hue, 24, 98),
    ];
    return {
      hue,
      name: PRESETS.find((p) => p.hue === hue)?.name || `Custom ${hue}°`,
      tokens,
      portrait: ramp(58),
      world: ramp(32),
    };
  }
  function nextHue(current, random = Math.random) {
    // Always move at least 65 degrees so Generate produces a visibly different palette.
    const sample = Math.max(0, Math.min(0.999999, Number(random()) || 0));
    return (normalizeHue(current) + 65 + Math.floor(sample * 230)) % 360;
  }
  function cycleHue(current) {
    const index = PRESETS.findIndex((p) => p.hue === normalizeHue(current));
    return PRESETS[(index + 1) % PRESETS.length].hue;
  }
  function canCycle({ enabled, page, hidden, dialogOpen, reducedMotion }) {
    return (
      enabled === true &&
      page !== "exercise" &&
      !hidden &&
      !dialogOpen &&
      !reducedMotion
    );
  }
  function contrast(a, b) {
    const luminance = (hexColor) => {
      const values = [1, 3, 5]
        .map((i) => parseInt(hexColor.slice(i, i + 2), 16) / 255)
        .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
      return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
    };
    const x = luminance(a),
      y = luminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  function logo(color = "currentColor") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none" aria-hidden="true"><g stroke="${color}" stroke-width="1.6"><path d="M8 12h19l13 22 13-22h19L40 68z"/><path d="m8 12 32 22 32-22M40 34v34M27 12l13 39 13-39"/></g></svg>`;
  }
  const api = {
    DEFAULT_HUE,
    PRESETS,
    normalizeHue,
    palette,
    nextHue,
    cycleHue,
    canCycle,
    contrast,
    logo,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.VimTheme = api;
})();
