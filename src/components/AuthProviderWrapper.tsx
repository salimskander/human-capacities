"use client";

import { AuthProvider } from '../contexts/AuthContext';
import { GameResultsProvider } from '../contexts/GameResultsContext';

export default function AuthProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <GameResultsProvider>{children}</GameResultsProvider>
    </AuthProvider>
  );
} 
