# Portfolio Velocity Scroll & Overlapping Sections — Design Spec

**Date:** 2026-07-12
**Scope:** Portfolio frontend only (`frontend/src/`) — SQL game, admin, and routing are untouched.

---

## 1. Goal

Redesign the portfolio scroll experience with:
1. **Lenis smooth scroll** — buttery momentum/velocity feel
2. **CSS sticky stacking panels** — sections overlap like a deck of cards sliding up
3. **GSAP parallax layers** — elements inside each panel move at different speeds
4. **Scale + dim outgoing panels** — previous panel shrinks to 0.95 + darkens as new panel covers it

---

## 2. Tech Stack (no new major deps except Lenis)

| Tool | Role |
|---|---|
| `lenis` (new, ~3KB) | Smooth momentum scroll, velocity tracking |
| `gsap` + `ScrollTrigger` | Parallax layers within panels + scale-out of outgoing panels |
| `framer-motion` | Existing micro-animations and hover effects (unchanged) |
| CSS `position: sticky` | Zero-JS stacking panel mechanism |

---

## 3. Page Structure

```
<body>
  <Navbar />                         fixed, z-50
  <Hero />                           normal flow, min-h-screen
  <Ticker />                         normal flow, between hero and panels
  <div class="panels-container">     position: relative
    <About />    z-[10]
    <Skills />   z-[11]
    <Projects /> z-[12]
    <Experience /> z-[13]
    <Education /> z-[14]
    <Certificates /> z-[15]
    <Contact />  z-[16]
  </div>
  <Footer />
```

Hero and Ticker remain in normal document flow. All sections from About → Contact become sticky stacking panels.

---

## 4. SectionPanel Component

Replaces `SectionWrapper` for all portfolio sections. `SectionWrapper` is kept for backward compat (admin uses it).

```jsx
// SectionPanel.jsx
// props: id, index (0-based, drives z-index offset), children, className
// outer div: height: 200vh, position: relative  ← scroll space
// inner div: position: sticky, top: 0, min-height: 100vh
//            border-radius: 24px 24px 0 0
//            overflow: hidden
```

The `200vh` outer height gives each panel a "dwell window" — the panel is visible for one full viewport height before the next panel begins to slide over it.

**Z-index mapping:**
```
About        → z-[10]
Skills       → z-[11]
Projects     → z-[12]
Experience   → z-[13]
Education    → z-[14]
Certificates → z-[15]
Contact      → z-[16]
```

---

## 5. Panel Backgrounds

Alternating subtle background values create visual separation when panels "peek" below:

| Section | Background | Top Border |
|---|---|---|
| About | `#111111` | `rgba(255,255,255,0.06)` |
| Skills | `#0f0f0f` | `rgba(255,255,255,0.04)` |
| Projects | `#111111` | `rgba(255,255,255,0.06)` |
| Experience | `#0d0d0d` | `rgba(255,255,255,0.05)` |
| Education | `#111111` | `rgba(255,255,255,0.04)` |
| Certificates | `#0f0f0f` | `rgba(255,255,255,0.05)` |
| Contact | `#0a0a0a` | `rgba(250,250,249,0.10)` (subtle glow) |

---

## 6. Scale + Dim Effect on Outgoing Panels

When panel N+1 enters and begins covering panel N, GSAP ScrollTrigger animates panel N:
- `scale: 1.0 → 0.95`
- An overlay div inside panel N fades from `opacity: 0 → 0.4` (dark overlay)
- `border-radius` on the sticky inner div creates the "card" visual at all times

This is handled in a `useEffect` inside `SectionPanel` triggered after Lenis/ScrollTrigger are ready.

---

## 7. Parallax Layer System

Each panel exposes 4 logical layers:

```
Layer 0 — ghost-number      opacity: 0.04, large font, top-right corner → y: +40px over panel scroll
Layer 1 — section title     standard → y: -20px (floats up as panel enters)
Layer 2 — main content      y: 0 (reference, no parallax)
Layer 3 — floating accents  small decorative dots/lines → y: +60px (drift down)
```

Ghost numbers: `"01"` through `"06"` (About → Contact), rendered in `font-display`, `10rem`, `opacity-[0.04]`.

Implementation: `useParallax(ref, speed)` hook returns a GSAP ScrollTrigger scrub tween. Each panel's section-title wrapper and ghost-number div use this hook.

---

## 8. Lenis Setup

```js
// frontend/src/hooks/useLenis.js
import Lenis from 'lenis'
import { gsap } from '../animations/gsap'
import { ScrollTrigger } from '../animations/gsap'
import { useEffect } from 'react'

export function useLenis() {
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.075, duration: 1.2, smoothWheel: true })

    // Bridge Lenis → GSAP ticker (single RAF loop)
    gsap.ticker.add((time) => lenis.raf(time * 1000))
    gsap.ticker.lagSmoothing(0)

    // Bridge Lenis → ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update)

    return () => {
      lenis.destroy()
      gsap.ticker.remove((time) => lenis.raf(time * 1000))
    }
  }, [])
}
```

Called once at the top of `Portfolio.jsx`.

---

## 9. Per-Section Parallax Details

**About** — Profile photo card parallax: `-30px` relative to content (floats slower). Ghost "01".

**Skills** — Category card rows alternate parallax offset: odd rows `-15px`, even rows `+15px`, creating a "breathing grid" effect. Ghost "02".

**Projects** — Each project card gets staggered `translateY` based on column index: col 0 = `-10px`, col 1 = `0`, col 2 = `+10px`. Ghost "03".

**Experience** — Timeline vertical line grows from height `0 → 100%` via GSAP scrub as panel is in view. Experience cards enter from alternating sides. Ghost "04".

**Education** — Cards float in from bottom. Ghost "05".

**Certificates** — Grid with stagger. Ghost "05" shared with Education (same panel split).

**Contact** — Ambient radial glow behind CTA text pulses via GSAP yoyo. Ghost "06".

---

## 10. Files Changed

| File | Change |
|---|---|
| `frontend/package.json` | Add `lenis` |
| `frontend/src/index.css` | Panel base styles (border-radius, overflow) |
| `frontend/src/hooks/useLenis.js` | New — Lenis init + GSAP bridge |
| `frontend/src/hooks/useParallax.js` | New — GSAP ScrollTrigger scrub helper |
| `frontend/src/components/layout/SectionPanel.jsx` | New — sticky panel wrapper |
| `frontend/src/pages/Portfolio.jsx` | Add `useLenis()`, wrap sections in panels-container |
| `frontend/src/components/sections/About.jsx` | Use SectionPanel, add parallax layers |
| `frontend/src/components/sections/Skills.jsx` | Use SectionPanel, add parallax layers |
| `frontend/src/components/sections/Projects.jsx` | Use SectionPanel, add parallax layers |
| `frontend/src/components/sections/Experience.jsx` | Use SectionPanel, add parallax layers |
| `frontend/src/components/sections/Education.jsx` | Use SectionPanel, add parallax layers |
| `frontend/src/components/sections/Certificates.jsx` | Use SectionPanel, add parallax layers |
| `frontend/src/components/sections/Contact.jsx` | Use SectionPanel, add parallax layers |

**Not touched:** `SectionWrapper.jsx` (admin uses it), all `sql-game/`, all `admin/`, `App.jsx`.

---

## 11. Constraints

- `prefers-reduced-motion`: All parallax and scale effects disabled. Panels still stack via CSS sticky.
- Mobile: Parallax disabled on touch devices (matchMedia hover:none). Stacking still works.
- No changes to SQL game, admin panel, or routing.
- `SectionWrapper` stays untouched for admin pages.
