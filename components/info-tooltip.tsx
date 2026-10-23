"use client";

import { useState, useEffect, useRef } from "react";
import { HelpCircle } from "lucide-react";

interface InfoTooltipProps {
  content: string;
  title?: string;
  align?: "left" | "right" | "center";
  size?: number;
  className?: string;
}

export function InfoTooltip({
  content,
  title,
  align = "left",
  size = 16,
  className = "",
}: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      ? "info-tooltip-popover-right"
      : align === "center"
      ? "info-tooltip-popover-center"
      : "info-tooltip-popover-left";

  return (
    <div
      className={`info-tooltip-wrapper ${className}`}
      ref={wrapperRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        className="info-tooltip-btn"
        onClick={handleClick}
        aria-label={title || "Information"}
        aria-expanded={open}
      >
        <HelpCircle size={size} />
      </button>

      {open && (
        <div
          className={`info-tooltip-popover ${alignClass}`}
          role="tooltip"
          onClick={(e) => e.stopPropagation()}
        >
          {title && <h4 className="info-tooltip-title">{title}</h4>}
          <p className="info-tooltip-text">{content}</p>
        </div>
      )}
    </div>
  );
}
