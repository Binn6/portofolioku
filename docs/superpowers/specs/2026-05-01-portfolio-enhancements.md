# Portfolio Enhancements — Design Spec
**Date:** 2026-05-01  
**Owner:** Mochsabil Em Abyan  
**Status:** Approved

---

## 1. Overview

Four visual and interactive enhancements to the existing portfolio frontend. All changes are frontend-only (no backend changes required). The stack remains React + Vite, Framer Motion, GSAP, Tailwind CSS.

---

## 2. Feature 1 — Fire Aurora Hero Background

### What
A canvas-based animated background behind the Hero section. Wavy vertical lines in fire colors (red → orange → amber → gold) pulse and sway, creating a curtain-of-fire aurora effect.

### Implementation
- New `AuroraCanvas` component renders a `<canvas>` element positioned `absolute inset-0` behind all Hero content
- 22 vertical "columns", each an animated sine-wave stroke path drawn each frame via `requestAnimationFrame`
- Each column: random `x` position, phase offset, speed, amplitude, color index, opacity, and line width
- Gradient stroke per column: `rgba(r,g,b,0)` at top → peak opacity at ~45% height → fade to 0 at bottom
- Opacity pulses with `sin(t * vspeed + vphase)` for organic breathing effect
- Color palette: `[255,40,0], [255,100,0], [255,160,0], [255,200,20], [220,30,10]`
- Dark radial vignette overlay (`rgba(0,0,0,0)` center → `rgba(0,0,0,0.75)` edges) keeps hero text fully readable

### Acceptance Criteria
- Canvas resizes on window resize
- Fire animation does not obscure name, title, CTAs, or social links
- Performs at 60fps on modern hardware (no heavy computation in draw loop)

---

## 3. Feature 2 — Ticker Scroll

### What
A horizontal scrolling text band that auto-scrolls based on page scroll position using Framer Motion `useScroll` + `useTransform`.

### Implementation
- New `Ticker` component placed between Hero and About sections as a standalone `TickerSection`
- Uses `useScroll` to track page scroll, `useTransform` to map `scrollYProgress` → `x` translate
- Text items: **"Analyze"**, **"Visualize"**, **"Build"**, **"Deploy"** — items repeat to fill band width
- Alternating style: odd items = normal filled text (`text-accent`), even items = outline text (`-webkit-text-stroke: 1px`)
- Items separated by a small decorative divider (e.g., `·` or `/`)
- Direction: scrolling left as user scrolls down
- Band height ~60–80px, full viewport width, `overflow:hidden`, background matches `surface` (`#111111`)

### Acceptance Criteria
- Smooth scroll-linked motion (no jank)
- Text fills the full width with repetition
- Alternating filled/outline style clearly visible

---

## 4. Feature 3 — Project Card Modal (Full Screen Overlay)

### What
Clicking a project card expands it into a full-screen overlay with a Framer Motion shared layout transition (`layoutId`).

### Implementation
- Each project card has a `layoutId` tied to its `_id`
- On click: `selectedProject` state set, `AnimatePresence` renders a full-screen `motion.div` with the same `layoutId`
- Overlay layout: **image left (40%)**, **details right (60%)** on desktop; stacked on mobile
- Right panel contains: project title, description, tech stack badges, website link button, PDF download button (if `pdf_url` exists), GitHub link (if `github_url` exists)
- Close button top-right (`X` icon), also closes on backdrop click or `Escape` key
- Backdrop: `fixed inset-0 bg-black/80 backdrop-blur-sm z-50`
- Scroll lock on `body` while modal is open

### Acceptance Criteria
- Shared element transition plays smoothly card → overlay and overlay → card
- All project metadata visible in modal
- Keyboard accessible (Escape closes)
- Works on mobile (stacked layout)

---

## 5. Feature 4 — Splash Screen Upgrade

### What
Replace the plain fade-in "MA" text on the splash screen with an animated white-fire aurora canvas plus ghost-red accent strands.

### Implementation
- Reuses the same canvas aurora animation pattern as Feature 1, but with a white+ghost-red palette
- Color set: `[255,255,255]` (×3), `[255,200,200]` (ghost red), `[255,180,180]` (pale red), `[250,250,249]` (warm white)
- 24 columns, same animation parameters as Hero aurora
- "MA" initials remain centered in `Georgia, serif`, `font-size:80px`, `color:#fafaf9`
- Subtle `text-shadow: 0 0 40px rgba(255,255,255,0.4)` on initials
- Dark radial vignette overlay keeps initials readable against the curtains
- Progress bar at bottom unchanged (2px, fills over `~2s`, `background:#fafaf9`)
- Canvas is destroyed and `requestAnimationFrame` cancelled when splash unmounts

### Acceptance Criteria
- White aurora curtains visible, ghost-red strands subtly woven in
- "MA" initials clearly readable at all times
- No animation loop leak after splash screen exits
- Transition from splash → portfolio is smooth (existing fade-out behavior preserved)

---

## 6. Component Map

| Feature | New / Modified | File |
|---|---|---|
| Aurora Hero BG | New | `frontend/src/components/sections/Hero.jsx` |
| Ticker | New | `frontend/src/components/ui/Ticker.jsx` |
| TickerSection | New placement | `frontend/src/pages/Portfolio.jsx` |
| Project Modal | Modified | `frontend/src/components/sections/Projects.jsx` |
| Splash Aurora | Modified | `frontend/src/components/animations/SplashScreen.jsx` |

---

## 7. Constraints

- No new npm packages — all features use existing stack (Framer Motion, GSAP, canvas API)
- `lucide-react` v1.14.0 does not have `Github` or `Linkedin` icons — use `Code2` and `Briefcase` as established
- Aurora canvas must be cleanup-safe (cancel `requestAnimationFrame` on unmount via `useEffect` return)
- Ticker must not break existing scroll behavior or GSAP ScrollTrigger pins
