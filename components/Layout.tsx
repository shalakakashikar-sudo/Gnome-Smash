
import React from 'react';

interface LayoutProps {
  // Fix: Making children optional resolves "Property 'children' is missing in type '{}'" 
  // errors in some JSX/TypeScript environments when elements are passed as nested children.
  children?: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="relative w-screen h-[100dvh] flex flex-col items-center justify-center overflow-hidden bg-black select-none font-sans">
      <div className="flex-1 w-full h-full flex flex-col bg-zinc-950 overflow-hidden">
        <div className="bg-zinc-900 px-4 py-2 border-b border-zinc-800 flex justify-between items-center shrink-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
            <span className="text-yellow-500 font-black text-[12px] sm:text-sm tracking-tighter uppercase">GNOME SMASH 2.0</span>
          </div>
          <span className="text-zinc-600 font-bold text-[9px] uppercase tracking-[0.2em] hidden sm:block">SHALAKA KASHIKAR PRODUCTIONS</span>
          <div className="flex items-center gap-4">
             <span className="text-zinc-500 font-mono text-[9px]">RES: 1024x576</span>
             <span className="text-zinc-700 font-mono text-[9px]">REV: 1.2.0</span>
          </div>
        </div>

        <div className="flex-1 relative bg-[#050505] overflow-hidden flex flex-col">
           {children}
        </div>

        <div className="bg-zinc-900 px-4 py-2 border-t border-zinc-800 flex justify-between items-center shrink-0 z-50">
           <span className="text-zinc-700 text-[9px] font-bold uppercase tracking-widest">ARCADE_MODE: ACTIVE</span>
           <span className="text-zinc-500 text-[9px] font-mono uppercase">© 2025 S. KASHIKAR • ALL RIGHTS RESERVED</span>
        </div>
      </div>
    </div>
  );
}
