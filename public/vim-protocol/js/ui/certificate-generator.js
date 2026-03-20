// CertificateGenerator - Generates a cyberpunk PDF certificate on game completion
class CertificateGenerator {
  constructor(storyPath, playerName = '') {
    this.storyPath = storyPath; // 'robot', 'ninja', or null
    this.playerName = (playerName || '').trim().toUpperCase() || 'AGENT';
    this.doc = null;
    this.W = 297; // A4 landscape width in mm
    this.H = 210; // A4 landscape height in mm
    this.images = {};

    // Color palette [R, G, B]
    this.c = {
      bg:           [10,  0,  20],
      bgSecondary:  [26,  0,  40],
      bgPanel:      [36,  0,  70],
      bgDeep:       [20,  0,  35],
      purple:       [157, 78, 221],
      brightPurple: [199, 125, 255],
      deepPurple:   [90,  24, 154],
      cyan:         [0,  213, 255],
      pink:         [255,  0, 110],
      green:        [57, 255,  20],
      white:        [255, 255, 255],
      lightPurple:  [224, 170, 255],
      dimPurple:    [90,  60, 140],
      gridLine:     [40,   0,  80],
    };
  }

  // Load an image — returns {dataURL, width, height} to preserve aspect ratio
  async loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d').drawImage(img, 0, 0);
        resolve({ dataURL: canvas.toDataURL('image/jpeg', 0.85), width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  // Scale image to fit inside boxW × boxH (object-fit: contain), return centered rect
  fitInBox(img, boxX, boxY, boxW, boxH) {
    const imgRatio = img.width / img.height;
    const boxRatio = boxW / boxH;
    let w, h;
    if (imgRatio > boxRatio) { w = boxW; h = boxW / imgRatio; }
    else                      { h = boxH; w = boxH * imgRatio; }
    return { x: boxX + (boxW - w) / 2, y: boxY + (boxH - h) / 2, w, h };
  }

  // addImage wrapper that respects aspect ratio inside a box
  addImageFit(imgObj, boxX, boxY, boxW, boxH) {
    if (!imgObj) return;
    const { x, y, w, h } = this.fitInBox(imgObj, boxX, boxY, boxW, boxH);
    this.doc.addImage(imgObj.dataURL, 'JPEG', x, y, w, h, undefined, 'SLOW');
    return { x, y, w, h };
  }

  // Shorthand: fill a rect with a color
  fillRect(x, y, w, h, rgb) {
    this.doc.setFillColor(rgb[0], rgb[1], rgb[2]);
    this.doc.rect(x, y, w, h, 'F');
  }

  // Shorthand: stroke a rect with a color
  strokeRect(x, y, w, h, rgb, lw = 0.4) {
    this.doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
    this.doc.setLineWidth(lw);
    this.doc.rect(x, y, w, h, 'S');
  }

  // Draw the shared page chrome: dark bg, top/bottom bars, accent lines
  drawPageChrome(gridSpacing = 18, gridColor = null) {
    const gc = gridColor || this.c.gridLine;

    // Main background
    this.fillRect(0, 0, this.W, this.H, this.c.bg);

    // Subtle grid
    this.doc.setDrawColor(gc[0], gc[1], gc[2]);
    this.doc.setLineWidth(0.08);
    for (let x = 0; x <= this.W; x += gridSpacing) this.doc.line(x, 0, x, this.H);
    for (let y = 0; y <= this.H; y += gridSpacing) this.doc.line(0, y, this.W, y);

    // Top bar
    this.fillRect(0, 0, this.W, 18, this.c.bgSecondary);
    // Top accent lines
    this.fillRect(0, 17.5, this.W, 1.0, this.c.purple);
    this.fillRect(0, 18.3, this.W, 0.4, this.c.cyan);

    // Bottom bar
    this.fillRect(0, this.H - 14, this.W, 14, this.c.bgSecondary);
    // Bottom accent lines
    this.fillRect(0, this.H - 14, this.W, 0.4, this.c.cyan);
    this.fillRect(0, this.H - 13.7, this.W, 1.0, this.c.purple);
  }

  // Draw the top bar labels
  drawTopBarLabels(center) {
    this.doc.setFont('courier', 'bold');
    this.doc.setFontSize(7.5);
    this.doc.setTextColor(this.c.cyan[0], this.c.cyan[1], this.c.cyan[2]);
    this.doc.text('VIM PROTOCOL', 8, 11);
    this.doc.setTextColor(this.c.purple[0], this.c.purple[1], this.c.purple[2]);
    this.doc.text(center, this.W / 2, 11, { align: 'center' });
    this.doc.setTextColor(this.c.green[0], this.c.green[1], this.c.green[2]);
    this.doc.text('OPERATION BLACKOUT', this.W - 8, 11, { align: 'right' });
  }

  // Draw bottom footer text
  drawFooter(text) {
    this.doc.setFont('courier', 'normal');
    this.doc.setFontSize(5.5);
    this.doc.setTextColor(this.c.deepPurple[0], this.c.deepPurple[1], this.c.deepPurple[2]);
    this.doc.text(text, this.W / 2, this.H - 4, { align: 'center' });
  }

  // Corner bracket decoration around a rect
  drawCornerBrackets(x, y, w, h, rgb, size = 5) {
    this.doc.setFillColor(rgb[0], rgb[1], rgb[2]);
    const t = 0.8; // thickness
    // TL
    this.doc.rect(x - t, y - t, size, t, 'F');
    this.doc.rect(x - t, y - t, t, size, 'F');
    // TR
    this.doc.rect(x + w - size + t, y - t, size, t, 'F');
    this.doc.rect(x + w, y - t, t, size, 'F');
    // BL
    this.doc.rect(x - t, y + h, size, t, 'F');
    this.doc.rect(x - t, y + h - size + t, t, size, 'F');
    // BR
    this.doc.rect(x + w - size + t, y + h, size, t, 'F');
    this.doc.rect(x + w, y + h - size + t, t, size, 'F');
  }

  // Wrap text into lines that fit maxWidth (using jsPDF getTextWidth)
  wrapText(text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (this.doc.getTextWidth(test) > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  // ─── PAGE 1: Certificate Cover ────────────────────────────────────────────

  async page1() {
    this.drawPageChrome(20);
    this.drawTopBarLabels('CERTIFICATE OF COMPLETION');
    this.drawFooter('20 MISSIONS COMPLETED  ·  NEXUS ELIMINATED  ·  VIM MASTERY ACHIEVED');

    const imgX = 9;
    const imgY = 24;
    const imgW = 108;
    const imgH = 142;

    // ── Left: Ending Image Panel ──────────────────────────────────
    this.fillRect(imgX - 2, imgY - 2, imgW + 4, imgH + 4, this.c.bgPanel);
    this.strokeRect(imgX - 2, imgY - 2, imgW + 4, imgH + 4, this.c.purple, 0.6);
    this.drawCornerBrackets(imgX - 2, imgY - 2, imgW + 4, imgH + 4, this.c.purple);

    if (this.images.ending) {
      this.fillRect(imgX, imgY, imgW, imgH, this.c.bgDeep);
      this.addImageFit(this.images.ending, imgX, imgY, imgW, imgH);
    } else {
      this.fillRect(imgX, imgY, imgW, imgH, this.c.bgDeep);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(28);
      this.doc.setTextColor(this.c.purple[0], this.c.purple[1], this.c.purple[2]);
      this.doc.text('◈', imgX + imgW / 2, imgY + imgH / 2, { align: 'center' });
    }

    // Image caption
    this.doc.setFont('courier', 'bold');
    this.doc.setFontSize(6);
    this.doc.setTextColor(this.c.dimPurple[0], this.c.dimPurple[1], this.c.dimPurple[2]);
    const caption = this.storyPath === 'robot' ? '[ NEURAL NETWORK PATH: VICTORY ]'
                  : this.storyPath === 'ninja'  ? '[ SHADOW PROTOCOL PATH: VICTORY ]'
                  :                               '[ OPERATION BLACKOUT: COMPLETE ]';
    this.doc.text(caption, imgX + imgW / 2, imgY + imgH + 6, { align: 'center' });

    // ── Right: Certificate Content ────────────────────────────────
    const rx = 128;
    const rW = this.W - rx - 9; // usable right-column width
    let ry = 28;

    // Big title
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(24);
    this.doc.setTextColor(this.c.purple[0], this.c.purple[1], this.c.purple[2]);
    this.doc.text('CERTIFICATE', rx, ry);
    ry += 10;
    this.doc.setFontSize(15);
    this.doc.setTextColor(this.c.brightPurple[0], this.c.brightPurple[1], this.c.brightPurple[2]);
    this.doc.text('OF COMPLETION', rx, ry);
    ry += 7;

    // Separator
    this.fillRect(rx, ry, rW, 0.8, this.c.cyan);
    this.fillRect(rx, ry + 1.2, rW, 0.3, this.c.purple);
    ry += 8;

    // ── Awarded to ────────────────────────────────────────────────
    this.doc.setFont('courier', 'normal');
    this.doc.setFontSize(6.5);
    this.doc.setTextColor(this.c.dimPurple[0], this.c.dimPurple[1], this.c.dimPurple[2]);
    this.doc.text('AWARDED TO', rx, ry);
    ry += 7;

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(18);
    this.doc.setTextColor(this.c.cyan[0], this.c.cyan[1], this.c.cyan[2]);
    this.doc.text(this.playerName, rx, ry);
    ry += 8;

    // Thin rule under name
    this.fillRect(rx, ry, rW, 0.3, this.c.deepPurple);
    ry += 7;

    // Program label
    this.doc.setFont('courier', 'normal');
    this.doc.setFontSize(7.5);
    this.doc.setTextColor(this.c.dimPurple[0], this.c.dimPurple[1], this.c.dimPurple[2]);
    this.doc.text('for completing', rx, ry);
    ry += 6;

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(13);
    this.doc.setTextColor(this.c.cyan[0], this.c.cyan[1], this.c.cyan[2]);
    this.doc.text('OPERATION BLACKOUT', rx, ry);
    ry += 5;

    this.doc.setFont('courier', 'normal');
    this.doc.setFontSize(7);
    this.doc.setTextColor(this.c.dimPurple[0], this.c.dimPurple[1], this.c.dimPurple[2]);
    this.doc.text('A 20-Mission Vim Mastery Program', rx, ry);
    ry += 11;

    // Path badge
    const pathLabel = this.storyPath === 'robot' ? 'NEURAL NETWORK PATH'
                    : this.storyPath === 'ninja'  ? 'SHADOW PROTOCOL PATH'
                    :                               'DUAL OPERATIVE PATH';
    const pathColor = this.storyPath === 'robot' ? this.c.cyan
                    : this.storyPath === 'ninja'  ? this.c.pink
                    :                               this.c.purple;

    const badgeW = 82;
    this.fillRect(rx, ry - 4, badgeW, 12, [
      Math.round(pathColor[0] * 0.08),
      Math.round(pathColor[1] * 0.08),
      Math.round(pathColor[2] * 0.08),
    ]);
    this.strokeRect(rx, ry - 4, badgeW, 12, pathColor, 0.5);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(9.5);
    this.doc.setTextColor(pathColor[0], pathColor[1], pathColor[2]);
    this.doc.text(pathLabel, rx + badgeW / 2, ry + 3.5, { align: 'center' });
    ry += 17;

    // Stats
    const stats = [
      { label: 'MISSIONS COMPLETED',    value: '20 / 20' },
      { label: 'VIM COMMANDS MASTERED', value: '30+' },
      { label: 'THREAT STATUS',         value: 'NEXUS ELIMINATED' },
    ];
    for (const s of stats) {
      this.doc.setFont('courier', 'normal');
      this.doc.setFontSize(6.5);
      this.doc.setTextColor(this.c.dimPurple[0], this.c.dimPurple[1], this.c.dimPurple[2]);
      this.doc.text(s.label, rx, ry);
      ry += 4;
      this.doc.setFont('courier', 'bold');
      this.doc.setFontSize(9);
      this.doc.setTextColor(this.c.lightPurple[0], this.c.lightPurple[1], this.c.lightPurple[2]);
      this.doc.text(s.value, rx, ry);
      ry += 3;
      this.fillRect(rx, ry, rW, 0.2, this.c.bgPanel);
      ry += 6;
    }

    ry += 2;

    // Quote box
    const quoteLines = this.storyPath === 'robot'
      ? ['"Probability of mission success was always', 'high with you on the team." — BYTE']
      : this.storyPath === 'ninja'
      ? ['"The mission is complete. No traces.', 'No loose ends. You fought well." — BLADE']
      : ['"NEXUS eliminated. The network is secure.', 'Welcome to the Hall of Fame." — THE CREW'];

    const qH = 24;
    this.fillRect(rx, ry, rW, qH, this.c.bgSecondary);
    this.fillRect(rx, ry, 2.5, qH, pathColor);
    this.fillRect(rx + 2.5, ry, 0.5, qH, this.c.cyan);

    this.doc.setFont('courier', 'normal');
    this.doc.setFontSize(7.5);
    this.doc.setTextColor(this.c.brightPurple[0], this.c.brightPurple[1], this.c.brightPurple[2]);
    this.doc.text(quoteLines[0], rx + 6, ry + 9);
    this.doc.text(quoteLines[1], rx + 6, ry + 17);
  }

  // ─── PAGE 2: Vim Command Codex ─────────────────────────────────────────────

  async page2() {
    this.drawPageChrome(22);
    this.drawTopBarLabels('COMMAND CODEX');
    this.drawFooter('VIM PROTOCOL — OPERATION BLACKOUT  ·  Complete Command Reference');

    // Page title block
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(18);
    this.doc.setTextColor(this.c.purple[0], this.c.purple[1], this.c.purple[2]);
    this.doc.text('VIM COMMAND CODEX', this.W / 2, 29, { align: 'center' });

    this.doc.setFont('courier', 'normal');
    this.doc.setFontSize(7.5);
    this.doc.setTextColor(this.c.dimPurple[0], this.c.dimPurple[1], this.c.dimPurple[2]);
    this.doc.text('All commands mastered during Operation Blackout — your permanent reference guide', this.W / 2, 35, { align: 'center' });

    this.fillRect(18, 37, this.W - 36, 0.7, this.c.purple);
    this.fillRect(18, 38, this.W - 36, 0.3, this.c.cyan);

    // Command categories
    const cats = [
      {
        name: 'NAVIGATION', color: this.c.cyan,
        commands: [
          ['h / j / k / l',   'Move left / down / up / right'],
          ['w / b / e',        'Next word / prev word / end of word'],
          ['0 / $',            'Jump to line start / end'],
          ['^',                'First non-blank character'],
          ['gg / G',           'File start / file end'],
          ['{N}j / {N}k',     'Move N lines down / up'],
        ]
      },
      {
        name: 'FINDING', color: this.c.brightPurple,
        commands: [
          ['f{char}',  'Find character forward on current line'],
          ['F{char}',  'Find character backward on current line'],
          ['t{char}',  'Jump till character (one before it)'],
          ['T{char}',  'Jump till character (backward)'],
          [';',        'Repeat the last f / F / t / T'],
        ]
      },
      {
        name: 'DELETION', color: this.c.pink,
        commands: [
          ['x',     'Delete character under cursor'],
          ['dd',    'Delete (cut) entire line'],
          ['dw',    'Delete from cursor to next word'],
          ['D',     'Delete from cursor to end of line'],
          ['d{obj}','Delete text object  e.g. diw  di"  di('],
          ['daw',   'Delete word including surrounding space'],
        ]
      },
      {
        name: 'INSERT MODE', color: this.c.green,
        commands: [
          ['i / a',   'Insert before cursor / after cursor'],
          ['I / A',   'Insert at line start / end'],
          ['o / O',   'Open new line below / above'],
          ['Esc',     'Exit Insert — return to Normal mode'],
        ]
      },
      {
        name: 'CHANGE', color: this.c.purple,
        commands: [
          ['cw',      'Change from cursor to next word'],
          ['cc / C',  'Change whole line / to end of line'],
          ['r{char}', 'Replace single character under cursor'],
          ['s',       'Substitute character and enter Insert'],
          ['c{obj}',  'Change text object  e.g. ciw  ci"  ci('],
        ]
      },
      {
        name: 'YANK & PASTE', color: this.c.cyan,
        commands: [
          ['yy',   'Yank (copy) entire line into register'],
          ['yw',   'Yank from cursor to next word'],
          ['y$',   'Yank from cursor to end of line'],
          ['p / P','Paste after cursor / before cursor'],
        ]
      },
      {
        name: 'UNDO & REDO', color: this.c.brightPurple,
        commands: [
          ['u',      'Undo the last change'],
          ['Ctrl-r', 'Redo — reverse the last undo'],
        ]
      },
      {
        name: 'VISUAL MODE', color: this.c.pink,
        commands: [
          ['v',    'Enter Visual character mode'],
          ['V',    'Enter Visual line mode'],
          ['d / y','Delete / yank the current selection'],
        ]
      },
      {
        name: 'TEXT OBJECTS', color: this.c.green,
        commands: [
          ['ciw / diw', 'Change / delete inner word'],
          ['daw',       'Delete around word (includes space)'],
          ['ci" / di"', 'Change / delete inside double quotes'],
          ['ci( / di(', 'Change / delete inside parentheses'],
        ]
      },
      {
        name: 'ADVANCED', color: this.c.purple,
        commands: [
          ['J',    'Join current line with the line below'],
          ['>>',   'Indent current line one level right'],
          ['<<',   'Indent current line one level left'],
          ['%',    'Jump to matching bracket / parenthesis'],
        ]
      },
    ];

    // 3-column layout
    const cols = 3;
    const padL = 10;
    const padR = 10;
    const gapX = 5;
    const colW = (this.W - padL - padR - gapX * (cols - 1)) / cols;
    const startY = 42;
    const rows = Math.ceil(cats.length / cols);
    const rowH = Math.floor((this.H - 14 - startY) / rows); // fit all rows above bottom bar

    cats.forEach((cat, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = padL + col * (colW + gapX);
      const cy = startY + row * rowH;

      // Panel bg + left accent
      this.fillRect(cx, cy, colW, rowH - 2, this.c.bgSecondary);
      this.fillRect(cx, cy, 2.5, rowH - 2, cat.color);

      // Category name
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(7.5);
      this.doc.setTextColor(cat.color[0], cat.color[1], cat.color[2]);
      this.doc.text(cat.name, cx + 5.5, cy + 7);

      // Thin rule under category name
      this.fillRect(cx + 5.5, cy + 9, colW - 8, 0.2,
        [cat.color[0] >> 1, cat.color[1] >> 1, cat.color[2] >> 1]);

      let cmdY = cy + 13;
      for (const [cmd, desc] of cat.commands) {
        if (cmdY > cy + rowH - 5) break;

        // Command key in bold light purple
        this.doc.setFont('courier', 'bold');
        this.doc.setFontSize(6.5);
        this.doc.setTextColor(this.c.lightPurple[0], this.c.lightPurple[1], this.c.lightPurple[2]);
        this.doc.text(cmd, cx + 5.5, cmdY);

        // Description dimmer
        this.doc.setFont('courier', 'normal');
        this.doc.setFontSize(5.5);
        this.doc.setTextColor(this.c.dimPurple[0], this.c.dimPurple[1], this.c.dimPurple[2]);
        this.doc.text(desc, cx + 5.5, cmdY + 3.5);

        cmdY += 8;
      }
    });
  }

  // ─── PAGE 3: The Crew ──────────────────────────────────────────────────────

  async page3() {
    this.drawPageChrome(24);
    this.drawTopBarLabels('FIELD OPERATIVES');
    this.drawFooter('VIM PROTOCOL — OPERATION BLACKOUT  ·  The operatives who guided you through 20 missions');

    // Page title
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(18);
    this.doc.setTextColor(this.c.purple[0], this.c.purple[1], this.c.purple[2]);
    this.doc.text('THE CREW', this.W / 2, 29, { align: 'center' });

    this.doc.setFont('courier', 'normal');
    this.doc.setFontSize(7.5);
    this.doc.setTextColor(this.c.dimPurple[0], this.c.dimPurple[1], this.c.dimPurple[2]);
    this.doc.text('The operatives who guided you through Operation Blackout', this.W / 2, 35, { align: 'center' });

    this.fillRect(18, 37, this.W - 36, 0.7, this.c.purple);
    this.fillRect(18, 38, this.W - 36, 0.3, this.c.cyan);

    // Character definitions
    const chars = [
      {
        name: 'ZERO',
        title: 'THE ARCHITECT',
        color: this.c.purple,
        imgKey: null,
        initial: 'Z',
        description: 'The enigmatic leader of the Resistance. ZERO recruited you and designed the VIM Protocol. Identity unknown. Communicates only through encrypted transmissions.',
        traits: 'Strategic · Cryptic · Visionary',
      },
      {
        name: 'BYTE',
        title: 'THE MACHINE',
        color: this.c.cyan,
        imgKey: 'robot_happy',
        initial: 'B',
        description: 'A rogue AI who defected from NEXUS. Provides tactical analysis, probability calculations, and system access. Loyal to logic — and those who earn its trust through skill.',
        traits: 'Analytical · Precise · Loyal',
      },
      {
        name: 'BLADE',
        title: 'THE SHADOW',
        color: this.c.pink,
        imgKey: 'ninja',
        initial: 'B',
        description: 'A veteran cyber-ninja who operates in darkness. BLADE believes in instincts over algorithms. Expert in infiltration. Left NEXUS after discovering their true agenda.',
        traits: 'Intuitive · Swift · Ruthless',
      },
      {
        name: 'SHELL',
        title: 'THE VETERAN',
        color: this.c.green,
        imgKey: 'shell',
        initial: 'S',
        description: 'A legendary hacker from the early days of the Resistance. SHELL has seen every NEXUS trick in the book. Gruff but invaluable — when Shell speaks, operatives listen.',
        traits: 'Experienced · Direct · Reliable',
      },
    ];

    const cardY = 42;
    const cardH = 120;
    const gapX = 5;
    const padL = 9;
    const padR = 9;
    const cardW = (this.W - padL - padR - gapX * (chars.length - 1)) / chars.length;

    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      const cx = padL + i * (cardW + gapX);

      // Card background + border
      this.fillRect(cx, cardY, cardW, cardH, this.c.bgSecondary);
      this.strokeRect(cx, cardY, cardW, cardH, ch.color, 0.5);
      // Top accent bar
      this.fillRect(cx, cardY, cardW, 3, ch.color);

      // Portrait area
      const imgPad = 3;
      const imgW = cardW - imgPad * 2;
      const imgH = 52;
      const imgX = cx + imgPad;
      const imgY2 = cardY + 6;

      if (ch.imgKey && this.images[ch.imgKey]) {
        this.fillRect(imgX, imgY2, imgW, imgH, this.c.bgDeep);
        const fit = this.addImageFit(this.images[ch.imgKey], imgX, imgY2, imgW, imgH);
        this.strokeRect(imgX, imgY2, imgW, imgH, ch.color, 0.4);
      } else {
        // Placeholder with initial
        this.fillRect(imgX, imgY2, imgW, imgH, this.c.bgPanel);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(36);
        this.doc.setTextColor(ch.color[0], ch.color[1], ch.color[2]);
        this.doc.text(ch.initial, imgX + imgW / 2, imgY2 + imgH / 2 + 7, { align: 'center' });
      }

      // Name
      let ty = cardY + imgH + 14;
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(11);
      this.doc.setTextColor(ch.color[0], ch.color[1], ch.color[2]);
      this.doc.text(ch.name, cx + cardW / 2, ty, { align: 'center' });
      ty += 5;

      // Title
      this.doc.setFont('courier', 'bold');
      this.doc.setFontSize(6.5);
      this.doc.setTextColor(this.c.dimPurple[0], this.c.dimPurple[1], this.c.dimPurple[2]);
      this.doc.text(ch.title, cx + cardW / 2, ty, { align: 'center' });
      ty += 3.5;

      // Divider
      this.fillRect(cx + 8, ty, cardW - 16, 0.3,
        [ch.color[0] >> 1, ch.color[1] >> 1, ch.color[2] >> 1]);
      ty += 5;

      // Description (word-wrapped)
      this.doc.setFont('courier', 'normal');
      this.doc.setFontSize(5.5);
      this.doc.setTextColor(this.c.dimPurple[0], this.c.dimPurple[1], this.c.dimPurple[2]);
      const descLines = this.wrapText(ch.description, cardW - 10);
      for (const line of descLines.slice(0, 5)) {
        this.doc.text(line, cx + 5, ty);
        ty += 4;
      }
      ty += 2;

      // Traits
      this.doc.setFont('courier', 'bold');
      this.doc.setFontSize(5.5);
      this.doc.setTextColor(ch.color[0], ch.color[1], ch.color[2]);
      this.doc.text(ch.traits, cx + cardW / 2, ty, { align: 'center' });
    }

    // Story arc summary bar
    const barY = cardY + cardH + 6;
    const barH = 26;
    this.fillRect(9, barY, this.W - 18, barH, this.c.bgSecondary);
    this.strokeRect(9, barY, this.W - 18, barH, this.c.purple, 0.3);

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(7);
    this.doc.setTextColor(this.c.purple[0], this.c.purple[1], this.c.purple[2]);
    this.doc.text('OPERATION BLACKOUT — STORY ARCS', this.W / 2, barY + 6, { align: 'center' });

    const arcLines = [
      'ACT 1 (Missions 1–5): First Contact  ·  Basic movement & infiltration',
      'ACT 2 (Missions 6–12): Deep Cover  ·  Deletion, insert, change, yank — and growing tensions between BYTE and BLADE',
      'ACT 3 (Missions 13–17): The Divergence  ·  Choose Neural Network or Shadow Protocol  ·  Advanced text objects & operations',
      'ACT 4 (Missions 18–20): Final Strike  ·  Join, indent, bracket matching — NEXUS eliminated',
    ];
    this.doc.setFont('courier', 'normal');
    this.doc.setFontSize(5.5);
    this.doc.setTextColor(this.c.dimPurple[0], this.c.dimPurple[1], this.c.dimPurple[2]);
    let lineY = barY + 11;
    for (const arc of arcLines) {
      this.doc.text(arc, this.W / 2, lineY, { align: 'center' });
      lineY += 3.8;
    }
  }

  // ─── Main entry point ─────────────────────────────────────────────────────

  async generate() {
    if (!window.jspdf) {
      alert('PDF library not loaded. Please check your internet connection and try again.');
      return;
    }
    const { jsPDF } = window.jspdf;

    // Show a brief status message
    const btn = document.getElementById('cert-download-btn');
    if (btn) {
      btn.textContent = 'GENERATING...';
      btn.disabled = true;
    }

    try {
      // Load images
      const imageMap = {
        robot_happy: '/vim-protocol/images/robot_happy.jpg',
        ninja:       '/vim-protocol/images/ninja.jpg',
        shell:       '/vim-protocol/images/shell.png',
      };
      if (this.storyPath === 'robot') {
        imageMap.ending = '/vim-protocol/images/robot_defeats_ninja.jpg';
      } else if (this.storyPath === 'ninja') {
        imageMap.ending = '/vim-protocol/images/ninja_defeats_robot.jpg';
      } else {
        imageMap.ending = '/vim-protocol/images/ninja_robot_fight_begins.jpg';
      }
      // Also try .jpg if .jpg fails
      for (const [key, src] of Object.entries(imageMap)) {
        let data = await this.loadImage(src);
        if (!data) {
          data = await this.loadImage(src.replace('.jpg', '.jpg'));
        }
        if (data) this.images[key] = data;
      }

      this.doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      await this.page1();
      this.doc.addPage();
      await this.page2();
      this.doc.addPage();
      await this.page3();

      this.doc.save('vim-protocol-operation-blackout.pdf');
    } catch (err) {
      console.error('[CertGen] Error:', err);
      alert('Certificate generation failed. See console for details.');
    } finally {
      if (btn) {
        btn.textContent = 'DOWNLOAD CERTIFICATE [PDF]';
        btn.disabled = false;
      }
    }
  }
}
