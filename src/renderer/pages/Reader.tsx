import { useEffect, useRef, useState } from 'react'
import { useReaderStore, type ReadingTheme } from '../stores/readerStore'
import { useLibraryStore } from '../stores/libraryStore'

interface ReaderProps {
  bookId: string
  onClose: () => void
}

export default function Reader({ bookId, onClose }: ReaderProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const renditionRef = useRef<any>(null)
  const bookRef = useRef<any>(null)
  const [book, setBook] = useState<any>(null)
  const [toc, setToc] = useState<any[]>([])
  const [isReady, setIsReady] = useState(false)
  const [currentLocation, setCurrentLocation] = useState('')
  const [progress, setProgress] = useState(0)
  
  const { theme, fontSize, fontFamily, showTOC, showSettings, setTheme, setFontSize, toggleTOC, toggleSettings } = useReaderStore()
  const { getBook, getProgress, updateProgress } = useLibraryStore()
  
  const bookData = getBook(bookId)
  const savedProgress = getProgress(bookId)
  
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
          setCurrentLocation(location.start.cfi || '')
          
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
      light: {
        body: { background: '#FFFFFF', color: '#1E293B' }
      },
      dark: {
        body: { background: '#0F172A', color: '#F1F5F9' }
      },
      sepia: {
        body: { background: '#FEF3C7', color: '#422006' }
      }
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
  
  const handlePrev = () => {
    renditionRef.current?.prev()
  }
  
  const handleNext = () => {
    renditionRef.current?.next()
  }
  
  const handleChapterClick = (href: string) => {
    renditionRef.current?.display(href)
    toggleTOC()
  }
  
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
            onClick={toggleTOC}
            className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
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
      
      <div className="flex-1 relative overflow-hidden">
        <div ref={containerRef} className="w-full h-full" />
        
        <div className="absolute inset-y-0 left-0 w-12 flex items-center">
          <button
            onClick={handlePrev}
            className="w-full h-full flex items-center justify-start pl-2 opacity-0 hover:opacity-100 transition-opacity"
          >
            ‹
          </button>
        </div>
        <div className="absolute inset-y-0 right-0 w-12 flex items-center">
          <button
            onClick={handleNext}
            className="w-full h-full flex items-center justify-end pr-2 opacity-0 hover:opacity-100 transition-opacity"
          >
            ›
          </button>
        </div>
      </div>
      
      <div className="p-4 border-t border-border/20">
        <div className="flex items-center justify-between text-sm">
          <span className="opacity-60">{progress}%</span>
          <div className="flex-1 mx-4 h-1 bg-black/20 dark:bg-white/20 rounded-full">
            <div 
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="opacity-60">{bookData.title}</span>
        </div>
      </div>
      
      {showTOC && (
        <div className="absolute inset-y-0 left-0 w-64 bg-surface border-r border-border shadow-xl z-50 overflow-y-auto">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-bold">Índice</h3>
            <button onClick={toggleTOC} className="text-text-muted hover:text-text">×</button>
          </div>
          <nav className="p-2">
            {toc.map((item, index) => (
              <button
                key={index}
                onClick={() => handleChapterClick(item.href)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-background/50 transition-colors"
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      )}
      
      {showSettings && (
        <div className="absolute inset-y-0 right-0 w-72 bg-surface border-l border-border shadow-xl z-50 overflow-y-auto">
          <div className="p-4 border-b border-border flex items-center justify-between">
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
                    className={`flex-1 py-2 px-3 rounded-lg border transition-colors ${
                      theme === t 
                        ? 'border-primary bg-primary/20' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <span className={`block w-6 h-6 mx-auto rounded-full ${
                      t === 'light' ? 'bg-white border" ' : 
                      t === 'dark' ? 'bg-[#0F172A]' : 'bg-[#FEF3C7]'
                    }`} />
                    <span className="block text-xs mt-1 capitalize">{t}</span>
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
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Fonte</label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
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
    </div>
  )
}

declare global {
  interface Window {
    ePub: any
  }
}
