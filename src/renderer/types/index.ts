export interface ElectronAPI {
  openFileDialog: () => Promise<string[]>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export interface Book {
  id: string
  filePath: string
  fileType: 'epub' | 'pdf'
  title: string
  author: string
  coverUrl?: string
  description?: string
  isbn?: string
  addedAt: number
  lastOpenedAt?: number
}

export interface ReadingProgress {
  bookId: string
  currentLocation: string
  percentage: number
  totalTimeSpent: number
  lastReadAt: number
}

export interface Highlight {
  id: string
  bookId: string
  type: 'highlight' | 'note' | 'bookmark'
  content: string
  location: string
  color?: 'yellow' | 'green' | 'blue' | 'pink'
  isPublic: boolean
  createdAt: number
}
