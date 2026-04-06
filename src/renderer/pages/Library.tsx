import { useState } from 'react'

interface Book {
  id: string
  title: string
  author: string
  cover?: string
  progress: number
}

const mockBooks: Book[] = [
  { id: '1', title: 'O Senhor dos Anéis', author: 'J.R.R. Tolkien', progress: 45 },
  { id: '2', title: 'Dom Casmurro', author: 'Machado de Assis', progress: 100 },
  { id: '3', title: '1984', author: 'George Orwell', progress: 0 }
]

export default function Library(): JSX.Element {
  const [books] = useState<Book[]>(mockBooks)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const handleImport = async () => {
    const filePaths = await window.electronAPI.openFileDialog()
    console.log('Arquivos selecionados:', filePaths)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Biblioteca</h1>
        <div className="flex gap-2">
          <button
            onClick={handleImport}
            className="px-4 py-2 bg-primary hover:bg-primary-light text-white rounded-lg font-medium transition-colors"
          >
            + Importar Livros
          </button>
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-surface' : ''}`}
            >
              ▦
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 ${viewMode === 'list' ? 'bg-surface' : ''}`}
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {books.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-border rounded-xl">
          <span className="text-6xl mb-4">📖</span>
          <h2 className="text-xl font-medium mb-2">Nenhum livro na biblioteca</h2>
          <p className="text-text-muted mb-4">Importe seus EPUBs e PDFs para começar</p>
          <button
            onClick={handleImport}
            className="px-6 py-3 bg-primary hover:bg-primary-light text-white rounded-lg font-medium transition-colors"
          >
            Importar Livros
          </button>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'
          : 'space-y-4'
        }>
          {books.map((book) => (
            <div
              key={book.id}
              className={`group cursor-pointer rounded-xl overflow-hidden bg-surface hover:bg-surface/80 transition-all ${
                viewMode === 'list' ? 'flex items-center p-4' : ''
              }`}
            >
              <div className={`bg-surface border border-border ${
                viewMode === 'list' ? 'w-20 h-28 flex-shrink-0' : 'aspect-[2/3] w-full'
              }`}>
                <div className="w-full h-full flex items-center justify-center text-4xl">
                  📕
                </div>
              </div>
              <div className={viewMode === 'list' ? 'ml-4 flex-1' : 'p-4'}>
                <h3 className="font-semibold truncate">{book.title}</h3>
                <p className="text-sm text-text-muted truncate">{book.author}</p>
                {viewMode === 'list' && (
                  <div className="mt-2">
                    <div className="w-full bg-border rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${book.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-text-muted mt-1">{book.progress}% concluído</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
