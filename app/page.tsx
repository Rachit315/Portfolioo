"use client";

import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
import { useState, useRef } from "react";
import { AsciiFluid } from "@/components/ui/ascii-fluid";
import { Switch } from "@/components/ui/switch";
import ASCIIText from "@/components/ASCIIText";
import { ProfileTooltip } from "@/components/ProfileTooltip";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar, ArrowUpRight } from "lucide-react";

const workExperience = [
  { name: "North of Zero", year: "2026", href: "https://www.northofzero.dev/" },
  { name: "Miraya", year: "2026", href: "https://www.linkedin.com/company/mirayaa/" },
  { name: "ZZ Studio", year: "2025", href: "https://zzstudio.design/" },
];

const figmaUrl =
  "https://www.figma.com/design/OvqW4VEF4Y6brvmXvfXWXZ/Rachit?node-id=0-1&t=TBJV3TCpKVVgb2N7-1";

const projects = [
  { name: "Collar AI", year: "2026", href: figmaUrl },
  { name: "Sentine", year: "2026", href: figmaUrl },
  { name: "CareMetric", year: "2026", href: figmaUrl },
  { name: "Quanto", year: "2026", href: figmaUrl },
  { name: "Aman Portfolio", year: "2026", href: figmaUrl },
  { name: "Mark Z", year: "2025", href: figmaUrl },
  { name: "GetCitedIn", year: "2025", href: figmaUrl },
  { name: "Aurevia Homes", year: "2025", href: figmaUrl },
  { name: "Kourt Kings", year: "2025", href: figmaUrl },
];

const designEngineerVideos = [
  { src: "/D.engineer/2026-08-05 09-58-01.mp4", href: "https://github-component.vercel.app/" },
  { src: "/D.engineer/2026-08-04 11-31-36.mp4", href: "https://crazy-btn.vercel.app/" },
  { src: "/D.engineer/2026-08-02 22-49-22.mp4", href: "https://widgetcn.vercel.app/" },
  { src: "/D.engineer/2026-08-01 10-21-50.mp4", href: "https://football-card-zeta.vercel.app/" },
  { src: "/D.engineer/2026-08-01 10-21-31.mp4", href: "https://cool-music-widget.vercel.app/" },
];

function HighlightLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center bg-highlight-bg px-1.5 py-0.5 rounded-[4px] text-foreground no-underline transition-colors duration-200 hover:bg-[#C2F703] hover:text-black"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {children}
    </motion.a>
  );
}

