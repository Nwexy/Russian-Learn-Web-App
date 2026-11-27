"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Coffee, ExternalLink, X } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import {
  SUPPORT_AD_URL,
  SUPPORT_AD_HANDLE,
  getSupportAdCopy,
} from "@/lib/support-ad";

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
  const { uiLang } = useLang();
  const copy = getSupportAdCopy(uiLang);

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
            aria-label="Mobile support banner"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="pointer-events-auto relative flex h-[100px] w-full items-center border-t border-amber-500/30 bg-gradient-to-r from-amber-50/95 via-white/95 to-amber-50/95 px-4 pr-10 text-slate-900 shadow-xl backdrop-blur-md dark:border-amber-400/25 dark:from-[#161c2e]/95 dark:via-[#111827]/95 dark:to-[#1a1f33]/95 dark:text-slate-100"
          >
            <button
              type="button"
              onClick={handleDismiss}
              aria-label={copy.closeLabel}
              title={copy.closeLabel}
              className="absolute right-2 top-2 z-20 flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-200/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            <a
              href={SUPPORT_AD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex w-full items-center justify-between gap-3 no-underline"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFDD00] text-slate-950 shadow-sm shadow-[#FFDD00]/25">
                  <Coffee className="h-6 w-6 stroke-[2.25]" />
                </div>

                <div className="min-w-0 text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-[#FFDD00]">
                      {copy.badge}
                    </span>
                    <span className="truncate font-mono text-[10px] text-slate-400 dark:text-slate-500">
                      {SUPPORT_AD_HANDLE}
                    </span>
                  </div>
                  <p className="truncate text-sm font-extrabold leading-tight text-slate-900 dark:text-white">
                    {copy.title}
                  </p>
                  <p className="truncate text-xs text-slate-600 dark:text-slate-300">
                    {copy.mobileSubtitle}
                  </p>
                </div>
              </div>

              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#FFDD00] px-3 py-2 text-xs font-bold text-slate-950 shadow-sm transition-colors group-hover:bg-[#ffea4d]">
                <span>{copy.cta}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </span>
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
