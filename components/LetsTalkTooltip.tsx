"use client";

import { useState } from "react";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
import ChromeButton from "@/components/evil-buttons/chrome-button";

interface LetsTalkTooltipProps {
  children?: React.ReactNode;
  className?: string;
  href?: string;
}

export function LetsTalkTooltip({
  children = "Let’s Talk",
  className = "",
  href = "https://cal.com/rachit-thakur-qkvvw3/30min",
}: LetsTalkTooltipProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <span
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
    >
      {/* Trigger Link */}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-[3px] decoration-[#ccc] hover:decoration-foreground transition-colors duration-200 cursor-pointer font-normal text-foreground"
      >
        {children}
      </a>

      {/* Tooltip Dropdown */}
      <AnimatePresence>
        {isHovered && (
          <motion.span
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
            className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 flex flex-col items-center z-50 pointer-events-auto shadow-none"
          >
            {/* Black Triangle Pointer pointing up */}
            <span
              className="w-0 h-0 border-x-[8px] border-x-transparent border-b-[10px] border-b-black shrink-0 -mb-[1px] z-20 block"
              aria-hidden="true"
            />

            {/* ChromeButton in Tooltip */}
            <ChromeButton
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="w-[140px] h-[40px] rounded-none border border-black shadow-none"
              liquidProps={{
                baseColor: [0.1, 0.1, 0.1],
                speed: 0.3,
                amplitude: 0.6,
                frequencyX: 3.5,
                frequencyY: 2.5,
              }}
            >
              Book a Call
            </ChromeButton>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

export default LetsTalkTooltip;
