'use client';

import { ReactNode, useRef, useState, useEffect } from 'react';
import ModalStats from './ModalStats';

interface StartModalProps {
  title: string;
  description: ReactNode; 
  onStart: () => void;
  stats?: ReactNode;
}

export default function StartModal({ title, description, onStart, stats }: StartModalProps) {
  const statsRef = useRef<HTMLDivElement>(null);
  const [showStats, setShowStats] = useState(false);

  const scrollToStats = () => {
    setShowStats(true);
    // Petit délai pour s'assurer que le composant est rendu avant de défiler
    setTimeout(() => {
      if (statsRef.current) {
        const yOffset = -50; // Ajustement pour que le modal soit bien visible
        const y = statsRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 100);
  };

  // Exposer la fonction scrollToStats pour qu'elle puisse être appelée de l'extérieur
  useEffect(() => {
    // @ts-expect-error - Dialog component props type mismatch
    window.scrollToReflexStats = scrollToStats;
  }, []);

  return (
    <div className="w-full">
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center max-w-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg mx-4">
          <h1 className="text-3xl font-bold mb-4 dark:text-white">{title}</h1>
          <div className="mb-8 dark:text-gray-200">
            {description}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
              onClick={onStart}
            >
              Commencer
            </button>
            {stats && (
              <button 
                className="px-6 py-3 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                onClick={scrollToStats}
              >
                Voir les statistiques
              </button>
            )}
          </div>
        </div>
      </div>
      
      {stats && (
        <div 
          ref={statsRef} 
          id="stats-section"
          className="w-full py-10 mt-20"
        >
          {showStats && (
            <ModalStats>
              {stats}
            </ModalStats>
          )}
        </div>
      )}
    </div>
  );
} 