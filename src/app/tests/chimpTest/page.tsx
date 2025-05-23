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
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import StartModal from '@/components/StartModal';
import GameOverModal from '@/components/GameOverModal';
import { useAuth } from '@/contexts/AuthContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Types
type TestResult = {
  timestamp: number;
  score: number;
};

type GameStatus = 'waiting' | 'playing' | 'showing' | 'gameover';
type NumberTile = { position: number, value: number };

// Composant de jeu principal
function ChimpTestGame({ gameKey, onGameOver }: { gameKey: number, onGameOver: (score: number) => void }) {
  // États du jeu
  const [level, setLevel] = useState(4);
  const [numbers, setNumbers] = useState<NumberTile[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [strikes, setStrikes] = useState(0);
  const [, setScore] = useState(0);
  const [gridSize, setGridSize] = useState(4);
  const [numbersVisible, setNumbersVisible] = useState(true);
  
  // États d'interface utilisateur
  const [correctTiles, setCorrectTiles] = useState<number[]>([]);
  const [errorTile, setErrorTile] = useState<number | null>(null);
  const [clickedTile, setClickedTile] = useState<number | null>(null);
  const [canClick, setCanClick] = useState(false);
  
  // Ajuster la taille de la grille en fonction du niveau
  useEffect(() => {
    const levelIndex = level - 4; // Niveau 4 = index 0
    const shouldIncreaseGrid = levelIndex > 0 && levelIndex % 3 === 0;
    if (shouldIncreaseGrid) {
      setGridSize(prev => Math.min(prev + 1, 8)); // Maximum 8x8
    }
  }, [level]);

  // Génération d'une séquence aléatoire de nombres
  const generateSequence = useCallback(() => {
    const positions = new Set<number>();
    const sequence: NumberTile[] = [];
    
    // Utiliser le niveau actuel comme nombre de chiffres à générer
    while (positions.size < level) {
      const pos = Math.floor(Math.random() * (gridSize * gridSize));
      if (!positions.has(pos)) {
        positions.add(pos);
        sequence.push({
          position: pos,
          value: positions.size
        });
      }
    }
    
    return sequence;
  }, [level, gridSize]);

  // Démarrage d'un nouveau niveau
  const startNewLevel = useCallback(() => {
    const newSequence = generateSequence();
    setNumbers(newSequence);
    setUserSequence([]);
    setNumbersVisible(true);
    setCorrectTiles([]);
    setErrorTile(null);
    setCanClick(true);
  }, [generateSequence]);

  // Initialiser le jeu au montage
  useEffect(() => {
    // Démarrer le premier niveau après un court délai
    const timer = setTimeout(() => {
      startNewLevel();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [startNewLevel]);

  // Gestion du clic sur une tuile
  const handleTileClick = useCallback((position: number) => {
    if (gameStatus !== 'playing' || !canClick) return;

    setClickedTile(position);
    setTimeout(() => setClickedTile(null), 200);

    const clickedNumber = numbers.find(n => n.position === position);
    if (!clickedNumber) return;

    if (clickedNumber.value === 1) {
      setNumbersVisible(false);
    }

    const expectedValue = userSequence.length + 1;
    
    if (clickedNumber.value === expectedValue) {
      // Clic correct
      setCorrectTiles(prev => [...prev, position]);
      const newSequence = [...userSequence, clickedNumber.value];
      setUserSequence(newSequence);

      if (newSequence.length === numbers.length) {
        // Niveau réussi
        setScore(prev => prev + level);
        setLevel(prev => prev + 1);
        
        // Désactiver les clics pendant la transition
        setCanClick(false);
        
        setTimeout(() => {
          startNewLevel();
        }, 500);
      }
    } else {
      // Clic incorrect
      setCanClick(false);
      setErrorTile(position);
      setStrikes(prev => prev + 1);
      
      if (strikes >= 1) {
        // Game over après 2 erreurs
        setTimeout(() => {
          setGameStatus('gameover');
          onGameOver(level - 3);
        }, 500);
      } else {
        // Continuer après une erreur
        setTimeout(() => {
          startNewLevel();
        }, 800);
      }
    }
  }, [gameStatus, canClick, numbers, userSequence, strikes, level, startNewLevel, onGameOver]);

  useEffect(() => {
    // Mise à jour de la logique pour le rendu
  }, [level]);

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
        </div>
      </div>

      <div className="flex items-center justify-center min-h-screen">
        <div 
          className="grid gap-1 sm:gap-2 mx-auto"
          style={{ 
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            width: `${gridSize * (window.innerWidth < 768 ? 70 : 80)}px`,
            height: `${gridSize * (window.innerWidth < 768 ? 70 : 80)}px`
          }}
        >
          {Array.from({ length: gridSize * gridSize }).map((_, index) => {
            const number = numbers.find(n => n.position === index);
            const isCorrect = correctTiles.includes(index);
            const isError = errorTile === index;
            const isClicked = clickedTile === index;

            return (
              <button
                key={`${gameKey}-tile-${index}`}
                onClick={() => handleTileClick(index)}
                className={`
                  w-16 h-16 rounded-lg transition-all transform duration-200
                  ${number ? 'bg-blue-500 hover:bg-blue-600 shadow-lg' : 'bg-transparent'}
                  ${gameStatus === 'playing' && canClick ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
                  ${isCorrect ? 'bg-green-500 hover:bg-green-600 animate-[pulse_0.5s_ease-in-out]' : ''}
                  ${isError ? 'bg-red-500 hover:bg-red-600 animate-[bounce_0.5s_ease-in-out]' : ''}
                  ${isClicked ? 'scale-95' : ''}
                  relative overflow-hidden flex items-center justify-center
                `}
                disabled={!canClick || gameStatus !== 'playing'}
              >
                {numbersVisible && number && (
                  <span className="text-white text-2xl font-bold">
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

// Composant principal qui gère l'état global
export default function ChimpTest() {
  const { currentUser } = useAuth();
  const [gameKey, setGameKey] = useState(Date.now());
  const [gameStatus, setGameStatus] = useState<GameStatus>('waiting');
  const [finalScore, setFinalScore] = useState(0);
  const [results, setResults] = useState<TestResult[]>([]);
  
  useEffect(() => {
    fetchResults();
  }, [currentUser]);

  const fetchResults = async () => {
    try {
      if (currentUser) {
        const response = await fetch(`/api/chimpTest?userId=${currentUser.uid}&type=user`);
        const data = await response.json();
        setResults(data);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  // Préparation des données pour le graphique
  const prepareChartData = useCallback(() => {
    const intervals = Array.from({ length: 9 }, (_, i) => i + 4);
    const counts = new Array(intervals.length).fill(0);
    
    results.forEach(result => {
      const index = result.score - 4;
      if (index >= 0 && index < counts.length) {
        counts[index]++;
      }
    });

    const total = results.length;
    const percentages = counts.map(count => (count / total) * 100 || 0);

    return {
      labels: intervals,
      datasets: [
        {
          label: 'Distribution des scores (%)',
          data: percentages,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          tension: 0.3
        }
      ]
    };
  }, [results]);

  // Options du graphique
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Pourcentage de parties (%)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Niveau atteint'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const
      },
      title: {
        display: true,
        text: 'Distribution des performances'
      }
    }
  };

  // Démarrer une nouvelle partie
  const startGame = useCallback(() => {
    setGameKey(Date.now()); // Forcer la recréation complète du composant de jeu
    setGameStatus('playing');
  }, []);

  // Gérer la fin de partie
  const handleGameOver = useCallback((score: number) => {
    setFinalScore(score);
    setGameStatus('gameover');
    saveResult(score);
  }, []);

  // Déplacer la fonction saveResult avant handleGameOver
  const saveResult = async (score: number) => {
    try {
      await fetch('/api/chimpTest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          timestamp: Date.now(), 
          score,
          userId: currentUser?.uid || null
        }),
      });
      fetchResults();
    } catch (error) {
      console.error('Error saving result:', error);
    }
  };

  // Redémarrer le jeu
  const handleRestart = useCallback(() => {
    setGameKey(Date.now()); // Forcer la recréation complète du composant de jeu
    setGameStatus('playing');
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </Link>

      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        {gameStatus === 'waiting' ? (
          <StartModal 
            title="Test du Chimpanzé"
            description={
              <p>
                Les chimpanzés surpassent systématiquement les humains dans ce test de mémoire.
                Certains peuvent mémoriser 9 chiffres avec plus de 90% de réussite.
              </p>
            }
            onStart={startGame}
            stats={results.length > 0 ? (
              <Line data={prepareChartData()} options={chartOptions} />
            ) : (
              <p className="text-center dark:text-gray-200">Aucune donnée disponible pour le moment.</p>
            )}
          />
        ) : gameStatus === 'playing' ? (
          <ChimpTestGame 
            key={gameKey} 
            gameKey={gameKey} 
            onGameOver={handleGameOver} 
          />
        ) : null}

        <GameOverModal 
          key={`game-over-${gameKey}`}
          isOpen={gameStatus === 'gameover'}
          score={finalScore}
          onRestart={handleRestart}
          onBackToRules={() => setGameStatus('waiting')}
          scoreLabel="Niveau atteint"
        />
      </div>
    </>
  );
}