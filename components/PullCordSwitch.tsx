"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  AnimatePresence,
} from "motion/react";

const REST_CORD_HEIGHT = 88; // Hanging length of the cord in px
const PULL_THRESHOLD = 40; // Drag distance required to trigger switch in px
const MAX_PULL_Y = 110;
const MAX_PULL_LEFT = 140;
const MAX_PULL_RIGHT = 32;
const ANCHOR_X = 200; // 40px from the right edge of the viewport
const ANCHOR_Y = 6; // Starts cleanly beneath the ceiling fixture socket

function playSwitchSound(toDark: boolean) {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    const now = ctx.currentTime;

    // Pulse 1: Mechanical click transient
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "triangle";
    osc1.frequency.setValueAtTime(toDark ? 1600 : 1950, now);
    osc1.frequency.exponentialRampToValueAtTime(140, now + 0.032);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.032);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.035);

    // Pulse 2: Resonant switch body snap
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(toDark ? 420 : 540, now + 0.008);
    osc2.frequency.exponentialRampToValueAtTime(60, now + 0.065);
    gain2.gain.setValueAtTime(0.2, now + 0.008);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.008);
    osc2.stop(now + 0.07);
  } catch {
    // Graceful fallback if Web Audio is restricted
  }
}

export function PullCordSwitch() {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const isAnimatingClickRef = useRef<boolean>(false);

  // 2D Motion values for free movement in X and Y
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);

  // Cord end coordinates matching the top edge of the handle
  const cordEndX = useTransform(dragX, (x) => ANCHOR_X + x);
  const cordEndY = useTransform(dragY, (y) => REST_CORD_HEIGHT + y + 2);

  // Dynamic rotation angle of the handle aligning with the string tension vector
  const handleRotate = useTransform([dragX, dragY], ([xVal, yVal]) => {
    const x = Number(xVal) || 0;
    const y = REST_CORD_HEIGHT + (Number(yVal) || 0);
    return (Math.atan2(x, Math.max(y, 10)) * 180) / Math.PI;
  });

  // Dynamic squash & stretch based on total distance from anchor
  const handleScaleY = useTransform(dragY, [-20, 0, MAX_PULL_Y], [0.92, 1, 1.12]);
  const handleScaleX = useTransform(dragY, [-20, 0, MAX_PULL_Y], [1.06, 1, 0.94]);

  // Synchronize theme with html.dark and localStorage
  useEffect(() => {
    setMounted(true);
    const hasDark = document.documentElement.classList.contains("dark");
    setIsDark(hasDark);

    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const triggerToggle = useCallback(() => {
    const currentlyDark = document.documentElement.classList.contains("dark");
    const next = !currentlyDark;
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
    setIsDark(next);
    playSwitchSound(next);
    window.dispatchEvent(new CustomEvent("theme-change", { detail: { isDark: next } }));
  }, []);

  // Handle tap / click: smooth pull-down + bouncy spring release
  const handleClick = useCallback(() => {
    if (isDragging || isAnimatingClickRef.current) return;
    isAnimatingClickRef.current = true;

    // Pull down animation
    animate(dragY, 52, {
      duration: 0.22,
      ease: [0.25, 1, 0.5, 1],
    }).then(() => {
      triggerToggle();

      // Elastic snap-back with bouncy spring
      animate(dragY, 0, {
        type: "spring",
        stiffness: 420,
        damping: 10,
        mass: 0.7,
        restDelta: 0.001,
      }).then(() => {
        isAnimatingClickRef.current = false;
      });

      // Subtle natural pendulum sway on click
      animate(dragX, [0, -12, 10, -7, 4, -2, 0], {
        duration: 1.2,
        ease: [0.25, 1, 0.5, 1],
      });
    });
  }, [isDragging, dragX, dragY, triggerToggle]);

  // Handle 2D drag release with full pendulum physics
  const handleDragEnd = useCallback(
    (
      _: MouseEvent | TouchEvent | PointerEvent,
      info: { offset: { x: number; y: number }; velocity: { x: number; y: number } }
    ) => {
      setIsDragging(false);
      const currentY = dragY.get();
      const totalDistance = Math.hypot(dragX.get(), currentY);

      // Trigger if pulled down enough or flung with downward speed
      if (currentY >= PULL_THRESHOLD || totalDistance >= PULL_THRESHOLD + 10 || info.velocity.y > 180) {
        triggerToggle();
      }

      // 2D Elastic Snap-Back: Y axis spring
      animate(dragY, 0, {
        type: "spring",
        stiffness: 440,
        damping: 11,
        mass: 0.75,
        velocity: info.velocity.y,
        restDelta: 0.001,
      });

      // 2D Pendulum Sway: X axis spring with momentum
      animate(dragX, 0, {
        type: "spring",
        stiffness: 280,
        damping: 8,
        mass: 0.85,
        velocity: info.velocity.x,
        restDelta: 0.001,
      });
    },
    [dragX, dragY, triggerToggle]
  );

  // Subtle natural wiggle on hover
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (!isDragging && !isAnimatingClickRef.current) {
      animate(dragX, [0, 5, -4, 2.5, -1, 0], {
        duration: 0.7,
        ease: [0.33, 1, 0.68, 1],
      });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  if (!mounted) return null;

  return (
    <div
      className="fixed top-0 right-0 z-50 pointer-events-none select-none"
      style={{
        width: 240,
        height: 280,
        perspective: 1000,
      }}
    >
      {/* Ceiling Mount Bracket (Rendered at z-10 over the top of the string) */}
      <div
        className="absolute top-0 z-10 flex flex-col items-center pointer-events-auto"
        style={{ left: ANCHOR_X, transform: "translateX(-50%)" }}
      >
        <div className="w-5 h-1.5 bg-neutral-400 dark:bg-neutral-600 rounded-b-[2px]" />
        <div className="w-2 h-1 bg-neutral-500 dark:bg-neutral-500 rounded-b-full -mt-[0.5px]" />
      </div>

      {/* SVG Dynamic 2D Beaded Pull Chain (Clean Layering, z-0) */}
      <svg
        className="absolute inset-0 z-0 w-full h-full overflow-visible pointer-events-none"
      >
        <motion.line
          x1={ANCHOR_X}
          y1={ANCHOR_Y}
          x2={cordEndX}
          y2={cordEndY}
          stroke="currentColor"
          className="text-neutral-700 dark:text-neutral-300"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="1 3.4"
        />
      </svg>

      {/* 2D Draggable Handle Bob Container (Rendered at z-10 over the bottom of the string) */}
      <motion.div
        drag
        dragConstraints={{
          top: 0,
          bottom: MAX_PULL_Y,
          left: -MAX_PULL_LEFT,
          right: MAX_PULL_RIGHT,
        }}
        dragElastic={0.35}
        dragMomentum={false}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          x: dragX,
          y: dragY,
          rotate: handleRotate,
          left: ANCHOR_X,
          top: REST_CORD_HEIGHT,
          transformOrigin: "top center",
          scaleX: handleScaleX,
          scaleY: handleScaleY,
        }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className="absolute z-10 -ml-[8px] flex flex-col items-center cursor-grab active:cursor-grabbing focus:outline-none pointer-events-auto"
        role="button"
        tabIndex={0}
        aria-label={`Pull cord to switch to ${isDark ? "light" : "dark"} mode`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {/* Monolithic Sleek Capsule Pill (Clean Seamless Connection) */}
        <div
          className={`relative w-4 h-11 rounded-full transition-colors duration-300 ${
            isDark
              ? "bg-[#f2f2f2] border border-[#e0e0e0]"
              : "bg-[#181818] border border-[#2c2c2c]"
          }`}
        >
          {/* 3 Crisp Tactile Grip Slits */}
          <div className="absolute inset-x-1 top-3 bottom-3 flex flex-col justify-center items-center gap-[3px]">
            <div
              className={`w-2 h-[1px] ${
                isDark ? "bg-[#b0b0b0]" : "bg-[#383838]"
              } rounded-full`}
            />
            <div
              className={`w-2 h-[1px] ${
                isDark ? "bg-[#b0b0b0]" : "bg-[#383838]"
              } rounded-full`}
            />
            <div
              className={`w-2 h-[1px] ${
                isDark ? "bg-[#b0b0b0]" : "bg-[#383838]"
              } rounded-full`}
            />
          </div>

          {/* Subtle clean vertical satin edge highlight */}
          <div
            className={`absolute top-1 left-0.5 bottom-1 w-[1px] rounded-full ${
              isDark ? "bg-white/80" : "bg-white/15"
            }`}
          />
        </div>

        {/* Micro Hover Tooltip */}
        <AnimatePresence>
          {isHovered && !isDragging && (
            <motion.div
              initial={{ opacity: 0, x: -10, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -10, scale: 0.9 }}
              transition={{ duration: 0.18, ease: [0.25, 1, 0.5, 1] }}
              className="absolute right-6 top-2 whitespace-nowrap pointer-events-none flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-[10px] font-medium tracking-wide border border-neutral-700 dark:border-neutral-200"
            >
              <span>{isDark ? "Light" : "Dark"}</span>
              <span className="opacity-60 text-[9px]">↓</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
