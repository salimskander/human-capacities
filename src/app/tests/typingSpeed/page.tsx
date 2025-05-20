'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
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
import StartModal from '@/components/StartModal'
import ProgressBar from "@/components/ProgressBar"
import GameOverModal from "@/components/GameOverModal"
import AdBanner from '@/components/AdBanner'

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
  "croire", "penser", "réfléchir", "méditer", "observer", "examiner", "analyser",
  "maison", "table", "chaise", "lit", "cuisine", "salon", "chambre", "jardin", 
  "voiture", "vélo", "bus", "train", "avion", "route", "chemin", "rue", 
  "ville", "pays", "montagne", "mer", "plage", "forêt", "rivière", "lac",
  "eau", "feu", "terre", "air", "soleil", "lune", "étoile", "ciel",
  "jour", "nuit", "matin", "soir", "midi", "minuit", "heure", "minute",
  "temps", "année", "mois", "semaine", "weekend", "lundi", "mardi", "mercredi",
  "famille", "parent", "enfant", "ami", "voisin", "collègue", "patron", "client",
  "chat", "chien", "oiseau", "poisson", "animal", "plante", "fleur", "arbre",
  "pain", "fromage", "vin", "café", "thé", "lait", "sucre", "sel",
  "fruit", "légume", "viande", "poisson", "dessert", "repas", "dîner", "déjeuner",
  "téléphone", "ordinateur", "internet", "email", "message", "photo", "vidéo", "musique",
  "livre", "journal", "magazine", "film", "série", "émission", "chaîne", "radio",
  "école", "université", "bureau", "entreprise", "magasin", "restaurant", "hôpital", "banque",
  "argent", "prix", "coût", "budget", "compte", "carte", "monnaie", "euro",
  "santé", "maladie", "médecin", "médicament", "sport", "exercice", "jeu", "loisir"
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
  const [hasStartedTyping, setHasStartedTyping] = useState(false);
  const [showStartModal, setShowStartModal] = useState(true);

  const fetchResults = async () => {
    try {
      const response = await fetch('/api/typingSpeed')
      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error('Failed to fetch results:', error)
    }
  }

  const saveResult = useCallback(async (wpm: number, accuracy: number) => {
    try {
      await fetch('/api/typingSpeed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wpm, accuracy })
      });
      fetchResults();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  }, [fetchResults]);

  // Modifier l'effet pour le timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isStarted && timeLeft > 0 && hasStartedTyping) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isStarted, timeLeft, hasStartedTyping])

  // Nouvel effet pour gérer la fin du jeu
  useEffect(() => {
    if (timeLeft === 0) {
      setIsFinished(true)
      setIsStarted(false)
      saveResult(wordCount, 0)
    }
  }, [timeLeft, wordCount, saveResult])

  useEffect(() => {
    if (isStarted && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isStarted]);

  useEffect(() => {
    fetchResults()
  }, [])

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
    setShowStartModal(false)
    setWordCount(0)
    setTimeLeft(60)
    setIsFinished(false)
    setCurrentInput('')
    setCurrentWordIndex(0)
    setCurrentLine(0)
    setHasStartedTyping(false)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const handleRestart = () => {
    handleStart()
  }

  const getVisibleLines = () => {
    const allLines = [];
    for (let i = 0; i < words.length; i += WORDS_PER_LINE) {
      const line = words.slice(i, i + WORDS_PER_LINE);
      // Compléter la ligne si elle n'est pas complète
      while (line.length < WORDS_PER_LINE) {
        line.push({
          text: "",
          status: "waiting"
        });
      }
      allLines.push(line);
    }
    const startLine = currentLine;
    return allLines.slice(startLine, startLine + 2);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCurrentInput(value)
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
    }
  }

  const handleKeyDown = () => {
    if (!hasStartedTyping) {
      setHasStartedTyping(true)
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
        href="/#tests-section"
        className="fixed top-4 left-4 w-12 h-12 bg-white dark:bg-gray-800 dark:text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-[60]"
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
        {!isStarted && !isFinished && showStartModal ? (
          <StartModal 
            title="Test de Vitesse de Frappe"
            description={
              <p>
                Tapez les mots qui apparaissent à l&apos;écran aussi vite et précisément que possible.
                Vous avez 60 secondes pour taper le maximum de mots.
                Votre score final sera le nombre de mots correctement tapés par minute.
              </p>
            }
            onStart={handleStart}
            stats={results.length > 0 ? (
              <Line data={prepareChartData()} options={chartOptions} />
            ) : (
              <p className="text-center dark:text-gray-200">Aucune donnée disponible pour le moment.</p>
            )}
          />
        ) : (
          <div className="w-full pt-20">
            {isStarted && (
              <>
                <div className="fixed top-0 left-0 right-0 h-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg z-50">
                  <div className="max-w-screen-xl mx-auto h-full flex items-center justify-center gap-8 px-16">
                    <div className="text-2xl dark:text-white">Temps: {timeLeft}s</div>
                    <div className="text-2xl dark:text-white">Score: {wordCount}</div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0">
                    <ProgressBar 
                      duration={60000} 
                      isActive={isStarted && !isFinished && hasStartedTyping} 
                      onComplete={() => {}}
                    />
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center gap-8 px-4 pb-40 md:pb-20">
                  <div className="w-full max-w-3xl">
                    <div 
                      ref={containerRef}
                      className="text-lg md:text-xl mb-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 md:p-8 rounded-2xl shadow-lg"
                    >
                      <div className="flex flex-col gap-2">
                        {getVisibleLines().map((line, lineIndex) => (
                          <div key={lineIndex} className="flex flex-wrap gap-1 md:gap-2 w-full">
                            {line.map((word, wordIndex) => (
                              <span
                                key={wordIndex}
                                className={`
                                  inline-block px-1 py-0.5 md:px-2 md:py-1 rounded text-sm md:text-lg 
                                  min-w-0 max-w-fit whitespace-normal
                                  ${word.status === 'current' ? 'bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : ''}
                                  ${word.status === 'correct' ? 'bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200' : ''}
                                  ${word.status === 'incorrect' ? 'bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200' : ''}
                                  ${word.status === 'waiting' ? 'text-gray-700 dark:text-gray-300' : ''}
                                  ${word.text === '' ? 'invisible' : 'visible'}
                                `}
                              >
                                {word.text || 'placeholder'}
                              </span>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <input
                        ref={inputRef}
                        type="text"
                        value={currentInput}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        className="flex-1 p-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm dark:text-white"
                        placeholder="Tapez les mots ici..."
                        disabled={!isStarted}
                      />
                      <button
                        onClick={handleRestart}
                        className="bg-white dark:bg-gray-800 dark:text-white rounded-xl p-4 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
                        title="Redémarrer"
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="h-6 w-6" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
 
            {/* Annonce après le jeu, avant le modal de fin */}
            {isFinished && (
              <div className="w-full flex justify-center my-4">
                <AdBanner 
                  slot="2345678901" // Remplacez par votre ID de slot
                  format="rectangle"
                  className="mx-auto"
                />
              </div>
            )}
            
            <GameOverModal
              isOpen={isFinished}
              score={wordCount}
              scoreLabel="Vitesse finale (MPM)"
              onRestart={handleRestart}
              onBackToRules={() => {
                setIsFinished(false)
                setCurrentWordIndex(0)
                setWords([])
                setTimeLeft(60)
                setShowStartModal(true)
              }}
              showRestartButton={true}
              showBackToRulesButton={true}
            />
          </div>
        )}
      </div>
    </>
  )
}
