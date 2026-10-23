/**
 * Uygulama navigasyon çubuğu.
 * Logo, ana sayfa ve ayarlar bağlantıları içerir.
 * Tema geçiş düğmesi navbar'da yer alır.
 * Tüm metinler arayüz diline (uiLang) göre gösterilir.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import { useLang } from "@/lib/lang-context";
import { getMessages } from "@/lib/i18n";
import { RatingGuidePopover } from "@/components/rating-guide-popover";

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { uiLang } = useLang();
  const t = getMessages(uiLang);

  /** Aktif sayfa kontrolü */
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Sol: Logo ve başlık */}
        <Link href="/" className="navbar-brand">
          <span className="navbar-logo" aria-hidden="true">
            Я
          </span>
          <span className="navbar-title">{t.appName}</span>
        </Link>

        {/* Orta: Navigasyon linkleri */}
        <div className="navbar-links">
          <Link
            href="/"
            className={`navbar-link ${isActive("/") ? "navbar-link-active" : ""}`}
          >
            <svg
              className="navbar-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z"
              />
            </svg>
            <span>{t.home}</span>
          </Link>
          <div className="navbar-item-with-help">
            <Link
              href="/review"
              className={`navbar-link ${isActive("/review") ? "navbar-link-active" : ""}`}
            >
              <svg
                className="navbar-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>{t.review}</span>
            </Link>
            <RatingGuidePopover align="center" size={13} className="navbar-review-help" />
          </div>
          <Link
            href="/practice"
            className={`navbar-link ${isActive("/practice") ? "navbar-link-active" : ""}`}
          >
            <svg
              className="navbar-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            <span>{t.practice}</span>
          </Link>
          <Link
            href="/grammar"
            className={`navbar-link ${isActive("/grammar") || pathname.startsWith("/grammar") ? "navbar-link-active" : ""}`}
          >
            <svg
              className="navbar-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <span>{t.grammar}</span>
          </Link>
          <Link
            href="/settings"
            className={`navbar-link ${isActive("/settings") ? "navbar-link-active" : ""}`}
          >
            <svg
              className="navbar-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>{t.settings}</span>
          </Link>
        </div>

        {/* Sağ: Tema geçişi */}
        <button
          onClick={toggleTheme}
          className="theme-toggle"
          aria-label={theme === "dark" ? t.light : t.dark}
          title={theme === "dark" ? t.light : t.dark}
        >
          {theme === "dark" ? (
            <svg
              className="theme-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          ) : (
            <svg
              className="theme-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          )}
        </button>
      </div>
    </nav>
  );
}
