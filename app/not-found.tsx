"use client";

import Link from "next/link";
import { PongGame } from "@/components/PongGame";
import * as motion from "motion/react-client";

export default function NotFound() {
  return (
    <main className="relative min-h-screen bg-background text-foreground selection:bg-foreground selection:text-background font-sans">
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-xl flex-col px-6 py-8 sm:py-10">
        {/* Top Header with Back to Home link */}
        <motion.div
          className="mb-7 flex items-center justify-end"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            href="/"
            className="underline underline-offset-[3px] decoration-[#ccc] hover:decoration-foreground transition-colors duration-200 text-[14px] text-foreground font-normal"
          >
            ← Back to Home
          </Link>
        </motion.div>

        {/* Embedded Dino Game */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <PongGame />
        </motion.div>
      </div>
    </main>
  );
}
