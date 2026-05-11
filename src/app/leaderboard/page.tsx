'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { TEST_NAMES, TOTAL_MAX_POINTS } from '@/lib/points';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  totalPoints: number;
  testsCompleted: number;
  testPoints: Record<string, number>;
}

interface LeaderboardData {
  entries: LeaderboardEntry[];
  totalPlayers: number;
}

const RANK_MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function LeaderboardPage() {
  const { currentUser } = useAuth();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/leaderboard?limit=50');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const currentUserEntry = data?.entries.find((e) => e.userId === currentUser?.uid);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-14 sm:pt-16">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            🏆 Classement mondial
          </h1>
          {data && (
            <p className="text-gray-500 dark:text-gray-400">
              {data.totalPlayers} joueur{data.totalPlayers !== 1 ? 's' : ''} classé{data.totalPlayers !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {currentUserEntry && (
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white shadow-lg">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-0.5">Votre position</p>
                <p className="text-2xl font-bold">
                  {RANK_MEDALS[currentUserEntry.rank] ?? `#${currentUserEntry.rank}`} {currentUserEntry.username}
                </p>
              </div>
              <div className="text-right">
                <p className="text-blue-100 text-sm">Score total</p>
                <p className="text-3xl font-bold">
                  {currentUserEntry.totalPoints.toLocaleString()}
                  <span className="text-base font-normal text-blue-200"> / {TOTAL_MAX_POINTS.toLocaleString()}</span>
                </p>
              </div>
            </div>
            <div className="mt-3 h-2 bg-blue-500/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${(currentUserEntry.totalPoints / TOTAL_MAX_POINTS) * 100}%` }}
              />
            </div>
          </div>
        )}

        {!currentUser && (
          <div className="mb-6 rounded-2xl border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4 text-amber-800 dark:text-amber-300 text-sm text-center">
            <Link href="/login" className="font-semibold underline">Connectez-vous</Link> pour voir votre position et apparaître dans le classement.
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-24">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
          ) : !data || data.entries.length === 0 ? (
            <div className="text-center py-24 text-gray-400 dark:text-gray-500">
              <p className="text-5xl mb-4">🏜️</p>
              <p className="font-medium">Aucun joueur classé pour le moment.</p>
              <p className="text-sm mt-1">Complétez des tests pour apparaître ici !</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-14">Rang</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joueur</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Tests</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {data.entries.map((entry) => {
                  const isMe = entry.userId === currentUser?.uid;
                  const isExpanded = expandedRow === entry.userId;
                  return (
                    <Fragment key={entry.userId}>
                      <tr
                        onClick={() => setExpandedRow(isExpanded ? null : entry.userId)}
                        className={`cursor-pointer transition-colors ${
                          isMe
                            ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                        }`}
                      >
                        <td className="px-4 py-3.5">
                          <span className="text-xl">
                            {RANK_MEDALS[entry.rank] ?? (
                              <span className="text-sm font-bold text-gray-500 dark:text-gray-400">#{entry.rank}</span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${isMe ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
                              {entry.username}
                            </span>
                            {isMe && (
                              <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full font-medium">
                                vous
                              </span>
                            )}
                          </div>
                          <div className="mt-1 h-1 w-24 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isMe ? 'bg-blue-500' : 'bg-amber-400'}`}
                              style={{ width: `${(entry.totalPoints / TOTAL_MAX_POINTS) * 100}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                          {entry.testsCompleted}/8
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className={`text-lg font-bold ${isMe ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
                            {entry.totalPoints.toLocaleString()}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">pts</span>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${entry.userId}-expanded`} className={isMe ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'bg-gray-50 dark:bg-gray-800/50'}>
                          <td colSpan={4} className="px-6 py-3">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {Object.entries(TEST_NAMES).map(([key, label]) => {
                                const pts = entry.testPoints[key] ?? 0;
                                return (
                                  <div key={key} className="bg-white dark:bg-gray-800 rounded-lg px-3 py-2 shadow-sm">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{label}</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                                      {pts > 0 ? `${pts} pts` : <span className="text-gray-400 font-normal">—</span>}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
          Classement mis à jour en temps réel · Cliquez sur une ligne pour voir le détail par test
        </p>
      </div>
    </div>
  );
}
