import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Book, ReadingProgress } from '../types'

interface LibraryState {
  books: Book[]
  readingProgress: Record<string, ReadingProgress>
  isLoading: boolean
  error: string | null
  
  addBook: (book: Book) => void
  removeBook: (bookId: string) => void
  updateBook: (bookId: string, updates: Partial<Book>) => void
  getBook: (bookId: string) => Book | undefined
  
  updateProgress: (bookId: string, progress: Partial<ReadingProgress>) => void
  getProgress: (bookId: string) => ReadingProgress | undefined
  
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      books: [],
      readingProgress: {},
      isLoading: false,
      error: null,
      
      addBook: (book) => {
        const exists = get().books.some(b => b.filePath === book.filePath)
        if (exists) {
          set({ error: 'Este livro já está na biblioteca' })
          return
        }
        set((state) => ({
          books: [...state.books, book],
          error: null
        }))
      },
      
      removeBook: (bookId) => {
        set((state) => ({
          books: state.books.filter(b => b.id !== bookId),
          readingProgress: Object.fromEntries(
            Object.entries(state.readingProgress).filter(([key]) => key !== bookId)
          )
        }))
      },
      
      updateBook: (bookId, updates) => {
        set((state) => ({
          books: state.books.map(b =>
            b.id === bookId ? { ...b, ...updates } : b
          )
        }))
      },
      
      getBook: (bookId) => {
        return get().books.find(b => b.id === bookId)
      },
      
      updateProgress: (bookId, progress) => {
        set((state) => ({
          readingProgress: {
            ...state.readingProgress,
            [bookId]: {
              bookId,
              currentLocation: progress.currentLocation ?? state.readingProgress[bookId]?.currentLocation ?? '',
              percentage: progress.percentage ?? state.readingProgress[bookId]?.percentage ?? 0,
              totalTimeSpent: progress.totalTimeSpent ?? state.readingProgress[bookId]?.totalTimeSpent ?? 0,
              lastReadAt: Date.now()
            }
          }
        }))
      },
      
      getProgress: (bookId) => {
        return get().readingProgress[bookId]
      },
      
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error })
    }),
    {
      name: 'teju-jagua-library'
    }
  )
)
