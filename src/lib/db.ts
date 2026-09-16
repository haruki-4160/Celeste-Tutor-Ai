import { db } from "./firebase";
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";

export interface UserStats {
  xp: number;
  streak: number;
  bestStreak: number;
  problemsSolved: number;
  lastActive: string | null;
  activeDays: string[];
  memberSince?: string;
}

const DEFAULT_STATS: UserStats = {
  xp: 0,
  streak: 0,
  bestStreak: 0,
  problemsSolved: 0,
  lastActive: null,
  activeDays: [],
};

const getLocalStats = (userId: string): UserStats => {
  if (typeof window === 'undefined') return DEFAULT_STATS;
  try {
    const raw = localStorage.getItem(`celeste_stats_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('Error reading local stats:', err);
  }
  return DEFAULT_STATS;
};

const saveLocalStats = (userId: string, stats: UserStats) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`celeste_stats_${userId}`, JSON.stringify(stats));
  } catch (err) {
    console.warn('Error saving local stats:', err);
  }
};

export const toDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Calculates streak updates based on last active date
 */
function calculateStreak(
  lastActive: string | null,
  currentStreak: number,
  todayStr: string
): { newStreak: number; isNewDay: boolean } {
  if (!lastActive) {
    return { newStreak: 1, isNewDay: true };
  }

  if (lastActive === todayStr) {
    return { newStreak: Math.max(1, currentStreak), isNewDay: false };
  }

  // Parse today and calculate yesterday's date string in local time
  const [year, month, day] = todayStr.split('-').map(Number);
  const todayDate = new Date(year, month - 1, day);
  const yesterday = new Date(todayDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toDateString(yesterday);

  if (lastActive === yesterdayStr) {
    return { newStreak: currentStreak + 1, isNewDay: true };
  }

  // If difference > 1 day: streak resets to 1
  return { newStreak: 1, isNewDay: true };
}

/**
 * Fetches user stats from Firestore with localStorage fallback.
 */
export async function getUserStats(userId: string): Promise<UserStats> {
  const localStats = getLocalStats(userId);
  const todayStr = toDateString(new Date());

  if (!db) {
    // If offline/no Firestore, run local streak logic
    const { newStreak, isNewDay } = calculateStreak(localStats.lastActive, localStats.streak, todayStr);
    const updated = {
      ...localStats,
      streak: newStreak,
      bestStreak: Math.max(localStats.bestStreak || 0, newStreak),
      lastActive: todayStr,
      activeDays: isNewDay && !localStats.activeDays?.includes(todayStr) 
        ? [...(localStats.activeDays || []), todayStr] 
        : (localStats.activeDays || [todayStr])
    };
    saveLocalStats(userId, updated);
    return updated;
  }

  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      const existingStreak = data.streak || localStats.streak || 0;
      const lastActive = data.lastActive || localStats.lastActive;
      const { newStreak, isNewDay } = calculateStreak(lastActive, existingStreak, todayStr);

      const activeDays: string[] = Array.isArray(data.activeDays) ? data.activeDays : (localStats.activeDays || []);
      if (isNewDay && !activeDays.includes(todayStr)) {
        activeDays.push(todayStr);
      }

      const bestStreak = Math.max(data.bestStreak || 0, localStats.bestStreak || 0, newStreak);
      const xp = Math.max(data.xp || 0, localStats.xp || 0);
      const problemsSolved = Math.max(data.problemsSolved || 0, localStats.problemsSolved || 0);

      const finalStats: UserStats = {
        xp,
        streak: newStreak,
        bestStreak,
        problemsSolved,
        lastActive: todayStr,
        activeDays,
        memberSince: data.memberSince || localStats.memberSince || todayStr,
      };

      // Sync Firestore
      await updateDoc(userRef, {
        streak: newStreak,
        bestStreak,
        lastActive: todayStr,
        activeDays,
      }).catch(err => console.warn('Could not update active timestamp in Firestore:', err));

      saveLocalStats(userId, finalStats);
      return finalStats;
    } else {
      // Create new user doc
      const newStats: UserStats = {
        xp: localStats.xp || 0,
        streak: 1,
        bestStreak: 1,
        problemsSolved: localStats.problemsSolved || 0,
        lastActive: todayStr,
        activeDays: [todayStr],
        memberSince: todayStr
      };

      await setDoc(userRef, newStats).catch(err => console.warn('Could not set new doc in Firestore:', err));
      saveLocalStats(userId, newStats);
      return newStats;
    }
  } catch (error) {
    console.error("Error fetching user stats from Firestore, using local cache:", error);
    const { newStreak } = calculateStreak(localStats.lastActive, localStats.streak, todayStr);
    const updated = {
      ...localStats,
      streak: newStreak,
      bestStreak: Math.max(localStats.bestStreak || 0, newStreak),
      lastActive: todayStr
    };
    saveLocalStats(userId, updated);
    return updated;
  }
}

/**
 * Records problem solving activity, adds XP, and updates streaks in Firestore + localStorage.
 */
export async function recordProblemSolved(userId: string, xpEarned: number): Promise<UserStats> {
  const localStats = getLocalStats(userId);
  const todayStr = toDateString(new Date());
  const { newStreak } = calculateStreak(localStats.lastActive, localStats.streak, todayStr);

  const activeDays = [...(localStats.activeDays || [])];
  if (!activeDays.includes(todayStr)) {
    activeDays.push(todayStr);
  }

  const updated: UserStats = {
    ...localStats,
    xp: (localStats.xp || 0) + xpEarned,
    streak: newStreak,
    bestStreak: Math.max(localStats.bestStreak || 0, newStreak),
    problemsSolved: (localStats.problemsSolved || 0) + 1,
    lastActive: todayStr,
    activeDays
  };

  saveLocalStats(userId, updated);

  if (db) {
    try {
      const userRef = doc(db, "users", userId);
      await setDoc(userRef, {
        xp: increment(xpEarned),
        problemsSolved: increment(1),
        streak: newStreak,
        bestStreak: updated.bestStreak,
        lastActive: todayStr,
        activeDays
      }, { merge: true });
    } catch (err) {
      console.warn("Could not record problem in Firestore:", err);
    }
  }

  return updated;
}

/**
 * Adds XP to the user's document.
 */
export async function addXP(userId: string, amount: number): Promise<void> {
  const localStats = getLocalStats(userId);
  const updated: UserStats = {
    ...localStats,
    xp: (localStats.xp || 0) + amount
  };
  saveLocalStats(userId, updated);

  if (!db) return;
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, {
      xp: increment(amount)
    }, { merge: true });
  } catch (error) {
    console.error("Error adding XP:", error);
  }
}
