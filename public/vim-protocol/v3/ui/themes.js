/* Shared theme controls and live presentation. Original raster assets remain unchanged. */
(function () {
  "use strict";
  const P = window.VP,
    T = window.VimTheme,
    E = P.escape;
  P.themeControls = (prefs, prefix = "palette") => {
    const palette = T.palette(prefs.themeHue);
    return `<section class="theme-controls" aria-label="Color theme"><div class="theme-section-heading"><div><h2>Your world, in color.</h2><p>Choose a palette. The dojo and your instructors change with it.</p></div><span class="theme-name" data-theme-name>${E(palette.name)}</span></div><div class="palette-preview"><figure class="palette-scene"><img class="themed-world" src="v3/assets/dojo-night.png" alt="Dojo scene in the selected theme"><figcaption>The dojo</figcaption></figure><figure><img class="themed-portrait" src="v3/assets/byte.jpeg" alt="BYTE in the selected theme"><figcaption>BYTE</figcaption></figure><figure><img class="themed-portrait" src="v3/assets/blade.jpeg" alt="BLADE in the selected theme"><figcaption>BLADE</figcaption></figure></div><div class="theme-presets" role="group" aria-label="Color presets">${T.PRESETS.map((p) => P.button(`<i style="--swatch:${T.palette(p.hue).tokens.accent}"></i><span>${p.name}</span>`, `theme:${p.hue}`, `class="theme-preset" aria-pressed="${palette.hue === p.hue}" data-preset-hue="${p.hue}"`)).join("")}</div><div class="hue-control"><label for="${prefix}-hue">Accent hue</label><output for="${prefix}-hue" data-theme-degrees>${palette.hue}°</output><input id="${prefix}-hue" type="range" min="0" max="359" step="1" value="${palette.hue}" data-theme-hue aria-valuetext="${E(palette.name)}, ${palette.hue} degrees"></div><div class="palette-actions">${P.button(`${P.icon("palette")}Generate palette`, "theme-generate", 'class="secondary"')}<span class="small muted">Applies and saves automatically.</span></div><label class="theme-cycle"><input type="checkbox" data-theme-cycle ${prefs.themeCycle ? "checked" : ""}><span><strong>Cycle colors</strong><small>Change every 45 seconds while browsing. Pauses during exercises and when reduced motion is enabled.</small></span></label></section>`;
  };
  function ensureFilters() {
    let svg = document.getElementById("palette-filters");
    if (!svg) {
      svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.id = "palette-filters";
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("width", "0");
      svg.setAttribute("height", "0");
      svg.classList.add("theme-filters");
      svg.innerHTML =
        "<defs>" +
        ["portrait", "world"]
          .map(
            (kind) =>
              `<filter id="palette-${kind}" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/><feComponentTransfer>${["R", "G", "B"].map((c) => `<feFunc${c} type="table" tableValues="0 .33 .67 1"/>`).join("")}</feComponentTransfer></filter>`,
          )
          .join("") +
        "</defs>";
      document.body.prepend(svg);
    }
    return svg;
  }
  P.applyTheme = (prefs) => {
    const palette = T.palette(prefs.themeHue),
      root = document.documentElement;
    for (const [name, color] of Object.entries(palette.tokens))
      root.style.setProperty("--" + name, color);
    root.dataset.themeHue = String(palette.hue);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", palette.tokens.bg);
    const svg = ensureFilters();
    for (const kind of ["portrait", "world"])
      for (const [index, channel] of ["R", "G", "B"].entries()) {
        svg
          .querySelector(`#palette-${kind} feFunc${channel}`)
          .setAttribute(
            "tableValues",
            palette[kind].map((c) => (c[index] / 255).toFixed(5)).join(" "),
          );
      }
    // Absolute document fragments also work under the portfolio's <base> URL.
    const documentURL = location.href.split("#")[0];
    for (const kind of ["portrait", "world"])
      root.style.setProperty(
        `--${kind}-filter`,
        `url("${documentURL}#palette-${kind}")`,
      );
    document
      .querySelector('link[rel="icon"]')
      ?.setAttribute(
        "href",
        "data:image/svg+xml," +
          encodeURIComponent(T.logo(palette.tokens.accent)),
      );
    P.updateThemeControls(prefs);
    return palette;
  };
  P.updateThemeControls = (prefs) => {
    const palette = T.palette(prefs.themeHue);
    document
      .querySelectorAll("[data-theme-name]")
      .forEach((el) => (el.textContent = palette.name));
    document
      .querySelectorAll("[data-theme-degrees]")
      .forEach((el) => (el.textContent = palette.hue + "°"));
    document
      .querySelectorAll("[data-preset-hue]")
      .forEach((el) =>
        el.setAttribute(
          "aria-pressed",
          String(Number(el.dataset.presetHue) === palette.hue),
        ),
      );
    document.querySelectorAll("[data-theme-hue]").forEach((el) => {
      el.value = palette.hue;
      el.setAttribute(
        "aria-valuetext",
        `${palette.name}, ${palette.hue} degrees`,
      );
    });
    document
      .querySelectorAll("[data-theme-cycle]")
      .forEach((el) => (el.checked = prefs.themeCycle));
  };
})();
