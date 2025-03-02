'use client';

import { useState, useEffect } from 'react';
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
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Symboles possibles pour les cartes (emojis)
const SYMBOLS = ['🌟', '🎈', '🎨', '🎭', '🎪', '🎯', '🎲', '🎳', '🎮', '🎸', '🎺', '🎨', '🎭', '🎪'];

const prepareChartData = (results: Array<{ score: number }>) => {
  const scores = results.map(r => r.score);
  
  // Calculer les occurrences pour chaque niveau de 1 à 10
  const occurrences = Array.from({ length: 10 }, (_, i) => {
    const level = i + 1;
    const count = scores.filter(score => score === level).length;
    return (count / scores.length) * 100 || 0;
  });

  return {
    labels: Array.from({ length: 10 }, (_, i) => `Niveau ${i + 1}`),
    datasets: [{
      label: 'Distribution des scores (%)',
      data: occurrences,
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.3,
      fill: true,
    }],
  };
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      title: {
        display: true,
        text: 'Niveau atteint',
      }
    },
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Pourcentage des parties (%)',
      },
    },
  },
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: true,
      text: 'Distribution des niveaux atteints',
    },
  },
};

export default function SymbolMemoryTest() {
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [cards, setCards] = useState<Array<{ id: number; symbol: string; isFlipped: boolean; isMatched: boolean }>>([]);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'showing' | 'gameover'>('waiting');
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [results, setResults] = useState<Array<{ timestamp: number; score: number }>>([]);

  const initializeCards = (level: number) => {
    const numberOfPairs = level + 2; // Commence avec 3 paires au niveau 1
    const symbols = SYMBOLS.slice(0, numberOfPairs);
    const pairs = [...symbols, ...symbols];
    
    // Mélanger les cartes
    const shuffledPairs = pairs.sort(() => Math.random() - 0.5);
    
    return shuffledPairs.map((symbol, index) => ({
      id: index,
      symbol,
      isFlipped: true, // Au début, toutes les cartes sont visibles
      isMatched: false
    }));
  };

  const startGame = () => {
    setLevel(1);
    setLives(3);
    setGameStatus('showing');
    const initialCards = initializeCards(1);
    setCards(initialCards);
    
    // Retourner les cartes après 5 secondes
    setTimeout(() => {
      setCards(cards => cards.map(card => ({ ...card, isFlipped: false })));
      setGameStatus('playing');
    }, 5000);
  };

  const handleCardClick = (cardId: number) => {
    if (gameStatus !== 'playing') return;
    if (selectedCards.length === 2) return;
    if (cards[cardId].isMatched || cards[cardId].isFlipped) return;

    // Retourner la carte sélectionnée
    setCards(cards.map(card => 
      card.id === cardId ? { ...card, isFlipped: true } : card
    ));

    setSelectedCards([...selectedCards, cardId]);

    // Si c'est la deuxième carte
    if (selectedCards.length === 1) {
      const firstCard = cards[selectedCards[0]];
      const secondCard = cards[cardId];

      if (firstCard.symbol === secondCard.symbol) {
        // Paire trouvée
        setTimeout(() => {
          setCards(cards.map(card => 
            card.id === cardId || card.id === selectedCards[0]
              ? { ...card, isMatched: true }
              : card
          ));
          setSelectedCards([]);

          // Vérifier si toutes les paires sont trouvées
          if (cards.filter(card => !card.isMatched).length === 2) {
            // Niveau suivant
            setLevel(prev => prev + 1);
            startNextLevel();
          }
        }, 500);
      } else {
        // Erreur
        setTimeout(() => {
          setCards(cards.map(card => 
            card.id === cardId || card.id === selectedCards[0]
              ? { ...card, isFlipped: false }
              : card
          ));
          setSelectedCards([]);
          setLives(prev => prev - 1);
          if (lives <= 1) {
            setGameStatus('gameover');
            saveResult(level - 1);
          }
        }, 1000);
      }
    }
  };

  const startNextLevel = () => {
    setGameStatus('showing');
    const newCards = initializeCards(level);
    setCards(newCards);
    
    setTimeout(() => {
      setCards(cards => cards.map(card => ({ ...card, isFlipped: false })));
      setGameStatus('playing');
    }, 5000);
  };

  const fetchResults = async () => {
    try {
      const response = await fetch('/api/symbolMemory');
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des résultats:', error);
    }
  };

  const saveResult = async (score: number) => {
    try {
      await fetch('/api/symbolMemory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ score }),
      });
      fetchResults();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleRestart = () => {
    setGameStatus('waiting');
    setLevel(1);
    setLives(3);
    setSelectedCards([]);
    setCards([]);
  };

  useEffect(() => {
    fetchResults();
  }, []);

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

      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        {gameStatus === 'waiting' ? (
          <div className="min-h-screen flex flex-col items-center justify-center">
            <div className="text-center max-w-md bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg mx-4">
              <h1 className="text-3xl font-bold mb-4">Test de Mémoire des Symboles</h1>
              <p className="mb-8">
                Mémorisez la position des paires de symboles.
                Retrouvez toutes les paires pour passer au niveau suivant.
                Attention, vous n&apos;avez que trois vies !
              </p>
              <button 
                className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                onClick={startGame}
              >
                Commencer
              </button>
            </div>

            {results.length > 0 && (
              <div className="w-full max-w-2xl mt-8 bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg mx-4">
                <div className="h-[400px]">
                  <Line data={prepareChartData(results)} options={chartOptions} />
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-sm shadow-lg z-40">
              <div className="max-w-screen-xl mx-auto h-full flex items-center justify-center gap-8">
                <div className="text-2xl font-medium">Niveau {level}</div>
                <div className="flex gap-1">
                  {Array.from({ length: lives }).map((_, i) => (
                    <span key={i} className="text-2xl">❤️</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-24 grid grid-cols-3 gap-4 p-4">
              {gameStatus === 'showing' && (
                <div className="fixed top-20 left-0 right-0 h-2 bg-gray-200">
                  <div className="progress-bar"></div>
                </div>
              )}
              {cards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  className={`
                    w-24 h-24 rounded-xl text-4xl 
                    flex items-center justify-center 
                    transition-transform duration-500 
                    preserve-3d cursor-pointer
                    ${card.isFlipped || card.isMatched ? 'rotate-y-180' : ''}
                  `}
                  disabled={card.isMatched || (gameStatus !== 'playing' && !card.isFlipped)}
                >
                  <div className="absolute w-full h-full backface-hidden">
                    <div className="w-full h-full bg-blue-500 hover:bg-blue-600 rounded-xl flex items-center justify-center">
                      <span className="text-2xl text-white">?</span>
                    </div>
                  </div>
                  <div className="absolute w-full h-full backface-hidden rotate-y-180">
                    <div className="w-full h-full bg-white shadow-lg rounded-xl flex items-center justify-center">
                      {card.symbol}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {gameStatus === 'gameover' && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white p-8 rounded-2xl text-center">
                  <h2 className="text-2xl font-bold mb-4">Partie terminée !</h2>
                  <p className="text-xl mb-6">Niveau atteint : {level - 1}</p>
                  <button 
                    onClick={handleRestart}
                    className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                  >
                    Retour aux règles
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}