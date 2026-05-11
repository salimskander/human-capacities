"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { logoutUser } from '../firebase';
import { usePathname } from 'next/navigation';

export default function TopBar() {
  const { currentUser, userLoading } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const pathname = usePathname();

  // Fermer le menu mobile lors d'un changement de route
  useEffect(() => {
    setShowMobileMenu(false);
  }, [pathname]);
  
  // Empêcher le défilement du body quand le menu mobile est ouvert
  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showMobileMenu]);
  
  // Masquer la TopBar sur les pages de jeu
  if (pathname && pathname.startsWith('/tests/') && pathname !== '/tests') {
    return null;
  }
  
  return (
    <>
      <div className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="min-w-0">
              <Link href="/" className="flex items-center">
                <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Human Capacities</span>
              </Link>
            </div>
            
            {/* Menu hamburger pour mobile */}
            <div className="block sm:hidden">
              <button 
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white focus:outline-none"
              >
                {!showMobileMenu ? (
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
            
            {/* Menu desktop */}
            <div className="hidden sm:flex items-center gap-5">
              {userLoading ? (
                <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ) : currentUser ? (
                <>
                  <Link
                    href="/leaderboard"
                    className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Classement
                  </Link>
                  {/* Avatar + username → profil */}
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                      {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium max-w-[140px] truncate">
                      {currentUser.displayName || currentUser.email}
                    </span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/leaderboard"
                    className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Classement
                  </Link>
                  <div className="flex items-center gap-2">
                    <Link
                      href="/login"
                      className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Connexion
                    </Link>
                    <Link
                      href="/signup"
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      Inscription
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Menu mobile plein écran */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-40 flex flex-col sm:hidden" style={{ backgroundColor: 'var(--mobile-menu-bg, #ffffff)' }}>
          {/* Fond explicitement solide selon le mode */}
          <div className="absolute inset-0 bg-white dark:bg-gray-950" />

          <div className="relative flex flex-col h-full pt-16 px-6 pb-8 overflow-y-auto">
            {userLoading ? (
              <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse mt-4" />
            ) : currentUser ? (
              /* Connecté : avatar + nom + actions (classement sous profil) */
              <div className="flex flex-col items-center gap-4 mt-4">
                <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                  {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-white text-center">
                  {currentUser.displayName || currentUser.email}
                </span>

                <div className="w-full flex flex-col gap-2 mt-2">
                  <Link
                    href="/profile"
                    className="flex items-center justify-center w-full py-3.5 text-sm font-medium text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Mon profil
                  </Link>
                  <Link
                    href="/leaderboard"
                    className="flex items-center justify-center w-full py-3.5 text-sm font-medium text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Classement
                  </Link>
                  <button
                    onClick={() => { logoutUser(); setShowMobileMenu(false); }}
                    className="flex items-center justify-center w-full py-3.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl transition-colors"
                  >
                    Déconnexion
                  </button>
                </div>
              </div>
            ) : (
              /* Non connecté : classement en haut + connexion/inscription */
              <>
                <Link
                  href="/leaderboard"
                  className="flex items-center justify-center w-full py-4 text-base font-medium text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors mt-4"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Classement
                </Link>
                <div className="border-t border-gray-200 dark:border-gray-700 my-4" />
                <div className="flex flex-col gap-3 w-full">
                <Link
                  href="/login"
                  className="flex items-center justify-center w-full py-3.5 text-sm font-semibold text-gray-800 dark:text-gray-100 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-xl transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Connexion
                </Link>
                <Link
                  href="/signup"
                  className="flex items-center justify-center w-full py-3.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Inscription
                </Link>
              </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
} 