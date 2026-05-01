import { useState, useEffect } from 'react'
import { getProfile, getSkills, getProjects, getExperiences, getEducation, getCertificates } from '../services/api'
import SplashScreen from '../components/animations/SplashScreen'
import ScrollProgressBar from '../components/animations/ScrollProgressBar'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import Hero from '../components/sections/Hero'
import About from '../components/sections/About'
import Skills from '../components/sections/Skills'
import Projects from '../components/sections/Projects'
import Experience from '../components/sections/Experience'
import Education from '../components/sections/Education'
import Certificates from '../components/sections/Certificates'
import Contact from '../components/sections/Contact'

export default function Portfolio() {
  const [data, setData] = useState({})
  const [ready, setReady] = useState(false)
  const [splashDone, setSplashDone] = useState(false)
  const [showSplash, setShowSplash] = useState(false)

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
    <>
      <ScrollProgressBar />
      <Navbar />
      <main>
        <Hero profile={data.profile} />
        <About profile={data.profile} />
        <Skills skills={data.skills} />
        <Projects projects={data.projects} />
        <Experience experiences={data.experiences} />
        <Education education={data.education} />
        <Certificates certificates={data.certificates} />
        <Contact profile={data.profile} />
      </main>
      <Footer profile={data.profile} />
    </>
  )
}
