import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ReadingTheme = 'light' | 'dark' | 'sepia'

interface ReaderState {
  currentBookId: string | null
  theme: ReadingTheme
  fontSize: number
  fontFamily: string
  showTOC: boolean
  showSettings: boolean
  
  setCurrentBook: (bookId: string | null) => void
  setTheme: (theme: ReadingTheme) => void
  setFontSize: (size: number) => void
  setFontFamily: (family: string) => void
  toggleTOC: () => void
  toggleSettings: () => void
}

export const useReaderStore = create<ReaderState>()(
  persist(
    (set) => ({
      currentBookId: null,
      theme: 'dark',
      fontSize: 16,
      fontFamily: 'Georgia',
      showTOC: false,
      showSettings: false,
      
      setCurrentBook: (bookId) => set({ currentBookId: bookId }),
      setTheme: (theme) => set({ theme }),
      setFontSize: (size) => set({ fontSize: Math.max(12, Math.min(32, size)) }),
      setFontFamily: (family) => set({ fontFamily: family }),
      toggleTOC: () => set((state) => ({ showTOC: !state.showTOC })),
      toggleSettings: () => set((state) => ({ showSettings: !state.showSettings }))
    }),
    {
      name: 'teju-jagua-reader'
    }
  )
)
