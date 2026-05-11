import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'

const links = [
  { id: 'about',        label: 'About' },
  { id: 'skills',       label: 'Skills' },
  { id: 'projects',     label: 'Projects' },
  { id: 'experience',   label: 'Experience' },
  { id: 'education',    label: 'Education' },
  { id: 'certificates', label: 'Certificates' },
  { id: 'contact',      label: 'Contact' },
]


export default function Navbar() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  const goTo = (id) => {
    navigate('/' + id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60)
      setOpen(false)
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      {/* Desktop floating pill */}
      <motion.div
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5, ease: 'easeOut' }}
        className="fixed top-5 z-50 hidden md:block"
        style={{ left: '50%', translateX: '-50%' }}
      >
        <div
          className={`flex items-center gap-1 pl-5 pr-2 py-2 rounded-full border transition-all duration-300 ${
            scrolled
              ? 'bg-background/85 backdrop-blur-md border-border shadow-2xl shadow-black/30'
              : 'bg-background/30 backdrop-blur-sm border-white/10'
          }`}
        >
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="font-display text-sm font-bold text-accent mr-4 shrink-0"
          >
            MA
          </button>
          <nav className="flex items-center">
            {links.map((l) => (
              <button
                key={l.id}
                onClick={() => goTo(l.id)}
                className="text-xs text-accent-muted hover:text-accent transition-colors px-3 py-1.5 rounded-full hover:bg-surface-2"
              >
                {l.label}
              </button>
            ))}
          </nav>
        </div>
      </motion.div>

      {/* Mobile: floating hamburger button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="fixed top-5 right-5 z-50 md:hidden"
      >
        <button
          onClick={() => setOpen(!open)}
          className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-accent-muted hover:text-accent shadow-lg"
          aria-label="Toggle menu"
        >
          <AnimatePresence mode="wait">
            {open
              ? <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X size={16} /></motion.span>
              : <motion.span key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Menu size={16} /></motion.span>
            }
          </AnimatePresence>
        </button>
      </motion.div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="fixed top-16 right-5 z-50 md:hidden bg-surface/95 backdrop-blur-md border border-border rounded-2xl shadow-2xl overflow-hidden min-w-[160px]"
          >
            <nav className="flex flex-col py-2">
              {links.map((l) => (
                <button
                  key={l.id}
                  onClick={() => { goTo(l.id); setOpen(false) }}
                  className="px-5 py-3 text-sm text-accent-muted hover:text-accent hover:bg-surface-2 transition-colors text-left w-full"
                >
                  {l.label}
                </button>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
