# Portfolio Velocity Scroll & Overlapping Panels — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the portfolio scroll experience with Lenis smooth scroll, CSS sticky stacking panels that overlap like a deck of cards, and GSAP parallax depth layers inside each panel.

**Architecture:** Each section (About → Contact) becomes a `SectionPanel` with a 150vh outer wrapper and a `position: sticky; top: 0; height: 100vh` inner panel — CSS handles the stacking with no JS. GSAP ScrollTrigger handles (a) scale+dim on outgoing panels and (b) parallax layers inside panels. Lenis provides buttery momentum scroll and bridges to GSAP via a shared RAF loop.

**Tech Stack:** `lenis` (new install), `gsap` + `ScrollTrigger` (existing), `framer-motion` (existing), CSS sticky, Tailwind.

## Global Constraints

- Only modify files under `frontend/src/` and `frontend/package.json`. Do NOT touch `sql-game/`, `admin/`, `App.jsx`, `SectionWrapper.jsx`, `SqlMissionControl.jsx`.
- `SectionWrapper.jsx` stays untouched — admin pages still use it.
- `prefersReducedMotion()` check before all GSAP effects: skip parallax + scale, keep CSS stacking.
- Parallax skip on touch devices: `window.matchMedia('(hover: none)').matches`.
- All commands run from `frontend/` directory: `cd D:/portofolio/frontend`.
- Dev server: `npm run dev` → `http://localhost:5173`.
- No new test files required — verify visually in browser after each task.

---

## File Map

| Status | File | Role |
|---|---|---|
| **New** | `src/hooks/useLenis.js` | Init Lenis, bridge to GSAP ticker + ScrollTrigger |
| **New** | `src/hooks/useParallax.js` | GSAP ScrollTrigger scrub parallax helper |
| **New** | `src/components/layout/SectionPanel.jsx` | Sticky panel wrapper + ghost number + scale-out |
| **Modify** | `package.json` | Add `lenis` |
| **Modify** | `src/index.css` | Panel base styles (`transform-origin`, `will-change`) |
| **Modify** | `src/pages/Portfolio.jsx` | Call `useLenis()`, add `panels-container` div |
| **Modify** | `src/components/sections/About.jsx` | Use `SectionPanel`, add parallax on profile card |
| **Modify** | `src/components/sections/Skills.jsx` | Use `SectionPanel`, alternating row parallax |
| **Modify** | `src/components/sections/Projects.jsx` | Use `SectionPanel`, column offset parallax |
| **Modify** | `src/components/sections/Experience.jsx` | Use `SectionPanel`, timeline line growth |
| **Modify** | `src/components/sections/Education.jsx` | Use `SectionPanel`, card float-in |
| **Modify** | `src/components/sections/Certificates.jsx` | Use `SectionPanel`, grid parallax |
| **Modify** | `src/components/sections/Contact.jsx` | Use `SectionPanel`, ambient glow pulse |

---

## Task 1: Install Lenis + Wire useLenis Hook

**Files:**
- Modify: `package.json`
- Create: `src/hooks/useLenis.js`
- Modify: `src/pages/Portfolio.jsx`

**Interfaces:**
- Produces: `useLenis()` — a React hook with no return value, called once in Portfolio

- [ ] **Step 1: Install Lenis**

```bash
cd D:/portofolio/frontend
npm install lenis
```

Expected output: `added 1 package` (lenis is tiny, no transitive deps).

- [ ] **Step 2: Create `src/hooks/useLenis.js`**

```js
import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from '../animations/gsap'
import { prefersReducedMotion } from '../animations/gsap'

export function useLenis() {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.075,
      duration: 1.2,
      smoothWheel: true,
    })

    // Sync Lenis scroll position → ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update)

    // Drive Lenis from GSAP's RAF loop (single RAF, no conflicts)
    gsap.ticker.add((time) => lenis.raf(time * 1000))
    gsap.ticker.lagSmoothing(0)

    return () => {
      lenis.destroy()
      gsap.ticker.remove((time) => lenis.raf(time * 1000))
    }
  }, [])
}
```

- [ ] **Step 3: Call `useLenis()` in `Portfolio.jsx`**

Add the import at the top of `Portfolio.jsx`:
```js
import { useLenis } from '../hooks/useLenis'
```

Add the hook call inside `Portfolio` component body (after the existing hooks, before the `if (!ready ...)` guard):
```js
useLenis()
```

- [ ] **Step 4: Verify smooth scroll works**

