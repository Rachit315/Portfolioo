"use client";

import { useEffect, useRef, useState } from "react";

export default function WinnerPreview() {
  const [name, setName] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, 720, 480);
    ctx.strokeStyle = "#171717"; ctx.lineWidth = 2; ctx.strokeRect(2, 2, 716, 476);
    ctx.textAlign = "center"; ctx.fillStyle = "#171717";
    ctx.font = "42px NothingFont, sans-serif"; ctx.fillText("404 WINNER", 360, 150);
    ctx.font = "30px NothingFont, sans-serif"; ctx.fillText(name || "YOUR NAME", 360, 235);
    ctx.fillStyle = "#737373"; ctx.font = "18px sans-serif"; ctx.fillText("FIRST TO 10", 360, 280);
    ctx.strokeStyle = "#171717"; ctx.beginPath(); ctx.moveTo(190, 330); ctx.lineTo(530, 330); ctx.stroke();
    ctx.fillStyle = "#171717"; ctx.font = "16px NothingFont, sans-serif"; ctx.fillText("ENGRAVED EDITION / 404 PONG", 360, 375);
  }, [name]);

  const download = () => {
    const link = document.createElement("a");
    link.download = `404-winner-${(name || "player").trim().replace(/\s+/g, "-").toLowerCase()}.png`;
    link.href = canvasRef.current?.toDataURL("image/png") || "";
    link.click();
  };

  return <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-6 text-foreground">
    <canvas ref={canvasRef} width={720} height={480} className="hidden" />
    <div className="border border-foreground bg-background px-12 py-10 text-center shadow-[6px_6px_0_var(--foreground)]">
      <div className="font-nothing text-2xl">404 WINNER</div>
      <div className="mt-4 font-nothing text-lg">{name || "YOUR NAME"}</div>
      <div className="mt-2 text-xs text-neutral-500">FIRST TO 10</div>
      <div className="mt-6 border-t border-foreground pt-4 font-nothing text-[10px]">ENGRAVED EDITION / 404 PONG</div>
    </div>
    <div className="flex flex-col items-center gap-3">
      <label className="font-nothing text-[10px]">WINNER NAME</label>
      <input value={name} onChange={(e) => setName(e.target.value.slice(0, 24))} placeholder="YOUR NAME" className="w-56 border-b border-foreground bg-transparent px-2 py-2 text-center font-nothing text-sm outline-none" />
      <button onClick={download} className="border border-foreground px-5 py-2 font-nothing text-[10px] hover:bg-foreground hover:text-background">DOWNLOAD PNG</button>
    </div>
  </main>;
}
