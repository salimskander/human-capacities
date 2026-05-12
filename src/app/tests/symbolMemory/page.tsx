'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Line } from 'react-chartjs-2';
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
import StartModal from '@/components/StartModal';
import ProgressBar from '@/components/ProgressBar';
import GameOverModal from '@/components/GameOverModal';
import { useAuth } from '@/contexts/AuthContext';
import { useGameResults } from '@/contexts/GameResultsContext';
import { calculatePoints } from '@/lib/points';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const SYMBOLS = ['🌟', '🎈', '🎨', '🎭', '🎪', '🎯', '🎲', '🎳', '🎮', '🎸', '🎺', '🏆', '🎁', '🎀'];
const getShowDuration = (lvl: number) => Math.min(5000, 1500 + lvl * 500);

interface TestResult {
  score: number;
  timestamp: string;
}

const prepareChartData = (results: Array<{ score: number }>) => {
  const scores = results.map((r) => r.score);
  const occurrences = Array.from({ length: 10 }, (_, i) => {
    const level = i + 1;
    const count = scores.filter((s) => s === level).length;
    return (count / scores.length) * 100 || 0;
  });
  return {
    labels: Array.from({ length: 10 }, (_, i) => `Niveau ${i + 1}`),
    datasets: [
      {
        label: 'Distribution des scores (%)',
        data: occurrences,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.3,
        fill: true,
      },
    ],
  };
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: { title: { display: true, text: 'Niveau atteint' } },
    y: { beginAtZero: true, title: { display: true, text: 'Pourcentage des parties (%)' } },
  },
  plugins: {
    legend: { position: 'top' as const },
    title: { display: true, text: 'Distribution des niveaux atteints' },
  },
};

