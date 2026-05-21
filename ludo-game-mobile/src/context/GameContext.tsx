import React, { createContext, useContext, useState, useCallback } from 'react';

interface GameState {
  gameId: number | null;
  player: 'A' | 'B' | null;
  opponent: string | null;
  isBot: boolean;
  myRolls: number[];
  opponentRolls: number[];
  myTotal: number;
  opponentTotal: number;
  currentTurn: 'A' | 'B';
  status: 'waiting' | 'playing' | 'completed';
  winner: string | null;
  betAmount: number;
  clubId: number;
}

interface GameContextType {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  resetGame: () => void;
}

const defaultState: GameState = {
  gameId: null,
  player: null,
  opponent: null,
  isBot: false,
  myRolls: [],
  opponentRolls: [],
  myTotal: 0,
  opponentTotal: 0,
  currentTurn: 'A',
  status: 'waiting',
  winner: null,
  betAmount: 0,
  clubId: 0,
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(defaultState);

  const resetGame = useCallback(() => {
    setGameState(defaultState);
  }, []);

  return (
    <GameContext.Provider value={{ gameState, setGameState, resetGame }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within GameProvider');
  return context;
}
