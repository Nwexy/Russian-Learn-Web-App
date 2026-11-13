"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { getMessages } from "@/lib/i18n";

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

export function FaqOnboarding() {
  const router = useRouter();
  const { uiLang } = useLang();
  const t = getMessages(uiLang);

  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);

  const updatePosition = useCallback(() => {
    if (typeof window === "undefined") return;
    const el = document.getElementById("navbar-faq-link");
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setTargetRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      bottom: rect.bottom,
      right: rect.right,
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const hasSeen = localStorage.getItem("hasSeenOnboarding");
      if (hasSeen === "true") {
        return;
      }
    } catch {
      return;
    }

    // Küçük bir gecikmeyle DOM ve navbar yerleşiminin tamamlanmasını bekle
    const timer = setTimeout(() => {
      updatePosition();
      setIsVisible(true);
    }, 150);

    const handleResize = () => updatePosition();
    const handleScroll = () => updatePosition();

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [updatePosition]);

  const markSeen = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("hasSeenOnboarding", "true");
      } catch {
        // localStorage hatası durumunda devam et
      }
    }
    setIsVisible(false);
  };

  const handleClose = () => {
    markSeen();
  };

  const handleGoToFaq = () => {
    markSeen();
    router.push("/faq");
  };

  if (!isVisible || !targetRect) {
    return null;
  }

  // Bilgi balonu yatay konumlandırması
  const balloonWidth = typeof window !== "undefined" ? Math.min(340, window.innerWidth - 32) : 340;
  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1200;

  let balloonLeft = targetRect.left + targetRect.width / 2 - balloonWidth / 2;
  if (balloonLeft + balloonWidth > viewportWidth - 16) {
    balloonLeft = viewportWidth - 16 - balloonWidth;
  }
  if (balloonLeft < 16) {
    balloonLeft = 16;
  }

  const arrowLeft = Math.max(16, Math.min(balloonWidth - 16, targetRect.left + targetRect.width / 2 - balloonLeft));

  return (
    <>
      {/* 1. Karartma Katmanı (Spotlight Kesiti ile) */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          top: `${Math.max(0, targetRect.top - 4)}px`,
          left: `${Math.max(0, targetRect.left - 6)}px`,
          width: `${targetRect.width + 12}px`,
          height: `${targetRect.height + 8}px`,
          borderRadius: "8px",
          boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.70), 0 0 20px 4px var(--accent, #3b82f6)",
          border: "2px solid var(--accent, #3b82f6)",
          zIndex: 9998,
          cursor: "pointer",
          transition: "top 0.15s ease, left 0.15s ease, width 0.15s ease, height 0.15s ease",
        }}
        title={t.goToFaq}
        role="button"
        tabIndex={0}
        aria-label={t.goToFaq}
      />

      {/* 2. Bilgi Balonu (Tooltip/Popover) */}
      <div
        style={{
          position: "fixed",
          top: `${targetRect.bottom + 12}px`,
          left: `${balloonLeft}px`,
          width: `${balloonWidth}px`,
          zIndex: 9999,
        }}
        className="bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Ok göstergesi */}
        <div
          style={{
            position: "absolute",
            top: "-7px",
            left: `${arrowLeft}px`,
            transform: "translateX(-50%) rotate(45deg)",
            width: "12px",
            height: "12px",
            background: "var(--bg-card)",
            borderLeft: "1px solid var(--border)",
            borderTop: "1px solid var(--border)",
          }}
        />

        {/* Üst Başlık ve X Butonu */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 font-bold text-sm text-[var(--accent)]">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{t.faqTitle}</span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
            aria-label={t.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Bilgilendirme Metni */}
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
          {t.onboardingFaqTooltip}
        </p>

        {/* Aksiyon Butonları */}
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="practice-btn practice-btn-secondary text-xs py-1.5 px-3"
          >
            {t.close}
          </button>
          <button
            type="button"
            onClick={handleGoToFaq}
            className="practice-btn practice-btn-primary text-xs py-1.5 px-3 font-semibold"
          >
            {t.goToFaq}
          </button>
        </div>
      </div>
    </>
  );
}