function ListRow({
  name,
  year,
  index,
  href,
}: {
  name: string;
  year: string;
  index: number;
  href?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const content = (
    <div
      className={`flex items-center justify-between py-3 border-t border-border group ${href ? "cursor-pointer" : "cursor-default"
        }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.span
        className="text-[15px] text-foreground"
        animate={{ x: isHovered ? 4 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {name}
      </motion.span>
      <motion.span
        className="text-[15px] text-foreground tabular-nums"
        animate={{ opacity: isHovered ? 0.5 : 1 }}
        transition={{ duration: 0.2 }}
      >
        {year}
      </motion.span>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="block no-underline text-inherit"
        >
          {content}
        </a>
      ) : (
        content
      )}
    </motion.div>
  );
}

function SectionLabel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.p
      className={`text-[13px] text-neutral-500 mb-1 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.p>
  );
}

function DesignEngineerCard({
  src,
  index,
  href,
}: {
  src: string;
  index: number;
  href: string;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Ignore play interrupt warnings
      });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="relative w-full rounded-[16px] overflow-hidden bg-[#e5e5e5] border border-neutral-200/80 shadow-xs cursor-pointer group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative w-full"
      >
        <video
          ref={videoRef}
          src={src}
          loop
          muted
          playsInline
          preload="metadata"
          className="w-full h-auto block rounded-[16px] transition-transform duration-300 group-hover:scale-[1.01]"
        />

        {/* Hover "Visit ↗" badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 4 }}
          animate={{
            opacity: isHovered ? 1 : 0,
            scale: isHovered ? 1 : 0.9,
            y: isHovered ? 0 : 4,
          }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-xs text-foreground px-3.5 py-1.5 rounded-full text-[13px] font-medium flex items-center gap-1.5 shadow-md border border-neutral-200/80 pointer-events-none"
        >
          <span>Visit</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 17L17 7" />
            <path d="M7 7h10v10" />
          </svg>
        </motion.div>
      </a>
    </motion.div>
  );
}

export default function Home() {
  const [designEngineerMode, setDesignEngineerMode] = useState(false);

  return (
    <main className="relative min-h-screen flex justify-center px-6 py-16 sm:py-24">
      <AsciiFluid
        className="fixed inset-0 -z-10 w-full h-full"
        color="#121212"
        backgroundColor="#FFFFFF"
        cellSize={6}
        force={0.2}
        dissipation={0.09}
        brush={0.35}
        animate={true}
        interactive={true}
      />

      <div className="w-full max-w-[520px]">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-8 min-h-[32px]"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div>
            {!designEngineerMode && (
              <ProfileTooltip>
                <motion.h1
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="text-[15px] font-semibold text-foreground cursor-pointer select-none"
                >
                  Rachit Thakur
                </motion.h1>
              </ProfileTooltip>
            )}
          </div>
          <div className="flex items-center gap-2 text-neutral-500 text-[14px]">
            <span>Design Engineer</span>
            <Switch
              checked={designEngineerMode}
              onCheckedChange={setDesignEngineerMode}
              size="sm"
              aria-label="Toggle Design Engineer mode"
            />
          </div>
        </motion.div>

        {/* Content Area with smooth transition */}
        <AnimatePresence mode="wait">
          {designEngineerMode ? (
            <motion.div
              key="design-engineer-gallery"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex flex-col gap-6"
            >
              {designEngineerVideos.map((video, i) => (
                <DesignEngineerCard
                  key={video.src}
                  src={video.src}
                  index={i}
                  href={video.href}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="standard-portfolio"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {/* Bio */}
              <motion.div
                className="space-y-5 mb-14"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <p className="text-[15px] leading-[1.7] text-foreground">
                  I&apos;m a Product Designer at{" "}
                  <HighlightLink href="https://www.northofzero.dev/">North of Zero</HighlightLink>, lately
                  I&apos;m more into Design Engineering and Product building.
                </p>
                <p className="text-[15px] leading-[1.7] text-foreground">
                  Just turned 20, and I have been designing since 4 year old. I am
                  from India, studying B.Tech in Data Science in India. Working day
                  and night to transition into Product design.
                </p>
                <p className="text-[15px] leading-[1.7] text-foreground">
                  You can find me on{" "}
                  <a
                    href="https://github.com/Rachit315"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-[3px] decoration-[#ccc] hover:decoration-foreground transition-colors duration-200"
                  >
                    GitHub
                  </a>
                  ,{" "}
                  <a
                    href="https://www.linkedin.com/in/rachit-thakur007/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-[3px] decoration-[#ccc] hover:decoration-foreground transition-colors duration-200"
                  >
                    LinkedIn
                  </a>
                  , and{" "}
                  <a
                    href="https://x.com/RachitThakur146"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-[3px] decoration-[#ccc] hover:decoration-foreground transition-colors duration-200"
                  >
                    X
                  </a>
                  .
                </p>
                <p className="text-[15px] leading-[1.7] text-foreground">
                  Outside of work, I explore interaction design and build
                  experimental UI concepts.
                </p>
              </motion.div>

              {/* Work Section */}
              <motion.section
                className="mb-14"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <SectionLabel>Work</SectionLabel>
                <div>
                  {workExperience.map((item, i) => (
                    <ListRow
                      key={item.name}
                      name={item.name}
                      year={item.year}
                      index={i}
                      href={item.href}
                    />
                  ))}
                </div>
              </motion.section>

              {/* Projects Section */}
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <SectionLabel className="mb-0">Projects</SectionLabel>
                  <motion.div
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <a
                      href="https://cal.com/rachit-thakur-qkvvw3/30min"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "rounded-full h-7 px-3 text-[12px] font-medium border border-neutral-200 dark:border-neutral-800 shadow-none bg-background text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all group cursor-pointer inline-flex items-center gap-1.5 no-underline"
                      )}
                    >
                      <Calendar className="size-3.5 text-neutral-500 group-hover:text-foreground transition-colors" />
                      <span>Book a Call</span>
                      <ArrowUpRight className="size-3 text-neutral-400 group-hover:text-foreground transition-colors" />
                    </a>
                  </motion.div>
                </div>
                <div>
                  {projects.map((item, i) => (
                    <ListRow
                      key={item.name}
                      name={item.name}
                      year={item.year}
                      index={i}
                      href={item.href}
                    />
                  ))}
                </div>
              </motion.section>
            </motion.div>
          )}
        </AnimatePresence>
        {/* ASCIIText Footer */}
        <footer className="relative w-full mt-20 h-[350px] sm:h-[300px] rounded-2xl overflow-hidden border border-neutral-200/80 shadow-xs bg-[#0a0a0a] flex items-center justify-center">
          <ASCIIText text="Bye!!!" textFontSize={250} enableWaves={true} asciiFontSize={6} />
        </footer>
      </div>
    </main>
  );
}
