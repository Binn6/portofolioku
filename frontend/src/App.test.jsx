import '@testing-library/jest-dom'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// jsdom does not implement window.matchMedia or ResizeObserver, but the
// Portfolio page's animation/scroll stack (gsap ScrollTrigger, Lenis) calls
// them eagerly on import/mount. vi.hoisted runs before the static
// `import App` below is evaluated, so the polyfills are in place before that
// module graph loads and before Portfolio mounts.
vi.hoisted(() => {
  if (typeof window !== 'undefined' && !window.matchMedia) {
    window.matchMedia = () => ({
      matches: false,
      media: '',
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })
  }
  if (typeof window !== 'undefined' && !window.ResizeObserver) {
    window.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  }
})

import App from './App'

describe('App routing', () => {
  it('renders the CPNS TIU practice page at /latihan-cpns-tiu', () => {
    window.history.pushState({}, '', '/latihan-cpns-tiu')

    render(<App />)

    expect(screen.getByText('LATIHAN TIU · CPNS')).toBeInTheDocument()
  })
})
