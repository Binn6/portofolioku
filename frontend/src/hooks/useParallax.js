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
