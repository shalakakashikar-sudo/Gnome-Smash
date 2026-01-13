
import React, { useState } from 'react';
import Layout from './components/Layout';
import GameEngine from './components/GameEngine';
import { GameMode } from './types';

const App: React.FC = () => {
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
        <div className="h-full w-full flex flex-col items-center justify-center p-8 space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl sm:text-6xl text-yellow-500 font-bold drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] animate-pulse">
              GNOME SMASH
            </h1>
            <p className="text-green-400 text-xs sm:text-sm tracking-widest">THE MISCHIEVOUS ENGLISH ARCADE</p>
          </div>

          <div className="w-full max-w-sm">
            <button 
              onClick={() => handleStart(GameMode.VOCAB_SMASH)}
              className="w-full bg-blue-900 border-4 border-blue-700 p-8 hover:bg-blue-800 hover:border-white transition-all group flex flex-col items-center shadow-[0_8px_0_rgb(29,78,216)] active:shadow-none active:translate-y-2"
            >
              <span className="text-4xl mb-4 group-hover:scale-125 transition-transform">📚</span>
              <span className="text-lg font-bold text-white mb-2 tracking-widest">START GAME</span>
              <span className="text-[10px] text-blue-200 uppercase">Match the correct vocabulary</span>
            </button>
          </div>

          <div className="text-[10px] text-zinc-500 max-w-md text-center leading-loose">
            "THE GNOMES ARE WAITING. WATCH THE PROMPT AT THE TOP AND SMASH THE RIGHT BRICK. WRONG HITS WILL AWAKEN THE TRICKSTERS!"
          </div>
        </div>
      )}

      {mode === GameMode.VOCAB_SMASH && (
        <GameEngine mode={mode} onGameOver={handleGameOver} />
      )}

      {mode === GameMode.SUMMARY && (
        <div className="h-full w-full flex flex-col items-center justify-center p-10 bg-black/80 backdrop-blur-sm">
           <h2 className="text-3xl text-yellow-400 mb-8">GAME OVER</h2>
           
           <div className="bg-zinc-900 border-4 border-green-800 p-8 w-full max-w-md text-center space-y-6">
              <div>
                <div className="text-zinc-500 text-xs mb-1 uppercase">Final Score</div>
                <div className="text-4xl text-white font-bold">{finalScore.toString().padStart(6, '0')}</div>
              </div>

              <div className="border-t border-zinc-700 pt-6">
                 <div className="text-green-400 text-xs mb-2 uppercase">Gnome's Verdict:</div>
                 <div className="text-[10px] sm:text-xs leading-relaxed text-zinc-300 italic">
                   "{takeaway}"
                 </div>
              </div>

              <button 
                onClick={() => setMode(GameMode.MENU)}
                className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold p-4 text-sm border-b-4 border-yellow-800 active:translate-y-1 transition-all"
              >
                RETURN TO MENU
              </button>
           </div>
           
           <div className="mt-8 text-xs text-white tracking-widest opacity-80 uppercase">
             Created by Shalaka Kashikar
           </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
