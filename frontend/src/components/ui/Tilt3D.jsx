import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

export function useTilt(intensity = 12) {
  const ref = useRef(null)
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const springX = useSpring(rx, { stiffness: 260, damping: 30 })
  const springY = useSpring(ry, { stiffness: 260, damping: 30 })
  const rotateX = useTransform(springY, [-0.5, 0.5], [intensity, -intensity])
  const rotateY = useTransform(springX, [-0.5, 0.5], [-intensity, intensity])
  const glareX = useTransform(springX, [-0.5, 0.5], [0, 100])
  const glareY = useTransform(springY, [-0.5, 0.5], [0, 100])
  const glareBg = useTransform(
    [glareX, glareY],
    ([gx, gy]) => `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.09) 0%, transparent 65%)`
  )

  const onMouseMove = (e) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    rx.set((e.clientX - rect.left) / rect.width - 0.5)
    ry.set((e.clientY - rect.top) / rect.height - 0.5)
  }
  const onMouseLeave = () => { rx.set(0); ry.set(0) }

  return { ref, rotateX, rotateY, glareBg, onMouseMove, onMouseLeave }
}

export default function Tilt3D({ children, className = '', intensity = 12, perspective = 900 }) {
  const { ref, rotateX, rotateY, glareBg, onMouseMove, onMouseLeave } = useTilt(intensity)

  return (
    <div style={{ perspective }}>
      <motion.div
        ref={ref}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className={`relative ${className}`}
      >
        {children}
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-[inherit] z-10"
          style={{ background: glareBg }}
        />
      </motion.div>
    </div>
  )
}