Run `npm run dev`, open `http://localhost:5173`. Scroll the page — it should feel noticeably smoother/buttery compared to before. The scroll momentum should coast slightly after stopping input.

- [ ] **Step 5: Commit**

```bash
cd D:/portofolio
git add frontend/package.json frontend/package-lock.json frontend/src/hooks/useLenis.js frontend/src/pages/Portfolio.jsx
git commit -m "feat: install Lenis + wire smooth scroll in Portfolio"
```

---

## Task 2: Create SectionPanel Component

**Files:**
- Create: `src/components/layout/SectionPanel.jsx`
- Modify: `src/index.css`

**Interfaces:**
- Produces: `<SectionPanel id="about" index={0} isLast={false}>` — drop-in for `SectionWrapper` in portfolio sections
- Produces: `data-panel-inner` attribute on inner `<section>` — used by `useParallax` to find trigger element

- [ ] **Step 1: Add panel base styles to `src/index.css`**

Append inside `@layer utilities` (after the `.no-scrollbar` block):

```css
.panel-inner {
  transform-origin: top center;
  will-change: transform;
}
```

- [ ] **Step 2: Create `src/components/layout/SectionPanel.jsx`**

```jsx
import { useRef, useEffect } from 'react'
import { gsap, ScrollTrigger } from '../../animations/gsap'
import { prefersReducedMotion } from '../../animations/gsap'

const PANEL_BG = [
  '#111111', // 0 About
  '#0f0f0f', // 1 Skills
  '#111111', // 2 Projects
  '#0d0d0d', // 3 Experience
  '#111111', // 4 Education
  '#0f0f0f', // 5 Certificates
  '#0a0a0a', // 6 Contact
]

const PANEL_BORDER_TOP = [
  'rgba(255,255,255,0.06)',
  'rgba(255,255,255,0.04)',
  'rgba(255,255,255,0.06)',
  'rgba(255,255,255,0.05)',
  'rgba(255,255,255,0.04)',
  'rgba(255,255,255,0.05)',
  'rgba(250,250,249,0.10)',
]

export default function SectionPanel({ id, index = 0, isLast = false, children, className = '' }) {
  const outerRef = useRef(null)
  const innerRef = useRef(null)
  const overlayRef = useRef(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    if (isLast) return
    const inner = innerRef.current
    const overlay = overlayRef.current
    if (!inner || !overlay) return

    const st = ScrollTrigger.create({
      trigger: outerRef.current,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
      onUpdate: (self) => {
        // Scale + dim only in latter half of panel's scroll window
        const p = Math.max(0, (self.progress - 0.5) * 2)
        gsap.set(inner, { scale: 1 - 0.05 * p })
        gsap.set(overlay, { opacity: 0.4 * p })
      },
    })

    return () => st.kill()
  }, [isLast])

  return (
    <div ref={outerRef} style={{ height: '150vh', position: 'relative' }}>
      <section
        id={id}
        ref={innerRef}
        data-panel-inner="true"
        className={`panel-inner sticky top-0 h-screen overflow-hidden ${className}`}
        style={{
          zIndex: 10 + index,
          borderRadius: '24px 24px 0 0',
          backgroundColor: PANEL_BG[index] ?? '#111111',
          borderTop: `1px solid ${PANEL_BORDER_TOP[index] ?? 'rgba(255,255,255,0.05)'}`,
        }}
      >
        {/* Ghost section number */}
        <div
          aria-hidden="true"
          className="absolute top-6 right-8 font-display leading-none pointer-events-none select-none"
          style={{ fontSize: '10rem', opacity: 0.035, color: '#fafaf9', zIndex: 0 }}
        >
          {String(index + 1).padStart(2, '0')}
        </div>

        {/* Dark overlay for scale-out effect */}
        <div
          ref={overlayRef}
          className="absolute inset-0 bg-black pointer-events-none"
          style={{ opacity: 0, zIndex: 30 }}
        />

        {/* Content above overlay */}
        <div className="relative h-full" style={{ zIndex: 1 }}>
          {children}
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 3: Update `Portfolio.jsx` — wrap sections in panels-container**

In `Portfolio.jsx`, replace the section-list block in `<main>` (everything between `<Ticker />` and `<Contact />` inclusive) with a `panels-container` wrapper:

```jsx
<main>
  <Hero profile={data.profile} />
  <Ticker />
  <div className="relative">
    <About profile={data.profile} />
    <Skills skills={data.skills} />
    <Projects projects={data.projects} />
    <Experience experiences={data.experiences} />
    <Education education={data.education} />
    <Certificates certificates={data.certificates} />
    <Contact profile={data.profile} />
  </div>
