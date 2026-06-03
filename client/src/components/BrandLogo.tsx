import { useState } from 'react'
import { Leaf, Droplets } from 'lucide-react'

const LOGO_PATHS = [
  '/branding/RealHJPlogo.jpeg',
  '/branding/logo.png',
  '/branding/logo.svg',
  '/branding/logo.jpg',
  '/branding/logo.webp',
]

type LogoSize = 'sm' | 'header' | 'md' | 'lg' | 'hero'

const sizeClasses: Record<LogoSize, string> = {
  sm: 'h-8 w-auto max-w-[100px]',
  header: 'h-9 w-10 object-contain',
  md: 'h-12 w-auto max-w-[160px]',
  lg: 'h-28 w-auto max-w-[320px]',
  hero: 'w-full max-w-[min(92vw,28rem)] h-auto max-h-[min(42vh,260px)] object-contain',
}

const iconSizes: Record<LogoSize, { leaf: number; drop: number }> = {
  sm: { leaf: 18, drop: 14 },
  header: { leaf: 24, drop: 20 },
  md: { leaf: 22, drop: 18 },
  lg: { leaf: 32, drop: 28 },
  hero: { leaf: 40, drop: 34 },
}

interface BrandLogoProps {
  size?: LogoSize
  className?: string
}

/** Logo sized for dark dashboard headers — white panel keeps the mark readable. */
export function HeaderLogo({
  className = '',
  compact = false,
}: {
  className?: string
  /** Smaller mark for dense owner sub-page headers on mobile */
  compact?: boolean
}) {
  const box = compact
    ? 'h-11 w-14 sm:h-12 sm:w-[4.25rem]'
    : 'h-[3.75rem] w-[4.5rem] sm:h-16 sm:w-24'
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg ring-2 ring-white/50 ${box} ${className}`}
    >
      <BrandLogo size="header" className={compact ? '!max-h-10 !max-w-[3.25rem] sm:!max-h-11 sm:!max-w-14' : ''} />
    </div>
  )
}

export default function BrandLogo({ size = 'md', className = '' }: BrandLogoProps) {
  const [pathIndex, setPathIndex] = useState(0)
  const [useFallback, setUseFallback] = useState(false)

  if (useFallback || pathIndex >= LOGO_PATHS.length) {
    const icons = iconSizes[size]
    return (
      <div className={`flex items-center gap-1 shrink-0 ${className}`} aria-hidden>
        <Leaf size={icons.leaf} className="text-green-300" />
        <Droplets size={icons.drop} className="text-emerald-300" />
      </div>
    )
  }

  return (
    <img
      src={LOGO_PATHS[pathIndex]}
      alt="Real Health Juice Parlour"
      decoding="async"
      className={`${sizeClasses[size]} object-contain shrink-0 ${className}`}
      onError={() => {
        if (pathIndex + 1 < LOGO_PATHS.length) {
          setPathIndex(pathIndex + 1)
        } else {
          setUseFallback(true)
        }
      }}
    />
  )
}
