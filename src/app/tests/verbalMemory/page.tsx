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

// Liste de mots français courants
const MOTS_FRANCAIS = [
  'maison', 'voiture', 'chat', 'chien', 'table', 'livre', 'arbre', 'soleil',
  'lune', 'étoile', 'fleur', 'oiseau', 'pain', 'eau', 'café', 'musique',
  'temps', 'amour', 'travail', 'famille', 'ami', 'ville', 'pays', 'monde',
  'jardin', 'école', 'plage', 'montagne', 'cuisine', 'téléphone', 'ordinateur', 'fenêtre',
  'porte', 'route', 'train', 'avion', 'vélo', 'radio', 'journal', 'lettre',
  'histoire', 'film', 'photo', 'danse', 'chanson', 'pluie', 'neige', 'vent',
  'forêt', 'mer', 'rivière', 'lac', 'nuage', 'orage', 'matin', 'soir',
  'nuit', 'hiver', 'été', 'printemps', 'automne', 'fruit', 'légume', 'viande',
  'poisson', 'fromage', 'gâteau', 'chocolat', 'sucre', 'sel', 'restaurant', 'hôtel'
];

export default function VerbalMemoryTest() {
  const { currentUser } = useAuth();
  const [motsDejaProposes, setMotsDejaProposes] = useState<Set<string>>(new Set());
  const [motCourant, setMotCourant] = useState<string>('');
  const [score, setScore] = useState<number>(0);
  const [vies, setVies] = useState<number>(2);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'gameover'>('waiting');
  const [results, setResults] = useState<Array<{ timestamp: number, score: number }>>([]);
  const [showErrorAnimation, setShowErrorAnimation] = useState<boolean>(false);
  const [buttonsDisabled, setButtonsDisabled] = useState<boolean>(false);

  useEffect(() => {
    fetchResults();
  }, [currentUser]);

  const fetchResults = async () => {
    try {
      if (currentUser) {
        const response = await fetch(`/api/verbalMemory?userId=${currentUser.uid}&type=user`);
        const data = await response.json();
        setResults(data);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des résultats:', error);
    }
  };

  const saveScore = async () => {
    try {
      await fetch('/api/verbalMemory', {
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
      console.error('Erreur lors de la sauvegarde du score:', error);
    }
  };

  const prepareChartData = () => {
    const intervals = Array.from({ length: 10 }, (_, i) => i * 10);
    const data = new Array(intervals.length).fill(0);
    const total = results.length;

    results.forEach(result => {
      const index = Math.floor(result.score / 10);
      if (index < data.length) {
        data[index]++;
      }
    });

    const percentages = data.map(count => (count / total) * 100 || 0);

    return {
      labels: intervals.map(i => `${i}-${i + 9}`),
      datasets: [{
        label: 'Distribution des scores (%)',
        data: percentages,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.3,
        fill: true,
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Intervalles de score',
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
        text: 'Distribution des scores',
      },
    },
  };

  const choisirNouveauMot = () => {
    // Réinitialiser l'animation d'erreur lorsqu'un nouveau mot est choisi
    setShowErrorAnimation(false);
    
    const utiliserMotDejaVu = Math.random() > 0.5 && motsDejaProposes.size > 0;
    
    if (utiliserMotDejaVu) {
      const motsArray = Array.from(motsDejaProposes);
      // Filtrer pour exclure le mot courant et éviter la répétition
      const motsDisponibles = motsArray.filter(mot => mot !== motCourant);
      
      // Si tous les mots déjà vus sont le mot courant (cas rare mais possible)
      if (motsDisponibles.length === 0) {
        // Forcer l'utilisation d'un nouveau mot
        const nouveauxMots = MOTS_FRANCAIS.filter(mot => !motsDejaProposes.has(mot));
        if (nouveauxMots.length === 0) return;
        const nouveauMot = nouveauxMots[Math.floor(Math.random() * nouveauxMots.length)];
        setMotCourant(nouveauMot);
      } else {
        // Choisir un mot aléatoire parmi les mots déjà vus (sauf le mot courant)
        const motAleatoire = motsDisponibles[Math.floor(Math.random() * motsDisponibles.length)];
        setMotCourant(motAleatoire);
      }
    } else {
      const motsDisponibles = MOTS_FRANCAIS.filter(mot => !motsDejaProposes.has(mot) && mot !== motCourant);
      if (motsDisponibles.length === 0) return;
      
      const nouveauMot = motsDisponibles[Math.floor(Math.random() * motsDisponibles.length)];
      setMotCourant(nouveauMot);
    }
  };

  const handleGameOver = async () => {
    setGameStatus('gameover');
    await saveScore();
  };

  const handleReponse = (dejaVu: boolean) => {
    const estEffectivementDejaVu = motsDejaProposes.has(motCourant);
    
    if ((dejaVu && estEffectivementDejaVu) || (!dejaVu && !estEffectivementDejaVu)) {
      setScore(prev => prev + 1);
      if (!estEffectivementDejaVu) {
        setMotsDejaProposes(prev => new Set(prev).add(motCourant));
      }
      choisirNouveauMot();
    } else {
      setVies(prev => prev - 1);
      setShowErrorAnimation(true);
      setButtonsDisabled(true);
      
      // Attendre que l'animation se termine avant de passer au mot suivant
      setTimeout(() => {
        setShowErrorAnimation(false);
        setButtonsDisabled(false);
        
        if (vies <= 1) {
          handleGameOver();
          return;
        }
        
        choisirNouveauMot();
      }, 700); // Délai de 700ms pour l'animation
    }
  };

  const startGame = () => {
    setGameStatus('playing');
    setScore(0);
    setVies(2);
    setMotsDejaProposes(new Set());
    choisirNouveauMot();
  };

  const handleRestart = () => {
    startGame();
  };

  const handleBackToRules = () => {
    setGameStatus('waiting');
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
            title="Test de Mémoire Verbale"
            description={
              <p>
                Un mot apparaîtra à l&apos;écran. Si vous l&apos;avez déjà vu pendant ce test, cliquez sur &quot;VU&quot;.
                S&apos;il s&apos;agit d&apos;un nouveau mot que vous n&apos;avez pas encore vu, cliquez sur &quot;NOUVEAU&quot;.
                Vous avez deux vies.
              </p>
            }
            onStart={startGame}
            stats={results.length > 0 ? (
              <Line data={prepareChartData()} options={chartOptions} />
            ) : (
              <p className="text-center dark:text-gray-200">Aucune donnée disponible pour le moment.</p>
            )}
          />
        ) : (
          <>
            <div className="fixed top-0 left-0 right-0 h-16 sm:h-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg z-40">
              <div className="max-w-screen-xl mx-auto h-full flex items-center justify-center gap-4 sm:gap-8">
                <div className="text-xl sm:text-2xl dark:text-white">Score: {score}</div>
                <div className="flex gap-1">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <span key={i} className="text-xl sm:text-2xl">
                      {i < (2 - vies) ? '🖤' : '❤️'}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-6 sm:gap-8 pt-20 sm:pt-24 px-4">
              <div 
                className={`text-3xl sm:text-4xl font-bold mb-4 sm:mb-8 dark:text-white text-center transition-all ${
                  showErrorAnimation 
                    ? 'animate-shake text-red-500 dark:text-red-400' 
                    : ''
                }`}
              >
                {motCourant}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
                <button 
                  onClick={() => handleReponse(true)}
                  disabled={buttonsDisabled}
                  className={`px-6 sm:px-10 py-4 sm:py-5 bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-2xl hover:from-indigo-700 hover:to-blue-800 transition-all duration-200 text-lg sm:text-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transform active:scale-95 ${buttonsDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  DÉJÀ VU
                </button>
                <button 
                  onClick={() => handleReponse(false)}
                  disabled={buttonsDisabled}
                  className={`px-6 sm:px-10 py-4 sm:py-5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 text-lg sm:text-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transform active:scale-95 ${buttonsDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  NOUVEAU
                </button>
              </div>
            </div>
          </>
        )}

        {gameStatus === 'gameover' && (
          <GameOverModal 
            isOpen={gameStatus === 'gameover'}
            score={score}
            onRestart={handleRestart}
            onBackToRules={handleBackToRules}
            scoreLabel="Score final"
          />
        )}
      </div>
    </>
  );
}