</main>
```

*(The `panels-container` div is just `relative` — the panels inside it handle their own stacking via z-index.)*

- [ ] **Step 4: Do a quick smoke-test using About as a preview**

Temporarily change About.jsx's `<SectionWrapper id="about">` to:
```jsx
import SectionPanel from '../layout/SectionPanel'
// ...
<SectionPanel id="about" index={0}>
  {/* existing content unchanged */}
</SectionPanel>
```

Open `http://localhost:5173`, scroll down. You should see:
- About section with rounded top corners (24px)
- Ghost "01" in top-right background
- As you scroll to Skills (still using SectionWrapper), About should scale to 0.95 with dark overlay
- *(Skills won't be a panel yet — that's fine for now)*

Revert About.jsx to `SectionWrapper` for now — the per-section migration is in Tasks 5-11.

- [ ] **Step 5: Commit**

```bash
cd D:/portofolio
git add frontend/src/index.css frontend/src/components/layout/SectionPanel.jsx frontend/src/pages/Portfolio.jsx
git commit -m "feat: add SectionPanel sticky stacking component"
```

---

## Task 3: Create useParallax Hook

**Files:**
- Create: `src/hooks/useParallax.js`

**Interfaces:**
- Produces: `useParallax(ref, { yOffset: 40 })` — attaches GSAP scrub to move `ref.current` by `yOffset` px as its panel scrolls through viewport
- Consumed by: About, Skills, Projects, Experience sections

- [ ] **Step 1: Create `src/hooks/useParallax.js`**

```js
import { useEffect } from 'react'
import { gsap, ScrollTrigger } from '../animations/gsap'
import { prefersReducedMotion } from '../animations/gsap'

/**
 * Parallax scroll effect for an element inside a SectionPanel.
 * @param {React.RefObject} ref - target element
 * @param {object} options
 * @param {number} options.yOffset - total y movement in px over the panel's scroll range.
 *   Positive = drifts downward as panel enters view. Negative = floats upward.
 */
export function useParallax(ref, { yOffset = 40 } = {}) {
  useEffect(() => {
    if (prefersReducedMotion()) return
    if (typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches) return
    const el = ref.current
    if (!el) return

    // Trigger on the nearest sticky panel ancestor, or the element's own parent
    const panel = el.closest('[data-panel-inner]') ?? el.parentElement

    const tween = gsap.fromTo(
      el,
      { y: -yOffset / 2 },
      {
        y: yOffset / 2,
        ease: 'none',
        scrollTrigger: {
          trigger: panel,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.5,
        },
      }
    )

    return () => tween.kill()
  }, [yOffset])
}
```

- [ ] **Step 2: Verify hook can be imported**

In `About.jsx` (temporarily), add:
```js
import { useParallax } from '../../hooks/useParallax'
```

No errors in `npm run dev` console = good. Remove the import — it'll be used properly in Task 5.

- [ ] **Step 3: Commit**

```bash
cd D:/portofolio
git add frontend/src/hooks/useParallax.js
git commit -m "feat: add useParallax hook for GSAP scrub parallax"
```

---

## Task 4: Migrate About Section

**Files:**
- Modify: `src/components/sections/About.jsx`

**What changes:** Replace `SectionWrapper` with `SectionPanel index={0}`, reduce padding from `py-24` to `py-16 px-6`, add `useParallax` on the profile card (drifts 30px), tighten layout to fit in 100vh.

- [ ] **Step 1: Replace imports and SectionWrapper in `About.jsx`**

Replace:
```js
import SectionWrapper from '../layout/SectionWrapper'
```
With:
```js
import SectionPanel from '../layout/SectionPanel'
import { useParallax } from '../../hooks/useParallax'
```

- [ ] **Step 2: Add parallax ref to ProfileCard**

In the `About` component, add a ref and hook call:
```jsx
export default function About({ profile }) {
  const links = socialLinks(profile).filter((l) => l.show)
  const cardRef = useRef(null)
  useParallax(cardRef, { yOffset: 30 })
  // ...
```

Add `import { useRef } from 'react'` if not already imported.

- [ ] **Step 3: Update JSX — swap wrapper + attach ref**

Replace the outer `<SectionWrapper id="about">` wrapper with `<SectionPanel id="about" index={0}>`. Change the inner container padding:

