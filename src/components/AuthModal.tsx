"use client";

import React, { useState, useEffect, useCallback } from "react";
import styles from "./AuthModal.module.css";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail 
} from "firebase/auth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signInWithGoogle } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // Reset state when opening/closing
  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setPassword("");
      setErrorMsg(null);
      setInfoMsg(null);
      setSubmitting(false);
    }
  }, [isOpen]);

  // Handle ESC key to close
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const cleanErrorMessage = (error: unknown): string => {
    if (typeof error === "object" && error !== null) {
      const authErr = error as { code?: string; message?: string };
      switch (authErr.code) {
        case "auth/invalid-email":
          return "Invalid email address.";
        case "auth/user-disabled":
          return "This user account has been disabled.";
        case "auth/user-not-found":
          return "No account found with this email.";
        case "auth/wrong-password":
        case "auth/invalid-credential":
          return "Incorrect email or password.";
        case "auth/email-already-in-use":
          return "An account already exists with this email.";
        case "auth/weak-password":
          return "Password must be at least 6 characters.";
        case "auth/missing-password":
          return "Please enter your password.";
        default:
          return authErr.message || "Failed to authenticate.";
      }
    }
    return typeof error === "string" ? error : "An unexpected error occurred.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (!auth) {
      setErrorMsg("Firebase is not initialized. Check your environment variables.");
      return;
    }

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setSubmitting(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      onClose();
    } catch (err) {
      setErrorMsg(cleanErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (!auth) {
      setErrorMsg("Firebase is not initialized.");
      return;
    }

    if (!email.trim()) {
      setErrorMsg("Please enter your email address first.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfoMsg("Password reset email sent! Check your inbox.");
    } catch (err) {
      setErrorMsg(cleanErrorMessage(err));
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err) {
      setErrorMsg(cleanErrorMessage(err));
    }
  };

  const handleUnsupportedSocial = (provider: string) => {
    setInfoMsg(`${provider} sign-in will be available soon! Please use Google or Email.`);
  };

  return (
    <div 
      className={styles.modalOverlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className={styles.container}>
        {/* Close Button */}
        <button 
          type="button" 
          onClick={onClose} 
          className={styles.closeButton} 
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Heading */}
        <div id="auth-modal-title" className={styles.heading}>
          {isSignUp ? "Sign Up" : "Sign In"}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            required
            className={styles.input}
            type="email"
            name="email"
            id="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
          />
          <input
            required
            className={styles.input}
            type="password"
            name="password"
            id="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
          />

          {!isSignUp && (
            <span className={styles['forgot-password']}>
              <a href="#" onClick={handleForgotPassword}>
                Forgot Password ?
              </a>
            </span>
          )}

          {errorMsg && (
            <div className={`${styles.feedbackMessage} ${styles.feedbackError}`}>
              {errorMsg}
            </div>
          )}

          {infoMsg && (
            <div className={`${styles.feedbackMessage} ${styles.feedbackSuccess}`}>
              {infoMsg}
            </div>
          )}

          <input
            className={styles['login-button']}
            type="submit"
            value={submitting ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}
            disabled={submitting}
          />
        </form>

        {/* Sign In / Sign Up Mode Switch */}
        <div className={styles.authModeToggle}>
          <span>
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
          </span>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg(null);
              setInfoMsg(null);
            }}
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </div>

        {/* Social Accounts */}
        <div className={styles['social-account-container']}>
          <span className={styles.title}>Or Sign in with</span>
          <div className={styles['social-accounts']}>
            {/* Google Button */}
            <button 
              type="button" 
              className={`${styles['social-button']} ${styles.google}`} 
              onClick={handleGoogleSignIn}
              title="Sign in with Google"
            >
              <svg className={styles.svg} xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 488 512">
                <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
              </svg>
            </button>

            {/* Apple Button */}
            <button 
              type="button" 
              className={`${styles['social-button']} ${styles.apple}`}
              onClick={() => handleUnsupportedSocial("Apple")}
              title="Sign in with Apple"
            >
              <svg className={styles.svg} xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 384 512">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"></path>
              </svg>
            </button>

            {/* Twitter Button */}
            <button 
              type="button" 
              className={`${styles['social-button']} ${styles.twitter}`}
              onClick={() => handleUnsupportedSocial("Twitter / X")}
              title="Sign in with X (Twitter)"
            >
              <svg className={styles.svg} xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512">
                <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Agreement */}
        <span className={styles.agreement}>
          <a href="#" onClick={(e) => { e.preventDefault(); alert("Celeste Tutor AI respects your privacy. Your data is encrypted and securely stored."); }}>
            Learn user licence agreement
          </a>
        </span>
      </div>
    </div>
  );
}
