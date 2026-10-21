/**
 * Ayarlar sayfası — /settings
 * Tema, arayüz dili, çeviri dili ve veri yönetimi.
 * Tüm değişiklikler anında uygulanır ve Dexie'ye kaydedilir.
 */

"use client";

import { useRef, useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { useLang } from "@/lib/lang-context";
import { getMessages } from "@/lib/i18n";
import { clearAllMistakes } from "@/lib/mistakes";
import { exportData, importData } from "@/lib/backup";
import { FlagTr, FlagUs } from "@/components/icons/flag-icons";
import type { Lang } from "@/types";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { uiLang, translationLang, showPronunciation, setUiLang, setTranslationLang, setShowPronunciation } = useLang();
  const t = getMessages(uiLang);
  const [cleared, setCleared] = useState(false);
  const [waInput, setWaInput] = useState("");
  const [gmSubject, setGmSubject] = useState("");
  const [gmBody, setGmBody] = useState("");

  const handleWaSend = () => {
    const text = waInput.trim();
    const url = text
      ? `https://wa.me/905303757760?text=${encodeURIComponent(text)}`
      : `https://wa.me/905303757760`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleGmSend = () => {
    const to = "ezheldenuz@gmail.com";
    const su = encodeURIComponent(gmSubject.trim());
    const body = encodeURIComponent(gmBody.trim());
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${su}&body=${body}`;
    window.open(gmailUrl, "_blank", "noopener,noreferrer");
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleClearMistakes = async () => {
    const confirmed = window.confirm(t.confirmClear);
    if (!confirmed) return;
    await clearAllMistakes();
    setCleared(true);
    setTimeout(() => setCleared(false), 3000);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportData();
      setStatusMessage({ type: "success", text: t.exportSuccess });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: unknown) {
      console.error("Export error:", err);
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : t.importError,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    const confirmed = window.confirm(t.confirmImportWarning);
    if (!confirmed) return;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setStatusMessage(null);

    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        if (!content) {
          throw new Error(t.importError);
        }
        await importData(content);
        setStatusMessage({ type: "success", text: t.importSuccess });
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } catch (err: unknown) {
        console.error("Import error:", err);
        const errMsg = err instanceof Error ? err.message : t.importError;
        setStatusMessage({
          type: "error",
          text: `${t.importError} (${errMsg})`,
        });
        setIsImporting(false);
      }
    };

    reader.onerror = () => {
      setStatusMessage({ type: "error", text: t.importError });
      setIsImporting(false);
    };

    reader.readAsText(file);
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

      {/* Veri Yonetimi / Data Management */}
      <div className="settings-section">
        <h2 className="settings-section-title">{t.dataManagement}</h2>
        <div className="settings-row">
          <div className="settings-label">
            <span className="settings-label-text">{t.exportData}</span>
            <span className="settings-label-desc">
              {uiLang === "tr"
                ? "Tüm ilerlemenizi, kelime geçmişinizi ve ayarlarınızı JSON dosyası olarak indirin."
                : "Download all your progress, vocabulary history, and settings as a JSON file."}
            </span>
          </div>
          <button
            type="button"
            className="settings-action-btn"
            onClick={handleExport}
            disabled={isExporting}
          >
            {t.exportData}
          </button>
        </div>
        <div className="settings-row">
          <div className="settings-label">
            <span className="settings-label-text">{t.importData}</span>
            <span className="settings-label-desc">
              {uiLang === "tr"
                ? "Daha önce indirdiğiniz JSON yedek dosyasını yükleyerek tüm verilerinizi geri getirin."
                : "Upload a previously downloaded JSON backup file to restore all your data."}
            </span>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <button
              type="button"
              className="settings-action-btn"
              onClick={handleImportClick}
              disabled={isImporting}
            >
              {t.importData}
            </button>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`settings-feedback ${statusMessage.type === "error"
              ? "settings-feedback-error"
              : "settings-feedback-success"
              }`}
          >
            {statusMessage.text}
          </div>
        )}
      </div>

      {/* Hakkında */}
      <div className="settings-section">
        <h2 className="settings-section-title">{t.about}</h2>

        {/* Sosyal Medya İkonları (Görsel 2 Stili — Standalone Vektör SVG) */}
        <div className="social-icons">
          <a
            href="https://discord.com/users/616186436550656000"
            target="_blank"
            rel="noopener noreferrer"
            className="social-btn discord"
            data-i18n-tooltip="tooltip_discord"
            data-tooltip="Discord"
            title="Discord"
            aria-label="Discord"
          >
            <svg className="social-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
          </a>
          <a
            href="https://github.com/nwexy"
            target="_blank"
            rel="noopener noreferrer"
            className="social-btn github"
            data-i18n-tooltip="tooltip_github"
            data-tooltip="GitHub"
            title="GitHub"
            aria-label="GitHub"
          >
            <svg className="social-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>
          <a
            href="https://instagram.com/msdeniz966"
            target="_blank"
            rel="noopener noreferrer"
            className="social-btn instagram"
            data-i18n-tooltip="tooltip_instagram"
            data-tooltip="Instagram"
            title="Instagram"
            aria-label="Instagram"
          >
            <svg className="social-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
            </svg>
          </a>
          <a
            href="https://wa.me/905303757760"
            target="_blank"
            rel="noopener noreferrer"
            className="social-btn whatsapp"
            data-i18n-tooltip="tooltip_whatsapp"
            data-tooltip="WhatsApp"
            title="WhatsApp"
            aria-label="WhatsApp"
          >
            <svg className="social-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.301-.15-1.78-.879-2.056-.98-.276-.1-.476-.15-.677.15-.2.301-.777.98-.953 1.18-.175.2-.351.226-.652.075-.301-.15-1.27-.468-2.42-1.493-.895-.798-1.5-1.784-1.675-2.085-.176-.301-.019-.464.132-.614.136-.135.301-.351.451-.527.151-.175.201-.3.301-.501.1-.2.05-.376-.025-.526-.075-.151-.677-1.632-.928-2.233-.244-.585-.492-.506-.677-.515-.175-.009-.376-.011-.577-.011-.201 0-.527.075-.802.376-.276.301-1.053 1.028-1.053 2.508s1.078 2.909 1.229 3.109c.15.2 2.122 3.24 5.14 4.544.718.31 1.279.495 1.716.634.721.23 1.377.198 1.896.12.578-.087 1.78-.727 2.031-1.43.25-.702.25-1.304.175-1.43-.075-.125-.276-.2-.577-.35zM12.042 21.688c-1.74 0-3.447-.468-4.95-1.356l-.355-.21-3.684.966.983-3.593-.23-.367A9.68 9.68 0 0 1 2.37 12.04C2.37 6.708 6.708 2.37 12.042 2.37c2.584 0 5.013 1.007 6.84 2.835 1.828 1.828 2.834 4.257 2.834 6.84 0 5.334-4.338 9.643-9.674 9.643zm0-17.688c-4.417 0-8.01 3.593-8.01 8.01 0 1.41.368 2.784 1.066 3.993l.25.433-.633 2.316 2.368-.62.42.25a7.973 7.973 0 0 0 3.539.828c4.417 0 8.01-3.593 8.01-8.01 0-2.14-.833-4.152-2.347-5.666a7.96 7.96 0 0 0-5.663-2.334z" />
            </svg>
          </a>
          <a
            href="mailto:ezheldenuz@gmail.com"
            className="social-btn gmail"
            data-i18n-tooltip="tooltip_email"
            data-tooltip="Email"
            title="Email"
            aria-label="Email"
          >
            <svg className="social-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </a>
        </div>

        {/* İletişim Mockup Kartları */}
        <div className="contact-wrapper">
          {/* DISCORD PROFİL KARTI */}
          <div className="discord-profile">
            <div className="dc-banner" />
            <div className="dc-header">
              <div className="dc-avatar-wrapper">
                <img
                  src="https://discordapp.com/assets/1cbd08c76f8af6dddce02c5138971129.png"
                  id="discordAvatar"
                  alt="Nwexy"
                />
                <div className="dc-status" />
              </div>
            </div>
            <div className="dc-body">
              <h3 className="dc-display-name" id="discordGlobalName">
                Nwexy
              </h3>
              <p className="dc-username">
                <span id="discordUsername">
                  {uiLang === "tr"
                    ? ""
                    : ""}
                </span>
              </p>
              <a
                href="https://nwexy.netlify.app/"
                className="dc-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                nwexy.netlify.app
              </a>

              <a
                href="https://discord.com/users/616186436550656000"
                target="_blank"
                rel="noopener noreferrer"
                className="dc-btn"
              >
                <svg
                  style={{ width: "16px", height: "16px" }}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m22 2-7 20-4-9-9-4Z" />
                  <path d="M22 2 11 13" />
                </svg>
                <span>{uiLang === "tr" ? "Mesaj Gönder!" : "Send Message!"}</span>
              </a>
            </div>
          </div>

          {/* WHATSAPP MOCKUP KARTI */}
          <div className="wa-mockup">
            <div className="wa-header">
              <div className="wa-header-left">
                <svg
                  style={{ width: "16px", height: "16px" }}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m12 19-7-7 7-7" />
                  <path d="M19 12H5" />
                </svg>
                <img src="/avatar.jpg" alt="Nwexy" />
                <div className="wa-user-info">
                  <h4>Nwexy</h4>
                  <span>{uiLang === "tr" ? "çevrimiçi" : "online"}</span>
                </div>
              </div>
              <div className="wa-header-right">
                <svg
                  style={{ width: "16px", height: "16px" }}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
                  <rect x="2" y="6" width="14" height="12" rx="2" />
                </svg>
                <a
                  href="tel:+905303757760"
                  title="+90 530 375 77 60"
                  aria-label="Call"
                >
                  <svg
                    style={{ width: "16px", height: "16px" }}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </a>
                <svg
                  style={{ width: "16px", height: "16px" }}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="5" r="1.75" />
                  <circle cx="12" cy="12" r="1.75" />
                  <circle cx="12" cy="19" r="1.75" />
                </svg>
              </div>
            </div>
            <div className="wa-body">
              <div className="wa-message wa-msg-right">
                <p>
                  {uiLang === "tr" ? "Selam, nasılsın?" : "Hi, how are you?"}
                </p>
                <span className="wa-time">10:42</span>
              </div>
              <div className="wa-message wa-msg-left">
                <p>
                  {uiLang === "tr"
                    ? "İyiyim, teşekkürler! Nasıl yardımcı olabilirim?"
                    : "I'm fine, thanks! How can I help you with?"}
                </p>
                <span className="wa-time">
                  10:45{" "}
                  <svg
                    style={{ width: "14px", height: "14px", display: "inline-block" }}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#53bdeb"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M18 6 7 17l-5-5" />
                    <path d="m22 10-7.5 7.5L13 16" />
                  </svg>
                </span>
              </div>
            </div>
            <div className="wa-footer">
              <svg
                style={{ width: "20px", height: "20px", flexShrink: 0 }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" x2="9.01" y1="9" y2="9" />
                <line x1="15" x2="15.01" y1="9" y2="9" />
              </svg>
              <input
                type="text"
                id="waMessageInput"
                className="wa-input"
                placeholder={uiLang === "tr" ? "Mesaj..." : "Message..."}
                value={waInput}
                onChange={(e) => setWaInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleWaSend();
                }}
              />
              <button
                id="waSendBtn"
                type="button"
                className="wa-send-btn"
                onClick={handleWaSend}
                title="Send"
                aria-label="Send"
              >
                <svg
                  style={{ width: "16px", height: "16px" }}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m22 2-7 20-4-9-9-4Z" />
                  <path d="M22 2 11 13" />
                </svg>
              </button>
            </div>
          </div>

          {/* GMAIL MOCKUP KARTI */}
          <div className="gmail-mockup">
            <div className="gm-header">
              <h4>{uiLang === "tr" ? "Yeni İleti" : "New Message"}</h4>
              <div className="gm-controls">
                <span>-</span>
                <span>×</span>
              </div>
            </div>
            <div className="gm-body">
              <div className="gm-input-line">
                <span className="gm-label">
                  {uiLang === "tr" ? "Kime" : "To"}
                </span>
                <input
                  type="email"
                  id="gmToInput"
                  className="gm-input-field"
                  value="ezheldenuz@gmail.com"
                  spellCheck={false}
                  readOnly
                />
              </div>
              <div className="gm-input-line">
                <span className="gm-label">
                  {uiLang === "tr" ? "Konu" : "Subject"}
                </span>
                <input
                  type="text"
                  id="gmSubjectInput"
                  className="gm-input-field"
                  placeholder={uiLang === "tr" ? "Konu" : "Subject"}
                  value={gmSubject}
                  onChange={(e) => setGmSubject(e.target.value)}
                />
              </div>
              <div className="gm-content">
                <textarea
                  id="gmBodyInput"
                  className="gm-textarea"
                  placeholder={
                    uiLang === "tr"
                      ? "E-posta iletinizi yazın..."
                      : "Compose email..."
                  }
                  value={gmBody}
                  onChange={(e) => setGmBody(e.target.value)}
                />
              </div>
            </div>
            <div className="gm-footer">
              <button
                id="gmSendBtn"
                type="button"
                className="gm-send-btn"
                onClick={handleGmSend}
              >
                {uiLang === "tr" ? "Gönder" : "Send"}
              </button>
              <svg
                style={{ width: "16px", height: "16px", cursor: "pointer" }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
              <svg
                style={{ width: "16px", height: "16px", cursor: "pointer" }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <button
                type="button"
                onClick={() => {
                  setGmSubject("");
                  setGmBody("");
                }}
                title="Clear"
                aria-label="Clear"
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  marginLeft: "auto",
                  color: "inherit",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                <svg
                  style={{ width: "16px", height: "16px" }}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
