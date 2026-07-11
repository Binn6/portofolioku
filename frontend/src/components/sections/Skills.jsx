import { useRef } from 'react'
import { motion } from 'framer-motion'
import { staggerContainer, flipIn3D } from '../../animations/variants'
import AnimatedSection from '../animations/AnimatedSection'
import SectionPanel from '../layout/SectionPanel'
import SectionTitle from '../ui/SectionTitle'
import { useTilt } from '../ui/Tilt3D'
import { useParallax } from '../../hooks/useParallax'

const CATEGORIES = ['Languages', 'Frameworks', 'Data', 'Tools', 'Soft Skills']
const LEVEL_LABEL = ['', 'Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert']

function ParallaxCategoryBlock({ cat, items, rowIndex }) {
  const rowRef = useRef(null)
  // Odd rows float up (-20), even rows drift down (+20) for breathing grid effect
  useParallax(rowRef, { yOffset: rowIndex % 2 === 0 ? -20 : 20 })

  return (
    <div ref={rowRef}>
      <CategoryBlock cat={cat} items={items} />
    </div>
  )
}

function CategoryBlock({ cat, items }) {
  const { ref, rotateX, rotateY, glareBg, onMouseMove, onMouseLeave } = useTilt(4)

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 800 }}
      className="relative bg-surface-2/40 border border-border rounded-2xl p-5"
    >
      <div className="flex items-center gap-3 mb-5">
        <h3 className="text-xs font-semibold text-accent uppercase tracking-widest">{cat}</h3>
        <div className="flex-1 h-px bg-border" />
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid grid-cols-2 sm:grid-cols-1 gap-2"
        style={{ perspective: '600px' }}
      >
        {items.map((skill) => (
          <motion.div
            key={skill.id ?? skill._id}
            variants={flipIn3D}
            className="flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-4 bg-surface-2 border border-border hover:border-accent-dim rounded-xl px-3 sm:px-5 py-3 transition-colors text-center sm:text-left"
          >
            <span className="text-xs sm:text-sm text-accent sm:flex-1 sm:min-w-0 sm:truncate">{skill.name}</span>
            <div className="flex gap-0.5 sm:hidden">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < skill.level ? 'bg-accent' : 'bg-border'}`} />
              ))}
            </div>
            <span className="text-xs text-accent-muted shrink-0 w-20 text-right hidden sm:block">
              {LEVEL_LABEL[skill.level]}
            </span>
            <div className="w-24 h-1.5 rounded-full bg-surface shrink-0 overflow-hidden hidden sm:block">
              <motion.div
                className="h-full rounded-full bg-accent"
                initial={{ width: 0 }}
                whileInView={{ width: `${(skill.level / 5) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="absolute inset-0 pointer-events-none rounded-2xl z-10"
        style={{ background: glareBg }}
      />
    </motion.div>
  )
}

export default function Skills({ skills }) {
  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = (skills || []).filter((s) => s.category === cat)
    if (items.length) acc[cat] = items
    return acc
  }, {})

  if (!Object.keys(grouped).length) return null

  const entries = Object.entries(grouped)

  return (
    <SectionPanel id="skills" index={1}>
      <div className="max-w-6xl mx-auto px-6 py-16 h-full flex flex-col justify-center overflow-y-auto">
        <AnimatedSection>
          <SectionTitle subtitle="Technologies and tools I work with">Skills</SectionTitle>
        </AnimatedSection>
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-6">
          {entries.map(([cat, items], i) => (
            <ParallaxCategoryBlock key={cat} cat={cat} items={items} rowIndex={i} />
          ))}
        </div>
      </div>
    </SectionPanel>
  )
}
