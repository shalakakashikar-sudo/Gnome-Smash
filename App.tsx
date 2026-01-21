
import React, { useState } from 'react';
import Layout from './components/Layout.tsx';
import GameEngine from './components/GameEngine.tsx';
import { GameMode } from './types.ts';

export default function App() {
  const [mode, setMode] = useState<GameMode>(GameMode.MENU);
  const [finalScore, setFinalScore] = useState(0);
  const [takeaway, setTakeaway] = useState('');

  const handleStart = (m: GameMode) => {
    setMode(m);
  };

  const handleGameOver = (score: number, note: string) => {
    setFinalScore(score);
    setTakeaway(note);
    setMode(GameMode.SUMMARY);
  };

  return (
    <Layout>
      {mode === GameMode.MENU && (
        <div className="h-full w-full flex flex-col items-center justify-center p-4 sm:p-8 bg-[#0a0a0c]">
          <div className="text-center space-y-4 sm:space-y-6 mb-8 sm:mb-12">
            <div className="text-blue-500 text-[8px] sm:text-[10px] font-bold tracking-[0.4em] uppercase opacity-60">System Ready</div>
            <h1 className="text-4xl sm:text-7xl text-yellow-500 font-black tracking-tighter leading-tight">
              GNOME<br/><span className="text-white">SMASH</span>
            </h1>
            <p className="text-zinc-500 text-[8px] sm:text-[10px] tracking-[0.3em] sm:tracking-[0.4em] uppercase font-bold pt-2 sm:pt-4">Vocabulary Recovery Protocol</p>
          </div>

          <div className="w-full max-w-sm space-y-4">
            <button 
              onClick={() => handleStart(GameMode.VOCAB_SMASH)}
              className="w-full bg-zinc-100 hover:bg-white text-black font-black py-6 sm:py-8 rounded flex flex-col items-center justify-center transition-colors shadow-lg active:scale-95 transform"
            >
              <span className="text-sm sm:text-lg tracking-widest uppercase">Start Session</span>
            </button>
            <div className="text-[7px] sm:text-[9px] text-zinc-600 text-center font-mono uppercase tracking-widest pt-2 sm:pt-4 opacity-50">
              Recovery sequence initialized
            </div>
          </div>
        </div>
      )}

      {mode === GameMode.VOCAB_SMASH && (
        <GameEngine mode={mode} onGameOver={handleGameOver} />
      )}

      {mode === GameMode.SUMMARY && (
        <div className="h-full w-full flex flex-col items-center justify-center p-4 sm:p-8 bg-[#0a0a0c]">
           <div className="text-center mb-6 sm:mb-10">
             <h2 className="text-2xl sm:text-4xl text-white font-black tracking-tight uppercase">Session Complete</h2>
           </div>
           
           <div className="bg-[#121218] border border-zinc-800 p-6 sm:p-10 w-full max-w-2xl text-center space-y-8 sm:space-y-12 rounded shadow-xl">
              <div className="space-y-2 sm:space-y-4">
                <span className="text-zinc-600 text-[8px] sm:text-[9px] uppercase tracking-[0.4em] font-bold block">Final Score</span>
                <div className="text-4xl sm:text-7xl text-yellow-500 font-black font-mono">
                  {finalScore.toLocaleString()}
                </div>
              </div>

              <div className="bg-black/50 p-4 sm:p-6 rounded border border-zinc-800">
                 <span className="text-blue-500 text-[8px] sm:text-[9px] mb-2 sm:mb-3 uppercase font-bold tracking-[0.3em] block">Recovery Log</span>
                 <div className="text-xs sm:text-base leading-relaxed text-zinc-400 italic">
                   "{takeaway}"
                 </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button 
                  onClick={() => setMode(GameMode.MENU)}
                  className="flex-1 bg-zinc-200 hover:bg-white text-black font-black py-4 sm:py-5 rounded transition-all uppercase tracking-widest text-[10px] sm:text-xs active:scale-95 transform"
                >
                  Restart
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-6 sm:px-8 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 font-bold py-4 sm:py-5 rounded border border-zinc-800 transition-all uppercase tracking-widest text-[8px] sm:text-[10px]"
                >
                  System Reset
                </button>
              </div>
           </div>
        </div>
      )}
    </Layout>
  );
}
