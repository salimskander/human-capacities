'use client';

import { useState, useEffect } from 'react';
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

export default function SequenceMemoryTest() {
  const { currentUser } = useAuth();
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(2);
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'showing' | 'gameover'>('waiting');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [correctTiles, setCorrectTiles] = useState<number[]>([]);
  const [errorTile, setErrorTile] = useState<number | null>(null);
  const [results, setResults] = useState<Array<{ timestamp: number, score: number }>>([]);
  const [isProcessingError, setIsProcessingError] = useState(false);

  const generateSequence = (currentLevel: number) => {
    if (currentLevel === 1) {
      // Au niveau 1, générer une nouvelle séquence avec une seule tuile
      return [Math.floor(Math.random() * 9)];
    } else {
      // Pour les niveaux suivants, ajouter une tuile à la séquence existante
      const newSequence = [...sequence];
      newSequence.push(Math.floor(Math.random() * 9));
      return newSequence;
    }
  };

  const startGame = () => {
    setLevel(1);
    setLives(2);
    setGameStatus('playing');
    setCorrectTiles([]);
    setErrorTile(null);
    setUserSequence([]);
    const initialSequence = generateSequence(1);
    setSequence(initialSequence);
    showSequence(initialSequence);
  };

  const showSequence = async (sequenceToShow: number[]) => {
    setIsShowingSequence(true);
    setUserSequence([]);
    setCorrectTiles([]);
    setErrorTile(null);
    setIsProcessingError(false);
    
    // Fonction plus fiable pour attendre
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    try {
      // Attendre que l'état soit mis à jour
      await wait(500);
      
      for (let i = 0; i < sequenceToShow.length; i++) {
        setActiveIndex(sequenceToShow[i]);
        await wait(800); // Durée d'affichage de la tuile active
        setActiveIndex(null);
        
        // Ne pas attendre après la dernière tuile
        if (i < sequenceToShow.length - 1) {
          await wait(200);
        }
      }
    } catch (error) {
      console.error("Erreur lors de l'affichage de la séquence:", error);
    } finally {
      // S'assurer que l'état est correctement réinitialisé même en cas d'erreur
      await wait(200);
      setActiveIndex(null);
      setIsShowingSequence(false);
    }
  };

  const handleTileClick = (index: number) => {
    if (isShowingSequence || gameStatus !== 'playing' || isProcessingError) return;

    if (index === sequence[userSequence.length]) {
      // Bonne tuile
      setCorrectTiles(prev => [...prev, index]);
      setTimeout(() => setCorrectTiles([]), 200);
      
      const newUserSequence = [...userSequence, index];
      setUserSequence(newUserSequence);

      // Si la séquence est complète, on désactive immédiatement les clics
      if (newUserSequence.length === sequence.length) {
        setIsProcessingError(true); // Utilise isProcessingError pour bloquer les clics
        setTimeout(() => {
          setLevel(prev => prev + 1);
          const newSequence = generateSequence(level + 1);
          setSequence(newSequence);
          setUserSequence([]);
          showSequence(newSequence);
        }, 500);
      }
    } else {
      // Mauvaise tuile
      setIsProcessingError(true);
      setErrorTile(index);
      const newLives = lives - 1;
      setLives(newLives);
      
      if (newLives <= 0) {
        setGameStatus('gameover');
        saveResult(level - 1);
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
  };

  const fetchResults = async () => {
    try {
      if (currentUser) {
        const response = await fetch(`/api/sequenceMemory?userId=${currentUser.uid}&type=user`);
        const data = await response.json();
        setResults(Array.isArray(data) ? data : []);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Failed to fetch results:', error);
      setResults([]);
    }
  };

  const saveResult = async (score: number) => {
    try {
      await fetch('/api/sequenceMemory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          score,
          userId: currentUser?.uid || null
        }),
      });
      fetchResults();
    } catch (error) {
      console.error('Failed to save result:', error);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [currentUser]);

  const prepareChartData = (results: Array<{ score: number }>) => {
    // Créer un tableau de 12 niveaux (1-12)
    const levels = Array.from({ length: 12 }, (_, i) => i + 1);
    
    // Compter le nombre de parties pour chaque niveau
    const scoreCounts = new Array(12).fill(0);
    results.forEach(result => {
      if (result.score >= 1 && result.score <= 12) {
        scoreCounts[result.score - 1]++;
      }
    });
    
    // Calculer les pourcentages
    const total = results.length || 1;
    const percentages = scoreCounts.map(count => (count / total) * 100);

    return {
      labels: levels,
      datasets: [{
        label: 'Pourcentage des parties',
        data: percentages,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderWidth: 2,
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Pourcentage des parties (%)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Niveau atteint'
        },
        ticks: {
          stepSize: 1
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Distribution des scores'
      }
    }
  };

  const handleRestart = () => {
    setLevel(1);
    setLives(2);
    setGameStatus('playing');
    setCorrectTiles([]);
    setErrorTile(null);
    setUserSequence([]);
    setSequence([]);
    setIsShowingSequence(false);
    const initialSequence = generateSequence(1);
    setSequence(initialSequence);
    showSequence(initialSequence);
  };

  const handleBackToRules = () => {
    setGameStatus('waiting');
    setLevel(1);
    setLives(2);
    setSequence([]);
    setUserSequence([]);
    setCorrectTiles([]);
    setErrorTile(null);
    setIsShowingSequence(false);
  };

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
            title="Test de Mémoire de Séquence"
            description={
              <p>
                Mémorisez la séquence, puis reproduisez-la dans l&apos;ordre.
                À chaque niveau, la séquence s&apos;allonge d&apos;un clic.
                Vous avez 2 vies. Si vous vous trompez, vous n&apos;en perdez qu&apos;une.
              </p>
            }
            onStart={startGame}
            stats={results.length > 0 ? (
              <Line data={prepareChartData(results)} options={chartOptions} />
            ) : (
              <p className="text-center dark:text-gray-200">Aucune donnée disponible pour le moment.</p>
            )}
          />
        ) : (
          <div className="max-w-screen-xl mx-auto mt-20 w-full">
            <div className="fixed top-0 left-0 right-0 h-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg z-40">
              <div className="max-w-screen-xl mx-auto h-full flex items-center justify-center gap-8">
                <div className="text-2xl dark:text-white">Niveau {level}</div>
                <div className="flex gap-1">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <span key={i} className="text-2xl">
                      {i < (2 - lives) ? '🖤' : '❤️'}
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
                      ${activeIndex !== index && !correctTiles.includes(index) && errorTile !== index ? 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600' : ''}
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
        score={level - 1}
        onRestart={handleRestart}
        onBackToRules={handleBackToRules}
        scoreLabel="Niveau atteint"
      />
    </>
  );
}