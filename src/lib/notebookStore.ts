import { NotebookNote } from '@/types/notebook';
import { db } from './firebase';
import { collection, doc, setDoc, getDocs, getDoc, deleteDoc, query, orderBy, limit } from 'firebase/firestore';

const LOCAL_STORAGE_KEY = 'celeste_notebook_notes';

/**
 * Helper to safely get notes from LocalStorage
 */
export function getLocalNotes(): NotebookNote[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as NotebookNote[];
  } catch (err) {
    console.error('Error reading from localStorage:', err);
    return [];
  }
}

/**
 * Helper to safely save notes to LocalStorage
 */
export function saveLocalNotes(notes: NotebookNote[]): void {
  if (typeof window === 'undefined') return;
  try {
    // Avoid exceeding quota: strip large media if necessary
    const sanitized = notes.map(note => {
      if (note.sourceDataUrl && note.sourceDataUrl.length > 500000) {
        return { ...note, sourceDataUrl: undefined };
      }
      return note;
    });
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sanitized.slice(0, 20)));
  } catch (err) {
    console.error('Error saving to localStorage:', err);
  }
}

/**
 * Save or update a note in local storage and optionally sync to Firestore
 */
export async function saveNote(note: NotebookNote, userId?: string): Promise<void> {
  // 1. Update LocalStorage
  const localList = getLocalNotes();
  const existingIdx = localList.findIndex(n => n.id === note.id);
  let updatedList: NotebookNote[];
  if (existingIdx >= 0) {
    updatedList = [...localList];
    updatedList[existingIdx] = note;
  } else {
    updatedList = [note, ...localList];
  }
  saveLocalNotes(updatedList);

  // 2. Sync to Firestore if authenticated
  if (userId && db) {
    try {
      const noteDocRef = doc(db, `users/${userId}/notebookNotes`, note.id);
      // Omit large base64 image from Firestore to save cloud document space
      const { sourceDataUrl, ...firestoreData } = note;
      await setDoc(noteDocRef, { ...firestoreData, updatedAt: Date.now() }, { merge: true });
    } catch (err) {
      console.warn('Failed to sync note to Firestore:', err);
    }
  }
}

/**
 * Fetch all notes (prefers Firestore if user logged in, falls back to LocalStorage)
 */
export async function fetchNotes(userId?: string): Promise<NotebookNote[]> {
  const local = getLocalNotes();

  if (userId && db) {
    try {
      const colRef = collection(db, `users/${userId}/notebookNotes`);
      const q = query(colRef, orderBy('createdAt', 'desc'), limit(20));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const remoteNotes: NotebookNote[] = [];
        snap.forEach(d => {
          remoteNotes.push({ ...(d.data() as NotebookNote), id: d.id });
        });
        // Merge with local cache
        const map = new Map<string, NotebookNote>();
        local.forEach(n => map.set(n.id, n));
        remoteNotes.forEach(n => map.set(n.id, { ...map.get(n.id), ...n }));
        const combined = Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt);
        saveLocalNotes(combined);
        return combined;
      }
    } catch (err) {
      console.warn('Error fetching notes from Firestore:', err);
    }
  }

  return local;
}

/**
 * Delete a note by ID
 */
export async function deleteNote(id: string, userId?: string): Promise<void> {
  const local = getLocalNotes().filter(n => n.id !== id);
  saveLocalNotes(local);

  if (userId && db) {
    try {
      await deleteDoc(doc(db, `users/${userId}/notebookNotes`, id));
    } catch (err) {
      console.warn('Error deleting note from Firestore:', err);
    }
  }
}
