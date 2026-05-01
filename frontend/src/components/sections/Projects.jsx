import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Code2, ExternalLink, X, Download } from 'lucide-react'
import { staggerContainer } from '../../animations/variants'
import AnimatedSection from '../animations/AnimatedSection'
import SectionWrapper from '../layout/SectionWrapper'
import Container from '../layout/Container'
import SectionTitle from '../ui/SectionTitle'

export default function Projects({ projects }) {
  const [filter, setFilter] = useState('All')
  const [selectedProject, setSelectedProject] = useState(null)

  const tags = ['All', ...new Set((projects || []).flatMap((p) => p.tech_stack || []))]
  const filtered =
    filter === 'All'
      ? projects || []
      : (projects || []).filter((p) => p.tech_stack?.includes(filter))

  useEffect(() => {
    document.body.style.overflow = selectedProject ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [selectedProject])

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') setSelectedProject(null) }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

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
          {filtered.map((project) => (
            <div key={project._id} className="min-h-[200px]">
              {selectedProject?._id !== project._id && (
                <motion.div
                  layoutId={`card-${project._id}`}
                  onClick={() => setSelectedProject(project)}
                  className="glass rounded-xl p-5 cursor-pointer h-full border border-surface-2 hover:border-accent-dim transition-colors"
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                >
                  {project.thumbnail_url && (
                    <div className="rounded-lg overflow-hidden mb-4 aspect-video bg-surface-2">
                      <img
                        src={project.thumbnail_url}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <h3 className="font-semibold text-accent mb-2">{project.title}</h3>
                  <p className="text-sm text-accent-muted mb-4 line-clamp-3">{project.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(project.tech_stack || []).map((tech) => (
                      <span key={tech} className="text-xs px-2 py-0.5 rounded bg-surface-2 text-accent-muted">
                        {tech}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          ))}
        </motion.div>
      </Container>

      <AnimatePresence>
        {selectedProject && (
          <>
            <motion.div
              key="modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              onClick={() => setSelectedProject(null)}
            />
            <motion.div
              key={selectedProject._id}
              layoutId={`card-${selectedProject._id}`}
              className="fixed inset-4 md:inset-8 z-[60] bg-surface rounded-2xl overflow-hidden flex flex-col md:flex-row"
            >
              <div className="md:w-[40%] bg-background flex-shrink-0">
                {selectedProject.thumbnail_url ? (
                  <img
                    src={selectedProject.thumbnail_url}
                    alt={selectedProject.title}
                    className="w-full h-52 md:h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-52 md:h-full flex items-center justify-center bg-surface-2">
                    <Code2 size={48} className="text-accent-muted opacity-20" />
                  </div>
                )}
              </div>

              <div className="md:w-[60%] p-6 md:p-10 overflow-y-auto">
                <h2 className="font-display text-2xl font-bold text-accent mb-3">
                  {selectedProject.title}
                </h2>
                <p className="text-accent-muted text-sm leading-relaxed mb-6">
                  {selectedProject.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-8">
                  {(selectedProject.tech_stack || []).map((tech) => (
                    <span
                      key={tech}
                      className="text-xs px-2 py-1 rounded bg-surface-2 text-accent-muted border border-surface-2"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  {selectedProject.live_url && (
                    <a
                      href={selectedProject.live_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-background text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      <ExternalLink size={14} /> View Website
                    </a>
                  )}
                  {selectedProject.github_url && (
                    <a
                      href={selectedProject.github_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg glass text-accent text-sm font-medium"
                    >
                      <Code2 size={14} /> Source Code
                    </a>
                  )}
                  {selectedProject.pdf_url && (
                    <a
                      href={selectedProject.pdf_url}
                      download
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg glass text-accent text-sm font-medium"
                    >
                      <Download size={14} /> Download PDF
                    </a>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSelectedProject(null)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-surface-2 text-accent-muted hover:text-accent transition-colors z-10"
                aria-label="Close project modal"
              >
                <X size={16} />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </SectionWrapper>
  )
}
