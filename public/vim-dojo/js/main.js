/* VIM DOJO — bootstrap */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    var game = new window.Game(window.CURRICULUM);
    window.VimDojoUI.init(game, window.CURRICULUM);

    // desktop wrapper: replay every earned achievement to Steam at boot
    // (covers unlocks earned before the bridge existed, and other slots)
    if (window.SteamBridge) game.syncSteamAchievements();

    // dev helper: window.dojoDebug.unlockAll() for playtesting
    window.dojoDebug = {
      game: game,
      unlockAll: function () {
        window.CURRICULUM.TRACKS.forEach(function (t) {
          t.drills.forEach(function (d) {
            game.save.drills[d.id] = game.save.drills[d.id] || { best: d.par, medal: 'gold' };
          });
          game.save.duels[t.duel.id] = true;
          if (t.finalDuel) game.save.duels[t.finalDuel.id] = true;
        });
        window.STORY.SCENES.forEach(function (sc) { game.save.scenes[sc.id] = true; });
        game.persist();
        window.VimDojoUI.showHub();
      }
    };
  });
})();
