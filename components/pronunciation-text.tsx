/**
 * Okunuş (telaffuz) gösterimi.
 * pronunciationLang = translationLang: çeviri dili Türkçe ise pronunciationTr,
 * İngilizce ise pronunciationEn gösterilir. Alan yoksa hiçbir şey render edilmez
 * (showMissing=true verilirse "okunuş bilgisi yok" notu gösterilir).
 */

"use client";

import { useLang } from "@/lib/lang-context";
import { getMessages } from "@/lib/i18n";
import { getPronunciation } from "@/lib/exercises";

interface PronunciationTextProps {
  item: { pronunciationTr?: string; pronunciationEn?: string };
  /** Okunuş yoksa bilgi notu göster */
  showMissing?: boolean;
  /** Ek CSS sınıfı (örn. hizalama) */
  className?: string;
}

export function PronunciationText({ item, showMissing = false, className = "" }: PronunciationTextProps) {
  const { uiLang, translationLang, showPronunciation } = useLang();

  // Telaffuz ayarı kapalıysa hiçbir yerde render etme
  if (!showPronunciation) return null;

  const t = getMessages(uiLang);
  const text = getPronunciation(item, translationLang);

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
