'use client'

import { useEffect, useRef, useState } from 'react'

interface CursorPosition {
  x: number
  y: number
}

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const trailRefs = useRef<(HTMLDivElement | null)[]>([])
  const [isHovering, setIsHovering] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(true)

  // Raw cursor position
  const mousePos = useRef<CursorPosition>({ x: -100, y: -100 })
  // Smooth cursor position (lerp)
  const smoothPos = useRef<CursorPosition>({ x: -100, y: -100 })
  // Trail positions
  const trailPos = useRef<CursorPosition[]>(
    Array(5).fill(null).map(() => ({ x: -100, y: -100 }))
  )

  const rafId = useRef<number | undefined>(undefined)
  const lastMoveTime = useRef<number>(Date.now())

  useEffect(() => {
    // Check mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)

    if (isMobile) return

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY }
      lastMoveTime.current = Date.now()
      if (!isVisible) setIsVisible(true)
    }

    const handleMouseEnter = () => setIsVisible(true)
    const handleMouseLeave = () => setIsVisible(false)

    // Lerp function for smooth follow
    const lerp = (start: number, end: number, factor: number) => {
      return start + (end - start) * factor
    }

    // Animation loop
    const animate = () => {
      // Smooth cursor follows mouse with lerp
      smoothPos.current.x = lerp(smoothPos.current.x, mousePos.current.x, 0.15)
      smoothPos.current.y = lerp(smoothPos.current.y, mousePos.current.y, 0.15)

      // Update main cursor
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${smoothPos.current.x - 10}px, ${smoothPos.current.y - 10}px, 0)`
      }

      // Update trail with delay
      trailPos.current.forEach((pos, i) => {
        const prevPos = i === 0 ? smoothPos.current : trailPos.current[i - 1]
        const delay = 0.1 - i * 0.015 // Each dot follows with more delay
        pos.x = lerp(pos.x, prevPos.x, delay)
        pos.y = lerp(pos.y, prevPos.y, delay)

        if (trailRefs.current[i]) {
          const scale = 1 - i * 0.15
          const opacity = 1 - i * 0.2
          trailRefs.current[i]!.style.transform = `translate3d(${pos.x - 5}px, ${pos.y - 5}px, 0) scale(${scale})`
          trailRefs.current[i]!.style.opacity = String(opacity)
        }
      })

      rafId.current = requestAnimationFrame(animate)
    }

    // Hover detection
    const addHoverListeners = () => {
      const interactables = document.querySelectorAll('a, button, [data-hover]')
      interactables.forEach((el) => {
        el.addEventListener('mouseenter', () => setIsHovering(true))
        el.addEventListener('mouseleave', () => setIsHovering(false))
      })
    }

    // Initial setup and mutation observer for dynamic elements
    addHoverListeners()
    const observer = new MutationObserver(addHoverListeners)
    observer.observe(document.body, { childList: true, subtree: true })

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.body.addEventListener('mouseenter', handleMouseEnter)
    document.body.addEventListener('mouseleave', handleMouseLeave)

    rafId.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('mousemove', handleMouseMove)
      document.body.removeEventListener('mouseenter', handleMouseEnter)
      document.body.removeEventListener('mouseleave', handleMouseLeave)
      observer.disconnect()
      if (rafId.current) cancelAnimationFrame(rafId.current)
    }
  }, [isMobile, isVisible])

  if (isMobile) return null

  return (
    <>
      {/* Main cursor */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 w-5 h-5 pointer-events-none z-[9999] mix-blend-difference"
        style={{
          willChange: 'transform',
          transition: 'width 0.2s, height 0.2s',
          width: isHovering ? '40px' : '20px',
          height: isHovering ? '40px' : '20px',
          marginLeft: isHovering ? '-10px' : '0',
          marginTop: isHovering ? '-10px' : '0',
        }}
      >
        <div className="w-full h-full bg-red-600 rounded-full" />
      </div>

      {/* Trail dots */}
      {Array(5)
        .fill(null)
        .map((_, i) => (
          <div
            key={i}
            ref={(el) => { trailRefs.current[i] = el }}
            className="fixed top-0 left-0 w-2.5 h-2.5 pointer-events-none z-[9998]"
            style={{ willChange: 'transform, opacity' }}
          >
            <div className="w-full h-full bg-red-600/50 rounded-full" />
          </div>
        ))}

      {/* Hide default cursor */}
      <style jsx global>{`
        body {
          cursor: none !important;
        }
        @media (max-width: 768px) {
          body {
            cursor: auto !important;
          }
        }
        a, button, [data-hover], input, textarea {
          cursor: none !important;
        }
        @media (max-width: 768px) {
          a, button, [data-hover], input, textarea {
            cursor: pointer !important;
          }
        }
      `}</style>
    </>
  )
}