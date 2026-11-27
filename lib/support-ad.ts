import type { Lang } from "@/types";

export const SUPPORT_AD_URL = "https://buymeacoffee.com/nwexy";
export const SUPPORT_AD_HANDLE = "buymeacoffee.com/nwexy";

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
