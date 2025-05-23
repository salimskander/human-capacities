interface StatsComparisonProps {
  userStats: any[];
  globalStats: any[];
  title: string;
  scoreLabel: string;
}

export default function StatsComparison({ userStats, globalStats, title, scoreLabel }: StatsComparisonProps) {
  const userAverage = userStats.length > 0 
    ? userStats.reduce((sum, stat) => sum + stat.score, 0) / userStats.length 
    : 0;
    
  const globalAverage = globalStats.length > 0 
    ? globalStats.reduce((sum, stat) => sum + stat.score, 0) / globalStats.length 
    : 0;

  const userBest = userStats.length > 0 
    ? Math.max(...userStats.map(stat => stat.score)) 
    : 0;
    
  const globalBest = globalStats.length > 0 
    ? Math.max(...globalStats.map(stat => stat.score)) 
    : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">{title}</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <h4 className="font-semibold text-blue-600 dark:text-blue-400">Vos statistiques</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">Moyenne: {userAverage.toFixed(1)} {scoreLabel}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">Meilleur: {userBest} {scoreLabel}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">Parties: {userStats.length}</p>
        </div>
        
        <div className="text-center">
          <h4 className="font-semibold text-green-600 dark:text-green-400">Statistiques globales</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">Moyenne: {globalAverage.toFixed(1)} {scoreLabel}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">Meilleur: {globalBest} {scoreLabel}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">Parties: {globalStats.length}</p>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        {userAverage > globalAverage ? (
          <span className="text-green-600 dark:text-green-400 font-semibold">
            🎉 Vous êtes au-dessus de la moyenne !
          </span>
        ) : (
          <span className="text-orange-600 dark:text-orange-400">
            💪 Continuez à vous entraîner !
          </span>
        )}
      </div>
    </div>
  );
} 