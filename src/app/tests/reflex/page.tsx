'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import StartModal from '@/components/StartModal';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function ReflexTest() {
  const [results, setResults] = useState<number[]>([]);
  const [backgroundColor, setBackgroundColor] = useState<string>('transparent');
  const [, setStartTime] = useState<number | null>(null);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [isWaiting, setIsWaiting] = useState<boolean>(false);
  const [showStart, setShowStart] = useState<boolean>(true);
  const [tooEarly, setTooEarly] = useState<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const resetTest = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setCurrentTime(0);
    setBackgroundColor('transparent'); // Au lieu de 'white'
    setStartTime(null);
    setReactionTime(null);
    setIsWaiting(false);
    setShowStart(true);
    setTooEarly(false);
  };

  const updateTimer = () => {
    const now = performance.now();
    setCurrentTime(Math.round(now - startTimeRef.current));
    animationFrameRef.current = requestAnimationFrame(updateTimer);
  };

  const startTest = () => {
    setBackgroundColor('#4B5563'); // Gris plus foncé
    setReactionTime(null);
    setIsWaiting(true);
    setShowStart(false);
    setTooEarly(false);
    
    const delay = Math.random() * 4000 + 1000;
    
    timeoutRef.current = setTimeout(() => {
      setBackgroundColor('green');
      startTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(updateTimer);
    }, delay);
  };

  const handleClick = () => {
    if (showStart || tooEarly) {
      return;
    }

    if (!isWaiting) {
      // Si on a déjà affiché un résultat, on relance directement le test
      if (reactionTime !== null) {
        startTest();
      } else {
        resetTest();
      }
      return;
    }

    if (backgroundColor === '#4B5563') { // Mettre à jour la condition
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setTooEarly(true);
      setBackgroundColor('#EF4444'); // Rouge plus vif
      setTimeout(() => {
        resetTest();
        startTest(); // Relance automatiquement le test après le délai
      }, 1500); 
      return;
    }

    if (backgroundColor === 'green') {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      const finalTime = currentTime;
      setReactionTime(finalTime);
      setBackgroundColor('transparent'); // Au lieu de 'white'
      setIsWaiting(false);

      // Sauvegarder le résultat et mettre à jour le graphique
      fetch('/api/reflex', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reactionTime: finalTime }),
      })
        .then(() => fetchResults())  // Recharger les résultats après la sauvegarde
        .catch(error => console.error('Erreur lors de la sauvegarde:', error));
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const response = await fetch('/api/reflex');
      const data = await response.json();
      const times = data.map((r: { reactionTime: number }) => r.reactionTime);
      setResults(times);
    } catch (error) {
      console.error('Erreur lors de la récupération des résultats:', error);
    }
  };

  const prepareChartData = () => {
    // Créer des intervalles de 25ms jusqu'à 500ms
    const intervals = Array.from({ length: 21 }, (_, i) => i * 25);
    const counts = new Array(21).fill(0);

    results.forEach(time => {
      const index = Math.floor(time / 25);
      if (index >= 0 && index < 21) {
        counts[index]++;
      }
    });

    // Convertir en pourcentages
    const percentages = counts.map(count => (count / results.length) * 100 || 0);

    return {
      labels: intervals.map(i => `${i}ms`),
      datasets: [
        {
          label: 'Distribution des temps de réaction',
          data: percentages,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.3,
          fill: false,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Pourcentage',
        },
        ticks: {
          callback: function(tickValue: number | string) {
            return `${tickValue}%`;
          }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Temps de réaction (ms)',
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },
    },
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return (
    <>
      <Link 
        href="/#tests-section"
        className="fixed top-4 left-4 w-12 h-12 bg-white dark:bg-gray-800 dark:text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-50"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-6 w-6" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M10 19l-7-7m0 0l7-7m-7 7h18" 
          />
        </svg>
      </Link>
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center" 
           style={{ backgroundColor }} 
           onClick={handleClick}>
        {showStart ? (
          <StartModal 
            title="Test de Réflexes"
            description={
              <p>
                Mesurez votre temps de réaction.
                Attendez que l&apos;écran devienne vert, puis cliquez le plus rapidement possible.
                Attention à ne pas cliquer trop tôt !
              </p>
            }
            onStart={startTest}
            stats={results.length > 0 ? (
              <Line data={prepareChartData()} options={chartOptions} />
            ) : (
              <p className="text-center dark:text-gray-200">Aucune donnée disponible pour le moment.</p>
            )}
          />
        ) : (
          <div className="text-center flex flex-col items-center justify-center min-h-screen">
            {backgroundColor === 'green' && (
              <>
                <div className="text-black dark:text-white text-6xl font-bold mb-4">
                  CLIC !
                </div>
                <div className="text-black dark:text-white text-3xl">
                  {currentTime} ms
                </div>
              </>
            )}
            {backgroundColor === '#4B5563' && !tooEarly && (
              <p className="text-white text-xl">Attendez le signal vert...</p>
            )}
            {backgroundColor === '#EF4444' && (
              <div className="text-white text-4xl font-bold">
                Trop tôt !
              </div>
            )}
            {reactionTime && reactionTime > 0 && (
              <div className="bg-white/90 dark:bg-gray-800/90 p-4 rounded-lg backdrop-blur-sm">
                <p className="text-black dark:text-white text-xl">
                  Votre temps de réaction : {reactionTime} ms
                </p>
                <div className="flex justify-center mt-4">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      resetTest();
                      setShowStart(true);
                      setTimeout(() => {
                        // @ts-expect-error - ChartJS types are incompatible with our configuration
                        if (window.scrollToReflexStats) window.scrollToReflexStats();
                      }, 100);
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Voir les statistiques
                  </button>
                </div>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                  Cliquez n&apos;importe où pour rejouer
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
