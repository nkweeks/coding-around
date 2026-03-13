// Skill Log - Persistent command reference panel that grows as the player progresses
class SkillLog {
  constructor() {
    this.currentLevelId = 0;
    this.panel = null;
    this._build();
    this._setupEvents();
  }

  // Build the panel DOM (hidden by default)
  _build() {
    const panel = document.createElement('div');
    panel.id = 'skill-log-panel';
    panel.className = 'skill-log-panel hidden';
    panel.innerHTML = `
      <div class="skill-log-header">
        <div class="skill-log-title">
          <span class="skill-log-icon">//</span> SKILL LOG
        </div>
        <button class="skill-log-close" id="skill-log-close" title="Close (Escape)">✕</button>
      </div>
      <div class="skill-log-subheader" id="skill-log-subheader">
        0 / ${SKILL_CATALOG.length} commands unlocked
        <div class="skill-progress-bar">
          <div class="skill-progress-fill" id="skill-progress-fill" style="width:0%"></div>
        </div>
      </div>
      <div class="skill-log-body" id="skill-log-body"></div>
    `;
    document.body.appendChild(panel);
    this.panel = panel;
  }

  _setupEvents() {
    document.getElementById('skill-log-close').addEventListener('click', () => this.hide());

    // SKILL LOG button in top bar
    document.getElementById('skill-log-btn').addEventListener('click', () => this.toggle());

    // Close on Escape (only when panel is open)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.panel.classList.contains('hidden')) {
        e.stopPropagation();
        this.hide();
      }
    }, true); // capture phase so it fires before vim
  }

  // Update which level the player is on
  update(levelId) {
    this.currentLevelId = levelId;
  }

  show() {
    this._render();
    this.panel.classList.remove('hidden');
    // Prevent vim from receiving keys while panel is open
    document.getElementById('skill-log-btn').setAttribute('data-open', 'true');
  }

  hide() {
    this.panel.classList.add('hidden');
    document.getElementById('skill-log-btn').removeAttribute('data-open');
  }

  toggle() {
    if (this.panel.classList.contains('hidden')) {
      this.show();
    } else {
      this.hide();
    }
  }

  isOpen() {
    return !this.panel.classList.contains('hidden');
  }

  _render() {
    const unlocked = getUnlockedSkills(this.currentLevelId);
    const total = SKILL_CATALOG.length;
    const pct = Math.round((unlocked.length / total) * 100);

    // Update progress header
    document.getElementById('skill-log-subheader').innerHTML = `
      ${unlocked.length} / ${total} commands unlocked
      <div class="skill-progress-bar">
        <div class="skill-progress-fill" style="width:${pct}%"></div>
      </div>
    `;

    // Group by category, in catalog order
    const categories = getCategories();
    const body = document.getElementById('skill-log-body');

    body.innerHTML = categories.map(cat => {
      const allInCat = SKILL_CATALOG.filter(s => s.category === cat);
      const unlockedInCat = allInCat.filter(s => s.learnedAt <= this.currentLevelId);
      const lockedInCat = allInCat.filter(s => s.learnedAt > this.currentLevelId);
      const fullyUnlocked = lockedInCat.length === 0;
      const fullyLocked = unlockedInCat.length === 0;

      const badge = fullyLocked
        ? `<span class="skill-cat-badge cat-locked">LOCKED</span>`
        : fullyUnlocked
          ? `<span class="skill-cat-badge cat-done">✓ MASTERED</span>`
          : `<span class="skill-cat-badge cat-partial">${unlockedInCat.length}/${allInCat.length}</span>`;

      const rows = [
        ...unlockedInCat.map(s => `
          <div class="skill-entry skill-unlocked">
            <span class="skill-cmd">${s.command}</span>
            <span class="skill-desc">${s.description}</span>
          </div>
        `),
        ...lockedInCat.map(s => `
          <div class="skill-entry skill-locked">
            <span class="skill-cmd">${s.command}</span>
            <span class="skill-desc">Unlocks at Level ${s.learnedAt + 1}</span>
          </div>
        `)
      ].join('');

      return `
        <div class="skill-category ${fullyLocked ? 'cat-all-locked' : ''}">
          <div class="skill-cat-header">
            <span class="skill-cat-name">${cat}</span>
            ${badge}
          </div>
          ${fullyLocked ? '' : `<div class="skill-list">${rows}</div>`}
        </div>
      `;
    }).join('');
  }
}
