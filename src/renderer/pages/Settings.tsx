import { useUIStore } from '../stores/uiStore'
import { useAuthStore } from '../stores/authStore'
import { useSync } from '../hooks/useSync'
import type { Language } from '../services/i18n'

export default function Settings(): JSX.Element {
  const { language, setLanguage, syncEnabled, setSyncEnabled } = useUIStore()
  const { user } = useAuthStore()
  const { forceSync, lastSync, isOnline } = useSync()
  
  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
    { code: 'en-US', name: 'English (US)', flag: '🇺🇸' }
  ]
  
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Configurações</h1>
      
      <div className="space-y-6">
        <div className="p-4 bg-surface rounded-xl">
          <h2 className="font-medium mb-4">Idioma / Language</h2>
          <div className="flex gap-3">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`flex-1 py-3 px-4 rounded-lg border transition-colors flex items-center justify-center gap-2 ${
                  language === lang.code
                    ? 'border-primary bg-primary/20 text-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <span className="text-xl">{lang.flag}</span>
                <span className="font-medium">{lang.name}</span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-4 bg-surface rounded-xl">
          <h2 className="font-medium mb-4">Sincronização</h2>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium">Sincronização com nuvem</p>
              <p className="text-sm text-text-muted">
                Sincronize seu progresso e destaques com a nuvem
              </p>
            </div>
            <button
              onClick={() => setSyncEnabled(!syncEnabled)}
              className={`w-12 h-7 rounded-full transition-colors relative ${
                syncEnabled ? 'bg-primary' : 'bg-border'
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  syncEnabled ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
          
          {user && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <span className={isOnline ? 'text-green-400' : 'text-red-400'}>
                  {isOnline ? '🟢 Online' : '🔴 Offline'}
                </span>
                {lastSync && (
                  <span className="text-text-muted">
                    Última sync: {lastSync.toLocaleString('pt-BR')}
                  </span>
                )}
              </div>
              
              <button
                onClick={forceSync}
                disabled={!isOnline || !syncEnabled}
                className="w-full py-2 px-4 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🔄 Forçar sincronização
              </button>
            </div>
          )}
          
          {!user && (
            <p className="text-sm text-text-muted">
              Faça login para ativar a sincronização.
            </p>
          )}
        </div>
        
        <div className="p-4 bg-surface rounded-xl">
          <h2 className="font-medium mb-2">Sobre</h2>
          <p className="text-text-muted text-sm mb-2">
            Teju Jagua v0.4.0 - Seu launcher de livros pessoal
          </p>
          <p className="text-xs text-text-muted">
            Inspirado na criatura da mitologia tupi-guarani - um lagarto com sete cabeças de cachorro.
          </p>
        </div>
        
        <div className="p-4 bg-surface rounded-xl">
          <h2 className="font-medium mb-2">Armazenamento</h2>
          <p className="text-sm text-text-muted">
            Os dados da biblioteca são salvos localmente no navegador. 
            Dados sociais são sincronizados com o Firebase quando você faz login.
          </p>
        </div>
        
        <div className="p-4 bg-surface rounded-xl">
          <h2 className="font-medium mb-2">Configuração Firebase</h2>
          <p className="text-sm text-text-muted mb-3">
            Para ativar os recursos sociais, configure as variáveis de ambiente em um arquivo <code className="px-1 py-0.5 bg-background rounded">.env</code>:
          </p>
          <code className="block p-3 bg-background rounded text-xs space-y-1">
            <div>VITE_FIREBASE_API_KEY=sua_chave</div>
            <div>VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com</div>
            <div>VITE_FIREBASE_PROJECT_ID=seu_projeto</div>
            <div>VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com</div>
            <div>VITE_FIREBASE_MESSAGING_SENDER_ID=seu_id</div>
            <div>VITE_FIREBASE_APP_ID=seu_app_id</div>
          </code>
        </div>
        
        <div className="p-4 bg-surface rounded-xl">
          <h2 className="font-medium mb-2"> Atalhos de Teclado</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">Próxima página</span>
              <kbd className="px-2 py-1 bg-background rounded text-xs">→</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Página anterior</span>
              <kbd className="px-2 py-1 bg-background rounded text-xs">←</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Aumentar fonte</span>
              <kbd className="px-2 py-1 bg-background rounded text-xs">+</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Diminuir fonte</span>
              <kbd className="px-2 py-1 bg-background rounded text-xs">-</kbd>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
