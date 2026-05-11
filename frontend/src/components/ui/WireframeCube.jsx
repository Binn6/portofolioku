import { useEffect, useRef } from 'react'

const VERTICES = [
  [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
  [-1, -1,  1], [1, -1,  1], [1, 1,  1], [-1, 1,  1],
]
const EDGES = [
  [0,1],[1,2],[2,3],[3,0],
  [4,5],[5,6],[6,7],[7,4],
  [0,4],[1,5],[2,6],[3,7],
]

function rotY(v, a) {
  const c = Math.cos(a), s = Math.sin(a)
  return [v[0]*c - v[2]*s, v[1], v[0]*s + v[2]*c]
}
function rotX(v, a) {
  const c = Math.cos(a), s = Math.sin(a)
  return [v[0], v[1]*c - v[2]*s, v[1]*s + v[2]*c]
}
function project(v, w, h) {
  const z = v[2] + 3.8
  const scale = (w * 0.34) / z
  return [w / 2 + v[0] * scale, h / 2 + v[1] * scale]
}

export default function WireframeCube({ size = 180, color = '250,250,249', opacity = 0.22 }) {
  const ref = useRef(null)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    cv.width = size * window.devicePixelRatio
    cv.height = size * window.devicePixelRatio
    const ctx = cv.getContext('2d')
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    let t = 0, rafId

    const draw = () => {
      ctx.clearRect(0, 0, size, size)
      t += 0.005
      const verts = VERTICES.map(v => project(rotX(rotY(v, t), t * 0.45), size, size))
      ctx.strokeStyle = `rgba(${color},${opacity})`
      ctx.lineWidth = 1
      EDGES.forEach(([a, b]) => {
        ctx.beginPath()
        ctx.moveTo(...verts[a])
        ctx.lineTo(...verts[b])
        ctx.stroke()
      })
      rafId = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(rafId)
  }, [size, color, opacity])

  return <canvas ref={ref} style={{ width: size, height: size }} />
}
