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
    <section className="relative min-h-screen flex items-center overflow-hidden">
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
