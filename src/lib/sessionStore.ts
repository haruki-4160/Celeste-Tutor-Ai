import { ProblemSession } from '@/types/session';
import { db } from './firebase';
import { collection, doc, setDoc, getDocs, deleteDoc, query, orderBy, limit } from 'firebase/firestore';

const getStorageKey = (userId?: string) => `celeste_sessions_${userId || 'guest'}`;

/**
 * Retrieve sessions from LocalStorage for the specified user.
 */
export function getLocalSessions(userId?: string): ProblemSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return [];
    return JSON.parse(raw) as ProblemSession[];
  } catch (err) {
    console.error('Error reading sessions from localStorage:', err);
    return [];
  }
}

/**
 * Persist sessions to LocalStorage for the specified user.
 */
export function saveLocalSessions(sessions: ProblemSession[], userId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(sessions.slice(0, 50)));
  } catch (err) {
    console.error('Error saving sessions to localStorage:', err);
  }
}

/**
 * Save or update a problem session in LocalStorage and Firestore (if authenticated).
 */
export async function saveSession(session: ProblemSession, userId?: string): Promise<void> {
  // 1. Update LocalStorage
  const localList = getLocalSessions(userId);
  const existingIdx = localList.findIndex((s) => s.id === session.id);
  let updatedList: ProblemSession[];
  if (existingIdx >= 0) {
    updatedList = [...localList];
    updatedList[existingIdx] = session;
  } else {
    updatedList = [session, ...localList];
  }
  saveLocalSessions(updatedList, userId);

  // 2. Sync to Firestore if authenticated
  if (userId && db) {
    try {
      const sessionDocRef = doc(db, `users/${userId}/sessions`, session.id);
      await setDoc(sessionDocRef, { ...session, updatedAt: Date.now() }, { merge: true });
    } catch (err) {
      console.warn('Failed to sync session to Firestore:', err);
    }
  }
}

/**
 * Fetch all sessions for a user (from Firestore if logged in, merged with local cache).
 */
export async function fetchSessions(userId?: string): Promise<ProblemSession[]> {
  const local = getLocalSessions(userId);

  if (userId && db) {
    try {
      const colRef = collection(db, `users/${userId}/sessions`);
      const q = query(colRef, orderBy('createdAt', 'desc'), limit(50));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const remoteSessions: ProblemSession[] = [];
        snap.forEach((d) => {
          remoteSessions.push({ ...(d.data() as ProblemSession), id: d.id });
        });

        // Merge with local cache
        const map = new Map<string, ProblemSession>();
        local.forEach((s) => map.set(s.id, s));
        remoteSessions.forEach((s) => map.set(s.id, { ...map.get(s.id), ...s }));

        const combined = Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt);
        saveLocalSessions(combined, userId);
        return combined;
      }
    } catch (err) {
      console.warn('Error fetching sessions from Firestore:', err);
    }
  }

  return local.sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Delete a problem session by ID from LocalStorage and Firestore.
 */
export async function deleteSession(id: string, userId?: string): Promise<void> {
  const local = getLocalSessions(userId).filter((s) => s.id !== id);
  saveLocalSessions(local, userId);

  if (userId && db) {
    try {
      await deleteDoc(doc(db, `users/${userId}/sessions`, id));
    } catch (err) {
      console.warn('Error deleting session from Firestore:', err);
    }
  }
}
