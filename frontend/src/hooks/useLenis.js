import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from '../animations/gsap'
import { prefersReducedMotion } from '../animations/gsap'

export function useLenis() {
  useEffect(() => {
    if (prefersReducedMotion()) return

    const lenis = new Lenis({
      lerp: 0.075,
      duration: 1.2,
      smoothWheel: true,
    })

    // Sync Lenis scroll position → ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update)

    // Drive Lenis from GSAP's RAF loop (single RAF, no conflicts)
    const rafHandler = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(rafHandler)
    gsap.ticker.lagSmoothing(0)

    return () => {
      lenis.destroy()
      gsap.ticker.remove(rafHandler)
    }
  }, [])
}
