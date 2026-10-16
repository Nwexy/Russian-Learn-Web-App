/**
 * Okunuş (telaffuz) gösterimi — components/pronunciation-text.tsx
 * Faz 5.1: Her zaman pronunciationEn gösterilir (arayüz ve çeviri dilinden bağımsız).
 * pronunciationEn yoksa hiçbir şey render edilmez (boş satır kalmaz).
 */

"use client";

import { useLang } from "@/lib/lang-context";
import { getMessages } from "@/lib/i18n";
import { getPronunciation } from "@/lib/exercises";

interface PronunciationTextProps {
  item: { pronunciationEn?: string };
  /** Okunuş yoksa bilgi notu göster (varsayılan false) */
  showMissing?: boolean;
  /** Ek CSS sınıfı (örn. hizalama) */
  className?: string;
}

export function PronunciationText({ item, showMissing = false, className = "" }: PronunciationTextProps) {
  const { uiLang, showPronunciation } = useLang();

  // Telaffuz ayarı kapalıysa hiçbir yerde render etme
  if (!showPronunciation) return null;

  const t = getMessages(uiLang);
  const text = getPronunciation(item);

  // pronunciationEn boşsa hiçbir şey gösterme (boş satır kalmasın)
  if (!text) {
    if (!showMissing) return null;
    return (
      <div className={`pronunciation pronunciation-missing ${className}`}>
        {t.pronunciationNotAvailable}
      </div>
    );
  }

  return (
    <div className={`pronunciation ${className}`} title={t.pronunciation} aria-label={`${t.pronunciation}: ${text}`}>
      [{text}]
    </div>
  );
}

