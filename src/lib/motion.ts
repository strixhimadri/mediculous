export const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const } },
}

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}
