# Portfolio Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four visual enhancements to the portfolio frontend: fire aurora hero background, scroll-linked ticker, project card modal with shared-element transitions, and an upgraded splash screen with white+ghost-red aurora.

**Architecture:** All four features are frontend-only canvas/animation changes. A shared `AuroraCanvas` component encapsulates the canvas animation loop so Hero and SplashScreen reuse identical draw logic with different color palettes. Ticker uses Framer Motion `useScroll`/`useTransform`. Project modal uses Framer Motion `layoutId` shared element transitions.

**Tech Stack:** React 19, Framer Motion 12, GSAP 3, Tailwind CSS 3, Lucide-React 1.14, Canvas API (no new packages)

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Create | `frontend/src/components/ui/AuroraCanvas.jsx` | Reusable canvas aurora animation; accepts `colors` + `columnCount` props; cleans up `rAF` on unmount |
| Modify | `frontend/src/components/sections/Hero.jsx` | Add `relative overflow-hidden`, mount `AuroraCanvas` with fire colors, add vignette overlay div |
| Create | `frontend/src/components/ui/Ticker.jsx` | Scroll-linked horizontal text band; `useScroll`/`useTransform`; alternating filled/outline text |
| Modify | `frontend/src/pages/Portfolio.jsx` | Import and render `Ticker` between `<Hero>` and `<About>` |
| Modify | `frontend/src/components/sections/Projects.jsx` | Add `selectedProject` state; replace GlassCard with `motion.div layoutId`; add `AnimatePresence` full-screen modal overlay |
| Modify | `frontend/src/components/animations/SplashScreen.jsx` | Mount `AuroraCanvas` with white+ghost-red palette; upgrade "MA" text style; preserve GSAP timeline |

---

## Task 1: AuroraCanvas shared component

**Files:**
- Create: `frontend/src/components/ui/AuroraCanvas.jsx`

- [ ] **Step 1: Create the component**

```jsx
// frontend/src/components/ui/AuroraCanvas.jsx
import { useEffect, useRef } from 'react'

export default function AuroraCanvas({ colors, columnCount = 22, className = '' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return

    const resize = () => {
      cv.width = cv.offsetWidth
      cv.height = cv.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const ctx = cv.getContext('2d')
    const cols = Array.from({ length: columnCount }, (_, i) => ({
      x: (i / Math.max(columnCount - 1, 1)) * cv.width,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.007 + 0.003,
      amp: Math.random() * 22 + 10,
      ci: Math.floor(Math.random() * colors.length),
      o: Math.random() * 0.22 + 0.08,
      w: Math.random() * 2.5 + 1,
      vphase: Math.random() * Math.PI * 2,
      vspeed: Math.random() * 0.005 + 0.002,
    }))

    let t = 0
    let rafId

    function draw() {
      ctx.clearRect(0, 0, cv.width, cv.height)
      cols.forEach(c => {
        const [r, g, b] = colors[c.ci]
        const ap = c.o * (0.65 + Math.sin(t * c.vspeed + c.vphase) * 0.35)
        const grad = ctx.createLinearGradient(0, 0, 0, cv.height)
        grad.addColorStop(0,    `rgba(${r},${g},${b},0)`)
        grad.addColorStop(0.15, `rgba(${r},${g},${b},${ap * 0.3})`)
        grad.addColorStop(0.45, `rgba(${r},${g},${b},${ap})`)
        grad.addColorStop(0.75, `rgba(${r},${g},${b},${ap * 0.4})`)
        grad.addColorStop(1,    `rgba(${r},${g},${b},0)`)
        ctx.beginPath()
        ctx.moveTo(c.x, 0)
        for (let y = 0; y <= cv.height; y += 6) {
          const sx = c.x + Math.sin(t * c.speed + c.phase + y * 0.035) * c.amp
          ctx.lineTo(sx, y)
        }
        ctx.strokeStyle = grad
        ctx.lineWidth = c.w
        ctx.stroke()
      })
      t++
      rafId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(rafId)
    }
  }, [colors, columnCount])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
    />
  )
}
```

