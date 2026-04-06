import type { Highlight, Book } from '../types'
import type { HighlightColor } from '../stores/highlightsStore'

interface HighlightsPanelProps {
  book: Book
  highlights: Highlight[]
  onHighlightClick: (location: string) => void
  onDeleteHighlight: (highlightId: string) => void
  onTogglePublic: (highlightId: string) => void
  onExport: () => void
  onClose: () => void
}

const colorMap: Record<HighlightColor, { bg: string; border: string; label: string }> = {
  yellow: { bg: 'bg-yellow-500/20', border: 'border-yellow-500', label: 'Amarelo' },
  green: { bg: 'bg-green-500/20', border: 'border-green-500', label: 'Verde' },
  blue: { bg: 'bg-blue-500/20', border: 'border-blue-500', label: 'Azul' },
  pink: { bg: 'bg-pink-500/20', border: 'border-pink-500', label: 'Rosa' }
}

export default function HighlightsPanel({
  book,
  highlights,
  onHighlightClick,
  onDeleteHighlight,
  onTogglePublic,
  onExport,
  onClose
}: HighlightsPanelProps): JSX.Element {
  const sortedHighlights = [...highlights].sort((a, b) => a.createdAt - b.createdAt)
  
  return (
    <div className="absolute inset-y-0 right-0 w-80 bg-surface border-l border-border shadow-xl z-50 flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-bold">Destaques</h3>
          <p className="text-xs text-text-muted">{book.title}</p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background/50 text-text-muted hover:text-text"
        >
          ×
        </button>
      </div>
      
      {highlights.length > 0 && (
        <div className="p-3 border-b border-border">
          <button
            onClick={onExport}
            className="w-full py-2 px-4 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-sm font-medium transition-colors"
          >
            📤 Exportar para Markdown
          </button>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sortedHighlights.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <span className="text-4xl block mb-3">✋</span>
            <p className="text-sm">Selecione um texto no livro para criar um destaque</p>
            <p className="text-xs mt-2">Clique e arraste sobre o texto que deseja destacar</p>
          </div>
        ) : (
          sortedHighlights.map((highlight) => {
            const colorStyle = colorMap[highlight.color || 'yellow']
            
            return (
              <div
                key={highlight.id}
                className={`p-3 rounded-lg ${colorStyle.bg} border-l-4 ${colorStyle.border}`}
              >
                <p className="text-sm leading-relaxed">{highlight.content}</p>
                
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/30">
                  <div className="flex gap-1">
                    {(['yellow', 'green', 'blue', 'pink'] as HighlightColor[]).map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          const updatedContent = highlight.content.replace(/\[(🟡|🟢|🔵|🩷)\]\s*/, '')
                          onHighlightClick(`update:${highlight.id}:${c}:${encodeURIComponent(updatedContent)}`)
                        }}
                        className={`w-5 h-5 rounded-full ${colorMap[c].bg.replace('/20', '')} border border-current opacity-60 hover:opacity-100 transition-opacity`}
                        title={`Mudar para ${colorMap[c].label}`}
                      />
                    ))}
                  </div>
                  
                  <div className="flex gap-1">
                    <button
                      onClick={() => onTogglePublic(highlight.id)}
                      className={`p-1.5 rounded transition-colors ${
                        highlight.isPublic 
                          ? 'bg-primary/30 text-primary' 
                          : 'hover:bg-background/50 text-text-muted'
                      }`}
                      title={highlight.isPublic ? 'Compartilhado' : 'Privado'}
                    >
                      {highlight.isPublic ? '👁️' : '🔒'}
                    </button>
                    <button
                      onClick={() => onHighlightClick(highlight.location)}
                      className="p-1.5 rounded hover:bg-background/50 text-text-muted hover:text-text transition-colors"
                      title="Ir para este trecho"
                    >
                      📍
                    </button>
                    <button
                      onClick={() => onDeleteHighlight(highlight.id)}
                      className="p-1.5 rounded hover:bg-red-500/20 text-text-muted hover:text-red-500 transition-colors"
                      title="Excluir"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                <p className="text-xs text-text-muted mt-2">
                  {new Date(highlight.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
