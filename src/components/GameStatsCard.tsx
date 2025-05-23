import { Line } from 'react-chartjs-2';
import Link from 'next/link';
import { ReactNode } from 'react';

interface GameResult {
  timestamp: string;
  score: number;
  [key: string]: unknown;
}

interface GameStatsCardProps {
  title: string;
  data: GameResult[];
  scoreLabel: string;
  icon: ReactNode;
  link: string;
  color: string;
  prepareChartData: (data: GameResult[], valueKey?: string) => any;
  lowerIsBetter?: boolean;
}

export default function GameStatsCard({ 
  title, 
  data, 
  scoreLabel, 
  icon, 
  link, 
  color,
  prepareChartData,
  lowerIsBetter = false
}: GameStatsCardProps) {
  // Pas de données
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col h-full">
        <div className={`bg-gradient-to-r ${color} p-4 text-white`}>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{title}</h3>
            <div className="w-8 h-8 flex items-center justify-center">{icon}</div>
          </div>
        </div>
        
        <div className="p-6 flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Aucune donnée disponible pour ce test.
          </p>
          <Link 
            href={link} 
            className={`px-4 py-2 bg-gradient-to-r ${color} text-white rounded-lg hover:opacity-90 transition-opacity`}
          >
            Jouer maintenant
          </Link>
        </div>
      </div>
    );
  }
  
  // ✅ Trier les données par timestamp (plus récent en premier)
  const sortedData = [...data].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  // Calcul des statistiques
  const scores = sortedData
    .map(item => {
      if (item.reactionTime !== undefined) return item.reactionTime;
      return item.score;
    })
    .filter(score => score !== null && score !== undefined && !isNaN(score));

  if (scores.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col h-full">
        <div className={`bg-gradient-to-r ${color} p-4 text-white`}>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{title}</h3>
            <div className="w-8 h-8 flex items-center justify-center">{icon}</div>
          </div>
        </div>
        
        <div className="p-6 flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Toutes les données ont des scores invalides.
          </p>
          <Link 
            href={link} 
            className={`px-4 py-2 bg-gradient-to-r ${color} text-white rounded-lg hover:opacity-90 transition-opacity`}
          >
            Jouer maintenant
          </Link>
        </div>
      </div>
    );
  }

  const bestScore = lowerIsBetter 
    ? Math.min(...scores) 
    : Math.max(...scores);
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const lastScore = scores[0]; // ✅ Le plus récent (premier après tri)
  
  // ✅ Passer les données triées au graphique
  const chartData = prepareChartData(sortedData);
  
  // Obtenir des couleurs adaptées au thème du jeu
  let borderColor, backgroundColor;
  
  switch (color) {
    case 'from-blue-500 to-blue-600':
      borderColor = 'rgb(59, 130, 246)';
      backgroundColor = 'rgba(59, 130, 246, 0.1)';
      break;
    case 'from-green-500 to-green-600':
      borderColor = 'rgb(34, 197, 94)';
      backgroundColor = 'rgba(34, 197, 94, 0.1)';
      break;
    case 'from-purple-500 to-purple-600':
      borderColor = 'rgb(168, 85, 247)';
      backgroundColor = 'rgba(168, 85, 247, 0.1)';
      break;
    case 'from-red-500 to-red-600':
      borderColor = 'rgb(239, 68, 68)';
      backgroundColor = 'rgba(239, 68, 68, 0.1)';
      break;
    case 'from-yellow-500 to-yellow-600':
      borderColor = 'rgb(234, 179, 8)';
      backgroundColor = 'rgba(234, 179, 8, 0.1)';
      break;
    case 'from-indigo-500 to-indigo-600':
      borderColor = 'rgb(99, 102, 241)';
      backgroundColor = 'rgba(99, 102, 241, 0.1)';
      break;
    case 'from-pink-500 to-pink-600':
      borderColor = 'rgb(236, 72, 153)';
      backgroundColor = 'rgba(236, 72, 153, 0.1)';
      break;
    case 'from-teal-500 to-teal-600':
      borderColor = 'rgb(20, 184, 166)';
      backgroundColor = 'rgba(20, 184, 166, 0.1)';
      break;
    default:
      borderColor = 'rgb(59, 130, 246)';
      backgroundColor = 'rgba(59, 130, 246, 0.1)';
  }

  // ✅ Options du graphique adaptées selon le type de score
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeOutQuart' as const
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#333',
        bodyColor: '#333',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 6,
        displayColors: false,
        callbacks: {
          title: (items: any) => {
            // ✅ Inverser l'index pour afficher correctement l'ordre chronologique
            const actualIndex = scores.length - items[0].dataIndex;
            return `Partie ${actualIndex}`;
          },
          label: (item: any) => {
            return `${scoreLabel}: ${item.raw}`;
          }
        }
      },
      filler: {
        propagate: false
      }
    },
    scales: {
      y: {
        // ✅ Pour les réflexes, inverser l'échelle (plus bas = mieux)
        reverse: lowerIsBetter,
        beginAtZero: !lowerIsBetter, // Pour les réflexes, ne pas commencer à 0
        min: lowerIsBetter ? Math.min(...scores) - 50 : undefined, // Marge pour les réflexes
        max: lowerIsBetter ? Math.max(...scores) + 50 : undefined,
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: 'rgba(156, 163, 175, 0.9)',
          font: {
            size: 10
          },
          callback: function(value: any) {
            if (Math.floor(value) === value) {
              return lowerIsBetter ? `${value}ms` : value;
            }
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: 'rgba(156, 163, 175, 0.9)',
          font: {
            size: 10
          },
          maxTicksLimit: 5
        }
      }
    },
    elements: {
      line: {
        tension: 0.3,
        borderWidth: 2,
        borderColor: borderColor
      },
      point: {
        radius: 3,
        hoverRadius: 5,
        borderWidth: 2,
        backgroundColor: 'white',
        borderColor: borderColor
      }
    }
  };
  
  // ✅ Indicateur de tendance corrigé
  const getTrend = () => {
    if (scores.length < 2) return null;
    
    const currentScore = scores[0]; // Plus récent
    const prevScore = scores[1]; // Précédent
    const diff = lowerIsBetter 
      ? prevScore - currentScore  // Pour les réflexes, plus bas est mieux
      : currentScore - prevScore; // Pour les autres, plus haut est mieux
    
    const percentChange = prevScore ? (diff / prevScore) * 100 : 0;
    
    if (Math.abs(percentChange) < 1) return null;
    
    const isPositive = percentChange > 0;
    
    return (
      <span className={`ml-1 text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {isPositive ? '↑' : '↓'} {Math.abs(percentChange).toFixed(1)}%
      </span>
    );
  };
  
  // ✅ Modifier les données du graphique pour contrôler le remplissage
  if (chartData && chartData.datasets && chartData.datasets[0]) {
    chartData.datasets[0] = {
      ...chartData.datasets[0],
      borderColor: borderColor,
      backgroundColor: backgroundColor,
      // ✅ Pour les réflexes, remplir vers le bas (origin)
      fill: lowerIsBetter ? 'origin' : true,
      tension: 0.3
    };
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col h-full transition-transform hover:scale-[1.02] duration-300">
      <div className={`bg-gradient-to-r ${color} p-4 text-white`}>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="w-8 h-8 flex items-center justify-center">{icon}</div>
        </div>
      </div>
      
      <div className="p-5 flex-1 flex flex-col">
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {lowerIsBetter ? 'Meilleur (min)' : 'Meilleur (max)'}
            </p>
            <p className="text-lg font-semibold dark:text-white">
              {lowerIsBetter ? `${bestScore}ms` : bestScore}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Moyenne</p>
            <p className="text-lg font-semibold dark:text-white">
              {lowerIsBetter ? `${avgScore}ms` : avgScore}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Dernier</p>
            <div className="flex items-center justify-center">
              <p className="text-lg font-semibold dark:text-white">
                {lowerIsBetter ? `${lastScore}ms` : lastScore}
              </p>
              {getTrend()}
            </div>
          </div>
        </div>
        
        <div className="flex-1 min-h-[150px] relative">
          {chartData ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">Graphique non disponible</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 