'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import StartModal from '@/components/StartModal';
import { useGameResults } from '@/contexts/GameResultsContext';
import { calculatePoints } from '@/lib/points';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function ReflexTest() {
  const { saveResult } = useGameResults();
  const [globalResults, setGlobalResults] = useState<number[]>([]);
  const [backgroundColor, setBackgroundColor] = useState<string>('transparent');
  const [, setStartTime] = useState<number | null>(null);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null);
  const [isWaiting, setIsWaiting] = useState<boolean>(false);
  const [showStart, setShowStart] = useState<boolean>(true);
  const [tooEarly, setTooEarly] = useState<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const resetTest = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    setCurrentTime(0);
    setBackgroundColor('transparent');
    setStartTime(null);
    setReactionTime(null);
    setEarnedPoints(null);
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
    setBackgroundColor('#4B5563');
    setReactionTime(null);
    setEarnedPoints(null);
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
    if (showStart || tooEarly) return;

    if (!isWaiting) {
      if (reactionTime !== null) {
        startTest();
      } else {
        resetTest();
      }
      return;
    }

    if (backgroundColor === '#4B5563') {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setTooEarly(true);
      setBackgroundColor('#EF4444');
      setTimeout(() => {
        resetTest();
        startTest();
      }, 1500);
      return;
    }

    if (backgroundColor === 'green') {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      const finalTime = currentTime;
      setReactionTime(finalTime);
      setBackgroundColor('transparent');
      setIsWaiting(false);
      if (finalTime >= 101) {
        setEarnedPoints(calculatePoints('reflex', { reactionTime: finalTime }));
        saveResult(finalTime);
      } else {
        setEarnedPoints(null);
      }
    }
  };

  const fetchResults = useCallback(async () => {
    try {
      const globalResponse = await fetch('/api/reflex?type=global');
      const globalData = await globalResponse.json();
      const globalTimes = globalData.map((r: { reactionTime: number }) => r.reactionTime);
      setGlobalResults(globalTimes);
    } catch (error) {
      console.error('Erreur lors de la récupération des résultats:', error);
    }
  }, []);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const prepareChartData = () => {
    const intervals = Array.from({ length: 21 }, (_, i) => i * 25);
    const counts = new Array(21).fill(0);
    globalResults.forEach((time) => {
      const index = Math.floor(time / 25);
      if (index >= 0 && index < 21) counts[index]++;
    });
    const total = globalResults.length;
    const percentages = counts.map((count) => (count / total) * 100 || 0);
    return {
      labels: intervals.map((i) => `${i}ms`),
      datasets: [
        {
          label: 'Distribution des temps de réaction',
          data: percentages,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          tension: 0.1,
          fill: true,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Distribution globale des temps de réaction' },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Pourcentage des joueurs (%)' } },
      x: { title: { display: true, text: 'Temps de réaction (ms)' } },
    },
  };

  return (
    <>
      <Link
        href="/#tests-section"
        className="fixed top-4 left-4 w-12 h-12 bg-white dark:bg-gray-800 dark:text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </Link>

      <div
        className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center"
        style={{ backgroundColor }}
        onClick={handleClick}
      >
        {showStart ? (
          <StartModal
            title="Test de Réflexes"
            description={
              <p>
                Mesurez votre temps de réaction. Attendez que l&apos;écran devienne vert, puis
                cliquez le plus rapidement possible. Attention à ne pas cliquer trop tôt !
              </p>
            }
            onStart={startTest}
          />
        ) : (
          <div className="text-center flex flex-col items-center justify-center min-h-screen">
            {backgroundColor === 'green' && (
              <>
                <div className="text-black dark:text-white text-6xl font-bold mb-4">CLIC !</div>
                <div className="text-black dark:text-white text-3xl">{currentTime} ms</div>
              </>
            )}
            {backgroundColor === '#4B5563' && !tooEarly && (
              <p className="text-white text-xl">Attendez le signal vert…</p>
            )}
            {backgroundColor === '#EF4444' && (
              <div className="text-white text-4xl font-bold">Trop tôt !</div>
            )}
            {reactionTime !== null && reactionTime > 0 && (
              reactionTime < 101 ? (
                <div className="bg-white/90 dark:bg-gray-800/90 p-6 rounded-lg backdrop-blur-sm text-center">
                  <p className="text-2xl font-bold text-red-500 mb-2">Tu es dopé ?</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Le plus petit temps de réaction humain enregistré est de 101ms
                  </p>
                  <div className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-4 py-1.5 rounded-full text-xs font-medium mb-4">
                    Score non-comptabilisé
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Cliquez n&apos;importe où pour rejouer
                  </p>
                </div>
              ) : (
                <div className="bg-white/90 dark:bg-gray-800/90 p-6 rounded-lg backdrop-blur-sm text-center">
                  <p className="text-black dark:text-white text-xl mb-2">
                    Votre temps de réaction : <span className="font-bold">{reactionTime} ms</span>
                  </p>
                  {earnedPoints !== null && earnedPoints > 0 && (
                    <div className="inline-flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-4 py-2 rounded-full mb-4 text-sm font-semibold">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      +{earnedPoints} pts
                    </div>
                  )}
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    Cliquez n&apos;importe où pour rejouer
                  </p>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </>
  );
}
