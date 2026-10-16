/**
 * Ana sayfa — Ünite listesi ve hoş geldiniz bölümü.
 * content/ klasöründeki tüm üniteleri listeler.
 * Arayüz dili uiLang'e göre gösterilir.
 */

"use client";

import Link from "next/link";
import { getAllUnits } from "@/lib/content";
import { useLang } from "@/lib/lang-context";
import { getMessages } from "@/lib/i18n";

export default function HomePage() {
  const units = getAllUnits();
  const { uiLang } = useLang();
  const t = getMessages(uiLang);

  return (
    <div className="page-container">
      {/* Hero bölümü */}
      <section className="hero">
        <span className="hero-emoji">🇷🇺</span>
        <h1 className="hero-title">{t.appName}</h1>
        <p className="hero-desc">{t.heroDesc}</p>
      </section>

      {/* Ünite listesi */}
      <section>
        <h2 className="section-title">
          <span className="section-title-icon">📚</span>
          {t.units}
        </h2>

        {units.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <p className="empty-state-text">{t.noContent}</p>
          </div>
        ) : (
          <div className="units-list">
            {units.map((unit) => (
              <Link
                key={unit.id}
                href={`/unit/${unit.id}`}
                className="card card-clickable"
              >
                <div className="unit-card-header">
                  <span className="unit-card-level">{unit.level}</span>
                  <span className="unit-card-count">
                    {unit.itemCount} {t.items}
                  </span>
                </div>
                <h3 className="unit-card-title">{unit.title}</h3>
                <div className="unit-card-arrow">
                  {t.goToUnit} <span>→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
