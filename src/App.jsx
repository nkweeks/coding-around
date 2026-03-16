import { useEffect, useRef, useState } from 'react'
import './App.css'
import HpdArrestLogPage from './HpdArrestLogPage.jsx'
import vimProtocolShell from './vimProtocolShell.js'

const HPD_ARREST_LOG_ROUTE = '/hpd-arrest-log'
const VIM_PROTOCOL_ROUTE = '/vim-protocol'
const VIM_PROTOCOL_LEGACY_ROUTE = '/vim-protocol/index.html'
const VIM_PROTOCOL_ASSET_BASE = '/vim-protocol'
const VIM_PROTOCOL_STYLE_PATHS = [
  `${VIM_PROTOCOL_ASSET_BASE}/css/main.css`,
  `${VIM_PROTOCOL_ASSET_BASE}/css/cyberpunk-theme.css`,
  `${VIM_PROTOCOL_ASSET_BASE}/css/vim-editor.css`,
  `${VIM_PROTOCOL_ASSET_BASE}/css/ui-components.css`,
  `${VIM_PROTOCOL_ASSET_BASE}/css/characters.css`,
]
const VIM_PROTOCOL_SCRIPT_PATHS = [
  `${VIM_PROTOCOL_ASSET_BASE}/js/vim/buffer.js`,
  `${VIM_PROTOCOL_ASSET_BASE}/js/vim/cursor.js`,
  `${VIM_PROTOCOL_ASSET_BASE}/js/vim/commands.js`,
  `${VIM_PROTOCOL_ASSET_BASE}/js/vim/vim-simulator.js`,
  `${VIM_PROTOCOL_ASSET_BASE}/js/core/storage.js`,
  `${VIM_PROTOCOL_ASSET_BASE}/js/core/state-manager.js`,
  `${VIM_PROTOCOL_ASSET_BASE}/js/core/game.js`,
  `${VIM_PROTOCOL_ASSET_BASE}/js/narrative/characters.js`,
  `${VIM_PROTOCOL_ASSET_BASE}/js/narrative/story-manager.js`,
  `${VIM_PROTOCOL_ASSET_BASE}/js/levels/skill-catalog.js`,
  `${VIM_PROTOCOL_ASSET_BASE}/js/levels/level-data.js`,
  `${VIM_PROTOCOL_ASSET_BASE}/js/levels/mission-validator.js`,
  `${VIM_PROTOCOL_ASSET_BASE}/js/levels/level-manager.js`,
  `${VIM_PROTOCOL_ASSET_BASE}/js/ui/modal.js`,
  `${VIM_PROTOCOL_ASSET_BASE}/js/ui/hud.js`,
  `${VIM_PROTOCOL_ASSET_BASE}/js/ui/skill-log.js`,
  `${VIM_PROTOCOL_ASSET_BASE}/js/ui/terminal.js`,
]
const VIM_BOOT_FEED = [
  'Linking BLADE mission profile',
  'Restoring BYTE advisory channel',
  'Calibrating command-history relay',
  'Arming normal-mode traversal core',
]
const VIM_BOOT_STATUS_CARDS = [
  { label: 'Operatives', value: 'BLADE // BYTE' },
  { label: 'Target', value: 'NEXUS TERMINAL' },
  { label: 'Mode', value: 'TRAINING SHARD' },
]

const featuredProject = {
  name: 'Benstagram.net',
  label: 'Featured Project',
  summary:
    'A modern photo-first community platform made for people named Ben, with clean posting, profile, and discovery flows.',
  orchardSummary: 'A photo-first social product for people named Ben.',
  stack: ['React', 'Node.js', 'PostgreSQL', 'AWS S3'],
  status: 'Live now',
  url: 'https://benstagram.net',
}

const featuredSubproject = {
  name: 'VIM Protocol',
  label: 'Featured Subproject',
  summary:
    'A cyber training simulator built around a custom Vim engine, branching missions, and character-driven progression.',
  orchardSummary: 'A command-driven training game built on a custom Vim engine.',
  stack: ['Vanilla JS', 'Custom Vim engine', 'Branching story', 'Terminal UI'],
  status: 'Playable now',
  source: 'Source project: hacking_game',
  url: VIM_PROTOCOL_ROUTE,
}

