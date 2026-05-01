import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, Download } from 'lucide-react'
import { staggerContainer, scaleIn } from '../../animations/variants'
import AnimatedSection from '../animations/AnimatedSection'
import SectionWrapper from '../layout/SectionWrapper'
import Container from '../layout/Container'
import SectionTitle from '../ui/SectionTitle'

export default function Certificates({ certificates }) {
  const [filter, setFilter] = useState('All')
  const filtered = filter === 'All'
    ? certificates || []
    : (certificates || []).filter((c) => c.category === filter)

  return (
    <SectionWrapper id="certificates" className="bg-surface/30">
      <Container>
        <AnimatedSection>
          <SectionTitle subtitle="Courses and certifications I've completed">Certificates</SectionTitle>
        </AnimatedSection>
        <div className="flex gap-2 mb-10">
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
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((cert) => (
              <motion.div
                key={cert._id}
                variants={scaleIn}
                className="glass rounded-xl p-5 flex flex-col gap-3"
              >
                <div>
                  <span className="text-xs text-accent-dim uppercase tracking-widest">
                    {cert.category}
                  </span>
                  <h3 className="font-semibold text-accent mt-1">{cert.title}</h3>
                  <p className="text-sm text-accent-muted">{cert.issuer}</p>
                  <p className="text-xs text-accent-dim">{cert.date}</p>
                </div>
                {cert.file_url && (
                  <a
                    href={cert.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-xs text-accent-muted hover:text-accent transition-colors"
                  >
                    {cert.file_url.endsWith('.pdf') ? (
                      <><Download size={14} /> Download PDF</>
                    ) : (
                      <><ExternalLink size={14} /> View Certificate</>
                    )}
                  </a>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </Container>
    </SectionWrapper>
  )
}
