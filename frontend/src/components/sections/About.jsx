import { MapPin, Mail, Phone } from 'lucide-react'
import AnimatedSection from '../animations/AnimatedSection'
import SectionWrapper from '../layout/SectionWrapper'
import Container from '../layout/Container'
import SectionTitle from '../ui/SectionTitle'

export default function About({ profile }) {
  return (
    <SectionWrapper id="about">
      <Container>
        <AnimatedSection>
          <SectionTitle subtitle="A bit about me">About</SectionTitle>
        </AnimatedSection>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <AnimatedSection>
            <p className="text-accent-muted leading-relaxed text-lg mb-6">
              {profile?.bio}
            </p>
            <div className="flex flex-col gap-3">
              {profile?.location && (
                <div className="flex items-center gap-3 text-accent-muted text-sm">
                  <MapPin size={16} className="text-accent-dim shrink-0" />
                  {profile.location}
                </div>
              )}
              {profile?.email && (
                <div className="flex items-center gap-3 text-accent-muted text-sm">
                  <Mail size={16} className="text-accent-dim shrink-0" />
                  {profile.email}
                </div>
              )}
              {profile?.phone && (
                <div className="flex items-center gap-3 text-accent-muted text-sm">
                  <Phone size={16} className="text-accent-dim shrink-0" />
                  {profile.phone}
                </div>
              )}
            </div>
          </AnimatedSection>
          <AnimatedSection>
            <div className="glass rounded-2xl overflow-hidden aspect-square max-w-sm mx-auto">
              <img
                src="/profile.jpg"
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            </div>
          </AnimatedSection>
        </div>
      </Container>
    </SectionWrapper>
  )
}
