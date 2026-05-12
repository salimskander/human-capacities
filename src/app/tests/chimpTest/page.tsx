'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import StartModal from '@/components/StartModal';
import GameOverModal from '@/components/GameOverModal';
import { useAuth } from '@/contexts/AuthContext';
import { calculatePoints } from '@/lib/points';

type GameStatus = 'waiting' | 'playing' | 'showing' | 'gameover';
type NumberTile = { position: number; value: number };


function ChimpTestGame({
  gameKey,
  onGameOver,
}: {
  gameKey: number;
  onGameOver: (score: number, avgMsPerTile: number) => void;
}) {
  const [level, setLevel] = useState(4);
  const [numbers, setNumbers] = useState<NumberTile[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [strikes, setStrikes] = useState(0);
  const [, setScore] = useState(0);
  const [gridSize, setGridSize] = useState(4);
  const [numbersVisible, setNumbersVisible] = useState(true);
  const [cellSize, setCellSize] = useState(70);
  const [levelElapsedMs, setLevelElapsedMs] = useState(0);

  const [correctTiles, setCorrectTiles] = useState<number[]>([]);
  const [errorTile, setErrorTile] = useState<number | null>(null);
  const [clickedTile, setClickedTile] = useState<number | null>(null);
  const [canClick, setCanClick] = useState(false);

  // Speed tracking (refs to avoid stale closures in callbacks)
  const levelStartRef = useRef<number | null>(null);
  const speedRef = useRef({ totalMs: 0, totalTiles: 0 });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  // Compute cell size so the grid always fits below the in-game topbar
  useEffect(() => {
    const update = () => {
      const topBarH = 80;
      const padding = 24;
      const availW = window.innerWidth - padding;
      const availH = window.innerHeight - topBarH - padding;
      const available = Math.min(availW, availH);
      const size = Math.floor(available / gridSize);
      setCellSize(Math.max(40, Math.min(size, 80)));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [gridSize]);

  // Increase grid size every 3 levels
  useEffect(() => {
    const levelIndex = level - 4;
    const shouldIncreaseGrid = levelIndex > 0 && levelIndex % 3 === 0;
    if (shouldIncreaseGrid) {
      setGridSize((prev) => Math.min(prev + 1, 8));
    }
  }, [level]);

  const generateSequence = useCallback(() => {
    const positions = new Set<number>();
    const sequence: NumberTile[] = [];
    while (positions.size < level) {
      const pos = Math.floor(Math.random() * (gridSize * gridSize));
      if (!positions.has(pos)) {
        positions.add(pos);
        sequence.push({ position: pos, value: positions.size });
      }
    }
    return sequence;
  }, [level, gridSize]);

  const startNewLevel = useCallback(() => {
    const newSequence = generateSequence();
    setNumbers(newSequence);
    setUserSequence([]);
    setNumbersVisible(true);
    setCorrectTiles([]);
    setErrorTile(null);
    setCanClick(true);
    // Reset level timer display; timing starts on first tile click
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    levelStartRef.current = null;
    setLevelElapsedMs(0);
  }, [generateSequence]);

  useEffect(() => {
    const timer = setTimeout(() => startNewLevel(), 500);
    return () => clearTimeout(timer);
  }, [startNewLevel]);

  const handleTileClick = useCallback(
    (position: number) => {
      if (gameStatus !== 'playing' || !canClick) return;

      setClickedTile(position);
      setTimeout(() => setClickedTile(null), 200);

      const clickedNumber = numbers.find((n) => n.position === position);
      if (!clickedNumber) return;

      if (clickedNumber.value === 1) {
        setNumbersVisible(false);
        // Start level timer on first click
        levelStartRef.current = Date.now();
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setLevelElapsedMs(Date.now() - (levelStartRef.current ?? Date.now()));
        }, 100);
      }

      const expectedValue = userSequence.length + 1;

      if (clickedNumber.value === expectedValue) {
        setCorrectTiles((prev) => [...prev, position]);
        const newSequence = [...userSequence, clickedNumber.value];
        setUserSequence(newSequence);

        if (newSequence.length === numbers.length) {
          // Level complete — record speed
          if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
          if (levelStartRef.current) {
            speedRef.current.totalMs += Date.now() - levelStartRef.current;
            speedRef.current.totalTiles += numbers.length;
            levelStartRef.current = null;
          }
          setScore((prev) => prev + level);
          setLevel((prev) => prev + 1);
          setCanClick(false);
          setTimeout(() => startNewLevel(), 500);
        }
      } else {
        setCanClick(false);
        setErrorTile(position);
        setStrikes((prev) => prev + 1);
        // Stop timer on error
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

        if (strikes >= 1) {
          setTimeout(() => {
            setGameStatus('gameover');
            const avgMs = speedRef.current.totalTiles > 0
              ? Math.round(speedRef.current.totalMs / speedRef.current.totalTiles)
              : 9999;
            onGameOver(level - 3, avgMs);
          }, 500);
        } else {
          setTimeout(() => startNewLevel(), 800);
        }
      }
    },
    [gameStatus, canClick, numbers, userSequence, strikes, level, startNewLevel, onGameOver]
  );

  const gap = 4;
  const gridPx = gridSize * cellSize + (gridSize - 1) * gap;

  return (
    <>
      <div className="fixed top-0 left-0 right-0 h-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg z-40">
        <div className="max-w-screen-xl mx-auto h-full flex items-center justify-center gap-8">
          <div className="text-2xl font-medium dark:text-white">Niveau {level - 3}</div>
          <div className="flex gap-1">
            {Array.from({ length: 2 }).map((_, i) => (
              <span key={i} className="text-2xl">
                {i < strikes ? '🖤' : '❤️'}
              </span>
            ))}
          </div>
          {levelElapsedMs > 0 && (
            <div className="text-sm font-mono text-yellow-500 dark:text-yellow-400">
              ⚡ {(levelElapsedMs / 1000).toFixed(1)}s
            </div>
          )}
        </div>
      </div>

      {/* Container starts below the topbar and centers the grid in the remaining space */}
      <div
        className="flex items-center justify-center"
        style={{ minHeight: '100vh', paddingTop: '5rem' }}
      >
        <div
          className="grid mx-auto"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
            gap: `${gap}px`,
            width: `${gridPx}px`,
            height: `${gridPx}px`,
          }}
        >
          {Array.from({ length: gridSize * gridSize }).map((_, index) => {
            const number = numbers.find((n) => n.position === index);
            const isCorrect = correctTiles.includes(index);
            const isError = errorTile === index;
            const isClicked = clickedTile === index;

            return (
              <button
                key={`${gameKey}-tile-${index}`}
                onClick={() => handleTileClick(index)}
                style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
                className={`
                  rounded-lg transition-all transform duration-200 relative overflow-hidden flex items-center justify-center
                  ${number ? 'bg-blue-500 hover:bg-blue-600 shadow-lg' : 'bg-transparent'}
                  ${gameStatus === 'playing' && canClick ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
                  ${isCorrect ? 'bg-green-500 hover:bg-green-600' : ''}
                  ${isError ? 'bg-red-500 hover:bg-red-600' : ''}
                  ${isClicked ? 'scale-95' : ''}
                `}
                disabled={!canClick || gameStatus !== 'playing'}
              >
                {numbersVisible && number && (
                  <span className="text-white text-xl font-bold select-none">
                    {number.value}
                  </span>
                )}
                {isCorrect && (
                  <div className="absolute inset-0 bg-green-400 opacity-50 animate-[ping_0.75s_ease-in-out]" />
                )}
                {isError && (
                  <div className="absolute inset-0 bg-red-400 opacity-50 animate-[ping_0.75s_ease-in-out]" />
                )}
                {isClicked && !isCorrect && !isError && (
                  <div className="absolute inset-0 bg-white opacity-30 animate-[ping_0.4s_ease-in-out]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default function ChimpTest() {
  const { currentUser } = useAuth();
  const [gameKey, setGameKey] = useState(Date.now());
  const [gameStatus, setGameStatus] = useState<GameStatus>('waiting');
  const [finalScore, setFinalScore] = useState(0);
  const [finalPoints, setFinalPoints] = useState(0);

  const startGame = useCallback(() => {
    setGameKey(Date.now());
    setGameStatus('playing');
  }, []);

  const saveResult = async (score: number, avgMsPerTile: number) => {
    try {
      await fetch('/api/chimpTest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, avgMsPerTile, userId: currentUser?.uid || null }),
      });
    } catch (error) {
      console.error('Error saving result:', error);
    }
  };

  const handleGameOver = useCallback((score: number, avgMsPerTile: number) => {
    setFinalScore(score);
    setFinalPoints(calculatePoints('chimpTest', { score, avgMsPerTile }));
    setGameStatus('gameover');
    saveResult(score, avgMsPerTile);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const handleRestart = useCallback(() => {
    setGameKey(Date.now());
    setGameStatus('playing');
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

      <div className="min-h-screen bg-white dark:bg-gray-900">
        {gameStatus === 'waiting' ? (
          <div className="flex items-center justify-center min-h-screen">
            <StartModal
              title="Test du Chimpanzé"
              description={
                <p>
                  Les chimpanzés surpassent systématiquement les humains dans ce test de mémoire.
                  Certains peuvent mémoriser 9 chiffres avec plus de 90% de réussite.
                </p>
              }
              onStart={startGame}
            />
          </div>
        ) : gameStatus === 'playing' ? (
          <ChimpTestGame key={gameKey} gameKey={gameKey} onGameOver={handleGameOver} />
        ) : null}

        <GameOverModal
          key={`game-over-${gameKey}`}
          isOpen={gameStatus === 'gameover'}
          score={finalScore}
          points={finalPoints}
          onRestart={handleRestart}
          onBackToRules={() => setGameStatus('waiting')}
          scoreLabel="Niveau atteint"
        />
      </div>
    </>
  );
}
