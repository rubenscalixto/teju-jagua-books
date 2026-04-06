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
                    : 'text-text-muted hover:bg-surface hover:text-text'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-border">
        <p className="text-xs text-text-muted text-center">v0.1.0</p>
      </div>
    </aside>
  )
}
