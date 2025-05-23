"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import UserProfileHeader from '@/components/UserProfileHeader';
import GameStatsCard from '@/components/GameStatsCard';
import Image from 'next/image';
import { logoutUser } from '@/firebase';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Enregistrement des composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Définir les types appropriés
interface UserData {
  displayName: string | null;
  email: string | null;
  uid: string;
}

interface GameData {
  timestamp: string;
  score: number;
  [key: string]: unknown;
}

export default function ProfilePage() {
  const { currentUser, userLoading } = useAuth();
  const router = useRouter();
  const [gamesData, setGamesData] = useState({
    chimpTest: [],
    typingSpeed: [],
    visualMemory: [],
    numberMemory: [],
    verbalMemory: [],
    sequenceMemory: [],
    symbolMemory: [],
    reflex: []
  });
  const [isLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('performances');
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  
  // Rediriger si non connecté
  useEffect(() => {
    if (!userLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, userLoading, router]);
  
  // Charger les données de tous les jeux
  const fetchAllGameData = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const response = await fetch('/api/user/all-game-data');
      if (response.ok) {
        const data = await response.json();
        setGamesData(data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchAllGameData();
  }, [fetchAllGameData]);
  
  useEffect(() => {
    if (currentUser) {
      setUserData({
        displayName: currentUser.displayName,
        email: currentUser.email,
        uid: currentUser.uid
      });
    }
  }, [currentUser]);
  
  // Fonctions de préparation des données pour les graphiques
  const prepareProgressionData = (data: unknown, valueKey: string = 'score', limit: number = 10) => {
    if (!data || !Array.isArray(data) || data.length === 0) return null;
    
    // ✅ Trier par timestamp et prendre les plus récents
    const sortedData = [...(data as GameData[])]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) // Plus ancien au plus récent
      .slice(-limit); // Prendre les derniers (plus récents)
    
    const recentScores = sortedData.map((item) => item[valueKey] as number);
    const labels = Array.from({ length: recentScores.length }, (_, i) => `Partie ${i+1}`);
    
    return {
      labels,
      datasets: [{
        label: 'Progression',
        data: recentScores,
        borderWidth: 2,
        tension: 0.4,
        fill: true
      }]
    };
  };

  const resetUserPerformances = async () => {
    if (!currentUser) return;
    
    setIsResetting(true);
    try {
      const endpoints = [
        'chimpTest', 'typingSpeed', 'visualMemory', 'numberMemory', 
        'verbalMemory', 'sequenceMemory', 'symbolMemory', 'reflex'
      ];
      
      // Appeler l'endpoint DELETE pour chaque type de test
      await Promise.all(
        endpoints.map(endpoint => 
          fetch(`/api/${endpoint}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: currentUser.uid })
          })
        )
      );
      
      // Recharger les données après la réinitialisation
      await fetchAllGameData();
      setShowResetConfirm(false);
    } catch (error) {
      console.error('Erreur lors de la réinitialisation des performances:', error);
    } finally {
      setIsResetting(false);
    }
  };

  if (!currentUser) {
    return null; // La redirection se chargera de ça
  }
  
  // Fonction pour afficher le contenu en fonction de l'onglet actif
  const renderContent = () => {
    switch (activeTab) {
      case 'performances':
        return (
          <>
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
              Vos Performances
            </h2>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <GameStatsCard 
                  title="Test du Chimpanzé" 
                  data={gamesData.chimpTest}
                  getScore={(item) => (item as GameData).score}
                  getDate={(item) => (item as GameData).timestamp}
                  scoreLabel="Niveau atteint"
                  icon={<Image src="/chimp.svg" alt="Chimp Test" width={32} height={32} />}
                  link="/tests/chimpTest"
                  color="from-yellow-400 to-orange-500"
                  prepareChartData={(data) => prepareProgressionData(data, 'score', 10)}
                />
                
                <GameStatsCard 
                  title="Vitesse de Frappe" 
                  data={gamesData.typingSpeed}
                  getScore={(item) => (item as { wpm: number }).wpm}
                  getDate={(item) => (item as GameData).timestamp}
                  scoreLabel="Mots par minute"
                  icon={<Image src="/keyboard.svg" alt="Typing Speed" width={32} height={32} />}
                  link="/tests/typingSpeed"
                  color="from-blue-400 to-indigo-500"
                  prepareChartData={(data) => prepareProgressionData(data, 'wpm', 10)}
                />
                
                <GameStatsCard 
                  title="Mémoire Visuelle" 
                  data={gamesData.visualMemory}
                  getScore={(item) => (item as GameData).score}
                  getDate={(item) => (item as GameData).timestamp}
                  scoreLabel="Niveau atteint"
                  icon={<Image src="/visual.svg" alt="Visual Memory" width={32} height={32} />}
                  link="/tests/visualMemory"
                  color="from-purple-400 to-pink-500"
                  prepareChartData={(data) => prepareProgressionData(data, 'score', 10)}
                />
                
                <GameStatsCard 
                  title="Mémoire des Chiffres" 
                  data={gamesData.numberMemory}
                  getScore={(item) => (item as GameData).score}
                  getDate={(item) => (item as GameData).timestamp}
                  scoreLabel="Chiffres mémorisés"
                  icon={<Image src="/number.svg" alt="Number Memory" width={32} height={32} />}
                  link="/tests/numberMemory"
                  color="from-green-400 to-teal-500"
                  prepareChartData={(data) => prepareProgressionData(data, 'score', 10)}
                />
                
                <GameStatsCard 
                  title="Mémoire Verbale" 
                  data={gamesData.verbalMemory}
                  getScore={(item) => (item as GameData).score}
                  getDate={(item) => (item as GameData).timestamp}
                  scoreLabel="Mots mémorisés"
                  icon={<Image src="/word.svg" alt="Verbal Memory" width={32} height={32} />}
                  link="/tests/verbalMemory"
                  color="from-red-400 to-rose-500"
                  prepareChartData={(data) => prepareProgressionData(data, 'score', 10)}
                />
                
                <GameStatsCard 
                  title="Mémoire de Séquence" 
                  data={gamesData.sequenceMemory}
                  getScore={(item) => (item as GameData).score}
                  getDate={(item) => (item as GameData).timestamp}
                  scoreLabel="Séquence atteinte"
                  icon={<Image src="/sequence.svg" alt="Sequence Memory" width={32} height={32} />}
                  link="/tests/sequenceMemory"
                  color="from-cyan-400 to-blue-500"
                  prepareChartData={(data) => prepareProgressionData(data, 'score', 10)}
                />
                
                <GameStatsCard 
                  title="Mémoire des Symboles" 
                  data={gamesData.symbolMemory}
                  getScore={(item) => (item as GameData).score}
                  getDate={(item) => (item as GameData).timestamp}
                  scoreLabel="Niveau atteint"
                  icon={<Image src="/cards.svg" alt="Symbol Memory" width={32} height={32} />}
                  link="/tests/symbolMemory"
                  color="from-amber-400 to-orange-500"
                  prepareChartData={(data) => prepareProgressionData(data, 'score', 10)}
                />
                
                <GameStatsCard 
                  title="Réflexes" 
                  data={gamesData.reflex}
                  getScore={(item) => (item as { reactionTime: number }).reactionTime}
                  getDate={(item) => (item as GameData).timestamp}
                  scoreLabel="Temps (ms)"
                  icon={<Image src="/zap.svg" alt="Reflex Test" width={32} height={32} />}
                  link="/tests/reflex"
                  color="from-emerald-400 to-green-500"
                  prepareChartData={(data) => prepareProgressionData(data, 'reactionTime', 10)}
                  lowerIsBetter={true}
                />
              </div>
            )}
          </>
        );
      case 'reglages':
        return (
          <>
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
              Réglages
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 dark:text-white">Informations personnelles</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom d'utilisateur
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    defaultValue={currentUser.displayName || ""}
                    placeholder="Entrez votre nom d'utilisateur"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    defaultValue={currentUser.email || ""}
                    disabled
                  />
                </div>
                <button className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  Enregistrer les modifications
                </button>
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
          {/* Barre latérale */}
          <div className="w-64 bg-white dark:bg-gray-800 shadow-lg fixed inset-y-0 left-0 overflow-y-auto z-10 pt-20">
            <div className="p-4">
              <div className="text-xl font-bold mb-6 text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Menu
              </div>
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('performances')}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'performances'
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Performances
                </button>
                
                <button
                  onClick={() => setActiveTab('reglages')}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'reglages'
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Réglages
                </button>
                
                <button
                  onClick={() => logoutUser()}
                  className="w-full flex items-center px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Déconnexion
                </button>
              </nav>
            </div>
          </div>
          
          {/* Contenu principal */}
          <div className="flex-1 pl-64">
            <div className="max-w-7xl mx-auto px-6 py-12">
              <UserProfileHeader user={currentUser} />
              <div className="mt-8">
                <p className="text-gray-600 mb-8">
                  Voici un aperçu de vos performances dans nos différents tests cognitifs.
                  Continuez à vous entraîner pour améliorer vos capacités !
                </p>
                {renderContent()}
              </div>
              
              {/* Bouton de réinitialisation en bas de page */}
              <div className="mt-12 flex justify-center">
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  🗑️ Réinitialiser mes performances
                </button>
              </div>

              {/* Modal de confirmation */}
              {showResetConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
                    <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">
                      Confirmer la réinitialisation
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      Êtes-vous sûr de vouloir supprimer toutes vos performances ? 
                      Cette action est irréversible.
                    </p>
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => setShowResetConfirm(false)}
                        className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition-colors"
                        disabled={isResetting}
                      >
                        Annuler
                      </button>
                      <button
                        onClick={resetUserPerformances}
                        disabled={isResetting}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isResetting ? 'Suppression...' : 'Confirmer'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 