'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';

type NormalizedResult = {
  score: number;
  timestamp: string;
};

type GameResultsContextType = {
  globalResults: NormalizedResult[];
  isLoading: boolean;
  refreshResults: () => Promise<void>;
  saveResult: (score: number) => Promise<void>;
};

type TestConfig = {
  apiPath: string;
  valueField: 'score' | 'reactionTime';
};

const TEST_CONFIGS: Record<string, TestConfig> = {
  chimpTest: { apiPath: '/api/chimpTest', valueField: 'score' },
  numberMemory: { apiPath: '/api/numberMemory', valueField: 'score' },
  visualMemory: { apiPath: '/api/visualMemory', valueField: 'score' },
  verbalMemory: { apiPath: '/api/verbalMemory', valueField: 'score' },
  sequenceMemory: { apiPath: '/api/sequenceMemory', valueField: 'score' },
  symbolMemory: { apiPath: '/api/symbolMemory', valueField: 'score' },
  reflex: { apiPath: '/api/reflex', valueField: 'reactionTime' },
  typingSpeed: { apiPath: '/api/typingSpeed', valueField: 'score' },
};

const EMPTY_CONTEXT: GameResultsContextType = {
  globalResults: [],
  isLoading: false,
  refreshResults: async () => {},
  saveResult: async () => {},
};

const GameResultsContext = createContext<GameResultsContextType>(EMPTY_CONTEXT);

const getTestSlugFromPathname = (pathname: string | null) => {
  if (!pathname?.startsWith('/tests/')) {
    return null;
  }

  const slug = pathname.split('/')[2];
  return slug && TEST_CONFIGS[slug] ? slug : null;
};

const normalizeResult = (item: Record<string, unknown>, valueField: TestConfig['valueField']): NormalizedResult | null => {
  const rawValue = item[valueField];
  const timestamp = typeof item.timestamp === 'string' ? item.timestamp : null;

  if (typeof rawValue !== 'number' || !Number.isFinite(rawValue) || !timestamp) {
    return null;
  }

  return {
    score: rawValue,
    timestamp,
  };
};

export function GameResultsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser } = useAuth();
  const [globalResults, setGlobalResults] = useState<NormalizedResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const testSlug = useMemo(() => getTestSlugFromPathname(pathname), [pathname]);
  const testConfig = testSlug ? TEST_CONFIGS[testSlug] : null;

  const refreshResults = useCallback(async () => {
    if (!testConfig) {
      setGlobalResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${testConfig.apiPath}?type=global`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Impossible de charger les résultats globaux');
      }

      const data = await response.json();
      const normalized = Array.isArray(data)
        ? data
            .map((item) => normalizeResult(item as Record<string, unknown>, testConfig.valueField))
            .filter((item): item is NormalizedResult => item !== null)
        : [];

      setGlobalResults(normalized);
    } catch (error) {
      console.error('Erreur lors du chargement des résultats globaux:', error);
      setGlobalResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [testConfig]);

  const saveResult = useCallback(
    async (score: number) => {
      if (!testConfig || !Number.isFinite(score)) {
        return;
      }

      const payload =
        testConfig.valueField === 'reactionTime'
          ? { reactionTime: score, userId: currentUser?.uid || null }
          : { score, userId: currentUser?.uid || null };

      const response = await fetch(testConfig.apiPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Impossible de sauvegarder le résultat');
      }

      await refreshResults();
    },
    [currentUser?.uid, refreshResults, testConfig]
  );

  useEffect(() => {
    void refreshResults();
  }, [refreshResults]);

  const value = useMemo(
    () => ({
      globalResults,
      isLoading,
      refreshResults,
      saveResult,
    }),
    [globalResults, isLoading, refreshResults, saveResult]
  );

  return <GameResultsContext.Provider value={value}>{children}</GameResultsContext.Provider>;
}

export const useGameResults = () => useContext(GameResultsContext);

