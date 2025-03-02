'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

export default function VisualMemoryTest() {
  const [lives, setLives] = useState(3)
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [sequence, setSequence] = useState<number[]>([])
  const [userSequence, setUserSequence] = useState<number[]>([])
  const [isShowingSequence, setIsShowingSequence] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [correctTiles, setCorrectTiles] = useState<number[]>([])
  const [errorTiles, setErrorTiles] = useState<number[]>([])
  const [isStarted, setIsStarted] = useState(false)
  const [results, setResults] = useState<Array<{ timestamp: number; score: number }>>([])
  const [isProcessingError, setIsProcessingError] = useState(false)

  const gridSize = Math.min(3 + Math.floor(level / 2), 7)
  const tilesToRemember = Math.min(3 + level, gridSize * gridSize - 1)
  const SEQUENCE_SHOW_TIME = 2200 // 2,2 secondes

  const generateSequence = () => {
    const newSequence: number[] = []
    while (newSequence.length < tilesToRemember) {
      const num = Math.floor(Math.random() * (gridSize * gridSize))
      if (!newSequence.includes(num)) newSequence.push(num)
    }
    return newSequence
  }

  const startLevel = () => {
    setCorrectTiles([])
    setErrorTiles([])
    setUserSequence([])
    
    const newSequence = generateSequence()
    setSequence(newSequence)
    setIsShowingSequence(true)
    
    // La séquence se termine après SEQUENCE_SHOW_TIME
    setTimeout(() => {
      setIsShowingSequence(false)
      setIsProcessingError(false) // Réactive les clics uniquement après la séquence
    }, SEQUENCE_SHOW_TIME)
  }

  const startGame = () => {
    setIsStarted(true)
    startLevel()
  }

  const handleTileClick = (index: number) => {
    if (isShowingSequence || gameOver || isProcessingError) return

    if (!sequence.includes(index)) {
      // Mauvaise tuile : perd une vie immédiatement
      setIsProcessingError(true)
      const newLives = lives - 1
      setLives(newLives)
      setErrorTiles(prev => [...prev, index])
      
      if (newLives <= 0) {
        setGameOver(true)
        saveResult(score)
      } else {
        // Attend 500ms avec la tuile rouge visible
        setTimeout(() => {
          // Démarre directement la nouvelle séquence
          startLevel()
        }, 500)
      }
    } else if (!userSequence.includes(index)) {
      // Bonne tuile
      const newUserSequence = [...userSequence, index]
      setUserSequence(newUserSequence)
      setCorrectTiles(prev => [...prev, index])
      
      if (newUserSequence.length === sequence.length) {
        // Niveau réussi
        setScore(prev => prev + level)
        setLevel(prev => prev + 1)
        startLevel()
      }
    }
  }

  const fetchResults = async () => {
    try {
      const response = await fetch('/api/visualMemory')
      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error('Failed to fetch results:', error)
    }
  }

  const saveResult = async (finalScore: number) => {
    try {
      await fetch('/api/visualMemory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: finalScore })
      })
      await fetchResults()
    } catch (error) {
      console.error('Failed to save result:', error)
    }
  }

  const prepareChartData = () => {
    const intervals = Array.from({ length: 11 }, (_, i) => i * 10)
    const data = new Array(intervals.length - 1).fill(0)
    
    results.forEach(result => {
      const index = Math.min(Math.floor(result.score / 10), intervals.length - 2)
      data[index]++
    })

    const total = data.reduce((a, b) => a + b, 0)
    const percentages = data.map(count => (count / total) * 100)

    return {
      labels: intervals.slice(0, -1).map(i => `${i}-${i + 9}`),
      datasets: [{
        label: 'Distribution des scores (%)',
        data: percentages,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }]
    }
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: '% des parties'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Intervalles de score'
        }
      }
    }
  }

  useEffect(() => {
    fetchResults()
  }, [])

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
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M10 19l-7-7m0 0l7-7m-7 7h18" 
          />
        </svg>
      </Link>

      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-screen-xl mx-auto mt-20">
          {!isStarted ? (
            <div className="flex flex-col items-center justify-center space-y-8 max-w-2xl mx-auto">
              <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg w-full">
                <h1 className="text-3xl font-bold mb-4 text-center">Test de Mémoire Visuelle</h1>
                <p className="mb-8 text-center">
                  Testez votre mémoire visuelle.
                  Des tuiles vont s&apos;illuminer brièvement à l&apos;écran.
                  Reproduisez la séquence pour passer au niveau suivant.
                  Vous avez droit à trois erreurs par niveau.
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
                  <Line data={prepareChartData()} options={chartOptions} />
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
                  <div className="text-2xl">Score: {score}</div>
                </div>
                {isShowingSequence && (
                  <div className="absolute bottom-0 left-0 right-0 h-1">
                    <div className="progress-bar" style={{ animationDuration: `${SEQUENCE_SHOW_TIME}ms` }} />
                  </div>
                )}
              </div>

              <div className="grid gap-2 w-[min(90vw,500px)] aspect-square mx-auto mt-32" 
                style={{ 
                  gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                  pointerEvents: isShowingSequence || isProcessingError ? 'none' : 'auto'
                }}
              >
                {Array.from({ length: gridSize * gridSize }).map((_, index) => (
                  <div
                    key={index}
                    onClick={() => handleTileClick(index)}
                    className={`
                      aspect-square rounded-xl transition-colors cursor-pointer backdrop-blur-sm shadow-lg
                      ${isShowingSequence && sequence.includes(index) 
                        ? 'bg-blue-500' 
                        : correctTiles.includes(index)
                          ? 'bg-green-500'
                          : errorTiles.includes(index)
                            ? 'bg-red-500'
                            : 'bg-white/80 hover:bg-gray-100'
                      }
                    `}
                  />
                ))}
              </div>

              {gameOver && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                  <div className="bg-white p-8 rounded-2xl text-center">
                    <h2 className="text-2xl font-bold mb-4">Partie terminée !</h2>
                    <p className="text-xl mb-6">Niveau atteint : {level}</p>
                    <button 
                      onClick={() => {
                        setIsStarted(false);
                        setGameOver(false);
                        setLevel(1);
                        setLives(3);
                        setScore(0);
                        setSequence([]);
                        setUserSequence([]);
                        setCorrectTiles([]);
                        setErrorTiles([]);
                      }}
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
      </div>
    </>
  )
}
