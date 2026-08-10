"use client";

import React from "react";

// Nothing Phone Ndot Font Dot-Matrix Bitmaps (7 rows tall)
const CHAR_MAP: Record<string, number[][]> = {
  "4": [
    [0, 0, 0, 1, 0, 1],
    [0, 0, 1, 1, 0, 1],
    [0, 1, 0, 1, 0, 1],
    [1, 1, 1, 1, 1, 1],
    [0, 0, 0, 1, 0, 1],
    [0, 0, 0, 1, 0, 1],
    [0, 0, 0, 1, 0, 1],
  ],
  "0": [
    [0, 1, 1, 1, 1, 0],
    [1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1],
    [0, 1, 1, 1, 1, 0],
  ],
  N: [
    [1, 0, 0, 0, 0, 1],
    [1, 1, 0, 0, 0, 1],
    [1, 0, 1, 0, 0, 1],
    [1, 0, 0, 1, 0, 1],
    [1, 0, 0, 0, 1, 1],
    [1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1],
  ],
  O: [
    [0, 1, 1, 1, 1, 0],
    [1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1],
    [0, 1, 1, 1, 1, 0],
  ],
  T: [
    [1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0],
  ],
  F: [
    [1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0],
    [1, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 0],
    [1, 0, 0, 0, 0, 0],
    [1, 0, 0, 0, 0, 0],
    [1, 0, 0, 0, 0, 0],
  ],
  U: [
    [1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1],
    [0, 1, 1, 1, 1, 0],
  ],
  D: [
    [1, 1, 1, 1, 1, 0],
    [1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 0],
  ],
  " ": [
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
  ],
};

interface DotMatrixTextProps {
  text: string;
  dotSize?: number;
  gap?: number;
  lineGap?: number;
  className?: string;
}

export function DotMatrixText({
  text,
  dotSize = 3.5,
  gap = 2.5,
  lineGap = 5,
  className = "",
}: DotMatrixTextProps) {
  const lines = text.split("\n");

  return (
    <div
      className={`flex flex-col items-center select-none ${className}`}
      style={{ gap: `${lineGap * 4}px` }}
    >
      {lines.map((lineText, lineIdx) => {
        const chars = lineText.toUpperCase().split("");

        return (
          <div key={lineIdx} className="flex items-center gap-2 sm:gap-3">
            {chars.map((char, charIdx) => {
              const matrix = CHAR_MAP[char] || CHAR_MAP[" "];
              const numCols = matrix[0].length;

              return (
                <div
                  key={charIdx}
                  className="grid shrink-0"
                  style={{
                    gridTemplateColumns: `repeat(${numCols}, ${dotSize}px)`,
                    gap: `${gap}px`,
                  }}
                >
                  {matrix.flatMap((row, r) =>
                    row.map((val, c) => (
                      <div
                        key={`${r}-${c}`}
                        style={{
                          width: `${dotSize}px`,
                          height: `${dotSize}px`,
                        }}
                        className={`rounded-full transition-colors duration-150 ${
                          val === 1
                            ? "bg-foreground shadow-[0_0_1px_rgba(0,0,0,0.3)]"
                            : "bg-transparent"
                        }`}
                      />
                    ))
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export default DotMatrixText;
