import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger, prefersReducedMotion } from '../../animations/gsap'

export default function ScrollProgressBar() {
  const barRef = useRef(null)

  useEffect(() => {
    if (prefersReducedMotion()) return

    gsap.to(barRef.current, {
      width: '100%',
      ease: 'none',
      scrollTrigger: {
        trigger: document.documentElement,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
      },
    })

    return () => ScrollTrigger.getAll().forEach((t) => t.kill())
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 h-0.5 z-50 bg-surface-2">
      <div ref={barRef} className="h-full bg-accent w-0" />
    </div>
  )
}
