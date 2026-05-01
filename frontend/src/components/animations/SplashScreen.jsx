import { useEffect, useRef } from 'react'
import { gsap, prefersReducedMotion } from '../../animations/gsap'

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
      className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center"
    >
      <p ref={nameRef} className="font-display text-4xl font-semibold text-accent opacity-0">
        MA
      </p>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-surface-2">
        <div ref={progressRef} className="h-full bg-accent w-0" />
      </div>
    </div>
  )
}
