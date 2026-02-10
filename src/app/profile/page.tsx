"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import UserProfileHeader from '@/components/UserProfileHeader';
import GameStatsCard from '@/components/GameStatsCard';
import Image from 'next/image';
import { logoutUser, updateDisplayName } from '@/firebase';

interface GameData {
  timestamp: string;
  score?: number | null;
  wpm?: number | null;
  reactionTime?: number | null;
}

type RawGameData = Record<string, unknown>;
type GameCollection = Record<string, RawGameData[]>;

interface DashboardTestStats {
  label: string;
  testType: string;
  unit: string;
  lowerIsBetter?: boolean;
  user: {
    totalCount: number;
    filteredCount: number;
    removedOutliers: number;
    average: number;
    median: number;
    best: number;
  };
  global: {
    totalCount: number;
    filteredCount: number;
    removedOutliers: number;
    average: number;
    median: number;
    best: number;
  };
}

const emptyGamesData = {
  chimpTest: [],
  typingSpeed: [],
  visualMemory: [],
  numberMemory: [],
  verbalMemory: [],
  sequenceMemory: [],
  symbolMemory: [],
  reflex: []
};

export default function ProfilePage() {
  const { currentUser, userLoading } = useAuth();
  const router = useRouter();
  const [gamesData, setGamesData] = useState<GameCollection>(emptyGamesData);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('performances');
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardTestStats[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, userLoading, router]);

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || '');
    }
  }, [currentUser]);

  const fetchAllGameData = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/user/all-game-data?userId=${encodeURIComponent(currentUser.uid)}`);
      if (!response.ok) {
        throw new Error('Impossible de récupérer vos données de jeu');
      }
      const data = await response.json();
      setGamesData(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    if (!currentUser) return;
    setStatsLoading(true);
    try {
      const response = await fetch(`/api/stats/overview?userId=${encodeURIComponent(currentUser.uid)}`);
      if (!response.ok) {
        throw new Error('Impossible de récupérer les stats globales');
      }
      const data = await response.json();
      setDashboardStats(data.tests || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des stats dashboard:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllGameData();
    fetchDashboardStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid]);

  const parseRawGameData = (item: unknown): RawGameData | null => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return null;
    }

    return item as RawGameData;
  };

  const toGameData = (item: unknown): GameData | null => {
    const row = parseRawGameData(item);
    if (!row) {
      return null;
    }

    if (typeof row.timestamp !== 'string') {
      return null;
    }

    return {
      timestamp: row.timestamp,
      score: typeof row.score === 'number' ? row.score : null,
      wpm: typeof row.wpm === 'number' ? row.wpm : null,
      reactionTime: typeof row.reactionTime === 'number' ? row.reactionTime : null
    };
  };

  const prepareProgressionData = (data: RawGameData[], valueKey: keyof GameData = 'score', limit = 10) => {
    if (!Array.isArray(data) || data.length === 0) return null;

    const safeData = data
      .map((item) => toGameData(item))
      .filter((item): item is GameData => item !== null);

    if (safeData.length === 0) {
      return null;
    }

    const sortedData = [...safeData]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-limit);

    const recentScores = sortedData.map((item) => Number(item[valueKey] ?? 0));
    const labels = Array.from({ length: recentScores.length }, (_, i) => `Partie ${i + 1}`);

    return {
      labels,
      datasets: [{ label: 'Progression', data: recentScores, borderWidth: 2, tension: 0.4, fill: true }]
    };
  };

  const resetUserPerformances = async () => {
    if (!currentUser) return;

    setIsResetting(true);
    try {
      const endpoints = ['chimpTest', 'typingSpeed', 'visualMemory', 'numberMemory', 'verbalMemory', 'sequenceMemory', 'symbolMemory', 'reflex'];
      await Promise.all(
        endpoints.map((endpoint) =>
          fetch(`/api/${endpoint}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.uid })
          })
        )
      );

      await Promise.all([fetchAllGameData(), fetchDashboardStats()]);
      setShowResetConfirm(false);
    } catch (error) {
      console.error('Erreur lors de la réinitialisation des performances:', error);
    } finally {
      setIsResetting(false);
    }
  };

  const saveProfile = async () => {
    setProfileFeedback(null);
    const value = displayName.trim();
    if (!value) {
      setProfileFeedback('Le pseudo ne peut pas être vide.');
      return;
    }

    try {
      await updateDisplayName(value);
      setProfileFeedback('Pseudo mis à jour avec succès.');
    } catch {
      setProfileFeedback('Impossible de mettre à jour le pseudo.');
    }
  };

  const dashboardCards = useMemo(() => dashboardStats, [dashboardStats]);

  if (!currentUser) {
    return null;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'performances':
        return (
          <>
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Vos Performances</h2>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <GameStatsCard title="Test du Chimpanzé" data={gamesData.chimpTest} getScore={(item) => Number(toGameData(item)?.score ?? 0)} getDate={(item) => toGameData(item)?.timestamp || new Date(0).toISOString()} scoreLabel="Niveau atteint" icon={<Image src="/chimp.svg" alt="Chimp Test" width={32} height={32} />} link="/tests/chimpTest" color="from-yellow-400 to-orange-500" prepareChartData={(data) => prepareProgressionData(data, 'score', 10)} />
                <GameStatsCard title="Vitesse de Frappe" data={gamesData.typingSpeed} getScore={(item) => Number(toGameData(item)?.wpm ?? 0)} getDate={(item) => toGameData(item)?.timestamp || new Date(0).toISOString()} scoreLabel="Mots par minute" icon={<Image src="/keyboard.svg" alt="Typing Speed" width={32} height={32} />} link="/tests/typingSpeed" color="from-blue-400 to-indigo-500" prepareChartData={(data) => prepareProgressionData(data, 'wpm', 10)} />
                <GameStatsCard title="Mémoire Visuelle" data={gamesData.visualMemory} getScore={(item) => Number(toGameData(item)?.score ?? 0)} getDate={(item) => toGameData(item)?.timestamp || new Date(0).toISOString()} scoreLabel="Niveau atteint" icon={<Image src="/visual.svg" alt="Visual Memory" width={32} height={32} />} link="/tests/visualMemory" color="from-purple-400 to-pink-500" prepareChartData={(data) => prepareProgressionData(data, 'score', 10)} />
                <GameStatsCard title="Mémoire des Chiffres" data={gamesData.numberMemory} getScore={(item) => Number(toGameData(item)?.score ?? 0)} getDate={(item) => toGameData(item)?.timestamp || new Date(0).toISOString()} scoreLabel="Chiffres mémorisés" icon={<Image src="/number.svg" alt="Number Memory" width={32} height={32} />} link="/tests/numberMemory" color="from-green-400 to-teal-500" prepareChartData={(data) => prepareProgressionData(data, 'score', 10)} />
                <GameStatsCard title="Mémoire Verbale" data={gamesData.verbalMemory} getScore={(item) => Number(toGameData(item)?.score ?? 0)} getDate={(item) => toGameData(item)?.timestamp || new Date(0).toISOString()} scoreLabel="Mots mémorisés" icon={<Image src="/word.svg" alt="Verbal Memory" width={32} height={32} />} link="/tests/verbalMemory" color="from-red-400 to-rose-500" prepareChartData={(data) => prepareProgressionData(data, 'score', 10)} />
                <GameStatsCard title="Mémoire de Séquence" data={gamesData.sequenceMemory} getScore={(item) => Number(toGameData(item)?.score ?? 0)} getDate={(item) => toGameData(item)?.timestamp || new Date(0).toISOString()} scoreLabel="Séquence atteinte" icon={<Image src="/sequence.svg" alt="Sequence Memory" width={32} height={32} />} link="/tests/sequenceMemory" color="from-cyan-400 to-blue-500" prepareChartData={(data) => prepareProgressionData(data, 'score', 10)} />
                <GameStatsCard title="Mémoire des Symboles" data={gamesData.symbolMemory} getScore={(item) => Number(toGameData(item)?.score ?? 0)} getDate={(item) => toGameData(item)?.timestamp || new Date(0).toISOString()} scoreLabel="Niveau atteint" icon={<Image src="/cards.svg" alt="Symbol Memory" width={32} height={32} />} link="/tests/symbolMemory" color="from-amber-400 to-orange-500" prepareChartData={(data) => prepareProgressionData(data, 'score', 10)} />
                <GameStatsCard title="Réflexes" data={gamesData.reflex} getScore={(item) => Number(toGameData(item)?.reactionTime ?? 0)} getDate={(item) => toGameData(item)?.timestamp || new Date(0).toISOString()} scoreLabel="Temps (ms)" icon={<Image src="/zap.svg" alt="Reflex Test" width={32} height={32} />} link="/tests/reflex" color="from-emerald-400 to-green-500" prepareChartData={(data) => prepareProgressionData(data, 'reactionTime', 10)} lowerIsBetter={true} />
              </div>
            )}
          </>
        );
      case 'dashboard':
        return (
          <>
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Tableau de bord</h2>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              Comparaison de vos stats avec le monde entier, avec exclusion des valeurs extrêmes (méthode IQR) pour éviter de fausser les moyennes.
            </p>
            {statsLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {dashboardCards.map((test) => (
                  <div key={test.testType} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{test.label}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                        <p className="font-semibold text-blue-700 dark:text-blue-300">Vos stats</p>
                        <p>Moyenne: {test.user.average.toFixed(1)} {test.unit}</p>
                        <p>Médiane: {test.user.median.toFixed(1)} {test.unit}</p>
                        <p>Meilleur: {test.user.best.toFixed(1)} {test.unit}</p>
                        <p>Parties: {test.user.totalCount}</p>
                        <p>Valeurs exclues: {test.user.removedOutliers}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
                        <p className="font-semibold text-emerald-700 dark:text-emerald-300">Monde</p>
                        <p>Moyenne: {test.global.average.toFixed(1)} {test.unit}</p>
                        <p>Médiane: {test.global.median.toFixed(1)} {test.unit}</p>
                        <p>Meilleur: {test.global.best.toFixed(1)} {test.unit}</p>
                        <p>Parties: {test.global.totalCount}</p>
                        <p>Valeurs exclues: {test.global.removedOutliers}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        );
      case 'reglages':
        return (
          <>
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Réglages</h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 dark:text-white">Informations personnelles</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom d&apos;utilisateur</label>
                  <input type="text" value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white" placeholder="Entrez votre nom d&apos;utilisateur" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input type="email" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white" value={currentUser.email || ''} disabled />
                </div>
                <button onClick={saveProfile} className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">Enregistrer les modifications</button>
                {profileFeedback && <p className="text-sm text-gray-600 dark:text-gray-300">{profileFeedback}</p>}
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
          <div className="w-64 bg-white dark:bg-gray-800 shadow-lg fixed inset-y-0 left-0 overflow-y-auto z-10 pt-20">
            <div className="p-4">
              <div className="text-xl font-bold mb-6 text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Menu</div>
              <nav className="space-y-2">
                <button onClick={() => setActiveTab('performances')} className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'performances' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Performances</button>
                <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Dashboard</button>
                <button onClick={() => setActiveTab('reglages')} className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'reglages' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Réglages</button>
                <button onClick={() => logoutUser()} className="w-full flex items-center px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">Déconnexion</button>
              </nav>
            </div>
          </div>

          <div className="flex-1 pl-64">
            <div className="max-w-7xl mx-auto px-6 py-12">
              <UserProfileHeader user={currentUser} />
              <div className="mt-8">
                <p className="text-gray-600 mb-8">Voici un aperçu de vos performances et de votre positionnement global.</p>
                {renderContent()}
              </div>

              <div className="mt-12 flex justify-center">
                <button onClick={() => setShowResetConfirm(true)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium">🗑️ Réinitialiser mes performances</button>
              </div>

              {showResetConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
                    <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Confirmer la réinitialisation</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">Êtes-vous sûr de vouloir supprimer toutes vos performances ? Cette action est irréversible.</p>
                    <div className="flex gap-3 justify-end">
                      <button onClick={() => setShowResetConfirm(false)} className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition-colors" disabled={isResetting}>Annuler</button>
                      <button onClick={resetUserPerformances} disabled={isResetting} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50">{isResetting ? 'Suppression...' : 'Confirmer'}</button>
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
