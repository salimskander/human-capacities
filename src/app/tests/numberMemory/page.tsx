'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
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
import { Line } from 'react-chartjs-2';
import StartModal from '@/components/StartModal';
import ProgressBar from "@/components/ProgressBar";
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

// ✅ Ajouter l'interface TestResult
interface TestResult {
  score: number;
  timestamp: string;
}

export default function NumberMemoryTest() {
    const { currentUser } = useAuth();
    const [level, setLevel] = useState(1);
    const [lives, setLives] = useState(2);
    const [numbers, setNumbers] = useState<string>('');
    const [isShowingNumbers, setIsShowingNumbers] = useState(false);
    const [userInput, setUserInput] = useState('');
    const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'lost' | 'gameover'>('waiting');
    const inputRef = useRef<HTMLInputElement>(null);
    const [globalResults, setGlobalResults] = useState<TestResult[]>([]);

    useEffect(() => {
        fetchResults();
    }, [fetchResults]);

    const fetchResults = async () => {
        try {
            // Données globales
            const globalResponse = await fetch('/api/numberMemory?type=global');
            const globalData = await globalResponse.json();
            setGlobalResults(globalData);
        } catch (error) {
            console.error('Error fetching results:', error);
        }
    };

    const prepareChartData = () => {
        const intervals = Array.from({ length: 10 }, (_, i) => i + 1);
        const counts = new Array(intervals.length).fill(0);
        
        globalResults.forEach(result => {
            const index = Math.min(Math.floor(result.score) - 1, intervals.length - 1);
            if (index >= 0) counts[index]++;
        });

        const total = globalResults.length;
        const percentages = counts.map(count => (count / total) * 100 || 0);

        return {
            labels: intervals.map(i => `${i} chiffre${i > 1 ? 's' : ''}`),
            datasets: [{
                label: 'Distribution des scores',
                data: percentages,
                borderColor: 'rgb(239, 68, 68)',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                tension: 0.1,
                fill: true
            }]
        };
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'Distribution globale des scores de mémoire des nombres'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Pourcentage des joueurs (%)'
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Nombre de chiffres mémorisés'
                }
            }
        }
    };

    const generateNumbers = (level: number) => {
        let result = '';
        // Génère autant de chiffres que le niveau actuel
        for (let i = 0; i < level; i++) {
            result += Math.floor(Math.random() * 10);
        }
        return result;
    };

    const startNewLevel = (newLevel?: number) => {
        const currentLevel = newLevel || level;
        const newNumbers = generateNumbers(currentLevel);
        console.log('Generating numbers for level:', currentLevel, 'Numbers:', newNumbers);
        setNumbers(newNumbers);
        setIsShowingNumbers(true);
        setUserInput('');


        const duration = 1000 + (currentLevel * 300 * Math.sqrt(currentLevel));

        setTimeout(() => {
            setIsShowingNumbers(false);
            // Focus sur l'input quand il apparaît  
            setTimeout(() => inputRef.current?.focus(), 0);
        }, duration);
    };

    const startGame = () => {
        setGameStatus('playing');
        setLevel(1);
        setLives(2);
        startNewLevel(1);
    };

    const checkAnswer = async () => {
        if (userInput === numbers) {
            const nextLevel = level + 1;
            setLevel(nextLevel);
            startNewLevel(nextLevel);
        } else {
            setLives(prev => prev - 1);
            if (lives <= 1) {
                setGameStatus('gameover');
            } else {
                startNewLevel(level);
            }
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            checkAnswer();
        }
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

            <div className="h-full min-h-[100vh] bg-white dark:bg-gray-900 flex items-center justify-center">
                {gameStatus !== 'waiting' && (
                    <div className="fixed top-0 left-0 right-0 h-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg z-40">
                        <div className="max-w-screen-xl mx-auto h-full flex items-center justify-center gap-8">
                            <div className="text-2xl font-medium dark:text-white">Niveau {level}</div>
                            <div className="flex gap-1">
                                {Array.from({ length: 2 }).map((_, i) => (
                                    <span key={i} className="text-2xl">
                                    {i < (2 - lives) ? '🖤' : '❤️'}
                                    </span>
                                ))}
                        </div>
                        </div>
                    </div>
                )}

                {isShowingNumbers && (
                    <div className="fixed top-20 left-0 right-0 z-40">
                        <ProgressBar 
                            duration={1000 + (level * 300 * Math.sqrt(level))} 
                            isActive={isShowingNumbers} 
                        />
                    </div>
                )}

                {gameStatus === 'waiting' ? (
                    <StartModal 
                        title="Test de Mémoire des Nombres"
                        description={
                            <p>
                                Mémorisez les chiffres qui apparaissent à l&apos;écran.
                                À chaque niveau réussi, vous devrez mémoriser un chiffre supplémentaire.
                                Voyons jusqu&apos;où vous pouvez aller !
                            </p>
                        }
                        onStart={startGame}
                        stats={globalResults.length > 0 ? (
                            <Line data={prepareChartData()} options={chartOptions} />
                        ) : (
                            <p className="text-center dark:text-gray-200">Aucune donnée disponible pour le moment.</p>
                        )}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full min-h-[100vh] gap-4 pt-16 sm:pt-20">
                        {isShowingNumbers ? (
                            <div className="text-5xl sm:text-7xl md:text-8xl font-bold select-none pointer-events-none dark:text-white">{numbers}</div>
                        ) : (
                            <div className="flex flex-col items-center gap-4">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className="text-3xl sm:text-4xl text-center w-[80vw] max-w-[240px] sm:w-64 p-3 sm:p-4 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white dark:border-gray-600"
                                    autoFocus
                                />
                                <button 
                                    onClick={checkAnswer}
                                    className="px-5 sm:px-6 py-2.5 sm:py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                                >
                                    Valider
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <GameOverModal 
                    isOpen={gameStatus === 'gameover'}
                    score={level - 1}
                    onRestart={startGame}
                    onBackToRules={() => setGameStatus('waiting')}
                    scoreLabel="Niveau atteint"
                    showBackToRulesButton={true}
                />
            </div>
        </>
    );
}
