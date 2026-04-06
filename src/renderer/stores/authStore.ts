import { create } from 'zustand'
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, googleProvider, db } from '../services/firebase'

export interface UserProfile {
  uid: string
  displayName: string
  email: string
  photoURL?: string
  currentlyReading: string[]
  recentlyFinished: string[]
  totalBooksRead: number
  totalPagesRead: number
  friends: string[]
  bio?: string
  createdAt: Date
}

interface AuthState {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  error: string | null
  isInitialized: boolean
  
  initialize: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>
  logOut: () => Promise<void>
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>
  setCurrentlyReading: (bookId: string | null) => Promise<void>
  addFriend: (friendId: string) => Promise<void>
  removeFriend: (friendId: string) => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: false,
  error: null,
  isInitialized: false,
  
  initialize: async () => {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          set({ user })
          await get().loadProfile(user.uid)
        } else {
          set({ user: null, profile: null })
        }
        set({ isInitialized: true })
        resolve()
      })
    })
  },
  
  signInWithGoogle: async () => {
    set({ isLoading: true, error: null })
    try {
      const result = await signInWithPopup(auth, googleProvider)
      set({ user: result.user })
      
      const profileRef = doc(db, 'users', result.user.uid)
      const profileSnap = await getDoc(profileRef)
      
      if (!profileSnap.exists()) {
        await setDoc(profileRef, {
          uid: result.user.uid,
          displayName: result.user.displayName || 'Usuário',
          email: result.user.email,
          photoURL: result.user.photoURL || null,
          currentlyReading: [],
          recentlyFinished: [],
          totalBooksRead: 0,
          totalPagesRead: 0,
          friends: [],
          createdAt: serverTimestamp()
        })
      }
      
      await get().loadProfile(result.user.uid)
    } catch (err: any) {
      set({ error: err.message || 'Erro ao fazer login com Google' })
    } finally {
      set({ isLoading: false })
    }
  },
  
  signInWithEmail: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      set({ user: result.user })
      await get().loadProfile(result.user.uid)
    } catch (err: any) {
      const errorMessage = err.code === 'auth/invalid-credential'
        ? 'Email ou senha incorretos'
        : err.message || 'Erro ao fazer login'
      set({ error: errorMessage })
    } finally {
      set({ isLoading: false })
    }
  },
  
  signUpWithEmail: async (email, password, displayName) => {
    set({ isLoading: true, error: null })
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      
      await updateProfile(result.user, { displayName })
      
      const profileRef = doc(db, 'users', result.user.uid)
      await setDoc(profileRef, {
        uid: result.user.uid,
        displayName,
        email,
        photoURL: null,
        currentlyReading: [],
        recentlyFinished: [],
        totalBooksRead: 0,
        totalPagesRead: 0,
        friends: [],
        createdAt: serverTimestamp()
      })
      
      set({ user: result.user })
      await get().loadProfile(result.user.uid)
    } catch (err: any) {
      let errorMessage = err.message || 'Erro ao criar conta'
      
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Este email já está cadastrado'
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'A senha deve ter pelo menos 6 caracteres'
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido'
      }
      
      set({ error: errorMessage })
    } finally {
      set({ isLoading: false })
    }
  },
  
  logOut: async () => {
    set({ isLoading: true })
    try {
      await signOut(auth)
      set({ user: null, profile: null })
    } catch (err: any) {
      set({ error: err.message })
    } finally {
      set({ isLoading: false })
    }
  },
  
  loadProfile: async (uid: string) => {
    try {
      const profileRef = doc(db, 'users', uid)
      const profileSnap = await getDoc(profileRef)
      
      if (profileSnap.exists()) {
        const data = profileSnap.data()
        set({
          profile: {
            ...data,
            createdAt: data.createdAt?.toDate() || new Date()
          } as UserProfile
        })
      }
    } catch (err) {
      console.error('Error loading profile:', err)
    }
  },
  
  updateUserProfile: async (updates) => {
    const { user } = get()
    if (!user) return
    
    set({ isLoading: true })
    try {
      const profileRef = doc(db, 'users', user.uid)
      await updateDoc(profileRef, updates)
      await get().loadProfile(user.uid)
    } catch (err: any) {
      set({ error: err.message })
    } finally {
      set({ isLoading: false })
    }
  },
  
  setCurrentlyReading: async (bookId) => {
    const { user, profile } = get()
    if (!user || !profile) return
    
    try {
      const profileRef = doc(db, 'users', user.uid)
      
      if (bookId) {
        const currentBooks = profile.currentlyReading.filter(id => id !== bookId)
        await updateDoc(profileRef, {
          currentlyReading: [...currentBooks, bookId]
        })
      }
      
      await get().loadProfile(user.uid)
    } catch (err) {
      console.error('Error updating currently reading:', err)
    }
  },
  
  addFriend: async (friendId) => {
    const { user, profile } = get()
    if (!user || !profile) return
    
    try {
      const profileRef = doc(db, 'users', user.uid)
      const friends = [...new Set([...profile.friends, friendId])]
      await updateDoc(profileRef, { friends })
      await get().loadProfile(user.uid)
    } catch (err) {
      console.error('Error adding friend:', err)
    }
  },
  
  removeFriend: async (friendId) => {
    const { user, profile } = get()
    if (!user || !profile) return
    
    try {
      const profileRef = doc(db, 'users', user.uid)
      const friends = profile.friends.filter(id => id !== friendId)
      await updateDoc(profileRef, { friends })
      await get().loadProfile(user.uid)
    } catch (err) {
      console.error('Error removing friend:', err)
    }
  },
  
  clearError: () => set({ error: null })
}))
