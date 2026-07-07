import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, RotateCcw, Volume2, VolumeX, Gamepad2, Trophy, HelpCircle } from 'lucide-react';

// --- Types & Interfaces ---
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'yellow' | 'pink' | 'cyan';
  points: number;
  alive: boolean;
  startX: number;
  startY: number;
  // Diving state for Galaga-style patterns
  isDiving: boolean;
  diveAngle: number;
  diveSpeed: number;
  divePhase: number; // 0: dive down curve, 1: homing to player, 2: returning to grid
  diveX: number;
  diveY: number;
  gridXIndex: number;
  gridYIndex: number;
}

interface Bullet {
  x: number;
  y: number;
  width: number;
  height: number;
  vy: number;
  fromPlayer: boolean;
  color: string;
}

interface Star {
  x: number;
  y: number;
  speed: number;
  size: number;
}

interface AudioWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

const HIGH_SCORE_KEY = 'galaga_high_score';

function readStoredHighScore() {
  try {
    const saved = localStorage.getItem(HIGH_SCORE_KEY);
    if (!saved) return 1000;
    const parsed = Number.parseInt(saved, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1000;
  } catch {
    return 1000;
  }
}


export default function GalagaView() {
  const navigate = useNavigate();

  // --- States ---
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'CLEAR'>('START');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(readStoredHighScore);
  const [lives, setLives] = useState(3);
  const [stage, setStage] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // --- Refs for Canvas & Game Loop ---
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const audioContextRef = useRef<AudioContext | null>(null);

  // --- Audio Player ---
  const playSound = (type: 'shoot' | 'explosion' | 'hit' | 'start') => {
    if (isMuted) return;
    try {
      let ctx = audioContextRef.current;
      if (!ctx || ctx.state === 'closed') {
        const AudioContextClass = window.AudioContext || (window as AudioWindow).webkitAudioContext;
        if (!AudioContextClass) return;
        ctx = new AudioContextClass();
        audioContextRef.current = ctx;
      }
      if (ctx.state === 'suspended') void ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'shoot') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === 'explosion') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(130, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(10, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'hit') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(700, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.06);
        osc.start();
        osc.stop(ctx.currentTime + 0.06);
      } else if (type === 'start') {
        const playNote = (freq: number, start: number, duration: number) => {
          const noteOsc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          noteOsc.connect(noteGain);
          noteGain.connect(ctx.destination);
          noteOsc.frequency.setValueAtTime(freq, ctx.currentTime + start);
          noteGain.gain.setValueAtTime(0.05, ctx.currentTime + start);
          noteGain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + start + duration);
          noteOsc.start(ctx.currentTime + start);
          noteOsc.stop(ctx.currentTime + start + duration);
        };
        // Simple retro arpeggio
        playNote(261.63, 0, 0.08); // C4
        playNote(329.63, 0.08, 0.08); // E4
        playNote(392.00, 0.16, 0.08); // G4
        playNote(523.25, 0.24, 0.15); // C5
      }
    } catch (e) {
      console.error('AudioContext error:', e);
    }
  };

  useEffect(() => {
    return () => {
      const ctx = audioContextRef.current;
      if (ctx && ctx.state !== 'closed') void ctx.close();
    };
  }, []);

  // --- Game State References for Loop ---
  const stateRef = useRef({
    playerX: 220,
    playerY: 480,
    playerWidth: 32,
    playerHeight: 32,
    playerInvulnerableUntil: 0,
    bullets: [] as Bullet[],
    enemies: [] as Enemy[],
    particles: [] as Particle[],
    stars: [] as Star[],
    lastShotTime: 0,
    gridDirection: 1, // 1 for right, -1 for left
    gridOffset: 0,
    gridOffsetMax: 40,
    gridStep: 0.5,
    frameCount: 0,
    nextDiveTime: 120, // Frames until next enemy dive
  });

  // --- Initialize Starfield ---
  useEffect(() => {
    const stars: Star[] = [];
    for (let i = 0; i < 50; i++) {
      stars.push({
        x: Math.random() * 480,
        y: Math.random() * 540,
        speed: 0.5 + Math.random() * 1.5,
        size: 1 + Math.random() * 2,
      });
    }
    stateRef.current.stars = stars;
  }, []);

  // --- Handle Keyboard Input ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyP' || e.code === 'Escape') {
        e.preventDefault();
        setGameState((prev) => (prev === 'PLAYING' ? 'PAUSED' : prev === 'PAUSED' ? 'PLAYING' : prev));
        return;
      }

      keysRef.current[e.code] = true;
      // Prevent scrolling with Space & Arrow keys when inside the game view
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (gameState === 'PLAYING') return;
    keysRef.current['ArrowLeft'] = false;
    keysRef.current['ArrowRight'] = false;
    keysRef.current['Space'] = false;
    keysRef.current['KeyA'] = false;
    keysRef.current['KeyD'] = false;
    keysRef.current['KeyK'] = false;
  }, [gameState]);

  // --- Set High Score ---
  const updateHighScore = (newScore: number) => {
    if (newScore > highScore) {
      setHighScore(newScore);
      try {
        localStorage.setItem(HIGH_SCORE_KEY, newScore.toString());
      } catch {
        // Ignore storage failures: the in-memory high score still updates for the session.
      }
    }
  };

  // --- Initialize Stage ---
  const initStage = (currentStage: number, resetScore = false) => {
    const r = stateRef.current;
    r.playerX = 220;
    r.bullets = [];
    r.particles = [];
    r.frameCount = 0;
    r.nextDiveTime = 180;
    r.gridOffset = 0;
    r.gridDirection = 1;
    r.playerInvulnerableUntil = 0;

    if (resetScore) {
      setScore(0);
      setLives(3);
      setStage(1);
    }

    // Grid creation for enemies (3 rows, 8 columns)
    const enemies: Enemy[] = [];
    const rows: Array<'yellow' | 'pink' | 'cyan'> = ['yellow', 'pink', 'cyan'];
    const rowPoints = { yellow: 150, pink: 100, cyan: 50 };

    for (let rowIndex = 0; rowIndex < 3; rowIndex++) {
      const type = rows[rowIndex];
      const points = rowPoints[type];
      for (let colIndex = 0; colIndex < 8; colIndex++) {
        // Space out grid
        const startX = 60 + colIndex * 45;
        const startY = 60 + rowIndex * 40;
        enemies.push({
          x: startX,
          y: startY,
          startX,
          startY,
          width: 28,
          height: 24,
          type,
          points,
          alive: true,
          isDiving: false,
          diveAngle: 0,
          diveSpeed: 2 + currentStage * 0.3,
          divePhase: 0,
          diveX: 0,
          diveY: 0,
          gridXIndex: colIndex,
          gridYIndex: rowIndex,
        });
      }
    }
    r.enemies = enemies;
    playSound('start');
  };

  // --- Start / Restart Handlers ---
  const startGame = () => {
    initStage(1, true);
    setGameState('PLAYING');
  };

  const restartGame = () => {
    initStage(1, true);
    setGameState('PLAYING');
  };

  // --- Particle Spawner ---
  const createExplosion = (x: number, y: number, color: string, count = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      const maxLife = 20 + Math.random() * 20;
      stateRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 2 + Math.random() * 2,
        life: maxLife,
        maxLife,
      });
    }
  };

  // --- Game Loop (Main Logic & Draw) ---
  useEffect(() => {
    if (gameState !== 'PLAYING') {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = () => {
      const r = stateRef.current;
      r.frameCount++;

      // 1. Clear Screen
      ctx.fillStyle = '#0a0a16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Stars Update & Draw
      ctx.fillStyle = '#ffffff';
      r.stars.forEach((star) => {
        star.y += star.speed;
        if (star.y > canvas.height) {
          star.y = 0;
          star.x = Math.random() * canvas.width;
        }
        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + (star.speed / 2) * 0.7})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      });

      // 3. Player Movement (Controls)
      const speed = 4;
      if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) {
        r.playerX = Math.max(10, r.playerX - speed);
      }
      if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) {
        r.playerX = Math.min(canvas.width - r.playerWidth - 10, r.playerX + speed);
      }

      // 4. Player Fire
      const now = Date.now();
      if ((keysRef.current['Space'] || keysRef.current['KeyK']) && now - r.lastShotTime > 250) {
        r.bullets.push({
          x: r.playerX + r.playerWidth / 2 - 2,
          y: r.playerY - 6,
          width: 4,
          height: 12,
          vy: -7,
          fromPlayer: true,
          color: '#38bdf8',
        });
        r.lastShotTime = now;
        playSound('shoot');
      }

      // 5. Enemy Grid Animation (Dance Left & Right)
      const stageSpeedFactor = 0.5 + stage * 0.15;
      r.gridOffset += r.gridDirection * r.gridStep * stageSpeedFactor;
      if (Math.abs(r.gridOffset) > r.gridOffsetMax) {
        r.gridDirection *= -1;
      }

      // 6. Enemy Diving AI (Galaga behavior)
      const aliveEnemies = r.enemies.filter((e) => e.alive);
      if (aliveEnemies.length === 0) {
        // Clear Stage!
        setStage((prev) => {
          const nextStage = prev + 1;
          initStage(nextStage, false);
          return nextStage;
        });
        setGameState('CLEAR');
        return;
      }

      // Trigger a dive periodically
      if (r.frameCount >= r.nextDiveTime) {
        const nonDivingEnemies = aliveEnemies.filter((e) => !e.isDiving);
        if (nonDivingEnemies.length > 0) {
          // Select random non-diving enemy to dive
          const diver = nonDivingEnemies[Math.floor(Math.random() * nonDivingEnemies.length)];
          diver.isDiving = true;
          diver.divePhase = 0;
          diver.diveAngle = 0;
          diver.diveX = diver.x;
          diver.diveY = diver.y;
          // Set next dive delay (fewer enemies = more aggressive)
          r.nextDiveTime = r.frameCount + Math.max(90, 240 - (24 - aliveEnemies.length) * 8);
        }
      }

      // Update & Draw Enemies
      aliveEnemies.forEach((enemy) => {
        if (enemy.isDiving) {
          // Dive Pattern Calculations
          if (enemy.divePhase === 0) {
            // Phase 0: Swoop down in a circle/sine wave
            enemy.diveAngle += 0.05;
            enemy.diveX += Math.sin(enemy.diveAngle) * 3;
            enemy.diveY += enemy.diveSpeed;
            if (enemy.diveY > 200) {
              enemy.divePhase = 1; // Transition to tracking
            }
          } else if (enemy.divePhase === 1) {
            // Phase 1: Track toward player x position
            const dx = r.playerX - enemy.diveX;
            const dist = Math.sqrt(dx * dx + (r.playerY - enemy.diveY) * (r.playerY - enemy.diveY));
            if (dist > 10) {
              enemy.diveX += (dx / dist) * enemy.diveSpeed;
              enemy.diveY += enemy.diveSpeed;
            } else {
              enemy.diveY += enemy.diveSpeed;
            }
            // If goes off bottom, wrap back to top
            if (enemy.diveY > canvas.height) {
              enemy.diveY = -30;
              enemy.diveX = Math.random() * (canvas.width - 50) + 25;
              enemy.divePhase = 2; // Return to grid mode
            }
          } else if (enemy.divePhase === 2) {
            // Phase 2: Homing back to grid slot
            const targetX = enemy.startX + r.gridOffset;
            const targetY = enemy.startY;
            const dx = targetX - enemy.diveX;
            const dy = targetY - enemy.diveY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 5) {
              enemy.diveX += (dx / dist) * enemy.diveSpeed;
              enemy.diveY += (dy / dist) * enemy.diveSpeed;
            } else {
              enemy.diveX = targetX;
              enemy.diveY = targetY;
              enemy.isDiving = false;
            }
          }

          enemy.x = enemy.diveX;
          enemy.y = enemy.diveY;
        } else {
          // Grid mode
          enemy.x = enemy.startX + r.gridOffset;
          enemy.y = enemy.startY;
        }

        // Enemy shooting logic (random chance per frame based on stage)
        const shootChance = 0.0007 + stage * 0.0003;
        if (Math.random() < shootChance && enemy.y > 0 && enemy.y < 350) {
          r.bullets.push({
            x: enemy.x + enemy.width / 2 - 2,
            y: enemy.y + enemy.height,
            width: 4,
            height: 10,
            vy: 4 + stage * 0.3,
            fromPlayer: false,
            color: '#f43f5e',
          });
        }

        // --- Draw Enemy Ship ---
        const wingFlap = Math.floor(r.frameCount / 25) % 2 === 0;
        ctx.fillStyle = enemy.type === 'yellow' ? '#f59e0b' : enemy.type === 'pink' ? '#ec4899' : '#06b6d4';

        // Draw alien ship path
        ctx.beginPath();
        // Top horn
        ctx.moveTo(enemy.x + enemy.width / 2, enemy.y);
        ctx.lineTo(enemy.x + 8, enemy.y + 6);
        ctx.lineTo(enemy.x + enemy.width - 8, enemy.y + 6);
        ctx.closePath();
        ctx.fill();

        // Main body
        ctx.fillRect(enemy.x + 6, enemy.y + 6, enemy.width - 12, 10);

        // Wings (dynamic flap)
        ctx.fillStyle = enemy.type === 'yellow' ? '#d97706' : enemy.type === 'pink' ? '#db2777' : '#0891b2';
        if (wingFlap) {
          // Wings pointed up
          ctx.fillRect(enemy.x, enemy.y + 4, 6, 8);
          ctx.fillRect(enemy.x + enemy.width - 6, enemy.y + 4, 6, 8);
        } else {
          // Wings pointed down
          ctx.fillRect(enemy.x, enemy.y + 8, 6, 8);
          ctx.fillRect(enemy.x + enemy.width - 6, enemy.y + 8, 6, 8);
        }

        // Eyes (two red pixels/dots)
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(enemy.x + 10, enemy.y + 8, 3, 3);
        ctx.fillRect(enemy.x + enemy.width - 13, enemy.y + 8, 3, 3);
      });

      // 7. Bullets Update & Draw
      r.bullets = r.bullets.filter((bullet) => {
        bullet.y += bullet.vy;
        // Draw Bullet
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

        // Collision Check: Player Bullet vs Enemies
        if (bullet.fromPlayer) {
          for (let i = 0; i < r.enemies.length; i++) {
            const enemy = r.enemies[i];
            if (
              enemy.alive &&
              bullet.x > enemy.x &&
              bullet.x < enemy.x + enemy.width &&
              bullet.y > enemy.y &&
              bullet.y < enemy.y + enemy.height
            ) {
              enemy.alive = false;
              createExplosion(
                enemy.x + enemy.width / 2,
                enemy.y + enemy.height / 2,
                enemy.type === 'yellow' ? '#fbbf24' : enemy.type === 'pink' ? '#f472b6' : '#22d3ee'
              );
              setScore((prev) => {
                const nextScore = prev + enemy.points;
                updateHighScore(nextScore);
                return nextScore;
              });
              playSound('hit');
              return false; // remove bullet
            }
          }
        } else {
          // Collision Check: Enemy Bullet vs Player
          const playerCanBeHit = Date.now() >= r.playerInvulnerableUntil;
          if (!playerCanBeHit) return bullet.y > -20 && bullet.y < canvas.height + 20;
          if (
            bullet.x > r.playerX &&
            bullet.x < r.playerX + r.playerWidth &&
            bullet.y > r.playerY &&
            bullet.y < r.playerY + r.playerHeight
          ) {
            // Player hit!
            handlePlayerHit();
            return false; // remove bullet
          }
        }

        // Keep inside canvas boundary
        return bullet.y > -20 && bullet.y < canvas.height + 20;
      });

      // 8. Collision Check: Diving Enemy vs Player
      aliveEnemies.forEach((enemy) => {
        if (
          enemy.alive &&
          enemy.isDiving &&
          Date.now() >= r.playerInvulnerableUntil &&
          enemy.x + enemy.width > r.playerX &&
          enemy.x < r.playerX + r.playerWidth &&
          enemy.y + enemy.height > r.playerY &&
          enemy.y < r.playerY + r.playerHeight
        ) {
          enemy.alive = false;
          createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ef4444');
          handlePlayerHit();
        }
      });

      const playerIsInvulnerable = Date.now() < r.playerInvulnerableUntil;
      ctx.globalAlpha = playerIsInvulnerable && r.frameCount % 10 < 5 ? 0.35 : 1;

      // 9. Draw Player
      // Booster Flame Effect
      if (r.frameCount % 6 < 3) {
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(r.playerX + 10, r.playerY + r.playerHeight);
        ctx.lineTo(r.playerX + r.playerWidth / 2, r.playerY + r.playerHeight + 8);
        ctx.lineTo(r.playerX + r.playerWidth - 10, r.playerY + r.playerHeight);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(r.playerX + 13, r.playerY + r.playerHeight);
        ctx.lineTo(r.playerX + r.playerWidth / 2, r.playerY + r.playerHeight + 5);
        ctx.lineTo(r.playerX + r.playerWidth - 13, r.playerY + r.playerHeight);
        ctx.closePath();
        ctx.fill();
      }

      // Main Ship Body
      ctx.fillStyle = '#e2e8f0'; // White/gray body
      ctx.beginPath();
      ctx.moveTo(r.playerX + r.playerWidth / 2, r.playerY);
      ctx.lineTo(r.playerX + 4, r.playerY + r.playerHeight - 6);
      ctx.lineTo(r.playerX + r.playerWidth - 4, r.playerY + r.playerHeight - 6);
      ctx.closePath();
      ctx.fill();

      // Red nose cone
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(r.playerX + r.playerWidth / 2, r.playerY);
      ctx.lineTo(r.playerX + r.playerWidth / 2 - 4, r.playerY + 8);
      ctx.lineTo(r.playerX + r.playerWidth / 2 + 4, r.playerY + 8);
      ctx.closePath();
      ctx.fill();

      // Wings (Blue)
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(r.playerX, r.playerY + r.playerHeight - 12, 4, 10);
      ctx.fillRect(r.playerX + r.playerWidth - 4, r.playerY + r.playerHeight - 12, 4, 10);
      ctx.globalAlpha = 1;


      // 10. Update & Draw Particles
      r.particles = r.particles.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        return p.life > 0;
      });

      requestRef.current = requestAnimationFrame(gameLoop);
    };

    const handlePlayerHit = () => {
      const r = stateRef.current;
      if (Date.now() < r.playerInvulnerableUntil) return;
      r.playerInvulnerableUntil = Date.now() + 1500;
      createExplosion(r.playerX + r.playerWidth / 2, r.playerY + r.playerHeight / 2, '#38bdf8', 25);
      playSound('explosion');

      setLives((prev) => {
        const nextLives = prev - 1;
        if (nextLives <= 0) {
          setGameState('GAMEOVER');
        } else {
          // Respawn player
          r.playerX = 220;
          r.playerY = 480;
        }
        return nextLives;
      });
    };

    requestRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [gameState, stage, isMuted]);

  // --- Mobile/Screen Control Functions ---
  const setDirectionalInput = (
    code: 'ArrowLeft' | 'ArrowRight',
    pressed: boolean,
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    keysRef.current[code] = pressed;
    if (pressed) event.currentTarget.setPointerCapture(event.pointerId);
  };

  const fireOnce = () => {
    keysRef.current['Space'] = true;
    window.setTimeout(() => {
      keysRef.current['Space'] = false;
    }, 80);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 p-6 overflow-y-auto">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="이전 화면으로 돌아가기"
            onClick={() => navigate('/')}
            className="flex items-center justify-center p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all"
            title="돌아가기"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2 text-sky-400 font-mono tracking-wider">
              <Gamepad2 className="w-6 h-6 animate-pulse" />
              GALAGA CLONE
            </h1>
            <p className="text-xs text-slate-400">학생 서비스 미니게임</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-900/60 border border-slate-800 px-4 py-2 rounded-xl">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-400 uppercase font-mono">HIGH SCORE:</span>
            <span className="text-sm font-bold text-amber-300 font-mono">{highScore}</span>
          </div>

          <div className="h-4 w-px bg-slate-800" />
          <button
            type="button"
            aria-label={gameState === 'PAUSED' ? '게임 계속하기' : '게임 일시정지'}
            disabled={gameState !== 'PLAYING' && gameState !== 'PAUSED'}
            onClick={() => setGameState((prev) => (prev === 'PLAYING' ? 'PAUSED' : prev === 'PAUSED' ? 'PLAYING' : prev))}
            className={`p-1 rounded-md transition-all ${
              gameState === 'PLAYING' || gameState === 'PAUSED'
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                : 'text-slate-700 cursor-not-allowed'
            }`}
            title={gameState === 'PAUSED' ? '게임 계속하기' : '게임 일시정지'}
          >
            {gameState === 'PAUSED' ? <Play className="w-5 h-5 text-emerald-400" /> : <Pause className="w-5 h-5 text-sky-400" />}
          </button>

          <div className="h-4 w-px bg-slate-800" />

          <button
            type="button"
            aria-label={isMuted ? '음소거 해제' : '음소거'}
            onClick={() => setIsMuted((prev) => !prev)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto w-full items-start">
        {/* Game Canvas Board */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <div className="relative border-4 border-slate-800 bg-slate-950 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(56,189,248,0.07)]">
            {/* HUD Status overlay */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center pointer-events-none select-none font-mono z-10 bg-gradient-to-b from-slate-950/80 to-transparent">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500">SCORE</span>
                <span className="text-lg font-bold text-sky-400 leading-none">{score}</span>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-500">STAGE</span>
                <span className="text-lg font-bold text-yellow-400 leading-none">{stage}</span>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-500">SHIPS</span>
                <div className="flex gap-1.5 mt-1">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-4 rounded-sm transition-all duration-300 ${
                        i < lives ? 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]' : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Main WebGL/Canvas Area */}
            <canvas
              ref={canvasRef}
              width={480}
              height={540}
              className="block w-full max-w-[480px] aspect-[480/540]"
              role="img"
              aria-label={`갈러그 게임 화면. 점수 ${score}, 스테이지 ${stage}, 남은 기체 ${lives}대`}
            />

            {/* Overlay UI for game states */}
            {gameState === 'START' && (
              <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center select-none">
                <div className="w-16 h-16 bg-sky-500/10 border border-sky-500/20 rounded-full flex items-center justify-center mb-4 text-sky-400">
                  <Gamepad2 className="w-8 h-8 animate-bounce" />
                </div>
                <h2 className="text-2xl font-bold font-mono tracking-widest text-sky-400 mb-2">GALAGA INVASION</h2>
                <p className="text-sm text-slate-400 mb-8 max-w-xs">
                  우주 외계인들의 침공을 막아내고 최고 점수를 달성하세요!
                </p>
                <button
                  type="button"
                  onClick={startGame}
                  className="px-8 py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(56,189,248,0.3)] transition-all font-mono active:scale-95"
                >
                  <Play className="w-5 h-5 fill-current" />
                  GAME START
                </button>
              </div>
            )}

            {gameState === 'PAUSED' && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center select-none">
                <h2 className="text-2xl font-bold font-mono tracking-wider text-sky-300 mb-2">PAUSED</h2>
                <p className="text-xs text-slate-400 mb-6">게임이 일시정지되었습니다.</p>
                <button
                  type="button"
                  onClick={() => setGameState('PLAYING')}
                  className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(56,189,248,0.3)] transition-all font-mono active:scale-95"
                >
                  <Play className="w-5 h-5 fill-current" />
                  RESUME
                </button>
              </div>
            )}

            {gameState === 'GAMEOVER' && (
              <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center select-none">
                <h2 className="text-3xl font-bold font-mono tracking-wider text-rose-500 mb-2">GAME OVER</h2>
                <p className="text-sm text-slate-400 mb-1">최종 점수</p>
                <p className="text-3xl font-bold font-mono text-sky-400 mb-8">{score}</p>
                <button
                  type="button"
                  onClick={restartGame}
                  className="px-6 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 font-bold rounded-xl flex items-center gap-2 transition-all font-mono active:scale-95"
                >
                  <RotateCcw className="w-5 h-5" />
                  PLAY AGAIN
                </button>
              </div>
            )}

            {gameState === 'CLEAR' && (
              <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center select-none animate-fade-in">
                <h2 className="text-2xl font-bold font-mono tracking-wider text-emerald-400 mb-1">STAGE CLEARED</h2>
                <p className="text-xs text-slate-400 mb-6">외계 우주선을 전부 파괴했습니다!</p>
                <button
                  type="button"
                  onClick={() => {
                    setGameState('PLAYING');
                    playSound('start');
                  }}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all font-mono active:scale-95"
                >
                  <Play className="w-5 h-5 fill-current" />
                  NEXT STAGE
                </button>
              </div>
            )}
          </div>

          {/* Touch controllers for mobile view */}
          <div className="w-full max-w-[480px] grid grid-cols-3 gap-4 mt-6">
            <div className="col-span-2 grid grid-cols-2 gap-3">
              <button
                type="button"
                aria-label="왼쪽으로 이동"
                onPointerDown={(event) => setDirectionalInput('ArrowLeft', true, event)}
                onPointerUp={(event) => setDirectionalInput('ArrowLeft', false, event)}
                onPointerLeave={(event) => setDirectionalInput('ArrowLeft', false, event)}
                onPointerCancel={(event) => setDirectionalInput('ArrowLeft', false, event)}
                className="py-4 bg-slate-900 active:bg-slate-800 border border-slate-800 text-slate-300 font-bold rounded-xl text-lg select-none transition-all touch-none active:scale-95"
              >
                ◀ LEFT
              </button>
              <button
                type="button"
                aria-label="오른쪽으로 이동"
                onPointerDown={(event) => setDirectionalInput('ArrowRight', true, event)}
                onPointerUp={(event) => setDirectionalInput('ArrowRight', false, event)}
                onPointerLeave={(event) => setDirectionalInput('ArrowRight', false, event)}
                onPointerCancel={(event) => setDirectionalInput('ArrowRight', false, event)}
                className="py-4 bg-slate-900 active:bg-slate-800 border border-slate-800 text-slate-300 font-bold rounded-xl text-lg select-none transition-all touch-none active:scale-95"
              >
                RIGHT ▶
              </button>
            </div>
            <button
              type="button"
              aria-label="미사일 발사"
              onClick={fireOnce}
              className="py-4 bg-rose-950 active:bg-rose-900 border border-rose-900/50 text-rose-300 font-bold rounded-xl text-lg select-none transition-all shadow-[0_0_15px_rgba(244,63,94,0.1)] hover:border-rose-700 touch-none active:scale-95"
            >
              FIRE
            </button>
          </div>
        </div>

        {/* Sidebar Info/Rules */}
        <div className="lg:col-span-4 space-y-6">
          {/* Controls Information */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center gap-2 text-slate-200">
                  <HelpCircle className="w-5 h-5 text-sky-400" />
                  게임 조작법
                </h3>
              </div>
              <div className="space-y-3 text-sm text-slate-400 font-sans">
                <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-lg">
                  <span>좌우 이동</span>
                  <div className="flex gap-1">
                    <kbd className="px-2 py-0.5 bg-slate-800 text-[11px] rounded border border-slate-700 text-slate-200 font-mono">◀ / ▶</kbd>
                    <span className="text-slate-600">or</span>
                    <kbd className="px-2 py-0.5 bg-slate-800 text-[11px] rounded border border-slate-700 text-slate-200 font-mono">A / D</kbd>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-lg">
                  <span>미사일 발사</span>
                  <div className="flex gap-1">
                    <kbd className="px-2.5 py-0.5 bg-slate-800 text-[11px] rounded border border-slate-700 text-slate-200 font-mono">Space</kbd>
                    <span className="text-slate-600">or</span>
                    <kbd className="px-2 py-0.5 bg-slate-800 text-[11px] rounded border border-slate-700 text-slate-200 font-mono">K</kbd>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-lg">
                  <span>일시정지</span>
                  <div className="flex gap-1">
                    <kbd className="px-2 py-0.5 bg-slate-800 text-[11px] rounded border border-slate-700 text-slate-200 font-mono">P</kbd>
                    <span className="text-slate-600">or</span>
                    <kbd className="px-2 py-0.5 bg-slate-800 text-[11px] rounded border border-slate-700 text-slate-200 font-mono">Esc</kbd>
                  </div>
                </div>

                <p className="text-xs text-slate-500 pt-2 leading-relaxed border-t border-slate-800/80">
                  * 키보드가 없는 태블릿이나 모바일 기기에서는 화면 하단의 터치 패드를 사용해 플레이할 수 있습니다.
                </p>
              </div>
            </div>

          {/* Stage info / Alien types */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
            <h3 className="font-bold text-slate-200 mb-4 font-mono tracking-wide">ALIEN CLASSIFICATION</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3.5 bg-slate-950/40 p-3 rounded-xl border border-slate-900">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center font-bold text-amber-500 border border-amber-500/20 font-mono">
                  C
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-300">Commander Alien</h4>
                  <p className="text-xs text-slate-500 font-mono">Score: 150 points</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 bg-slate-950/40 p-3 rounded-xl border border-slate-900">
                <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center font-bold text-pink-500 border border-pink-500/20 font-mono">
                  E
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-300">Escort Alien</h4>
                  <p className="text-xs text-slate-500 font-mono">Score: 100 points</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 bg-slate-950/40 p-3 rounded-xl border border-slate-900">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center font-bold text-cyan-500 border border-cyan-500/20 font-mono">
                  D
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-300">Drone Alien</h4>
                  <p className="text-xs text-slate-500 font-mono">Score: 50 points</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
