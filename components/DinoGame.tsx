"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { RotateCcw } from "lucide-react";

// Web Audio API sound synthesizer helper (matching Chromium sound effects)
class SoundFX {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  jump() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(340, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(680, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {
      // Fallback
    }
  }

  score() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1320, now + 0.08);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.16);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.16);
    } catch {
      // Fallback
    }
  }

  hit() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch {
      // Fallback
    }
  }
}

const sfx = new SoundFX();

// Compact T-Rex sprite with consistent row widths for stable visual/collision bounds.
const DINO_SPRITE_RUN1 = [
  "               ###### ", // 0 (Head top)
  "              ########", // 1
  "              #o######", // 2 (Eye)
  "              ########", // 3
  "              ########", // 4
  "              ######  ", // 5 (Snout)
  "              ###     ", // 6 (Open mouth)
  "            #####     ", // 7 (Neck)
  "#          #######    ", // 8 (Tail tip)
  "##        ######### # ", // 9 (Arm & hand col 19!)
  "###      ########## # ", // 10 (Hand claw col 19!)
  "####    ###########   ", // 11
  "#####  ############   ", // 12
  "##################    ", // 13
  " ################     ", // 14
  "  ##############      ", // 15
  "   ############       ", // 16
  "    ##########        ", // 17
  "     ###   ###        ", // 18
  "     ##      #        ", // 19
  "     ###     ##       ", // 20
];

const DINO_SPRITE_RUN2 = [
  "               ###### ",
  "              ########",
  "              #o######",
  "              ########",
  "              ########",
  "              ######  ",
  "              ###     ",
  "            #####     ",
  "#          #######    ",
  "##        ######### # ",
  "###      ########## # ",
  "####    ###########   ",
  "#####  ############   ",
  "##################    ",
  " ################     ",
  "  ##############      ",
  "   ############       ",
  "    ##########        ",
  "     ###   ###        ",
  "       #     ##       ",
  "      ##     ###      ",
];

const DINO_SPRITE_JUMP = [
  "               ###### ",
  "              ########",
  "              #o######",
  "              ########",
  "              ########",
  "              ######  ",
  "              ###     ",
  "            #####     ",
  "#          #######    ",
  "##        ######### # ",
  "###      ########## # ",
  "####    ###########   ",
  "#####  ############   ",
  "##################    ",
  " ################     ",
  "  ##############      ",
  "   ############       ",
  "    ##########        ",
  "     ###   ###        ",
  "     ##     ##        ",
  "     ###    ###       ",
];

const DINO_SPRITE_DEAD = [
  "               ###### ",
  "              ########",
  "              #x######",
  "              ########",
  "              ########",
  "              ######  ",
  "              ###     ",
  "            #####     ",
  "#          #######    ",
  "##        ######### # ",
  "###      ########## # ",
  "####    ###########   ",
  "#####  ############   ",
  "##################    ",
  " ################     ",
  "  ##############      ",
  "   ############       ",
  "    ##########        ",
  "     ###   ###        ",
  "     ##     ##        ",
  "     ###    ###       ",
];

const DINO_SPRITE_DUCK1 = [
  "                   ###### ",
  "                  ########",
  "                  #o######",
  "                  ########",
  "                  ######  ",
  "        ################# ",
  "#      #################  ",
  "##    ################# # ",
  "###  ################# #  ",
  "#####################     ",
  " ###################      ",
  "  #################       ",
  "   ###############        ",
  "     ###   ###            ",
  "     ##      #            ",
  "     ###     ##           ",
];

const DINO_SPRITE_DUCK2 = [
  "                   ###### ",
  "                  ########",
  "                  #o######",
  "                  ########",
  "                  ######  ",
  "        ################# ",
  "#      #################  ",
  "##    ################# # ",
  "###  ################# #  ",
  "#####################     ",
  " ###################      ",
  "  #################       ",
  "   ###############        ",
  "     ###   ###            ",
  "       #     ##           ",
  "      ##     ###          ",
];

