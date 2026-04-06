import type { Book, ReadingProgress } from '../types'

interface BookCardProps {
  book: Book
  progress?: ReadingProgress
  viewMode: 'grid' | 'list'
  onClick: () => void
  onRemove?: () => void
}

export default function BookCard({ book, progress, viewMode, onClick, onRemove }: BookCardProps): JSX.Element {
  const progressPercent = progress?.percentage ?? 0
  
  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer rounded-xl overflow-hidden bg-surface hover:bg-surface/80 transition-all relative ${
        viewMode === 'list' ? 'flex items-center p-4' : ''
      }`}
    >
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 text-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10"
        >
          ×
        </button>
      )}
      
      <div className={`bg-background border border-border ${
        viewMode === 'list' ? 'w-20 h-28 flex-shrink-0 rounded-lg' : 'aspect-[2/3] w-full rounded-t-xl'
      }`}>
        {book.coverUrl ? (
          <img 
            src={book.coverUrl} 
            alt={book.title}
            className={`w-full h-full object-cover ${viewMode === 'list' ? 'rounded-lg' : 'rounded-t-xl'}`}
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center text-5xl ${
            viewMode === 'list' ? 'text-3xl' : 'text-5xl'
          }`}>
            📖
          </div>
        )}
      </div>
      
      <div className={viewMode === 'list' ? 'ml-4 flex-1 min-w-0' : 'p-4'}>
        <h3 className="font-semibold truncate">{book.title}</h3>
        <p className="text-sm text-text-muted truncate">{book.author}</p>
        
        {viewMode === 'list' && (
          <div className="mt-2">
            <div className="w-full bg-border rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-text-muted mt-1">{progressPercent}% concluído</p>
          </div>
        )}
        
        {viewMode === 'grid' && progressPercent > 0 && (
          <div className="mt-3">
            <div className="w-full bg-border rounded-full h-1.5">
              <div 
                className="bg-primary h-1.5 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-text-muted mt-1">{progressPercent}%</p>
          </div>
        )}
      </div>
    </div>
  )
}
