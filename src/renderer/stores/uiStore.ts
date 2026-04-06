import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Language } from '../services/i18n'

interface UIState {
  language: Language
  syncEnabled: boolean
  syncStatus: 'idle' | 'syncing' | 'error' | 'success'
  lastSyncAt: number | null
  showSyncIndicator: boolean
  
  setLanguage: (lang: Language) => void
  setSyncEnabled: (enabled: boolean) => void
  setSyncStatus: (status: 'idle' | 'syncing' | 'error' | 'success') => void
  setLastSyncAt: (time: number) => void
  setShowSyncIndicator: (show: boolean) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      language: 'pt-BR',
      syncEnabled: true,
      syncStatus: 'idle',
      lastSyncAt: null,
      showSyncIndicator: false,
      
      setLanguage: (language) => set({ language }),
      setSyncEnabled: (syncEnabled) => set({ syncEnabled }),
      setSyncStatus: (syncStatus) => set({ syncStatus }),
      setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),
      setShowSyncIndicator: (showSyncIndicator) => set({ showSyncIndicator })
    }),
    {
      name: 'teju-jagua-ui'
    }
  )
)
