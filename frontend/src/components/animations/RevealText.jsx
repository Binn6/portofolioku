import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger, prefersReducedMotion } from '../../animations/gsap'

export default function RevealText({ children, as: Tag = 'h2', className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    if (prefersReducedMotion()) return

    const words = ref.current.querySelectorAll('.word')
    gsap.fromTo(
      words,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.05,
        ease: 'power2.out',
        scrollTrigger: { trigger: ref.current, start: 'top 85%', once: true },
      }
    )

    return () => ScrollTrigger.getAll().forEach((t) => t.kill())
  }, [])

  const text = typeof children === 'string' ? children : ''

  return (
    <Tag ref={ref} className={className}>
      {text.split(' ').map((word, i) => (
        <span key={i} className="word inline-block mr-[0.25em]">
          {word}
        </span>
      ))}
    </Tag>
  )
}
