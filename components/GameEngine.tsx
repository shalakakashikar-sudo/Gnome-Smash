
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  GameMode, 
  Brick, 
  Ball, 
  Paddle, 
  Gnome,
  LearningPopup,
  VocabItem
} from '../types.ts';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  PADDLE_WIDTH, 
  PADDLE_HEIGHT, 
  BALL_RADIUS, 
  INITIAL_BALL_SPEED, 
  FULL_VOCAB_POOL 
} from '../constants.ts';

interface GameEngineProps {
  mode: GameMode;
  onGameOver: (score: number, takeaway: string) => void;
}

export default function GameEngine({ mode, onGameOver }: GameEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [targetInfo, setTargetInfo] = useState<string>('');
  const [learningLog, setLearningLog] = useState<string>('SMASH THE TARGET BRICK!');
  const [combo, setCombo] = useState(0);
  const [isPaused, setIsPaused] = useState(true);

  const paddleRef = useRef<Paddle>({
    x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
    y: CANVAS_HEIGHT - 60,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT
  });

  const ballRef = useRef<Ball>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 100,
    dx: INITIAL_BALL_SPEED,
    dy: -INITIAL_BALL_SPEED,
    radius: BALL_RADIUS
  });

  const bricksRef = useRef<Brick[]>([]);
  const gnomesRef = useRef<Gnome[]>([]);
  const popupsRef = useRef<LearningPopup[]>([]);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const effectStateRef = useRef<{ reverse: number; shrink: number; speedup: number; shield: number; magnet: number; grow: number }>({ 
    reverse: 0, shrink: 0, speedup: 0, shield: 0, magnet: 0, grow: 0 
  });
  const ballCaughtRef = useRef<boolean>(false);
  const wrongHitCounterRef = useRef<number>(0);

  const addPopup = (x: number, y: number, text: string, subtext: string, color: string) => {
    popupsRef.current.push({
      id: Math.random().toString(),
      x, y, text, subtext, color, timer: 60
    });
  };

  const refreshTarget = useCallback(() => {
    const activeBricks = bricksRef.current.filter(b => b.active);
    if (activeBricks.length === 0) return false;

    const targetBrick = activeBricks[Math.floor(Math.random() * activeBricks.length)];
    const vocabItem = FULL_VOCAB_POOL.find(v => v.id === targetBrick.id);

    if (vocabItem) {
      const useAntonym = Math.random() > 0.5;
      if (useAntonym && vocabItem.antonyms.length > 0) {
        const antonym = vocabItem.antonyms[Math.floor(Math.random() * vocabItem.antonyms.length)];
        setTargetInfo(`FIND THE ANTONYM OF: ${antonym.toUpperCase()}`);
      } else {
        const synonym = vocabItem.synonyms[Math.floor(Math.random() * vocabItem.synonyms.length)];
        setTargetInfo(`FIND THE SYNONYM OF: ${synonym.toUpperCase()}`);
      }
      bricksRef.current.forEach(b => { b.isTarget = b.id === targetBrick.id; });
      return true;
    }
    return false;
  }, []);

  const initLevel = useCallback(() => {
    const cols = 5; 
    const rows = 3; 
    // Further increased spacing to allow the ball to easily glide between bricks
    const paddingX = 60; 
    const paddingY = 40;
    const availableW = CANVAS_WIDTH - 160;
    const bWidth = (availableW - (cols - 1) * paddingX) / cols;
    const bHeight = 65;
    const offX = (CANVAS_WIDTH - (cols * bWidth + (cols - 1) * paddingX)) / 2;
    const offY = 80;

    const pool = [...FULL_VOCAB_POOL].sort(() => Math.random() - 0.5);
    const items = pool.slice(0, Math.min(cols * rows, pool.length));

    bricksRef.current = items.map((item, i) => ({
      id: item.id,
      x: offX + (i % cols) * (bWidth + paddingX),
      y: offY + Math.floor(i / cols) * (bHeight + paddingY),
      width: bWidth,
      height: bHeight,
      active: true,
      content: item.word,
      isTarget: false,
      type: 'vocab',
      hits: 1
    }));

    refreshTarget();
    setCombo(0);
    wrongHitCounterRef.current = 0;
    ballRef.current = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 100,
      dx: (Math.random() - 0.5) * 6,
      dy: -INITIAL_BALL_SPEED,
      radius: BALL_RADIUS
    };
    paddleRef.current.x = CANVAS_WIDTH / 2 - paddleRef.current.width / 2;
    paddleRef.current.width = PADDLE_WIDTH;
    Object.keys(effectStateRef.current).forEach(k => (effectStateRef.current as any)[k] = 0);
    ballCaughtRef.current = false;
    popupsRef.current = [];
    setLearningLog('FIND THE BRICK. SAVE THE GNOMES.');
    setIsPaused(true);
  }, [refreshTarget]);

  useEffect(() => { initLevel(); }, [initLevel]);

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => { 
      keysRef.current[e.code] = true; 
      if(e.code === 'Space') {
        if (isPaused) setIsPaused(false);
        else if (ballCaughtRef.current) ballCaughtRef.current = false;
      }
    };
    const handleUp = (e: KeyboardEvent) => { keysRef.current[e.code] = false; };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const scaleX = CANVAS_WIDTH / rect.width;
        const targetX = mouseX * scaleX - paddleRef.current.width / 2;
        paddleRef.current.x = Math.max(0, Math.min(CANVAS_WIDTH - paddleRef.current.width, targetX));
      }
    };

    const handleMouseDown = () => {
      if (isPaused) setIsPaused(false);
      else if (ballCaughtRef.current) ballCaughtRef.current = false;
    };
    
    const handleTouch = (e: TouchEvent) => {
      if (isPaused) {
        setIsPaused(false);
        e.preventDefault();
        return;
      }
      if (ballCaughtRef.current) {
        ballCaughtRef.current = false;
        e.preventDefault();
      }
      if (e.touches.length > 0 && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const touchX = e.touches[0].clientX - rect.left;
        const scaleX = CANVAS_WIDTH / rect.width;
        const targetX = touchX * scaleX - paddleRef.current.width / 2;
        paddleRef.current.x = Math.max(0, Math.min(CANVAS_WIDTH - paddleRef.current.width, targetX));
      }
    };

    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('touchstart', handleTouch, { passive: false });
      canvas.addEventListener('touchmove', handleTouch, { passive: false });
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mousedown', handleMouseDown);
    }
    
    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
      if (canvas) {
        canvas.removeEventListener('touchstart', handleTouch);
        canvas.removeEventListener('touchmove', handleTouch);
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mousedown', handleMouseDown);
      }
    };
  }, [isPaused]);

  const spawnGnome = (x: number, y: number, type: 'GNOME' | 'DEVIL') => {
    const id = Math.random().toString(36).substr(2, 9);
    gnomesRef.current.push({
      id, x, y,
      vx: (Math.random() - 0.5) * 8,
      vy: type === 'GNOME' ? 3 : 5,
      type, state: 'falling', timer: 0, bounceCount: 0, laughTimer: 0, rotation: 0,
      effectType: type === 'GNOME' ? 'shield' : 'reverse'
    });
  };

  const update = () => {
    if (isPaused) return;

    const p = paddleRef.current;
    const e = effectStateRef.current;
    
    let targetWidth = PADDLE_WIDTH;
    if (e.shrink > 0) targetWidth = PADDLE_WIDTH * 0.6;
    if (e.grow > 0) targetWidth = PADDLE_WIDTH * 1.6;
    p.width = targetWidth;

    const isReversed = e.reverse > 0;
    const paddleSpeed = 16;
    if (keysRef.current['ArrowLeft']) p.x -= isReversed ? -paddleSpeed : paddleSpeed;
    if (keysRef.current['ArrowRight']) p.x += isReversed ? -paddleSpeed : paddleSpeed;
    if (p.x < 0) p.x = 0;
    if (p.x + p.width > CANVAS_WIDTH) p.x = CANVAS_WIDTH - p.width;

    const b = ballRef.current;
    if (ballCaughtRef.current) {
        b.x = p.x + p.width / 2;
        b.y = p.y - b.radius - 2;
        b.dx = 0; b.dy = -INITIAL_BALL_SPEED;
    } else {
        b.x += b.dx;
        b.y += b.dy;
        const baseSpeed = e.speedup > 0 ? INITIAL_BALL_SPEED * 1.8 : INITIAL_BALL_SPEED;
        const currentSpeed = Math.sqrt(b.dx * b.dx + b.dy * b.dy);
        if (Math.abs(currentSpeed - baseSpeed) > 0.1) {
            const ratio = baseSpeed / currentSpeed;
            b.dx *= ratio; b.dy *= ratio;
        }
    }

    if (b.x - b.radius < 0) { b.dx = Math.abs(b.dx); b.x = b.radius; }
    if (b.x + b.radius > CANVAS_WIDTH) { b.dx = -Math.abs(b.dx); b.x = CANVAS_WIDTH - b.radius; }
    if (b.y - b.radius < 0) { b.dy = Math.abs(b.dy); b.y = b.radius; }
    
    if (b.y + b.radius > CANVAS_HEIGHT) {
      if (e.shield > 0) {
          e.shield = 0; b.dy = -Math.abs(b.dy); b.y = CANVAS_HEIGHT - b.radius - 1;
          addPopup(b.x, CANVAS_HEIGHT - 40, "SHIELD ACTIVATED!", "", "#3b82f6");
      } else {
          setLives(l => {
            if (l <= 1) { onGameOver(score, "The Gnomes have reclaimed the arcade. Better luck next time!"); return 0; }
            return l - 1;
          });
          setCombo(0);
          setIsPaused(true);
          b.x = p.x + p.width / 2; b.y = p.y - 30; b.dy = -Math.abs(b.dy); b.dx = (Math.random() - 0.5) * 6;
      }
    }

    // Improved Paddle Collision with resolution
    if (!ballCaughtRef.current && b.y + b.radius > p.y && b.y - b.radius < p.y + p.height && b.x > p.x && b.x < p.x + p.width) {
      if (e.magnet > 0) {
          ballCaughtRef.current = true;
      } else {
          b.dy = -Math.abs(b.dy);
          b.y = p.y - b.radius; // Push out
          const hitSpot = (b.x - (p.x + p.width / 2)) / (p.width / 2);
          b.dx = hitSpot * (INITIAL_BALL_SPEED * 1.8); 
      }
    }

    // Improved Brick Collision with resolution (fixing the sticking/entering glitch)
    bricksRef.current.forEach(brick => {
      if (!brick.active) return;
      
      const ballLeft = b.x - b.radius;
      const ballRight = b.x + b.radius;
      const ballTop = b.y - b.radius;
      const ballBottom = b.y + b.radius;

      if (ballRight > brick.x && ballLeft < brick.x + brick.width &&
          ballBottom > brick.y && ballTop < brick.y + brick.height) {
        
        // Find which side was hit by comparing overlap distances
        const overlapLeft = ballRight - brick.x;
        const overlapRight = (brick.x + brick.width) - ballLeft;
        const overlapTop = ballBottom - brick.y;
        const overlapBottom = (brick.y + brick.height) - ballTop;

        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        if (minOverlap === overlapLeft) {
          b.dx = -Math.abs(b.dx);
          b.x = brick.x - b.radius;
        } else if (minOverlap === overlapRight) {
          b.dx = Math.abs(b.dx);
          b.x = brick.x + brick.width + b.radius;
        } else if (minOverlap === overlapTop) {
          b.dy = -Math.abs(b.dy);
          b.y = brick.y - b.radius;
        } else if (minOverlap === overlapBottom) {
          b.dy = Math.abs(b.dy);
          b.y = brick.y + brick.height + b.radius;
        }

        const item = FULL_VOCAB_POOL.find(v => v.id === brick.id)!;
        if (brick.isTarget) {
          brick.active = false;
          setScore(s => s + 100 + combo * 50);
          setCombo(c => c + 1);
          setLearningLog(`LEARNED: ${item.word} - ${item.meaning}`);
          addPopup(brick.x + brick.width/2, brick.y, `+${100 + combo * 50}`, "", "#10b981");
          spawnGnome(brick.x + brick.width / 2 - 20, brick.y, 'GNOME');
          refreshTarget();
        } else {
          setScore(s => Math.max(0, s - 50));
          setCombo(0);
          setLearningLog(`MISTAKE: ${item.word} is NOT the target.`);
          addPopup(brick.x + brick.width/2, brick.y, `WRONG!`, "", "#ef4444");
          wrongHitCounterRef.current++;
          if (wrongHitCounterRef.current >= 3) {
            spawnGnome(brick.x + brick.width / 2 - 20, brick.y, 'DEVIL');
            wrongHitCounterRef.current = 0;
          }
        }
      }
    });

    if (bricksRef.current.filter(b => b.active).length === 0) {
      setLevel(l => l + 1);
      initLevel();
    }

    gnomesRef.current.forEach((g, idx) => {
      if (g.state === 'bursting') {
        g.timer--; if (g.timer <= 0) gnomesRef.current.splice(idx, 1);
        return;
      }
      g.y += g.vy; g.x += g.vx; g.rotation += g.vx * 0.08;
      if (g.x < 0 || g.x > CANVAS_WIDTH - 50) g.vx *= -1;
      
      const gw = 50, gh = 70;
      if (b.x + b.radius > g.x && b.x - b.radius < g.x + gw && b.y + b.radius > g.y && b.y - b.radius < g.y + gh) {
          g.state = 'bursting'; g.timer = 20; setScore(s => s + 250); b.dy *= -1;
      }
      if (g.y + gh > p.y && g.y < p.y + p.height && g.x + gw > p.x && g.x < p.x + p.width) {
        if (g.type === 'GNOME') { (e as any).shield = 600; g.state='bursting'; g.timer=10; }
        else { (e as any).reverse = 400; g.state='bursting'; g.timer=10; }
      }
      if (g.y > CANVAS_HEIGHT) gnomesRef.current.splice(idx, 1);
    });

    popupsRef.current.forEach((pop, idx) => {
      pop.timer--; pop.y -= 1.5;
      if (pop.timer <= 0) popupsRef.current.splice(idx, 1);
    });

    Object.keys(e).forEach(k => { if ((e as any)[k] > 0) (e as any)[k]--; });
  };

  const drawGnomeSprite = (ctx: CanvasRenderingContext2D, g: Gnome) => {
    ctx.save(); ctx.translate(g.x + 25, g.y + 35); ctx.rotate(g.rotation);
    const isDevil = g.type === 'DEVIL';
    ctx.fillStyle = isDevil ? '#6b21a8' : '#dc2626';
    ctx.beginPath(); ctx.moveTo(0, -50); ctx.lineTo(30, 0); ctx.lineTo(-30, 0); ctx.fill();
    ctx.fillStyle = isDevil ? '#ec4899' : '#fbcfe8';
    ctx.beginPath(); ctx.arc(0, 15, 20, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  };

  useEffect(() => {
    let animationFrameId: number;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const render = () => {
      update();
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.strokeStyle = '#111'; ctx.lineWidth = 1;
      for(let i=0; i<CANVAS_WIDTH; i+=40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_HEIGHT); ctx.stroke(); }
      for(let i=0; i<CANVAS_HEIGHT; i+=40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(CANVAS_WIDTH, i); ctx.stroke(); }

      bricksRef.current.forEach(brick => {
        if (!brick.active) return;
        ctx.fillStyle = '#18181b'; 
        ctx.strokeStyle = '#27272a'; ctx.lineWidth = 4;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
        ctx.fillStyle = '#e4e4e7'; 
        ctx.font = 'bold 15px "Press Start 2P"';
        ctx.textAlign = 'center';
        const text = brick.content.length > 12 ? brick.content.substring(0, 9) + ".." : brick.content;
        ctx.fillText(text, brick.x + brick.width / 2, brick.y + brick.height / 2 + 8);
      });

      const p = paddleRef.current;
      ctx.fillStyle = '#ea580c'; ctx.fillRect(p.x, p.y, p.width, p.height);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(p.x, p.y, p.width, p.height);
      
      const b = ballRef.current;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
      ctx.strokeStyle = '#000'; ctx.stroke();

      gnomesRef.current.forEach(g => { if (g.state !== 'bursting') drawGnomeSprite(ctx, g); });

      popupsRef.current.forEach(pop => {
        ctx.save(); ctx.globalAlpha = pop.timer / 40;
        ctx.fillStyle = pop.color; ctx.font = '16px "Press Start 2P"'; ctx.textAlign = 'center';
        ctx.fillText(pop.text, pop.x, pop.y);
        ctx.restore();
      });

      if (isPaused) {
        ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(0,0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#fbbf24'; ctx.font = '42px "Press Start 2P"'; ctx.textAlign = 'center';
        ctx.fillText('GNOME SMASH', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
        ctx.fillStyle = '#fff'; ctx.font = '14px "Press Start 2P"';
        ctx.fillText('USE MOUSE OR ARROWS TO MOVE', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
        ctx.fillText('PRESS SPACE OR CLICK TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
        ctx.fillStyle = '#666'; ctx.font = '10px "Press Start 2P"';
        ctx.fillText('CREATED BY SHALAKA KASHIKAR', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
      }

      animationFrameId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused]);

  return (
    <div className="flex flex-col h-full w-full bg-black min-h-0 relative">
      <div className="w-full bg-zinc-900 px-6 py-3 flex justify-between items-center border-b-2 border-zinc-800 shrink-0">
        <div className="flex flex-col gap-1 min-w-[150px]">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 text-[10px] font-bold">SCORE:</span>
            <span className="text-yellow-400 text-[14px] font-black">{score.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 text-[10px] font-bold">LIVES:</span>
            <span className="text-red-500 text-[12px]">{lives > 0 ? Array(lives).fill('♥').join(' ') : '☠'}</span>
          </div>
        </div>
        
        <div className="flex-1 flex justify-center">
          <div className="bg-black border-2 border-blue-900 px-8 py-3 rounded shadow-2xl text-center min-w-[420px]">
            <span className="text-blue-500 text-[9px] font-black block mb-1 uppercase tracking-widest">MISSION_TARGET</span>
            <span className="text-white text-[12px] sm:text-[14px] font-black uppercase tracking-tight leading-tight">{targetInfo}</span>
          </div>
        </div>

        <div className="min-w-[150px] text-right">
           <span className="text-zinc-600 text-[10px] font-mono block">TERMINAL_01</span>
           <span className="text-zinc-400 text-[12px] font-bold">LEVEL_{level.toString().padStart(2, '0')}</span>
        </div>
      </div>
      
      <div className="flex-1 relative w-full h-full flex items-center justify-center overflow-hidden bg-[#0a0a0a] p-2 sm:p-4">
        <div className="relative shadow-[0_0_100px_rgba(30,58,138,0.2)] border-2 border-zinc-800 rounded-sm overflow-hidden" style={{ aspectRatio: '16/9', maxHeight: '100%', maxWidth: '100%', width: 'auto', height: 'auto' }}>
            <canvas 
              ref={canvasRef} 
              width={CANVAS_WIDTH} 
              height={CANVAS_HEIGHT} 
              className="w-full h-full object-contain touch-none cursor-default bg-black" 
            />
        </div>
      </div>

      <div className="w-full bg-zinc-900 h-14 flex items-center justify-center border-t-2 border-zinc-800 shrink-0">
        <div className="text-[12px] sm:text-[18px] text-emerald-400 font-mono tracking-tight text-center uppercase font-bold px-6 truncate max-w-4xl">
          {learningLog}
        </div>
      </div>
    </div>
  );
}