const featuredOpsProject = {
  name: 'HPD Arrest Log Viewer',
  label: 'Featured Operational Tool',
  summary:
    'A local-first intake and review tool that downloads arrest-log PDFs, parses structured records, and surfaces watch alerts through a fast operational dashboard.',
  orchardSummary: 'A fast local review tool for arrest-log PDFs and alerts.',
  stack: ['Python', 'Flask', 'PDF parsing', 'Watch alerts'],
  status: 'Snapshot synced',
  source: 'Source project: hpd_arrest_log_viewer',
  url: HPD_ARREST_LOG_ROUTE,
}

const featuredCollection = [featuredProject, featuredSubproject, featuredOpsProject]
const HOME_THEME_STORAGE_KEY = 'coding-around-home-theme'

function normalizePath(pathname) {
  if (!pathname || pathname === '/') {
    return '/'
  }

  return pathname.replace(/\/+$/, '')
}

function CodingAroundMark() {
  return (
    <svg
      className="brand-svg"
      viewBox="0 0 220 220"
      role="img"
      aria-label="Coding Around logo"
    >
      <defs>
        <linearGradient id="logoFrame" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9da8ff" />
          <stop offset="100%" stopColor="#6f7dff" />
        </linearGradient>
        <radialGradient id="logoGlow" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#1f2f8f" />
          <stop offset="100%" stopColor="#0a1129" />
        </radialGradient>
        <linearGradient id="logoStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#91f4ff" />
          <stop offset="100%" stopColor="#7f8fff" />
        </linearGradient>
      </defs>
      <rect
        x="18"
        y="18"
        width="184"
        height="184"
        rx="52"
        fill="url(#logoGlow)"
        stroke="url(#logoFrame)"
        strokeWidth="5"
      />
      <circle cx="110" cy="110" r="67" fill="none" stroke="url(#logoStroke)" strokeWidth="10" />
      <ellipse
        cx="110"
        cy="110"
        rx="74"
        ry="32"
        fill="none"
        stroke="url(#logoFrame)"
        strokeWidth="6"
        opacity="0.8"
        transform="rotate(-18 110 110)"
      />
      <path
        d="M143 81a40 40 0 1 0 0 58"
        fill="none"
        stroke="#eef2ff"
        strokeWidth="11"
        strokeLinecap="round"
      />
      <path
        d="M88 139l20-56 20 56m-32-21h24"
        fill="none"
        stroke="#eef2ff"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="161" cy="84" r="5" fill="#90f3ff" />
      <circle cx="64" cy="156" r="5.5" fill="#9da8ff" />
    </svg>
  )
}

