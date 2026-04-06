import { useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useLibraryStore } from '../stores/libraryStore'
import { useHighlightsStore } from '../stores/highlightsStore'
import { syncService } from '../services/syncService'

export function useSync() {
  const { user } = useAuthStore()
  const { readingProgress, updateProgress } = useLibraryStore()
  const { highlights, getAllHighlights } = useHighlightsStore()
  
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSyncRef = useRef<number>(0)
  
  const syncProgress = useCallback(async () => {
    if (!user) return
    
    try {
      await syncService.syncAllProgress(user.uid, readingProgress)
      lastSyncRef.current = Date.now()
    } catch (err) {
      console.error('Sync error:', err)
    }
  }, [user, readingProgress])
  
  const syncHighlights = useCallback(async () => {
    if (!user) return
    
    const allHighlights = getAllHighlights()
    const highlightsByBook: Record<string, typeof allHighlights> = {}
    
    allHighlights.forEach(h => {
      if (!highlightsByBook[h.bookId]) {
        highlightsByBook[h.bookId] = []
      }
      highlightsByBook[h.bookId].push(h)
    })
    
    try {
      await Promise.all(
        Object.entries(highlightsByBook).map(([bookId, bookHighlights]) =>
          syncService.syncHighlights(user.uid, bookId, bookHighlights)
        )
      )
    } catch (err) {
      console.error('Sync highlights error:', err)
    }
  }, [user, highlights])
  
  const debouncedSync = useCallback((syncFn: () => Promise<void>) => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }
    
    syncTimeoutRef.current = setTimeout(() => {
      syncFn()
    }, 2000)
  }, [])
  
  useEffect(() => {
    if (!user) return
    
    syncProgress()
    syncHighlights()
    
    const handleOnline = () => {
      syncProgress()
      syncHighlights()
    }
    
    window.addEventListener('online', handleOnline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
      syncService.unsubscribeAll()
    }
  }, [user])
  
  useEffect(() => {
    if (!user || Object.keys(readingProgress).length === 0) return
    debouncedSync(syncProgress)
  }, [readingProgress, user, debouncedSync])
  
  useEffect(() => {
    if (!user || highlights.length === 0) return
    debouncedSync(syncHighlights)
  }, [highlights, user, debouncedSync])
  
  const forceSync = useCallback(async () => {
    await syncProgress()
    await syncHighlights()
  }, [syncProgress, syncHighlights])
  
  return {
    forceSync,
    lastSync: lastSyncRef.current ? new Date(lastSyncRef.current) : null,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true
  }
}
