export type Difficulty = 'Beginner' | 'Intermediate' | 'Expert';

export interface GameConfig {
  rows: number;
  cols: number;
  depth: number;
  mines: number;
}

export const DIFFICULTIES: Record<Difficulty, GameConfig> = {
  Beginner: { rows: 5, cols: 5, depth: 5, mines: 15 },
  Intermediate: { rows: 7, cols: 7, depth: 7, mines: 50 },
  Expert: { rows: 10, cols: 10, depth: 10, mines: 150 },
};

export interface Cell {
  row: number;
  col: number;
  layer: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
}

export type GameStatus = 'idle' | 'playing' | 'won' | 'lost';
