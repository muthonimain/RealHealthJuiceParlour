import { useEffect, useState } from 'react'

/** True when viewport is at least `px` wide (default 768 = Tailwind md). */
export function useMinWidth(px = 768) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(`(min-width: ${px}px)`).matches : false
  )

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${px}px)`)
    const onChange = () => setMatches(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [px])

  return matches
}
