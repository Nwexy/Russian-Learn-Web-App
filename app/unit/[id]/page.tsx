/**
 * Ünite detay sayfası — /unit/[id]
 * Seçilen ünitenin tüm öğelerini (harf, kelime vb.) listeler.
 * Çeviri dili translationLang'e göre gösterilir; yoksa diğer dile fallback yapılır.
 */

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { getUnitById, getUnitTitle } from "@/lib/content";
import { useLang } from "@/lib/lang-context";
import { getMessages } from "@/lib/i18n";
import type { Lang, RawItem } from "@/types";

/**
 * Seçili çeviri diline göre karşılığı döndürür.
 * Yoksa diğer dile fallback yapar ve dil etiketini de döndürür.
 */
function getTranslation(
  item: RawItem,
  lang: Lang
): { text: string; fallbackLang?: Lang } {
  const primary = lang === "tr" ? item.tr : item.en;
  const fallback = lang === "tr" ? item.en : item.tr;
  const fallbackLangCode: Lang = lang === "tr" ? "en" : "tr";

  if (primary) return { text: primary };
  if (fallback) return { text: fallback, fallbackLang: fallbackLangCode };
  return { text: "—" };
}

/**
 * Seçili çeviri diline göre örnek cümleyi döndürür.
 */
function getExampleTranslation(
  item: RawItem,
  lang: Lang
): { text: string; fallbackLang?: Lang } | null {
  const primary = lang === "tr" ? item.exampleTr : item.exampleEn;
  const fallback = lang === "tr" ? item.exampleEn : item.exampleTr;
  const fallbackLangCode: Lang = lang === "tr" ? "en" : "tr";

  if (primary) return { text: primary };
  if (fallback) return { text: fallback, fallbackLang: fallbackLangCode };
  return null;
}

export default function UnitPage() {
  const params = useParams<{ id: string }>();
  const unit = getUnitById(params.id);
  const { uiLang, translationLang } = useLang();
  const t = getMessages(uiLang);

  if (!unit) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <p className="empty-state-text">{t.noContent}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Geri dön */}
      <Link href="/" className="back-link">
        <svg
          className="back-icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        {t.back}
      </Link>

      {/* Sayfa başlığı */}
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <span className="unit-card-level">{unit.level}</span>
        </div>
        <h1 className="page-title">{getUnitTitle(unit, uiLang)}</h1>
        <p className="page-subtitle">{unit.items.length} {t.items}</p>
      </div>

      {/* Öğe kartları */}
      <div className="items-grid">
        {unit.items.map((item) => {
          const translation = getTranslation(item, translationLang);
          const exampleTr = getExampleTranslation(item, translationLang);

          return (
            <div key={item.id} className="item-card">
              <span className="item-type-badge">{item.type}</span>
              <div className="item-ru">{item.ru}</div>
              <div className="item-tr">
                {translation.text}
                {translation.fallbackLang && (
                  <span className="fallback-badge">({translation.fallbackLang})</span>
                )}
              </div>
              {(item.exampleRu || exampleTr) && (
                <div className="item-example">
                  {item.exampleRu && (
                    <span className="item-example-ru">« {item.exampleRu} »</span>
                  )}
                  {exampleTr && (
                    <span className="item-example-tr">
                      {exampleTr.text}
                      {exampleTr.fallbackLang && (
                        <span className="fallback-badge">({exampleTr.fallbackLang})</span>
                      )}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
