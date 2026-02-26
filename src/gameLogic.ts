import { Cell, GameConfig } from './types';

export const createBoard = (config: GameConfig): Cell[][][] => {
  const board: Cell[][][] = [];
  for (let l = 0; l < config.depth; l++) {
    const layer: Cell[][] = [];
    for (let r = 0; r < config.rows; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < config.cols; c++) {
        row.push({
          row: r,
          col: c,
          layer: l,
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          neighborMines: 0,
        });
      }
      layer.push(row);
    }
    board.push(layer);
  }
  return board;
};

export const placeMines = (
  board: Cell[][][],
  config: GameConfig,
  firstClick: { row: number; col: number; layer: number }
): Cell[][][] => {
  const newBoard = board.map((layer) => layer.map((row) => row.map((cell) => ({ ...cell }))));
  let minesPlaced = 0;

  while (minesPlaced < config.mines) {
    const l = Math.floor(Math.random() * config.depth);
    const r = Math.floor(Math.random() * config.rows);
    const c = Math.floor(Math.random() * config.cols);

    // Don't place mine on the first click or its immediate 3D neighbors
    const isSafeZone = 
      Math.abs(l - firstClick.layer) <= 1 && 
      Math.abs(r - firstClick.row) <= 1 && 
      Math.abs(c - firstClick.col) <= 1;

    if (!newBoard[l][r][c].isMine && !isSafeZone) {
      newBoard[l][r][c].isMine = true;
      minesPlaced++;
    }
  }

  // Calculate neighbor mines (26 neighbors in 3D)
  for (let l = 0; l < config.depth; l++) {
    for (let r = 0; r < config.rows; r++) {
      for (let c = 0; c < config.cols; c++) {
        if (newBoard[l][r][c].isMine) continue;
        let count = 0;
        for (let dl = -1; dl <= 1; dl++) {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dl === 0 && dr === 0 && dc === 0) continue;
              const nl = l + dl;
              const nr = r + dr;
              const nc = c + dc;
              if (
                nl >= 0 && nl < config.depth &&
                nr >= 0 && nr < config.rows &&
                nc >= 0 && nc < config.cols &&
                newBoard[nl][nr][nc].isMine
              ) {
                count++;
              }
            }
          }
        }
        newBoard[l][r][c].neighborMines = count;
      }
    }
  }

  return newBoard;
};

export const revealCell = (
  board: Cell[][][],
  l: number,
  r: number,
  c: number,
  config: GameConfig
): Cell[][][] => {
  if (board[l][r][c].isRevealed || board[l][r][c].isFlagged) return board;

  const newBoard = board.map((layer) => layer.map((row) => row.map((cell) => ({ ...cell }))));
  
  const revealRecursive = (layer: number, row: number, col: number) => {
    if (
      layer < 0 || layer >= config.depth ||
      row < 0 || row >= config.rows ||
      col < 0 || col >= config.cols ||
      newBoard[layer][row][col].isRevealed ||
      newBoard[layer][row][col].isFlagged
    ) {
      return;
    }

    newBoard[layer][row][col].isRevealed = true;

    if (newBoard[layer][row][col].neighborMines === 0 && !newBoard[layer][row][col].isMine) {
      for (let dl = -1; dl <= 1; dl++) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dl === 0 && dr === 0 && dc === 0) continue;
            revealRecursive(layer + dl, row + dr, col + dc);
          }
        }
      }
    }
  };

  revealRecursive(l, r, c);
  return newBoard;
};