```jsx
return (
  <SectionPanel id="about" index={0}>
    <div className="max-w-6xl mx-auto px-6 py-16 h-full flex flex-col justify-center">
      <AnimatedSection>
        <SectionTitle subtitle="A bit about me">About</SectionTitle>
      </AnimatedSection>
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="order-2 md:order-1">
          <AnimatedSection>
            <p className="text-accent-muted leading-relaxed text-lg mb-6">
              {profile?.bio}
            </p>
            <div className="flex flex-col gap-3">
              {profile?.location && (
                <div className="flex items-center gap-3 text-accent-muted text-sm">
                  <MapPin size={16} className="text-accent-dim shrink-0" />
                  {profile.location}
                </div>
              )}
              {profile?.email && (
                <div className="flex items-center gap-3 text-accent-muted text-sm">
                  <Mail size={16} className="text-accent-dim shrink-0" />
                  {profile.email}
                </div>
              )}
              {profile?.phone && (
                <div className="flex items-center gap-3 text-accent-muted text-sm">
                  <Phone size={16} className="text-accent-dim shrink-0" />
                  {profile.phone}
                </div>
              )}
            </div>
          </AnimatedSection>
        </div>

        <div ref={cardRef} className="order-1 md:order-2">
          <AnimatedSection>
            <ProfileCard profile={profile} links={links} />
          </AnimatedSection>
        </div>
      </div>
    </div>
  </SectionPanel>
)
```

- [ ] **Step 4: Remove now-unused imports**

Remove `Container` and `SectionWrapper` imports from About.jsx since the container is now inlined.

- [ ] **Step 5: Visual check**

Open `http://localhost:5173`, scroll down to About. Verify:
- Rounded top corners visible as About enters viewport
- Ghost "01" in upper-right
- Profile card drifts slightly slower than the rest of the content as you scroll
- About scales to 0.95 + dims when Skills (next section) slides over it
- Layout fits within one viewport height without clipping important content

- [ ] **Step 6: Commit**

```bash
cd D:/portofolio
git add frontend/src/components/sections/About.jsx
git commit -m "feat: migrate About to SectionPanel with parallax card"
```

---

## Task 5: Migrate Skills Section

**Files:**
- Modify: `src/components/sections/Skills.jsx`

**What changes:** Replace `SectionWrapper` with `SectionPanel index={1}`, add alternating row parallax (odd rows float up -15px, even rows drift down +15px).

- [ ] **Step 1: Update imports in `Skills.jsx`**

Replace:
```js
import SectionWrapper from '../layout/SectionWrapper'
import Container from '../layout/Container'
```
With:
```js
import SectionPanel from '../layout/SectionPanel'
import { useRef } from 'react'
import { useParallax } from '../../hooks/useParallax'
```

- [ ] **Step 2: Add row refs and parallax to Skills component**

```jsx
export default function Skills({ skills }) {
  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = (skills || []).filter((s) => s.category === cat)
    if (items.length) acc[cat] = items
    return acc
  }, {})

  if (!Object.keys(grouped).length) return null

  const entries = Object.entries(grouped)

  return (
    <SectionPanel id="skills" index={1}>
      <div className="max-w-6xl mx-auto px-6 py-16 h-full flex flex-col justify-center overflow-y-auto">
        <AnimatedSection>
          <SectionTitle subtitle="Technologies and tools I work with">Skills</SectionTitle>
        </AnimatedSection>
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-6">
          {entries.map(([cat, items], i) => (
            <ParallaxCategoryBlock key={cat} cat={cat} items={items} rowIndex={i} />
          ))}
        </div>
      </div>
    </SectionPanel>
  )
}
```

- [ ] **Step 3: Create `ParallaxCategoryBlock` wrapper**

Add this helper component in `Skills.jsx` (above the existing `CategoryBlock`):

```jsx
function ParallaxCategoryBlock({ cat, items, rowIndex }) {
  const rowRef = useRef(null)
  // Odd rows float up (-20), even rows drift down (+20) for breathing grid effect
  useParallax(rowRef, { yOffset: rowIndex % 2 === 0 ? -20 : 20 })

  return (
    <div ref={rowRef}>
      <CategoryBlock cat={cat} items={items} />
    </div>
  )
}
```

- [ ] **Step 4: Visual check**

Scroll to Skills. Verify:
- Rounded top corners, ghost "02"
- Category card rows have subtle alternating vertical drift as you scroll
- Scale-out effect when Projects slides over Skills

- [ ] **Step 5: Commit**

```bash
cd D:/portofolio
git add frontend/src/components/sections/Skills.jsx
git commit -m "feat: migrate Skills to SectionPanel with breathing grid parallax"
```

