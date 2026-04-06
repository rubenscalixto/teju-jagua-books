import type { HighlightColor } from '../stores/highlightsStore'

interface ReaderToolbarProps {
  isVisible: boolean
  position: { x: number; y: number }
  onHighlight: (color: HighlightColor) => void
  onBookmark: () => void
  onNote: () => void
  onCopy: () => void
}

const colorButtons: { color: HighlightColor; label: string; icon: string }[] = [
  { color: 'yellow', label: 'Amarelo', icon: '🟡' },
  { color: 'green', label: 'Verde', icon: '🟢' },
  { color: 'blue', label: 'Azul', icon: '🔵' },
  { color: 'pink', label: 'Rosa', icon: '🩷' }
]

export default function ReaderToolbar({
  isVisible,
  position,
  onHighlight,
  onBookmark,
  onNote,
  onCopy
}: ReaderToolbarProps): JSX.Element | null {
  if (!isVisible) return null
  
  return (
    <div
      className="fixed z-[100] bg-surface border border-border rounded-xl shadow-2xl p-2 flex items-center gap-1 animate-in fade-in zoom-in-95 duration-150"
      style={{
        left: Math.min(position.x, window.innerWidth - 300),
        top: position.y - 60
      }}
    >
      {colorButtons.map(({ color, label, icon }) => (
        <button
          key={color}
          onClick={() => onHighlight(color)}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-background/50 transition-colors text-lg"
          title={`Destacar em ${label}`}
        >
          {icon}
        </button>
      ))}
      
      <div className="w-px h-8 bg-border mx-1" />
      
      <button
        onClick={onNote}
        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-background/50 transition-colors"
        title="Adicionar nota"
      >
        📝
      </button>
      
      <button
        onClick={onBookmark}
        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-background/50 transition-colors"
        title="Adicionar marcador"
      >
        🔖
      </button>
      
      <button
        onClick={onCopy}
        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-background/50 transition-colors"
        title="Copiar texto"
      >
        📋
      </button>
    </div>
  )
}
