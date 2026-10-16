/**
 * Footer bileşeni — arayüz diline göre metin gösterir.
 */

"use client";

import { useLang } from "@/lib/lang-context";
import { getMessages } from "@/lib/i18n";

export function Footer() {
  const { uiLang } = useLang();
  const t = getMessages(uiLang);

  return (
    <footer className="footer">
      {t.footerText}
    </footer>
  );
}
