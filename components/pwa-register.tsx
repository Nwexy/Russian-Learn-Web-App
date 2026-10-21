/**
 * PWA Service Worker kayit bileseni.
 * Tarayici tarafinda calisarak /sw.js dosyasini kaydeder.
 */

"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // Gelistirme ortaminda (development) Service Worker Next.js HMR ve RSC isteklerini
    // bozabilecegi icin kayit yapma; varsa eski kayitlari temizle.
    if (process.env.NODE_ENV === "development") {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
      return;
    }

    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => {
          console.error("Service worker registration error:", err);
        });
    });
  }, []);

  return null;
}
