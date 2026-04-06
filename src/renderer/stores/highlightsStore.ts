import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { Highlight } from '../types'

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink'

interface HighlightsState {
  highlights: Record<string, Highlight[]>
  
  addHighlight: (
    bookId: string,
    content: string,
    location: string,
    color?: HighlightColor,
    isPublic?: boolean
  ) => Highlight
  
  removeHighlight: (bookId: string, highlightId: string) => void
  
  updateHighlight: (bookId: string, highlightId: string, updates: Partial<Highlight>) => void
  
  getHighlights: (bookId: string) => Highlight[]
  
  getAllHighlights: () => Highlight[]
  
  addNote: (bookId: string, highlightId: string, note: string) => void
  
  togglePublic: (bookId: string, highlightId: string) => void
  
  clearBookHighlights: (bookId: string) => void
}

export const useHighlightsStore = create<HighlightsState>()(
  persist(
    (set, get) => ({
      highlights: {},
      
      addHighlight: (bookId, content, location, color = 'yellow', isPublic = false) => {
        const highlight: Highlight = {
          id: uuidv4(),
          bookId,
          type: 'highlight',
          content,
          location,
          color,
          isPublic,
          createdAt: Date.now()
        }
        
        set((state) => ({
          highlights: {
            ...state.highlights,
            [bookId]: [...(state.highlights[bookId] || []), highlight]
          }
        }))
        
        return highlight
      },
      
      removeHighlight: (bookId, highlightId) => {
        set((state) => ({
          highlights: {
            ...state.highlights,
            [bookId]: (state.highlights[bookId] || []).filter(h => h.id !== highlightId)
          }
        }))
      },
      
      updateHighlight: (bookId, highlightId, updates) => {
        set((state) => ({
          highlights: {
            ...state.highlights,
            [bookId]: (state.highlights[bookId] || []).map(h =>
              h.id === highlightId ? { ...h, ...updates } : h
            )
          }
        }))
      },
      
      getHighlights: (bookId) => {
        return get().highlights[bookId] || []
      },
      
      getAllHighlights: () => {
        return Object.values(get().highlights).flat()
      },
      
      addNote: (bookId, highlightId, note) => {
        set((state) => ({
          highlights: {
            ...state.highlights,
            [bookId]: (state.highlights[bookId] || []).map(h =>
              h.id === highlightId ? { ...h, content: h.content + `\n\n📝 Nota: ${note}` } : h
            )
          }
        }))
      },
      
      togglePublic: (bookId, highlightId) => {
        set((state) => ({
          highlights: {
            ...state.highlights,
            [bookId]: (state.highlights[bookId] || []).map(h =>
              h.id === highlightId ? { ...h, isPublic: !h.isPublic } : h
            )
          }
        }))
      },
      
      clearBookHighlights: (bookId) => {
        set((state) => {
          const { [bookId]: _, ...rest } = state.highlights
          return { highlights: rest }
        })
      }
    }),
    {
      name: 'teju-jagua-highlights'
    }
  )
)

export function exportHighlightsToMarkdown(
  bookTitle: string,
  bookAuthor: string,
  highlights: Highlight[]
): string {
  const sortedHighlights = [...highlights].sort((a, b) => a.location.localeCompare(b.location))
  
  let markdown = `# ${bookTitle}\n`
  markdown += `**Autor:** ${bookAuthor}\n\n`
  markdown += `## Destaques e Notas\n\n`
  markdown += `*Exportado em ${new Date().toLocaleDateString('pt-BR')}*\n\n`
  markdown += `---\n\n`
  
  sortedHighlights.forEach((h, index) => {
    const colorEmoji = {
      yellow: '🟡',
      green: '🟢',
      blue: '🔵',
      pink: '🩷'
    }
    
    markdown += `### ${colorEmoji[h.color || 'yellow']} Destaque ${index + 1}\n\n`
    markdown += `> ${h.content}\n\n`
    
    if (h.isPublic) {
      markdown += `*📢 Compartilhado com amigos*\n\n`
    }
    
    markdown += `---\n\n`
  })
  
  markdown += `\n\n*Total: ${highlights.length} destaques*\n`
  
  return markdown
}
