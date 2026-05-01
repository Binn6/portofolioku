import { motion } from 'framer-motion'
import { staggerContainer, fadeUp } from '../../animations/variants'
import AnimatedSection from '../animations/AnimatedSection'
import SectionWrapper from '../layout/SectionWrapper'
import Container from '../layout/Container'
import SectionTitle from '../ui/SectionTitle'

const CATEGORIES = ['Languages', 'Frameworks', 'Data', 'Tools', 'Soft Skills']

const levelLabel = (level) => ['', 'Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'][level]

export default function Skills({ skills }) {
  const grouped = CATEGORIES.reduce((acc, cat) => {
    const filtered = (skills || []).filter((s) => s.category === cat)
    if (filtered.length) acc[cat] = filtered
    return acc
  }, {})

  return (
    <SectionWrapper id="skills" className="bg-surface/30">
      <Container>
        <AnimatedSection>
          <SectionTitle subtitle="Technologies and tools I work with">Skills</SectionTitle>
        </AnimatedSection>
        <div className="space-y-10">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <h3 className="text-sm font-medium text-accent-muted uppercase tracking-widest mb-4">{cat}</h3>
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="flex flex-wrap gap-3"
              >
                {items.map((skill) => (
                  <motion.div
                    key={skill._id}
                    variants={fadeUp}
                    className="glass rounded-lg px-4 py-2.5 flex items-center gap-3"
                  >
                    <span className="text-sm text-accent">{skill.name}</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${i < skill.level ? 'bg-accent' : 'bg-accent-dim'}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-accent-muted">{levelLabel(skill.level)}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          ))}
        </div>
      </Container>
    </SectionWrapper>
  )
}