export default function SymbolMemoryTest() {
  const { currentUser } = useAuth();
  const { saveResult, globalResults } = useGameResults();
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(2);
  const [cards, setCards] = useState<
    Array<{ id: number; symbol: string; isFlipped: boolean; isMatched: boolean }>
  >([]);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'showing' | 'gameover'>('waiting');
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [finalScore, setFinalScore] = useState(0);
  const [finalPoints, setFinalPoints] = useState(0);
  const [showDuration, setShowDuration] = useState(getShowDuration(1));
  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingIsMatchRef = useRef(false);

  const initializeCards = useCallback((lvl: number) => {
    const numberOfPairs = lvl + 2;
    const symbols = SYMBOLS.slice(0, numberOfPairs);
    const pairs = [...symbols, ...symbols].sort(() => Math.random() - 0.5);
    return pairs.map((symbol, index) => ({ id: index, symbol, isFlipped: true, isMatched: false }));
  }, []);

  const startGame = useCallback(() => {
    if (pendingRef.current) { clearTimeout(pendingRef.current); pendingRef.current = null; }
    setLevel(1);
    setLives(2);
    setGameStatus('showing');
    const initialCards = initializeCards(1);
    setCards(initialCards);
    const dur = getShowDuration(1);
    setShowDuration(dur);
    setTimeout(() => {
      setCards((c) => c.map((card) => ({ ...card, isFlipped: false })));
      setGameStatus('playing');
    }, dur);
  }, [initializeCards]);

  const startNextLevel = useCallback(
    (nextLevel: number) => {
      setGameStatus('showing');
      const newCards = initializeCards(nextLevel);
      setCards(newCards);
      const dur = getShowDuration(nextLevel);
      setShowDuration(dur);
      setTimeout(() => {
        setCards((c) => c.map((card) => ({ ...card, isFlipped: false })));
        setGameStatus('playing');
      }, dur);
    },
    [initializeCards]
  );

  const handleCardClick = useCallback(
    (cardId: number) => {
      if (gameStatus !== 'playing') return;

      // Resolve any pending pair immediately so the user doesn't have to wait
      let baseCards = cards;
      let baseSelected = selectedCards;
      if (selectedCards.length === 2) {
        if (pendingRef.current) { clearTimeout(pendingRef.current); pendingRef.current = null; }
        const [id1, id2] = selectedCards;
        if (pendingIsMatchRef.current) {
          baseCards = cards.map((card) =>
            card.id === id1 || card.id === id2 ? { ...card, isMatched: true } : card
          );
          setCards(baseCards);
          const totalMatched = baseCards.filter((c) => c.isMatched).length;
          if (totalMatched >= baseCards.length) {
            const nextLevel = level + 1;
            setLevel(nextLevel);
            startNextLevel(nextLevel);
            return;
          }
        } else {
          baseCards = cards.map((card) =>
            card.id === id1 || card.id === id2 ? { ...card, isFlipped: false } : card
          );
          setCards(baseCards);
        }
        baseSelected = [];
        setSelectedCards([]);
      }

      const clickedCard = baseCards.find((c) => c.id === cardId);
      if (!clickedCard || clickedCard.isMatched || clickedCard.isFlipped) return;

      const newCards = baseCards.map((card) =>
        card.id === cardId ? { ...card, isFlipped: true } : card
      );
      const newSelected = [...baseSelected, cardId];
      setCards(newCards);
      setSelectedCards(newSelected);

      if (newSelected.length === 2) {
        const firstCard = newCards.find((c) => c.id === newSelected[0])!;
        const secondCard = newCards.find((c) => c.id === newSelected[1])!;

        if (firstCard.symbol === secondCard.symbol) {
          pendingIsMatchRef.current = true;
          pendingRef.current = setTimeout(() => {
            pendingRef.current = null;
            setCards((c) =>
              c.map((card) =>
                card.id === newSelected[0] || card.id === newSelected[1]
                  ? { ...card, isMatched: true }
                  : card
              )
            );
            setSelectedCards([]);
            const matched = newCards.filter((c) => c.isMatched).length + 2;
            if (matched >= newCards.length) {
              const nextLevel = level + 1;
              setLevel(nextLevel);
              startNextLevel(nextLevel);
            }
          }, 500);
        } else {
          // Deduct life immediately on mismatch detection
          const newLives = lives - 1;
          setLives(newLives);
          if (newLives <= 0) {
            const score = level - 1;
            setFinalScore(score);
            setFinalPoints(calculatePoints('symbolMemory', { score }));
            setGameStatus('gameover');
            saveResult(score);
            return;
          }
          pendingIsMatchRef.current = false;
          pendingRef.current = setTimeout(() => {
            pendingRef.current = null;
            setCards((c) =>
              c.map((card) =>
                card.id === newSelected[0] || card.id === newSelected[1]
                  ? { ...card, isFlipped: false }
                  : card
              )
            );
            setSelectedCards([]);
          }, 500);
        }
      }
    },
    [gameStatus, selectedCards, cards, level, lives, startNextLevel, saveResult]
  );

  const handleRestart = useCallback(() => {
    if (pendingRef.current) { clearTimeout(pendingRef.current); pendingRef.current = null; }
    setLevel(1);
    setLives(2);
    setGameStatus('showing');
    const newCards = initializeCards(1);
    setCards(newCards);
    const dur = getShowDuration(1);
    setShowDuration(dur);
    setTimeout(() => {
      setCards((c) => c.map((card) => ({ ...card, isFlipped: false })));
      setGameStatus('playing');
    }, dur);
  }, [initializeCards]);

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
            title="Test de Mémoire des Symboles"
            description={
              <p>
                Mémorisez la position des paires de symboles. Retrouvez toutes les paires pour
                passer au niveau suivant. Vous avez deux vies !
              </p>
            }
            onStart={startGame}
          />
        ) : (
          <>
            <div className="fixed top-0 left-0 right-0 h-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg z-40">
              <div className="max-w-screen-xl mx-auto h-full flex items-center justify-center gap-8">
                <div className="text-2xl font-medium dark:text-white">Niveau {level}</div>
                <div className="flex gap-1">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <span key={i} className="text-2xl">
                      {i < 2 - lives ? '🖤' : '❤️'}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="container mx-auto px-4 pt-24 pb-6">
              {gameStatus === 'showing' && (
                <div className="fixed top-20 left-0 right-0 z-40">
                  <ProgressBar duration={showDuration} isActive={gameStatus === 'showing'} />
                </div>
              )}

              <div className="grid grid-cols-3 md:grid-cols-4 gap-1 md:gap-2 mx-auto max-w-md">
                {cards.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => handleCardClick(card.id)}
                    className={`
                      aspect-square w-full rounded-lg text-xl
                      flex items-center justify-center
                      transition-transform duration-500
                      preserve-3d cursor-pointer
                      ${card.isFlipped || card.isMatched ? 'rotate-y-180' : ''}
                    `}
                    disabled={card.isMatched || (gameStatus !== 'playing' && !card.isFlipped)}
                  >
                    <div className="absolute w-full h-full backface-hidden">
                      <div className="w-full h-full bg-blue-500 hover:bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-base md:text-xl text-white">?</span>
                      </div>
                    </div>
                    <div className="absolute w-full h-full backface-hidden rotate-y-180">
                      <div className="w-full h-full bg-white dark:bg-gray-800 shadow-lg rounded-lg flex items-center justify-center dark:text-white">
                        {card.symbol}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <GameOverModal
        isOpen={gameStatus === 'gameover'}
        score={finalScore}
        points={finalPoints}
        onRestart={handleRestart}
        onBackToRules={() => setGameStatus('waiting')}
        scoreLabel="Niveau atteint"
      />
    </>
  );
}
