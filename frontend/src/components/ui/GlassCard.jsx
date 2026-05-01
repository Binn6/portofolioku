import { motion } from 'framer-motion'
import { scaleIn } from '../../animations/variants'

export default function GlassCard({ children, className = '', hover = false }) {
  return (
    <motion.div
      variants={scaleIn}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : undefined}
      className={`glass rounded-xl p-6 ${className}`}
    >
      {children}
    </motion.div>
  )
}
