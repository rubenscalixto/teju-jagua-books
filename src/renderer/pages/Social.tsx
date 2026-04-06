import { useEffect, useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useSocialStore, type Activity } from '../../stores/socialStore'
import AuthModal from './Auth/AuthModal'

export default function Social(): JSX.Element {
  const { user, profile, isInitialized, initialize } = useAuthStore()
  const {
    activities,
    friends,
    friendRequests,
    subscribeToActivities,
    fetchFriends,
    subscribeToFriendRequests,
    unsubscribeAll,
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest
  } = useSocialStore()
  
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'feed' | 'friends' | 'requests'>('feed')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  
  useEffect(() => {
    if (!isInitialized) {
      initialize()
    }
  }, [isInitialized, initialize])
  
  useEffect(() => {
    if (user && profile) {
      subscribeToActivities(user.uid, profile.friends)
      subscribeToFriendRequests(user.uid)
      fetchFriends(profile.friends)
    }
    
    return () => {
      unsubscribeAll()
    }
  }, [user, profile])
  
  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (searchTerm.length >= 3 && user) {
        setIsSearching(true)
        const results = await searchUsers(searchTerm)
        setSearchResults(results.filter(r => r.uid !== user.uid))
        setIsSearching(false)
      } else {
        setSearchResults([])
      }
    }, 300)
    
    return () => clearTimeout(searchTimer)
  }, [searchTerm, user])
  
  const handleSendRequest = async (friendId: string, friendEmail: string) => {
    if (!user) return
    try {
      await sendFriendRequest(user.uid, friendId, friendEmail)
      setSearchTerm('')
      setSearchResults([])
      alert('Solicitação enviada!')
    } catch (err: any) {
      alert(err.message || 'Erro ao enviar solicitação')
    }
  }
  
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
          <span className="text-6xl mb-4 block">👥</span>
          <h2 className="text-2xl font-bold mb-2">Conecte-se com leitores</h2>
          <p className="text-text-muted mb-6">
            Faça login para ver o que seus amigos estão lendo, compartilhar destaques e acompanhar sua jornada literária.
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
  
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'started_reading': return '📖'
      case 'finished': return '🎉'
      case 'highlight': return '🖍️'
      case 'added_friend': return '🤝'
      case 'joined': return '👋'
      default: return '📚'
    }
  }
  
  const getActivityText = (activity: Activity) => {
    switch (activity.type) {
      case 'started_reading': return `${activity.userName} começou a ler "${activity.bookTitle}"` 
      case 'finished': return `${activity.userName} terminou de ler "${activity.bookTitle}"`
      case 'highlight': return `${activity.userName} destacou em "${activity.bookTitle}"`
      case 'added_friend': return `${activity.userName} fez uma nova amizade com ${activity.friendName}`
      case 'joined': return `${activity.userName} entrou no Teju Jagua!`
      default: return `${activity.userName} fez algo`
    }
  }
  
  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return 'agora'
    if (minutes < 60) return `${minutes}m`
    if (hours < 24) return `${hours}h`
    return `${days}d`
  }
  
  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-6">Social</h1>
        
        <div className="flex gap-2 mb-6 border-b border-border pb-4">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'feed' ? 'bg-primary text-white' : 'hover:bg-surface'
            }`}
          >
            Feed
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'friends' ? 'bg-primary text-white' : 'hover:bg-surface'
            }`}
          >
            Amigos
            {friends.length > 0 && (
              <span className="px-2 py-0.5 bg-primary/20 rounded-full text-xs">{friends.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'requests' ? 'bg-primary text-white' : 'hover:bg-surface'
            }`}
          >
            Solicitações
            {friendRequests.length > 0 && (
              <span className="px-2 py-0.5 bg-red-500 rounded-full text-xs">{friendRequests.length}</span>
            )}
          </button>
        </div>
        
        {activeTab === 'feed' && (
          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="text-center py-12 text-text-muted">
                <span className="text-4xl block mb-3">📭</span>
                <p>Nenhuma atividade ainda</p>
                <p className="text-sm mt-1">Adicione amigos para ver o que estão lendo!</p>
              </div>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="bg-surface p-4 rounded-xl flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    {activity.userPhoto ? (
                      <img src={activity.userPhoto} alt={activity.userName} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-lg font-bold text-primary">
                        {activity.userName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getActivityIcon(activity.type)}</span>
                      <p className="text-sm">{getActivityText(activity)}</p>
                    </div>
                    {activity.highlightContent && (
                      <p className="text-sm text-text-muted italic mt-2 pl-6 border-l-2 border-primary/30">
                        "{activity.highlightContent.substring(0, 100)}..."
                      </p>
                    )}
                    <p className="text-xs text-text-muted mt-2">{getTimeAgo(activity.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        
        {activeTab === 'friends' && (
          <div>
            <div className="mb-6">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar usuários por nome ou email..."
                className="w-full px-4 py-3 bg-surface border border-border rounded-lg"
              />
              
              {isSearching && (
                <p className="text-sm text-text-muted mt-2">Buscando...</p>
              )}
              
              {searchResults.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-text-muted mb-2">Resultados da busca:</p>
                  {searchResults.map((result) => (
                    <div key={result.uid} className="bg-surface p-3 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          {result.photoURL ? (
                            <img src={result.photoURL} alt={result.displayName} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span className="font-bold text-primary">{result.displayName.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{result.displayName}</p>
                          <p className="text-xs text-text-muted">{result.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSendRequest(result.uid, result.email)}
                        className="px-3 py-1.5 bg-primary hover:bg-primary-light text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Adicionar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {friends.length === 0 ? (
              <div className="text-center py-12 text-text-muted">
                <span className="text-4xl block mb-3">👥</span>
                <p>Nenhum amigo ainda</p>
                <p className="text-sm mt-1">Busque por usuários acima para adicionar amigos!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {friends.map((friend) => (
                  <div key={friend.uid} className="bg-surface p-4 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        {friend.photoURL ? (
                          <img src={friend.photoURL} alt={friend.displayName} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-lg font-bold text-primary">{friend.displayName.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{friend.displayName}</p>
                        <p className="text-xs text-text-muted">{friend.totalBooksRead} livros</p>
                      </div>
                    </div>
                    {friend.currentlyReading && friend.currentlyReading.length > 0 && (
                      <div className="text-xs text-text-muted">
                        📖 Lendo agora
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'requests' && (
          <div className="space-y-4">
            {friendRequests.length === 0 ? (
              <div className="text-center py-12 text-text-muted">
                <span className="text-4xl block mb-3">📬</span>
                <p>Nenhuma solicitação pendente</p>
              </div>
            ) : (
              friendRequests.map((request) => (
                <div key={request.id} className="bg-surface p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      {request.from.photoURL ? (
                        <img src={request.from.photoURL} alt={request.from.displayName} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-primary">{request.from.displayName.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{request.from.displayName}</p>
                      <p className="text-xs text-text-muted">Quer ser seu amigo</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (user) {
                          acceptFriendRequest(request.id, request.from.uid, user.uid)
                        }
                      }}
                      className="px-4 py-2 bg-primary hover:bg-primary-light text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Aceitar
                    </button>
                    <button
                      onClick={() => declineFriendRequest(request.id)}
                      className="px-4 py-2 border border-border hover:bg-background rounded-lg text-sm transition-colors"
                    >
                      Recusar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
