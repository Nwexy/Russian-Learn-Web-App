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
  setUiLang: (lang: Lang) => void;
  setTranslationLang: (lang: Lang) => void;
}

const LangContext = createContext<LangContextValue | undefined>(undefined);

/** Varsayılan diller */
const DEFAULT_UI_LANG: Lang = "tr";
const DEFAULT_TRANSLATION_LANG: Lang = "tr";

export function LangProvider({ children }: { children: ReactNode }) {
  const [uiLang, setUiLangState] = useState<Lang>(DEFAULT_UI_LANG);
  const [translationLang, setTranslationLangState] = useState<Lang>(DEFAULT_TRANSLATION_LANG);
  const [mounted, setMounted] = useState(false);

  // Dexie'den kayıtlı dil tercihlerini oku
  useEffect(() => {
    async function loadSettings() {
      try {
        const uiSetting = await db.settings.get("uiLang");
        const trSetting = await db.settings.get("translationLang");

        if (uiSetting && (uiSetting.value === "tr" || uiSetting.value === "en")) {
          setUiLangState(uiSetting.value as Lang);
        }
        if (trSetting && (trSetting.value === "tr" || trSetting.value === "en")) {
          setTranslationLangState(trSetting.value as Lang);
        }
      } catch (err) {
        console.error("[Lang] Dil ayarları okunamadı:", err);
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

  // Hydration mismatch'i önlemek için mount bekle
  if (!mounted) {
    return <div className="min-h-screen" style={{ background: "var(--bg-primary)" }} />;
  }

  return (
    <LangContext.Provider value={{ uiLang, translationLang, setUiLang, setTranslationLang }}>
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
