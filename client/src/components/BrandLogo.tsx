import { useState } from 'react'
import { Leaf, Droplets } from 'lucide-react'

const LOGO_PATHS = [
  '/branding/RealHJPlogo.jpeg',
  '/branding/logo.png',
  '/branding/logo.svg',
  '/branding/logo.jpg',
  '/branding/logo.webp',
]

type LogoSize = 'sm' | 'md' | 'lg' | 'hero'

const sizeClasses: Record<LogoSize, string> = {
  sm: 'h-8 w-auto max-w-[120px]',
  md: 'h-12 w-auto max-w-[160px]',
  lg: 'h-28 w-auto max-w-[320px]',
  hero: 'w-full max-w-[min(92vw,28rem)] h-auto max-h-[min(42vh,260px)] object-contain',
}

const iconSizes: Record<LogoSize, { leaf: number; drop: number }> = {
  sm: { leaf: 18, drop: 14 },
  md: { leaf: 22, drop: 18 },
  lg: { leaf: 32, drop: 28 },
  hero: { leaf: 40, drop: 34 },
}

interface BrandLogoProps {
  size?: LogoSize
  className?: string
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
