import { motion } from 'framer-motion'
import { CheckCircle, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Container from '../components/layout/Container'
import MotionButton from '../components/ui/MotionButton'

export default function ThankYou() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-32">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="max-w-md mx-auto text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 16 }}
              className="flex justify-center mb-6"
            >
              <CheckCircle size={64} className="text-accent" strokeWidth={1.5} />
            </motion.div>

            <h1 className="font-display text-3xl md:text-4xl font-bold text-accent mb-4">
              Thank You!
            </h1>

            <p className="text-accent-muted text-base mb-10 leading-relaxed">
              Your message has been received. I'll get back to you within 1–2 business days.
            </p>

            <MotionButton variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft size={16} />
              Back to Home
            </MotionButton>
          </motion.div>
        </Container>
      </main>
    </div>
  )
}
