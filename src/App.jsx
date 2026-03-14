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

const projectTracks = [
  {
    title: 'Immersive Web Apps',
    note: 'Core focus: product-grade web experiences with clear UX and strong polish.',
    projects: [
      {
        name: 'Benstagram.net',
        type: 'Photo-first community platform for people named Ben',
        stack: 'React, Node.js, PostgreSQL, AWS S3',
        status: 'Live now',
        url: 'https://benstagram.net',
      },
      {
        name: 'Atlas Commerce',
        type: 'Headless marketplace',
        stack: 'React, Node, Stripe, Postgres',
        status: 'Live + scaling',
      },
      {
        name: 'Pulse Studio',
        type: 'Realtime editorial dashboard',
        stack: 'Next.js, Supabase, Edge functions',
        status: 'Private beta',
      },
      {
        name: 'Orbit Booking',
        type: 'Scheduling platform',
        stack: 'TypeScript, GraphQL, Redis',
        status: 'Case study complete',
      },
    ],
  },
  {
    title: 'Automation + AI Flows',
    note: 'Systems that reduce repetitive work and create momentum for teams.',
    projects: [
      {
        name: 'HPD Arrest Log Viewer',
        type: 'PDF ingest, parsing, and searchable arrest-log review dashboard',
        stack: 'Python, Flask, pdfplumber, APScheduler',
        status: 'Synced snapshot',
        source: 'Local source: hpd_arrest_log_viewer',
        url: HPD_ARREST_LOG_ROUTE,
        linkLabel: 'Open snapshot',
      },
      {
        name: 'Signal Watcher',
        type: 'Automated incident digest',
        stack: 'Python, OpenAI, Slack API',
        status: 'Running daily',
      },
      {
        name: 'Brief Engine',
        type: 'Client brief generator',
        stack: 'Node, Prompt pipelines, Notion API',
        status: 'In active use',
      },
      {
        name: 'Commit Lens',
        type: 'Code review assistant',
        stack: 'Git hooks, AST analysis, LLM tooling',
        status: 'Experimental',
      },
    ],
  },
  {
    title: 'Systems + Tooling',
    note: 'Developer-first utilities and internal platforms for reliability and speed.',
    projects: [
      {
        name: 'VIM Protocol (Hacking Game)',
        type: 'Cyber training simulator with branching missions',
        stack: 'Vanilla JS, HTML/CSS, custom Vim engine',
        status: 'Local subproject',
        source: 'Local source: hacking_game',
        url: VIM_PROTOCOL_ROUTE,
        linkLabel: 'Open full game',
      },
      {
        name: 'Patchline CLI',
        type: 'Release automation tool',
        stack: 'Go, GitHub API, Docker',
        status: 'Production',
      },
      {
        name: 'Node Atlas',
        type: 'Service dependency mapper',
        stack: 'Rust, D3, gRPC',
        status: 'R&D',
      },
      {
        name: 'Cache Forge',
        type: 'Distributed caching layer',
        stack: 'Redis, Lua, Kubernetes',
        status: 'Benchmarking',
      },
    ],
  },
  {
    title: 'Physical + Experimental',
    note: 'A space for non-web work: hardware, installations, and playful prototypes.',
    projects: [
      {
        name: 'Reactive Light Wall',
        type: 'Audio-driven LED installation',
        stack: 'ESP32, WebSockets, TouchDesigner',
        status: 'Gallery run complete',
      },
      {
        name: 'Pocket Synth Grid',
        type: 'MIDI sequencing prototype',
        stack: 'Teensy, C++, custom PCB',
        status: 'Iteration 2',
      },
      {
        name: 'Field Capture Kit',
        type: 'Data + camera rig',
        stack: 'Raspberry Pi, Python, OpenCV',
        status: 'In progress',
      },
    ],
  },
]

const styleSpectrum = [
  'Narrative brand sites',
  'Dense data dashboards',
  'Realtime collaborative apps',
  'API-first developer products',
  'CLI and terminal tooling',
  'Physical-computing prototypes',
]

