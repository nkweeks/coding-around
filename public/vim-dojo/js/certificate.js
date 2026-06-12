/* ============================================================
 * VIM DOJO — certificate of mastery
 * Canvas-rendered, zero dependencies, downloadable as PNG.
 * ============================================================ */
(function () {
  'use strict';

  var W = 1754, H = 1240; // A4 landscape @ ~150dpi

  var GOLD = '#e7c766';
  var GOLD_DIM = '#a8893f';
  var INK = '#f0e9ff';
  var DIM = '#b3a3d9';
  var CYAN = '#2de2ff';
  var MAGENTA = '#ff3df0';

  function loadImage(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = src;
    });
  }

  // letter-spaced centered text; glyphs must be drawn left-aligned or the
  // per-glyph centering shifts narrow/wide pairs into each other
  function spacedText(ctx, text, x, y, spacing) {
    var total = 0;
    for (var i = 0; i < text.length; i++) total += ctx.measureText(text[i]).width + spacing;
    total -= spacing;
    var cx = x - total / 2;
    var prevAlign = ctx.textAlign;
    ctx.textAlign = 'left';
    for (var j = 0; j < text.length; j++) {
      ctx.fillText(text[j], cx, y);
      cx += ctx.measureText(text[j]).width + spacing;
    }
    ctx.textAlign = prevAlign;
  }

  function cornerOrnament(ctx, x, y, sx, sy) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sx, sy);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 64); ctx.lineTo(0, 18); ctx.quadraticCurveTo(0, 0, 18, 0); ctx.lineTo(64, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(10, 52); ctx.lineTo(10, 26); ctx.quadraticCurveTo(10, 10, 26, 10); ctx.lineTo(52, 10);
    ctx.lineWidth = 1.6;
    ctx.stroke();
    // diamond
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.moveTo(26, 26); ctx.lineTo(36, 20); ctx.lineTo(46, 26); ctx.lineTo(36, 32);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function dividerWithDiamond(ctx, cx, y, halfW) {
    ctx.strokeStyle = GOLD_DIM;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cx - halfW, y); ctx.lineTo(cx - 18, y);
    ctx.moveTo(cx + 18, y); ctx.lineTo(cx + halfW, y);
    ctx.stroke();
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.moveTo(cx - 10, y); ctx.lineTo(cx, y - 7); ctx.lineTo(cx + 10, y); ctx.lineTo(cx, y + 7);
    ctx.closePath();
    ctx.fill();
  }

  function drawPortrait(ctx, img, cx, cy, r) {
    if (!img) return;
    ctx.save();
    // glow ring
    ctx.shadowColor = 'rgba(157, 107, 255, 0.8)';
    ctx.shadowBlur = 26;
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    // cover-fit
    var scale = Math.max((r * 2) / img.width, (r * 2) / img.height);
    var dw = img.width * scale, dh = img.height * scale;
    ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
    ctx.restore();
  }

  function drawSeal(ctx, cx, cy, r) {
    ctx.save();
    // outer rings
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(cx, cy, r - 14, 0, Math.PI * 2); ctx.stroke();

    // ring text
    var ring = '• THE NEON DOJO • WAY OF THE MASTERS ';
    ctx.fillStyle = GOLD;
    ctx.font = '700 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (var i = 0; i < ring.length; i++) {
      var a = (i / ring.length) * Math.PI * 2 - Math.PI / 2;
      ctx.save();
      ctx.translate(cx + Math.cos(a) * (r - 26), cy + Math.sin(a) * (r - 26));
      ctx.rotate(a + Math.PI / 2);
      ctx.fillText(ring[i], 0, 0);
      ctx.restore();
    }

    // torii gate
    ctx.strokeStyle = GOLD;
    ctx.lineCap = 'round';
    var g = r * 0.42;
    ctx.lineWidth = 6;
    ctx.beginPath(); // top beam (curved)
    ctx.moveTo(cx - g, cy - g * 0.55);
    ctx.quadraticCurveTo(cx, cy - g * 0.85, cx + g, cy - g * 0.55);
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.beginPath(); // second beam
    ctx.moveTo(cx - g * 0.78, cy - g * 0.18);
    ctx.lineTo(cx + g * 0.78, cy - g * 0.18);
    ctx.stroke();
    ctx.lineWidth = 5;
    ctx.beginPath(); // pillars
    ctx.moveTo(cx - g * 0.6, cy - g * 0.62); ctx.lineTo(cx - g * 0.52, cy + g * 0.9);
    ctx.moveTo(cx + g * 0.6, cy - g * 0.62); ctx.lineTo(cx + g * 0.52, cy + g * 0.9);
    ctx.stroke();

    ctx.font = 'italic 12px Georgia, serif';
    ctx.fillStyle = GOLD_DIM;
    // sits between the torii pillars' feet and the ring text band
    ctx.fillText('est. 2086', cx, cy + g * 1.32);
    ctx.restore();
  }

  function signatureByte(ctx, cx, y) {
    // robotic square-wave signature
    ctx.save();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    var x = cx - 95;
    ctx.moveTo(x, y);
    var steps = [[18, 0], [0, -22], [16, 0], [0, 22], [14, 0], [0, -14], [18, 0], [0, 14],
                 [12, 0], [0, -26], [20, 0], [0, 26], [16, 0], [0, -10], [26, 0], [0, 10], [30, 0]];
    for (var i = 0; i < steps.length; i++) {
      x += steps[i][0];
      y += steps[i][1];
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    // terminal dot
    ctx.fillStyle = CYAN;
    ctx.beginPath(); ctx.arc(x + 8, y, 3.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function signatureBlade(ctx, cx, y) {
    // one fast slash with a hook and flick
    ctx.save();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 100, y + 8);
    ctx.bezierCurveTo(cx - 40, y - 34, cx + 10, y + 16, cx + 58, y - 22);
    ctx.stroke();
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(cx + 44, y - 4);
    ctx.quadraticCurveTo(cx + 88, y - 12, cx + 100, y - 30);
    ctx.stroke();
    // shuriken flick
    ctx.fillStyle = MAGENTA;
    ctx.beginPath(); ctx.arc(cx + 104, y - 32, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function draw(ctx, opts, imgs) {
    // ---- background ----
    ctx.fillStyle = '#140628';
    ctx.fillRect(0, 0, W, H);
    var rad = ctx.createRadialGradient(W / 2, H * 0.42, 80, W / 2, H * 0.42, W * 0.62);
    rad.addColorStop(0, 'rgba(72, 32, 134, 0.55)');
    rad.addColorStop(1, 'rgba(20, 6, 40, 0)');
    ctx.fillStyle = rad;
    ctx.fillRect(0, 0, W, H);

    // ---- borders (Perfect Form gets a brighter, doubled frame) ----
    ctx.save();
    if (opts.perfect) {
      ctx.shadowColor = 'rgba(255, 215, 130, 0.65)';
      ctx.shadowBlur = 16;
    }
    ctx.strokeStyle = opts.perfect ? '#ffd982' : GOLD;
    ctx.lineWidth = opts.perfect ? 6 : 5;
    ctx.strokeRect(34, 34, W - 68, H - 68);
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1.6;
    ctx.strokeRect(50, 50, W - 100, H - 100);
    if (opts.perfect) {
      ctx.lineWidth = 2.4;
      ctx.strokeRect(42, 42, W - 84, H - 84);
    }
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = MAGENTA;
    ctx.globalAlpha = 0.55;
    ctx.shadowColor = MAGENTA;
    ctx.shadowBlur = 10;
    ctx.lineWidth = 1;
    ctx.strokeRect(58, 58, W - 116, H - 116);
    ctx.restore();
    cornerOrnament(ctx, 66, 66, 1, 1);
    cornerOrnament(ctx, W - 66, 66, -1, 1);
    cornerOrnament(ctx, 66, H - 66, 1, -1);
    cornerOrnament(ctx, W - 66, H - 66, -1, -1);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    // ---- header ----
    ctx.fillStyle = CYAN;
    ctx.font = '700 22px Georgia, serif';
    spacedText(ctx, 'T H E   N E O N   D O J O', W / 2, 138, 6);

    ctx.save();
    ctx.fillStyle = GOLD;
    ctx.shadowColor = 'rgba(231, 199, 102, 0.55)';
    ctx.shadowBlur = 22;
    ctx.font = '700 76px Georgia, "Times New Roman", serif';
    ctx.fillText('Certificate of Mastery', W / 2, 232);
    ctx.restore();

    dividerWithDiamond(ctx, W / 2, 268, 280);

    // ---- presented to ----
    ctx.fillStyle = DIM;
    ctx.font = 'italic 26px Georgia, serif';
    ctx.fillText('this certifies that', W / 2, 330);

    ctx.save();
    ctx.fillStyle = INK;
    ctx.shadowColor = 'rgba(255, 61, 240, 0.65)';
    ctx.shadowBlur = 24;
    // auto-shrink so long names never reach the portraits (or the border)
    var nameSize = 86;
    var nameFont = function (px) {
      return 'italic 700 ' + px + 'px "Snell Roundhand", "Brush Script MT", "Segoe Script", cursive';
    };
    ctx.font = nameFont(nameSize);
    while (ctx.measureText(opts.name).width > 980 && nameSize > 34) {
      nameSize -= 4;
      ctx.font = nameFont(nameSize);
    }
    ctx.fillText(opts.name, W / 2, 442);
    ctx.restore();
    // flourish under name
    ctx.strokeStyle = GOLD_DIM;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 330, 470);
    ctx.quadraticCurveTo(W / 2, 488, W / 2 + 330, 470);
    ctx.stroke();

    // ---- body ----
    ctx.fillStyle = DIM;
    ctx.font = '24px Georgia, serif';
    ctx.fillText('has walked the Way of the Neon Masters, mastered the ancient forms of the editor VIM,', W / 2, 532);
    ctx.fillText('completed the change that hung unfinished for twenty years,', W / 2, 568);
    ctx.fillText('and is hereby granted the rank of', W / 2, 604);

    ctx.save();
    ctx.fillStyle = GOLD;
    ctx.shadowColor = 'rgba(231, 199, 102, 0.5)';
    ctx.shadowBlur = 18;
    // Georgia has no 900 weight — synthetic bold inflates glyphs past their
    // measured width and crowds letters, so use the real 700
    ctx.font = '700 52px Georgia, serif';
    spacedText(ctx, 'BLACK BELT  ·  VIM MASTER', W / 2, 678, 7);
    ctx.restore();

    // black belt bar with gold tips
    var bw = 340, bh = 20, bx = W / 2 - bw / 2, by = 706;
    ctx.fillStyle = '#0c0c12';
    ctx.strokeStyle = GOLD_DIM;
    ctx.lineWidth = 1.4;
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeRect(bx, by, bw, bh);
    ctx.fillStyle = GOLD;
    ctx.fillRect(bx, by, 26, bh);
    ctx.fillRect(bx + bw - 26, by, 26, bh);

    // ---- stats ----
    ctx.fillStyle = CYAN;
    ctx.font = '22px "SF Mono", Menlo, Consolas, monospace';
    ctx.fillText(
      opts.golds + ' of ' + opts.total + ' gold medals  ·  8 of 8 belts  ·  ' + opts.date,
      W / 2, 778
    );
    if (opts.perfect) {
      ctx.save();
      ctx.fillStyle = '#ffd982';
      ctx.shadowColor = 'rgba(255, 217, 130, 0.7)';
      ctx.shadowBlur = 14;
      ctx.font = '700 24px Georgia, serif';
      spacedText(ctx, '★  PERFECT FORM — EVERY DRILL GOLD  ★', W / 2, 818, 3);
      ctx.restore();
    }

    // ---- portraits ----
    drawPortrait(ctx, imgs.byte, 210, 470, 110);
    drawPortrait(ctx, imgs.blade, W - 210, 470, 110);
    ctx.fillStyle = DIM;
    ctx.font = '700 16px Georgia, serif';
    ctx.fillText('KEEPER OF FORMS', 210, 614);
    ctx.fillText('THE LIVING EDGE', W - 210, 614);

    // ---- seal + signatures ----
    drawSeal(ctx, W / 2, 980, 104);

    var sigY = 968;
    signatureByte(ctx, 360, sigY);
    signatureBlade(ctx, W - 360, sigY);
    ctx.strokeStyle = GOLD_DIM;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(360 - 150, sigY + 26); ctx.lineTo(360 + 150, sigY + 26);
    ctx.moveTo(W - 360 - 150, sigY + 26); ctx.lineTo(W - 360 + 150, sigY + 26);
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.font = '700 20px Georgia, serif';
    ctx.fillText('BYTE', 360, sigY + 56);
    ctx.fillText('BLADE', W - 360, sigY + 56);
    ctx.fillStyle = DIM;
    ctx.font = 'italic 17px Georgia, serif';
    ctx.fillText('Master of Forms', 360, sigY + 82);
    ctx.fillText('Master of Speed', W - 360, sigY + 82);

    ctx.fillStyle = DIM;
    ctx.font = 'italic 16px Georgia, serif';
    ctx.fillText('witnessed by SHELL, the Watcher', W / 2, 1118);

    // ---- footer ----
    ctx.fillStyle = GOLD_DIM;
    ctx.font = '14px "SF Mono", Menlo, Consolas, monospace';
    ctx.fillText('certificate no. ' + opts.certNo, W / 2, 1162);
  }

  function certNoFor(name, dateStr, perfect) {
    var s = name + '|' + dateStr;
    var h = 0;
    for (var i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return (perfect ? 'VD-PF-' : 'VD-') +
      Math.abs(h).toString(16).toUpperCase().slice(0, 6).padStart(6, '0');
  }

  var Certificate = {
    W: W,
    H: H,
    build: function (opts) {
      var name = (opts.name || 'A Nameless Master').trim() || 'A Nameless Master';
      var date = opts.date || new Date().toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric'
      });
      return Promise.all([
        loadImage('assets/img/robot_happy.jpeg'),
        loadImage('assets/img/ninja.jpeg')
      ]).then(function (imgs) {
        var canvas = opts.canvas || document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        var ctx = canvas.getContext('2d');
        draw(ctx, {
          name: name,
          date: date,
          golds: opts.golds,
          total: opts.total,
          perfect: !!opts.perfect,
          certNo: certNoFor(name, date, !!opts.perfect)
        }, { byte: imgs[0], blade: imgs[1] });
        return canvas;
      });
    },
    download: function (canvas, filename) {
      var a = document.createElement('a');
      a.download = filename || 'vim-dojo-certificate.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
    }
  };

  if (typeof window !== 'undefined') window.Certificate = Certificate;
})();
