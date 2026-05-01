import { Code2, Briefcase, Mail } from 'lucide-react'
import Container from './Container'

export default function Footer({ profile }) {
  return (
    <footer className="border-t border-border py-12">
      <Container className="flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="text-sm text-accent-muted">
          © {new Date().getFullYear()} Mochsabil Em Abyan
        </p>
        <div className="flex items-center gap-4">
          {profile?.github && (
            <a href={profile.github} target="_blank" rel="noreferrer" className="text-accent-muted hover:text-accent transition-colors">
              <Code2 size={18} />
            </a>
          )}
          {profile?.linkedin && (
            <a href={profile.linkedin} target="_blank" rel="noreferrer" className="text-accent-muted hover:text-accent transition-colors">
              <Briefcase size={18} />
            </a>
          )}
          {profile?.email && (
            <a href={`mailto:${profile.email}`} className="text-accent-muted hover:text-accent transition-colors">
              <Mail size={18} />
            </a>
          )}
        </div>
      </Container>
    </footer>
  )
}
