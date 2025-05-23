import { Line } from 'react-chartjs-2';
import Link from 'next/link';
import { ReactNode } from 'react';

interface GameStatsCardProps {
  title: string;
  data: any[];
  scoreLabel: string;
  icon: ReactNode;
  link: string;
  color: string;
  prepareChartData: (data: any[]) => any;
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
  
  // Calcul des statistiques
  const scores = data
    .map(item => {
      console.log('Item dans GameStatsCard:', item); // Debug
      if (item.reactionTime !== undefined) return item.reactionTime;
      return item.score;
    })
    .filter(score => score !== null && score !== undefined && !isNaN(score));

  if (scores.length === 0) {
    // ... existing code pour le cas "pas de données" ...
  }

  const bestScore = lowerIsBetter 
    ? Math.min(...scores) 
    : Math.max(...scores);
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const lastScore = scores[0]; // ✅ Prendre le premier (plus récent) au lieu du dernier
  const chartData = prepareChartData(data);
  
  // Obtenir des couleurs adaptées au thème du jeu
  let borderColor, backgroundColor;
  
  // Définir des couleurs par défaut basées sur le gradient
  if (color.includes('blue')) {
    borderColor = 'rgb(59, 130, 246)';
    backgroundColor = 'rgba(59, 130, 246, 0.2)';
  } else if (color.includes('green') || color.includes('emerald')) {
    borderColor = 'rgb(16, 185, 129)';
    backgroundColor = 'rgba(16, 185, 129, 0.2)';
  } else if (color.includes('red') || color.includes('rose')) {
    borderColor = 'rgb(239, 68, 68)';
    backgroundColor = 'rgba(239, 68, 68, 0.2)';
  } else if (color.includes('yellow') || color.includes('amber')) {
    borderColor = 'rgb(245, 158, 11)';
    backgroundColor = 'rgba(245, 158, 11, 0.2)';
  } else if (color.includes('purple') || color.includes('pink')) {
    borderColor = 'rgb(168, 85, 247)';
    backgroundColor = 'rgba(168, 85, 247, 0.2)';
  } else if (color.includes('cyan')) {
    borderColor = 'rgb(6, 182, 212)';
    backgroundColor = 'rgba(6, 182, 212, 0.2)';
  } else if (color.includes('indigo')) {
    borderColor = 'rgb(79, 70, 229)';
    backgroundColor = 'rgba(79, 70, 229, 0.2)';
  } else if (color.includes('teal')) {
    borderColor = 'rgb(20, 184, 166)';
    backgroundColor = 'rgba(20, 184, 166, 0.2)';
  } else {
    // Couleur par défaut
    borderColor = 'rgb(107, 114, 128)';
    backgroundColor = 'rgba(107, 114, 128, 0.2)';
  }
  
  // Appliquer les couleurs au dataset
  if (chartData && chartData.datasets && chartData.datasets.length > 0) {
    chartData.datasets[0].borderColor = borderColor;
    chartData.datasets[0].backgroundColor = backgroundColor;
  }
  
  // Options du graphique simplifiées et plus intuitives
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
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
            return `Partie ${items[0].dataIndex + 1}`;
          },
          label: (item: any) => {
            return `${scoreLabel}: ${item.raw}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
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
            // Afficher seulement des valeurs entières
            if (Math.floor(value) === value) {
              return value;
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
          // Afficher moins de libellés sur l'axe X pour éviter l'encombrement
          maxTicksLimit: 5
        }
      }
    },
    elements: {
      line: {
        tension: 0.3, // Ligne plus lisse
        borderWidth: 2
      },
      point: {
        radius: 3,
        hoverRadius: 5,
        borderWidth: 2,
        backgroundColor: 'white'
      }
    }
  };
  
  // Indicateur de tendance
  const getTrend = () => {
    if (data.length < 2) return null;
    
    const prevScore = scores[scores.length - 2];
    const currentScore = lastScore;
    const diff = lowerIsBetter 
      ? prevScore - currentScore  // Pour les réflexes, plus bas est mieux
      : currentScore - prevScore; // Pour les autres, plus haut est mieux
    
    const percentChange = prevScore ? (diff / prevScore) * 100 : 0;
    
    if (Math.abs(percentChange) < 1) return null; // Changement négligeable
    
    const isPositive = percentChange > 0;
    
    return (
      <span className={`ml-1 text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {isPositive ? '↑' : '↓'} {Math.abs(percentChange).toFixed(1)}%
      </span>
    );
  };
  
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
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Meilleur</p>
            <p className="text-lg font-semibold dark:text-white">{bestScore}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Moyenne</p>
            <p className="text-lg font-semibold dark:text-white">{avgScore}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Dernier</p>
            <div className="flex items-center justify-center">
              <p className="text-lg font-semibold dark:text-white">{lastScore}</p>
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
        
        <div className="flex items-center mt-4">
          <Link 
            href={link}
            className="flex-1 text-center py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Jouer à nouveau
          </Link>
          <span className="ml-2 px-3 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
            {data.length} parties
          </span>
        </div>
      </div>
    </div>
  );
} 