---

## Task 6: Migrate Projects Section

**Files:**
- Modify: `src/components/sections/Projects.jsx`

**What changes:** Replace `SectionWrapper` with `SectionPanel index={2}`, add column-offset parallax per project card column (col 0 = -10px, col 1 = 0, col 2 = +10px).

- [ ] **Step 1: Update imports in `Projects.jsx`**

Replace:
```js
import SectionWrapper from '../layout/SectionWrapper'
import Container from '../layout/Container'
```
With:
```js
import SectionPanel from '../layout/SectionPanel'
import { useRef } from 'react'
import { useParallax } from '../../hooks/useParallax'
```

- [ ] **Step 2: Add `ParallaxProjectCard` wrapper**

Add above `ProjectCard` in `Projects.jsx`:

```jsx
function ParallaxProjectCard({ project, onSelect, colIndex }) {
  const cardRef = useRef(null)
  // Column-based offset: left col floats up, right col drifts down
  const yOffset = colIndex === 0 ? -15 : colIndex === 2 ? 15 : 0
  useParallax(cardRef, { yOffset })
  return (
    <div ref={cardRef} className="min-h-[200px]">
      {(!onSelect.selectedId || onSelect.selectedId !== (project.id ?? project._id)) && (
        <ProjectCard project={project} onSelect={onSelect.fn} />
      )}
    </div>
  )
}
```

Wait — the column index needs to be derived from the flat list. Simplest approach: use the array index modulo 3.

Actually, let me keep it simpler. Replace the card wrapper inline:

- [ ] **Step 2 (revised): Update the `Projects` JSX**

In the `Projects` component, replace `SectionWrapper` and update the card render:

```jsx
return (
  <SectionPanel id="projects" index={2}>
    <div className="max-w-6xl mx-auto px-6 py-16 h-full flex flex-col justify-center overflow-y-auto">
      <AnimatedSection>
        <SectionTitle subtitle="Things I've built">Projects</SectionTitle>
      </AnimatedSection>

      {(projects?.length > 0) && (
        <div className="flex flex-wrap gap-2 mb-6">
          {PROJECT_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                filter === type ? 'bg-accent text-background' : 'glass text-accent-muted hover:text-accent'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <ProjectCardWithParallax colIndex={0}>
          <SqlMissionCard navigate={navigate} />
        </ProjectCardWithParallax>

        {filtered.map((project, i) => (
          <ProjectCardWithParallax key={getId(project)} colIndex={(i + 1) % 3}>
            {(!selectedProject || getId(selectedProject) !== getId(project)) && (
              <ProjectCard project={project} onSelect={setSelectedProject} />
            )}
          </ProjectCardWithParallax>
        ))}
      </motion.div>
    </div>

    {/* Modal stays here, unchanged */}
    <AnimatePresence>
      {selectedProject && (
        <>
          {/* ... existing modal JSX unchanged ... */}
        </>
      )}
    </AnimatePresence>
  </SectionPanel>
)
```

Add `ProjectCardWithParallax` helper above `SqlMissionCard`:

```jsx
function ProjectCardWithParallax({ children, colIndex }) {
  const ref = useRef(null)
  const yOffset = colIndex === 0 ? -12 : colIndex === 2 ? 12 : 0
  useParallax(ref, { yOffset })
  return <div ref={ref} className="min-h-[200px]">{children}</div>
}
```

- [ ] **Step 3: Preserve the existing modal JSX**

The `<AnimatePresence>` modal block (lines 102–179 of original Projects.jsx) should remain unchanged inside the `SectionPanel` but outside the content div. Keep it as-is.

- [ ] **Step 4: Visual check**

Scroll to Projects. Verify:
- Rounded top corners, ghost "03"
- Three columns have subtle diagonal offset (left col slightly higher, right col slightly lower)
- Project modal still opens/closes correctly

- [ ] **Step 5: Commit**

```bash
cd D:/portofolio
git add frontend/src/components/sections/Projects.jsx
git commit -m "feat: migrate Projects to SectionPanel with column offset parallax"
```

---

## Task 7: Migrate Experience Section

**Files:**
- Modify: `src/components/sections/Experience.jsx`

**What changes:** Replace `SectionWrapper` with `SectionPanel index={3}`. Add GSAP ScrollTrigger to animate the vertical timeline line growing from height 0 → 100% as the panel is scrolled. No `useParallax` here — the existing depth3D Framer Motion variants provide the 3D effect.

- [ ] **Step 1: Update imports in `Experience.jsx`**

