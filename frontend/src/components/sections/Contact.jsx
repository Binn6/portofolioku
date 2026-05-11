import { useState } from 'react'
import { Send, Code2, Briefcase, Mail } from 'lucide-react'
import { motion } from 'framer-motion'
import { postContact } from '../../services/api'
import AnimatedSection from '../animations/AnimatedSection'
import SectionWrapper from '../layout/SectionWrapper'
import Container from '../layout/Container'
import SectionTitle from '../ui/SectionTitle'
import MotionButton from '../ui/MotionButton'
import WireframeCube from '../ui/WireframeCube'
import Tilt3D from '../ui/Tilt3D'

const ensureUrl = (url) => url && (/^https?:\/\//.test(url) ? url : `https://${url}`)

export default function Contact({ profile }) {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await postContact(form)
      setStatus('success')
      setForm({ name: '', email: '', message: '' })
    } catch {
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-sm text-accent placeholder-accent-dim focus:outline-none focus:border-accent-muted transition-colors'

  return (
    <SectionWrapper id="contact">
      <Container>
        <AnimatedSection>
          <SectionTitle subtitle="Let's work together">Get in Touch</SectionTitle>
        </AnimatedSection>
        <div className="grid md:grid-cols-2 gap-10 md:gap-16">
          <AnimatedSection>
            <p className="text-accent-muted mb-8">
              I'm open to new opportunities in data analytics and web development. Feel free to reach out!
            </p>
            <div className="flex flex-col gap-4 mb-10">
              {profile?.email && (
                <a href={`mailto:${profile.email}`} className="flex items-center gap-3 text-accent-muted hover:text-accent transition-colors text-sm">
                  <Mail size={16} /> {profile.email}
                </a>
              )}
              {profile?.github && (
                <a href={ensureUrl(profile.github)} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-accent-muted hover:text-accent transition-colors text-sm">
                  <Code2 size={16} /> GitHub
                </a>
              )}
              {profile?.linkedin && (
                <a href={ensureUrl(profile.linkedin)} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-accent-muted hover:text-accent transition-colors text-sm">
                  <Briefcase size={16} /> LinkedIn
                </a>
              )}
            </div>

            {/* Rotating 3D wireframe decorations */}
            <div className="flex items-end gap-6 opacity-60">
              <motion.div
                animate={{ rotateY: 360 }}
                transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
              >
                <WireframeCube size={100} opacity={0.35} />
              </motion.div>
              <motion.div
                animate={{ rotateY: -360, rotateX: 180 }}
                transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
              >
                <WireframeCube size={66} opacity={0.25} />
              </motion.div>
            </div>
          </AnimatedSection>

          <AnimatedSection>
            <Tilt3D intensity={5} perspective={1200} className="rounded-2xl">
              <div className="glass rounded-2xl p-6 md:p-8">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <input
                    className={inputClass}
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                  <input
                    type="email"
                    className={inputClass}
                    placeholder="Your email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                  <textarea
                    className={`${inputClass} resize-none h-36`}
                    placeholder="Your message"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    required
                  />
                  {status === 'success' && (
                    <p className="text-sm text-green-400">Message sent! I'll get back to you soon.</p>
                  )}
                  {status === 'error' && (
                    <p className="text-sm text-red-400">Something went wrong. Please try again.</p>
                  )}
                  <MotionButton variant="primary" disabled={loading}>
                    <Send size={16} />
                    {loading ? 'Sending...' : 'Send Message'}
                  </MotionButton>
                </form>
              </div>
            </Tilt3D>
          </AnimatedSection>
        </div>
      </Container>
    </SectionWrapper>
  )
}
