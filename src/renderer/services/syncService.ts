import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore'
import { db } from './firebase'
import type { ReadingProgress, Highlight } from '../types'

interface SyncState {
  isSyncing: boolean
  lastSyncAt: Date | null
  pendingChanges: number
  error: string | null
}

class SyncService {
  private unsubscribers: Map<string, () => void> = new Map()
  private progressListeners: Map<string, () => void> = new Map()
  private highlightsListeners: Map<string, () => void> = new Map()
  
  async syncProgress(
    userId: string,
    bookId: string,
    progress: ReadingProgress,
    onConflict?: (local: ReadingProgress, remote: ReadingProgress) => ReadingProgress
  ): Promise<void> {
    try {
      const progressRef = doc(db, 'users', userId, 'progress', bookId)
      const remoteSnap = await getDoc(progressRef)
      
      if (remoteSnap.exists()) {
        const remoteData = remoteSnap.data() as ReadingProgress & { updatedAt: any }
        
        if (onConflict && remoteData.lastReadAt > progress.lastReadAt) {
          const resolved = onConflict(progress, {
            ...remoteData,
            lastReadAt: remoteData.updatedAt?.toDate?.()?.getTime() || remoteData.lastReadAt
          })
          await setDoc(progressRef, {
            ...resolved,
            updatedAt: serverTimestamp()
          })
        } else {
          await setDoc(progressRef, {
            ...progress,
            updatedAt: serverTimestamp()
          })
        }
      } else {
        await setDoc(progressRef, {
          ...progress,
          updatedAt: serverTimestamp()
        })
      }
    } catch (err) {
      console.error('Error syncing progress:', err)
      throw err
    }
  }
  
  async syncAllProgress(
    userId: string,
    localProgress: Record<string, ReadingProgress>
  ): Promise<Record<string, ReadingProgress>> {
    try {
      const batch = writeBatch(db)
      const now = serverTimestamp()
      
      Object.entries(localProgress).forEach(([bookId, progress]) => {
        const progressRef = doc(db, 'users', userId, 'progress', bookId)
        batch.set(progressRef, {
          ...progress,
          updatedAt: now
        }, { merge: true })
      })
      
      await batch.commit()
      
      const merged: Record<string, ReadingProgress> = { ...localProgress }
      return merged
    } catch (err) {
      console.error('Error syncing all progress:', err)
      throw err
    }
  }
  
  async fetchRemoteProgress(userId: string): Promise<Record<string, ReadingProgress>> {
    try {
      const progressRefs = await import('firebase/firestore').then(m => 
        m.collection(db, 'users', userId, 'progress')
      )
      
      const { getDocs, collection } = await import('firebase/firestore')
      const snapshot = await getDocs(collection(db, 'users', userId, 'progress'))
      
      const remoteProgress: Record<string, ReadingProgress> = {}
      snapshot.docs.forEach(doc => {
        const data = doc.data()
        remoteProgress[doc.id] = {
          bookId: doc.id,
          currentLocation: data.currentLocation || '',
          percentage: data.percentage || 0,
          totalTimeSpent: data.totalTimeSpent || 0,
          lastReadAt: data.updatedAt?.toDate?.()?.getTime() || data.lastReadAt || Date.now()
        }
      })
      
      return remoteProgress
    } catch (err) {
      console.error('Error fetching remote progress:', err)
      return {}
    }
  }
  
  subscribeToProgress(
    userId: string,
    bookId: string,
    onUpdate: (progress: ReadingProgress) => void
  ): () => void {
    const key = `${userId}:${bookId}`
    
    if (this.progressListeners.has(key)) {
      this.progressListeners.get(key)?.()
    }
    
    const progressRef = doc(db, 'users', userId, 'progress', bookId)
    const unsubscribe = onSnapshot(progressRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        onUpdate({
          bookId,
          currentLocation: data.currentLocation || '',
          percentage: data.percentage || 0,
          totalTimeSpent: data.totalTimeSpent || 0,
          lastReadAt: data.updatedAt?.toDate?.()?.getTime() || Date.now()
        })
      }
    })
    
    this.progressListeners.set(key, unsubscribe)
    
    return () => {
      unsubscribe()
      this.progressListeners.delete(key)
    }
  }
  
  async syncHighlights(
    userId: string,
    bookId: string,
    highlights: Highlight[]
  ): Promise<void> {
    try {
      const highlightsRef = doc(db, 'users', userId, 'highlights', bookId)
      await setDoc(highlightsRef, {
        highlights,
        updatedAt: serverTimestamp()
      }, { merge: true })
    } catch (err) {
      console.error('Error syncing highlights:', err)
      throw err
    }
  }
  
  async fetchRemoteHighlights(userId: string): Promise<Record<string, Highlight[]>> {
    try {
      const { getDocs, collection } = await import('firebase/firestore')
      const snapshot = await getDocs(collection(db, 'users', userId, 'highlights'))
      
      const remoteHighlights: Record<string, Highlight[]> = {}
      snapshot.docs.forEach(doc => {
        const data = doc.data()
        remoteHighlights[doc.id] = data.highlights || []
      })
      
      return remoteHighlights
    } catch (err) {
      console.error('Error fetching remote highlights:', err)
      return {}
    }
  }
  
  subscribeToHighlights(
    userId: string,
    bookId: string,
    onUpdate: (highlights: Highlight[]) => void
  ): () => void {
    const key = `highlights:${userId}:${bookId}`
    
    if (this.highlightsListeners.has(key)) {
      this.highlightsListeners.get(key)?.()
    }
    
    const highlightsRef = doc(db, 'users', userId, 'highlights', bookId)
    const unsubscribe = onSnapshot(highlightsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        onUpdate(data.highlights || [])
      }
    })
    
    this.highlightsListeners.set(key, unsubscribe)
    
    return () => {
      unsubscribe()
      this.highlightsListeners.delete(key)
    }
  }
  
  async mergeHighlights(
    localHighlights: Highlight[],
    remoteHighlights: Highlight[]
  ): Promise<Highlight[]> {
    const merged = new Map<string, Highlight>()
    
    remoteHighlights.forEach(h => {
      merged.set(h.id, h)
    })
    
    localHighlights.forEach(local => {
      const existing = merged.get(local.id)
      if (!existing || local.createdAt > (existing.createdAt || 0)) {
        merged.set(local.id, local)
      }
    })
    
    return Array.from(merged.values())
  }
  
  unsubscribeAll(): void {
    this.progressListeners.forEach(unsubscribe => unsubscribe())
    this.highlightsListeners.forEach(unsubscribe => unsubscribe())
    this.progressListeners.clear()
    this.highlightsListeners.clear()
  }
}

export const syncService = new SyncService()
