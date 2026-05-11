'use client';

import { useState, useEffect, useCallback } from 'react';
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
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import StartModal from '@/components/StartModal';
import GameOverModal from '@/components/GameOverModal';
import { useGameResults } from '@/contexts/GameResultsContext';
import { calculatePoints } from '@/lib/points';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function SequenceMemoryTest() {
  const { saveResult, globalResults } = useGameResults();
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(2);
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'gameover'>('waiting');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [correctTiles, setCorrectTiles] = useState<number[]>([]);
  const [errorTile, setErrorTile] = useState<number | null>(null);
  const [isProcessingError, setIsProcessingError] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [finalPoints, setFinalPoints] = useState(0);

  const generateSequence = useCallback(
    (currentLevel: number) => {
      if (currentLevel === 1) return [Math.floor(Math.random() * 9)];
      const newSequence = [...sequence];
      newSequence.push(Math.floor(Math.random() * 9));
      return newSequence;
    },
    [sequence]
  );

  const showSequence = useCallback(async (sequenceToShow: number[]) => {
    setIsShowingSequence(true);
    setUserSequence([]);
    setCorrectTiles([]);
    setErrorTile(null);
    setIsProcessingError(false);

    const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

    try {
      await wait(500);
      for (let i = 0; i < sequenceToShow.length; i++) {
        setActiveIndex(sequenceToShow[i]);
        await wait(800);
        setActiveIndex(null);
        if (i < sequenceToShow.length - 1) await wait(200);
      }
    } finally {
      await wait(200);
      setActiveIndex(null);
      setIsShowingSequence(false);
    }
  }, []);

  const startGame = useCallback(() => {
    setLevel(1);
    setLives(2);
    setGameStatus('playing');
    setCorrectTiles([]);
    setErrorTile(null);
    setUserSequence([]);
    const initialSequence = [Math.floor(Math.random() * 9)];
    setSequence(initialSequence);
    showSequence(initialSequence);
  }, [showSequence]);

  const handleTileClick = useCallback(
    (index: number) => {
      if (isShowingSequence || gameStatus !== 'playing' || isProcessingError) return;

      if (index === sequence[userSequence.length]) {
        setCorrectTiles((prev) => [...prev, index]);
        setTimeout(() => setCorrectTiles([]), 200);

        const newUserSequence = [...userSequence, index];
        setUserSequence(newUserSequence);

        if (newUserSequence.length === sequence.length) {
          setIsProcessingError(true);
          setTimeout(() => {
            const nextLevel = level + 1;
            setLevel(nextLevel);
            const newSequence = [...sequence, Math.floor(Math.random() * 9)];
            setSequence(newSequence);
            setUserSequence([]);
            showSequence(newSequence);
          }, 500);
        }
      } else {
        setIsProcessingError(true);
        setErrorTile(index);
        const newLives = lives - 1;
        setLives(newLives);

        if (newLives <= 0) {
          const score = level - 1;
          setFinalScore(score);
          setFinalPoints(calculatePoints('sequenceMemory', { score }));
          setGameStatus('gameover');
          saveResult(score);
        } else {
          setTimeout(() => {
            setErrorTile(null);
            setUserSequence([]);
            setCorrectTiles([]);
            setIsProcessingError(false);
            showSequence(sequence);
          }, 500);
        }
      }
    },
    [isShowingSequence, gameStatus, isProcessingError, sequence, userSequence, level, lives, showSequence, saveResult]
  );

  const prepareChartData = () => {
    const intervals = Array.from({ length: 15 }, (_, i) => i + 1);
    const counts = new Array(intervals.length).fill(0);
    globalResults.forEach((result) => {
      if (result.score && result.score > 0) {
        const index = Math.min(result.score - 1, intervals.length - 1);
        if (index >= 0) counts[index]++;
      }
    });
    const total = globalResults.filter((r) => r.score && r.score > 0).length;
    const percentages = counts.map((count) => (count / total) * 100 || 0);
    return {
      labels: intervals.map((value) => `Niveau ${value}`),
      datasets: [
        {
          label: 'Distribution des scores',
          data: percentages,
          borderColor: 'rgb(14, 165, 233)',
          backgroundColor: 'rgba(14, 165, 233, 0.2)',
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
      title: { display: true, text: 'Distribution globale des scores de mémoire de séquence' },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Pourcentage des joueurs (%)' } },
      x: { title: { display: true, text: 'Niveau atteint' } },
    },
  };

  const handleRestart = useCallback(() => {
    setLevel(1);
    setLives(2);
    setGameStatus('playing');
    setCorrectTiles([]);
    setErrorTile(null);
    setUserSequence([]);
    setIsShowingSequence(false);
    const initialSequence = [Math.floor(Math.random() * 9)];
    setSequence(initialSequence);
    showSequence(initialSequence);
  }, [showSequence]);

  const handleBackToRules = useCallback(() => {
    setGameStatus('waiting');
    setLevel(1);
    setLives(2);
    setSequence([]);
    setUserSequence([]);
    setCorrectTiles([]);
    setErrorTile(null);
    setIsShowingSequence(false);
  }, []);

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

      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        {gameStatus === 'waiting' ? (
          <StartModal
            title="Test de Mémoire de Séquence"
            description={
              <p>
                Mémorisez la séquence, puis reproduisez-la dans l&apos;ordre. À chaque niveau, la
                séquence s&apos;allonge d&apos;un clic. Vous avez 2 vies.
              </p>
            }
            onStart={startGame}
            stats={
              globalResults.length > 0 ? (
                <Line data={prepareChartData()} options={chartOptions} />
              ) : (
                <p className="text-center dark:text-gray-200">Aucune donnée disponible pour le moment.</p>
              )
            }
          />
        ) : (
          <div className="max-w-screen-xl mx-auto mt-20 w-full">
            <div className="fixed top-0 left-0 right-0 h-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg z-40">
              <div className="max-w-screen-xl mx-auto h-full flex items-center justify-center gap-8">
                <div className="text-2xl dark:text-white">Niveau {level}</div>
                <div className="flex gap-1">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <span key={i} className="text-2xl">
                      {i < 2 - lives ? '🖤' : '❤️'}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-center items-center min-h-screen pt-16 sm:pt-20">
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                {Array.from({ length: 9 }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleTileClick(index)}
                    disabled={isShowingSequence || isProcessingError}
                    className={`
                      w-[calc(28vw-16px)] h-[calc(28vw-16px)] max-w-24 max-h-24 sm:w-24 sm:h-24 rounded-lg sm:rounded-xl transition-all duration-200
                      ${activeIndex === index ? 'bg-blue-500' : ''}
                      ${correctTiles.includes(index) ? 'bg-green-500' : ''}
                      ${errorTile === index ? 'bg-red-500' : ''}
                      ${activeIndex !== index && !correctTiles.includes(index) && errorTile !== index
                        ? 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                        : ''}
                      disabled:cursor-not-allowed
                    `}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <GameOverModal
        isOpen={gameStatus === 'gameover'}
        score={finalScore}
        points={finalPoints}
        onRestart={handleRestart}
        onBackToRules={handleBackToRules}
        scoreLabel="Niveau atteint"
      />
    </>
  );
}
