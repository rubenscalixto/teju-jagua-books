import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Library from './pages/Library'

function App(): JSX.Element {
  const [currentPage, setCurrentPage] = useState<string>('library')

  const renderPage = () => {
    switch (currentPage) {
      case 'library':
        return <Library />
      case 'settings':
        return <div className="p-6">Configurações</div>
      default:
        return <Library />
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="flex-1 overflow-auto">
        {renderPage()}
      </main>
    </div>
  )
}

export default App
