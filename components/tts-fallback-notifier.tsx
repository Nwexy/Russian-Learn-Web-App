"use client";

import { useEffect } from "react";
import { useLang } from "@/lib/lang-context";
import { onVoicesReady, hasRussianVoice, notifyTtsFallbackIfNeeded } from "@/lib/tts";

/**
 * Faz 12.3: Tarayıcıda yüklü Rusça TTS ses paketi bulunmayan cihazlarda,
 * kullanıcıya ResponsiveVoice yedek sisteminin devrede olduğunu bildiren bileşen.
 * Bildirim localStorage kontrolü ile sadece bir kez gösterilir.
 */
export function TtsFallbackNotifier() {
  const { uiLang } = useLang();

  useEffect(() => {
    // Daha önce bildirim gösterilmişse işlem yapma
    if (typeof window === "undefined") return;
    try {
      if (localStorage.getItem("ttsFallbackNotified") === "true") {
        return;
      }
    } catch {
      return;
    }

    // Ses listesinin tarayıcıda yüklenmesini bekle
    const cleanup = onVoicesReady(() => {
      if (!hasRussianVoice()) {
        notifyTtsFallbackIfNeeded(uiLang);
      }
    });

    return () => {
      cleanup();
    };
  }, [uiLang]);

  return null;
}