Replace:
```js
import SectionWrapper from '../layout/SectionWrapper'
import Container from '../layout/Container'
```
With:
```js
import SectionPanel from '../layout/SectionPanel'
import { useRef, useEffect } from 'react'
import { gsap, ScrollTrigger } from '../../animations/gsap'
import { prefersReducedMotion } from '../../animations/gsap'
```

- [ ] **Step 2: Rewrite `Experience` component**

```jsx
export default function Experience({ experiences }) {
  const lineRef = useRef(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    const line = lineRef.current
    if (!line) return
    const panel = line.closest('[data-panel-inner]') ?? line.parentElement

    gsap.fromTo(
      line,
      { scaleY: 0, transformOrigin: 'top center' },
      {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: panel,
          start: 'top 80%',
          end: 'bottom 20%',
          scrub: 1.5,
        },
      }
    )
  }, [])

  return (
    <SectionPanel id="experience" index={3}>
      <div className="max-w-6xl mx-auto px-6 py-16 h-full flex flex-col justify-center overflow-y-auto">
        <AnimatedSection>
          <SectionTitle subtitle="Where I've worked and contributed">Experience</SectionTitle>
        </AnimatedSection>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="relative pl-6 space-y-10"
          style={{ perspective: '900px' }}
        >
          {/* Animated timeline line */}
          <div
            ref={lineRef}
            className="absolute left-0 top-0 bottom-0 w-px bg-border"
            style={{ transformOrigin: 'top center' }}
          />

          {(experiences || []).map((exp) => (
            <motion.div
              key={exp.id ?? exp._id}
              variants={depth3D}
              style={{ transformStyle: 'preserve-3d' }}
              className="relative"
            >
              {/* Pulsing dot */}
              <div className="absolute -left-[1.625rem] top-1 w-3 h-3">
                <div className="w-3 h-3 rounded-full bg-accent border-2 border-background relative z-10" />
                <motion.div
                  className="absolute inset-0 rounded-full border border-accent"
                  animate={{ scale: [1, 2.8], opacity: [0.7, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border border-accent"
                  animate={{ scale: [1, 2.8], opacity: [0.7, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut', delay: 0.9 }}
                />
              </div>

              <div className="flex items-center gap-2 mb-1">
                {exp.type === 'internship' ? (
                  <Briefcase size={14} className="text-accent-dim" />
                ) : (
                  <Users size={14} className="text-accent-dim" />
                )}
                <span className="text-xs text-accent-muted uppercase tracking-widest">{exp.type}</span>
              </div>
              <h3 className="font-semibold text-accent text-lg">{exp.title}</h3>
              <p className="text-accent-muted text-sm mb-1">{exp.company}</p>
              <p className="text-xs text-accent-dim mb-3">
                {exp.start_date} — {exp.is_current ? 'Present' : exp.end_date}
              </p>
              <p className="text-sm text-accent-muted leading-relaxed">{exp.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </SectionPanel>
  )
}
```

- [ ] **Step 3: Visual check**

Scroll to Experience. Verify:
- Ghost "04" visible
- Timeline vertical line grows from top to bottom as the panel enters view
- Pulsing dots still animate

- [ ] **Step 4: Commit**

```bash
cd D:/portofolio
git add frontend/src/components/sections/Experience.jsx
git commit -m "feat: migrate Experience to SectionPanel with growing timeline"
```

---

## Task 8: Migrate Education Section

**Files:**
- Modify: `src/components/sections/Education.jsx`

**What changes:** Replace `SectionWrapper` with `SectionPanel index={4}`. No extra parallax — the existing 3D tilt cards handle visual depth.

- [ ] **Step 1: Update imports in `Education.jsx`**

Replace:
```js
import SectionWrapper from '../layout/SectionWrapper'
import Container from '../layout/Container'
```
With:
```js
import SectionPanel from '../layout/SectionPanel'
```

- [ ] **Step 2: Replace `SectionWrapper` with `SectionPanel` in JSX**

```jsx
export default function Education({ education }) {
  return (
    <SectionPanel id="education" index={4}>
      <div className="max-w-6xl mx-auto px-6 py-16 h-full flex flex-col justify-center overflow-y-auto">
        <AnimatedSection>
          <SectionTitle subtitle="My academic background">Education</SectionTitle>
        </AnimatedSection>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-2xl flex flex-col gap-4"
          style={{ perspective: '900px' }}
        >
          {(education || []).map((edu) => (
            <motion.div key={edu.id ?? edu._id} variants={depth3D}>
              <EduCard edu={edu} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </SectionPanel>
  )
}
```

