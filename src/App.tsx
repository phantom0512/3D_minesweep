import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Bomb, 
  Flag, 
  RefreshCw, 
  Timer, 
  Settings2,
  ChevronDown,
  Skull,
  Layers,
  ChevronUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Difficulty, GameConfig, Cell, GameStatus, DIFFICULTIES } from './types';
import { createBoard, placeMines, revealCell } from './gameLogic';

export default function App() {
  const [difficulty, setDifficulty] = useState<Difficulty>('Beginner');
  const [status, setStatus] = useState<GameStatus>('idle');
  const [board, setBoard] = useState<Cell[][][]>([]);
  const [currentLayer, setCurrentLayer] = useState(0);
  const [timer, setTimer] = useState(0);
  const [flagsUsed, setFlagsUsed] = useState(0);
  const [showDifficultyMenu, setShowDifficultyMenu] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const config = DIFFICULTIES[difficulty];

  const initGame = useCallback(() => {
    setBoard(createBoard(config));
    setStatus('idle');
    setTimer(0);
    setFlagsUsed(0);
    setCurrentLayer(0);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [config]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (status === 'playing') {
      timerRef.current = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  const checkWin = (currentBoard: Cell[][][]) => {
    let revealedCount = 0;
    for (const layer of currentBoard) {
      for (const row of layer) {
        for (const cell of row) {
          if (cell.isRevealed) revealedCount++;
        }
      }
    }
    if (revealedCount === config.rows * config.cols * config.depth - config.mines) {
      setStatus('won');
      confetti({
        particleCount: 200,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#FF0032', '#FFFFFF', '#333333']
      });
    }
  };

  const handleCellClick = (l: number, r: number, c: number) => {
    if (status === 'won' || status === 'lost' || board[l][r][c].isFlagged) return;

    let currentBoard = board;
    if (status === 'idle') {
      currentBoard = placeMines(board, config, { layer: l, row: r, col: c });
      setStatus('playing');
    }

    if (currentBoard[l][r][c].isMine) {
      // Reveal all mines in all layers
      const revealedMines = currentBoard.map(layer => 
        layer.map(row => 
          row.map(cell => cell.isMine ? { ...cell, isRevealed: true } : cell)
        )
      );
      setBoard(revealedMines);
      setStatus('lost');
      return;
    }

    const newBoard = revealCell(currentBoard, l, r, c, config);
    setBoard(newBoard);
    checkWin(newBoard);
  };

  const handleContextMenu = (e: React.MouseEvent, l: number, r: number, c: number) => {
    e.preventDefault();
    if (status === 'won' || status === 'lost' || board[l][r][c].isRevealed) return;

    const newBoard = board.map((layer, li) =>
      layer.map((row, ri) =>
        row.map((cell, ci) => {
          if (li === l && ri === r && ci === c) {
            const newFlagged = !cell.isFlagged;
            setFlagsUsed(prev => newFlagged ? prev + 1 : prev - 1);
            return { ...cell, isFlagged: newFlagged };
          }
          return cell;
        })
      )
    );
    setBoard(newBoard);
  };

  const getCellContent = (cell: Cell) => {
    if (cell.isRevealed) {
      if (cell.isMine) return <Bomb className="w-4 h-4 text-[#FF0032] drop-shadow-[0_0_8px_rgba(255,0,50,0.8)]" />;
      if (cell.neighborMines > 0) return cell.neighborMines;
      return '';
    }
    if (cell.isFlagged) return <Flag className="w-4 h-4 text-[#FF0032] fill-[#FF0032] drop-shadow-[0_0_5px_rgba(255,0,50,0.5)]" />;
    return '';
  };

  const getCellColor = (num: number) => {
    const colors = [
      '',
      'text-cyan-400',
      'text-emerald-400',
      'text-[#FF0032]',
      'text-purple-400',
      'text-yellow-400',
      'text-pink-400',
      'text-white',
      'text-gray-400',
    ];
    return colors[num] || '';
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white font-sans p-4 md:p-8 flex flex-col items-center selection:bg-[#FF0032]">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute -inset-1 bg-[#FF0032] rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-[#1A1A1A] p-3 border border-[#FF0032]/30 rounded-lg">
              <Layers className="w-7 h-7 text-[#FF0032]" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-display font-black tracking-tighter italic text-white rog-text-glow">
              ROG <span className="text-[#FF0032]">3D MINES</span>
            </h1>
            <p className="text-[10px] text-[#FF0032] font-display font-bold uppercase tracking-[0.3em] opacity-80">Republic of Gamers // 3D Tactical Cube</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => setShowDifficultyMenu(!showDifficultyMenu)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#1A1A1A] border border-[#FF0032]/40 rounded-sm hover:border-[#FF0032] transition-all font-display font-bold text-xs uppercase tracking-wider text-white rog-glow"
            >
              <Settings2 className="w-4 h-4 text-[#FF0032]" />
              {difficulty}
              <ChevronDown className={`w-4 h-4 transition-transform text-[#FF0032] ${showDifficultyMenu ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {showDifficultyMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full right-0 mt-2 w-52 bg-[#1A1A1A] border border-[#FF0032]/50 rounded-sm shadow-2xl z-50 overflow-hidden backdrop-blur-xl"
                >
                  {(Object.keys(DIFFICULTIES) as Difficulty[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => {
                        setDifficulty(d);
                        setShowDifficultyMenu(false);
                      }}
                      className={`w-full text-left px-5 py-4 text-xs font-display font-bold uppercase tracking-widest hover:bg-[#FF0032]/10 transition-colors flex justify-between items-center border-b border-[#FF0032]/10 last:border-0 ${difficulty === d ? 'bg-[#FF0032]/20 text-[#FF0032]' : 'text-gray-400'}`}
                    >
                      {d}
                      <span className="text-[9px] opacity-40">{DIFFICULTIES[d].rows}x{DIFFICULTIES[d].cols}x{DIFFICULTIES[d].depth}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={initGame}
            className="p-3 bg-[#FF0032] text-white rounded-sm hover:bg-[#CC0028] transition-all shadow-[0_0_20px_rgba(255,0,50,0.3)] active:scale-95"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* Stats Bar */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-fit bg-[#1A1A1A]/80 border border-[#FF0032]/20 rounded-sm p-5 mb-8 flex items-center gap-10 md:gap-16 backdrop-blur-md relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-[#FF0032]" />
        
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-sm bg-[#FF0032]/10 border border-[#FF0032]/30 flex items-center justify-center">
            <Flag className="w-6 h-6 text-[#FF0032]" />
          </div>
          <div>
            <div className="text-[9px] text-gray-500 font-display font-bold uppercase tracking-[0.2em]">Tactical Intel</div>
            <div className="text-2xl font-display font-black text-white leading-none">{Math.max(0, config.mines - flagsUsed)}</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-sm bg-[#FF0032]/10 border border-[#FF0032]/30 flex items-center justify-center">
            <Timer className="w-6 h-6 text-[#FF0032]" />
          </div>
          <div>
            <div className="text-[9px] text-gray-500 font-display font-bold uppercase tracking-[0.2em]">Mission Time</div>
            <div className="text-2xl font-display font-black text-white leading-none">{timer.toString().padStart(3, '0')}</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-sm bg-[#FF0032]/10 border border-[#FF0032]/30 flex items-center justify-center">
            <Layers className="w-6 h-6 text-[#FF0032]" />
          </div>
          <div>
            <div className="text-[9px] text-gray-500 font-display font-bold uppercase tracking-[0.2em]">Current Layer</div>
            <div className="text-2xl font-display font-black text-white leading-none">{currentLayer + 1}/{config.depth}</div>
          </div>
        </div>
      </motion.div>

      {/* 3D Navigation & Board */}
      <div className="flex flex-col md:flex-row gap-8 items-center">
        {/* Layer Selector */}
        <div className="flex flex-row md:flex-col gap-2 order-2 md:order-1">
          <button 
            onClick={() => setCurrentLayer(prev => Math.min(config.depth - 1, prev + 1))}
            disabled={currentLayer === config.depth - 1}
            className="p-3 bg-[#1A1A1A] border border-[#FF0032]/30 text-[#FF0032] rounded-sm hover:bg-[#FF0032]/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
          >
            <ChevronUp className="w-6 h-6" />
          </button>
          
          <div className="flex flex-row md:flex-col gap-1 max-h-[400px] overflow-y-auto p-1 bg-[#1A1A1A]/50 rounded-sm border border-white/5">
            {Array.from({ length: config.depth }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentLayer(i)}
                className={`w-10 h-10 flex items-center justify-center font-display font-black text-xs transition-all ${currentLayer === i ? 'bg-[#FF0032] text-white shadow-[0_0_15px_rgba(255,0,50,0.5)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
              >
                {i + 1}
              </button>
            )).reverse()}
          </div>

          <button 
            onClick={() => setCurrentLayer(prev => Math.max(0, prev - 1))}
            disabled={currentLayer === 0}
            className="p-3 bg-[#1A1A1A] border border-[#FF0032]/30 text-[#FF0032] rounded-sm hover:bg-[#FF0032]/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>

        {/* Game Board Container */}
        <div className="relative order-1 md:order-2">
          <div className="absolute -inset-4 bg-[#FF0032]/5 blur-3xl rounded-full"></div>
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentLayer}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.05, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-[#121212] p-6 rounded-sm border border-[#FF0032]/30 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-auto max-w-full relative z-10"
            >
              <div 
                className="grid gap-1.5 mx-auto"
                style={{ 
                  gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
                  width: 'fit-content'
                }}
              >
                {board[currentLayer]?.map((row, r) => (
                  row.map((cell, c) => (
                    <motion.div
                      key={`${currentLayer}-${r}-${c}`}
                      whileHover={!cell.isRevealed && !cell.isFlagged ? { 
                        backgroundColor: 'rgba(255, 0, 50, 0.1)',
                        borderColor: 'rgba(255, 0, 50, 0.6)',
                        scale: 1.05
                      } : {}}
                      whileTap={!cell.isRevealed && !cell.isFlagged ? { scale: 0.95 } : {}}
                      onClick={() => handleCellClick(currentLayer, r, c)}
                      onContextMenu={(e) => handleContextMenu(e, currentLayer, r, c)}
                      className={`
                        w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-sm font-display font-black cursor-pointer transition-all duration-200
                        ${cell.isRevealed 
                          ? cell.isMine 
                            ? 'bg-[#FF0032]/20 border border-[#FF0032] shadow-[0_0_15px_rgba(255,0,50,0.4)]' 
                            : 'bg-[#0A0A0A] border border-white/5 shadow-inner opacity-60' 
                          : 'bg-[#2D2D2D] border border-[#444444] shadow-[0_4px_0_0_#1A1A1A,0_8px_15px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none'}
                        ${cell.isRevealed ? getCellColor(cell.neighborMines) : ''}
                        ${!cell.isRevealed && !cell.isFlagged ? 'hover:bg-[#353535] hover:border-[#FF0032]/50 hover:shadow-[0_4px_0_0_#1A1A1A,0_0_15px_rgba(255,0,50,0.3)]' : ''}
                      `}
                    >
                      {getCellContent(cell)}
                    </motion.div>
                  ))
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Status Overlays */}
          <AnimatePresence>
            {(status === 'won' || status === 'lost') && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 flex items-center justify-center p-4"
              >
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
                <motion.div 
                  initial={{ scale: 0.8, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="relative bg-[#1A1A1A] p-10 border-2 border-[#FF0032] flex flex-col items-center gap-6 shadow-[0_0_100px_rgba(255,0,50,0.4)] max-w-md w-full"
                  style={{ clipPath: 'polygon(0 20px, 20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)' }}
                >
                  {status === 'won' ? (
                    <>
                      <div className="w-20 h-20 bg-[#FF0032]/10 border border-[#FF0032] rounded-full flex items-center justify-center mb-2 rog-glow">
                        <Trophy className="w-10 h-10 text-[#FF0032]" />
                      </div>
                      <div className="text-center">
                        <h2 className="text-4xl font-display font-black text-white italic tracking-tighter rog-text-glow">MISSION <span className="text-[#FF0032]">COMPLETE</span></h2>
                        <p className="text-gray-400 font-display text-[10px] uppercase tracking-[0.4em] mt-2">Elite Performance // {timer}s</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 bg-[#FF0032]/10 border border-[#FF0032] rounded-full flex items-center justify-center mb-2 rog-glow">
                        <Skull className="w-10 h-10 text-[#FF0032]" />
                      </div>
                      <div className="text-center">
                        <h2 className="text-4xl font-display font-black text-white italic tracking-tighter rog-text-glow">MISSION <span className="text-[#FF0032]">FAILED</span></h2>
                        <p className="text-gray-400 font-display text-[10px] uppercase tracking-[0.4em] mt-2">Critical System Failure</p>
                      </div>
                    </>
                  )}
                  <button 
                    onClick={initGame}
                    className="mt-4 w-full py-4 bg-[#FF0032] text-white font-display font-black uppercase tracking-widest hover:bg-[#CC0028] transition-all shadow-[0_0_30px_rgba(255,0,50,0.5)] flex items-center justify-center gap-3 italic"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Re-Engage
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-12 flex flex-col items-center gap-6">
        <div className="flex gap-4">
          <div className="px-4 py-2 bg-[#1A1A1A] border border-white/10 rounded-sm flex items-center gap-3">
            <div className="w-2 h-2 bg-[#FF0032] animate-pulse rounded-full"></div>
            <span className="text-[10px] font-display font-bold uppercase tracking-widest text-gray-400">3D Neural Link Active</span>
          </div>
          <div className="px-4 py-2 bg-[#1A1A1A] border border-white/10 rounded-sm flex items-center gap-3">
            <span className="text-[10px] font-display font-bold uppercase tracking-widest text-gray-400">v3.0 Dimensional</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl w-full">
          <div className="flex flex-col gap-2">
            <div className="text-[9px] text-[#FF0032] font-display font-bold uppercase tracking-widest">3D Scanning</div>
            <div className="bg-[#1A1A1A] p-3 border border-white/5 text-[11px] font-display font-bold uppercase tracking-widest text-gray-300">Each cell has 26 neighbors across 3 layers</div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-[9px] text-[#FF0032] font-display font-bold uppercase tracking-widest">Navigation</div>
            <div className="bg-[#1A1A1A] p-3 border border-white/5 text-[11px] font-display font-bold uppercase tracking-widest text-gray-300">Use side panel to switch depth layers</div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-[9px] text-[#FF0032] font-display font-bold uppercase tracking-widest">Tactical Tip</div>
            <div className="bg-[#1A1A1A] p-3 border border-white/5 text-[11px] font-display font-bold uppercase tracking-widest text-gray-300">Numbers include mines above and below</div>
          </div>
        </div>
      </div>
    </div>
  );
}
