import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger, prefersReducedMotion } from '../../animations/gsap'

export default function AnimatedSection({ children, className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    if (prefersReducedMotion()) return

    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 32 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 85%',
          once: true,
        },
      }
    )

    return () => ScrollTrigger.getAll().forEach((t) => t.kill())
  }, [])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
