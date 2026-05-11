"use client";

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import UserProfileHeader from '@/components/UserProfileHeader';
import GameStatsCard from '@/components/GameStatsCard';
import { useAuth } from '@/contexts/AuthContext';
import { logoutUser, updateDisplayName } from '@/firebase';
import { TOTAL_MAX_POINTS } from '@/lib/points';

interface GameData {
  timestamp: string;
  score?: number | null;
  wpm?: number | null;
  reactionTime?: number | null;
}

interface DashboardTestStats {
  label: string;
  testType: string;
  unit: string;
  lowerIsBetter?: boolean;
  global: { average: number };
  comparison: { bestPercentile: number };
  progression: { percentChange: number };
}

interface LeaderboardEntry {
  rank: number;
  username: string;
  totalPoints: number;
  testsCompleted: number;
  testPoints: Record<string, number>;
}

interface UserRank {
  totalPoints: number;
  rank: number;
  totalPlayers: number;
  testPoints: Record<string, number>;
}

const emptyGamesData: Record<string, GameData[]> = {
  chimpTest: [],
  typingSpeed: [],
  visualMemory: [],
  numberMemory: [],
  verbalMemory: [],
  sequenceMemory: [],
  symbolMemory: [],
  reflex: [],
};

const TEST_META: Record<
  string,
  {
    title: string;
    scoreLabel: string;
    icon: ReactNode;
    link: string;
    color: string;
    valueKey: keyof GameData;
    lowerIsBetter?: boolean;
  }
> = {
  chimpTest: {
    title: 'Test du chimpanzé',
    scoreLabel: 'Niveau atteint',
    icon: <Image src="/chimp.svg" alt="Chimp Test" width={32} height={32} />,
    link: '/tests/chimpTest',
    color: 'from-yellow-400 to-orange-500',
    valueKey: 'score',
  },
  typingSpeed: {
    title: 'Vitesse de frappe',
    scoreLabel: 'Mots par minute',
    icon: <Image src="/keyboard.svg" alt="Typing Speed" width={32} height={32} />,
    link: '/tests/typingSpeed',
    color: 'from-blue-400 to-indigo-500',
    valueKey: 'wpm',
  },
  visualMemory: {
    title: 'Mémoire visuelle',
    scoreLabel: 'Niveau atteint',
    icon: <Image src="/visual.svg" alt="Visual Memory" width={32} height={32} />,
    link: '/tests/visualMemory',
    color: 'from-purple-400 to-pink-500',
    valueKey: 'score',
  },
  numberMemory: {
    title: 'Mémoire des chiffres',
    scoreLabel: 'Chiffres mémorisés',
    icon: <Image src="/number.svg" alt="Number Memory" width={32} height={32} />,
    link: '/tests/numberMemory',
    color: 'from-green-400 to-teal-500',
    valueKey: 'score',
  },
  verbalMemory: {
    title: 'Mémoire verbale',
    scoreLabel: 'Mots mémorisés',
    icon: <Image src="/word.svg" alt="Verbal Memory" width={32} height={32} />,
    link: '/tests/verbalMemory',
    color: 'from-red-400 to-rose-500',
    valueKey: 'score',
  },
  sequenceMemory: {
    title: 'Mémoire de séquence',
    scoreLabel: 'Séquence atteinte',
    icon: <Image src="/sequence.svg" alt="Sequence Memory" width={32} height={32} />,
    link: '/tests/sequenceMemory',
    color: 'from-cyan-400 to-blue-500',
    valueKey: 'score',
  },
  symbolMemory: {
    title: 'Mémoire des symboles',
    scoreLabel: 'Niveau atteint',
    icon: <Image src="/cards.svg" alt="Symbol Memory" width={32} height={32} />,
    link: '/tests/symbolMemory',
    color: 'from-amber-400 to-orange-500',
    valueKey: 'score',
  },
  reflex: {
    title: 'Réflexes',
    scoreLabel: 'Temps',
    icon: <Image src="/zap.svg" alt="Reflex Test" width={32} height={32} />,
    link: '/tests/reflex',
    color: 'from-emerald-400 to-green-500',
    valueKey: 'reactionTime',
    lowerIsBetter: true,
  },
};

const TEST_LABELS: Record<string, string> = {
  chimpTest: 'Chimpanzé',
  typingSpeed: 'Frappe',
  visualMemory: 'Visuelle',
  numberMemory: 'Chiffres',
  verbalMemory: 'Verbale',
  sequenceMemory: 'Séquence',
  symbolMemory: 'Symboles',
  reflex: 'Réflexes',
};

const formatAverageLabel = (value: number, unit: string) => `${value.toFixed(1)} ${unit}`;

