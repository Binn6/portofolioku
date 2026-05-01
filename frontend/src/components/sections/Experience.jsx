import { motion } from 'framer-motion'
import { Briefcase, Users } from 'lucide-react'
import { fadeUp, staggerContainer } from '../../animations/variants'
import AnimatedSection from '../animations/AnimatedSection'
import SectionWrapper from '../layout/SectionWrapper'
import Container from '../layout/Container'
import SectionTitle from '../ui/SectionTitle'

export default function Experience({ experiences }) {
  return (
    <SectionWrapper id="experience" className="bg-surface/30">
      <Container>
        <AnimatedSection>
          <SectionTitle subtitle="Where I've worked and contributed">Experience</SectionTitle>
        </AnimatedSection>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="relative pl-6 border-l border-border space-y-10"
        >
          {(experiences || []).map((exp) => (
            <motion.div key={exp._id} variants={fadeUp} className="relative">
              <div className="absolute -left-[1.625rem] top-1 w-3 h-3 rounded-full bg-accent border-2 border-background" />
              <div className="flex items-center gap-2 mb-1">
                {exp.type === 'internship' ? (
                  <Briefcase size={14} className="text-accent-dim" />
                ) : (
                  <Users size={14} className="text-accent-dim" />
                )}
                <span className="text-xs text-accent-muted uppercase tracking-widest">
                  {exp.type}
                </span>
              </div>
              <h3 className="font-semibold text-accent text-lg">{exp.title}</h3>
              <p className="text-accent-muted text-sm mb-1">{exp.company}</p>
              <p className="text-xs text-accent-dim mb-3">
                {exp.start_date} — {exp.is_current ? 'Present' : exp.end_date}
              </p>
              <p className="text-sm text-accent-muted leading-relaxed">{exp.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </SectionWrapper>
  )
}
