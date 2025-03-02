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
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'showing' | 'gameover'>('waiting');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [correctTiles, setCorrectTiles] = useState<number[]>([]);
  const [errorTile, setErrorTile] = useState<number | null>(null);
  const [results, setResults] = useState<Array<{ timestamp: number; score: number }>>([]);
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
    setLives(3);
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
    
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    await wait(500);
    
    for (let i = 0; i < sequenceToShow.length; i++) {
      setActiveIndex(sequenceToShow[i]);
      await wait(800);
      setActiveIndex(null);
      await wait(200);
    }
    
    setIsShowingSequence(false);
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
      const response = await fetch('/api/sequenceMemory');
      const data = await response.json();
      setResults(Array.isArray(data) ? data : []);
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
        body: JSON.stringify({ score }),
      });
      fetchResults();
    } catch (error) {
      console.error('Failed to save result:', error);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

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

  return (
    <>
      <Link 
        href="/"
        className="fixed top-4 left-4 w-12 h-12 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors z-50"
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

      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-screen-xl mx-auto mt-20">
          {gameStatus === 'waiting' ? (
            <div className="flex flex-col items-center justify-center space-y-8 max-w-2xl mx-auto">
              <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg w-full">
                <h1 className="text-3xl font-bold mb-4 text-center">Test de Mémoire de Séquence</h1>
                <p className="mb-8 text-center">
                  Mémorisez la séquence qui s&apos;affiche et reproduisez-la dans le même ordre.
                  À chaque niveau, la séquence s&apos;allonge d&apos;un clic.
                  Vous avez trois vies.
                </p>
                <div className="flex justify-center">
                  <button 
                    className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                    onClick={startGame}
                  >
                    Commencer
                  </button>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg w-full">
                <h2 className="text-2xl font-bold mb-4 text-center">Statistiques</h2>
                <div className="h-[400px]">
                  <Line data={prepareChartData(results)} options={chartOptions} />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-sm shadow-lg z-40">
                <div className="max-w-screen-xl mx-auto h-full flex items-center justify-center gap-8">
                  <div className="text-2xl">Niveau {level}</div>
                  <div className="flex gap-1">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <span key={i} className="text-2xl">
                        {i < (3 - lives) ? '🖤' : '❤️'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-center items-center min-h-screen">
                <div className="grid grid-cols-3 gap-4">
                  {Array.from({ length: 9 }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handleTileClick(index)}
                      disabled={isShowingSequence || isProcessingError}
                      className={`
                        w-24 h-24 rounded-xl transition-all duration-200
                        ${isShowingSequence && activeIndex === index ? 'bg-blue-500' : ''}
                        ${correctTiles.includes(index) ? 'bg-green-500' : ''}
                        ${errorTile === index ? 'bg-red-500' : ''}
                        ${!activeIndex && !correctTiles.includes(index) && errorTile !== index ? 'bg-gray-200 hover:bg-gray-300' : ''}
                        disabled:cursor-not-allowed
                      `}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {gameStatus === 'gameover' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl text-center">
            <h2 className="text-2xl font-bold mb-4">Partie terminée !</h2>
            <p className="text-xl mb-6">Niveau atteint : {level - 1}</p>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => {
                  setGameStatus('waiting');
                  setLevel(1);
                  setLives(3);
                  setSequence([]);
                  setUserSequence([]);
                  setCorrectTiles([]);
                  setErrorTile(null);
                  setIsShowingSequence(false);
                }}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
              >
                Retour aux règles
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}