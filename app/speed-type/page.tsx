"use client";

import React from "react";
import Link from "next/link";
import { SpeedTypeTest } from "@/components/SpeedTypeTest";

export default function SpeedTypePage() {
  return (
    <div className="page-container min-h-[calc(100vh-64px)] flex flex-col items-center">
      <div className="w-full max-w-[1200px] flex items-center justify-between mb-4">
        <Link
          href="/practice"
          className="back-link inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Practice</span>
        </Link>
        <span className="text-xs tracking-wider uppercase font-mono text-muted-foreground">
          SpeedType
        </span>
      </div>

      <SpeedTypeTest initialLanguage="russian_1k" />
    </div>
  );
}
