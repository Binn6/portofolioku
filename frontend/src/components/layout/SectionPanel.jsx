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
  'rgba(250,249,246,0.10)',
]

export default function SectionPanel({ id, index = 0, isLast = false, children, className = '' }) {
  const outerRef = useRef(null)
  const innerRef = useRef(null)
  const overlayRef = useRef(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    if (isLast) return
    if (window.matchMedia('(max-width: 767px)').matches) return
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
    <div
      ref={outerRef}
      className="section-panel-outer"
      style={{ height: '250vh', position: 'relative', marginBottom: isLast ? 0 : '-100vh' }}
    >
      <section
        id={id}
        ref={innerRef}
        data-panel-inner="true"
        className={`panel-inner sticky top-0 h-screen overflow-y-auto no-scrollbar ${className}`}
        data-lenis-prevent=""
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

        {/* Content sits above overlay, natural height so section can scroll */}
        <div className="relative" style={{ zIndex: 1 }}>
          {children}
        </div>
      </section>
    </div>
  )
}
