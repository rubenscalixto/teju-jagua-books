import { useEffect, useRef, useState, useCallback } from 'react'
import { useReaderStore, type ReadingTheme } from '../stores/readerStore'
import { useLibraryStore } from '../stores/libraryStore'
import { useHighlightsStore, exportHighlightsToMarkdown, type HighlightColor } from '../stores/highlightsStore'
import HighlightsPanel from '../components/HighlightsPanel'
import ReaderToolbar from '../components/ReaderToolbar'

interface ReaderProps {
  bookId: string
  onClose: () => void
}

export default function Reader({ bookId, onClose }: ReaderProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const renditionRef = useRef<any>(null)
  const bookRef = useRef<any>(null)
  
  const [toc, setToc] = useState<any[]>([])
  const [isReady, setIsReady] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showHighlights, setShowHighlights] = useState(false)
  
  const [toolbarVisible, setToolbarVisible] = useState(false)
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 })
  const [selectedText, setSelectedText] = useState('')
  const [selectedCfi, setSelectedCfi] = useState('')
  
  const [noteText, setNoteText] = useState('')
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [pendingHighlightColor, setPendingHighlightColor] = useState<HighlightColor>('yellow')
  
  const { theme, fontSize, fontFamily, showTOC, showSettings, setTheme, setFontSize, toggleTOC, toggleSettings } = useReaderStore()
  const { getBook, getProgress, updateProgress } = useLibraryStore()
  const { getHighlights, addHighlight, removeHighlight, togglePublic, updateHighlight } = useHighlightsStore()
  
  const bookData = getBook(bookId)
  const highlights = getHighlights(bookId)
  const bookmarks = highlights.filter(h => h.type === 'bookmark')
  
  useEffect(() => {
    let mounted = true
    
    const initReader = async () => {
      if (!bookData?.filePath) return
      
      try {
        const ePub = window.ePub
        if (!ePub) {
          console.error('ePub not loaded')
          return
        }
        
        const book = ePub(bookData.filePath)
        bookRef.current = book
        
        await book.ready
        
        if (!mounted) return
        
        const navigation = await book.loaded.navigation
        if (navigation?.toc) {
          setToc(navigation.toc)
        }
        
        const rendition = book.renderTo(containerRef.current, {
          width: '100%',
          height: '100%',
          spread: 'none'
        })
        renditionRef.current = rendition
        
        rendition.on('relocated', (location: any) => {
          if (!mounted) return
          
          const progressPercent = location.percentage
          if (progressPercent !== undefined) {
            setProgress(Math.round(progressPercent * 100))
            updateProgress(bookId, {
              currentLocation: location.start.cfi,
              percentage: Math.round(progressPercent * 100),
              lastReadAt: Date.now()
            })
          }
        })
        
        rendition.on('selected', (cfiRange: string, contents: any) => {
          if (!mounted) return
          
          const selection = window.getSelection()
          if (selection && selection.toString().trim()) {
            const text = selection.toString().trim()
            const range = selection.getRangeAt(0)
            const rect = range.getBoundingClientRect()
            
            setSelectedText(text)
            setSelectedCfi(cfiRange)
            setToolbarPosition({ x: rect.left + rect.width / 2, y: rect.top })
            setToolbarVisible(true)
          }
        })
        
        const savedProgress = getProgress(bookId)
        if (savedProgress?.currentLocation) {
          await rendition.display(savedProgress.currentLocation)
        } else {
          await rendition.display()
        }
        
        setIsReady(true)
      } catch (err) {
        console.error('Error initializing reader:', err)
      }
    }
    
    initReader()
    
    return () => {
      mounted = false
      if (renditionRef.current) {
        renditionRef.current.destroy()
      }
      if (bookRef.current) {
        bookRef.current.destroy()
      }
    }
  }, [bookId, bookData?.filePath])
  
  useEffect(() => {
    if (!renditionRef.current || !isReady) return
    
    const themes: Record<ReadingTheme, any> = {
      light: { body: { background: '#FFFFFF', color: '#1E293B' } },
      dark: { body: { background: '#0F172A', color: '#F1F5F9' } },
      sepia: { body: { background: '#FEF3C7', color: '#422006' } }
    }
    
    renditionRef.current.themes.register('current', themes[theme])
    renditionRef.current.themes.select('current')
  }, [theme, isReady])
  
  useEffect(() => {
    if (!renditionRef.current || !isReady) return
    renditionRef.current.themes.fontSize(`${fontSize}px`)
  }, [fontSize, isReady])
  
  useEffect(() => {
    if (!renditionRef.current || !isReady) return
    renditionRef.current.themes.font(fontFamily)
  }, [fontFamily, isReady])
  
  const handlePrev = useCallback(() => {
    renditionRef.current?.prev()
  }, [])
  
  const handleNext = useCallback(() => {
    renditionRef.current?.next()
  }, [])
  
  const handleChapterClick = useCallback((href: string) => {
    renditionRef.current?.display(href)
    toggleTOC()
  }, [])
  
  const handleHighlight = useCallback((color: HighlightColor) => {
    if (selectedText && selectedCfi) {
      addHighlight(bookId, selectedText, selectedCfi, color, false)
    }
    setToolbarVisible(false)
    setSelectedText('')
    setSelectedCfi('')
  }, [selectedText, selectedCfi, bookId, addHighlight])
  
  const handleBookmark = useCallback(() => {
    if (selectedText) {
      addHighlight(bookId, `🔖 Marcador: ${selectedText.substring(0, 50)}...`, selectedCfi || '', 'yellow', false)
    } else {
      const currentLocation = renditionRef.current?.currentLocation()
      if (currentLocation?.start?.cfi) {
        addHighlight(bookId, `🔖 Marcador na página atual`, currentLocation.start.cfi, 'yellow', false)
      }
    }
    setToolbarVisible(false)
    setSelectedText('')
  }, [selectedText, selectedCfi, bookId, addHighlight, renditionRef])
  
  const handleAddNote = useCallback(() => {
    setShowNoteModal(true)
  }, [])
  
  const handleSaveNote = useCallback(() => {
    if (selectedText && noteText.trim()) {
      const highlight = addHighlight(bookId, selectedText, selectedCfi, pendingHighlightColor, false)
      updateHighlight(bookId, highlight.id, {
        content: `${selectedText}\n\n📝 Nota: ${noteText}`
      })
    }
    setShowNoteModal(false)
    setNoteText('')
    setToolbarVisible(false)
    setSelectedText('')
    setSelectedCfi('')
  }, [selectedText, noteText, selectedCfi, bookId, pendingHighlightColor, addHighlight, updateHighlight])
  
  const handleCopy = useCallback(() => {
    if (selectedText) {
      navigator.clipboard.writeText(selectedText)
    }
    setToolbarVisible(false)
    setSelectedText('')
  }, [selectedText])
  
  const handleGoToHighlight = useCallback((location: string) => {
    if (location.startsWith('update:')) {
      const [, highlightId, color, content] = location.split(':')
      updateHighlight(bookId, highlightId, { 
        color: color as HighlightColor,
        content: decodeURIComponent(content)
      })
    } else {
      renditionRef.current?.display(location)
    }
  }, [bookId, renditionRef, updateHighlight])
  
  const handleDeleteHighlight = useCallback((highlightId: string) => {
    removeHighlight(bookId, highlightId)
  }, [bookId, removeHighlight])
  
  const handleTogglePublic = useCallback((highlightId: string) => {
    togglePublic(bookId, highlightId)
  }, [bookId, togglePublic])
  
  const handleExportHighlights = useCallback(() => {
    const markdown = exportHighlightsToMarkdown(bookData?.title || '', bookData?.author || '', highlights)
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${bookData?.title || 'highlights'}_highlights.md`
    a.click()
    URL.revokeObjectURL(url)
  }, [bookData, highlights])
  
  const themeStyles: Record<ReadingTheme, string> = {
    light: 'bg-white',
    dark: 'bg-[#0F172A]',
    sepia: 'bg-[#FEF3C7]'
  }
  
  if (!bookData) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <p className="text-text-muted">Livro não encontrado</p>
      </div>
    )
  }
  
  return (
    <div className={`fixed inset-0 ${themeStyles[theme]} flex flex-col`}>
      <div className="flex items-center justify-between p-4 border-b border-border/20">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          ← Voltar
        </button>
        
        <div className="flex-1 text-center">
          <h2 className="font-medium truncate mx-4">{bookData.title}</h2>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowHighlights(!showHighlights)}
            className={`p-2 rounded-lg transition-colors ${
              showHighlights ? 'bg-primary/20 text-primary' : 'hover:bg-black/10 dark:hover:bg-white/10'
            }`}
            title="Destaques"
          >
            🖍️
          </button>
          <button
            onClick={toggleTOC}
            className={`p-2 rounded-lg transition-colors ${
              showTOC ? 'bg-primary/20 text-primary' : 'hover:bg-black/10 dark:hover:bg-white/10'
            }`}
            title="Índice"
          >
            ☰
          </button>
          <button
            onClick={toggleSettings}
            className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            title="Configurações"
          >
            ⚙
          </button>
        </div>
      </div>
      
      <div 
        className="flex-1 relative overflow-hidden"
        onClick={() => setToolbarVisible(false)}
      >
        <div ref={containerRef} className="w-full h-full" />
        
        <div className="absolute inset-y-0 left-0 w-16 flex items-center">
          <button
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            className="w-full h-full flex items-center justify-start pl-4 opacity-30 hover:opacity-100 transition-opacity text-4xl"
          >
            ‹
          </button>
        </div>
        <div className="absolute inset-y-0 right-0 w-16 flex items-center">
          <button
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className="w-full h-full flex items-center justify-end pr-4 opacity-30 hover:opacity-100 transition-opacity text-4xl"
          >
            ›
          </button>
        </div>
      </div>
      
      <div className="p-3 border-t border-border/20">
        <div className="flex items-center justify-between text-sm">
          <span className="opacity-60">{progress}%</span>
          <div className="flex-1 mx-4 h-1.5 bg-black/20 dark:bg-white/20 rounded-full">
            <div 
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="opacity-60">{bookmarks.length} 🔖</span>
        </div>
      </div>
      
      <ReaderToolbar
        isVisible={toolbarVisible}
        position={toolbarPosition}
        onHighlight={handleHighlight}
        onBookmark={handleBookmark}
        onNote={handleAddNote}
        onCopy={handleCopy}
      />
      
      {showTOC && (
        <div className="absolute inset-y-0 left-0 w-72 bg-surface border-r border-border shadow-xl z-50 overflow-y-auto">
          <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-surface">
            <h3 className="font-bold">Índice</h3>
            <button onClick={toggleTOC} className="text-text-muted hover:text-text">×</button>
          </div>
          <nav className="p-2">
            {toc.map((item, index) => (
              <button
                key={index}
                onClick={() => handleChapterClick(item.href)}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-background/50 transition-colors"
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      )}
      
      {showHighlights && (
        <HighlightsPanel
          book={bookData}
          highlights={highlights}
          onHighlightClick={handleGoToHighlight}
          onDeleteHighlight={handleDeleteHighlight}
          onTogglePublic={handleTogglePublic}
          onExport={handleExportHighlights}
          onClose={() => setShowHighlights(false)}
        />
      )}
      
      {showSettings && (
        <div className="absolute inset-y-0 right-0 w-72 bg-surface border-l border-border shadow-xl z-50 overflow-y-auto">
          <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-surface">
            <h3 className="font-bold">Configurações</h3>
            <button onClick={toggleSettings} className="text-text-muted hover:text-text">×</button>
          </div>
          
          <div className="p-4 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Tema</label>
              <div className="flex gap-2">
                {(['light', 'dark', 'sepia'] as ReadingTheme[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`flex-1 py-3 px-2 rounded-lg border transition-colors ${
                      theme === t 
                        ? 'border-primary bg-primary/20' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <span className={`block w-8 h-8 mx-auto rounded-full ${
                      t === 'light' ? 'bg-white border' : 
                      t === 'dark' ? 'bg-[#0F172A]' : 'bg-[#FEF3C7]'
                    }`} />
                    <span className="block text-xs mt-2 capitalize">{t}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Tamanho da fonte: {fontSize}px
              </label>
              <input
                type="range"
                min="12"
                max="32"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Fonte</label>
              <select
                value={fontFamily}
                onChange={(e) => useReaderStore.getState().setFontFamily(e.target.value)}
                className="w-full px-3 py-2 bg-background rounded-lg border border-border"
              >
                <option value="Georgia">Georgia</option>
                <option value="Merriweather">Merriweather</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Roboto">Roboto</option>
                <option value="Times New Roman">Times New Roman</option>
              </select>
            </div>
          </div>
        </div>
      )}
      
      {showNoteModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]"
          onClick={() => setShowNoteModal(false)}
        >
          <div 
            className="bg-surface rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-lg mb-4">Adicionar Nota</h3>
            
            {selectedText && (
              <div className="mb-4 p-3 bg-background rounded-lg text-sm">
                <p className="text-text-muted mb-1">Texto selecionado:</p>
                <p className="italic">"{selectedText.substring(0, 100)}..."</p>
              </div>
            )}
            
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Escreva sua nota aqui..."
              className="w-full h-32 p-3 bg-background rounded-lg border border-border resize-none"
              autoFocus
            />
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowNoteModal(false)}
                className="flex-1 py-2 px-4 border border-border rounded-lg hover:bg-background/50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveNote}
                disabled={!noteText.trim()}
                className="flex-1 py-2 px-4 bg-primary hover:bg-primary-light rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
