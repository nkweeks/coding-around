/* Translate browser keys without swallowing Vim's uppercase F or browser shortcuts. */
(function () {
  "use strict";
  function token(event, mode) {
    const key = event.key;
    if (
      event.isComposing ||
      event.metaKey ||
      event.altKey ||
      key === "Tab" ||
      /^F\d+$/.test(key)
    )
      return null;
    if (event.ctrlKey) {
      if (key.toLowerCase() === "r") return "<C-r>";
      if (key === "[") return "<Esc>";
      return null;
    }
    const arrows =
      mode === "INSERT"
        ? {
            ArrowLeft: "<Left>",
            ArrowDown: "<Down>",
            ArrowUp: "<Up>",
            ArrowRight: "<Right>",
          }
        : { ArrowLeft: "h", ArrowDown: "j", ArrowUp: "k", ArrowRight: "l" };
    return (
      arrows[key] ||
      { Escape: "<Esc>", Enter: "<CR>", Backspace: "<BS>" }[key] ||
      (key.length === 1 ? key : null)
    );
  }
  const api = { token };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.VimInput = api;
})();
