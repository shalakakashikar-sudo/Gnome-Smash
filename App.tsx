
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
        <div className="h-full w-full flex flex-col items-center justify-center p-4 sm:p-8 space-y-6 sm:space-y-12 bg-[radial-gradient(circle_at_center,_#111_0%,_#000_100%)]">
          <div className="text-center space-y-2 sm:space-y-4">
            <h1 className="text-3xl sm:text-5xl md:text-7xl text-yellow-500 font-bold drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] animate-pulse tracking-tighter">
              GNOME SMASH
            </h1>
            <p className="text-green-400 text-[8px] sm:text-xs md:text-sm tracking-[0.3em] uppercase font-bold opacity-80">THE MISCHIEVOUS ENGLISH ARCADE</p>
          </div>

          <div className="w-full max-w-[280px] sm:max-w-md px-2">
            <button 
              onClick={() => handleStart(GameMode.VOCAB_SMASH)}
              className="w-full bg-blue-900 border-2 sm:border-4 border-blue-700 p-4 sm:p-10 hover:bg-blue-800 hover:border-white transition-all group flex flex-col items-center shadow-[0_4px_0_rgb(29,78,216)] sm:shadow-[0_8px_0_rgb(29,78,216)] active:shadow-none active:translate-y-1 sm:active:translate-y-2 rounded"
            >
              <span className="text-2xl sm:text-5xl mb-2 sm:mb-4 group-hover:scale-110 transition-transform">📚</span>
              <span className="text-sm sm:text-xl font-bold text-white mb-1 sm:mb-2 tracking-widest">INSERT COIN / START</span>
              <span className="text-[7px] sm:text-[10px] text-blue-300 uppercase opacity-70">Tap or Click to Play</span>
            </button>
          </div>

          <div className="text-[7px] sm:text-[11px] text-zinc-600 max-w-[240px] sm:max-w-md text-center leading-relaxed font-mono uppercase bg-zinc-950/50 p-2 sm:p-4 rounded border border-zinc-800/30">
            "Watch the prompt at the top. smash the right brick. avoid the devilish gnomes or face their curses!"
          </div>
        </div>
      )}

      {mode === GameMode.VOCAB_SMASH && (
        <GameEngine mode={mode} onGameOver={handleGameOver} />
      )}

      {mode === GameMode.SUMMARY && (
        <div className="h-full w-full flex flex-col items-center justify-center p-4 sm:p-10 bg-black/90 backdrop-blur-md">
           <h2 className="text-xl sm:text-4xl text-yellow-400 mb-4 sm:mb-8 font-black tracking-tighter">GAME OVER</h2>
           
           <div className="bg-zinc-900/80 border-2 sm:border-4 border-green-800 p-4 sm:p-10 w-full max-w-[320px] sm:max-w-lg text-center space-y-4 sm:space-y-8 shadow-2xl">
              <div className="space-y-1">
                <div className="text-zinc-500 text-[8px] sm:text-xs mb-1 uppercase tracking-widest font-bold">Final Arcade Score</div>
                <div className="text-3xl sm:text-6xl text-white font-black font-mono">{finalScore.toString().padStart(6, '0')}</div>
              </div>

              <div className="border-t border-zinc-800 pt-4 sm:pt-8">
                 <div className="text-green-500 text-[8px] sm:text-xs mb-2 uppercase font-bold">Gnome's Parting Wisdom:</div>
                 <div className="text-[9px] sm:text-sm leading-relaxed text-zinc-400 italic bg-black/40 p-3 sm:p-5 rounded border border-zinc-800">
                   "{takeaway}"
                 </div>
              </div>

              <button 
                onClick={() => setMode(GameMode.MENU)}
                className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold p-3 sm:p-5 text-xs sm:text-base border-b-4 border-yellow-900 active:translate-y-1 transition-all rounded uppercase"
              >
                RETURN TO ARCADE
              </button>
           </div>
           
           <div className="mt-6 sm:mt-10 text-[6px] sm:text-[10px] text-zinc-700 tracking-[0.4em] font-bold uppercase">
             CREATED BY SHALAKA KASHIKAR
           </div>
        </div>
      )}
    </Layout>
  );
}
