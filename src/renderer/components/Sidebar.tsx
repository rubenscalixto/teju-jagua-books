import { useUIStore } from '../stores/uiStore'
import { useAuthStore } from '../stores/authStore'

interface SidebarProps {
  currentPage: string
  onNavigate: (page: string) => void
}

const menuItems = [
  { id: 'library', label: 'Biblioteca', icon: '📚' },
  { id: 'social', label: 'Social', icon: '👥' },
  { id: 'profile', label: 'Perfil', icon: '👤' },
  { id: 'settings', label: 'Configurações', icon: '⚙️' }
]

export default function Sidebar({ currentPage, onNavigate }: SidebarProps): JSX.Element {
  const { syncStatus, lastSyncAt } = useUIStore()
  const { user } = useAuthStore()
  
  const getSyncIcon = () => {
    switch (syncStatus) {
      case 'syncing': return '🔄'
      case 'success': return '✅'
      case 'error': return '❌'
      default: return '☁️'
    }
  }
  
  const getSyncText = () => {
    if (!user) return ''
    switch (syncStatus) {
      case 'syncing': return 'Sincronizando...'
      case 'success': return 'Sincronizado'
      case 'error': return 'Erro de sync'
      default: return 'Nuvem'
    }
  }
  
  return (
    <aside className="w-64 bg-surface border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-bold text-primary">Teju Jagua</h1>
        <p className="text-xs text-text-muted">Seu launcher de livros</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  currentPage === item.id
                    ? 'bg-primary/20 text-primary'
                    : 'text-text-muted hover:bg-background hover:text-text'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {user && (
        <div className="px-4 py-2 border-t border-border">
          <div className={`flex items-center gap-2 text-xs ${
            syncStatus === 'error' ? 'text-red-400' : 
            syncStatus === 'success' ? 'text-green-400' : 
            'text-text-muted'
          }`}>
            <span className={syncStatus === 'syncing' ? 'animate-spin' : ''}>
              {getSyncIcon()}
            </span>
            <span>{getSyncText()}</span>
          </div>
          {lastSyncAt && (
            <p className="text-xs text-text-muted mt-1">
              Última sync: {new Date(lastSyncAt).toLocaleTimeString('pt-BR')}
            </p>
          )}
        </div>
      )}

      <div className="p-4 border-t border-border">
        <p className="text-xs text-text-muted text-center">v0.4.0</p>
      </div>
    </aside>
  )
}
