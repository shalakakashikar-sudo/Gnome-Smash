
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  GameMode, 
  Brick, 
  Ball, 
  Paddle, 
  Gnome,
  LearningPopup,
  VocabItem
} from '../types';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  PADDLE_WIDTH, 
  PADDLE_HEIGHT, 
  BALL_RADIUS, 
  INITIAL_BALL_SPEED, 
  FULL_VOCAB_POOL 
} from '../constants';

interface GameEngineProps {
  mode: GameMode;
  onGameOver: (score: number, takeaway: string) => void;
}

const GameEngine: React.FC<GameEngineProps> = ({ mode, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [targetInfo, setTargetInfo] = useState<string>('');
  const [learningLog, setLearningLog] = useState<string>('READY TO SMASH? WATCH THE PROMPT ABOVE!');
  const [combo, setCombo] = useState(0);
  const [isPaused, setIsPaused] = useState(true);

  const paddleRef = useRef<Paddle>({
    x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
    y: CANVAS_HEIGHT - 40,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT
  });

  const ballRef = useRef<Ball>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 60,
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
        setTargetInfo(`FIND ANTONYM OF: "${antonym.toUpperCase()}"`);
      } else {
        const synonym = vocabItem.synonyms[Math.floor(Math.random() * vocabItem.synonyms.length)];
        setTargetInfo(`FIND SYNONYM OF: "${synonym.toUpperCase()}"`);
      }
      bricksRef.current.forEach(b => { b.isTarget = b.id === targetBrick.id; });
      return true;
    }
    return false;
  }, []);

  const initLevel = useCallback(() => {
    const cols = 5;
    const rows = 3; 
    const bWidth = (CANVAS_WIDTH - 200) / cols;
    const bHeight = 45;
    const padding = 20;
    const offX = (CANVAS_WIDTH - (cols * bWidth + (cols - 1) * padding)) / 2;
    const offY = 100;

    const pool = [...FULL_VOCAB_POOL].sort(() => Math.random() - 0.5);
    const items = pool.slice(0, Math.min(cols * rows, pool.length));

    bricksRef.current = items.map((item, i) => ({
      id: item.id,
      x: offX + (i % cols) * (bWidth + padding),
      y: offY + Math.floor(i / cols) * (bHeight + padding),
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
      y: CANVAS_HEIGHT - 60,
      dx: (Math.random() - 0.5) * 4,
      dy: -INITIAL_BALL_SPEED,
      radius: BALL_RADIUS
    };
    paddleRef.current.x = CANVAS_WIDTH / 2 - paddleRef.current.width / 2;
    paddleRef.current.width = PADDLE_WIDTH;
    Object.keys(effectStateRef.current).forEach(k => (effectStateRef.current as any)[k] = 0);
    ballCaughtRef.current = false;
    popupsRef.current = [];
    setLearningLog('A NEW CHALLENGE APPEARS!');
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
    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
    };
  }, [isPaused]);

  const spawnGnome = (x: number, y: number, type: 'GNOME' | 'DEVIL') => {
    const id = Math.random().toString(36).substr(2, 9);
    const gnomeEffects: any[] = ['magnet', 'shield', 'grow'];
    const devilEffects: any[] = ['reverse', 'shrink', 'speedup'];
    gnomesRef.current.push({
      id, x, y,
      vx: (Math.random() - 0.5) * 6,
      vy: type === 'GNOME' ? 2 : 4,
      type, state: 'falling', timer: 0, bounceCount: 0, laughTimer: 0, rotation: 0,
      effectType: type === 'GNOME' ? gnomeEffects[Math.floor(Math.random() * gnomeEffects.length)] : devilEffects[Math.floor(Math.random() * devilEffects.length)]
    });
  };

  const update = () => {
    if (isPaused) return;

    const p = paddleRef.current;
    const e = effectStateRef.current;
    
    let targetWidth = PADDLE_WIDTH;
    if (e.shrink > 0) targetWidth = PADDLE_WIDTH * 0.5;
    if (e.grow > 0) targetWidth = PADDLE_WIDTH * 1.8;
    p.width = targetWidth;

    const isReversed = e.reverse > 0;
    const paddleSpeed = 10;
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

    if (b.x - b.radius < 0 || b.x + b.radius > CANVAS_WIDTH) {
      b.dx *= -1;
      b.x = b.x < CANVAS_WIDTH / 2 ? b.radius : CANVAS_WIDTH - b.radius;
    }
    if (b.y - b.radius < 0) { b.dy *= -1; b.y = b.radius; }
    
    if (b.y + b.radius > CANVAS_HEIGHT) {
      if (e.shield > 0) {
          e.shield = 0; b.dy = -Math.abs(b.dy);
          addPopup(b.x, CANVAS_HEIGHT - 30, "BLOCK!", "", "#60a5fa");
      } else {
          setLives(l => {
            if (l <= 1) { onGameOver(score, "The Gnomes claimed victory today! Keep studying."); return 0; }
            return l - 1;
          });
          setCombo(0);
          setIsPaused(true);
          b.x = p.x + p.width / 2; b.y = p.y - 20; b.dy = -Math.abs(b.dy); b.dx = (Math.random() - 0.5) * 4;
      }
    }

    if (!ballCaughtRef.current && b.y + b.radius > p.y && b.y - b.radius < p.y + p.height && b.x > p.x && b.x < p.x + p.width) {
      if (e.magnet > 0) ballCaughtRef.current = true;
      else {
          b.dy = -Math.abs(b.dy);
          const hitSpot = (b.x - (p.x + p.width / 2)) / (p.width / 2);
          b.dx = hitSpot * (INITIAL_BALL_SPEED * 1.5); 
      }
    }

    bricksRef.current.forEach(brick => {
      if (!brick.active) return;
      if (b.x + b.radius > brick.x && b.x - b.radius < brick.x + brick.width &&
          b.y + b.radius > brick.y && b.y - b.radius < brick.y + brick.height) {
        
        const overlapX = Math.min(b.x + b.radius - brick.x, brick.x + brick.width - (b.x - b.radius));
        const overlapY = Math.min(b.y + b.radius - brick.y, brick.y + brick.height - (b.y - b.radius));
        if (overlapX < overlapY) b.dx *= -1; else b.dy *= -1;

        const item = FULL_VOCAB_POOL.find(v => v.id === brick.id)!;
        if (brick.isTarget) {
          brick.active = false;
          setScore(s => s + 100 + combo * 25);
          setCombo(c => c + 1);
          wrongHitCounterRef.current = 0;
          setLearningLog(`EXCELLENT! ${item.word}: ${item.meaning}`);
          addPopup(brick.x + brick.width/2, brick.y, `GREAT!`, item.word, "#4ade80");
          spawnGnome(brick.x + brick.width / 2 - 15, brick.y, 'GNOME');
          refreshTarget();
        } else {
          setScore(s => Math.max(0, s - 20));
          setCombo(0);
          wrongHitCounterRef.current += 1;
          setLearningLog(`OOPS! ${item.word} means ${item.meaning}`);
          addPopup(brick.x + brick.width/2, brick.y, `STAY FOCUSED`, "WRONG BRICK", "#f87171");
          gnomesRef.current.forEach(g => { if (g.type === 'GNOME') g.laughTimer = 100; });
          if (wrongHitCounterRef.current >= 3) {
            spawnGnome(brick.x + brick.width / 2 - 15, brick.y, 'DEVIL');
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
      g.y += g.vy; g.x += g.vx; g.rotation += g.vx * 0.05;
      if (g.x < 0 || g.x > CANVAS_WIDTH - 40) g.vx *= -1;
      
      const gw = 40, gh = 60;
      if (b.x + b.radius > g.x && b.x - b.radius < g.x + gw && b.y + b.radius > g.y && b.y - b.radius < g.y + gh) {
        if (g.type === 'DEVIL') {
          g.state = 'bursting'; g.timer = 20; setScore(s => s + 500); b.dy *= -1;
          addPopup(g.x, g.y, "POOF!", "+500", "#f87171");
        } else { b.dy *= -1; g.vy -= 4; g.vx += (Math.random()-0.5)*10; g.laughTimer = 60; }
      }
      
      if (g.y + gh > p.y && g.y < p.y + p.height && g.x + gw > p.x && g.x < p.x + p.width) {
        if (g.type === 'GNOME') {
          g.vy = -Math.abs(g.vy) - 1.2; g.bounceCount += 1;
          setScore(s => s + 100 * g.bounceCount); g.state = 'bouncing';
          if (g.bounceCount >= 3) {
            g.state = 'bursting'; g.timer = 40;
            if (g.effectType) { 
                (e as any)[g.effectType] = 600; 
                addPopup(g.x, g.y, "MAGIC!", g.effectType.toUpperCase(), "#4ade80"); 
            }
          }
        } else {
          if (g.state !== 'on_paddle' && g.state !== 'bursting') {
            g.state = 'on_paddle'; g.timer = 300;
            if (g.effectType) { 
                (e as any)[g.effectType] = 300; 
                addPopup(g.x, g.y, "CURSED!", g.effectType.toUpperCase(), "#f87171"); 
            }
          }
        }
      }
      if (g.y > CANVAS_HEIGHT) gnomesRef.current.splice(idx, 1);
      if (g.state === 'on_paddle') {
        g.x = p.x + p.width / 2 - 20; g.y = p.y - 60; g.timer--; g.rotation = 0;
        if (g.timer <= 0) { g.state = 'bursting'; g.timer = 15; if (g.effectType) (e as any)[g.effectType] = 0; }
      }
      if (g.laughTimer > 0) g.laughTimer--;
    });

    popupsRef.current.forEach((pop, idx) => {
      pop.timer--; pop.y -= 1.2;
      if (pop.timer <= 0) popupsRef.current.splice(idx, 1);
    });

    Object.keys(e).forEach(k => { if ((e as any)[k] > 0) (e as any)[k]--; });
  };

  const drawGnomeSprite = (ctx: CanvasRenderingContext2D, g: Gnome) => {
    ctx.save();
    ctx.translate(g.x + 20, g.y + 30);
    ctx.rotate(g.rotation);
    
    // Squash and stretch based on velocity
    const speed = Math.sqrt(g.vx * g.vx + g.vy * g.vy);
    const stretch = 1 + speed * 0.02;
    const squash = 1 / stretch;
    ctx.scale(0.8 * squash, 0.8 * stretch);

    const isDevil = g.type === 'DEVIL';
    const isLaughing = g.laughTimer > 0;
    const isBlinking = (Math.floor(Date.now() / 200) % 20 === 0);

    // 1. Hat
    const hatColor = isDevil ? '#4a148c' : '#b71c1c';
    const hatTrim = isDevil ? '#7b1fa2' : '#e53935';
    ctx.fillStyle = hatColor;
    ctx.beginPath();
    ctx.moveTo(0, -50);
    ctx.quadraticCurveTo(30, -10, 35, 0);
    ctx.lineTo(-35, 0);
    ctx.quadraticCurveTo(-30, -10, 0, -50);
    ctx.fill();
    
    // Hat trim
    ctx.fillStyle = hatTrim;
    ctx.beginPath();
    ctx.ellipse(0, 0, 35, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Face
    const skinColor = isDevil ? '#ad1457' : '#ffccbc';
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(0, 15, 22, 0, Math.PI * 2);
    ctx.fill();

    // 3. Eyes
    const eyeXOffset = 8;
    const eyeY = 12;
    ctx.fillStyle = '#fff';
    if (!isBlinking) {
        ctx.beginPath(); ctx.arc(-eyeXOffset, eyeY, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(eyeXOffset, eyeY, 5, 0, Math.PI * 2); ctx.fill();
        
        ctx.fillStyle = isDevil ? '#000' : '#2196f3';
        const lookDirX = g.vx * 0.5;
        const lookDirY = (isLaughing ? -2 : 0);
        ctx.beginPath(); ctx.arc(-eyeXOffset + lookDirX, eyeY + lookDirY, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(eyeXOffset + lookDirX, eyeY + lookDirY, 2.5, 0, Math.PI * 2); ctx.fill();
    } else {
        ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-eyeXOffset - 4, eyeY); ctx.lineTo(-eyeXOffset + 4, eyeY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(eyeXOffset - 4, eyeY); ctx.lineTo(eyeXOffset + 4, eyeY); ctx.stroke();
    }

    // 4. Nose
    ctx.fillStyle = isDevil ? '#880e4f' : '#ffab91';
    ctx.beginPath(); ctx.arc(0, 20, 5, 0, Math.PI * 2); ctx.fill();

    // 5. Mouth
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
    if (isLaughing) {
        ctx.fillStyle = '#4a0000';
        ctx.beginPath(); ctx.ellipse(0, 28, 10, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ff5252';
        ctx.beginPath(); ctx.ellipse(0, 31, 5, 3, 0, 0, Math.PI); ctx.fill();
    } else {
        ctx.beginPath();
        if (isDevil) {
            ctx.moveTo(-8, 30); ctx.quadraticCurveTo(0, 22, 8, 30); // Smirk/Angry
        } else {
            ctx.moveTo(-8, 28); ctx.quadraticCurveTo(0, 32, 8, 28); // Small smile
        }
        ctx.stroke();
    }

    // 6. Beard
    const beardColor = isDevil ? '#424242' : '#fafafa';
    const beardSway = Math.sin(Date.now() / 150) * 3;
    ctx.fillStyle = beardColor;
    ctx.beginPath();
    ctx.moveTo(-20, 25);
    ctx.lineTo(20, 25);
    ctx.quadraticCurveTo(15, 45, 0 + beardSway, 65);
    ctx.quadraticCurveTo(-15, 45, -20, 25);
    ctx.fill();

    ctx.restore();
  };

  useEffect(() => {
    let animationFrameId: number;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const render = () => {
      update();
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#0a0d0a'; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Backdrop Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.02)'; ctx.lineWidth = 1;
      for(let i=0; i<CANVAS_WIDTH; i+=40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_HEIGHT); ctx.stroke(); }
      for(let i=0; i<CANVAS_HEIGHT; i+=40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(CANVAS_WIDTH, i); ctx.stroke(); }

      bricksRef.current.forEach(brick => {
        if (!brick.active) return;
        ctx.fillStyle = '#111827'; ctx.strokeStyle = '#312e81'; ctx.lineWidth = 2;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
        ctx.fillStyle = '#94a3b8'; ctx.font = '9px "Press Start 2P"'; ctx.textAlign = 'center';
        ctx.fillText(brick.content, brick.x + brick.width / 2, brick.y + brick.height / 2 + 4);
      });

      const p = paddleRef.current;
      const e = effectStateRef.current;
      ctx.fillStyle = e.reverse > 0 ? '#b91c1c' : (e.grow > 0 || e.magnet > 0 ? '#059669' : '#d97706');
      ctx.fillRect(p.x, p.y, p.width, p.height);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(p.x, p.y, p.width, p.height);
      
      if (e.shield > 0) { 
          ctx.fillStyle = 'rgba(59, 130, 246, 0.5)'; ctx.fillRect(0, CANVAS_HEIGHT - 6, CANVAS_WIDTH, 6); 
      }

      const b = ballRef.current;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2); 
      ctx.fillStyle = '#fff'; ctx.fill();
      ctx.shadowBlur = 10; ctx.shadowColor = '#fff';
      ctx.stroke(); ctx.shadowBlur = 0;

      gnomesRef.current.forEach(g => {
          if (g.state === 'bursting') {
              ctx.fillStyle = g.type === 'GNOME' ? '#4ade80' : '#f87171';
              ctx.beginPath(); ctx.arc(g.x + 20, g.y + 30, (40-g.timer)*2, 0, Math.PI*2); ctx.fill();
              return;
          }
          drawGnomeSprite(ctx, g);
      });

      popupsRef.current.forEach(pop => {
        ctx.save();
        ctx.globalAlpha = Math.min(1, pop.timer / 15);
        ctx.fillStyle = pop.color; ctx.font = '9px "Press Start 2P"'; ctx.textAlign = 'center';
        ctx.fillText(pop.text, pop.x, pop.y);
        ctx.restore();
      });

      if (isPaused) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0,0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#fff'; ctx.font = '24px "Press Start 2P"'; ctx.textAlign = 'center';
        ctx.fillText('GNOME SMASH', CANVAS_WIDTH / 2, 280);
        ctx.font = '10px "Press Start 2P"'; ctx.fillText('SPACE TO BEGIN', CANVAS_WIDTH / 2, 350);
        ctx.font = '8px "Press Start 2P"'; ctx.fillStyle = '#f59e0b';
        ctx.fillText('DESIGNED BY SHALAKA KASHIKAR', CANVAS_WIDTH / 2, 550);
      }

      animationFrameId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused]);

  return (
    <div className="flex flex-col items-center h-full w-full bg-black">
      <div className="w-full bg-zinc-900/80 p-4 flex justify-between items-center border-b-2 border-zinc-800 shadow-xl relative z-20 backdrop-blur-md">
        <div className="flex flex-col gap-2">
          <span className="text-yellow-500 text-[9px] sm:text-[10px] tracking-widest">PTS: {score.toString().padStart(6, '0')}</span>
          <span className="text-red-500 text-[9px] sm:text-[10px]">HP: {Array(lives).fill('❤').join('')}</span>
        </div>
        <div className="flex-1 text-center px-4">
          <div className="text-blue-400 font-bold mb-1 tracking-tight text-[10px] sm:text-xs bg-zinc-950/50 p-2 rounded-lg border border-zinc-800 uppercase">{targetInfo}</div>
          <div className="text-[7px] text-zinc-500 flex justify-center gap-4">
            {combo > 1 && <span className="text-yellow-500 animate-bounce">COMBO {combo}X</span>}
            <span>STG {level}</span>
          </div>
        </div>
        <div className="text-right text-zinc-700 text-[7px] uppercase font-bold tracking-[0.2em] hidden sm:block">
          S. KASHIKAR
        </div>
      </div>
      
      <div className="flex-1 relative cursor-none w-full h-full flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,_#111_0%,_#000_100%)]">
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="max-w-full max-h-full aspect-[4/3] border-x border-zinc-900" />
      </div>

      <div className="w-full bg-zinc-900 p-2 h-10 flex items-center justify-center border-t border-zinc-800">
        <div className="text-[9px] text-emerald-400 font-mono tracking-wide px-4 text-center">
          {learningLog}
        </div>
      </div>
    </div>
  );
};

export default GameEngine;
