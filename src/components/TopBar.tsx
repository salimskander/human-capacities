"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { logoutUser } from '../firebase';
import { usePathname } from 'next/navigation';

export default function TopBar() {
  const { currentUser, userLoading } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const pathname = usePathname();
  
  // Fermer les menus lors d'un changement de route
  useEffect(() => {
    setShowDropdown(false);
    setShowMobileMenu(false);
  }, [pathname]);
  
  // Masquer la TopBar sur les pages de jeu
  if (pathname && pathname.startsWith('/tests/') && pathname !== '/tests') {
    return null;
  }
  
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
            <div className="hidden sm:block">
              {userLoading ? (
                <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ) : currentUser ? (
                <div className="relative">
                  <button 
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                      {currentUser.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="hidden sm:inline">{currentUser.email}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700">
                      <Link 
                        href="/profile" 
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setShowDropdown(false)}
                      >
                        Profil
                      </Link>
                      <button 
                        onClick={() => {
                          logoutUser();
                          setShowDropdown(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Déconnexion
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex space-x-2">
                  <Link 
                    href="/login" 
                    className="px-4 py-2 rounded-md text-sm font-medium bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Connexion
                  </Link>
                  <Link 
                    href="/signup" 
                    className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    Inscription
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Menu mobile plein écran */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-40 bg-white/95 dark:bg-gray-900/98 pt-16 flex flex-col items-center sm:hidden">
          <div className="w-full max-w-sm px-6 py-8 space-y-6">
            {userLoading ? (
              <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ) : currentUser ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl">
                  {currentUser.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="text-gray-800 dark:text-white text-lg">{currentUser.email}</span>
                <div className="w-full border-t border-gray-200 dark:border-gray-700 pt-6 space-y-3">
                  <Link 
                    href="/profile" 
                    className="block w-full py-3 text-center text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Profil
                  </Link>
                  <button 
                    onClick={() => {
                      logoutUser();
                      setShowMobileMenu(false);
                    }}
                    className="block w-full py-3 text-center text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                  >
                    Déconnexion
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col space-y-3 w-full">
                <Link 
                  href="/login" 
                  className="block w-full py-3 text-center rounded-md font-medium bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Connexion
                </Link>
                <Link 
                  href="/signup" 
                  className="block w-full py-3 text-center rounded-md font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Inscription
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
} 