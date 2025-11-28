'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { forwardRef } from 'react'

interface IconButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  icon: IconDefinition
  label: string
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  iconPosition?: 'left' | 'right'
  showLabel?: boolean
  gradient?: string
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      label,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      iconPosition = 'left',
      showLabel = true,
      gradient,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-6 py-4 text-lg',
    }

    const variantClasses = {
      primary: gradient
        ? `bg-gradient-to-r ${gradient}`
        : 'bg-gradient-to-r from-cyan-400 via-purple-500 to-green-400',
      secondary: 'bg-white/10 hover:bg-white/20 border border-white/20',
      ghost: 'bg-transparent hover:bg-white/5',
      danger: 'bg-gradient-to-r from-red-500 to-pink-500',
      success: 'bg-gradient-to-r from-green-400 to-emerald-500',
    }

    const iconSizes = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-xl',
    }

    return (
      <motion.button
        ref={ref}
        className={`
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${showLabel ? 'flex items-center gap-2' : 'flex items-center justify-center'}
          font-semibold text-white rounded-xl
          shadow-lg border border-white/20 backdrop-blur-sm
          transition-all duration-300
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        disabled={disabled || isLoading}
        whileHover={!disabled && !isLoading ? { scale: 1.02, y: -2 } : {}}
        whileTap={!disabled && !isLoading ? { scale: 0.98 } : {}}
        aria-label={label}
        {...props}
      >
        {isLoading ? (
          <motion.div
            className={`${iconSizes[size]} border-2 border-white/30 border-t-white rounded-full`}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{ width: '1em', height: '1em' }}
          />
        ) : (
          <>
            {iconPosition === 'left' && (
              <FontAwesomeIcon icon={icon} className={iconSizes[size]} />
            )}
            {showLabel && <span>{label}</span>}
            {iconPosition === 'right' && (
              <FontAwesomeIcon icon={icon} className={iconSizes[size]} />
            )}
          </>
        )}
      </motion.button>
    )
  }
)

IconButton.displayName = 'IconButton'

export default IconButton

