/**
 * Basit i18n (çoklu dil) modülü.
 * Harici kütüphane kullanmaz; sade ve hafif.
 *
 * İki dil desteklenir: Türkçe (tr) ve İngilizce (en).
 * Arayüz metinleri burada merkezi olarak tutulur.
 */

import type { Lang } from "@/types";

/** Arayüz mesaj anahtarları */
export interface Messages {
  appName: string;
  home: string;
  settings: string;
  units: string;
  unit: string;
  items: string;
  level: string;
  back: string;
  goToUnit: string;
  heroDesc: string;

  // Tema
  theme: string;
  appearance: string;
  light: string;
  dark: string;
  darkTheme: string;
  darkModeActive: string;
  lightModeActive: string;

  // Dil
  uiLanguage: string;
  uiLanguageDesc: string;
  translationLanguage: string;
  translationLanguageDesc: string;
  turkish: string;
  english: string;

  // Ayarlar
  save: string;
  resetProgress: string;
  noContent: string;
  about: string;
  version: string;
  dataStorage: string;
  dataStorageDesc: string;
  settingsDesc: string;

  // Footer
  footerText: string;
}

/** Tüm çeviriler */
const messages: Record<Lang, Messages> = {
  tr: {
    appName: "Rusça Öğren",
    home: "Ana Sayfa",
    settings: "Ayarlar",
    units: "Üniteler",
    unit: "Ünite",
    items: "öğe",
    level: "Seviye",
    back: "Ana Sayfaya Dön",
    goToUnit: "Üniteye git",
    heroDesc: "Kiril alfabesinden başlayarak adım adım Rusça öğren. Tamamen yerel, internet gerekmez.",

    theme: "Tema",
    appearance: "Görünüm",
    light: "Açık",
    dark: "Koyu",
    darkTheme: "Koyu Tema",
    darkModeActive: "Koyu mod aktif — gözlerinizi yormuyor.",
    lightModeActive: "Açık mod aktif — aydınlık ortamlar için.",

    uiLanguage: "Arayüz Dili",
    uiLanguageDesc: "Menü, başlık ve buton metinlerinin dili.",
    translationLanguage: "Çeviri Dili",
    translationLanguageDesc: "Rusça kelimelerin karşılıklarının gösterileceği dil.",
    turkish: "Türkçe",
    english: "English",

    save: "Kaydet",
    resetProgress: "İlerlemeyi Sıfırla",
    noContent: "Henüz ünite eklenmemiş. content/ klasörüne JSON dosyası ekleyin.",
    about: "Hakkında",
    version: "Sürüm",
    dataStorage: "Veri Depolama",
    dataStorageDesc: "Tüm veriler tarayıcınızda (IndexedDB) yerel olarak saklanır. İnternet bağlantısı gerekmez.",
    settingsDesc: "Uygulama tercihlerini buradan yönetin.",

    footerText: "Rusça Öğren — Yerel uygulama, internet gerekmez.",
  },
  en: {
    appName: "Learn Russian",
    home: "Home",
    settings: "Settings",
    units: "Units",
    unit: "Unit",
    items: "items",
    level: "Level",
    back: "Back to Home",
    goToUnit: "Go to unit",
    heroDesc: "Learn Russian step by step, starting with the Cyrillic alphabet. Fully local, no internet required.",

    theme: "Theme",
    appearance: "Appearance",
    light: "Light",
    dark: "Dark",
    darkTheme: "Dark Theme",
    darkModeActive: "Dark mode active — easy on the eyes.",
    lightModeActive: "Light mode active — for bright environments.",

    uiLanguage: "UI Language",
    uiLanguageDesc: "Language for menus, headings, and button labels.",
    translationLanguage: "Translation Language",
    translationLanguageDesc: "Language for showing Russian word translations.",
    turkish: "Türkçe",
    english: "English",

    save: "Save",
    resetProgress: "Reset Progress",
    noContent: "No units added yet. Add a JSON file to the content/ folder.",
    about: "About",
    version: "Version",
    dataStorage: "Data Storage",
    dataStorageDesc: "All data is stored locally in your browser (IndexedDB). No internet connection required.",
    settingsDesc: "Manage your app preferences here.",

    footerText: "Learn Russian — Local app, no internet required.",
  },
};

/**
 * Belirli bir dil ve anahtar için mesajı döndürür.
 * Anahtar bulunamazsa anahtarın kendisini döndürür.
 */
export function getMessage(lang: Lang, key: keyof Messages): string {
  return messages[lang]?.[key] ?? messages.tr[key] ?? key;
}

/**
 * Tüm mesaj objesini döndürür.
 * Bileşen içinde birden fazla mesaj gerektiğinde kullanılır.
 */
export function getMessages(lang: Lang): Messages {
  return messages[lang] ?? messages.tr;
}
