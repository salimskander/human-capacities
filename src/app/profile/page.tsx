"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import UserProfile from '@/components/UserProfile';

export default function ProfilePage() {
  const { currentUser, userLoading } = useAuth();
  const router = useRouter();
  
  // Rediriger si non connecté
  useEffect(() => {
    if (!userLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, userLoading, router]);
  
  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg mb-6"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg mb-6"></div>
        </div>
      </div>
    );
  }
  
  if (!currentUser) {
    return null; // La redirection se chargera de ça
  }
  
  return (
    <div className="min-h-screen pt-20 flex flex-col items-center justify-center px-4">
      <UserProfile />
    </div>
  );
} 