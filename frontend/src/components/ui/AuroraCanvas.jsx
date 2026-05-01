import { useEffect, useRef } from 'react'

export default function AuroraCanvas({ colors, columnCount = 22, className = '' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return

    const resize = () => {
      cv.width = cv.offsetWidth
      cv.height = cv.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const ctx = cv.getContext('2d')
    const cols = Array.from({ length: columnCount }, (_, i) => ({
      x: (i / Math.max(columnCount - 1, 1)) * cv.width,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.007 + 0.003,
      amp: Math.random() * 22 + 10,
      ci: Math.floor(Math.random() * colors.length),
      o: Math.random() * 0.22 + 0.08,
      w: Math.random() * 2.5 + 1,
      vphase: Math.random() * Math.PI * 2,
      vspeed: Math.random() * 0.005 + 0.002,
    }))

    let t = 0
    let rafId

    function draw() {
      ctx.clearRect(0, 0, cv.width, cv.height)
      cols.forEach(c => {
        const [r, g, b] = colors[c.ci]
        const ap = c.o * (0.65 + Math.sin(t * c.vspeed + c.vphase) * 0.35)
        const grad = ctx.createLinearGradient(0, 0, 0, cv.height)
        grad.addColorStop(0,    `rgba(${r},${g},${b},0)`)
        grad.addColorStop(0.15, `rgba(${r},${g},${b},${ap * 0.3})`)
        grad.addColorStop(0.45, `rgba(${r},${g},${b},${ap})`)
        grad.addColorStop(0.75, `rgba(${r},${g},${b},${ap * 0.4})`)
        grad.addColorStop(1,    `rgba(${r},${g},${b},0)`)
        ctx.beginPath()
        ctx.moveTo(c.x, 0)
        for (let y = 0; y <= cv.height; y += 6) {
          const sx = c.x + Math.sin(t * c.speed + c.phase + y * 0.035) * c.amp
          ctx.lineTo(sx, y)
        }
        ctx.strokeStyle = grad
        ctx.lineWidth = c.w
        ctx.stroke()
      })
      t++
      rafId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(rafId)
    }
  }, [colors, columnCount])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
    />
  )
}
