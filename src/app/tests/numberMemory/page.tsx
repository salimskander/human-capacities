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

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

export default function NumberMemoryTest() {
    const [level, setLevel] = useState(1);
    const [lives, setLives] = useState(3);
    const [numbers, setNumbers] = useState<string>('');
    const [isShowingNumbers, setIsShowingNumbers] = useState(false);
    const [userInput, setUserInput] = useState('');
    const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'lost' | 'gameover'>('waiting');
    const inputRef = useRef<HTMLInputElement>(null);
    const [results, setResults] = useState<Array<{ timestamp: number, score: number }>>([]);

    useEffect(() => {
        fetchResults();
    }, []);

    const fetchResults = async () => {
        try {
            const response = await fetch('/api/numberMemory');
            const data = await response.json();
            setResults(data);
        } catch (error) {
            console.error('Erreur lors du chargement des résultats:', error);
        }
    };

    const saveResult = async (score: number) => {
        try {
            await fetch('/api/numberMemory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ score })
            });
            await fetchResults();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du résultat:', error);
        }
    };

    const prepareChartData = () => {
        const intervals = Array.from({ length: 10 }, (_, i) => i + 1);
        const data = new Array(intervals.length).fill(0);
        
        results.forEach(result => {
            const index = Math.min(Math.floor(result.score) - 1, intervals.length - 1);
            if (index >= 0) data[index]++;
        });

        const totalResults = results.length;
        const percentages = data.map(count => (count / totalResults) * 100);

        return {
            labels: intervals.map(i => `Niveau ${i}`),
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

        setTimeout(() => {
            setIsShowingNumbers(false);
            // Focus sur l'input quand il apparaît
            setTimeout(() => inputRef.current?.focus(), 0);
        }, 5000);
    };

    const startGame = () => {
        setGameStatus('playing');
        setLevel(1);
        setLives(3);
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
                await saveResult(level - 1);
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

            <div className="h-full min-h-[100vh] bg-gray-100 flex items-center justify-center">
                {gameStatus !== 'waiting' && (
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
                )}

                {isShowingNumbers && (
                    <div className="fixed top-20 left-0 right-0 h-2 bg-gray-200">
                        <div className="progress-bar"></div>
                    </div>
                )}

                {gameStatus === 'waiting' ? (
                    <div className="h-full min-h-[100vh] flex flex-col items-center justify-center gap-8">
                        <div className="text-center max-w-md bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg mx-4">
                            <h1 className="text-3xl font-bold mb-4">Test de Mémoire des Chiffres</h1>
                            <p className="mb-8">
                                Mémorisez les chiffres qui apparaissent à l&apos;écran.
                                À chaque niveau réussi, vous devrez mémoriser un chiffre supplémentaire.
                                Voyons jusqu&apos;où vous pouvez aller !
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
                                    <Line data={prepareChartData()} options={chartOptions} />
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full min-h-[100vh] gap-4 pt-20">
                        {isShowingNumbers ? (
                            <div className="text-8xl font-bold select-none pointer-events-none">{numbers}</div>
                        ) : (
                            <div className="flex flex-col items-center gap-4">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className="text-4xl text-center w-64 p-4 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:outline-none"
                                    autoFocus
                                />
                                <button 
                                    onClick={checkAnswer}
                                    className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                                >
                                    Valider
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {gameStatus === 'gameover' && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white p-8 rounded-2xl text-center">
                            <h2 className="text-2xl font-bold mb-4">Partie terminée !</h2>
                            <p className="text-xl mb-6">Niveau atteint : {level - 1}</p>
                            <button 
                                onClick={startGame}
                                className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                            >
                                Rejouer
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