const milestones = [
  {
    quarter: 'Now',
    detail: 'Showcase core web apps with deep case studies and live demos.',
  },
  {
    quarter: 'Q2',
    detail: 'Publish automation projects with architecture diagrams and impact metrics.',
  },
  {
    quarter: 'Q3',
    detail: 'Launch experimental hardware and creative-tech section with video walkthroughs.',
  },
]

const featuredProject = {
  name: 'Benstagram.net',
  label: 'Featured Project',
  summary:
    'A modern photo-first community platform made for people named Ben, with clean posting, profile, and discovery flows.',
  stack: ['React', 'Node.js', 'PostgreSQL', 'AWS S3'],
  status: 'Live now',
  url: 'https://benstagram.net',
}

const featuredSubproject = {
  name: 'VIM Protocol',
  label: 'Featured Subproject',
  summary:
    'A cyber training simulator built around a custom Vim engine, branching missions, and character-driven progression.',
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
  stack: ['Python', 'Flask', 'PDF parsing', 'Watch alerts'],
  status: 'Snapshot synced',
  source: 'Source project: hpd_arrest_log_viewer',
  url: HPD_ARREST_LOG_ROUTE,
}

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

  const depth = reducedMotion ? 0.45 : 1
  const heroTravel = Math.min(motion.heroScroll, motion.viewportH * 1.3)
  const nearLift = heroTravel * -0.46 * depth
  const midLift = heroTravel * -0.72 * depth
  const farLift = heroTravel * -1.02 * depth
  const orbitScale = 1 + Math.min(0.26, motion.heroPhase * 0.24) * depth
  const contentDepth = depth * 0.24
  const year = new Date().getFullYear()

  useEffect(() => {
    document.title = 'Coding Around | Development Portfolio'
  }, [])

  return (
    <div className="app-shell">
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
        <nav>
          <a href="#projects">Projects</a>
          <a href={featuredOpsProject.url}>HPD Log</a>
          <a href={featuredSubproject.url}>VIM Protocol</a>
          <a href="#spectrum">Styles</a>
          <a href="#roadmap">Roadmap</a>
          <a href="#contact">Contact</a>
        </nav>
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
                transform: `translate3d(0, ${nearLift}px, 0) scale(${1 - Math.min(0.07, motion.heroPhase * 0.05) * depth})`,
              }}
            >
              <p className="kicker">Full-stack development portfolio</p>
              <h1>
                The future of software
                <span> building happens together.</span>
              </h1>
              <p className="hero-description">
                Tools and trends evolve, but collaboration endures. Coding Around brings web apps,
                automation, systems work, and experiments together in one living platform.
              </p>
              <div className="hero-actions">
                <form className="hero-signup" onSubmit={(event) => event.preventDefault()}>
                  <label className="sr-only" htmlFor="hero-email">
                    Email
                  </label>
                  <input id="hero-email" type="email" placeholder="Enter your email" />
                  <button className="btn btn-primary" type="submit">
                    Join updates
                  </button>
                </form>
                <a className="btn btn-outline" href="#projects">
                  Browse projects
                </a>
              </div>
              <div className="hero-metrics">
                <article>
                  <p>AWS</p>
                  <span>Amplify deploy-ready</span>
                </article>
                <article>
                  <p>Fast</p>
                  <span>React + Vite pipeline</span>
                </article>
                <article>
                  <p>Live</p>
                  <span>Evolving project archive</span>
                </article>
              </div>
              <div className="hero-progress" aria-hidden="true">
                <span
                  style={{
                    transform: `scaleX(${Math.min(1, 0.08 + motion.heroPhase * 0.9)})`,
                  }}
                />
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
                  transform: `translate3d(${motion.pointerX * -88 * depth}px, ${farLift + motion.pointerY * 32 * depth}px, 0) rotate(${motion.heroPhase * -8 * depth + motion.pointerX * -4 * depth}deg)`,
                }}
              >
                <p>Web Apps</p>
                <span>Product launches and high-fidelity UX systems.</span>
              </article>

              <article
                className="depth-card depth-card-b"
                style={{
                  transform: `translate3d(${motion.pointerX * 72 * depth}px, ${nearLift * 0.65 + motion.pointerY * -18 * depth}px, 0) rotate(${motion.heroPhase * 7 * depth + motion.pointerX * 3 * depth}deg)`,
                }}
              >
                <p>Automation</p>
                <span>AI-enhanced workflows that remove repetitive ops.</span>
              </article>

              <article
                className="depth-card depth-card-c"
                style={{
                  transform: `translate3d(${motion.pointerX * -56 * depth}px, ${heroTravel * 0.32 * depth + motion.pointerY * 16 * depth}px, 0) rotate(${motion.heroPhase * -6 * depth + motion.pointerX * -2 * depth}deg)`,
                }}
              >
                <p>Systems + Experimental</p>
                <span>Tooling, infra, and physical prototypes in one portfolio.</span>
              </article>
            </div>
          </div>
        </section>

        <section className="focus-ribbon" aria-label="Portfolio focus">
          <p>Dark-mode native experience</p>
          <p>High-contrast cinematic parallax</p>
          <p>Built for AWS Amplify deployment</p>
        </section>

        <section className="projects" id="projects">
          <div className="section-head">
            <p className="kicker">Project theater</p>
            <h2>Multiple formats, one system</h2>
          </div>

          <article className="featured-project-card">
            <div className="featured-project-copy">
              <p className="featured-project-kicker">{featuredProject.label}</p>
              <h3>{featuredProject.name}</h3>
              <p>{featuredProject.summary}</p>
              <div className="featured-project-tags">
                {featuredProject.stack.map((item) => (
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
              <p>{featuredSubproject.summary}</p>
              <div className="featured-project-tags featured-project-tags-vim">
                {featuredSubproject.stack.map((item) => (
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
              <p>{featuredOpsProject.summary}</p>
              <div className="featured-project-tags featured-project-tags-hpd">
                {featuredOpsProject.stack.map((item) => (
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

          <div className="track-grid">
            {projectTracks.map((track, index) => (
              <article
                className="track-card"
                key={track.title}
                style={{
                  '--float-y': `${(Math.sin(motion.progress * 8 + index * 0.8) * 56 + (index - 1.5) * 14) * contentDepth}px`,
                }}
              >
                <h3>{track.title}</h3>
                <p className="track-note">{track.note}</p>
                <ul>
                  {track.projects.map((project) => (
                    <li key={project.name}>
                      <header>
                        <p>{project.name}</p>
                        <span>{project.status}</span>
                      </header>
                      <small>{project.type}</small>
                      <em>{project.stack}</em>
                      {project.source && <span className="project-source">{project.source}</span>}
                      {project.url && (
                        <a
                          href={project.url}
                          target={project.url.startsWith('http') ? '_blank' : undefined}
                          rel={project.url.startsWith('http') ? 'noreferrer' : undefined}
                          className="project-link"
                        >
                          {project.linkLabel || 'Visit live site'}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="spectrum" id="spectrum">
          <div className="section-head">
            <p className="kicker">Style spectrum</p>
            <h2>Designed to keep evolving</h2>
          </div>
          <div className="spectrum-grid">
            {styleSpectrum.map((style, index) => (
              <article key={style} style={{ '--drift-y': '0px' }}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <p>{style}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="roadmap" id="roadmap">
          <div className="section-head">
            <p className="kicker">Growth roadmap</p>
            <h2>How this portfolio expands next</h2>
          </div>
          <div className="roadmap-grid">
            {milestones.map((milestone, index) => (
              <article
                key={milestone.quarter}
                style={{
                  '--rise-y': `${index * 10}px`,
                }}
              >
                <p>{milestone.quarter}</p>
                <span>{milestone.detail}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="contact" id="contact">
          <h2>Want a custom build in this style?</h2>
          <p>
            This space can link directly to your live demos, GitHub repos, and deep technical case
            studies.
          </p>
          <div className="contact-links">
            <a href="mailto:hello@codingaround.dev">hello@codingaround.dev</a>
            <a href="https://github.com" target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a href="https://www.linkedin.com" target="_blank" rel="noreferrer">
              LinkedIn
            </a>
          </div>
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
