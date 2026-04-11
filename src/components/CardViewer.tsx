import { useState, useRef, useCallback, useEffect } from 'react'

interface CardViewerProps {
  frontImageUrl: string
  backImageUrl: string | null
  mode: 'guessing' | 'revealed'
}

export function CardViewer({ frontImageUrl, backImageUrl, mode }: CardViewerProps) {
  const [activeTab, setActiveTab] = useState<'front' | 'back'>('front')
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const triggerRef = useRef<HTMLImageElement | null>(null)

  const hasBack = backImageUrl != null

  useEffect(() => {
    if (!lightboxSrc) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxSrc(null)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [lightboxSrc])

  useEffect(() => {
    if (!lightboxSrc && triggerRef.current) {
      triggerRef.current.focus()
    }
  }, [lightboxSrc])

  const activeUrl = activeTab === 'front' ? frontImageUrl : backImageUrl!

  if (mode === 'revealed') {
    return (
      <div className="flex flex-1 items-center justify-center py-4">
        <img
          src={frontImageUrl}
          alt="Card front scan"
          className="max-h-[70vh] w-auto"
          style={{ objectFit: 'contain' }}
          draggable={false}
        />
      </div>
    )
  }

  return (
    <>
      {/* Desktop: side by side */}
      <div className="hidden flex-1 items-center justify-center gap-4 py-4 sm:flex">
        <ZoomImage src={frontImageUrl} alt="Card front scan" />
        {hasBack && <ZoomImage src={backImageUrl} alt="Card back scan" />}
      </div>

      {/* Mobile: toggle + tap-to-lightbox */}
      <div className="flex flex-1 flex-col items-center py-4 sm:hidden">
        {hasBack && (
          <div className="mb-3 flex gap-1">
            <ToggleButton
              label="Front"
              active={activeTab === 'front'}
              onClick={() => setActiveTab('front')}
            />
            <ToggleButton
              label="Back"
              active={activeTab === 'back'}
              onClick={() => setActiveTab('back')}
            />
          </div>
        )}
        <img
          ref={triggerRef}
          src={activeUrl}
          alt={activeTab === 'front' ? 'Card front scan' : 'Card back scan'}
          className="max-h-[70vh] w-auto cursor-pointer"
          style={{ objectFit: 'contain' }}
          draggable={false}
          loading={activeTab === 'back' ? 'lazy' : undefined}
          onClick={() => setLightboxSrc(activeUrl)}
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') setLightboxSrc(activeUrl) }}
        />
      </div>

      {lightboxSrc && (
        <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}
    </>
  )
}

function ToggleButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`px-4 py-1.5 text-[12px] font-bold uppercase tracking-[0.1em] transition-colors ${
        active
          ? 'bg-[var(--color-text-secondary)] text-white'
          : 'bg-[#3a3a3c] text-[var(--color-text-muted)] hover:bg-[#4a4a4c]'
      }`}
    >
      {label}
    </button>
  )
}

function ZoomImage({ src, alt }: { src: string; alt: string }) {
  const [lens, setLens] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false })
  const imgRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = imgRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setLens({ x, y, visible: true })
  }, [])

  return (
    <div
      ref={imgRef}
      className="relative cursor-crosshair"
      style={{ maxHeight: '70vh' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setLens(prev => ({ ...prev, visible: false }))}
    >
      <img
        src={src}
        alt={alt}
        className="max-h-[70vh] w-auto"
        style={{ objectFit: 'contain' }}
        draggable={false}
      />
      {lens.visible && (
        <div
          className="pointer-events-none absolute h-[200px] w-[200px] rounded-full border-2 border-white/50"
          style={{
            left: `${lens.x}%`,
            top: `${lens.y}%`,
            transform: 'translate(-50%, -50%)',
            backgroundImage: `url(${src})`,
            backgroundSize: '600%',
            backgroundPosition: `${lens.x}% ${lens.y}%`,
          }}
        />
      )}
    </div>
  )
}

function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const pinchRef = useRef({ initialDistance: 0, initialScale: 1 })
  const panRef = useRef({ startX: 0, startY: 0, startTransX: 0, startTransY: 0, isPanning: false })

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  // Clamp translation so the image doesn't go past its borders
  const clampTranslate = useCallback((tx: number, ty: number, s: number) => {
    if (s <= 1) return { x: 0, y: 0 }
    const img = imgRef.current
    const container = containerRef.current
    if (!img || !container) return { x: tx, y: ty }

    const imgRect = img.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()

    // How much bigger the scaled image is vs the container
    const scaledW = (imgRect.width / scale) * s
    const scaledH = (imgRect.height / scale) * s
    const overflowX = Math.max(0, (scaledW - containerRect.width) / 2)
    const overflowY = Math.max(0, (scaledH - containerRect.height) / 2)

    return {
      x: Math.max(-overflowX, Math.min(overflowX, tx)),
      y: Math.max(-overflowY, Math.min(overflowY, ty)),
    }
  }, [scale])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation()
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      pinchRef.current = { initialDistance: Math.hypot(dx, dy), initialScale: scale }
    } else if (e.touches.length === 1 && scale > 1) {
      panRef.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        startTransX: translate.x,
        startTransY: translate.y,
        isPanning: true,
      }
    }
  }, [scale, translate])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.stopPropagation()
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const distance = Math.hypot(dx, dy)
      const newScale = Math.max(1, Math.min(5, pinchRef.current.initialScale * (distance / pinchRef.current.initialDistance)))
      setScale(newScale)
      if (newScale <= 1) {
        setTranslate({ x: 0, y: 0 })
      } else {
        setTranslate(prev => clampTranslate(prev.x, prev.y, newScale))
      }
    } else if (e.touches.length === 1 && panRef.current.isPanning) {
      const dx = e.touches[0].clientX - panRef.current.startX
      const dy = e.touches[0].clientY - panRef.current.startY
      const newX = panRef.current.startTransX + dx
      const newY = panRef.current.startTransY + dy
      setTranslate(clampTranslate(newX, newY, scale))
    }
  }, [scale, clampTranslate])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.stopPropagation()
    panRef.current.isPanning = false
    // Reset to 1x on last finger lift if scale is near 1
    if (e.touches.length === 0 && scale < 1.1) {
      setScale(1)
      setTranslate({ x: 0, y: 0 })
    }
  }, [scale])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      closeRef.current?.focus()
    }
  }, [])

  // Close on tap only when not zoomed
  const handleBackdropClick = useCallback(() => {
    if (scale <= 1) onClose()
  }, [scale, onClose])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      role="dialog"
      aria-modal="true"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <button
        ref={closeRef}
        onClick={(e) => { e.stopPropagation(); onClose() }}
        aria-label="Close"
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center text-[24px] text-white/70 hover:text-white"
      >
        &times;
      </button>
      <img
        ref={imgRef}
        src={src}
        alt="Card scan fullscreen"
        className="max-h-[90vh] max-w-[95vw]"
        style={{
          touchAction: 'none',
          objectFit: 'contain',
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          transition: panRef.current.isPanning ? 'none' : 'transform 0.1s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        draggable={false}
      />
    </div>
  )
}
