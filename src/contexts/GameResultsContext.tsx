'use client';
import { createContext, useContext } from 'react';

interface GameResultsContextType {
  saveResult: (score: number) => Promise<void>;
  globalResults: Array<{
    score: number;
    timestamp: string;
  }>;
}

const GameResultsContext = createContext<GameResultsContextType>({
  saveResult: async () => {},
  globalResults: []
});

export const useGameResults = () => useContext(GameResultsContext);

export default GameResultsContext; 