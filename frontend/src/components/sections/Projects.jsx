import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Code2, ExternalLink, X, Download } from 'lucide-react'
import { staggerContainer } from '../../animations/variants'
import { useTilt } from '../ui/Tilt3D'
import AnimatedSection from '../animations/AnimatedSection'
import SectionWrapper from '../layout/SectionWrapper'
import Container from '../layout/Container'
import SectionTitle from '../ui/SectionTitle'

const PROJECT_TYPES = ['All', 'Website', 'Data Analysis']
const ensureUrl = (url) => url && (/^https?:\/\//.test(url) ? url : `https://${url}`)
const getId = (p) => p.id ?? p._id

const WEBSITE_TAGS = new Set([
  'react', 'vue', 'angular', 'next.js', 'nextjs', 'nuxt', 'svelte',
  'html', 'css', 'javascript', 'js', 'typescript', 'ts',
  'php', 'laravel', 'django', 'flask', 'express', 'node.js', 'nodejs',
  'tailwind', 'tailwindcss', 'bootstrap', 'jquery', 'vite', 'webpack',
  'wordpress', 'ruby', 'rails', 'asp.net',
])

const DATA_TAGS = new Set([
  'python', 'r', 'pandas', 'numpy', 'matplotlib', 'seaborn', 'plotly',
  'scikit-learn', 'sklearn', 'tensorflow', 'keras', 'pytorch',
  'jupyter', 'sql', 'mysql', 'postgresql', 'postgres',
  'excel', 'power bi', 'powerbi', 'tableau', 'spss', 'stata', 'sas',
  'hadoop', 'spark', 'bigquery', 'snowflake', 'dbt',
])

const matchesFilter = (project, filter) => {
  if (filter === 'All') return true
  const stack = (project.tech_stack || []).map((t) => t.toLowerCase().trim())
  if (filter === 'Website') return stack.filter((t) => WEBSITE_TAGS.has(t)).length >= 2
  if (filter === 'Data Analysis') return stack.filter((t) => DATA_TAGS.has(t)).length >= 2
  return true
}

export default function Projects({ projects }) {
  const [filter, setFilter] = useState('All')
  const [selectedProject, setSelectedProject] = useState(null)

  const sorted = [...(projects || [])].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
  const filtered = sorted.filter((p) => matchesFilter(p, filter))

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

        {(projects?.length > 0) && (
          <div className="flex flex-wrap gap-2 mb-10">
            {PROJECT_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                  filter === type ? 'bg-accent text-background' : 'glass text-accent-muted hover:text-accent'
                }`}
              >
                {type}
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
          {filtered.map((project) => (
            <div key={getId(project)} className="min-h-[200px]">
              {(!selectedProject || getId(selectedProject) !== getId(project)) && (
                <ProjectCard project={project} onSelect={setSelectedProject} />
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
              key={getId(selectedProject)}
              layoutId={`card-${getId(selectedProject)}`}
              className="fixed inset-0 m-auto z-[60] bg-surface rounded-2xl overflow-hidden flex flex-col md:flex-row"
              style={{ width: 'min(92vw, 780px)', maxHeight: '82vh', height: 'fit-content' }}
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
                    <span key={tech} className="text-xs px-2 py-1 rounded bg-surface-2 text-accent-muted border border-surface-2">
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  {selectedProject.live_url && (
                    <a href={ensureUrl(selectedProject.live_url)} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-background text-sm font-medium hover:opacity-90 transition-opacity">
                      <ExternalLink size={14} /> View Website
                    </a>
                  )}
                  {selectedProject.github_url && (
                    <a href={ensureUrl(selectedProject.github_url)} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg glass text-accent text-sm font-medium">
                      <Code2 size={14} /> Source Code
                    </a>
                  )}
                  {selectedProject.pdf_url && (
                    <a href={selectedProject.pdf_url} download
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg glass text-accent text-sm font-medium">
                      <Download size={14} /> Download PDF
                    </a>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSelectedProject(null)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-surface-2 text-accent-muted hover:text-accent transition-colors z-10"
                aria-label="Close"
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

function ProjectCard({ project, onSelect }) {
  const id = getId(project)
  const { ref, rotateX, rotateY, glareBg, onMouseMove, onMouseLeave } = useTilt(8)

  return (
    <div style={{ perspective: 900 }} className="h-full">
      <motion.div
        ref={ref}
        layoutId={`card-${id}`}
        onClick={() => onSelect(project)}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="relative glass rounded-xl p-5 cursor-pointer h-full border border-surface-2 hover:border-accent-dim transition-colors"
      >
        {project.thumbnail_url && (
          <div className="rounded-lg overflow-hidden mb-4 aspect-video bg-surface-2">
            <img src={project.thumbnail_url} alt={project.title} className="w-full h-full object-cover" />
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
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-xl z-10"
          style={{ background: glareBg }}
        />
      </motion.div>
    </div>
  )
}