- [ ] **Step 3: Visual check**

Scroll to Education. Verify rounded corners, ghost "05", tilt cards still work.

- [ ] **Step 4: Commit**

```bash
cd D:/portofolio
git add frontend/src/components/sections/Education.jsx
git commit -m "feat: migrate Education to SectionPanel"
```

---

## Task 9: Migrate Certificates Section

**Files:**
- Modify: `src/components/sections/Certificates.jsx`

**What changes:** Replace `SectionWrapper` with `SectionPanel index={5}`. Ghost "06" (since Education is "05", Certificates is "06" — note: index is 5 but displayed ghost is "06" since `index + 1`).

- [ ] **Step 1: Update imports in `Certificates.jsx`**

Replace:
```js
import SectionWrapper from '../layout/SectionWrapper'
import Container from '../layout/Container'
```
With:
```js
import SectionPanel from '../layout/SectionPanel'
```

- [ ] **Step 2: Replace `SectionWrapper` with `SectionPanel` in JSX**

```jsx
export default function Certificates({ certificates }) {
  const [filter, setFilter] = useState('All')
  const filtered = filter === 'All'
    ? certificates || []
    : (certificates || []).filter((c) => c.category === filter)

  return (
    <SectionPanel id="certificates" index={5}>
      <div className="max-w-6xl mx-auto px-6 py-16 h-full flex flex-col justify-center overflow-y-auto">
        <AnimatedSection>
          <SectionTitle subtitle="Courses and certifications I've completed">Certificates</SectionTitle>
        </AnimatedSection>
        {(certificates?.length > 0) && (
          <div className="flex gap-2 mb-8">
            {['All', 'Web', 'Data'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                  filter === f ? 'bg-accent text-background' : 'glass text-accent-muted hover:text-accent'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((cert) => (
              <motion.div key={cert.id ?? cert._id} variants={scaleIn}>
                <CertCard cert={cert} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </SectionPanel>
  )
}
```

- [ ] **Step 3: Visual check**

Scroll to Certificates. Verify ghost "06", rounded corners, filter buttons work.

- [ ] **Step 4: Commit**

```bash
cd D:/portofolio
git add frontend/src/components/sections/Certificates.jsx
git commit -m "feat: migrate Certificates to SectionPanel"
```

---

## Task 10: Migrate Contact Section (Final Panel)

**Files:**
- Modify: `src/components/sections/Contact.jsx`

**What changes:** Replace `SectionWrapper` with `SectionPanel index={6} isLast={true}`. Add ambient radial glow pulse behind the heading using GSAP yoyo. `isLast={true}` disables the scale-out (nothing after Contact).

- [ ] **Step 1: Update imports in `Contact.jsx`**

Replace:
```js
import SectionWrapper from '../layout/SectionWrapper'
import Container from '../layout/Container'
```
With:
```js
import SectionPanel from '../layout/SectionPanel'
import { useRef, useEffect } from 'react'
import { gsap } from '../../animations/gsap'
import { prefersReducedMotion } from '../../animations/gsap'
```

- [ ] **Step 2: Add ambient glow to Contact**

Add a `glowRef` and pulse animation inside the `Contact` component:

```jsx
export default function Contact({ profile }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const glowRef = useRef(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    if (!glowRef.current) return
    gsap.to(glowRef.current, {
      opacity: 0.12,
      scale: 1.15,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    })
  }, [])

  // ... rest of existing state/handlers unchanged
```

- [ ] **Step 3: Replace SectionWrapper with SectionPanel in JSX, add glow element**

