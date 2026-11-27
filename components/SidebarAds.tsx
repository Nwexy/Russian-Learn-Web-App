"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Coffee, ExternalLink, X } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import {
  SUPPORT_AD_URL,
  SUPPORT_AD_HANDLE,
  getSupportAdCopy,
  type SupportAdCopy,
} from "@/lib/support-ad";

const AD_INTERVAL_MS = 180_000; // 3 dakika
const AD_DURATION_MS = 7_500; // 7.5 saniye
const STORAGE_KEY = "adsDismissed";

interface AdSlotProps {
  side: "left" | "right";
  copy: SupportAdCopy;
  onDismiss: () => void;
}

function AdSlot({ side, copy, onDismiss }: AdSlotProps) {
  const slideOffset = side === "left" ? -48 : 48;
  const sideBorder = side === "left" ? "border-r" : "border-l";

  return (
    <motion.div
      role="complementary"
      aria-label={side === "left" ? "Left support banner" : "Right support banner"}
      initial={{ opacity: 0, x: slideOffset }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: slideOffset }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`pointer-events-auto relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-none ${sideBorder} border-amber-500/25 bg-gradient-to-b from-amber-50/95 via-white/95 to-amber-50/90 text-slate-900 shadow-lg backdrop-blur-md dark:border-amber-400/20 dark:from-[#161c2e]/95 dark:via-[#111827]/95 dark:to-[#1a1f33]/95 dark:text-slate-100`}
    >
      {/* Subtle warm top glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#FFDD00]/15 to-transparent"
      />

      <button
        type="button"
        onClick={onDismiss}
        aria-label={copy.closeLabel}
        title={copy.closeLabel}
        className="absolute right-2.5 top-2.5 z-20 flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-200/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>

      <a
        href={SUPPORT_AD_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative z-10 flex h-full w-full flex-col items-center justify-center gap-5 px-4 py-10 text-center no-underline"
      >
        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:border-[#FFDD00]/30 dark:bg-[#FFDD00]/10 dark:text-[#FFDD00]">
          {copy.badge}
        </span>

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFDD00] text-slate-950 shadow-md shadow-[#FFDD00]/25 transition-transform duration-200 group-hover:scale-105">
          <Coffee className="h-7 w-7 stroke-[2.25]" />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white">
            {copy.title}
          </p>
          <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
            {copy.description}
          </p>
        </div>

        <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#FFDD00] px-3 py-2.5 text-xs font-bold text-slate-950 shadow-sm transition-all duration-200 group-hover:bg-[#ffea4d] group-hover:shadow-md">
          <span>{copy.cta}</span>
          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
        </span>

        <span className="mt-1 break-all font-mono text-[10px] text-slate-500 dark:text-slate-400">
          {SUPPORT_AD_HANDLE}
        </span>
      </a>
    </motion.div>
  );
}

export function SidebarAds() {
  const { uiLang } = useLang();
  const copy = getSupportAdCopy(uiLang);

  const [isVisible, setIsVisible] = useState(false);
  const [bounds, setBounds] = useState({ top: 65, bottom: 0 });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (hideTimeoutRef.current !== null) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const showAdsOnce = useCallback(() => {
    setIsVisible(true);

    if (hideTimeoutRef.current !== null) {
      clearTimeout(hideTimeoutRef.current);
    }

    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      hideTimeoutRef.current = null;
    }, AD_DURATION_MS);
  }, []);

  useEffect(() => {
    let rafId: number | null = null;

    const updateBounds = () => {
      rafId = null;
      const navbar = document.querySelector<HTMLElement>(".navbar");
      const footer = document.getElementById("app-footer");

      const top = navbar
        ? Math.max(0, Math.round(navbar.getBoundingClientRect().bottom))
        : 65;

      let bottom = 0;
      if (footer) {
        const footerTop = footer.getBoundingClientRect().top;
        if (footerTop < window.innerHeight) {
          bottom = Math.max(0, Math.round(window.innerHeight - footerTop));
        }
      }

      setBounds((prev) =>
        prev.top === top && prev.bottom === bottom ? prev : { top, bottom }
      );
    };

    const scheduleUpdate = () => {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(updateBounds);
      }
    };

    updateBounds();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate, { passive: true });

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(scheduleUpdate);
      resizeObserver.observe(document.body);
    }

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [isVisible]);

  useEffect(() => {
    const handleManualPreview = () => {
      showAdsOnce();
    };
    window.addEventListener("sidebar-ads:preview", handleManualPreview);

    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      dismissed = false;
    }

    if (!dismissed) {
      intervalRef.current = setInterval(() => {
        try {
          if (sessionStorage.getItem(STORAGE_KEY) === "true") {
            clearTimers();
            setIsVisible(false);
            return;
          }
        } catch {
          // sessionStorage erisilemiyorsa devam et
        }

        showAdsOnce();
      }, AD_INTERVAL_MS);
    }

    return () => {
      window.removeEventListener("sidebar-ads:preview", handleManualPreview);
      clearTimers();
    };
  }, [clearTimers, showAdsOnce]);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    clearTimers();
    try {
      sessionStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // sessionStorage yazma hatasi yoksayilir
    }
  }, [clearTimers]);

  const verticalStyle = {
    top: `${bounds.top}px`,
    bottom: `${bounds.bottom}px`,
  };

  return (
    <>
      <div
        style={verticalStyle}
        className="pointer-events-none fixed left-0 z-30 hidden w-44 lg:flex"
      >
        <AnimatePresence>
          {isVisible && (
            <AdSlot key="left-ad" side="left" copy={copy} onDismiss={handleDismiss} />
          )}
        </AnimatePresence>
      </div>

      <div
        style={verticalStyle}
        className="pointer-events-none fixed right-0 z-30 hidden w-44 lg:flex"
      >
        <AnimatePresence>
          {isVisible && (
            <AdSlot key="right-ad" side="right" copy={copy} onDismiss={handleDismiss} />
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