- [ ] **Step 2: Verify build passes**

```bash
cd frontend && npm run build
```

Expected: Build succeeds. AuroraCanvas is not yet used anywhere so it won't appear in the bundle output separately, but the file must parse without errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ui/AuroraCanvas.jsx
git commit -m "feat: add AuroraCanvas shared canvas animation component"
```

---

## Task 2: Fire Aurora in Hero section

**Files:**
- Modify: `frontend/src/components/sections/Hero.jsx`

- [ ] **Step 1: Replace Hero.jsx**

```jsx
// frontend/src/components/sections/Hero.jsx
import { useEffect, useRef } from 'react'
import { Download, Code2, Briefcase, Mail } from 'lucide-react'
import { gsap, prefersReducedMotion } from '../../animations/gsap'
import MotionButton from '../ui/MotionButton'
import AuroraCanvas from '../ui/AuroraCanvas'

const FIRE_COLORS = [
  [255, 40, 0],
  [255, 100, 0],
  [255, 160, 0],
  [255, 200, 20],
  [220, 30, 10],
]

export default function Hero({ profile }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    const els = containerRef.current.querySelectorAll('[data-hero]')
    gsap.fromTo(
      els,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: 'power2.out', delay: 0.2 }
    )
  }, [])

  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      <AuroraCanvas colors={FIRE_COLORS} columnCount={22} />
      <div
        className="absolute inset-0 z-[1]"
        style={{ background: 'radial-gradient(ellipse at center, rgba(10,10,10,0) 20%, rgba(10,10,10,0.88) 100%)' }}
      />
      <div ref={containerRef} className="relative z-[2] max-w-6xl mx-auto px-6 w-full">
        <p data-hero className="text-sm text-accent-muted uppercase tracking-widest mb-4 opacity-0">
          Hello, I am
        </p>
        <h1 data-hero className="font-display text-5xl md:text-7xl font-bold text-accent mb-4 opacity-0 leading-tight">
          {profile?.name || 'Mochsabil Em Abyan'}
        </h1>
        <h2 data-hero className="text-xl md:text-2xl text-accent-muted mb-8 opacity-0">
          {profile?.title || 'Data Analyst & Web Developer'}
        </h2>
        <div data-hero className="flex flex-wrap gap-4 mb-12 opacity-0">
          <MotionButton href="#contact" variant="primary">Get in touch</MotionButton>
          {profile?.cv_url && (
            <MotionButton href={profile.cv_url} variant="outline">
              <Download size={16} /> Download CV
            </MotionButton>
          )}
        </div>
        <div data-hero className="flex gap-4 opacity-0">
          {profile?.github && (
            <a href={profile.github} target="_blank" rel="noreferrer" className="text-accent-muted hover:text-accent transition-colors">
              <Code2 size={20} />
            </a>
          )}
          {profile?.linkedin && (
            <a href={profile.linkedin} target="_blank" rel="noreferrer" className="text-accent-muted hover:text-accent transition-colors">
              <Briefcase size={20} />
            </a>
          )}
          {profile?.email && (
            <a href={`mailto:${profile.email}`} className="text-accent-muted hover:text-accent transition-colors">
              <Mail size={20} />
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
```

**Key changes vs original:**
- `<section>` gains `relative overflow-hidden`
- `<AuroraCanvas colors={FIRE_COLORS} columnCount={22} />` inserted as first child (renders behind everything, `z` index 0 by default)
- Vignette `<div>` at `z-[1]` using inline `style` (no Tailwind radial-gradient plugin needed)
- Content `<div>` gains `relative z-[2]` so it sits above canvas and vignette

- [ ] **Step 2: Verify build passes**

```bash
cd frontend && npm run build
```

Expected: Build succeeds with no errors. Bundle size increases slightly (canvas animation code).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/sections/Hero.jsx
git commit -m "feat: add fire aurora canvas background to Hero section"
```

---

## Task 3: Ticker scroll component

**Files:**
- Create: `frontend/src/components/ui/Ticker.jsx`

- [ ] **Step 1: Create the component**

```jsx
// frontend/src/components/ui/Ticker.jsx
import { motion, useScroll, useTransform } from 'framer-motion'

const ITEMS = ['Analyze', 'Visualize', 'Build', 'Deploy']
const REPEATED = Array.from({ length: 6 }, () => ITEMS).flat()

export default function Ticker() {
  const { scrollYProgress } = useScroll()
  const x = useTransform(scrollYProgress, [0, 1], [0, -1200])

  return (
    <div className="w-full overflow-hidden bg-surface border-y border-surface-2 py-5">
      <motion.div style={{ x }} className="flex items-center whitespace-nowrap">
        {REPEATED.map((item, i) => (
          <span key={i} className="inline-flex items-center">
            <span
              className="text-2xl font-bold uppercase tracking-widest mx-6"
              style={
                i % 2 === 0
                  ? { color: '#fafaf9' }
                  : { color: 'transparent', WebkitTextStroke: '1px #fafaf9' }
              }
            >
              {item}
            </span>
            <span className="mx-2 select-none" style={{ color: '#a8a29e' }}>·</span>
          </span>
        ))}
      </motion.div>
    </div>
  )
}
```

**Notes:**
- `useScroll()` with no options tracks `window` scroll (`scrollYProgress` 0→1 = page top to bottom)
- `useTransform` maps full scroll range to `-1200px` leftward shift — feels like ~3 full cycles of items at typical screen widths
- `REPEATED` = 24 items (6 repetitions × 4 words), ensuring the band is always full regardless of viewport width
- Alternating style: even-indexed items filled white, odd-indexed outline via `WebkitTextStroke`
- `bg-surface` = `#111111`, `border-surface-2` = `#1a1a1a` — from the Tailwind config tokens

- [ ] **Step 2: Verify build passes**

```bash
cd frontend && npm run build
```

Expected: Build succeeds. Ticker is not yet rendered so no visual output yet.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ui/Ticker.jsx
git commit -m "feat: add Ticker scroll-linked component"
```

---

## Task 4: Wire Ticker into Portfolio page

**Files:**
- Modify: `frontend/src/pages/Portfolio.jsx`

- [ ] **Step 1: Add Ticker import and render**

Add the import line after the existing `Hero` import:

```jsx
import Ticker from '../components/ui/Ticker'
```

In the `return` block, insert `<Ticker />` between `<Hero>` and `<About>`:

```jsx
<main>
  <Hero profile={data.profile} />
  <Ticker />
  <About profile={data.profile} />
  <Skills skills={data.skills} />
  <Projects projects={data.projects} />
  <Experience experiences={data.experiences} />
  <Education education={data.education} />
  <Certificates certificates={data.certificates} />
  <Contact profile={data.profile} />
</main>
```

The full updated `Portfolio.jsx`:

```jsx
// frontend/src/pages/Portfolio.jsx
import { useState, useEffect } from 'react'
import { getProfile, getSkills, getProjects, getExperiences, getEducation, getCertificates } from '../services/api'
import SplashScreen from '../components/animations/SplashScreen'
import ScrollProgressBar from '../components/animations/ScrollProgressBar'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import Hero from '../components/sections/Hero'
import Ticker from '../components/ui/Ticker'
import About from '../components/sections/About'
import Skills from '../components/sections/Skills'
import Projects from '../components/sections/Projects'
import Experience from '../components/sections/Experience'
import Education from '../components/sections/Education'
import Certificates from '../components/sections/Certificates'
import Contact from '../components/sections/Contact'

export default function Portfolio() {
  const [data, setData] = useState({})
  const [ready, setReady] = useState(false)
  const [splashDone, setSplashDone] = useState(false)
  const [showSplash, setShowSplash] = useState(false)

  useEffect(() => {
    const startTime = Date.now()

    Promise.all([
      getProfile(),
      getSkills(),
      getProjects(),
      getExperiences(),
      getEducation(),
      getCertificates(),
    ]).then(([profile, skills, projects, experiences, education, certificates]) => {
      setData({
        profile: profile.data,
        skills: skills.data,
        projects: projects.data,
        experiences: experiences.data,
        education: education.data,
        certificates: certificates.data,
      })
      const elapsed = Date.now() - startTime
      if (elapsed > 300) setShowSplash(true)
      setReady(true)
    }).catch(() => setReady(true))
  }, [])

  if (!ready || (showSplash && !splashDone)) {
    if (showSplash) {
      return (
        <>
          {ready && <SplashScreen onComplete={() => setSplashDone(true)} />}
        </>
      )
    }
    return null
  }

  return (
    <>
      <ScrollProgressBar />
      <Navbar />
      <main>
        <Hero profile={data.profile} />
        <Ticker />
        <About profile={data.profile} />
        <Skills skills={data.skills} />
        <Projects projects={data.projects} />
        <Experience experiences={data.experiences} />
        <Education education={data.education} />
        <Certificates certificates={data.certificates} />
        <Contact profile={data.profile} />
      </main>
      <Footer profile={data.profile} />
    </>
  )
}
```

- [ ] **Step 2: Verify build passes**

```bash
cd frontend && npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Portfolio.jsx
git commit -m "feat: render Ticker between Hero and About sections"
```

---

## Task 5: Project card modal with shared layout transition

**Files:**
- Modify: `frontend/src/components/sections/Projects.jsx`

- [ ] **Step 1: Replace Projects.jsx**

```jsx
// frontend/src/components/sections/Projects.jsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Code2, ExternalLink, X, Download } from 'lucide-react'
import { staggerContainer } from '../../animations/variants'
import AnimatedSection from '../animations/AnimatedSection'
import SectionWrapper from '../layout/SectionWrapper'
import Container from '../layout/Container'
import SectionTitle from '../ui/SectionTitle'

export default function Projects({ projects }) {
  const [filter, setFilter] = useState('All')
  const [selectedProject, setSelectedProject] = useState(null)

  const tags = ['All', ...new Set((projects || []).flatMap((p) => p.tech_stack || []))]
  const filtered =
    filter === 'All'
      ? projects || []
      : (projects || []).filter((p) => p.tech_stack?.includes(filter))

  useEffect(() => {
    document.body.style.overflow = selectedProject ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [selectedProject])

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') setSelectedProject(null) }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <SectionWrapper id="projects">
      <Container>
        <AnimatedSection>
          <SectionTitle subtitle="Things I've built">Projects</SectionTitle>
        </AnimatedSection>

        <div className="flex flex-wrap gap-2 mb-10">
          {tags.slice(0, 8).map((tag) => (
            <button
              key={tag}
              onClick={() => setFilter(tag)}
              className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                filter === tag
                  ? 'bg-accent text-background'
                  : 'glass text-accent-muted hover:text-accent'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filtered.map((project) => (
            <div key={project._id} className="min-h-[200px]">
              {selectedProject?._id !== project._id && (
                <motion.div
                  layoutId={`card-${project._id}`}
                  onClick={() => setSelectedProject(project)}
                  className="glass rounded-xl p-5 cursor-pointer h-full border border-surface-2 hover:border-accent-dim transition-colors"
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                >
                  {project.thumbnail_url && (
                    <div className="rounded-lg overflow-hidden mb-4 aspect-video bg-surface-2">
                      <img
                        src={project.thumbnail_url}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <h3 className="font-semibold text-accent mb-2">{project.title}</h3>
                  <p className="text-sm text-accent-muted mb-4 line-clamp-3">{project.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(project.tech_stack || []).map((tech) => (
                      <span key={tech} className="text-xs px-2 py-0.5 rounded bg-surface-2 text-accent-muted">
                        {tech}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          ))}
        </motion.div>
      </Container>

      <AnimatePresence>
        {selectedProject && (
          <>
            <motion.div
              key="modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              onClick={() => setSelectedProject(null)}
            />
            <motion.div
              key={selectedProject._id}
              layoutId={`card-${selectedProject._id}`}
              className="fixed inset-4 md:inset-8 z-[60] bg-surface rounded-2xl overflow-hidden flex flex-col md:flex-row"
            >
              <div className="md:w-[40%] bg-background flex-shrink-0">
                {selectedProject.thumbnail_url ? (
                  <img
                    src={selectedProject.thumbnail_url}
                    alt={selectedProject.title}
                    className="w-full h-52 md:h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-52 md:h-full flex items-center justify-center bg-surface-2">
                    <Code2 size={48} className="text-accent-muted opacity-20" />
                  </div>
                )}
              </div>

              <div className="md:w-[60%] p-6 md:p-10 overflow-y-auto">
                <h2 className="font-display text-2xl font-bold text-accent mb-3">
                  {selectedProject.title}
                </h2>
                <p className="text-accent-muted text-sm leading-relaxed mb-6">
                  {selectedProject.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-8">
                  {(selectedProject.tech_stack || []).map((tech) => (
                    <span
                      key={tech}
                      className="text-xs px-2 py-1 rounded bg-surface-2 text-accent-muted border border-surface-2"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  {selectedProject.live_url && (
                    <a
                      href={selectedProject.live_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-background text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      <ExternalLink size={14} /> View Website
                    </a>
                  )}
                  {selectedProject.github_url && (
                    <a
                      href={selectedProject.github_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg glass text-accent text-sm font-medium"
                    >
                      <Code2 size={14} /> Source Code
                    </a>
                  )}
                  {selectedProject.pdf_url && (
                    <a
                      href={selectedProject.pdf_url}
                      download
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg glass text-accent text-sm font-medium"
                    >
                      <Download size={14} /> Download PDF
                    </a>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSelectedProject(null)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-surface-2 text-accent-muted hover:text-accent transition-colors z-10"
                aria-label="Close project modal"
              >
                <X size={16} />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </SectionWrapper>
  )
}
```

**Key design decisions:**
- Each card is wrapped in a placeholder `<div key={project._id} className="min-h-[200px]">` that holds grid space. The inner `motion.div` conditionally unmounts when `selectedProject._id === project._id`, making the grid cell appear empty. Framer Motion records the last known bounding rect of the `motion.div` and animates the modal from that position.
- The modal `motion.div` shares `layoutId={`card-${selectedProject._id}`}` with the card, triggering the shared element transition.
- The `Download` icon is imported from `lucide-react` — it is available in v1.14.0.
- `GlassCard` import is removed — the card is now a raw `motion.div` with `glass` class for `layoutId` support.
- Scroll lock via `document.body.style.overflow = 'hidden'` on modal open, restored on close and unmount.

- [ ] **Step 2: Verify build passes**

```bash
cd frontend && npm run build
```

Expected: Build succeeds. Check that `Download` export from `lucide-react` does not trigger a missing-export warning. If it does, replace with `ArrowDown` or `FileDown` (both available in v1.14.0).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/sections/Projects.jsx
git commit -m "feat: add full-screen project modal with Framer Motion layoutId transition"
```

---

## Task 6: Splash screen aurora upgrade

**Files:**
- Modify: `frontend/src/components/animations/SplashScreen.jsx`

- [ ] **Step 1: Replace SplashScreen.jsx**

```jsx
// frontend/src/components/animations/SplashScreen.jsx
import { useEffect, useRef } from 'react'
import { gsap, prefersReducedMotion } from '../../animations/gsap'
import AuroraCanvas from '../ui/AuroraCanvas'

const SPLASH_COLORS = [
  [255, 255, 255],
  [255, 255, 255],
  [255, 255, 255],
  [255, 200, 200],
  [255, 180, 180],
  [250, 250, 249],
]

export default function SplashScreen({ onComplete }) {
  const containerRef = useRef(null)
  const progressRef = useRef(null)
  const nameRef = useRef(null)

  useEffect(() => {
    if (prefersReducedMotion()) {
      onComplete()
      return
    }

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.to(containerRef.current, {
          yPercent: -100,
          duration: 0.7,
          ease: 'power3.inOut',
          onComplete,
        })
      },
    })

    tl.fromTo(
      nameRef.current,
      { opacity: 0, scale: 0.9 },
      { opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out' }
    )
      .to(progressRef.current, { width: '100%', duration: 1.2, ease: 'power1.inOut' }, '+=0.1')
      .to(nameRef.current, { opacity: 0, duration: 0.3 }, '-=0.2')
  }, [])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center overflow-hidden"
    >
      <AuroraCanvas colors={SPLASH_COLORS} columnCount={24} />
      <div
        className="absolute inset-0 z-[1]"
        style={{ background: 'radial-gradient(ellipse at center, rgba(10,10,10,0) 20%, rgba(10,10,10,0.8) 100%)' }}
      />
      <p
        ref={nameRef}
        className="relative z-[2] opacity-0"
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: '80px',
          fontWeight: 700,
          color: '#fafaf9',
          textShadow: '0 0 40px rgba(255,255,255,0.4)',
          lineHeight: 1,
        }}
      >
        MA
      </p>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-surface-2 z-[2]">
        <div ref={progressRef} className="h-full bg-accent w-0" />
      </div>
    </div>
  )
}
```

**Key changes vs original:**
- Outer `<div>` gains `overflow-hidden` (required so canvas does not bleed out)
- `<AuroraCanvas colors={SPLASH_COLORS} columnCount={24} />` inserted as first child — renders at `z` 0
- Vignette overlay at `z-[1]` — keeps "MA" readable against bright white curtains
- `<p>` "MA" text upgraded: inline `style` sets `fontFamily: 'Georgia, serif'`, `fontSize: '80px'`, `fontWeight: 700`, `textShadow`; gains `relative z-[2]`
- GSAP timeline untouched — still animates `nameRef` (fade in/out) and `progressRef` (width 0→100%)
- `AuroraCanvas` cleanup (cancel rAF) fires when SplashScreen unmounts — no loop leak

- [ ] **Step 2: Verify build passes**

```bash
cd frontend && npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/animations/SplashScreen.jsx
git commit -m "feat: upgrade SplashScreen with white+ghost-red aurora canvas"
```

---

## Task 7: Final build validation

- [ ] **Step 1: Clean build**

```bash
cd frontend && npm run build
```

Expected output — no errors, only the expected chunk size warning is acceptable:
```
dist/assets/index-[hash].js    ~550 kB │ gzip: ~170 kB
(!) Some chunks are larger than 500 kB after minification
```

If there are any `[MISSING_EXPORT]` errors:
- Check `lucide-react` imports in Projects.jsx: `Code2`, `ExternalLink`, `X`, `Download` are all valid in v1.14.0
- If `Download` is missing, replace with `ArrowDown`: `import { Code2, ExternalLink, X, ArrowDown as Download } from 'lucide-react'`

- [ ] **Step 2: Verify all 6 changed/created files are committed**

```bash
git log --oneline -7
```

Expected (newest first):
```
feat: upgrade SplashScreen with white+ghost-red aurora canvas
feat: add full-screen project modal with Framer Motion layoutId transition
feat: render Ticker between Hero and About sections
feat: add Ticker scroll-linked component
feat: add fire aurora canvas background to Hero section
feat: add AuroraCanvas shared canvas animation component
docs: add portfolio enhancements design spec (aurora, ticker, modal, splash)
```

- [ ] **Step 3: Smoke test in dev server (visual verification)**

```bash
cd frontend && npm run dev
```

Open `http://localhost:3001` and verify:

1. **Splash screen**: White aurora curtains with subtle red strands visible behind "MA" initials. "MA" is clearly readable. Progress bar fills and screen slides up.
2. **Hero**: Fire aurora (red/orange/gold wavy lines) visible behind text. Name, title, CTAs, and social links all clearly readable. Vignette darkens the edges.
3. **Ticker**: A band between Hero and About showing "Analyze · Visualize · Build · Deploy ·" repeating. Filled and outline text alternate. Scrolling the page moves the band left.
4. **Projects**: Cards display normally. Clicking a card triggers a smooth expand into a full-screen overlay. Overlay shows image left, details right. Close button (X) works. Pressing Escape closes the modal. Backdrop click closes the modal. Mobile layout stacks image on top of details.