```jsx
return (
  <SectionPanel id="contact" index={6} isLast={true}>
    {/* Ambient glow behind content */}
    <div
      ref={glowRef}
      className="absolute inset-0 pointer-events-none"
      style={{
        background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(250,250,249,0.06) 0%, transparent 70%)',
        opacity: 0.06,
        zIndex: 0,
      }}
    />

    <div className="max-w-6xl mx-auto px-6 py-16 h-full flex flex-col justify-center overflow-y-auto">
      <AnimatedSection>
        <SectionTitle subtitle="Let's work together">Get in Touch</SectionTitle>
      </AnimatedSection>
      <div className="grid md:grid-cols-2 gap-10 md:gap-16">
        <AnimatedSection>
          <p className="text-accent-muted mb-8">
            I'm open to new opportunities in data analytics and web development. Feel free to reach out!
          </p>
          <div className="flex flex-col gap-4 mb-10">
            {profile?.email && (
              <a href={`mailto:${profile.email}`} className="flex items-center gap-3 text-accent-muted hover:text-accent transition-colors text-sm">
                <Mail size={16} /> {profile.email}
              </a>
            )}
            {profile?.github && (
              <a href={ensureUrl(profile.github)} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-accent-muted hover:text-accent transition-colors text-sm">
                <Code2 size={16} /> GitHub
              </a>
            )}
            {profile?.linkedin && (
              <a href={ensureUrl(profile.linkedin)} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-accent-muted hover:text-accent transition-colors text-sm">
                <Briefcase size={16} /> LinkedIn
              </a>
            )}
            {profile?.phone && (
              <a href={waUrl(profile.phone)} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-accent-muted hover:text-accent transition-colors text-sm">
                <MessageCircle size={16} /> WhatsApp
              </a>
            )}
          </div>
          <div className="flex items-end gap-6 opacity-60">
            <motion.div animate={{ rotateY: 360 }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}>
              <WireframeCube size={100} opacity={0.35} />
            </motion.div>
            <motion.div animate={{ rotateY: -360, rotateX: 180 }} transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}>
              <WireframeCube size={66} opacity={0.25} />
            </motion.div>
          </div>
        </AnimatedSection>

        <AnimatedSection>
          <Tilt3D intensity={5} perspective={1200} className="rounded-2xl">
            <div className="glass rounded-2xl p-6 md:p-8">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input
                  className={inputClass}
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
                <input
                  type="email"
                  className={inputClass}
                  placeholder="Your email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
                <textarea
                  className={`${inputClass} resize-none h-36`}
                  placeholder="Your message"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                />
                {status === 'error' && (
                  <p className="text-sm text-red-400">Something went wrong. Please try again.</p>
                )}
                <MotionButton variant="primary" disabled={loading}>
                  <Send size={16} />
                  {loading ? 'Sending...' : 'Send Message'}
                </MotionButton>
              </form>
            </div>
          </Tilt3D>
        </AnimatedSection>
      </div>
    </div>
  </SectionPanel>
)
```

- [ ] **Step 4: Full end-to-end visual check**

Scroll through the entire portfolio from top to bottom. Verify:
1. Hero: unchanged, Lenis smooth scroll feels buttery
2. About: rounded corners, ghost "01", profile card parallax drift, scales to 0.95 as Skills enters
3. Skills: ghost "02", category rows have alternating vertical drift
4. Projects: ghost "03", column diagonal offset, modal opens/closes correctly
5. Experience: ghost "04", timeline line grows, pulsing dots animate
6. Education: ghost "05", tilt cards work
7. Certificates: ghost "06", filter buttons work
8. Contact: ghost "07", subtle glow pulse, NO scale-out effect, form submits correctly
9. All panels have rounded top corners and subtle border-top
10. No z-index bugs (panels should never appear in wrong order)
11. `prefers-reduced-motion` in browser DevTools: all GSAP effects disabled, stacking still works via CSS

- [ ] **Step 5: Commit**

```bash
cd D:/portofolio
git add frontend/src/components/sections/Contact.jsx
git commit -m "feat: migrate Contact to SectionPanel (final panel) with ambient glow"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Lenis smooth scroll — Task 1
- ✅ CSS sticky stacking panels — Task 2 (SectionPanel)
- ✅ Scale + dim outgoing panels — Task 2 (ScrollTrigger onUpdate in SectionPanel)
- ✅ Ghost section numbers — Task 2 (rendered in SectionPanel JSX)
- ✅ GSAP parallax layers — Task 3 (useParallax) + Tasks 4, 5, 6
- ✅ Panel backgrounds per section — Task 2 (PANEL_BG array)
- ✅ Border-top per section — Task 2 (PANEL_BORDER_TOP array)
- ✅ Timeline line growth — Task 7
- ✅ Contact ambient glow — Task 10
- ✅ isLast prop disables scale-out — Task 2 + Task 10
- ✅ prefersReducedMotion guard — useLenis, useParallax, SectionPanel, Experience, Contact
- ✅ Touch device skip for parallax — useParallax
- ✅ SectionWrapper untouched — checked, no Task modifies it
- ✅ SQL game / admin untouched — no Task references those files

**Placeholder scan:** No TBDs, no TODOs, all steps have actual code.

**Type consistency:** `useParallax(ref, { yOffset })` used consistently across Tasks 4, 5, 6. `SectionPanel` props `id`, `index`, `isLast` consistent across Tasks 2 and 5-10.
