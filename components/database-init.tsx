/**
 * Veritabanı başlatma bileşeni.
 * Uygulama ilk açıldığında content/ JSON'larını Dexie'ye yükler.
 * Layout'ta bir kez render edilir, görsel çıktısı yoktur.
 */

"use client";

import { useEffect, useRef } from "react";
import { seedDatabase } from "@/lib/content";

export function DatabaseInit() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    seedDatabase()
      .then(() => console.log("[DB] Veritabanı başarıyla yüklendi."))
      .catch((err) => console.error("[DB] Veritabanı yükleme hatası:", err));
  }, []);

  // Görsel çıktı yok — sadece side-effect
  return null;
}
