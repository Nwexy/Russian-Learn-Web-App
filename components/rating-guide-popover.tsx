"use client";

import { useState, useEffect, useRef } from "react";
import { useLang } from "@/lib/lang-context";
import { getMessages } from "@/lib/i18n";
import { HelpCircle } from "lucide-react";

interface RatingGuidePopoverProps {
  align?: "left" | "right" | "center";
  size?: number;
  className?: string;
}

export function RatingGuidePopover({
  align = "left",
  size = 18,
  className = "",
}: RatingGuidePopoverProps) {
  const { uiLang } = useLang();
  const t = getMessages(uiLang);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Dışarı tıklayınca kapat
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 200);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen((prev) => !prev);
  };

  const alignClass =
    align === "right"
      ? "review-help-popover-right"
      : align === "center"
      ? "review-help-popover-center"
      : "review-help-popover-left";

  return (
    <div
      className={`review-help-wrapper ${className}`}
      ref={wrapperRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        className="review-help-btn"
        onClick={handleClick}
        aria-label={t.reviewHelp}
        aria-expanded={open}
        title={t.reviewHelp}
      >
        <HelpCircle size={size} />
      </button>

      {open && (
        <div
          className={`review-help-popover ${alignClass}`}
          role="tooltip"
          onClick={(e) => e.stopPropagation()}
        >
          <h4 className="review-help-title">{t.reviewHelp}</h4>
          <ul className="review-help-list">
            <li>
              <span className="review-help-label review-help-again">{t.again}</span>
              <span className="review-help-desc">{t.againDesc}</span>
            </li>
            <li>
              <span className="review-help-label review-help-hard">{t.hard}</span>
              <span className="review-help-desc">{t.hardDesc}</span>
            </li>
            <li>
              <span className="review-help-label review-help-good">{t.good}</span>
              <span className="review-help-desc">{t.goodDesc}</span>
            </li>
            <li>
              <span className="review-help-label review-help-easy">{t.easy}</span>
              <span className="review-help-desc">{t.easyDesc}</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
