/**
 * Seslendirme (TTS) butonu bileşeni — components/SpeakButton.tsx
 *
 * Props:
 *  - text: Seslendirilecek metin (zorunlu)
 *  - lang: Dil kodu (varsayılan: "ru-RU")
 *  - size: Buton boyutu ("sm" | "md", varsayılan "sm")
 *  - variant: Görüntüleme tipi ("inline" | "block", varsayılan "inline")
 *  - showLabel: "Dinle" metni gösterilsin mi (opsiyonel)
 *  - label: Özel buton etiketi (opsiyonel)
 *
 * Tıklanınca lib/tts.ts speak(text, lang) fonksiyonunu çağırır.
 * Tarayıcı TTS desteklemiyorsa render edilmez.
 */

"use client";

import React, { useState, useEffect } from "react";
import { speak, isTTSSupported } from "@/lib/tts";

export interface SpeakButtonProps {
  text: string;
  lang?: string;
  size?: "sm" | "md";
  variant?: "inline" | "block";
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export function SpeakButton({
  text,
  lang = "ru-RU",
  size = "sm",
  variant = "inline",
  showLabel = false,
  label,
  className = "",
}: SpeakButtonProps) {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(isTTSSupported());
  }, []);

  if (!supported || !text) return null;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    speak(text, lang);
  };

  return (
    <button
      type="button"
      className={`speak-btn speak-btn-${size} speak-btn-${variant} ${className}`.trim()}
      onClick={handleClick}
      aria-label="Seslendir"
      title="Seslendir"
    >
      <span className="speak-btn-icon" aria-hidden="true">🔊</span>
      {showLabel && <span className="speak-btn-text">{label ?? "Dinle"}</span>}
    </button>
  );
}

export default SpeakButton;
