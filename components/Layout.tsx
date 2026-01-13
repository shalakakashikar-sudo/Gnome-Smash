
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="relative w-screen h-screen flex flex-col items-center justify-center overflow-hidden bg-black select-none">
      <div className="flex-1 w-full max-w-5xl relative z-10 flex flex-col border-8 border-zinc-800 shadow-[0_0_60px_rgba(0,0,0,1)]">
        {/* Header */}
        <div className="bg-zinc-900 p-3 border-b-4 border-zinc-800 flex justify-between items-center text-[10px] sm:text-xs">
          <span className="text-yellow-500 font-bold tracking-tighter">GNOME SMASH : ED-TECH ARCADE</span>
          <span className="text-zinc-600 font-bold tracking-widest uppercase">CREATED BY SHALAKA KASHIKAR</span>
        </div>

        {/* Game Area */}
        <div className="flex-1 relative bg-black overflow-hidden">
           {children}
        </div>

        {/* Footer with Mandatory Credits */}
        <div className="bg-zinc-900 p-2 border-t-4 border-zinc-800 text-[10px] text-center flex justify-center gap-20">
           <span className="text-zinc-500">SYSTEM STATUS: OPTIMAL</span>
           <span className="text-zinc-400 font-bold tracking-[0.3em] uppercase opacity-75">SHALAKA KASHIKAR PRODUCTIONS</span>
           <span className="text-zinc-500">V1.0.4</span>
        </div>
      </div>
    </div>
  );
};

export default Layout;
