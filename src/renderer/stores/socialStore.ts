import { create } from 'zustand'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  limit
} from 'firebase/firestore'
import { db } from '../services/firebase'
import type { UserProfile } from './authStore'

export interface Activity {
  id: string
  userId: string
  userName: string
  userPhoto?: string
  type: 'started_reading' | 'finished' | 'highlight' | 'added_friend' | 'joined'
  bookId?: string
  bookTitle?: string
  bookAuthor?: string
  bookCover?: string
  highlightContent?: string
  friendId?: string
  friendName?: string
  createdAt: Date
}

interface SocialState {
  activities: Activity[]
  friends: UserProfile[]
  friendRequests: { id: string; from: UserProfile }[]
  isLoading: boolean
  unsubscribeActivities: (() => void) | null
  unsubscribeFriends: (() => void) | null
  
  subscribeToActivities: (userId: string, friendIds: string[]) => void
  unsubscribeAll: () => void
  fetchFriends: (friendIds: string[]) => Promise<void>
  addActivity: (userId: string, userName: string, userPhoto: string | undefined, activity: Omit<Activity, 'id' | 'userId' | 'userName' | 'userPhoto' | 'createdAt'>) => Promise<void>
  searchUsers: (searchTerm: string) => Promise<UserProfile[]>
  sendFriendRequest: (fromUserId: string, toUserId: string, toUserEmail: string) => Promise<void>
  acceptFriendRequest: (requestId: string, fromUserId: string, toUserId: string) => Promise<void>
  declineFriendRequest: (requestId: string) => Promise<void>
  subscribeToFriendRequests: (userId: string) => void
}

export const useSocialStore = create<SocialState>((set, get) => ({
  activities: [],
  friends: [],
  friendRequests: [],
  isLoading: false,
  unsubscribeActivities: null,
  unsubscribeFriends: null,
  
  subscribeToActivities: (userId, friendIds) => {
    const { unsubscribeActivities } = get()
    if (unsubscribeActivities) {
      unsubscribeActivities()
    }
    
    const allUserIds = [userId, ...friendIds]
    
    const activitiesQuery = query(
      collection(db, 'activities'),
      where('userId', 'in', allUserIds.length <= 10 ? allUserIds : [userId]),
      orderBy('createdAt', 'desc'),
      limit(50)
    )
    
    const unsubscribe = onSnapshot(activitiesQuery, (snapshot) => {
      const activities: Activity[] = snapshot.docs
        .map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date()
          } as Activity
        })
        .filter(a => allUserIds.includes(a.userId))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      
      set({ activities })
    })
    
    set({ unsubscribeActivities: unsubscribe })
  },
  
  unsubscribeAll: () => {
    const { unsubscribeActivities, unsubscribeFriends } = get()
    if (unsubscribeActivities) {
      unsubscribeActivities()
    }
    if (unsubscribeFriends) {
      unsubscribeFriends()
    }
    set({ unsubscribeActivities: null, unsubscribeFriends: null, activities: [], friends: [] })
  },
  
  fetchFriends: async (friendIds) => {
    if (friendIds.length === 0) {
      set({ friends: [] })
      return
    }
    
    set({ isLoading: true })
    try {
      const friendsPromises = friendIds.map(async (id) => {
        const userDoc = await getDoc(doc(db, 'users', id))
        if (userDoc.exists()) {
          const data = userDoc.data()
          return {
            ...data,
            createdAt: data.createdAt?.toDate() || new Date()
          } as UserProfile
        }
        return null
      })
      
      const friends = (await Promise.all(friendsPromises)).filter(Boolean) as UserProfile[]
      set({ friends })
    } catch (err) {
      console.error('Error fetching friends:', err)
    } finally {
      set({ isLoading: false })
    }
  },
  
  addActivity: async (userId, userName, userPhoto, activity) => {
    try {
      await addDoc(collection(db, 'activities'), {
        userId,
        userName,
        userPhoto,
        ...activity,
        createdAt: serverTimestamp()
      })
    } catch (err) {
      console.error('Error adding activity:', err)
    }
  },
  
  searchUsers: async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 3) return []
    
    try {
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('displayName'),
        limit(20)
      )
      
      const snapshot = await getDocs(usersQuery)
      const users = snapshot.docs
        .map(doc => {
          const data = doc.data()
          return {
            ...data,
            createdAt: data.createdAt?.toDate() || new Date()
          } as UserProfile
        })
        .filter(user => 
          user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
      
      return users
    } catch (err) {
      console.error('Error searching users:', err)
      return []
    }
  },
  
  sendFriendRequest: async (fromUserId, toUserId, toUserEmail) => {
    try {
      const requestsRef = collection(db, 'friendRequests')
      
      const existingQuery = query(
        requestsRef,
        where('toUserId', '==', toUserId),
        where('fromUserId', '==', fromUserId),
        where('status', '==', 'pending')
      )
      
      const existing = await getDocs(existingQuery)
      if (!existing.empty) {
        throw new Error('Solicitação já enviada')
      }
      
      const fromUserDoc = await getDoc(doc(db, 'users', fromUserId))
      const fromUser = fromUserDoc.data()
      
      await addDoc(collection(db, 'friendRequests'), {
        fromUserId,
        fromUserName: fromUser?.displayName || 'Usuário',
        fromUserPhoto: fromUser?.photoURL || null,
        toUserId,
        toUserEmail,
        status: 'pending',
        createdAt: serverTimestamp()
      })
    } catch (err) {
      console.error('Error sending friend request:', err)
      throw err
    }
  },
  
  acceptFriendRequest: async (requestId, fromUserId, toUserId) => {
    try {
      const requestRef = doc(db, 'friendRequests', requestId)
      
      await updateDoc(requestRef, { status: 'accepted' })
      
      const fromUserRef = doc(db, 'users', fromUserId)
      const toUserRef = doc(db, 'users', toUserId)
      
      await updateDoc(fromUserRef, {
        friends: arrayUnion(toUserId)
      })
      
      await updateDoc(toUserRef, {
        friends: arrayUnion(fromUserId)
      })
    } catch (err) {
      console.error('Error accepting friend request:', err)
      throw err
    }
  },
  
  declineFriendRequest: async (requestId) => {
    try {
      await updateDoc(doc(db, 'friendRequests', requestId), {
        status: 'declined'
      })
    } catch (err) {
      console.error('Error declining friend request:', err)
      throw err
    }
  },
  
  subscribeToFriendRequests: (userId) => {
    const requestsQuery = query(
      collection(db, 'friendRequests'),
      where('toUserId', '==', userId),
      where('status', '==', 'pending')
    )
    
    onSnapshot(requestsQuery, async (snapshot) => {
      const requests = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data()
          return {
            id: docSnap.id,
            from: {
              uid: data.fromUserId,
              displayName: data.fromUserName,
              photoURL: data.fromUserPhoto,
              email: '',
              currentlyReading: [],
              recentlyFinished: [],
              totalBooksRead: 0,
              totalPagesRead: 0,
              friends: [],
              createdAt: new Date()
            } as UserProfile
          }
        })
      )
      
      set({ friendRequests: requests })
    })
  }
}))
