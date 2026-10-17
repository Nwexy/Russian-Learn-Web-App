/**
 * Ayarlar sayfası — /settings
 * Tema, arayüz dili, çeviri dili ve veri yönetimi.
 * Tüm değişiklikler anında uygulanır ve Dexie'ye kaydedilir.
 */

"use client";

import { useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { useLang } from "@/lib/lang-context";
import { getMessages } from "@/lib/i18n";
import { clearAllMistakes } from "@/lib/mistakes";
import { FlagTr, FlagUs } from "@/components/icons/flag-icons";
import type { Lang } from "@/types";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { uiLang, translationLang, showPronunciation, setUiLang, setTranslationLang, setShowPronunciation } = useLang();
  const t = getMessages(uiLang);
  const [cleared, setCleared] = useState(false);

  const handleClearMistakes = async () => {
    const confirmed = window.confirm(t.confirmClear);
    if (!confirmed) return;
    await clearAllMistakes();
    setCleared(true);
    setTimeout(() => setCleared(false), 3000);
  };

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
              type="button"
              className={`lang-option ${uiLang === "tr" ? "lang-option-active" : ""}`}
              onClick={() => setUiLang("tr" as Lang)}
              title={t.turkish}
              aria-label={t.turkish}
            >
              <FlagTr className="flag-icon" />
            </button>
            <button
              type="button"
              className={`lang-option ${uiLang === "en" ? "lang-option-active" : ""}`}
              onClick={() => setUiLang("en" as Lang)}
              title={t.english}
              aria-label={t.english}
            >
              <FlagUs className="flag-icon" />
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
              type="button"
              className={`lang-option ${translationLang === "tr" ? "lang-option-active" : ""}`}
              onClick={() => setTranslationLang("tr" as Lang)}
              title={t.turkish}
              aria-label={t.turkish}
            >
              <FlagTr className="flag-icon" />
            </button>
            <button
              type="button"
              className={`lang-option ${translationLang === "en" ? "lang-option-active" : ""}`}
              onClick={() => setTranslationLang("en" as Lang)}
              title={t.english}
              aria-label={t.english}
            >
              <FlagUs className="flag-icon" />
            </button>
          </div>
        </div>
      </div>

      {/* Görünüm / Display */}
      <div className="settings-section">
        <h2 className="settings-section-title">{t.display}</h2>
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
        <div className="settings-row">
          <div className="settings-label">
            <span className="settings-label-text">{t.showPronunciations}</span>
            <span className="settings-label-desc">
              {showPronunciation
                ? (uiLang === "tr" ? "Telaffuzlar gösteriliyor." : "Pronunciations are shown.")
                : (uiLang === "tr" ? "Telaffuzlar gizli." : "Pronunciations are hidden.")}
            </span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={showPronunciation}
              onChange={(e) => setShowPronunciation(e.target.checked)}
            />
            <span className="toggle-slider" />
          </label>
        </div>
      </div>

      {/* Veri */}
      <div className="settings-section">
        <h2 className="settings-section-title">{t.dataSection}</h2>
        <div className="settings-row">
          <div className="settings-label">
            <span className="settings-label-text">{t.clearMistakes}</span>
            <span className="settings-label-desc">
              {cleared ? t.mistakesCleared : t.confirmClear}
            </span>
          </div>
          <button
            className="settings-danger-btn"
            onClick={handleClearMistakes}
            disabled={cleared}
          >
            {cleared ? t.mistakesCleared : t.clearMistakes}
          </button>
        </div>
      </div>

      {/* Hakkında */}
      <div className="settings-section">
        <h2 className="settings-section-title">{t.about}</h2>
        <div className="settings-row">
          <div className="settings-label">
            <span className="settings-label-text">{t.version}</span>
            <span className="settings-label-desc">0.4.0 — Faz 3.5</span>
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
