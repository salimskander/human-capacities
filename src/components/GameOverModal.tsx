'use client';
import React from 'react';

interface GameOverModalProps {
  isOpen: boolean;
  score?: number;
  points?: number;
  onRestart: () => void;
  onBackToRules: () => void;
  scoreLabel?: string;
  showRestartButton?: boolean;
  showBackToRulesButton?: boolean;
}

export default function GameOverModal({
  isOpen,
  score,
  points,
  onRestart,
  onBackToRules,
  scoreLabel = 'Niveau atteint',
  showRestartButton = true,
  showBackToRulesButton = true,
}: GameOverModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-5 sm:p-8 rounded-2xl text-center max-w-[90vw] sm:max-w-md w-full">
        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 dark:text-white">
          Partie terminée !
        </h2>

        <p className="text-lg sm:text-xl mb-2 dark:text-gray-200">
          {scoreLabel} : <span className="font-bold">{score}</span>
        </p>

        {typeof points === 'number' && points > 0 && (
          <div className="inline-flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-4 py-2 rounded-full mb-5 mt-1 text-sm font-semibold">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            +{points} pts gagnés
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-2">
          {showRestartButton && (
            <button
              onClick={onRestart}
              className="px-5 sm:px-6 py-2.5 sm:py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
            >
              Rejouer
            </button>
          )}
          {showBackToRulesButton && (
            <button
              onClick={onBackToRules}
              className="px-5 sm:px-6 py-2.5 sm:py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-medium"
            >
              Retour aux règles
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
