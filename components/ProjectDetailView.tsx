"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";
import { ProjectData, projectsData } from "@/lib/projects";
import { AsciiFluid } from "@/components/ui/ascii-fluid";
import { ArrowLeft, ArrowUpRight, Maximize2, X, ChevronRight, ChevronLeft } from "lucide-react";

interface ProjectDetailViewProps {
  project: ProjectData;
}

export function ProjectDetailView({ project }: ProjectDetailViewProps) {
  const [selectedScreenIndex, setSelectedScreenIndex] = useState<number | null>(null);

  // Find next and previous projects for navigation
  const currentIndex = projectsData.findIndex((p) => p.slug === project.slug);
  const nextProject = projectsData[(currentIndex + 1) % projectsData.length];
  const prevProject =
    projectsData[(currentIndex - 1 + projectsData.length) % projectsData.length];

  return (
    <main className="relative min-h-screen flex justify-center overflow-x-hidden px-4 py-8 sm:px-6 sm:py-16 md:py-24">
      <AsciiFluid
        className="fixed inset-0 -z-10 w-full h-full"
        color="#121212"
        backgroundColor="#FFFFFF"
        cellSize={6}
        force={0.2}
        dissipation={0.09}
        brush={0.35}
        animate={false}
        interactive={true}
      />

      <div className="w-full max-w-[520px]">
        {/* Top Navigation */}
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex min-h-[32px] flex-wrap items-center justify-between gap-3 mb-8 text-[14px]"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-foreground hover:text-neutral-500 transition-colors duration-200 group no-underline font-semibold text-[15px]"
          >
            <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
            <span>Rachit Thakur</span>
          </Link>

          <a
            href={project.figmaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-neutral-500 hover:text-foreground transition-colors duration-200 text-[14px] no-underline"
          >
            <span>Figma Design</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </motion.nav>

        {/* Project Header & Brief */}
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mb-14"
        >
          {/* Metadata pill */}
          <div className="flex flex-wrap items-center gap-2.5 text-[13px] text-neutral-500 mb-3">
            <span className="font-mono">{project.year}</span>
            <span>•</span>
            <span>{project.category}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground mb-3">
            {project.name}
          </h1>

          <p className="text-lg sm:text-xl text-neutral-600 font-normal leading-snug mb-5">
            {project.tagline}
          </p>

          <div className="p-4 sm:p-5 rounded-none bg-neutral-50/80 border border-neutral-200/80 backdrop-blur-xs">
            <h2 className="text-[12px] font-mono uppercase tracking-wider text-neutral-500 mb-2">
              Project Overview
            </h2>
            <p className="text-[15px] leading-[1.7] text-neutral-800">
              {project.description}
            </p>
          </div>
        </motion.header>

        {/* Screen Showcase Gallery */}
        <section className="space-y-12 sm:space-y-16">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-[13px] font-mono uppercase tracking-wider text-neutral-500">
              Project Screens ({project.screens.length})
            </h2>
            <span className="text-[12px] text-neutral-400">Click any screen to expand</span>
          </div>

          {project.screens.map((screen, index) => (
            <motion.article
              key={screen.src}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.5,
                delay: index * 0.06,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className="group flex flex-col gap-3"
            >
              {/* Screen Header */}
              <div className="flex items-center gap-2.5 px-0.5">
                <span className="text-[12px] font-mono text-neutral-400">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="text-[15px] font-medium text-foreground">
                  {screen.title}
                </h3>
              </div>

              {/* Screen Image Frame with 0px radius */}
              <div
                onClick={() => setSelectedScreenIndex(index)}
                className="relative w-full rounded-none overflow-hidden bg-white border border-neutral-200/90 shadow-xs cursor-zoom-in group-hover:border-neutral-400 transition-all duration-300 group-hover:shadow-sm"
              >
                <Image
                  src={screen.src}
                  alt={screen.alt}
                  width={1600}
                  height={1000}
                  sizes="(max-width: 768px) 100vw, 520px"
                  className="w-full h-auto block transition-transform duration-300 group-hover:scale-[1.005]"
                  priority={index === 0}
                />

                {/* Subtle expand badge */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/75 backdrop-blur-xs text-white p-2 rounded-none pointer-events-none">
                  <Maximize2 className="w-4 h-4" />
                </div>
              </div>
            </motion.article>
          ))}
        </section>

        {/* Bottom Pagination & Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-20 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <Link
            href={`/projects/${prevProject.slug}`}
            className="flex items-center gap-2 text-[14px] text-neutral-500 hover:text-foreground transition-colors duration-200 no-underline py-2 px-3 rounded-none hover:bg-neutral-100/70"
          >
            <ChevronLeft className="w-4 h-4" />
            <div className="text-left">
              <div className="text-[11px] font-mono text-neutral-400">PREVIOUS</div>
              <div className="font-medium text-foreground">{prevProject.name}</div>
            </div>
          </Link>

          <Link
            href="/"
            className="text-[13px] text-neutral-500 hover:text-foreground transition-colors duration-200 underline underline-offset-4"
          >
            Back to Overview
          </Link>

          <Link
            href={`/projects/${nextProject.slug}`}
            className="flex items-center gap-2 text-[14px] text-neutral-500 hover:text-foreground transition-colors duration-200 no-underline py-2 px-3 rounded-none hover:bg-neutral-100/70"
          >
            <div className="text-right">
              <div className="text-[11px] font-mono text-neutral-400">NEXT</div>
              <div className="font-medium text-foreground">{nextProject.name}</div>
            </div>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {selectedScreenIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSelectedScreenIndex(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8"
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedScreenIndex(null)}
              aria-label="Close fullscreen view"
              className="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-none transition-colors duration-200 cursor-pointer z-50"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Screen Info */}
            <div className="absolute top-5 left-6 text-white z-50">
              <div className="text-sm font-medium">
                {project.screens[selectedScreenIndex].title}
              </div>
              <div className="text-xs text-white/60">
                {selectedScreenIndex + 1} of {project.screens.length}
              </div>
            </div>

            {/* Screen Image in modal */}
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-[1200px] max-h-[85vh] w-full h-full flex items-center justify-center"
            >
              <Image
                src={project.screens[selectedScreenIndex].src}
                alt={project.screens[selectedScreenIndex].alt}
                width={1920}
                height={1080}
                className="max-w-full max-h-[82vh] w-auto h-auto object-contain rounded-none shadow-2xl border border-white/10"
                priority
              />
            </motion.div>

            {/* Previous / Next buttons */}
            {project.screens.length > 1 && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-5 flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full"
              >
                <button
                  onClick={() =>
                    setSelectedScreenIndex((prev) =>
                      prev !== null
                        ? (prev - 1 + project.screens.length) % project.screens.length
                        : 0
                    )
                  }
                  className="text-white/80 hover:text-white p-1 rounded transition-colors"
                  aria-label="Previous screen"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-xs text-white/80 font-mono">
                  {selectedScreenIndex + 1} / {project.screens.length}
                </span>
                <button
                  onClick={() =>
                    setSelectedScreenIndex((prev) =>
                      prev !== null ? (prev + 1) % project.screens.length : 0
                    )
                  }
                  className="text-white/80 hover:text-white p-1 rounded transition-colors"
                  aria-label="Next screen"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
