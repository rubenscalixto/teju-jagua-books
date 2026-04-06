import { useState, useCallback } from 'react'
import { useLibraryStore } from '../stores/libraryStore'
import BookGrid from '../components/BookGrid'
import type { Book } from '../types'
import { parseEpub } from '../services/epubParser'

type FilterType = 'all' | 'reading' | 'finished' | 'not-started'

interface LibraryProps {
  onBookOpen: (book: Book) => void
}

export default function Library({ onBookOpen }: LibraryProps): JSX.Element {
  const { books, readingProgress, addBook, removeBook, setLoading, isLoading, error, setError } = useLibraryStore()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filter, setFilter] = useState<FilterType>('all')
  const [isDragging, setIsDragging] = useState(false)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  
  const handleFileImport = async (files: FileList | string[]) => {
    setLoading(true)
    setError(null)
    
    const filePaths = Array.from(files)
    let addedCount = 0
    
    for (const file of filePaths) {
      try {
        const filePath = typeof file === 'string' ? file : file.name
        const fileBuffer = typeof file === 'string' 
          ? await fetch(`file://${file}`).then(r => r.arrayBuffer())
          : await file.arrayBuffer()
        
        if (filePath.toLowerCase().endsWith('.epub')) {
          const book = await parseEpub(filePath, fileBuffer)
          addBook(book)
          addedCount++
        }
      } catch (err) {
        console.error('Error importing book:', err)
      }
    }
    
    setLoading(false)
    if (addedCount > 0) {
      setError(null)
    }
  }
  
  const handleOpenDialog = async () => {
    try {
      const filePaths = await window.electronAPI.openFileDialog()
      if (filePaths && filePaths.length > 0) {
        await handleFileImport(filePaths)
      }
    } catch (err) {
      console.error('Error opening dialog:', err)
    }
  }
  
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
      .filter(f => f.name.toLowerCase().endsWith('.epub'))
    
    if (files.length > 0) {
      await handleFileImport(files)
    }
  }, [])
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])
  
  const filteredBooks = books.filter(book => {
    const progress = readingProgress[book.id]
    switch (filter) {
      case 'reading':
        return progress && progress.percentage > 0 && progress.percentage < 100
      case 'finished':
        return progress && progress.percentage === 100
      case 'not-started':
        return !progress || progress.percentage === 0
      default:
        return true
    }
  })
  
  const handleBookClick = (book: Book) => {
    setSelectedBook(book)
  }
  
  const handleCloseDetails = () => {
    setSelectedBook(null)
  }
  
  return (
    <div 
      className={`p-6 h-full ${isDragging ? 'bg-primary/5' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Biblioteca</h1>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterType)}
            className="px-3 py-2 bg-surface border border-border rounded-lg text-sm"
          >
            <option value="all">Todos ({books.length})</option>
            <option value="reading">Lendo ({books.filter(b => {
              const p = readingProgress[b.id]
              return p && p.percentage > 0 && p.percentage < 100
            }).length})</option>
            <option value="finished">Finalizados ({books.filter(b => 
              readingProgress[b.id]?.percentage === 100
            ).length})</option>
            <option value="not-started">Não iniciados ({books.filter(b => 
              !readingProgress[b.id] || readingProgress[b.id].percentage === 0
            ).length})</option>
          </select>
          
          <button
            onClick={handleOpenDialog}
            disabled={isLoading}
            className="px-4 py-2 bg-primary hover:bg-primary-light text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Importando...' : '+ Importar Livros'}
          </button>
          
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-surface' : 'hover:bg-surface/50'}`}
              title="Grade"
            >
              ▦
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 ${viewMode === 'list' ? 'bg-surface' : 'hover:bg-surface/50'}`}
              title="Lista"
            >
              ☰
            </button>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
      
      <BookGrid
        books={filteredBooks}
        progress={readingProgress}
        viewMode={viewMode}
        onBookClick={handleBookClick}
        onBookRemove={removeBook}
      />
      
      {isDragging && (
        <div className="fixed inset-0 bg-background/90 flex items-center justify-center z-50 pointer-events-none">
          <div className="p-8 border-2 border-dashed border-primary rounded-2xl">
            <span className="text-6xl block text-center mb-4">📥</span>
            <p className="text-xl font-medium text-center">Solte os arquivos EPUB aqui</p>
          </div>
        </div>
      )}
      
      {selectedBook && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={handleCloseDetails}
        >
          <div 
            className="bg-surface rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex gap-4">
              <div className="w-24 h-36 bg-background rounded-lg overflow-hidden flex-shrink-0">
                {selectedBook.coverUrl ? (
                  <img src={selectedBook.coverUrl} alt={selectedBook.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">📖</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold truncate">{selectedBook.title}</h2>
                <p className="text-text-muted truncate">{selectedBook.author}</p>
                {selectedBook.description && (
                  <p className="text-sm text-text-muted mt-2 line-clamp-3">{selectedBook.description}</p>
                )}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <button
                onClick={() => {
                  onBookOpen(selectedBook)
                }}
                className="w-full py-3 bg-primary hover:bg-primary-light text-white rounded-lg font-medium transition-colors"
              >
                Ler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
