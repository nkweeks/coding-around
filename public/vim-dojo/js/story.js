/* ============================================================
 * VIM DOJO — story scenes
 * Visual-novel beats between belt courses. The arc: the Static
 * corrupting the grid is BYTE & BLADE's exhibition duel — a
 * change started twenty years ago and never completed. Only a
 * student of both ways can finish it.
 *
 * trigger: minimum beltLevel() required (-1 = always available).
 * Scenes marked manual:true are launched by game flow, not the hub.
 * ============================================================ */
(function () {
  'use strict';

  var SCENES = [
    {
      id: 'intro',
      title: 'THE DOOR',
      trigger: -1,
      art: 'assets/img/shell.png',
      lines: [
        { who: 'narrator', text: 'Rain hisses on neon. At the ragged edge of the grid stands a building that should not exist: a dojo, humming with terminal light.' },
        { who: 'shell', text: 'Lost? ...No. Nobody finds this place by accident. Come in out of the static, kid.' },
        { who: 'shell', text: "I'm SHELL. I watch the door, the grid, and everything in between." },
        { who: 'byte', text: 'A new student! Welcome, welcome! I am BYTE — Keeper of First Forms. Here we shape text the way old masters shaped steel.' },
        { who: 'blade', text: "Hm. Another keyboard tourist. I am BLADE. If you're slow, you're already gone." },
        { who: 'shell', text: "Don't mind them. They built this dojo together — finest editors the grid ever produced. ...Once, anyway." },
        { who: 'shell', text: "Out there, something called the Static is chewing through the grid's text. Files corrupting. Whole sectors going to noise." },
        { who: 'shell', text: "We can't fix what we can't edit. So we teach. White Belt first — BYTE is waiting." }
      ]
    },
    {
      id: 'after-white',
      title: 'FIRST FORMS',
      trigger: 0,
      lines: [
        { who: 'byte', text: 'Magnificent footwork! h, j, k, l — the four winds. And you never once reached for the arrow keys. I am SO proud.' },
        { who: 'blade', text: 'He cried when you landed your first count. Actual coolant. From his eyes.' },
        { who: 'byte', text: 'It was a CALIBRATION leak.' },
        { who: 'shell', text: 'Word on the wire: the Static took another archive last night. Train fast, kid. Yellow Belt is BLADE\'s course.' }
      ]
    },
    {
      id: 'after-yellow',
      title: 'THE FLICKER',
      trigger: 1,
      lines: [
        { who: 'blade', text: 'Not bad. You move by words now, not by inches. Speed is a language — you are learning to spell.' },
        { who: 'narrator', text: 'The dojo lights stutter. For half a second, every sign in the room reads ▒▒▒▒▒▒.' },
        { who: 'byte', text: '...That came from inside the walls. The Static has never come INSIDE before.' },
        { who: 'shell', text: 'I saw it too. Keep training. And you two — stop trading looks and start trading lessons.' }
      ]
    },
    {
      id: 'after-orange',
      title: 'FIRST MEND',
      trigger: 2,
      lines: [
        { who: 'shell', text: 'A courier file came in this morning half-eaten by Static. I watched this kid open it and just... fix it. x, r, a little patience. Clean.' },
        { who: 'byte', text: 'Precision! You see? The forms matter! Every keystroke deliberate, every change intentional!' },
        { who: 'blade', text: 'The mend was good. The speed was tragic. We do it MY way next.' },
        { who: 'shell', text: '(They used to finish each other\'s commands, you know. Now they just finish each other\'s patience.)' }
      ]
    },
    {
      id: 'after-green',
      title: 'THE OLD DUEL',
      trigger: 3,
      art: 'assets/img/ninja_robot_fight_begins.jpeg',
      lines: [
        { who: 'shell', text: 'You speak the grammar now — verb, motion, done. That earns you a story.' },
        { who: 'shell', text: 'BYTE and BLADE built this dojo when the grid was young. Partners. The best the wire ever carried.' },
        { who: 'shell', text: 'Twenty years ago they staged an exhibition — one final duel to settle it forever: form, or speed.' },
        { who: 'shell', text: 'Mid-match, the first Static storm hit the grid. The duel never finished. They have not spoken of it since.' },
        { who: 'byte', text: '(from across the hall) ...He froze first.' },
        { who: 'blade', text: '(from the rafters) I heard that, you walking calculator.' },
        { who: 'shell', text: 'An unfinished thing leaves a mark, kid. Remember that.' }
      ]
    },
    {
      id: 'after-blue',
      title: 'IN SYNC',
      trigger: 4,
      lines: [
        { who: 'narrator', text: 'The Static breached the east archive at dawn. For the first time, the masters fought side by side — one editor with four hands.' },
        { who: 'byte', text: 'BLADE — inner quotes, lines forty through sixty!' },
        { who: 'blade', text: "Done before you said 'sixty'. Brackets are yours, tin man." },
        { who: 'narrator', text: 'For one full minute the rivalry vanished — verb and motion moving as one. Then the buffer settled, and they remembered to glare.' },
        { who: 'shell', text: "Heh. You saw it too, didn't you? They're not rivals. They're two halves of one way." }
      ]
    },
    {
      id: 'after-purple',
      title: 'THE FOOTAGE',
      trigger: 5,
      art: 'assets/img/ninja_robot_fight_begins.jpeg',
      lines: [
        { who: 'shell', text: "You've got the searching eye now. So search THIS — old footage. The exhibition. The last frame before the storm." },
        { who: 'shell', text: 'Look what is frozen there. BYTE mid-strike. BLADE mid-counter. A change... started, and never completed.' },
        { who: 'shell', text: 'THAT is the Static, kid. The grid is still holding their unfinished edit — replaying the corruption, over and over, for twenty years.' },
        { who: 'byte', text: '...So it was us. All this time, it was US.' },
        { who: 'blade', text: 'Then we finish it. Tonight.' },
        { who: 'shell', text: "No. Look again. Neither of you can finish it — you'd freeze on the same frame, same as before. It has to be a student trained in BOTH your ways." }
      ]
    },
    {
      id: 'before-final',
      title: 'THE LAST STUDENT',
      trigger: 6,
      lines: [
        { who: 'byte', text: 'Your visual forms are complete. There is nothing left to teach you... except the ending.' },
        { who: 'blade', text: 'The duel must finish, and the grid must SEE it finish. Beat BYTE. Then beat me. Complete the change.' },
        { who: 'byte', text: 'I will not hold back. Do you understand? Against you, I finally get to land my greatest strike. I find that... wonderful.' },
        { who: 'shell', text: "One key left in your training, kid: the dot. Do it once — then let it repeat until the work is done. Funny. That's been the whole story all along." }
      ]
    },
    {
      id: 'finale',
      title: 'THE CHANGE, COMPLETED',
      trigger: 99,
      manual: true,
      lines: [
        { who: 'narrator', text: 'The last keystroke lands. Somewhere deep in the grid, a change that hung open for twenty years finally completes.' },
        { who: 'narrator', text: 'The Static thins. Flickers. And resolves — into clean, quiet text.' },
        { who: 'byte', text: "It's done. The duel is finished. We are... free of it. YOU finished it." },
        { who: 'blade', text: "Form and speed in one editor. I'd bow, but BYTE would never let me forget it. ...Fine. One bow." },
        { who: 'shell', text: "Grid's clean, kid. First time in twenty years. Go collect your belt — there's a certificate waiting with your name on it." }
      ]
    }
  ];

  var STORY = {
    SCENES: SCENES,
    byId: function (id) {
      for (var i = 0; i < SCENES.length; i++) if (SCENES[i].id === id) return SCENES[i];
      return null;
    },
    // first scene due at this belt level that hasn't been seen
    nextPending: function (beltLevel, seen) {
      for (var i = 0; i < SCENES.length; i++) {
        var s = SCENES[i];
        if (s.manual) continue;
        if (beltLevel >= s.trigger && !seen[s.id]) return s;
      }
      return null;
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = STORY;
  if (typeof window !== 'undefined') window.STORY = STORY;
})();