export default function ProfilePage() {
  const { currentUser, userLoading } = useAuth();
  const router = useRouter();

  const [gamesData, setGamesData] = useState<Record<string, GameData[]>>(emptyGamesData);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('performances');
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [profileStats, setProfileStats] = useState<DashboardTestStats[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null);
  const [userRank, setUserRank] = useState<UserRank | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [totalPlayers, setTotalPlayers] = useState(0);

  useEffect(() => {
    if (!userLoading && !currentUser) {
      router.replace('/login');
    }
  }, [currentUser, userLoading, router]);

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || '');
    }
  }, [currentUser]);

  const fetchAllGameData = async () => {
    if (!currentUser) {
      setGamesData(emptyGamesData);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/user/all-game-data?userId=${encodeURIComponent(currentUser.uid)}`
      );
      if (!response.ok) throw new Error('Impossible de récupérer vos données de jeu');
      const data = await response.json();
      setGamesData(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des données :', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfileInsights = async () => {
    if (!currentUser) {
      setProfileStats([]);
      return;
    }
    try {
      const response = await fetch(
        `/api/stats/overview?userId=${encodeURIComponent(currentUser.uid)}`
      );
      if (!response.ok) throw new Error('Impossible de récupérer les statistiques du profil');
      const data = await response.json();
      setProfileStats(data.tests || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des insights du profil :', error);
    }
  };

  const fetchUserRank = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch(
        `/api/user/rank?userId=${encodeURIComponent(currentUser.uid)}`
      );
      if (response.ok) {
        const data = await response.json();
        setUserRank(data);
      }
    } catch (error) {
      console.error('Erreur user rank:', error);
    }
  };

  const fetchLeaderboard = async () => {
    setLeaderboardLoading(true);
    try {
      const response = await fetch('/api/leaderboard?limit=50');
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.entries || []);
        setTotalPlayers(data.totalPlayers || 0);
      }
    } catch (error) {
      console.error('Erreur leaderboard:', error);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  useEffect(() => {
    if (userLoading) return;
    if (!currentUser) {
      setGamesData(emptyGamesData);
      setProfileStats([]);
      setIsLoading(false);
      return;
    }
    fetchAllGameData();
    fetchProfileInsights();
    fetchUserRank();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid, userLoading]);

  useEffect(() => {
    if (activeTab === 'classement') {
      fetchLeaderboard();
    }
  }, [activeTab]);

  const statsByType = useMemo(
    () => Object.fromEntries(profileStats.map((item) => [item.testType, item])),
    [profileStats]
  );

  const prepareProgressionData = (
    data: GameData[],
    valueKey: keyof GameData = 'score',
    limit = 10
  ) => {
    if (!Array.isArray(data) || data.length === 0) return null;
    const sortedData = [...data]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-limit);
    const recentScores = sortedData.map((item) => Number(item[valueKey] ?? 0));
    const labels = Array.from({ length: recentScores.length }, (_, i) => `Partie ${i + 1}`);
    return {
      labels,
      datasets: [{ label: 'Progression', data: recentScores, borderWidth: 2, tension: 0.4, fill: true }],
    };
  };

  const resetUserPerformances = async () => {
    if (!currentUser) return;
    setIsResetting(true);
    try {
      const endpoints = [
        'chimpTest', 'typingSpeed', 'visualMemory', 'numberMemory',
        'verbalMemory', 'sequenceMemory', 'symbolMemory', 'reflex',
      ];
      await Promise.all(
        endpoints.map((endpoint) =>
          fetch(`/api/${endpoint}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.uid }),
          })
        )
      );
      await Promise.all([fetchAllGameData(), fetchProfileInsights(), fetchUserRank()]);
      setShowResetConfirm(false);
    } catch (error) {
      console.error('Erreur lors de la réinitialisation des performances :', error);
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
      await Promise.all([
        updateDisplayName(value),
        fetch('/api/user/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firebaseUid: currentUser?.uid, username: value }),
        }),
      ]);
      setProfileFeedback('Pseudo mis à jour avec succès.');
    } catch {
      setProfileFeedback('Impossible de mettre à jour le pseudo.');
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!currentUser) return null;

  const rankPercent =
    userRank && userRank.totalPlayers > 0
      ? Math.round((1 - (userRank.rank - 1) / userRank.totalPlayers) * 100)
      : null;

  const renderRankBanner = () => {
    if (!userRank || userRank.totalPoints === 0) return null;
    return (
      <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl p-5 text-white mb-6 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-amber-100 text-sm font-medium mb-1">Score global</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{userRank.totalPoints.toLocaleString()}</span>
              <span className="text-amber-200 text-sm">/ {TOTAL_MAX_POINTS.toLocaleString()} pts max</span>
            </div>
            <div className="mt-1 w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all"
                style={{ width: `${Math.min(100, (userRank.totalPoints / TOTAL_MAX_POINTS) * 100)}%` }}
              />
            </div>
          </div>
          <div className="text-right">
            <p className="text-amber-100 text-sm font-medium mb-1">Classement mondial</p>
            <p className="text-3xl font-bold">#{userRank.rank}</p>
            {rankPercent !== null && (
              <p className="text-amber-200 text-sm">Top {100 - rankPercent}% des {userRank.totalPlayers} joueurs</p>
            )}
          </div>
        </div>
        {Object.keys(userRank.testPoints).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(userRank.testPoints).map(([test, pts]) => (
              <span key={test} className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full">
                {TEST_LABELS[test] ?? test}: {pts} pts
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderPerformances = () => (
    <>
      <h2 className="text-2xl font-bold mb-3 text-gray-800 dark:text-white">Vos performances</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        Votre progression et votre comparaison au monde sont affichées sur chaque carte.
      </p>

      {renderRankBanner()}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(TEST_META).map(([testType, meta]) => {
            const stats = statsByType[testType];
            const data = gamesData[testType] || [];
            return (
              <GameStatsCard
                key={testType}
                title={meta.title}
                data={data}
                getScore={(item) => Number((item as GameData)[meta.valueKey] ?? 0)}
                getDate={(item) => (item as GameData).timestamp}
                scoreLabel={meta.scoreLabel}
                icon={meta.icon}
                link={meta.link}
                color={meta.color}
                lowerIsBetter={meta.lowerIsBetter}
                prepareChartData={(items) =>
                  prepareProgressionData(items as unknown as GameData[], meta.valueKey, 10)
                }
                insight={
                  stats
                    ? {
                        percentile: stats.comparison.bestPercentile,
                        topPercent: 100 - stats.comparison.bestPercentile,
                        progressPercent: stats.progression.percentChange,
                        worldAverageLabel: formatAverageLabel(stats.global.average, stats.unit),
                      }
                    : undefined
                }
              />
            );
          })}
        </div>
      )}
    </>
  );

  const renderClassement = () => (
    <>
      <h2 className="text-2xl font-bold mb-3 text-gray-800 dark:text-white">Classement mondial</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Top 50 des joueurs par score total (meilleur score par test, max 1000 pts chacun).
      </p>

      {userRank && userRank.totalPoints > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-600 dark:text-blue-300 font-medium">Votre position</p>
            <p className="text-2xl font-bold text-blue-800 dark:text-blue-100">
              #{userRank.rank} — {userRank.totalPoints.toLocaleString()} pts
            </p>
          </div>
          <div className="text-right text-sm text-blue-600 dark:text-blue-300">
            <p>sur {userRank.totalPlayers} joueurs</p>
          </div>
        </div>
      )}

      {leaderboardLoading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center text-gray-500 dark:text-gray-400">
          Aucun joueur dans le classement pour le moment. Jouez des tests pour apparaître ici !
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rang
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Joueur
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                  Tests
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {leaderboard.map((entry) => {
                const isMe = userRank && entry.rank === userRank.rank && entry.totalPoints === userRank.totalPoints;
                return (
                  <tr
                    key={entry.rank}
                    className={`transition-colors ${
                      isMe
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                          entry.rank === 1
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : entry.rank === 2
                            ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                            : entry.rank === 3
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {entry.rank <= 3 ? (entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉') : entry.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${isMe ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-white'}`}>
                        {entry.username}
                        {isMe && <span className="ml-2 text-xs text-blue-500">(vous)</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-gray-800 dark:text-white">
                        {entry.totalPoints.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {entry.testsCompleted}/8
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {totalPlayers > 50 && (
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
              Affichage du top 50 sur {totalPlayers} joueurs
            </div>
          )}
        </div>
      )}
    </>
  );

  const renderSettings = () => (
    <>
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Réglages</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">Informations personnelles</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom d&apos;utilisateur (affiché dans le classement)
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={32}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Votre pseudo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white"
              value={currentUser.email || ''}
              disabled
            />
          </div>
          <button
            onClick={saveProfile}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Enregistrer les modifications
          </button>
          {profileFeedback && (
            <p className={`text-sm ${profileFeedback.includes('succès') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {profileFeedback}
            </p>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
          {/* Sidebar */}
          <div className="w-64 bg-white dark:bg-gray-800 shadow-lg fixed inset-y-0 left-0 overflow-y-auto z-10 pt-20">
            <div className="p-4">
              <div className="text-xl font-bold mb-6 text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Menu
              </div>
              <nav className="space-y-2">
                {[
                  { id: 'performances', label: 'Performances' },
                  { id: 'classement', label: '🏆 Classement' },
                  { id: 'reglages', label: 'Réglages' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors text-left ${
                      activeTab === tab.id
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
                <button
                  onClick={() => logoutUser()}
                  className="w-full flex items-center px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                >
                  Déconnexion
                </button>
              </nav>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 pl-64">
            <div className="max-w-7xl mx-auto px-6 py-12">
              <UserProfileHeader user={currentUser} />
              <div className="mt-8">
                {activeTab === 'performances' && renderPerformances()}
                {activeTab === 'classement' && renderClassement()}
                {activeTab === 'reglages' && renderSettings()}
              </div>

              {activeTab !== 'classement' && (
                <div className="mt-12 flex justify-center">
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Réinitialiser mes performances
                  </button>
                </div>
              )}

              {showResetConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
                    <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">
                      Confirmer la réinitialisation
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      Êtes-vous sûr de vouloir supprimer toutes vos performances ? Cette action
                      est irréversible.
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
                        {isResetting ? 'Suppression…' : 'Confirmer'}
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
