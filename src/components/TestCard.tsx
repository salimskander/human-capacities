"use client"

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface TestCardProps {
  title: string;
  description: string;
  image: string;
  link: string;
  rules?: string;
}

export default function TestCard({ title, description, image, link, rules }: TestCardProps) {
  const [isInfoHovering, setIsInfoHovering] = useState(false);

  // Fonction pour arrêter la propagation du clic
  const handleInfoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <Link
      href={link}
      className="block p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow relative overflow-hidden group"
    >
      {/* Icône d'information modernisée */}
      {rules && (
        <div 
          className="absolute top-2 sm:top-3 right-2 sm:right-3 w-6 sm:w-7 h-6 sm:h-7 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full flex items-center justify-center z-10 border border-gray-100 dark:border-gray-700 hover:scale-105 transition-all duration-200 cursor-pointer shadow-sm"
          onMouseEnter={() => setIsInfoHovering(true)}
          onMouseLeave={() => setIsInfoHovering(false)}
          onClick={handleInfoClick}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-blue-500 dark:text-blue-400"
          >
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM11 7h2v2h-2V7zm0 4h2v6h-2v-6z"/>
          </svg>
        </div>
      )}

      <div className="flex items-center mb-3 sm:mb-4">
        <div className="w-10 sm:w-12 h-10 sm:h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
          <Image
            src={image}
            alt=""
            width={24}
            height={24}
            className="w-5 sm:w-6 h-5 sm:h-6 text-blue-600"
          />
        </div>
        <h2 className="ml-3 sm:ml-4 text-lg sm:text-xl font-semibold">{title}</h2>
      </div>
      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">{description}</p>

      {/* Overlay des règles - s'affiche uniquement au survol de l'icône d'info */}
      {rules && (
        <div 
          className={`absolute inset-0 backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 p-6 flex flex-col justify-center transition-all duration-300 ease-in-out ${
            isInfoHovering ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'
          }`}
          onClick={handleInfoClick}
        >
          <h3 className="text-gray-800 dark:text-gray-100 font-medium text-lg mb-2 border-b border-gray-200 dark:border-gray-700 pb-2">Comment jouer ?</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{rules}</p>
        </div>
      )}
    </Link>
  );
} 