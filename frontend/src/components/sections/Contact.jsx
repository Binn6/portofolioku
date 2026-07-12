import { useState, useRef, useEffect } from 'react'
import { Send, Code2, Briefcase, Mail, MessageCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { postContact } from '../../services/api'
import AnimatedSection from '../animations/AnimatedSection'
import SectionPanel from '../layout/SectionPanel'
import SectionTitle from '../ui/SectionTitle'
import MotionButton from '../ui/MotionButton'
import WireframeCube from '../ui/WireframeCube'
import Tilt3D from '../ui/Tilt3D'
import { gsap } from '../../animations/gsap'
import { prefersReducedMotion } from '../../animations/gsap'

const ensureUrl = (url) => url && (/^https?:\/\//.test(url) ? url : `https://${url}`)
const waUrl = (phone) => {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  const intl = digits.startsWith('0') ? '62' + digits.slice(1) : digits
  return `https://wa.me/${intl}`
}

export default function Contact({ profile }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const glowRef = useRef(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    if (!glowRef.current) return
    const tween = gsap.to(glowRef.current, {
      opacity: 0.12,
      scale: 1.15,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    })
    return () => tween.kill()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await postContact(form)
      navigate('/thank-you')
    } catch {
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-sm text-accent placeholder-accent-dim focus:outline-none focus:border-accent-muted transition-colors'

  return (
    <SectionPanel id="contact" index={6} isLast={true}>
      {/* Ambient glow behind content */}
      <div
        ref={glowRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(250,250,249,0.06) 0%, transparent 70%)',
          opacity: 0.06,
          zIndex: 0,
        }}
      />

      <div className="max-w-6xl mx-auto px-6 py-16 flex flex-col">
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
              {profile?.phone && (
                <a href={waUrl(profile.phone)} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-accent-muted hover:text-accent transition-colors text-sm">
                  <MessageCircle size={16} /> WhatsApp
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
      </div>
    </SectionPanel>
  )
}
