/**
 * Ayarlar sayfası — /settings
 * Tema, arayüz dili ve çeviri dili seçimleri.
 * Tüm değişiklikler anında uygulanır ve Dexie'ye kaydedilir.
 */

"use client";

import { useTheme } from "@/components/theme-provider";
import { useLang } from "@/lib/lang-context";
import { getMessages } from "@/lib/i18n";
import type { Lang } from "@/types";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { uiLang, translationLang, setUiLang, setTranslationLang } = useLang();
  const t = getMessages(uiLang);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">{t.settings}</h1>
        <p className="page-subtitle">{t.settingsDesc}</p>
      </div>

      {/* Dil Ayarları — Arayüz Dili */}
      <div className="settings-section">
        <h2 className="settings-section-title">{t.uiLanguage}</h2>
        <div className="settings-row">
          <div className="settings-label">
            <span className="settings-label-text">{t.uiLanguage}</span>
            <span className="settings-label-desc">{t.uiLanguageDesc}</span>
          </div>
          <div className="lang-selector">
            <button
              className={`lang-option ${uiLang === "tr" ? "lang-option-active" : ""}`}
              onClick={() => setUiLang("tr" as Lang)}
            >
              {t.turkish}
            </button>
            <button
              className={`lang-option ${uiLang === "en" ? "lang-option-active" : ""}`}
              onClick={() => setUiLang("en" as Lang)}
            >
              {t.english}
            </button>
          </div>
        </div>
      </div>

      {/* Dil Ayarları — Çeviri Dili */}
      <div className="settings-section">
        <h2 className="settings-section-title">{t.translationLanguage}</h2>
        <div className="settings-row">
          <div className="settings-label">
            <span className="settings-label-text">{t.translationLanguage}</span>
            <span className="settings-label-desc">{t.translationLanguageDesc}</span>
          </div>
          <div className="lang-selector">
            <button
              className={`lang-option ${translationLang === "tr" ? "lang-option-active" : ""}`}
              onClick={() => setTranslationLang("tr" as Lang)}
            >
              {t.turkish}
            </button>
            <button
              className={`lang-option ${translationLang === "en" ? "lang-option-active" : ""}`}
              onClick={() => setTranslationLang("en" as Lang)}
            >
              {t.english}
            </button>
          </div>
        </div>
      </div>

      {/* Görünüm */}
      <div className="settings-section">
        <h2 className="settings-section-title">{t.appearance}</h2>
        <div className="settings-row">
          <div className="settings-label">
            <span className="settings-label-text">{t.darkTheme}</span>
            <span className="settings-label-desc">
              {theme === "dark" ? t.darkModeActive : t.lightModeActive}
            </span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={theme === "dark"}
              onChange={toggleTheme}
            />
            <span className="toggle-slider" />
          </label>
        </div>
      </div>

      {/* Hakkında */}
      <div className="settings-section">
        <h2 className="settings-section-title">{t.about}</h2>
        <div className="settings-row">
          <div className="settings-label">
            <span className="settings-label-text">{t.version}</span>
            <span className="settings-label-desc">0.2.0 — Faz 1.5</span>
          </div>
        </div>
        <div className="settings-row">
          <div className="settings-label">
            <span className="settings-label-text">{t.dataStorage}</span>
            <span className="settings-label-desc">{t.dataStorageDesc}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
