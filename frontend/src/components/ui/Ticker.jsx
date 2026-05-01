import { motion, useScroll, useTransform } from 'framer-motion'

const ITEMS = ['Analyze', 'Visualize', 'Build', 'Deploy']
const REPEATED = Array.from({ length: 6 }, () => ITEMS).flat()

export default function Ticker() {
  const { scrollYProgress } = useScroll()
  const x = useTransform(scrollYProgress, [0, 1], [0, -1200])

  return (
    <div className="w-full overflow-hidden bg-surface border-y border-surface-2 py-5">
      <motion.div style={{ x }} className="flex items-center whitespace-nowrap">
        {REPEATED.map((item, i) => (
          <span key={i} className="inline-flex items-center">
            <span
              className="text-2xl font-bold uppercase tracking-widest mx-6"
              style={
                i % 2 === 0
                  ? { color: '#fafaf9' }
                  : { color: 'transparent', WebkitTextStroke: '1px #fafaf9' }
              }
            >
              {item}
            </span>
            <span className="mx-2 select-none" style={{ color: '#a8a29e' }}>·</span>
          </span>
        ))}
      </motion.div>
    </div>
  )
}
