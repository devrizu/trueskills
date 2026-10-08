import { motion } from 'framer-motion'

interface CardProps {
  children: React.ReactNode
  hover?: boolean
  className?: string
  onClick?: () => void
}

export function Card({ children, hover = false, className = '', onClick }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
      className={`bg-surface rounded-card p-6 shadow-sm ${
        hover ? 'transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </motion.div>
  )
}
