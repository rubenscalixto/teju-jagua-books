import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Library from './pages/Library'
import Reader from './pages/Reader'
import Profile from './pages/Profile'
import Social from './pages/Social'
import Settings from './pages/Settings'
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
        {currentPage === 'settings' && <Settings />}
        {currentPage === 'social' && <Social />}
        {currentPage === 'profile' && <Profile />}
      </main>
    </div>
  )
}

export default App
