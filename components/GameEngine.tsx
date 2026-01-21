
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  GameMode, 
  Brick, 
  Ball, 
  Paddle, 
  Gnome,
  LearningPopup,
  FloatingText,
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

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface TrailPoint {
  x: number;
  y: number;
  alpha: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
}

interface GameEngineProps {
  mode: GameMode;
  onGameOver: (score: number, takeaway: string) => void;
  onQuit: () => void;
}

export default function GameEngine({ mode, onGameOver, onQuit }: GameEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [targetInfo, setTargetInfo] = useState<string>('');
  const [learningLog, setLearningLog] = useState<string>('SYSTEM READY.');
  const [combo, setCombo] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [levelStarting, setLevelStarting] = useState(true);
  
  const [shake, setShake] = useState(0);
  const particlesRef = useRef<Particle[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const floatersRef = useRef<FloatingText[]>([]);
  const hitStopRef = useRef(0);

  const paddleRef = useRef<Paddle>({
    x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
    y: CANVAS_HEIGHT - 60,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT
  });

  const ballRef = useRef<Ball & { trail: TrailPoint[] }>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 100,
    dx: INITIAL_BALL_SPEED,
    dy: -INITIAL_BALL_SPEED,
    radius: BALL_RADIUS,
    trail: []
  });

  const bricksRef = useRef<Brick[]>([]);
  const gnomesRef = useRef<Gnome[]>([]);
  const popupsRef = useRef<LearningPopup[]>([]);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const effectStateRef = useRef<{ reverse: number; shield: number; magnet: number }>({ 
    reverse: 0, shield: 0, magnet: 0 
  });
  const ballCaughtRef = useRef<boolean>(false);
  const wrongHitCounterRef = useRef<number>(0);

  const activeBricksCount = bricksRef.current.filter(b => b.active).length;
  const totalBricksCount = bricksRef.current.length || 1;
  const levelProgress = 1 - (activeBricksCount / totalBricksCount);

  const addParticles = (x: number, y: number, color: string, count = 12) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1.0,
        color,
        size: Math.random() * 3 + 1
      });
    }
  };

  const addFloatingText = (x: number, y: number, text: string, color: string) => {
    floatersRef.current.push({
      id: Math.random().toString(),
      x, y, text, color, life: 1.0
    });
  };

  const addRipple = (x: number, y: number, maxRadius = 60) => {
    ripplesRef.current.push({ x, y, radius: 0, maxRadius, life: 0.8 });
  };

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
        setTargetInfo(`FIND ANTONYM OF: ${antonym.toUpperCase()}`);
      } else {
        const synonym = vocabItem.synonyms[Math.floor(Math.random() * vocabItem.synonyms.length)];
        setTargetInfo(`FIND SYNONYM OF: ${synonym.toUpperCase()}`);
      }
      bricksRef.current.forEach(b => { b.isTarget = b.id === targetBrick.id; });
      return true;
    }
    return false;
  }, []);

  const initLevel = useCallback(() => {
    setLevelStarting(true);
    
    // Layout parameters
    const paddingX = 40; 
    const paddingY = 30;
    const bHeight = 65;
    const offX = 80;
    const offY = 80;

    const pool = [...FULL_VOCAB_POOL].sort(() => Math.random() - 0.5);
    const items = pool.slice(0, 15);

    let currentX = offX;
    let currentY = offY;

    bricksRef.current = items.map((item) => {
      const isReinforced = Math.random() > 0.8;
      const calculatedWidth = (item.word.length * 12) + 40;

      if (currentX + calculatedWidth > CANVAS_WIDTH - offX) {
        currentX = offX;
        currentY += bHeight + paddingY;
      }

      const brick: Brick = {
        id: item.id,
        x: currentX,
        y: currentY,
        width: calculatedWidth,
        height: bHeight,
        active: true,
        content: item.word,
        isTarget: false,
        type: 'vocab',
        hits: isReinforced ? 2 : 1,
        maxHits: isReinforced ? 2 : 1
      };

      currentX += calculatedWidth + paddingX;
      return brick;
    });

    refreshTarget();
    setCombo(0);
    wrongHitCounterRef.current = 0;
    ballRef.current = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 100,
      dx: (Math.random() - 0.5) * 6,
      dy: -INITIAL_BALL_SPEED,
      radius: BALL_RADIUS,
      trail: []
    };
    paddleRef.current.x = CANVAS_WIDTH / 2 - paddleRef.current.width / 2;
    Object.keys(effectStateRef.current).forEach(k => (effectStateRef.current as any)[k] = 0);
    ballCaughtRef.current = false;
    gnomesRef.current = [];
    popupsRef.current = [];
    particlesRef.current = [];
    ripplesRef.current = [];
    floatersRef.current = [];
    setLearningLog('READY.');
    
    setTimeout(() => {
      setLevelStarting(false);
      setIsPaused(true);
    }, 1000);
  }, [refreshTarget]);

  useEffect(() => { initLevel(); }, [initLevel]);

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => { 
      keysRef.current[e.code] = true; 
      
      // Pause Toggles
      if(e.code === 'KeyP' || e.code === 'Escape') {
        if (!levelStarting) setIsPaused(prev => !prev);
      }

      // Space Bar Logic
      if(e.code === 'Space') {
        if (isPaused && !levelStarting) setIsPaused(false);
        else if (ballCaughtRef.current) ballCaughtRef.current = false;
      }

      // Restart Level
      if(e.code === 'KeyR') {
        initLevel();
      }

      // Quit Game
      if(e.code === 'KeyQ') {
        onQuit();
      }
    };
    
    const handleUp = (e: KeyboardEvent) => { keysRef.current[e.code] = false; };
    
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const mouseX = clientX - rect.left;
      const scaleX = CANVAS_WIDTH / rect.width;
      const targetX = mouseX * scaleX - paddleRef.current.width / 2;
      paddleRef.current.x = Math.max(0, Math.min(CANVAS_WIDTH - paddleRef.current.width, targetX));
      
      if ('touches' in e && e.cancelable) e.preventDefault();
    };

    const handleAction = () => {
      if (isPaused && !levelStarting) setIsPaused(false);
      else if (ballCaughtRef.current) ballCaughtRef.current = false;
    };

    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousemove', handleMove);
      canvas.addEventListener('touchmove', handleMove, { passive: false });
      canvas.addEventListener('mousedown', handleAction);
      canvas.addEventListener('touchstart', handleAction);
    }
    
    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMove);
        canvas.removeEventListener('touchmove', handleMove);
        canvas.removeEventListener('mousedown', handleAction);
        canvas.removeEventListener('touchstart', handleAction);
      }
    };
  }, [isPaused, levelStarting, initLevel, onQuit]);

  const update = () => {
    if (isPaused || levelStarting) return;
    if (hitStopRef.current > 0) { hitStopRef.current--; return; }

    const p = paddleRef.current;
    const e = effectStateRef.current;
    const b = ballRef.current;

    const isReversed = e.reverse > 0;
    const paddleSpeed = 16;
    
    // Support Arrow keys and A/D
    const moveLeft = keysRef.current['ArrowLeft'] || keysRef.current['KeyA'];
    const moveRight = keysRef.current['ArrowRight'] || keysRef.current['KeyD'];

    if (moveLeft) p.x -= isReversed ? -paddleSpeed : paddleSpeed;
    if (moveRight) p.x += isReversed ? -paddleSpeed : paddleSpeed;
    p.x = Math.max(0, Math.min(CANVAS_WIDTH - p.width, p.x));

    b.trail.push({ x: b.x, y: b.y, alpha: 0.6 });
    if (b.trail.length > 5) b.trail.shift();
    b.trail.forEach(t => t.alpha -= 0.1);

    if (ballCaughtRef.current) {
        b.x = p.x + p.width / 2;
        b.y = p.y - b.radius - 2;
        b.dx = 0; b.dy = -INITIAL_BALL_SPEED;
    } else {
        if (e.magnet > 0) {
            const centerX = p.x + p.width / 2;
            const diffX = centerX - b.x;
            b.dx += diffX * 0.05;
        }

        b.x += b.dx;
        b.y += b.dy;
        const baseSpeed = INITIAL_BALL_SPEED;
        const currentSpeed = Math.sqrt(b.dx * b.dx + b.dy * b.dy);
        if (Math.abs(currentSpeed - baseSpeed) > 0.1) {
            const ratio = baseSpeed / currentSpeed;
            b.dx *= ratio; b.dy *= ratio;
        }
    }

    if (b.x - b.radius < 0) { b.dx = Math.abs(b.dx); b.x = b.radius; setShake(2); }
    if (b.x + b.radius > CANVAS_WIDTH) { b.dx = -Math.abs(b.dx); b.x = CANVAS_WIDTH - b.radius; setShake(2); }
    if (b.y - b.radius < 0) { b.dy = Math.abs(b.dy); b.y = b.radius; setShake(2); }
    
    if (b.y + b.radius > CANVAS_HEIGHT) {
      if (e.shield > 0) {
          e.shield = 0; b.dy = -Math.abs(b.dy); b.y = CANVAS_HEIGHT - b.radius - 1;
          addPopup(b.x, CANVAS_HEIGHT - 40, "SHIELD SAVED", "", "#3b82f6");
          setShake(5);
      } else {
          setLives(l => {
            if (l <= 1) { onGameOver(score, "Session terminated. Consistent study patterns required."); return 0; }
            return l - 1;
          });
          setCombo(0);
          setIsPaused(true);
          b.x = p.x + p.width / 2; b.y = p.y - 30; b.dy = -Math.abs(b.dy); b.dx = (Math.random() - 0.5) * 6;
          setShake(8);
      }
    }

    if (!ballCaughtRef.current && b.y + b.radius > p.y && b.y - b.radius < p.y + p.height && b.x > p.x && b.x < p.x + p.width) {
      b.dy = -Math.abs(b.dy);
      b.y = p.y - b.radius;
      const hitSpot = (b.x - (p.x + p.width / 2)) / (p.width / 2);
      b.dx = hitSpot * (INITIAL_BALL_SPEED * 1.8); 
      setShake(2);
      addRipple(b.x, p.y, 40);
    }

    bricksRef.current.forEach(brick => {
      if (!brick.active) return;
      if (b.x + b.radius > brick.x && b.x - b.radius < brick.x + brick.width &&
          b.y + b.radius > brick.y && b.y - b.radius < brick.y + brick.height) {
        
        const overlapX = Math.min(b.x + b.radius - brick.x, brick.x + brick.width - (b.x - b.radius));
        const overlapY = Math.min(b.y + b.radius - brick.y, brick.y + brick.height - (b.y - b.radius));

        if (overlapX < overlapY) { b.dx *= -1; } else { b.dy *= -1; }

        const item = FULL_VOCAB_POOL.find(v => v.id === brick.id)!;
        if (brick.isTarget) {
          brick.hits--;
          if (brick.hits <= 0) {
            brick.active = false;
            hitStopRef.current = 2; 
            const gain = 100 + combo * 50;
            setScore(s => s + gain);
            setCombo(c => c + 1);
            setLearningLog(`GOT: ${item.word}`);
            addFloatingText(brick.x + brick.width/2, brick.y, `+${gain}`, "#34d399");
            addParticles(brick.x + brick.width/2, brick.y + brick.height/2, "#34d399");
            
            const rand = Math.random();
            const gType = rand > 0.9 ? 'SPEEDY' : (rand > 0.8 ? 'DEVIL' : 'GNOME');
            gnomesRef.current.push({
              id: Math.random().toString(), x: brick.x + brick.width / 2, y: brick.y - 10,
              vx: (Math.random() - 0.5) * 6, vy: -5,
              type: gType, state: 'falling', timer: 0, bounceCount: 0, laughTimer: 0, rotation: 0
            });
            setShake(3);
            refreshTarget();
          } else {
            addParticles(b.x, b.y, "#94a3b8", 5);
            setShake(2);
            addFloatingText(brick.x + brick.width/2, brick.y, `CRACK!`, "#94a3b8");
          }
        } else {
          setScore(s => Math.max(0, s - 25));
          setCombo(0);
          setLearningLog(`WRONG: ${item.word.toUpperCase()}`);
          addFloatingText(brick.x + brick.width/2, brick.y, `-25`, "#f87171");
          addParticles(brick.x + brick.width/2, brick.y + brick.height/2, "#ef4444");
          setShake(6);
          wrongHitCounterRef.current++;
          if (wrongHitCounterRef.current >= 2) {
            gnomesRef.current.push({
              id: Math.random().toString(), x: brick.x + brick.width / 2, y: brick.y,
              vx: (Math.random() - 0.5) * 6, vy: 5, type: 'DEVIL', state: 'falling', timer: 0, bounceCount: 0, laughTimer: 0, rotation: 0
            });
            wrongHitCounterRef.current = 0;
          }
        }
      }
    });

    if (bricksRef.current.filter(b => b.active).length === 0) { initLevel(); setLevel(l => l + 1); }

    gnomesRef.current.forEach((g, idx) => {
      if (g.state === 'bursting') { g.timer--; if (g.timer <= 0) gnomesRef.current.splice(idx, 1); return; }
      g.vy += 0.2;
      g.y += g.vy; g.x += g.vx; g.rotation += g.vx * 0.05;
      if (g.x < 0 || g.x > CANVAS_WIDTH - 50) g.vx *= -1;
      
      const gw = 50, gh = 70;
      if (b.x + b.radius > g.x && b.x - b.radius < g.x + gw && b.y + b.radius > g.y && b.y - b.radius < g.y + gh) {
          g.state = 'bursting'; g.timer = 15; setScore(s => s + 500); b.dy *= -1; setShake(4);
          addParticles(g.x + 25, g.y + 35, g.type === 'GNOME' ? '#ef4444' : (g.type === 'SPEEDY' ? '#3b82f6' : '#a855f7'), 15);
      }
      if (g.y + gh > p.y && g.y < p.y + p.height && g.x + gw > p.x && g.x < p.x + p.width) {
        if (g.type === 'GNOME') { e.shield = 600; addPopup(p.x + p.width/2, p.y - 40, "SHIELD", "", "#3b82f6"); } 
        else if (g.type === 'SPEEDY') { e.magnet = 400; addPopup(p.x + p.width/2, p.y - 40, "MAGNET", "", "#3b82f6"); }
        else { e.reverse = 400; addPopup(p.x + p.width/2, p.y - 40, "REVERSED", "", "#a855f7"); }
        g.state='bursting'; g.timer=10; setShake(5);
      }
      if (g.y > CANVAS_HEIGHT) gnomesRef.current.splice(idx, 1);
    });

    particlesRef.current.forEach((p, idx) => { p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life -= 0.02; if (p.life <= 0) particlesRef.current.splice(idx, 1); });
    ripplesRef.current.forEach((r, idx) => { r.radius += 2.5; r.life -= 0.04; if (r.life <= 0) ripplesRef.current.splice(idx, 1); });
    popupsRef.current.forEach((pop, idx) => { pop.timer--; pop.y -= 0.5; if (pop.timer <= 0) popupsRef.current.splice(idx, 1); });
    floatersRef.current.forEach((f, idx) => { f.y -= 1.2; f.life -= 0.02; if (f.life <= 0) floatersRef.current.splice(idx, 1); });

    Object.keys(e).forEach(k => { if ((e as any)[k] > 0) (e as any)[k]--; });
    if (shake > 0) setShake(s => s - 0.5);
  };

  const drawGnomeSprite = (ctx: CanvasRenderingContext2D, g: Gnome) => {
    ctx.save(); ctx.translate(g.x + 25, g.y + 35); ctx.rotate(g.rotation);
    const isDevil = g.type === 'DEVIL';
    const isSpeedy = g.type === 'SPEEDY';
    ctx.fillStyle = isDevil ? '#4c1d95' : (isSpeedy ? '#1e3a8a' : '#b91c1c');
    ctx.beginPath(); ctx.moveTo(0, -40); ctx.lineTo(20, 5); ctx.lineTo(-20, 5); ctx.fill();
    ctx.fillStyle = isDevil ? '#ec4899' : (isSpeedy ? '#60a5fa' : '#ffedd5');
    ctx.beginPath(); ctx.arc(0, 15, 16, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  };

  useEffect(() => {
    let animationFrameId: number;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const render = () => {
      update();
      ctx.save();
      if (shake > 0) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      const grad = ctx.createRadialGradient(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 0, CANVAS_WIDTH/2, CANVAS_HEIGHT/2, CANVAS_WIDTH);
      grad.addColorStop(0, '#0a0a14');
      grad.addColorStop(1, '#050508');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = '#1e1e24';
      for(let x=20; x<CANVAS_WIDTH; x+=80) {
        for(let y=20; y<CANVAS_HEIGHT; y+=80) { ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI*2); ctx.fill(); }
      }
      ripplesRef.current.forEach(r => {
        ctx.strokeStyle = `rgba(100, 200, 255, ${r.life * 0.5})`;
        ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(r.x, r.y, r.radius, 0, Math.PI*2); ctx.stroke();
      });
      bricksRef.current.forEach(brick => {
        if (!brick.active) return;
        
        const isReinforced = brick.maxHits > 1 && brick.hits > 1;
        ctx.fillStyle = isReinforced ? '#27272a' : '#1a1a20'; 
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        
        let strokeColor = brick.isTarget ? '#3b82f6' : '#2d2d35';
        if (brick.isTarget) {
            const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.01);
            ctx.shadowBlur = 10 * pulse;
            ctx.shadowColor = '#3b82f6';
        }

        ctx.strokeStyle = strokeColor; ctx.lineWidth = isReinforced ? 3 : 1.5; ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
        ctx.shadowBlur = 0;

        ctx.fillStyle = isReinforced ? '#94a3b8' : '#d1d5db'; ctx.font = 'bold 12px "Press Start 2P"'; ctx.textAlign = 'center';
        const text = brick.content;
        ctx.fillText(text, brick.x + brick.width / 2, brick.y + brick.height / 2 + 5);
      });
      particlesRef.current.forEach(p => { ctx.globalAlpha = p.life * 0.7; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); });
      ctx.globalAlpha = 1.0;
      ballRef.current.trail.forEach((t, i) => {
        ctx.beginPath(); ctx.arc(t.x, t.y, ballRef.current.radius * 0.8, 0, Math.PI*2);
        ctx.fillStyle = `rgba(200, 220, 255, ${t.alpha * 0.3})`; ctx.fill();
      });
      const p = paddleRef.current;
      const e = effectStateRef.current;
      const isRev = e.reverse > 0;
      ctx.fillStyle = isRev ? '#7e22ce' : '#1d4ed8';
      ctx.fillRect(p.x, p.y, p.width, p.height);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(p.x, p.y, p.width, p.height);
      if (isRev) { ctx.fillStyle = '#a855f7'; ctx.fillRect(p.x, p.y - 6, p.width * (e.reverse / 400), 2); }
      if (e.shield > 0) { ctx.fillStyle = '#3b82f6'; ctx.fillRect(p.x, p.y - 12, p.width * (e.shield / 600), 2); }
      if (e.magnet > 0) { ctx.fillStyle = '#60a5fa'; ctx.fillRect(p.x, p.y - 18, p.width * (e.magnet / 400), 2); }

      const b = ballRef.current;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
      gnomesRef.current.forEach(g => { if (g.state !== 'bursting') drawGnomeSprite(ctx, g); });
      popupsRef.current.forEach(pop => {
        ctx.save(); ctx.globalAlpha = pop.timer / 60; ctx.fillStyle = pop.color;
        ctx.font = '12px "Press Start 2P"'; ctx.textAlign = 'center';
        ctx.fillText(pop.text, pop.x, pop.y); ctx.restore();
      });

      floatersRef.current.forEach(f => {
        ctx.save(); ctx.globalAlpha = f.life; ctx.fillStyle = f.color;
        ctx.font = '10px "Press Start 2P"'; ctx.textAlign = 'center';
        ctx.fillText(f.text, f.x, f.y); ctx.restore();
      });

      if (levelStarting) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0,0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#fbbf24'; ctx.font = '32px "Press Start 2P"'; ctx.textAlign = 'center';
        ctx.fillText(`SECTOR ${level}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      } else if (isPaused) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0,0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#fbbf24'; ctx.font = '28px "Press Start 2P"'; ctx.textAlign = 'center';
        ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
        
        // Command Hints
        ctx.fillStyle = '#d1d5db'; ctx.font = '9px "Press Start 2P"';
        ctx.fillText('PRESS [P] TO RESUME', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
        ctx.fillText('PRESS [R] TO RESTART SECTOR', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
        ctx.fillText('PRESS [Q] TO QUIT TO MENU', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
      }
      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused, shake, levelStarting]);

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0a0c] min-h-0 relative select-none">
      {/* Responsive HUD */}
      <div className="w-full bg-[#121218] px-4 sm:px-8 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-center border-b border-zinc-800 shrink-0 gap-3 sm:gap-0">
        <div className="flex justify-between w-full sm:w-auto sm:gap-10">
          <div className="flex flex-col">
            <span className="text-zinc-600 text-[7px] sm:text-[8px] font-bold tracking-widest uppercase mb-1">SCORE</span>
            <div className="flex items-center gap-2">
              <span className="text-yellow-500 text-[16px] sm:text-[20px] font-black font-mono leading-none">{score.toLocaleString().padStart(6, '0')}</span>
              {combo > 1 && <span className="text-[9px] text-emerald-500 font-bold">x{combo}</span>}
            </div>
          </div>
          <div className="flex flex-col sm:ml-0 ml-4">
            <span className="text-zinc-600 text-[7px] sm:text-[8px] font-bold tracking-widest uppercase mb-1">HEALTH</span>
            <div className="flex gap-1 pt-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`w-2.5 h-3.5 sm:w-3 sm:h-4 rounded-sm ${i < lives ? 'bg-red-700' : 'bg-zinc-800'}`} />
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex-1 flex justify-center w-full sm:px-6 relative">
          <div className="bg-[#050508] border border-zinc-800 px-4 sm:px-8 py-2 sm:py-3 rounded text-center w-full max-w-lg relative overflow-hidden">
             <div className="absolute bottom-0 left-0 h-1 bg-blue-900/50 w-full" />
             <div className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-500" style={{ width: `${levelProgress * 100}%` }} />
             
             <span className="text-blue-500 text-[7px] sm:text-[8px] font-bold block mb-1 uppercase tracking-widest">OBJECTIVE</span>
             <span className="text-zinc-200 text-[11px] sm:text-[13px] font-bold uppercase tracking-tight block truncate">
                {targetInfo || "ANALYZING..."}
             </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col text-right">
               <span className="text-zinc-600 text-[8px] font-bold tracking-widest uppercase mb-1">SECTOR</span>
               <span className="text-zinc-400 text-[18px] font-black leading-none">{level.toString().padStart(2, '0')}</span>
            </div>
            <button 
                onClick={(e) => { e.stopPropagation(); setIsPaused(!isPaused); }}
                className="bg-zinc-800 hover:bg-zinc-700 text-[8px] font-bold px-3 py-2 rounded text-zinc-400 uppercase tracking-widest active:scale-95 transition-all"
            >
                {isPaused ? 'RESUME' : 'PAUSE'}
            </button>
        </div>
      </div>
      
      {/* Responsive Game Stage */}
      <div className="flex-1 relative w-full h-full flex items-center justify-center bg-black p-2 overflow-hidden">
        <div className="relative w-full h-full flex items-center justify-center">
            <canvas 
              ref={canvasRef} 
              width={CANVAS_WIDTH} 
              height={CANVAS_HEIGHT} 
              className="max-w-full max-h-full aspect-video object-contain touch-none cursor-default bg-zinc-950 shadow-2xl" 
            />
        </div>
      </div>

      {/* Footer Feed */}
      <div className="w-full bg-[#121218] h-10 sm:h-12 flex items-center px-6 sm:px-10 border-t border-zinc-800 shrink-0">
        <div className="text-[9px] sm:text-[11px] text-zinc-400 font-mono tracking-wider uppercase truncate">
          <span className="opacity-40 mr-2">LOG:</span> {learningLog} | [P] PAUSE | [R] RESTART | [Q] QUIT
        </div>
      </div>
    </div>
  );
}
