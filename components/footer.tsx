/**
 * Footer bileşeni — arayüz diline göre telif ve portfolyo linkini gösterir.
 */

"use client";

import { useLang } from "@/lib/lang-context";
import { getMessages } from "@/lib/i18n";
import { ExternalLink } from "lucide-react";

export function Footer() {
  const { uiLang } = useLang();
  const t = getMessages(uiLang);

  return (
    <footer className="footer" id="app-footer">
      <div className="footer-content">
        <p className="footer-tagline">{t.footerText}</p>
        <p className="footer-copyright">{t.footerTextExtra}</p>
        <div className="footer-links">
          <a
            href="https://nwexy.netlify.app"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-portfolio-link"
            id="footer-portfolio-link"
          >
            <span>{t.footerPortfolio}</span>
            <ExternalLink size={16} className="footer-link-icon" aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
}

