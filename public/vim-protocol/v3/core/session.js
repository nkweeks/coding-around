/* Shared, UI-independent exercise lifecycle. The tests replay this exact runner. */
(function () {
  "use strict";
  var Engine =
    typeof module !== "undefined" && module.exports
      ? require("./vim-engine.js")
      : window.VimEngine;
  function Session(drill) {
    this.drill = drill;
    this.engine = new Engine(drill.start);
    if (drill.cursor) this.engine.setCursor(drill.cursor[0], drill.cursor[1]);
    this.engine.fileName = drill.file || "training.txt";
    this.shell = !!drill.shell;
    this.shellText = "";
    this.keys = [];
    this.stop = 0;
    this.complete = false;
    this.message = "";
    this.startedAt = Date.now();
  }
  Session.prototype.key = function (token) {
    if (this.complete) return;
    this.keys.push(token);
    this.message = "";
    if (this.shell) {
      if (token === "<CR>") {
        if (this.shellText.trim() === "vim " + this.engine.fileName) {
          this.shell = false;
          this.shellText = "";
        } else this.message = "Open the file with: vim " + this.engine.fileName;
      } else if (token === "<BS>") this.shellText = this.shellText.slice(0, -1);
      else if (token === "<Esc>") this.shellText = "";
      else if (token.length === 1 && this.shellText.length < 200)
        this.shellText += token;
      return;
    }
    this.engine.key(token);
    var d = this.drill,
      e = this.engine;
    if (d.type === "cursor") {
      var next = d.stops[this.stop];
      if (next && e.row === next[0] && e.col === next[1]) this.stop++;
      this.complete =
        this.stop === d.stops.length &&
        e.equals(d.start) &&
        e.mode === "NORMAL";
    } else if (d.type === "match") {
      this.complete =
        e.equals(d.target) && e.mode === "NORMAL" && (!d.requireExit || e.quit);
    }
    if (e.quit && !this.complete) {
      this.message =
        "You left before the objective was complete. Restart to try again.";
    } else if (e.lastMessage) this.message = e.lastMessage;
  };
  if (typeof module !== "undefined" && module.exports) module.exports = Session;
  if (typeof window !== "undefined") window.TrainingSession = Session;
})();
