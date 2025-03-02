'use client'
import { useState, useEffect, useRef } from 'react'
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
import Link from 'next/link'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

type WordStatus = {
  text: string;
  status: 'waiting' | 'current' | 'correct' | 'incorrect';
};

const WORD_LIST = [
  "le", "la", "être", "avoir", "faire", "dire", "pouvoir", "aller", "voir", "vouloir",
  "venir", "devoir", "prendre", "trouver", "donner", "falloir", "parler", "mettre",
  "savoir", "passer", "regarder", "aimer", "croire", "demander", "rester", "répondre",
  "vivre", "partir", "suivre", "comprendre", "entendre", "attendre", "sortir", "connaître",
  "penser", "montrer", "sembler", "tenir", "porter", "chercher", "écrire", "marcher",
  "rappeler", "servir", "paraître", "décider", "arriver", "devenir", "laisser", "jouer",
  "reprendre", "permettre", "continuer", "compter", "entrer", "appeler", "garder", "ouvrir",
  "perdre", "commencer", "finir", "rendre", "tomber", "oublier", "recevoir", "revenir",
  "manger", "boire", "dormir", "courir", "lire", "chanter", "danser", "dessiner",
  "étudier", "apprendre", "enseigner", "travailler", "choisir", "accepter", "refuser",
  "acheter", "vendre", "payer", "construire", "détruire", "casser", "réparer", "nettoyer",
  "ranger", "organiser", "planifier", "voyager", "visiter", "explorer", "découvrir",
  "créer", "imaginer", "rêver", "espérer", "sourire", "pleurer", "rire", "grandir",
  "changer", "améliorer", "développer", "protéger", "défendre", "combattre", "gagner",
  "perdre", "essayer", "réussir", "échouer", "recommencer", "terminer", "abandonner",
  "célébrer", "féliciter", "remercier", "excuser", "pardonner", "aider", "soutenir",
  "conseiller", "guider", "diriger", "commander", "obéir", "respecter", "admirer",
  "détester", "préférer", "adorer", "apprécier", "supporter", "tolérer", "accepter",
  "refuser", "négocier", "discuter", "débattre", "argumenter", "convaincre", "douter",
  "croire", "penser", "réfléchir", "méditer", "observer", "examiner", "analyser"
]

const WORDS_PER_LINE = 8; // Nombre de mots par ligne

type Result = {
  timestamp: number;
  score: number;
}

