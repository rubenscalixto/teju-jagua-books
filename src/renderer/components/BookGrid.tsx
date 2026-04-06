import BookCard from './BookCard'
import type { Book, ReadingProgress } from '../types'

interface BookGridProps {
  books: Book[]
  progress: Record<string, ReadingProgress>
  viewMode: 'grid' | 'list'
  onBookClick: (book: Book) => void
  onBookRemove?: (bookId: string) => void
}

export default function BookGrid({ books, progress, viewMode, onBookClick, onBookRemove }: BookGridProps): JSX.Element {
  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-border rounded-xl">
        <span className="text-6xl mb-4">📖</span>
        <h2 className="text-xl font-medium mb-2">Nenhum livro na biblioteca</h2>
        <p className="text-text-muted mb-4">Importe seus EPUBs e PDFs para começar</p>
      </div>
    )
  }
  
  return (
    <div className={viewMode === 'grid' 
      ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'
      : 'space-y-4'
    }>
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          progress={progress[book.id]}
          viewMode={viewMode}
          onClick={() => onBookClick(book)}
          onRemove={onBookRemove}
        />
      ))}
    </div>
  )
}
