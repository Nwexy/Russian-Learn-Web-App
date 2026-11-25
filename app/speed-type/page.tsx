"use client";

import React from "react";
import Link from "next/link";
import { SpeedTypeTest } from "@/components/SpeedTypeTest";

export default function SpeedTypePage() {
  return (
    <div className="min-h-screen py-6 px-4 bg-[#1a1a1d] text-[#e2e2e6] flex flex-col items-center">
      <div className="w-full max-w-[1200px] flex items-center justify-between mb-4 px-4">
        <Link
          href="/"
          className="text-sm font-semibold text-[#8a8b8c] hover:text-[#e2e2e6] transition-colors flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg border border-white/10"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Home</span>
        </Link>
        <span className="text-xs tracking-wider uppercase font-mono text-[#8a8b8c]">
          SpeedType
        </span>
      </div>

      <SpeedTypeTest initialLanguage="russian" />
    </div>
  );
}