export default function TypingSpeed() {
  const [isStarted, setIsStarted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)
  const [currentInput, setCurrentInput] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [isFinished, setIsFinished] = useState(false)
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [words, setWords] = useState<WordStatus[]>([])
  const [currentLine, setCurrentLine] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null);
  const [results, setResults] = useState<Result[]>([])

  // Séparer les effets pour le timer et la fin du jeu
  useEffect(() => {
    if (isStarted && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [isStarted, timeLeft])

  // Nouvel effet pour gérer la fin du jeu
  useEffect(() => {
    if (timeLeft === 0) {
      setIsFinished(true)
      setIsStarted(false)
      saveResult(wordCount)
    }
  }, [timeLeft])

  useEffect(() => {
    if (isStarted && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isStarted]);

  useEffect(() => {
    fetchResults()
  }, [])

  const fetchResults = async () => {
    try {
      const response = await fetch('/api/typingSpeed')
      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error('Failed to fetch results:', error)
    }
  }

  const saveResult = async (score: number) => {
    try {
      await fetch('/api/typingSpeed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: Date.now(),
          score: score
        })
      })
      await fetchResults()
    } catch (error) {
      console.error('Failed to save result:', error)
    }
  }

  const shuffleWords = (): WordStatus[] => {
    return WORD_LIST.sort(() => Math.random() - 0.5).map(word => ({
      text: word,
      status: 'waiting' as const
    }))
  }

  const handleStart = () => {
    const shuffled = shuffleWords()
    shuffled[0].status = 'current'
    setWords(shuffled)
    setIsStarted(true)
    setWordCount(0)
    setTimeLeft(60)
    setIsFinished(false)
    setCurrentInput('')
    setCurrentWordIndex(0)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const getVisibleLines = () => {
    const allLines = [];
    for (let i = 0; i < words.length; i += WORDS_PER_LINE) {
      allLines.push(words.slice(i, i + WORDS_PER_LINE));
    }
    const startLine = currentLine;
    return allLines.slice(startLine, startLine + 5);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value.endsWith(' ')) {
      const typedWord = value.trim()
      const newWords = [...words]
      const isCorrect = typedWord === words[currentWordIndex].text

      // Mettre à jour le statut du mot actuel
      newWords[currentWordIndex].status = isCorrect ? 'correct' : 'incorrect'

      // Mettre à jour le prochain mot
      if (currentWordIndex + 1 < newWords.length) {
        newWords[currentWordIndex + 1].status = 'current'
      }

      // Calculer si on doit passer à la ligne suivante
      if ((currentWordIndex + 1) % WORDS_PER_LINE === 0) {
        setCurrentLine(Math.floor((currentWordIndex + 1) / WORDS_PER_LINE));
      }

      setWords(newWords)
      if (isCorrect) {
        setWordCount((prev) => prev + 1)
      }
      setCurrentWordIndex((prev) => prev + 1)
      setCurrentInput('')
    } else {
      setCurrentInput(value)
    }
  }

  const prepareChartData = () => {
    // Créer des intervalles de 10 en 10 jusqu'à 140
    const intervals = Array.from({ length: 15 }, (_, i) => i * 10)
    const counts = new Array(intervals.length).fill(0)

    // Compter le nombre de résultats pour chaque intervalle
    results.forEach(result => {
      const intervalIndex = Math.floor(result.score / 10)
      if (intervalIndex >= 0 && intervalIndex < intervals.length) {
        counts[intervalIndex]++
      }
    })

    // Calculer les pourcentages
    const total = results.length
    const percentages = counts.map(count => (count / total) * 100 || 0)

    return {
      labels: intervals.map(value => `${value} mpm`),
      datasets: [{
        label: 'Distribution des scores',
        data: percentages,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
        fill: true
      }]
    }
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Distribution des scores de vitesse de frappe'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Pourcentage des joueurs'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Mots par minute'
        }
      }
    }
  }

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
        {!isStarted && !isFinished ? (
          <div className="h-full min-h-[100vh] flex flex-col items-center justify-center gap-8">
            <div className="text-center max-w-md bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg mx-4">
              <h1 className="text-3xl font-bold mb-4">Test de Vitesse de Frappe</h1>
              <p className="mb-8">
                Tapez les mots qui apparaissent à l&apos;écran aussi vite et précisément que possible.
                Vous avez 60 secondes pour taper le maximum de mots.
                Votre score final sera le nombre de mots correctement tapés par minute.
              </p>
              <button 
                className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                onClick={handleStart}
              >
                Commencer
              </button>
            </div>

            {results.length > 0 && (
              <div className="w-[600px] bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg mx-4">
                <Line data={prepareChartData()} options={chartOptions} />
              </div>
            )}
          </div>
        ) : (
          <div className="w-full">
            {isStarted && (
              <>
                <div className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-sm shadow-lg z-40">
                  <div className="max-w-screen-xl mx-auto h-full flex items-center justify-center gap-8">
                    <div className="text-2xl">Temps: {timeLeft}s</div>
                    <div className="text-2xl">Score: {wordCount}</div>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center gap-8 pt-24 px-4">
                  {/* Le reste du contenu du jeu */}
                  <div className="w-full max-w-3xl">
                    <div 
                      ref={containerRef}
                      className="text-lg mb-4 bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg"
                    >
                      <div className="flex flex-col gap-2">
                        {getVisibleLines().map((line, lineIndex) => (
                          <div key={lineIndex} className="flex flex-wrap gap-2">
                            {line.map((word, wordIndex) => (
                              <span
                                key={wordIndex}
                                className={`inline-block px-2 py-1 rounded ${
                                  word.status === 'current' ? 'bg-blue-200 text-blue-800' :
                                  word.status === 'correct' ? 'bg-green-200 text-green-800' :
                                  word.status === 'incorrect' ? 'bg-red-200 text-red-800' :
                                  'text-gray-700'
                                }`}
                              >
                                {word.text}
                              </span>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                    <input
                      ref={inputRef}
                      type="text"
                      value={currentInput}
                      onChange={handleInput}
                      className="w-full p-4 border-2 border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm"
                      placeholder="Tapez les mots ici..."
                      disabled={!isStarted}
                    />
                  </div>
                </div>
              </>
            )}

            {isFinished && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white p-8 rounded-2xl text-center">
                  <h2 className="text-2xl font-bold mb-4">Test terminé !</h2>
                  <p className="text-xl mb-6">Vitesse finale : {wordCount} mots par minute</p>
                  <button 
                    onClick={() => {
                      setIsFinished(false);
                      setCurrentWordIndex(0);
                      setWords([]);
                    }}
                    className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                  >
                    Retour à l&apos;accueil
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
