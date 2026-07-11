import { motion } from 'framer-motion'
import { GraduationCap } from 'lucide-react'
import { staggerContainer, depth3D } from '../../animations/variants'
import AnimatedSection from '../animations/AnimatedSection'
import SectionPanel from '../layout/SectionPanel'
import SectionTitle from '../ui/SectionTitle'
import { useTilt } from '../ui/Tilt3D'

export default function Education({ education }) {
  return (
    <SectionPanel id="education" index={4}>
      <div className="max-w-6xl mx-auto px-6 py-16 h-full flex flex-col justify-center overflow-y-auto">
        <AnimatedSection>
          <SectionTitle subtitle="My academic background">Education</SectionTitle>
        </AnimatedSection>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-2xl flex flex-col gap-4"
          style={{ perspective: '900px' }}
        >
          {(education || []).map((edu) => (
            <motion.div key={edu.id ?? edu._id} variants={depth3D}>
              <EduCard edu={edu} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </SectionPanel>
  )
}

function EduCard({ edu }) {
  const { ref, rotateX, rotateY, glareBg, onMouseMove, onMouseLeave } = useTilt(6)

  return (
    <div style={{ perspective: 900 }}>
      <motion.div
        ref={ref}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="relative glass rounded-xl p-4 sm:p-5"
      >
        <div className="flex gap-4">
          <div className="p-2 rounded-lg bg-surface-2 shrink-0 self-start">
            <GraduationCap size={20} className="text-accent-muted" />
          </div>
          <div>
            <h3 className="font-semibold text-accent text-lg">{edu.institution}</h3>
            <p className="text-accent-muted text-sm mb-1">{edu.degree} — {edu.field}</p>
            <p className="text-xs text-accent-dim mb-3">{edu.start_year} — {edu.end_year || 'Present'}</p>
            {edu.description && (
              <p className="text-sm text-accent-muted leading-relaxed">{edu.description}</p>
            )}
          </div>
        </div>
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-xl z-10"
          style={{ background: glareBg }}
        />
      </motion.div>
    </div>
  )
}