// Reference silhouette: blocky head, raised tail, compact body and straight legs.
// It is intentionally rendered at the same pixel scale in every game state.
const REFERENCE_DINO_SPRITE = [
  "            ########",
  "            ########",
  "            ##o#####",
  "            ########",
  "            ########",
  "            ########",
  "            ####    ",
  "            ####    ",
  "          ######    ",
  "        ##########  ",
  "      ############  ",
  "    ##############  ",
  "  ################  ",
  " #################  ",
  " #################  ",
  "  ###############   ",
  "   ##############   ",
  "   #######  ####    ",
  "   ######   ####    ",
  "   ######   ####    ",
  "   ######   ####    ",
];

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Cloud {
  x: number;
  y: number;
  speed: number;
  width: number;
}

export function DinoGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [gameState, setGameState] = useState<"IDLE" | "RUNNING" | "GAMEOVER">("IDLE");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const stateRef = useRef({
    state: "IDLE" as "IDLE" | "RUNNING" | "GAMEOVER",
    score: 0,
    highScore: 0,
    dinoY: 0,
    dinoVy: 0,
    isJumping: false,
    isDucking: false,
    speedDrop: false,
    groundY: 165,
    speed: 4.2,
    maxSpeed: 10.0,
    acceleration: 0.0004,
    obstacles: [] as Obstacle[],
    clouds: [] as Cloud[],
    groundOffset: 0,
    frameCount: 0,
    nextObstacleTimer: 0,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dino_high_score");
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed)) {
          setHighScore(parsed);
          stateRef.current.highScore = parsed;
        }
      }
    }
  }, []);

  const jump = useCallback(() => {
    const s = stateRef.current;
    if (s.state === "IDLE" || s.state === "GAMEOVER") {
      s.state = "RUNNING";
      s.score = 0;
      s.speed = 4.2;
      s.obstacles = [];
      s.dinoY = 0;
      s.dinoVy = -10.5;
      s.isJumping = true;
      s.isDucking = false;
      s.speedDrop = false;
      setGameState("RUNNING");
      setScore(0);
      sfx.jump();
    } else if (s.state === "RUNNING") {
      if (!s.isJumping) {
        s.dinoVy = -10.5;
        s.isJumping = true;
        s.isDucking = false;
        sfx.jump();
      }
    }
  }, []);

  const duck = useCallback((ducking: boolean) => {
    const s = stateRef.current;
    if (s.state === "RUNNING") {
      if (s.isJumping && ducking) {
        s.speedDrop = true;
        s.dinoVy = 4.5;
      } else {
        s.isDucking = ducking;
      }
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        jump();
      } else if (e.code === "ArrowDown" || e.code === "KeyS") {
        e.preventDefault();
        duck(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowDown" || e.code === "KeyS") {
        e.preventDefault();
        duck(false);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (containerRef.current && containerRef.current.contains(e.target as Node)) {
        e.preventDefault();
        jump();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("touchstart", handleTouchStart, { passive: false });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("touchstart", handleTouchStart);
    };
  }, [jump, duck]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    // Render "404" Obstacle using nothing-font.otf dynamically adapting to game theme
    const drawNothingFont404 = (
      x: number,
      y: number,
      color: string = "#171717"
    ) => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.font = "700 44px var(--font-nothing), 'NothingFont', sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("404", x, y + 46);
      ctx.restore();
    };

    const drawDino = (
      x: number,
      y: number,
      sprite: string[],
      scale: number = 2.0,
      bodyColor: string = "#171717",
      bgColor: string = "#ffffff"
    ) => {
      for (let r = 0; r < sprite.length; r++) {
        const row = sprite[r];
        for (let c = 0; c < row.length; c++) {
          const char = row[c];
          if (char === "#") {
            ctx.fillStyle = bodyColor;
            ctx.fillRect(x + c * scale, y + r * scale, scale, scale);
          } else if (char === "o") {
            ctx.fillStyle = bgColor;
            ctx.fillRect(x + c * scale, y + r * scale, scale, scale);
          } else if (char === "x") {
            ctx.fillStyle = bodyColor;
            ctx.fillRect(x + c * scale, y + r * scale, scale, scale);
          }
        }
      }
    };

    const drawCloud = (x: number, y: number, color: string = "#e5e5e5") => {
      ctx.fillStyle = color;
      ctx.fillRect(x, y + 8, 42, 10);
      ctx.fillRect(x + 8, y + 3, 24, 15);
      ctx.fillRect(x + 14, y, 14, 18);
    };

    const s = stateRef.current;
    if (s.clouds.length === 0) {
      s.clouds = [
        { x: 100, y: 25, speed: 0.4, width: 42 },
        { x: 320, y: 45, speed: 0.3, width: 42 },
        { x: 500, y: 20, speed: 0.5, width: 42 },
      ];
    }

    const loop = () => {
      animId = requestAnimationFrame(loop);

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, width, height);

      const isDark = document.documentElement.classList.contains("dark");
      const primaryColor = isDark ? "#f5f5f5" : "#171717";
      const secondaryColor = isDark ? "#404040" : "#e5e5e5";
      const groundColor = isDark ? "#525252" : "#d4d4d4";
      const canvasBgColor = isDark ? "#171717" : "#ffffff";

      const groundY = height - 25;
      s.groundY = groundY;

      const isMobile = width < 480;
      const dinoScale = isMobile ? 1.8 : 2.1;
      const dinoX = isMobile ? 30 : 48;

      if (s.state === "RUNNING") {
        s.frameCount++;
        s.score += 0.1;
        const currentScoreInt = Math.floor(s.score);
        setScore(currentScoreInt);

        if (currentScoreInt > 0 && currentScoreInt % 100 === 0 && Math.floor(s.score - 0.1) % 100 !== 0) {
          sfx.score();
        }

        if (currentScoreInt > s.highScore) {
          s.highScore = currentScoreInt;
          setHighScore(currentScoreInt);
          if (typeof window !== "undefined") {
            localStorage.setItem("dino_high_score", currentScoreInt.toString());
          }
        }

        if (s.speed < s.maxSpeed) {
          s.speed += s.acceleration;
        }

        s.dinoY += s.dinoVy;
        s.dinoVy += s.speedDrop ? 0.9 : 0.52;

        if (s.dinoY >= 0) {
          s.dinoY = 0;
          s.dinoVy = 0;
          s.isJumping = false;
          s.speedDrop = false;
        }

        s.groundOffset = (s.groundOffset + s.speed) % 24;

        s.clouds.forEach((cloud) => {
          cloud.x -= cloud.speed;
          if (cloud.x + cloud.width < 0) {
            cloud.x = width + Math.random() * 80;
            cloud.y = 15 + Math.random() * 35;
          }
        });

        s.nextObstacleTimer -= 1;
        if (s.nextObstacleTimer <= 0) {
          const obsWidth = isMobile ? 58 : 66;
          const obsHeight = 50;
          s.obstacles.push({
            x: width + 20,
            y: groundY - obsHeight,
            width: obsWidth,
            height: obsHeight,
          });
          s.nextObstacleTimer = Math.floor(95 + Math.random() * 80 - s.speed * 2);
        }

        let activeSprite = DINO_SPRITE_JUMP;
        if (s.isDucking) {
          const legFrame = Math.floor(s.frameCount / 6) % 2;
          activeSprite = legFrame === 0 ? DINO_SPRITE_DUCK1 : DINO_SPRITE_DUCK2;
        } else if (!s.isJumping) {
          const legFrame = Math.floor(s.frameCount / 6) % 2;
          activeSprite = legFrame === 0 ? DINO_SPRITE_RUN1 : DINO_SPRITE_RUN2;
        }

        const activeSpriteRows = REFERENCE_DINO_SPRITE.length;
        const activeSpriteCols = REFERENCE_DINO_SPRITE[0].length;
        const currentDinoWidth = activeSpriteCols * dinoScale;
        const currentDinoHeight = activeSpriteRows * dinoScale;
        const currentDinoY = groundY - currentDinoHeight + s.dinoY;

        const dinoBox = {
          x: dinoX + 4,
          y: currentDinoY + 4,
          w: currentDinoWidth - 8,
          h: currentDinoHeight - 6,
        };

        for (let i = s.obstacles.length - 1; i >= 0; i--) {
          const obs = s.obstacles[i];
          obs.x -= s.speed;

          const obsBox = {
            x: obs.x + 3,
            y: obs.y + 3,
            w: obs.width - 6,
            h: obs.height - 4,
          };

          if (
            dinoBox.x < obsBox.x + obsBox.w &&
            dinoBox.x + dinoBox.w > obsBox.x &&
            dinoBox.y < obsBox.y + obsBox.h &&
            dinoBox.y + dinoBox.h > obsBox.y
          ) {
            s.state = "GAMEOVER";
            setGameState("GAMEOVER");
            sfx.hit();
          }

          if (obs.x + obs.width < -50) {
            s.obstacles.splice(i, 1);
          }
        }
      }

      // 1. Draw Clouds
      s.clouds.forEach((cloud) => {
        drawCloud(cloud.x, cloud.y, secondaryColor);
      });

      // 2. Draw Ground Line
      ctx.strokeStyle = groundColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(width, groundY);
      ctx.stroke();

      ctx.fillStyle = groundColor;
      for (let gx = -s.groundOffset; gx < width; gx += 24) {
        if ((gx + s.groundOffset) % 48 === 0) {
          ctx.fillRect(gx, groundY + 4, 8, 1.5);
          ctx.fillRect(gx + 12, groundY + 7, 4, 1.5);
        } else {
          ctx.fillRect(gx + 4, groundY + 5, 6, 1.5);
        }
      }

      // 3. Draw 404 Obstacles using nothing-font.otf matching current theme
      s.obstacles.forEach((obs) => {
        drawNothingFont404(obs.x, obs.y, primaryColor);
      });

      // 4. Draw Dino with arm/hand sprite
      let sprite = DINO_SPRITE_JUMP;
      if (s.state === "GAMEOVER") {
        sprite = DINO_SPRITE_DEAD;
      } else if (s.isDucking) {
        const legFrame = Math.floor(s.frameCount / 6) % 2;
        sprite = legFrame === 0 ? DINO_SPRITE_DUCK1 : DINO_SPRITE_DUCK2;
      } else if (!s.isJumping && s.state === "RUNNING") {
        const legFrame = Math.floor(s.frameCount / 6) % 2;
        sprite = legFrame === 0 ? DINO_SPRITE_RUN1 : DINO_SPRITE_RUN2;
      } else if (s.state === "IDLE") {
        sprite = DINO_SPRITE_RUN1;
      }

      const activeHeight = REFERENCE_DINO_SPRITE.length * dinoScale;
      const currentDinoY = groundY - activeHeight + s.dinoY;

      drawDino(dinoX, currentDinoY, REFERENCE_DINO_SPRITE, dinoScale, primaryColor, canvasBgColor);

      // Overlay Game Text
      if (s.state === "GAMEOVER") {
        ctx.fillStyle = primaryColor;
        ctx.font = "600 15px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("G A M E   O V E R", width / 2, height / 2 - 12);
        ctx.font = "12px sans-serif";
        ctx.fillStyle = isDark ? "#a3a3a3" : "#737373";
        ctx.fillText("Press Space or Tap to Restart", width / 2, height / 2 + 12);
      } else if (s.state === "IDLE") {
        ctx.fillStyle = primaryColor;
        ctx.font = "500 13px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Press Space or Tap to Jump", width / 2, height / 2 - 10);
      }

      ctx.restore();
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div ref={containerRef} className="w-full select-none">
      {/* Header Score Bar */}
      <div className="w-full flex items-center justify-between mb-3 text-[13px] font-mono text-neutral-500">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">DINO 404</span>
          {gameState === "GAMEOVER" && (
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-foreground font-sans">
              Crash!
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>HI {highScore.toString().padStart(5, "0")}</span>
          <span className="text-foreground font-semibold">{score.toString().padStart(5, "0")}</span>
        </div>
      </div>

      {/* Game Canvas Container */}
      <div
        onClick={jump}
        className="relative w-full h-[200px] sm:h-[220px] bg-background border border-neutral-200/90 dark:border-neutral-800 rounded-2xl overflow-hidden cursor-pointer touch-none shadow-xs"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {gameState === "GAMEOVER" && (
          <div className="absolute inset-0 bg-background/20 backdrop-blur-[2px] flex items-center justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                jump();
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-foreground text-background font-medium text-xs shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Control Hint Footer */}
      <div className="flex items-center justify-between mt-3 text-[12px] text-neutral-500">
        <p>
          Press <kbd className="px-1 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-[10px] font-mono">Space</kbd> or <kbd className="px-1 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-[10px] font-mono">↑</kbd> or <kbd className="px-1 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-[10px] font-mono">↓</kbd> to duck.
        </p>
      </div>
    </div>
  );
}

export default DinoGame;
