export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
}

export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } },
}

export const slideInLeft = {
  hidden: { opacity: 0, x: -32 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export const flipIn3D = {
  hidden: { opacity: 0, rotateX: -35, y: 18 },
  visible: { opacity: 1, rotateX: 0, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
}

export const depth3D = {
  hidden: { opacity: 0, rotateX: -18, y: 28, scale: 0.97 },
  visible: { opacity: 1, rotateX: 0, y: 0, scale: 1, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
}
