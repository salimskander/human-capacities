"use client";

import Link from 'next/link';
import LoginForm from '@/components/LoginForm';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { currentUser, userLoading } = useAuth();
  const router = useRouter();
  
  // Rediriger si déjà connecté
  useEffect(() => {
    if (currentUser && !userLoading) {
      router.push('/');
    }
  }, [currentUser, userLoading, router]);
  
  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg mb-6"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg mb-6"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pt-20 flex flex-col items-center justify-center px-4">
      <LoginForm />
      
      <p className="mt-4 text-center text-gray-600 dark:text-gray-400">
        Vous n&apos;avez pas de compte ?{' '}
        <Link href="/signup" className="text-blue-600 hover:underline dark:text-blue-400">
          Créer un compte
        </Link>
      </p>
    </div>
  );
} 