"use client";

import { useState } from "react";
import Image from "next/image";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";

interface ProfileTooltipProps {
  children: React.ReactNode;
  className?: string;
}

export function ProfileTooltip({ children, className = "" }: ProfileTooltipProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
    >
      {/* Trigger element (e.g. "Rachit Thakur") */}
      <motion.div
        animate={{ scale: isHovered ? 1.02 : 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="cursor-pointer"
      >
        {children}
      </motion.div>

      {/* Micro-interaction Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, x: -12 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.88, x: -12 }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
            className="absolute right-full top-1/2 -translate-y-1/2 mr-3 flex items-center z-50 pointer-events-none drop-shadow-md"
          >
            {/* Square Profile Card with Thick Border matching Figma spec */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 border-[3.5px] border-foreground bg-black overflow-hidden shrink-0 shadow-sm">
              <Image
                src="/Profile.png"
                alt="Rachit Thakur Profile"
                width={360}
                height={360}
                className="w-full h-full object-cover transition-all duration-300"
                priority
              />
            </div>

            {/* Triangle Pointer pointing directly at the text */}
            <div
              className="w-0 h-0 border-y-[7px] border-y-transparent border-l-[9px] border-l-foreground -ml-[0.5px] shrink-0"
              aria-hidden="true"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
