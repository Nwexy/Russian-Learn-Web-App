/**
 * Dil yönetimi context'i.
 * İki bağımsız dil ayarı tutar:
 *   - uiLang: Arayüz dili (menü, başlık, butonlar)
 *   - translationLang: Çeviri dili (Rusça kelimelerin karşılığı)
 *
 * Açılışta Dexie settings tablosundan okunur.
 * Değişiklikler hem state'e hem Dexie'ye yazılır.
 */

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { db } from "@/lib/db";
import type { Lang } from "@/types";

interface LangContextValue {
  uiLang: Lang;
  translationLang: Lang;
  showPronunciation: boolean;
  setUiLang: (lang: Lang) => void;
  setTranslationLang: (lang: Lang) => void;
  setShowPronunciation: (val: boolean) => void;
}

const LangContext = createContext<LangContextValue | undefined>(undefined);

/** Varsayılan diller ve ayarlar */
const DEFAULT_UI_LANG: Lang = "tr";
const DEFAULT_TRANSLATION_LANG: Lang = "tr";
const DEFAULT_SHOW_PRONUNCIATION: boolean = true;

export function LangProvider({ children }: { children: ReactNode }) {
  const [uiLang, setUiLangState] = useState<Lang>(DEFAULT_UI_LANG);
  const [translationLang, setTranslationLangState] = useState<Lang>(DEFAULT_TRANSLATION_LANG);
  const [showPronunciation, setShowPronunciationState] = useState<boolean>(DEFAULT_SHOW_PRONUNCIATION);
  const [mounted, setMounted] = useState(false);

  // Dexie'den kayıtlı dil tercihlerini ve ayarları oku
  useEffect(() => {
    async function loadSettings() {
      try {
        const uiSetting = await db.settings.get("uiLang");
        const trSetting = await db.settings.get("translationLang");
        const pronSetting = await db.settings.get("showPronunciation");

        if (uiSetting && (uiSetting.value === "tr" || uiSetting.value === "en")) {
          setUiLangState(uiSetting.value as Lang);
        }
        if (trSetting && (trSetting.value === "tr" || trSetting.value === "en")) {
          setTranslationLangState(trSetting.value as Lang);
        }
        if (pronSetting) {
          setShowPronunciationState(pronSetting.value !== "false");
        } else {
          // Varsayılan açık
          setShowPronunciationState(true);
        }
      } catch (err) {
        console.error("[Lang] Dil/telaffuz ayarları okunamadı:", err);
      }
      setMounted(true);
    }
    loadSettings();
  }, []);

  // Arayüz dilini değiştir (state + Dexie)
  const setUiLang = useCallback((lang: Lang) => {
    setUiLangState(lang);
    db.settings.put({ key: "uiLang", value: lang }).catch((err) =>
      console.error("[Lang] uiLang kaydedilemedi:", err)
    );
  }, []);

  // Çeviri dilini değiştir (state + Dexie)
  const setTranslationLang = useCallback((lang: Lang) => {
    setTranslationLangState(lang);
    db.settings.put({ key: "translationLang", value: lang }).catch((err) =>
      console.error("[Lang] translationLang kaydedilemedi:", err)
    );
  }, []);

  // Telaffuz görünürlüğünü değiştir (state + Dexie)
  const setShowPronunciation = useCallback((val: boolean) => {
    setShowPronunciationState(val);
    db.settings.put({ key: "showPronunciation", value: val ? "true" : "false" }).catch((err) =>
      console.error("[Lang] showPronunciation kaydedilemedi:", err)
    );
  }, []);

  // Hydration mismatch'i önlemek için mount bekle
  if (!mounted) {
    return <div className="min-h-screen" style={{ background: "var(--bg-primary)" }} />;
  }

  return (
    <LangContext.Provider
      value={{
        uiLang,
        translationLang,
        showPronunciation,
        setUiLang,
        setTranslationLang,
        setShowPronunciation,
      }}
    >
      {children}
    </LangContext.Provider>
  );
}

/** Dil hook'u — LangProvider içinde kullanılmalı */
export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}
