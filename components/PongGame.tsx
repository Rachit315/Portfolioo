"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Game = { x: number; y: number; vx: number; vy: number; player: number; cpu: number; score: [number, number] };
const fresh = (): Game => ({ x: 50, y: 50, vx: -.42, vy: .24, player: 50, cpu: 50, score: [0, 0] });

export function PongGame() {
  const arena = useRef<HTMLDivElement>(null);
  const game = useRef<Game>(fresh());
  const keys = useRef({ left: false, right: false });
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [score, setScore] = useState<[number, number]>([0, 0]);
  const [playerName, setPlayerName] = useState("");
  const [winner, setWinner] = useState<string | null>(null);

  const aim = useCallback((clientY: number) => {
    const box = arena.current?.getBoundingClientRect();
    if (box) game.current.player = Math.max(14, Math.min(86, ((clientY - box.top) / box.height) * 100));
  }, []);
  const restart = useCallback(() => { game.current = fresh(); setScore([0, 0]); setWinner(null); setPlaying(true); }, []);

  useEffect(() => {
    const on = (e: KeyboardEvent, value: boolean) => { if (["ArrowUp", "w"].includes(e.key)) keys.current.left = value; if (["ArrowDown", "s"].includes(e.key)) keys.current.right = value; };
    const down = (e: KeyboardEvent) => on(e, true), up = (e: KeyboardEvent) => on(e, false);
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    let id = 0;
    const tick = () => {
      const g = game.current;
      if (playing) {
        if (keys.current.left) g.player -= 1.1; if (keys.current.right) g.player += 1.1;
        g.player = Math.max(14, Math.min(86, g.player));
        // CPU follows the ball's vertical position (not its horizontal travel).
        // Deliberately relaxed CPU reaction so the player has a fair chance.
        g.cpu += (g.y - g.cpu) * .028;
        g.cpu = Math.max(14, Math.min(86, g.cpu));
        g.x += g.vx; g.y += g.vy;
        if (g.y < 3 || g.y > 97) { g.vy *= -1; g.y = Math.max(3, Math.min(97, g.y)); }
        if (g.x <= 8 && g.vx < 0 && Math.abs(g.y - g.player) < 24) { g.x = 8; g.vx = Math.min(Math.abs(g.vx) * 1.01, .82); g.vy = Math.max(-.82, Math.min(.82, g.vy + (g.y - g.player) * .008)); }
        if (g.x >= 92 && g.vx > 0 && Math.abs(g.y - g.cpu) < 16) { g.x = 92; g.vx = -Math.min(Math.abs(g.vx) * 1.01, .82); g.vy = Math.max(-.82, Math.min(.82, g.vy + (g.y - g.cpu) * .008)); }
        if (g.x < -4 || g.x > 104) { const playerScored = g.x > 100; const next: [number, number] = playerScored ? [g.score[0] + 1, g.score[1]] : [g.score[0], g.score[1] + 1]; g.score = next; setScore(next); if (next[0] >= 10 || next[1] >= 10) { setPlaying(false); setWinner(next[0] >= 10 ? (playerName.trim() || "PLAYER") : "CPU"); } else { g.x = 50; g.y = 50; g.vx = playerScored ? -.58 : .58; g.vy = (Math.random() - .5) * .6; } }
        setFrame((n) => n + 1);
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick); return () => { cancelAnimationFrame(id); window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [playing, playerName]);

  const g = game.current;
  const paddle = (position: number, right: boolean) => <div className={`absolute ${right ? "h-[80px]" : "h-[80px]"} w-[3px] -translate-y-1/2 bg-foreground`} style={{ top: `${position}%`, ...(right ? { right: "8%" } : { left: "8%" }) }} />;

  return <div className="mx-auto w-full max-w-[560px] select-none">
    <div className="mb-4 flex items-center justify-between font-nothing text-[11px] text-neutral-500"><span>404 PONG</span><span>{score[0].toString().padStart(2, "0")} — {score[1].toString().padStart(2, "0")}</span></div>
    <div ref={arena} onPointerMove={(e) => aim(e.clientY)} onClick={() => !playing && restart()} className="relative mx-auto aspect-[1.8] w-full max-w-[560px] overflow-hidden border border-foreground/80 bg-background">
      {paddle(g.player, false)}{paddle(g.cpu, true)}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-nothing text-[28px] text-neutral-400">404</div>
      <div className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground" style={{ left: `${g.x}%`, top: `${g.y}%` }} />
      {!playing && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/65 backdrop-blur-[1px]">{winner ? <div className="border border-foreground bg-background px-8 py-6 text-center shadow-[4px_4px_0_var(--foreground)]"><div className="font-nothing text-lg">404 WINNER</div><div className="mt-2 font-nothing text-sm">{winner}</div><div className="mt-1 text-[10px] text-neutral-500">FIRST TO 10</div><button onClick={restart} className="mt-4 font-nothing border border-foreground px-4 py-2 text-[10px] hover:bg-foreground hover:text-background">PLAY AGAIN</button></div> : <><label className="font-nothing text-[10px]">YOUR NAME</label><input value={playerName} onChange={(e) => setPlayerName(e.target.value)} onClick={(e) => e.stopPropagation()} placeholder="PLAYER" maxLength={16} className="w-32 border-b border-foreground bg-transparent px-1 py-1 text-center font-nothing text-xs outline-none" /><button onClick={restart} className="font-nothing border border-foreground px-4 py-2 text-[10px] hover:bg-foreground hover:text-background">PLAY</button></>}</div>}
    </div>
    <div className="mt-4 flex items-center justify-between font-nothing text-[9px] text-neutral-500"><span>MOVE: POINTER / ↑ ↓</span><button onClick={restart} className="underline underline-offset-4">RESET</button></div>
  </div>;
}

export default PongGame;
