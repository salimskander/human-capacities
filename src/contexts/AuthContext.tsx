"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { subscribeToAuthChanges, handleGoogleRedirectResult } from '../firebase';

// Type pour le contexte d'authentification
type AuthContextType = {
  currentUser: User | null;
  userLoading: boolean;
};

// Création du contexte avec des valeurs par défaut
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userLoading: true
});

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = () => useContext(AuthContext);

// Fournisseur du contexte d'authentification
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  // Souscrire aux changements d'état d'authentification
  useEffect(() => {
    handleGoogleRedirectResult();
    const unsubscribe = subscribeToAuthChanges(async (user) => {
      setCurrentUser(user);
      setUserLoading(false);

      // For Google sign-ins: persist displayName to UserProfile if not yet saved
      if (user?.displayName) {
        try {
          const res = await fetch(`/api/user/profile?userId=${encodeURIComponent(user.uid)}`);
          if (res.ok) {
            const profile = await res.json();
            if (!profile.username) {
              const username = user.displayName.trim().slice(0, 32);
              if (username.length >= 5) {
                await fetch('/api/user/profile', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ firebaseUid: user.uid, username }),
                });
              }
            }
          }
        } catch {
          // Silently fail — leaderboard will show fallback name
        }
      }
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};