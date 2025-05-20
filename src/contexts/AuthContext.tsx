"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { auth, subscribeToAuthChanges } from '../firebase';

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
    const unsubscribe = subscribeToAuthChanges((user) => {
      setCurrentUser(user);
      setUserLoading(false);
    });

    // Nettoyer l'abonnement lors du démontage
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