/**
 * Ana Sayfa Rehberi (Swiper) — components/HomeGuide.tsx
 * Faz 11.9: Hem mobil hem PC uyumlu 3 slaytlık başlangıç rehberi carousel.
 * localStorage ("hasSeenGuide") ile kullanıcı tarafından kapatıldığında tekrar gösterilmez.
 */

"use client";

import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import { BookOpen, Unlock, Brain, X } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { getMessages } from "@/lib/i18n";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

export function HomeGuide() {
  const { uiLang } = useLang();
  const t = getMessages(uiLang);

  const [mounted, setMounted] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    try {
      const hasSeen = localStorage.getItem("hasSeenGuide");
      if (hasSeen === "true") {
        setIsDismissed(true);
      }
    } catch {
      // localStorage erişim hatası durumunda devam et
    }
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem("hasSeenGuide", "true");
    } catch {
      // ignore
    }
    setIsDismissed(true);
  };

  // SSR veya kapatılmışsa gösterme
  if (!mounted || isDismissed) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto mb-6 md:mb-8 relative">
      <div className="relative rounded-2xl border border-border bg-card/85 backdrop-blur-md shadow-md hover:shadow-lg transition-all p-3.5 sm:p-5 overflow-hidden">
        {/* Kapat Butonu */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-30 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
          title={t.dismissGuide}
          aria-label={t.dismissGuide}
        >
          <X className="w-4 h-4" />
        </button>

        <Swiper
          modules={[Autoplay, Pagination, Navigation]}
          spaceBetween={16}
          slidesPerView={1}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
          }}
          pagination={{
            clickable: true,
          }}
          navigation={true}
          loop={true}
          className="home-guide-swiper !pb-6 sm:!pb-7"
          style={{
            "--swiper-theme-color": "var(--accent)",
            "--swiper-navigation-size": "16px",
          } as React.CSSProperties}
        >
          {/* Slayt 1 */}
          <SwiperSlide className="h-auto">
            <div className="flex items-center gap-3.5 sm:gap-5 px-2 md:px-12 py-1.5 sm:py-2 min-h-[75px] sm:min-h-[85px]">
              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 sm:w-7 sm:h-7 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0 pr-6 md:pr-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-blue-500 bg-blue-500/10 px-1.5 sm:px-2 py-0.5 rounded-full">
                    1 / 3
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-foreground">
                    {t.welcomeTitle}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-snug sm:leading-relaxed">
                  {t.welcomeDesc}
                </p>
              </div>
            </div>
          </SwiperSlide>

          {/* Slayt 2 */}
          <SwiperSlide className="h-auto">
            <div className="flex items-center gap-3.5 sm:gap-5 px-2 md:px-12 py-1.5 sm:py-2 min-h-[75px] sm:min-h-[85px]">
              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
                <Unlock className="w-5 h-5 sm:w-7 sm:h-7 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0 pr-6 md:pr-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-1.5 sm:px-2 py-0.5 rounded-full">
                    2 / 3
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-foreground">
                    {t.progressTitle}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-snug sm:leading-relaxed">
                  {t.progressDesc}
                </p>
              </div>
            </div>
          </SwiperSlide>

          {/* Slayt 3 */}
          <SwiperSlide className="h-auto">
            <div className="flex items-center gap-3.5 sm:gap-5 px-2 md:px-12 py-1.5 sm:py-2 min-h-[75px] sm:min-h-[85px]">
              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0">
                <Brain className="w-5 h-5 sm:w-7 sm:h-7 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0 pr-6 md:pr-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-1.5 sm:px-2 py-0.5 rounded-full">
                    3 / 3
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-foreground">
                    {t.reviewTitle}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-snug sm:leading-relaxed">
                  {t.reviewDesc}
                </p>
              </div>
            </div>
          </SwiperSlide>
        </Swiper>
      </div>
    </div>
  );
}

export default HomeGuide;
