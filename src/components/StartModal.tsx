'use client';

import { ReactNode } from 'react';

interface StartModalProps {
  title: string;
  description: ReactNode;
  onStart: () => void;
}

export default function StartModal({ title, description, onStart }: StartModalProps) {
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center">
      <div className="text-center max-w-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg mx-4">
        <h1 className="text-3xl font-bold mb-4 dark:text-white">{title}</h1>
        <div className="mb-8 dark:text-gray-200">
          {description}
        </div>
        <button
          className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
          onClick={onStart}
        >
          Commencer
        </button>
      </div>
    </div>
  );
}
