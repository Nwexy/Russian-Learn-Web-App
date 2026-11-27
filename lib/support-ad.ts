import type { Lang } from "@/types";

export const SUPPORT_AD_URL = "https://buymeacoffee.com/nwexy";
export const SUPPORT_AD_HANDLE = "buymeacoffee.com/nwexy";

const VISITOR_ID_KEY = "rl_visitor_id";
const SESSION_START_KEY = "rl_session_start";

export type SupportClickSource =
  | "sidebar_left"
  | "sidebar_right"
  | "mobile_bottom"
  | "settings_social"
  | "settings_card"
  | "settings_qr";

function generateVisitorId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function getOrCreateVisitorId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    let id = localStorage.getItem(VISITOR_ID_KEY);
    if (!id) {
      id = generateVisitorId();
      localStorage.setItem(VISITOR_ID_KEY, id);
    }
    return id;
  } catch {
    try {
      let id = sessionStorage.getItem(VISITOR_ID_KEY);
      if (!id) {
        id = generateVisitorId();
        sessionStorage.setItem(VISITOR_ID_KEY, id);
      }
      return id;
    } catch {
      return null;
    }
  }
}

export function initSupportSession(): void {
  if (typeof window === "undefined") return;
  try {
    if (!sessionStorage.getItem(SESSION_START_KEY)) {
      sessionStorage.setItem(SESSION_START_KEY, String(Date.now()));
    }
  } catch {
    // sessionStorage erisilemiyorsa yoksay
  }
  getOrCreateVisitorId();
}

function getSessionDurationSec(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = sessionStorage.getItem(SESSION_START_KEY);
    if (!raw) {
      sessionStorage.setItem(SESSION_START_KEY, String(Date.now()));
      return 0;
    }
    const startMs = Number(raw);
    if (!Number.isFinite(startMs) || startMs <= 0) return 0;
    return Math.max(0, Math.round((Date.now() - startMs) / 1000));
  } catch {
    return 0;
  }
}

function detectOS(ua: string): string {
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Android/i.test(ua)) return "Android";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Macintosh|Mac OS X/i.test(ua)) return "macOS";
  if (/Linux/i.test(ua)) return "Linux";
  return "Other";
}

function detectBrowser(ua: string): string {
  if (/Edg\//i.test(ua)) return "Edge";
  if (/OPR\/|Opera/i.test(ua)) return "Opera";
  if (/Firefox\//i.test(ua)) return "Firefox";
  if (/Chrome\/|CriOS/i.test(ua)) return "Chrome";
  if (/Safari\//i.test(ua)) return "Safari";
  return "Other";
}

function detectDevice(ua: string, width: number): string {
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone|iPod/i.test(ua) || width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

export function trackSupportClick(source: SupportClickSource): void {
  if (typeof window === "undefined") return;

  try {
    const ua = navigator.userAgent || "";
    const payload = {
      source,
      page_path: window.location.pathname,
      device: detectDevice(ua, window.innerWidth),
      os: detectOS(ua),
      browser: detectBrowser(ua),
      screen_size: `${window.screen.width}x${window.screen.height}`,
      visitor_id: getOrCreateVisitorId(),
      session_duration_sec: getSessionDurationSec(),
    };

    const body = JSON.stringify(payload);

    if (typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      const sent = navigator.sendBeacon("/api/ad-click", blob);
      if (sent) return;
    }

    void fetch("/api/ad-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
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
