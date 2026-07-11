import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, Download } from 'lucide-react'
import { staggerContainer, scaleIn } from '../../animations/variants'
import { useTilt } from '../ui/Tilt3D'
import AnimatedSection from '../animations/AnimatedSection'
import SectionPanel from '../layout/SectionPanel'
import SectionTitle from '../ui/SectionTitle'

export default function Certificates({ certificates }) {
  const [filter, setFilter] = useState('All')
  const filtered = filter === 'All'
    ? certificates || []
    : (certificates || []).filter((c) => c.category === filter)

  return (
    <SectionPanel id="certificates" index={5}>
      <div className="max-w-6xl mx-auto px-6 py-16 h-full flex flex-col justify-center overflow-y-auto">
        <AnimatedSection>
          <SectionTitle subtitle="Courses and certifications I've completed">Certificates</SectionTitle>
        </AnimatedSection>
        {(certificates?.length > 0) && (
          <div className="flex gap-2 mb-8">
            {['All', 'Web', 'Data'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                  filter === f ? 'bg-accent text-background' : 'glass text-accent-muted hover:text-accent'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((cert) => (
              <motion.div key={cert.id ?? cert._id} variants={scaleIn}>
                <CertCard cert={cert} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </SectionPanel>
  )
}

function CertCard({ cert }) {
  const { ref, rotateX, rotateY, glareBg, onMouseMove, onMouseLeave } = useTilt(9)

  return (
    <div style={{ perspective: 900 }}>
      <motion.div
        ref={ref}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="relative glass rounded-xl p-4 sm:p-5 flex flex-col gap-3 h-full"
      >
        <div>
          <span className="text-xs text-accent-dim uppercase tracking-widest">{cert.category}</span>
          <h3 className="font-semibold text-accent mt-1">{cert.title}</h3>
          <p className="text-sm text-accent-muted">{cert.issuer}</p>
          <p className="text-xs text-accent-dim">{cert.date}</p>
        </div>
        {cert.file_url && (
          <a
            href={cert.file_url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-xs text-accent-muted hover:text-accent transition-colors mt-auto"
          >
            {cert.file_url.endsWith('.pdf') ? (
              <><Download size={14} /> Download PDF</>
            ) : (
              <><ExternalLink size={14} /> View Certificate</>
            )}
          </a>
        )}
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-xl z-10"
          style={{ background: glareBg }}
        />
      </motion.div>
    </div>
  )
}
