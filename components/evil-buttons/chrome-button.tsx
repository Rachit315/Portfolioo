"use client";

import React from "react";
import LiquidChrome, { LiquidChromeProps } from "@/components/react-bits/LiquidChrome";

export interface ChromeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  liquidProps?: Partial<LiquidChromeProps>;
  href?: string;
  target?: string;
  rel?: string;
}

export const ChromeButton: React.FC<ChromeButtonProps> = ({
  children,
  className = "",
  liquidProps,
  href,
  target,
  rel,
  ...props
}) => {
  const content = (
    <>
      {/* Liquid Chrome Shader Canvas */}
      <span className="absolute inset-0 z-0 overflow-hidden pointer-events-none rounded-[inherit] block">
        <LiquidChrome
          baseColor={[0.1, 0.1, 0.1]}
          speed={0.25}
          amplitude={0.5}
          frequencyX={3}
          frequencyY={2}
          interactive={true}
          {...liquidProps}
        />
      </span>

      {/* Contrast Overlay tint */}
      <span className="absolute inset-0 z-5 bg-black/20 pointer-events-none rounded-[inherit] block" />

      {/* Button Text / Content */}
      <span className="relative z-10 flex items-center justify-center font-normal text-white px-4 py-2 text-sm whitespace-nowrap tracking-wide">
        {children}
      </span>
    </>
  );

  const baseStyles = `relative inline-flex items-center justify-center overflow-hidden rounded-none cursor-pointer border border-black bg-black select-none group hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200 ${className}`;

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        className={baseStyles}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={baseStyles}
      {...props}
    >
      {content}
    </button>
  );
};

export default ChromeButton;
