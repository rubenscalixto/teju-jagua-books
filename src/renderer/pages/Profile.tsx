import { useEffect, useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useLibraryStore } from '../../stores/libraryStore'
import AuthModal from './Auth/AuthModal'

export default function Profile(): JSX.Element {
  const { user, profile, isInitialized, logOut, initialize } = useAuthStore()
  const { books, readingProgress } = useLibraryStore()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [bio, setBio] = useState(profile?.bio || '')
  
  useEffect(() => {
    if (!isInitialized) {
      initialize()
    }
  }, [isInitialized, initialize])
  
  useEffect(() => {
    if (profile?.bio !== undefined) {
      setBio(profile.bio || '')
    }
  }, [profile?.bio])
  
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }
  
  if (!user) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full">
        <div className="text-center max-w-md">
          <span className="text-6xl mb-4 block">👤</span>
          <h2 className="text-2xl font-bold mb-2">Entre na sua conta</h2>
          <p className="text-text-muted mb-6">
            Faça login para sincronizar sua biblioteca, acompanhar sua leitura e conectar com amigos.
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-6 py-3 bg-primary hover:bg-primary-light text-white rounded-lg font-medium transition-colors"
          >
            Fazer Login / Criar Conta
          </button>
        </div>
        
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      </div>
    )
  }
  
  const totalBooks = books.length
  const booksFinished = books.filter(b => readingProgress[b.id]?.percentage === 100).length
  const booksReading = books.filter(b => {
    const p = readingProgress[b.id]
    return p && p.percentage > 0 && p.percentage < 100
  }).length
  
  const currentlyReading = profile?.currentlyReading || []
  const currentlyReadingBooks = currentlyReading
    .map(id => books.find(b => b.id === id))
    .filter(Boolean)
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-primary">
                {profile?.displayName?.charAt(0).toUpperCase() || 'U'}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{profile?.displayName || user.email}</h1>
            <p className="text-text-muted">{user.email}</p>
          </div>
        </div>
        
        <button
          onClick={logOut}
          className="px-4 py-2 border border-border rounded-lg hover:bg-surface transition-colors text-sm"
        >
          Sair
        </button>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-surface p-4 rounded-xl text-center">
          <p className="text-3xl font-bold text-primary">{totalBooks}</p>
          <p className="text-sm text-text-muted">Livros</p>
        </div>
        <div className="bg-surface p-4 rounded-xl text-center">
          <p className="text-3xl font-bold text-primary">{booksReading}</p>
          <p className="text-sm text-text-muted">Lendo</p>
        </div>
        <div className="bg-surface p-4 rounded-xl text-center">
          <p className="text-3xl font-bold text-primary">{booksFinished}</p>
          <p className="text-sm text-text-muted">Finalizados</p>
        </div>
      </div>
      
      <div className="bg-surface rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Sobre</h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-sm text-primary hover:underline"
          >
            {isEditing ? 'Cancelar' : 'Editar'}
          </button>
        </div>
        
        {isEditing ? (
          <div className="space-y-4">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Escreva algo sobre você..."
              className="w-full h-24 p-3 bg-background border border-border rounded-lg resize-none"
            />
            <button
              onClick={async () => {
                await useAuthStore.getState().updateUserProfile({ bio })
                setIsEditing(false)
              }}
              className="px-4 py-2 bg-primary hover:bg-primary-light text-white rounded-lg text-sm font-medium transition-colors"
            >
              Salvar
            </button>
          </div>
        ) : (
          <p className="text-text-muted">
            {bio || 'Nenhuma bio adicionada ainda. Clique em Editar para adicionar uma.'}
          </p>
        )}
      </div>
      
      {currentlyReadingBooks.length > 0 && (
        <div className="bg-surface rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">Lendo Agora</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {currentlyReadingBooks.map((book: any) => (
              <div key={book.id} className="flex-shrink-0 w-32">
                <div className="w-full aspect-[2/3] bg-background rounded-lg overflow-hidden mb-2">
                  {book.coverUrl ? (
                    <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">📖</div>
                  )}
                </div>
                <p className="text-sm font-medium truncate">{book.title}</p>
                <p className="text-xs text-text-muted truncate">{book.author}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-8 p-6 bg-surface/50 rounded-xl border border-border">
        <h2 className="text-lg font-bold mb-2">Código de Amigo</h2>
        <p className="text-sm text-text-muted mb-3">
          Compartilhe este código para adicionar amigos:
        </p>
        <code className="block p-3 bg-background rounded-lg font-mono text-lg text-center">
          {user.uid.substring(0, 8).toUpperCase()}
        </code>
      </div>
    </div>
  )
}
