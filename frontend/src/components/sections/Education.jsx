import { GraduationCap } from 'lucide-react'
import AnimatedSection from '../animations/AnimatedSection'
import SectionWrapper from '../layout/SectionWrapper'
import Container from '../layout/Container'
import SectionTitle from '../ui/SectionTitle'
import GlassCard from '../ui/GlassCard'

export default function Education({ education }) {
  return (
    <SectionWrapper id="education">
      <Container>
        <AnimatedSection>
          <SectionTitle subtitle="My academic background">Education</SectionTitle>
        </AnimatedSection>
        <div className="max-w-2xl">
          {(education || []).map((edu) => (
            <GlassCard key={edu._id}>
              <div className="flex gap-4">
                <div className="p-2 rounded-lg bg-surface-2 shrink-0">
                  <GraduationCap size={20} className="text-accent-muted" />
                </div>
                <div>
                  <h3 className="font-semibold text-accent text-lg">{edu.institution}</h3>
                  <p className="text-accent-muted text-sm mb-1">
                    {edu.degree} — {edu.field}
                  </p>
                  <p className="text-xs text-accent-dim mb-3">
                    {edu.start_year} — {edu.end_year || 'Present'}
                  </p>
                  {edu.description && (
                    <p className="text-sm text-accent-muted leading-relaxed">{edu.description}</p>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </Container>
    </SectionWrapper>
  )
}
