'use client';

import { ReactNode } from 'react';

interface ModalStatsProps {
  children: ReactNode;
}

export default function ModalStats({ children }: ModalStatsProps) {
  return (
    <div className="w-[800px] max-w-[90vw] h-[500px] mx-auto bg-white/95 dark:bg-gray-800/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl overflow-auto border border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out">
      <div className="flex flex-col h-full">
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-bold dark:text-white bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">Statistiques</h2>
          <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto mt-2 rounded-full"></div>
        </div>
        <div className="flex-grow">
          {children}
        </div>
      </div>
    </div>
  );
} 