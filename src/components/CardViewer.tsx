import { useState, useRef, useCallback } from 'react'

interface CardViewerProps {
  frontImageUrl: string
  backImageUrl: string | null
  mode: 'guessing' | 'revealed'
}

export function CardViewer({ frontImageUrl, backImageUrl, mode }: CardViewerProps) {
  const [activeTab, setActiveTab] = useState<'front' | 'back'>('front')

  const hasBack = backImageUrl != null

  const activeUrl = activeTab === 'front' ? frontImageUrl : backImageUrl!

  if (mode === 'revealed') {
    return (
      <div className="flex flex-1 items-center justify-center py-4">
        <img
          src={frontImageUrl}
          alt="Card front scan"
          className="max-h-[90vh] w-auto"
          style={{ objectFit: 'contain' }}
          draggable={false}
          fetchPriority="high"
          decoding="async"
        />
      </div>
    )
  }

  return (
    <>
      {/* Desktop: side by side */}
      <div className="hidden flex-1 items-center justify-center gap-4 py-4 sm:flex">
        <ZoomImage src={frontImageUrl} alt="Card front scan" maxHeight="90vh" />
        {hasBack && <ZoomImage src={backImageUrl} alt="Card back scan" maxHeight="90vh" />}
      </div>

      {/* Mobile: front/back toggle, no lightbox */}
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
          src={activeUrl}
          alt={activeTab === 'front' ? 'Card front scan' : 'Card back scan'}
          className="max-h-[70vh] w-auto"
          style={{ objectFit: 'contain' }}
          draggable={false}
          loading={activeTab === 'back' ? 'lazy' : undefined}
          fetchPriority={activeTab === 'front' ? 'high' : 'auto'}
          decoding="async"
        />
      </div>
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

function ZoomImage({ src, alt, maxHeight = '70vh' }: { src: string; alt: string; maxHeight?: string }) {
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
      style={{ maxHeight, zIndex: lens.visible ? 10 : 'auto' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setLens(prev => ({ ...prev, visible: false }))}
    >
      <img
        src={src}
        alt={alt}
        style={{ maxHeight, objectFit: 'contain', width: 'auto' }}
        draggable={false}
        fetchPriority="high"
        decoding="async"
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
