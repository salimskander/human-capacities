interface GameResult {
  score: number;
}

interface StatsComparisonProps {
  userData: GameResult[];
  globalData: GameResult[];
  title: string;
  scoreLabel: string;
}

export default function StatsComparison({ userData, globalData, title, scoreLabel }: StatsComparisonProps) {
  const userAverage = userData.length > 0 
    ? userData.reduce((sum, stat) => sum + Number(stat.score), 0) / userData.length 
    : 0;
    
  const globalAverage = globalData.length > 0 
    ? globalData.reduce((sum, stat) => sum + Number(stat.score), 0) / globalData.length 
    : 0;

  const userBest = userData.length > 0 
    ? Math.max(...userData.map(stat => Number(stat.score))) 
    : 0;
    
  const globalBest = globalData.length > 0 
    ? Math.max(...globalData.map(stat => Number(stat.score))) 
    : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">{title}</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <h4 className="font-semibold text-blue-600 dark:text-blue-400">Vos statistiques</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">Moyenne: {userAverage.toFixed(1)} {scoreLabel}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">Meilleur: {userBest} {scoreLabel}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">Parties: {userData.length}</p>
        </div>
        
        <div className="text-center">
          <h4 className="font-semibold text-green-600 dark:text-green-400">Statistiques globales</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">Moyenne: {globalAverage.toFixed(1)} {scoreLabel}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">Meilleur: {globalBest} {scoreLabel}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">Parties: {globalData.length}</p>
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