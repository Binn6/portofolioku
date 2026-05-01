import { motion } from 'framer-motion'

export default function MotionButton({ children, onClick, href, variant = 'primary', className = '' }) {
  const base = 'inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-colors'
  const styles = {
    primary: 'bg-accent text-background hover:bg-accent/90',
    outline: 'border border-border text-accent-muted hover:text-accent hover:border-accent',
    ghost: 'text-accent-muted hover:text-accent',
  }

  const Tag = href ? 'a' : 'button'
  const props = href ? { href, target: '_blank', rel: 'noreferrer' } : { onClick }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="inline-block"
    >
      <Tag className={`${base} ${styles[variant]} ${className}`} {...props}>
        {children}
      </Tag>
    </motion.div>
  )
}
