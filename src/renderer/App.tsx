import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Library from './pages/Library'
import Reader from './pages/Reader'
import type { Book } from './types'

function App(): JSX.Element {
  const [currentPage, setCurrentPage] = useState<string>('library')
  const [currentBook, setCurrentBook] = useState<Book | null>(null)

  const handleBookOpen = (book: Book) => {
    setCurrentBook(book)
    setCurrentPage('reader')
  }

  const handleCloseReader = () => {
    setCurrentBook(null)
    setCurrentPage('library')
  }

  if (currentPage === 'reader' && currentBook) {
    return <Reader bookId={currentBook.id} onClose={handleCloseReader} />
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="flex-1 overflow-auto">
        {currentPage === 'library' && (
          <Library onBookOpen={handleBookOpen} />
        )}
        {currentPage === 'settings' && (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Configurações</h1>
            <div className="space-y-4">
              <div className="p-4 bg-surface rounded-lg">
                <h2 className="font-medium mb-2">Sobre</h2>
                <p className="text-text-muted text-sm">
                  Teju Jagua v0.1.0 - Seu launcher de livros pessoal
                </p>
              </div>
              <div className="p-4 bg-surface rounded-lg">
                <h2 className="font-medium mb-2">Armazenamento</h2>
                <p className="text-text-muted text-sm">
                  Os dados são salvos localmente no navegador.
                </p>
              </div>
            </div>
          </div>
        )}
        {currentPage === 'social' && (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Social</h1>
            <div className="flex flex-col items-center justify-center h-96 text-text-muted">
              <span className="text-5xl mb-4">👥</span>
              <p>Recurso em desenvolvimento</p>
            </div>
          </div>
        )}
        {currentPage === 'profile' && (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Perfil</h1>
            <div className="flex flex-col items-center justify-center h-96 text-text-muted">
              <span className="text-5xl mb-4">👤</span>
              <p>Recurso em desenvolvimento</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
