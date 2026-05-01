import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Code2, ExternalLink } from 'lucide-react'
import { staggerContainer, scaleIn } from '../../animations/variants'
import AnimatedSection from '../animations/AnimatedSection'
import SectionWrapper from '../layout/SectionWrapper'
import Container from '../layout/Container'
import SectionTitle from '../ui/SectionTitle'
import GlassCard from '../ui/GlassCard'

export default function Projects({ projects }) {
  const [filter, setFilter] = useState('All')
  const tags = ['All', ...new Set((projects || []).flatMap((p) => p.tech_stack || []))]
  const filtered = filter === 'All'
    ? projects || []
    : (projects || []).filter((p) => p.tech_stack?.includes(filter))

  return (
    <SectionWrapper id="projects">
      <Container>
        <AnimatedSection>
          <SectionTitle subtitle="Things I've built">Projects</SectionTitle>
        </AnimatedSection>
        <div className="flex flex-wrap gap-2 mb-10">
          {tags.slice(0, 8).map((tag) => (
            <button
              key={tag}
              onClick={() => setFilter(tag)}
              className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                filter === tag
                  ? 'bg-accent text-background'
                  : 'glass text-accent-muted hover:text-accent'
              }`}
            >
              {tag}
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
            {filtered.map((project) => (
              <GlassCard key={project._id} hover>
                {project.thumbnail_url && (
                  <div className="rounded-lg overflow-hidden mb-4 aspect-video bg-surface-2">
                    <img src={project.thumbnail_url} alt={project.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <h3 className="font-semibold text-accent mb-2">{project.title}</h3>
                <p className="text-sm text-accent-muted mb-4 line-clamp-3">{project.description}</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {(project.tech_stack || []).map((tech) => (
                    <span key={tech} className="text-xs px-2 py-0.5 rounded bg-surface-2 text-accent-muted">
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="flex gap-3">
                  {project.github_url && (
                    <a href={project.github_url} target="_blank" rel="noreferrer" className="text-accent-muted hover:text-accent">
                      <Code2 size={16} />
                    </a>
                  )}
                  {project.live_url && (
                    <a href={project.live_url} target="_blank" rel="noreferrer" className="text-accent-muted hover:text-accent">
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              </GlassCard>
            ))}
          </AnimatePresence>
        </motion.div>
      </Container>
    </SectionWrapper>
  )
}
