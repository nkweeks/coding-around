import { useEffect, useRef, useState } from 'react'
import './App.css'

const projectTracks = [
  {
    title: 'Immersive Web Apps',
    note: 'Core focus: product-grade web experiences with clear UX and strong polish.',
    projects: [
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

function App() {
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

export default App
