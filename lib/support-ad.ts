import type { Lang } from "@/types";
import { supabase } from "@/lib/supabase";

export const SUPPORT_AD_URL = "https://buymeacoffee.com/nwexy";
export const SUPPORT_AD_HANDLE = "buymeacoffee.com/nwexy";

export type SupportClickSource =
  | "sidebar_left"
  | "sidebar_right"
  | "mobile_bottom"
  | "settings_social"
  | "settings_card"
  | "settings_qr";

export function trackSupportClick(source: SupportClickSource): void {
  try {
    const pagePath =
      typeof window !== "undefined" ? window.location.pathname : null;
    const device =
      typeof window !== "undefined"
        ? window.innerWidth < 1024
          ? "mobile"
          : "desktop"
        : "unknown";

    void supabase
      .from("ad_clicks")
      .insert({
        source,
        page_path: pagePath,
        device,
      })
      .then(({ error }) => {
        if (error) {
          console.warn("ad_clicks insert warning:", error.message);
        }
      });
  } catch {
    // Izleme hatasi kullaniciyi engellemesin
  }
}

export interface SupportAdCopy {
  badge: string;
  title: string;
  description: string;
  mobileSubtitle: string;
  cta: string;
  closeLabel: string;
}

const COPY: Record<Lang, SupportAdCopy> = {
  tr: {
    badge: "Destek Ol",
    title: "Bir Kahve Ismarla",
    description:
      "Rusça Öğren tamamen ücretsiz. Gelişimine katkıda bulunmak ister misin?",
    mobileSubtitle: "Ücretsiz gelişime destek ol",
    cta: "Destek Ol",
    closeLabel: "Kapat",
  },
  en: {
    badge: "Support",
    title: "Buy Me a Coffee",
    description:
      "Learn Russian is completely free. Want to support its development?",
    mobileSubtitle: "Support free development",
    cta: "Support",
    closeLabel: "Close",
  },
};

export function getSupportAdCopy(lang: Lang): SupportAdCopy {
  return COPY[lang] || COPY.en;
}
