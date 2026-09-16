"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { getUserStats, recordProblemSolved, UserStats } from "@/lib/db";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  stats: UserStats;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateLocalXP: (amount: number) => void;
  recordSolvedProblem: (xpAmount?: number) => Promise<void>;
  refreshStats: () => Promise<void>;
}

const defaultStats: UserStats = { 
  xp: 0, 
  streak: 0, 
  bestStreak: 0, 
  problemsSolved: 0, 
  lastActive: null, 
  activeDays: [] 
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  stats: defaultStats,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  updateLocalXP: () => {},
  recordSolvedProblem: async () => {},
  refreshStats: async () => {}
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats>(defaultStats);

  const refreshStats = async () => {
    if (user) {
      const userStats = await getUserStats(user.uid);
      setStats(userStats);
    }
  };

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userStats = await getUserStats(currentUser.uid);
        setStats(userStats);
      } else {
        setStats(defaultStats);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!auth || !googleProvider) {
      console.warn("Firebase Auth is not initialized. Please configure NEXT_PUBLIC_FIREBASE environment variables.");
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  const signOut = async () => {
    if (!auth) return;
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const updateLocalXP = (amount: number) => {
    setStats(prev => ({ ...prev, xp: prev.xp + amount }));
  };

  const recordSolvedProblem = async (xpAmount: number = 15) => {
    if (!user) {
      setStats(prev => ({
        ...prev,
        xp: prev.xp + xpAmount,
        problemsSolved: (prev.problemsSolved || 0) + 1,
        streak: Math.max(1, prev.streak)
      }));
      return;
    }
    const updated = await recordProblemSolved(user.uid, xpAmount);
    setStats(updated);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      stats, 
      signInWithGoogle, 
      signOut, 
      updateLocalXP, 
      recordSolvedProblem, 
      refreshStats 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
