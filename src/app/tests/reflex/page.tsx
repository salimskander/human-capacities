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
  const [backgroundColor, setBackgroundColor] = useState<string>('white');
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
    setBackgroundColor('white');
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
    setBackgroundColor('gray');
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
      resetTest();
      return;
    }

    if (backgroundColor === 'gray') {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setTooEarly(true);
      setBackgroundColor('red');
      setTimeout(() => {
        resetTest();
      }, 2000);
      return;
    }

    if (backgroundColor === 'green') {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      const finalTime = currentTime;
      setReactionTime(finalTime);
      setBackgroundColor('white');
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
        href="/"
        className="fixed top-4 left-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors z-50"
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
      <div
        className="flex flex-col items-center justify-center min-h-screen cursor-pointer"
        style={{ backgroundColor }}
        onMouseDown={handleClick}
      >
        {showStart ? (
          <div className="min-h-screen flex flex-col items-center justify-center">
            <div className="text-center max-w-md bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg mx-4">
              <h1 className="text-3xl font-bold mb-4">Test de Réflexes</h1>
              <p className="mb-8">
                Mesurez votre temps de réaction.
                Attendez que l&apos;écran devienne vert, puis cliquez le plus rapidement possible.
                Attention à ne pas cliquer trop tôt !
              </p>
              <button
                className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                onClick={startTest}
              >
                Commencer
              </button>
            </div>

            {results.length > 0 && (
              <div className="absolute top-full -mt-52 w-[600px] bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg mx-4">
                <Line data={prepareChartData()} options={chartOptions} />
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            {backgroundColor === 'green' && (
              <>
                <div className="text-white text-6xl font-bold mb-4">
                  CLIC !
                </div>
                <div className="text-white text-3xl">
                  {currentTime} ms
                </div>
              </>
            )}
            {backgroundColor === 'gray' && !tooEarly && (
              <p className="text-white text-xl">Attendez le signal vert...</p>
            )}
            {tooEarly && (
              <div className="text-white text-4xl font-bold">
                Trop tôt !
              </div>
            )}
            {reactionTime && reactionTime > 0 && (
              <div className="bg-white p-4 rounded-lg">
                <p className="text-xl">Votre temps de réaction : {reactionTime} ms</p>
                <p className="mt-2">Cliquez n&apos;importe où pour réessayer</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
