import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { getProfile, getSkills, getProjects, getExperiences, getEducation, getCertificates } from '../services/api'
import SplashScreen from '../components/animations/SplashScreen'
import ScrollProgressBar from '../components/animations/ScrollProgressBar'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import Hero from '../components/sections/Hero'
import Ticker from '../components/ui/Ticker'
import About from '../components/sections/About'
import Skills from '../components/sections/Skills'
import Projects from '../components/sections/Projects'
import Experience from '../components/sections/Experience'
import Education from '../components/sections/Education'
import Certificates from '../components/sections/Certificates'
import Contact from '../components/sections/Contact'

export default function Portfolio() {
  const { section } = useParams()
  const [data, setData] = useState({})
  const [ready, setReady] = useState(false)
  const [splashDone, setSplashDone] = useState(false)
  const [showSplash, setShowSplash] = useState(false)
  const [copyAlert, setCopyAlert] = useState(false)
  const alertTimer = useRef(null)

  useEffect(() => {
    const showAlert = () => {
      clearTimeout(alertTimer.current)
      setCopyAlert(true)
      alertTimer.current = setTimeout(() => setCopyAlert(false), 2000)
    }

    const prevent = (e) => { e.preventDefault(); showAlert() }
    const preventContext = (e) => { e.preventDefault() }

    document.addEventListener('copy', prevent)
    document.addEventListener('cut', prevent)
    document.addEventListener('contextmenu', preventContext)

    return () => {
      document.removeEventListener('copy', prevent)
      document.removeEventListener('cut', prevent)
      document.removeEventListener('contextmenu', preventContext)
      clearTimeout(alertTimer.current)
    }
  }, [])

  useEffect(() => {
    const startTime = Date.now()

    Promise.all([
      getProfile(),
      getSkills(),
      getProjects(),
      getExperiences(),
      getEducation(),
      getCertificates(),
    ]).then(([profile, skills, projects, experiences, education, certificates]) => {
      setData({
        profile: profile.data,
        skills: skills.data,
        projects: projects.data,
        experiences: experiences.data,
        education: education.data,
        certificates: certificates.data,
      })
      const elapsed = Date.now() - startTime
      if (elapsed > 300) setShowSplash(true)
      setReady(true)
    }).catch(() => setReady(true))
  }, [])

  useEffect(() => {
    if (ready && section) {
      setTimeout(() => {
        document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' })
      }, 300)
    }
  }, [ready, section])

  if (!ready || (showSplash && !splashDone)) {
    if (showSplash) {
      return (
        <>
          {ready && <SplashScreen onComplete={() => setSplashDone(true)} />}
        </>
      )
    }
    return null
  }

  return (
    <div className="select-none">
      <ScrollProgressBar />
      <Navbar />
      <main>
        <Hero profile={data.profile} />
        <Ticker />
        <About profile={data.profile} />
        <Skills skills={data.skills} />
        <Projects projects={data.projects} />
        <Experience experiences={data.experiences} />
        <Education education={data.education} />
        <Certificates certificates={data.certificates} />
        <Contact profile={data.profile} />
      </main>
      <Footer profile={data.profile} />

      {/* Copy prevention toast */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] px-5 py-3 rounded-xl bg-surface border border-border text-sm text-accent-muted shadow-2xl transition-all duration-300 pointer-events-none whitespace-nowrap ${
          copyAlert ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        Konten ini dilindungi — tidak dapat disalin
      </div>
    </div>
  )
}
