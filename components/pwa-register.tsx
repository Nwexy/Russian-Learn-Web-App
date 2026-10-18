/**
 * PWA Service Worker kayit bileseni.
 * Tarayici tarafinda calisarak /sw.js dosyasini kaydeder.
 */

"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .catch((err) => {
            console.error("Service worker registration error:", err);
          });
      });
    }
  }, []);

  return null;
}
