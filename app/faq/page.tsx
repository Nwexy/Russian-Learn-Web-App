/**
 * SSS (FAQ) Sayfası — app/faq/page.tsx
 * Sıkça sorulan soruları shadcn/ui Accordion bileşeniyle görüntüler.
 * Tüm metinler arayüz diline (uiLang) göre i18n üzerinden dinamik olarak yüklenir.
 */

"use client";

import Link from "next/link";
import { useLang } from "@/lib/lang-context";
import { getMessages } from "@/lib/i18n";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

export default function FaqPage() {
  const { uiLang } = useLang();
  const t = getMessages(uiLang);

  const faqItems = [
    { id: "item-1", q: t.faqQ1, a: t.faqA1 },
    { id: "item-2", q: t.faqQ2, a: t.faqA2 },
    { id: "item-3", q: t.faqQ3, a: t.faqA3 },
    { id: "item-4", q: t.faqQ4, a: t.faqA4 },
    { id: "item-5", q: t.faqQ5, a: t.faqA5 },
    { id: "item-6", q: t.faqQ6, a: t.faqA6 },
    { id: "item-7", q: t.faqQ7, a: t.faqA7 },
  ];

  return (
    <div className="page-container">
      {/* Geri dön butonu */}
      <Link href="/" className="back-link">
        <svg
          className="back-icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {t.back}
      </Link>

      {/* Başlık ve açıklama */}
      <div className="page-header">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
            <HelpCircle size={28} />
          </div>
          <h1 className="page-title">{t.faqTitle}</h1>
        </div>
        <p className="page-subtitle">{t.faqSubtitle}</p>
      </div>

      {/* SSS Accordion Kartı */}
      <div className="rounded-2xl border border-border bg-[var(--bg-card)] p-6 md:p-8 shadow-md">
        <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
          {faqItems.map((item, index) => (
            <AccordionItem key={item.id} value={item.id} className="py-1">
              <AccordionTrigger className="text-base font-semibold hover:no-underline">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent/10 text-xs font-bold text-accent">
                    {index + 1}
                  </span>
                  <span>{item.q}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-9 pr-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
