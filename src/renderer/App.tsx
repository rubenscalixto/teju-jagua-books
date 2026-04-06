import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Library from './pages/Library'
import Reader from './pages/Reader'
import Profile from './pages/Profile'
import Social from './pages/Social'
import type { Book } from './types'
import { useAuthStore } from './stores/authStore'

function App(): JSX.Element {
  const [currentPage, setCurrentPage] = useState<string>('library')
  const [currentBook, setCurrentBook] = useState<Book | null>(null)
  const { initialize, isInitialized } = useAuthStore()
  
  useEffect(() => {
    initialize()
  }, [initialize])
  
  const handleBookOpen = (book: Book) => {
    setCurrentBook(book)
    setCurrentPage('reader')
  }
  
  const handleCloseReader = () => {
    setCurrentBook(null)
    setCurrentPage('library')
  }
  
  if (!isInitialized) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-text-muted">Carregando...</p>
        </div>
      </div>
    )
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
                  Teju Jagua v0.2.0 - Seu launcher de livros pessoal
                </p>
              </div>
              <div className="p-4 bg-surface rounded-lg">
                <h2 className="font-medium mb-2">Armazenamento</h2>
                <p className="text-text-muted text-sm">
                  Os dados da biblioteca são salvos localmente. Dados sociais são sincronizados com o Firebase.
                </p>
              </div>
              <div className="p-4 bg-surface rounded-lg">
                <h2 className="font-medium mb-2">Configuração Firebase</h2>
                <p className="text-text-muted text-sm mb-2">
                  Para ativar os recursos sociais, configure as variáveis de ambiente:
                </p>
                <code className="block p-3 bg-background rounded text-xs">
                  VITE_FIREBASE_API_KEY=...<br/>
                  VITE_FIREBASE_AUTH_DOMAIN=...<br/>
                  VITE_FIREBASE_PROJECT_ID=...
                </code>
              </div>
            </div>
          </div>
        )}
        {currentPage === 'social' && <Social />}
        {currentPage === 'profile' && <Profile />}
      </main>
    </div>
  )
}

export default App
