"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

const AD_INTERVAL_MS = 180_000; // 3 dakika
const AD_DURATION_MS = 15_000; // 15 saniye
const STORAGE_KEY = "mobileAdDismissed";

function isExcludedPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname === "/test-yourself" ||
    pathname.startsWith("/test-yourself/") ||
    pathname === "/practice" ||
    pathname.startsWith("/practice/")
  );
}

export function MobileBottomAd() {
  const pathname = usePathname();
  const excluded = isExcludedPath(pathname);

  const [isVisible, setIsVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const excludedRef = useRef(excluded);

  useEffect(() => {
    excludedRef.current = excluded;
    if (excluded) {
      setIsVisible(false);
      if (hideTimeoutRef.current !== null) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    }
  }, [excluded]);

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

  const showAdOnce = useCallback(() => {
    if (excludedRef.current) return;

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
    const handleManualPreview = () => {
      showAdOnce();
    };
    window.addEventListener("mobile-ad:preview", handleManualPreview);

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

        if (!excludedRef.current) {
          showAdOnce();
        }
      }, AD_INTERVAL_MS);
    }

    return () => {
      window.removeEventListener("mobile-ad:preview", handleManualPreview);
      clearTimers();
    };
  }, [clearTimers, showAdOnce]);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    clearTimers();
    try {
      sessionStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // sessionStorage yazma hatasi yoksayilir
    }
  }, [clearTimers]);

  if (excluded) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-0 left-0 z-50 block w-full lg:hidden ${
        isVisible ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      <AnimatePresence>
        {isVisible && (
          <motion.div
            key="mobile-bottom-ad"
            role="complementary"
            aria-label="Mobile advertisement placeholder"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="pointer-events-auto relative flex h-[100px] w-full items-center justify-center border-t-2 border-dashed border-gray-400/50 bg-gray-100/95 px-10 text-center text-gray-600 shadow-lg backdrop-blur-md dark:border-gray-600/70 dark:bg-gray-900/95 dark:text-gray-300"
          >
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Reklami kapat"
              title="Reklami kapat"
              className="absolute right-2 top-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            <div className="flex flex-col items-center justify-center select-none">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Sponsorlu / Ad
              </span>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                Reklam Alanı / Mobile Banner Space
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

