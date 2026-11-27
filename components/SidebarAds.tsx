"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

const AD_INTERVAL_MS = 180_000; // 3 dakika
const AD_DURATION_MS = 15_000; // 15 saniye
const STORAGE_KEY = "adsDismissed";

interface AdSlotProps {
  side: "left" | "right";
  onDismiss: () => void;
}

function AdSlot({ side, onDismiss }: AdSlotProps) {
  const slideOffset = side === "left" ? -48 : 48;

  return (
    <motion.div
      role="complementary"
      aria-label={side === "left" ? "Left advertisement placeholder" : "Right advertisement placeholder"}
      initial={{ opacity: 0, x: slideOffset }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: slideOffset }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="pointer-events-auto relative flex h-full w-full flex-col items-center justify-center rounded-none border-2 border-dashed border-gray-400/50 bg-gray-100/80 p-3 text-center text-gray-500 shadow-sm backdrop-blur-sm dark:border-gray-600/70 dark:bg-gray-900/75 dark:text-gray-400"
    >
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Reklami kapat"
        title="Reklami kapat"
        className="absolute right-2.5 top-2.5 flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="select-none px-2">
        <p className="text-xs font-semibold leading-snug tracking-wide">
          Reklam Alanı / Ad Space
        </p>
      </div>
    </motion.div>
  );
}

export function SidebarAds() {
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
          {isVisible && <AdSlot key="left-ad" side="left" onDismiss={handleDismiss} />}
        </AnimatePresence>
      </div>

      <div
        style={verticalStyle}
        className="pointer-events-none fixed right-0 z-30 hidden w-44 lg:flex"
      >
        <AnimatePresence>
          {isVisible && <AdSlot key="right-ad" side="right" onDismiss={handleDismiss} />}
        </AnimatePresence>
      </div>
    </>
  );
}