function OrangeBiteMark({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 96 96"
      role="img"
      aria-label="Orange with a bite taken out"
    >
      <defs>
        <radialGradient id="orangeBody" cx="36%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffd27d" />
          <stop offset="58%" stopColor="#ff9a2f" />
          <stop offset="100%" stopColor="#ef6c00" />
        </radialGradient>
        <linearGradient id="orangeLeaf" x1="28%" y1="18%" x2="86%" y2="88%">
          <stop offset="0%" stopColor="#8ef1a8" />
          <stop offset="100%" stopColor="#29b46f" />
        </linearGradient>
        <mask id="orangeBiteMask">
          <rect width="96" height="96" fill="#fff" />
          <circle cx="74" cy="35" r="10" fill="#000" />
          <circle cx="83" cy="48" r="8" fill="#000" />
          <circle cx="73" cy="59" r="6.5" fill="#000" />
        </mask>
      </defs>

      <path d="M46 14c0-5.5 4.5-10 10-10s10 4.5 10 10v4H46v-4Z" fill="#4f3112" />
      <path
        d="M61 10c8.6 0 16.7 3.8 22 10.3-6.9.8-14.3-1.5-20.1-6.4A33.6 33.6 0 0 1 61 10Z"
        fill="url(#orangeLeaf)"
      />
      <path
        d="M68.5 20c-4.4.8-8.8 3.2-12.5 6.8"
        stroke="#ddffe8"
        strokeOpacity="0.72"
        strokeWidth="2.4"
        strokeLinecap="round"
      />

      <g mask="url(#orangeBiteMask)">
        <circle cx="48" cy="50" r="28" fill="url(#orangeBody)" />
        <circle cx="48" cy="50" r="25.5" fill="none" stroke="#ffc15e" strokeWidth="3.8" />
        <path
          d="M35 38c5.4-3.7 13.1-5.1 20.2-3.6"
          stroke="#fff1bf"
          strokeOpacity="0.8"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M31.5 48.5c9.1-4.8 21.6-5 31 0"
          stroke="#fff7d7"
          strokeOpacity="0.38"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="M34 61c5.8 3.8 13.7 5.2 20.8 3.7"
          stroke="#d85800"
          strokeOpacity="0.26"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
}

function VimProtocolPage() {
  const [stylesReady, setStylesReady] = useState(false)
  const [gameReady, setGameReady] = useState(false)
  const shellRef = useRef(null)
  const bootPhaseLabel = stylesReady ? 'Mission shell online' : 'Securing terminal skin'
  const bootPhaseDetail = stylesReady ? 'Injecting command runtime' : 'Warming neon grid'

  useEffect(() => {
    document.title = 'VIM Protocol | Coding Around'

    const previousTheme = document
      .querySelector('meta[name="theme-color"]')
      ?.getAttribute('content')

    let themeMeta = document.querySelector('meta[name="theme-color"]')
    let createdThemeMeta = false
    if (!themeMeta) {
      themeMeta = document.createElement('meta')
      themeMeta.setAttribute('name', 'theme-color')
      document.head.appendChild(themeMeta)
      createdThemeMeta = true
    }
    themeMeta.setAttribute('content', '#02080d')

    let cancelled = false

    let baseTag = document.querySelector('base[data-vim-protocol-base]')
    let createdBaseTag = false
    if (!baseTag) {
      baseTag = document.createElement('base')
      baseTag.href = `${VIM_PROTOCOL_ASSET_BASE}/`
      baseTag.dataset.vimProtocolBase = 'true'
      document.head.prepend(baseTag)
      createdBaseTag = true
    }

    const createdLinks = []
    const createdScripts = []

    if (shellRef.current && shellRef.current.innerHTML.trim() !== vimProtocolShell.trim()) {
      shellRef.current.innerHTML = vimProtocolShell
    }

    const nextFrame = () =>
      new Promise((resolve) => {
        window.requestAnimationFrame(() => resolve())
      })

    const loadStyle = (href) =>
      new Promise((resolve, reject) => {
        const existing = document.querySelector(`link[data-vim-protocol-style="${href}"]`)
        if (existing) {
          if (existing.sheet) {
            resolve()
            return
          }
          existing.addEventListener('load', () => resolve(), { once: true })
          existing.addEventListener('error', () => reject(new Error(`Failed to load ${href}`)), {
            once: true,
          })
          return
        }

        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = href
        link.dataset.vimProtocolStyle = href
        link.onload = () => resolve()
        link.onerror = () => reject(new Error(`Failed to load ${href}`))
        document.head.appendChild(link)
        createdLinks.push(link)
      })

    const loadScript = (src) =>
      new Promise((resolve, reject) => {
        if (document.querySelector(`script[data-vim-protocol-src="${src}"]`)) {
          resolve()
          return
        }

        const script = document.createElement('script')
        script.src = src
        script.async = false
        script.dataset.vimProtocolSrc = src
        script.onload = () => resolve()
        script.onerror = () => reject(new Error(`Failed to load ${src}`))
        document.body.appendChild(script)
        createdScripts.push(script)
      })

    const bootstrap = async () => {
      await Promise.all(VIM_PROTOCOL_STYLE_PATHS.map((href) => loadStyle(href)))

      if (cancelled) {
        return
      }

      setStylesReady(true)
      await nextFrame()
      await nextFrame()

      for (const src of VIM_PROTOCOL_SCRIPT_PATHS) {
        if (cancelled) {
          return
        }
        await loadScript(src)
      }

      if (cancelled) {
        return
      }

      const initScript = document.createElement('script')
      initScript.dataset.vimProtocolInit = 'true'
      initScript.text = `
        if (window.game && window.game.hud && typeof window.game.hud.stopTimer === 'function') {
          window.game.hud.stopTimer();
        }
        window.game = new Game();
        window.game.init();
      `
      document.body.appendChild(initScript)
      createdScripts.push(initScript)

      await nextFrame()

      if (!cancelled) {
        setGameReady(true)
      }
    }

    bootstrap().catch((error) => {
      console.error('VIM Protocol bootstrap failed', error)
    })

    return () => {
      cancelled = true
      if (window.game?.hud && typeof window.game.hud.stopTimer === 'function') {
        window.game.hud.stopTimer()
      }
      createdScripts.reverse().forEach((node) => node.remove())
      createdLinks.reverse().forEach((node) => node.remove())
      if (createdBaseTag) {
        baseTag?.remove()
      }
      if (themeMeta && previousTheme) {
        themeMeta.setAttribute('content', previousTheme)
      } else if (createdThemeMeta) {
        themeMeta?.remove()
      }
    }
  }, [])

  return (
    <div className="vim-protocol-page">
      <div
        ref={shellRef}
        className={`vim-protocol-shell ${stylesReady ? 'has-styles' : 'is-prerender'} ${gameReady ? 'is-live' : 'is-staged'}`}
      />

      <div className={`vim-boot-screen ${stylesReady ? 'is-styled' : ''} ${gameReady ? 'is-hidden' : ''}`}>
        <div className="vim-boot-panel">
          <p className="vim-boot-kicker">Coding Around // launch sequence</p>
          <h1>VIM Protocol</h1>
          <p className="vim-boot-copy">
            The crew is staging a live terminal run. Mission layers, command systems, and story
            channels come online before operator control is released.
          </p>
          <div className="vim-boot-chips" aria-hidden="true">
            <span>OPERATIVE: BLADE</span>
            <span>ADVISOR: BYTE</span>
            <span>THREAT: NEXUS</span>
          </div>
          <div className="vim-boot-progress" aria-hidden="true">
            <span className={stylesReady ? 'is-advanced' : ''} />
          </div>
          <div className="vim-boot-meta">
            <span>{bootPhaseLabel}</span>
            <span>{bootPhaseDetail}</span>
          </div>
          <div className="vim-boot-grid">
            <section className="vim-boot-card">
              <div className="vim-boot-card-head">
                <span className="vim-boot-card-dot" />
                <p>MISSION FEED</p>
              </div>
              <div className="vim-boot-log">
                {VIM_BOOT_FEED.map((item, index) => (
                  <p key={item} style={{ '--boot-delay': `${index * 110}ms` }}>
                    <span>&gt;</span>
                    {item}
                  </p>
                ))}
              </div>
            </section>
            <section className="vim-boot-card">
              <div className="vim-boot-card-head">
                <span className="vim-boot-card-dot" />
                <p>MISSION STATUS</p>
              </div>
              <div className="vim-boot-status-grid">
                {VIM_BOOT_STATUS_CARDS.map((item) => (
                  <article key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

function PortfolioHome() {
  const [themeMode, setThemeMode] = useState(() => {
    if (typeof window === 'undefined') {
      return 'cinematic'
    }

    return window.localStorage.getItem(HOME_THEME_STORAGE_KEY) === 'orchard'
      ? 'orchard'
      : 'cinematic'
  })
  const [motion, setMotion] = useState({
    scrollY: 0,
    progress: 0,
    pointerX: 0,
    pointerY: 0,
    heroPhase: 0,
    heroScroll: 0,
    viewportH: 1,
  })
  const [reducedMotion, setReducedMotion] = useState(false)
  const frameRef = useRef(0)
  const pointerRef = useRef({ x: 0, y: 0 })
  const latestRef = useRef({ ...motion })
  const isOrchardTheme = themeMode === 'orchard'

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onMediaChange = () => setReducedMotion(mediaQuery.matches)

    onMediaChange()
    mediaQuery.addEventListener('change', onMediaChange)

    return () => mediaQuery.removeEventListener('change', onMediaChange)
  }, [])

  useEffect(() => {
    const onPointerMove = (event) => {
      pointerRef.current.x = event.clientX / window.innerWidth - 0.5
      pointerRef.current.y = event.clientY / window.innerHeight - 0.5
    }

    const onPointerReset = () => {
      pointerRef.current.x = 0
      pointerRef.current.y = 0
    }

    const tick = () => {
      const viewportH = Math.max(1, window.innerHeight)
      const scrollY =
        window.scrollY ||
        window.pageYOffset ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - viewportH)
      const heroScroll = scrollY
      const heroPhase = Math.min(1.4, heroScroll / Math.max(1, viewportH * 0.9))
      const next = {
        scrollY,
        progress: Math.min(1, scrollY / maxScroll),
        pointerX: pointerRef.current.x,
        pointerY: pointerRef.current.y,
        heroPhase,
        heroScroll,
        viewportH,
      }
      const previous = latestRef.current
      const hasChange =
        Math.abs(next.scrollY - previous.scrollY) > 0.1 ||
        Math.abs(next.pointerX - previous.pointerX) > 0.001 ||
        Math.abs(next.pointerY - previous.pointerY) > 0.001 ||
        Math.abs(next.heroPhase - previous.heroPhase) > 0.001 ||
        Math.abs(next.progress - previous.progress) > 0.001

      if (hasChange) {
        latestRef.current = next
        setMotion(next)
      }

      frameRef.current = window.requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerleave', onPointerReset)
    window.addEventListener('blur', onPointerReset)
    frameRef.current = window.requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerleave', onPointerReset)
      window.removeEventListener('blur', onPointerReset)
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current)
      }
    }
  }, [])

  const depth = (reducedMotion ? 0.45 : 1) * (isOrchardTheme ? 0.22 : 1)
  const heroTravel = Math.min(motion.heroScroll, motion.viewportH * 1.05)
  const nearLift = heroTravel * -0.32 * depth
  const midLift = heroTravel * -0.54 * depth
  const farLift = heroTravel * -0.74 * depth
  const orbitScale = 1 + Math.min(0.26, motion.heroPhase * 0.24) * depth
  const year = new Date().getFullYear()
  const heroKicker = isOrchardTheme ? 'Coding Around' : 'Curated software portfolio'
  const heroHeadingLead = isOrchardTheme ? 'The work comes first.' : 'Three live builds.'
  const heroHeadingTail = isOrchardTheme
    ? ' Open any project.'
    : ' Three different kinds of software.'
  const heroDescription = isOrchardTheme
    ? 'A simpler view of the same portfolio.'
    : 'Coding Around now leads with the work itself: one social product, one playable terminal game, and one operational data tool. Less filler, more software.'
  const sectionTitle = isOrchardTheme ? 'Open the three projects.' : 'Three projects worth opening'
  const sectionSummary = isOrchardTheme
    ? 'Each card leads directly to the real product.'
    : 'The portfolio home now stays narrow on purpose: three representative builds, each with a direct path into the real product.'

  useEffect(() => {
    document.title = 'Coding Around | Development Portfolio'
  }, [])

  useEffect(() => {
    document.body.classList.toggle('body-orchard', isOrchardTheme)
    window.localStorage.setItem(HOME_THEME_STORAGE_KEY, themeMode)

    return () => {
      document.body.classList.remove('body-orchard')
    }
  }, [isOrchardTheme, themeMode])

  return (
    <div className={`app-shell ${isOrchardTheme ? 'theme-orchard' : ''}`}>
      <div className="parallax-scene" aria-hidden="true">
        <div
          className="scene-layer scene-stars"
          style={{
            transform: `translate3d(${motion.pointerX * 140 * depth}px, ${motion.scrollY * -0.6 * depth}px, 0)`,
          }}
        />
        <div
          className="scene-layer scene-grid"
          style={{
            transform: `translate3d(${motion.pointerX * -180 * depth}px, ${motion.scrollY * -1.15 * depth}px, 0) rotate(${motion.progress * -34 * depth}deg)`,
          }}
        />
        <div
          className="scene-layer scene-rays"
          style={{
            transform: `translate3d(${motion.pointerX * 100 * depth}px, ${motion.scrollY * -1.7 * depth}px, 0) rotate(${motion.progress * 34 * depth}deg)`,
          }}
        />
        <div
          className="scene-layer scene-orbit"
          style={{
            transform: `translate3d(0, ${motion.scrollY * -2.15 * depth}px, 0) scale(${orbitScale})`,
          }}
        />
        <div className="scene-noise" />
      </div>

      <header className="top-bar">
        <a className="top-brand" href="#home">
          <span className="brand-dot" />
          coding around
        </a>
        <div className="top-bar-controls">
          <nav>
            <a href="#projects">Projects</a>
            <a href={featuredProject.url} target="_blank" rel="noreferrer">
              Benstagram
            </a>
            <a href={featuredOpsProject.url}>HPD Log</a>
            <a href={featuredSubproject.url}>VIM Protocol</a>
            <a href="mailto:hello@codingaround.dev">Contact</a>
          </nav>
          <button
            className={`orange-toggle ${isOrchardTheme ? 'is-active' : ''}`}
            type="button"
            aria-label={isOrchardTheme ? 'Return to cinematic style' : 'Switch to orchard style'}
            aria-pressed={isOrchardTheme}
            onClick={() => setThemeMode(isOrchardTheme ? 'cinematic' : 'orchard')}
            title={isOrchardTheme ? 'Return to cinematic style' : 'Switch to orchard style'}
          >
            <OrangeBiteMark className="orange-toggle-icon" />
          </button>
        </div>
      </header>

      <main>
        <section className="hero-stage" id="home">
          <div className="hero-pin">
            <p
              className="hero-ghost"
              aria-hidden="true"
              style={{
                transform: `translate3d(${motion.pointerX * -90 * depth}px, ${motion.heroPhase * 240 * depth}px, 0)`,
              }}
            >
              AROUND
            </p>

            <div
              className="hero-copy"
              style={{
                transform: `translate3d(0, ${nearLift}px, 0) scale(${1 - Math.min(0.05, motion.heroPhase * 0.035) * depth})`,
              }}
            >
              <p className="kicker">{heroKicker}</p>
              <h1>
                {heroHeadingLead}
                <span>{heroHeadingTail}</span>
              </h1>
              <p className="hero-description">{heroDescription}</p>
              <div className="hero-project-strip" aria-label="Featured project links">
                {featuredCollection.map((project) => (
                  <a
                    key={project.name}
                    href={project.url}
                    target={project.url.startsWith('http') ? '_blank' : undefined}
                    rel={project.url.startsWith('http') ? 'noreferrer' : undefined}
                  >
                    {project.name}
                  </a>
                ))}
              </div>
              <div className="hero-actions">
                <a className="btn btn-outline" href="#projects">
                  {isOrchardTheme ? 'Browse work' : 'View projects'}
                </a>
                <a className="btn btn-quiet" href="mailto:hello@codingaround.dev">
                  {isOrchardTheme ? 'Start a conversation' : 'Email hello@codingaround.dev'}
                </a>
              </div>
            </div>

            <div className="hero-layers">
              <aside
                className="hero-mark"
                style={{
                  transform: `perspective(1400px) rotateX(${motion.pointerY * -11 * depth}deg) rotateY(${motion.pointerX * 16 * depth}deg) translate3d(${motion.pointerX * 32 * depth}px, ${midLift + motion.pointerY * -26 * depth}px, 0)`,
                }}
              >
                <CodingAroundMark />
                <p className="mark-title">Coding Around</p>
                <p className="mark-subtitle">Designing and shipping what is next.</p>
              </aside>

              <article
                className="depth-card depth-card-a"
                style={{
                  transform: `translate3d(${motion.pointerX * -66 * depth}px, ${farLift + motion.pointerY * 28 * depth}px, 0) rotate(${motion.heroPhase * -5 * depth + motion.pointerX * -3 * depth}deg)`,
                }}
              >
                <p>Web App</p>
                <span>Benstagram ships the polished product side of the portfolio.</span>
              </article>

              <article
                className="depth-card depth-card-b"
                style={{
                  transform: `translate3d(${motion.pointerX * 56 * depth}px, ${nearLift * 0.58 + motion.pointerY * -16 * depth}px, 0) rotate(${motion.heroPhase * 4 * depth + motion.pointerX * 2 * depth}deg)`,
                }}
              >
                <p>Operational Tool</p>
                <span>HPD Arrest Log turns local PDF workflows into a usable dashboard.</span>
              </article>

              <article
                className="depth-card depth-card-c"
                style={{
                  transform: `translate3d(${motion.pointerX * -48 * depth}px, ${heroTravel * 0.2 * depth + motion.pointerY * 12 * depth}px, 0) rotate(${motion.heroPhase * -4 * depth + motion.pointerX * -2 * depth}deg)`,
                }}
              >
                <p>Playable System</p>
                <span>VIM Protocol brings the interactive, experimental side forward.</span>
              </article>
            </div>
          </div>
        </section>

        <section className="projects" id="projects">
          <div className="section-head">
            <p className="kicker">Selected work</p>
            <h2>{sectionTitle}</h2>
            <p className="section-summary">{sectionSummary}</p>
          </div>

          <article className="featured-project-card">
            <div className="featured-project-copy">
              <p className="featured-project-kicker">{featuredProject.label}</p>
              <h3>{featuredProject.name}</h3>
              <p>{isOrchardTheme ? featuredProject.orchardSummary : featuredProject.summary}</p>
              <div className="featured-project-tags">
                {(isOrchardTheme ? featuredProject.stack.slice(0, 2) : featuredProject.stack).map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
              <div className="featured-project-actions">
                <span>{featuredProject.status}</span>
                <a href={featuredProject.url} target="_blank" rel="noreferrer">
                  Visit benstagram.net
                </a>
              </div>
            </div>

            <div className="featured-project-visual" aria-hidden="true">
              <div className="ben-preview-shell">
                <div className="ben-preview-topbar">
                  <div className="ben-logo-chip">
                    <span>b</span>
                  </div>
                  <p>benstagram</p>
                  <span className="ben-live-dot" />
                </div>
                <div className="ben-post-card">
                  <header>
                    <div className="ben-avatar" />
                    <p>the_ben_official</p>
                  </header>
                  <div className="ben-post-image" />
                  <footer>
                    <span />
                    <span />
                    <span />
                  </footer>
                </div>
              </div>
            </div>
          </article>

          <article className="featured-project-card featured-project-card-vim">
            <div className="featured-project-copy featured-project-copy-vim">
              <p className="featured-project-kicker featured-project-kicker-vim">
                {featuredSubproject.label}
              </p>
              <h3>{featuredSubproject.name}</h3>
              <p>{isOrchardTheme ? featuredSubproject.orchardSummary : featuredSubproject.summary}</p>
              <div className="featured-project-tags featured-project-tags-vim">
                {(isOrchardTheme ? featuredSubproject.stack.slice(0, 2) : featuredSubproject.stack).map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
              <div className="featured-project-actions featured-project-actions-vim">
                <span>{featuredSubproject.status}</span>
                <strong>{featuredSubproject.source}</strong>
                <a href={featuredSubproject.url}>Open full game</a>
              </div>
            </div>

            <div className="featured-project-visual featured-project-visual-vim" aria-hidden="true">
              <div className="vim-preview-shell">
                <div className="vim-preview-topbar">
                  <span className="vim-light vim-light-red" />
                  <span className="vim-light vim-light-yellow" />
                  <span className="vim-light vim-light-green" />
                  <p>VIM PROTOCOL :: CYBER TRAINING SIMULATOR</p>
                </div>

                <div className="vim-preview-body">
                  <div className="vim-preview-sidebar">
                    <span>&gt; mission briefing</span>
                    <span>&gt; objectives</span>
                    <span>&gt; hints</span>
                  </div>

                  <div className="vim-preview-editor">
                    <div className="vim-preview-header">
                      <span className="vim-status-dot" />
                      <p>OPERATION: FIRST CONTACT</p>
                    </div>
                    <div className="vim-preview-code">
                      <p><span>1</span> // nexus intercept log</p>
                      <p><span>2</span> &gt;&gt; navigate to target marker</p>
                      <p><span>3</span> [TARGET] access point alpha</p>
                      <p><span>4</span> press <strong>j</strong> to descend</p>
                      <p><span>5</span> press <strong>k</strong> to return</p>
                    </div>
                    <div className="vim-preview-statusbar">
                      <span>-- NORMAL --</span>
                      <span>line 3, col 1</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <article className="featured-project-card featured-project-card-hpd">
            <div className="featured-project-copy featured-project-copy-hpd">
              <p className="featured-project-kicker featured-project-kicker-hpd">
                {featuredOpsProject.label}
              </p>
              <h3>{featuredOpsProject.name}</h3>
              <p>{isOrchardTheme ? featuredOpsProject.orchardSummary : featuredOpsProject.summary}</p>
              <div className="featured-project-tags featured-project-tags-hpd">
                {(isOrchardTheme ? featuredOpsProject.stack.slice(0, 2) : featuredOpsProject.stack).map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
              <div className="featured-project-actions featured-project-actions-hpd">
                <span>{featuredOpsProject.status}</span>
                <strong>{featuredOpsProject.source}</strong>
                <a href={featuredOpsProject.url}>Open snapshot</a>
              </div>
            </div>

            <div className="featured-project-visual featured-project-visual-hpd" aria-hidden="true">
              <div className="hpd-preview-shell">
                <div className="hpd-preview-topbar">
                  <div className="hpd-preview-lights">
                    <span className="hpd-preview-light hpd-preview-light-blue" />
                    <span className="hpd-preview-light hpd-preview-light-orange" />
                    <span className="hpd-preview-light hpd-preview-light-green" />
                  </div>
                  <p>HPD ARREST LOG VIEWER :: LOCAL SNAPSHOT</p>
                  <span className="hpd-preview-chip">SYNCED</span>
                </div>

                <div className="hpd-preview-body">
                  <div className="hpd-preview-toolbar">
                    <span>name query: doe</span>
                    <span>window: 14d</span>
                    <span>rows: 250</span>
                  </div>

                  <div className="hpd-preview-metrics">
                    <article>
                      <strong>784</strong>
                      <span>records</span>
                    </article>
                    <article>
                      <strong>45</strong>
                      <span>source PDFs</span>
                    </article>
                    <article>
                      <strong>1</strong>
                      <span>alert</span>
                    </article>
                  </div>

                  <div className="hpd-preview-table">
                    <div className="hpd-preview-row hpd-preview-row-head">
                      <span>Arrested</span>
                      <span>Person</span>
                      <span>Charge</span>
                    </div>
                    <div className="hpd-preview-row">
                      <span>03/12 22:15</span>
                      <span>DOE, JOHN</span>
                      <span>Disorderly conduct</span>
                    </div>
                    <div className="hpd-preview-row">
                      <span>03/12 18:40</span>
                      <span>SMITH, JANE</span>
                      <span>Bench warrant</span>
                    </div>
                    <div className="hpd-preview-row">
                      <span>03/11 09:20</span>
                      <span>LEE, DAVID</span>
                      <span>Unauthorized entry</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </section>
      </main>

      <footer>
        <p>© {year} Coding Around</p>
        <p>Built with React + Vite, tuned for AWS Amplify.</p>
      </footer>
    </div>
  )
}

function App() {
  const pathname = typeof window === 'undefined' ? '/' : normalizePath(window.location.pathname)

  if (pathname === HPD_ARREST_LOG_ROUTE) {
    return <HpdArrestLogPage />
  }

  if (pathname === VIM_PROTOCOL_ROUTE || pathname === VIM_PROTOCOL_LEGACY_ROUTE) {
    return <VimProtocolPage />
  }

  return <PortfolioHome />
}

export default App
