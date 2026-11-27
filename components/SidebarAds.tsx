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
  const slideOffset = side === "left" ? -32 : 32;

  return (
    <motion.div
      role="complementary"
      aria-label={side === "left" ? "Left advertisement placeholder" : "Right advertisement placeholder"}
      initial={{ opacity: 0, x: slideOffset }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: slideOffset }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="pointer-events-auto relative flex h-full w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-400/50 bg-gray-100/80 p-3 text-center text-gray-500 shadow-sm backdrop-blur-sm dark:border-gray-600/70 dark:bg-gray-900/75 dark:text-gray-400"
    >
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Reklami kapat"
        title="Reklami kapat"
        className="absolute right-2 top-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="select-none px-1">
        <p className="text-xs font-semibold leading-snug tracking-wide">
          Reklam Alanı / Ad Space
        </p>
      </div>
    </motion.div>
  );
}

export function SidebarAds() {
  const [isVisible, setIsVisible] = useState(false);
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

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      dismissed = false;
    }

    if (dismissed) {
      return;
    }

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

      setIsVisible(true);

      if (hideTimeoutRef.current !== null) {
        clearTimeout(hideTimeoutRef.current);
      }

      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        hideTimeoutRef.current = null;
      }, AD_DURATION_MS);
    }, AD_INTERVAL_MS);

    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    clearTimers();
    try {
      sessionStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // sessionStorage yazma hatasi yoksayilir
    }
  }, [clearTimers]);

  return (
    <>
      <div className="pointer-events-none fixed bottom-24 left-4 top-24 z-30 hidden w-32 lg:flex">
        <AnimatePresence>
          {isVisible && <AdSlot key="left-ad" side="left" onDismiss={handleDismiss} />}
        </AnimatePresence>
      </div>

      <div className="pointer-events-none fixed bottom-24 right-4 top-24 z-30 hidden w-32 lg:flex">
        <AnimatePresence>
          {isVisible && <AdSlot key="right-ad" side="right" onDismiss={handleDismiss} />}
        </AnimatePresence>
      </div>
    </>
  );
}
