import { useRef } from 'react'
import { MapPin, Mail, Phone } from 'lucide-react'
import { motion } from 'framer-motion'
import AnimatedSection from '../animations/AnimatedSection'
import SectionPanel from '../layout/SectionPanel'
import SectionTitle from '../ui/SectionTitle'
import { useTilt } from '../ui/Tilt3D'
import { useParallax } from '../../hooks/useParallax'

function IconGithub() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}

function IconLinkedin() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  )
}

const ensureUrl = (url) => url && (/^https?:\/\//.test(url) ? url : `https://${url}`)

const socialLinks = (profile) => [
  { icon: IconGithub,    href: ensureUrl(profile?.github),    label: 'GitHub',    show: !!profile?.github },
  { icon: IconLinkedin,  href: ensureUrl(profile?.linkedin),  label: 'LinkedIn',  show: !!profile?.linkedin },
  { icon: IconInstagram, href: ensureUrl(profile?.instagram), label: 'Instagram', show: !!profile?.instagram },
]

export default function About({ profile }) {
  const links = socialLinks(profile).filter((l) => l.show)
  const cardRef = useRef(null)
  useParallax(cardRef, { yOffset: 30 })

  return (
    <SectionPanel id="about" index={0}>
      <div className="max-w-6xl mx-auto px-6 py-16 flex flex-col">
        <AnimatedSection>
          <SectionTitle subtitle="A bit about me">About</SectionTitle>
        </AnimatedSection>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
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
          </div>

          <div ref={cardRef} className="order-1 md:order-2">
            <AnimatedSection>
              <ProfileCard profile={profile} links={links} />
            </AnimatedSection>
          </div>
        </div>
      </div>
    </SectionPanel>
  )
}

function OrbitalRing({ rotateX, duration, radius = '115%' }) {
  return (
    <motion.div
      className="absolute rounded-full border border-accent/[0.07] pointer-events-none"
      style={{
        width: radius, height: radius,
        top: '50%', left: '50%',
        marginTop: `-${parseFloat(radius) / 2}%`,
        marginLeft: `-${parseFloat(radius) / 2}%`,
        rotateX,
        transformStyle: 'preserve-3d',
      }}
      animate={{ rotateZ: 360 }}
      transition={{ duration, repeat: Infinity, ease: 'linear' }}
    />
  )
}

function ProfileCard({ profile, links }) {
  const isTouch = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches
  const { ref, rotateX, rotateY, glareBg, onMouseMove, onMouseLeave } = useTilt(10)

  return (
    <div className="relative flex items-center justify-center overflow-hidden rounded-3xl py-10" style={{ perspective: 900 }}>
      <OrbitalRing rotateX="70deg" duration={14} radius="130%" />
      <OrbitalRing rotateX="50deg" duration={20} radius="148%" />
      <OrbitalRing rotateX="80deg" duration={9}  radius="116%" />

      <motion.div
        ref={ref}
        onMouseMove={isTouch ? undefined : onMouseMove}
        onMouseLeave={isTouch ? undefined : onMouseLeave}
        style={isTouch ? {} : { rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="glass rounded-2xl overflow-hidden max-w-sm w-full relative"
      >
        <div className="relative aspect-square bg-surface-2">
          {profile?.photo_url ? (
            <img
              src={profile.photo_url}
              alt={profile?.name || 'Profile'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-accent-muted text-6xl font-display font-bold select-none">
              {profile?.name?.charAt(0) || 'M'}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
        </div>

        <div className="px-6 py-5">
          <h3 className="font-display text-xl font-bold text-accent mb-1">
            {profile?.name || 'Mochsabil Em Abyan'}
          </h3>
          <p className="text-accent-muted text-sm mb-5">
            {profile?.title || 'Data Analyst & Web Developer'}
          </p>
          {links.length > 0 && (
            <div className="flex gap-3">
              {links.map(({ icon: Icon, href, label }) => (
                <motion.a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  whileHover={{ scale: 1.15, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface-2 text-accent-muted hover:text-accent hover:bg-accent-dim transition-colors"
                >
                  <Icon />
                </motion.a>
              ))}
            </div>
          )}
        </div>

        {!isTouch && (
          <motion.div
            className="absolute inset-0 pointer-events-none rounded-[inherit] z-10"
            style={{ background: glareBg }}
          />
        )}
      </motion.div>
    </div>
  )
}
