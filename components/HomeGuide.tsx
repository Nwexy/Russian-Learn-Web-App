/**
 * Ana Sayfa Rehberi (Swiper) — components/HomeGuide.tsx
 * Faz 11.9: Hem mobil hem PC uyumlu 3 slaytlık başlangıç rehberi carousel.
 * Modern, şık swipe butonları (Chevron) ve sayfa göstergeleri.
 * localStorage ("hasSeenGuide") ile kullanıcı tarafından kapatıldığında tekrar gösterilmez.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { Autoplay, Keyboard } from "swiper/modules";
import { BookOpen, Unlock, Brain, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { getMessages } from "@/lib/i18n";

import "swiper/css";

export function HomeGuide() {
  const { uiLang } = useLang();
  const t = getMessages(uiLang);

  const swiperRef = useRef<SwiperType | null>(null);
  const [mounted, setMounted] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);

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
      <div className="relative rounded-2xl border border-border bg-card/85 backdrop-blur-md shadow-md hover:shadow-lg transition-all p-3.5 sm:p-5">
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

        {/* Swiper Carousel */}
        <Swiper
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          onSlideChange={(swiper) => {
            setActiveIndex(swiper.realIndex);
          }}
          modules={[Autoplay, Keyboard]}
          keyboard={{ enabled: true }}
          spaceBetween={16}
          slidesPerView={1}
          autoplay={{
            delay: 4000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          loop={true}
          className="w-full"
        >
          {/* Slayt 1 */}
          <SwiperSlide className="h-auto">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4 pr-7 sm:pr-8 py-0.5 min-h-[64px] sm:min-h-[72px]">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-blue-500 bg-blue-500/10 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
                    1 / 3
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-foreground leading-tight">
                    {t.welcomeTitle}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-normal sm:leading-relaxed">
                  {t.welcomeDesc}
                </p>
              </div>
            </div>
          </SwiperSlide>

          {/* Slayt 2 */}
          <SwiperSlide className="h-auto">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4 pr-7 sm:pr-8 py-0.5 min-h-[64px] sm:min-h-[72px]">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                <Unlock className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
                    2 / 3
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-foreground leading-tight">
                    {t.progressTitle}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-normal sm:leading-relaxed">
                  {t.progressDesc}
                </p>
              </div>
            </div>
          </SwiperSlide>

          {/* Slayt 3 */}
          <SwiperSlide className="h-auto">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4 pr-7 sm:pr-8 py-0.5 min-h-[64px] sm:min-h-[72px]">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
                    3 / 3
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-foreground leading-tight">
                    {t.reviewTitle}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-normal sm:leading-relaxed">
                  {t.reviewDesc}
                </p>
              </div>
            </div>
          </SwiperSlide>
        </Swiper>

        {/* Alt Kontroller: Sayfa Noktaları ve Modern Swipe Butonları */}
        <div className="flex items-center justify-between pt-2.5 sm:pt-3 mt-2 border-t border-border/40">
          {/* Sol Taraf: Sayfa Göstergeleri (Dots / Pills) */}
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Slide selector">
            {[0, 1, 2].map((idx) => {
              const isActive = activeIndex === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => swiperRef.current?.slideToLoop(idx)}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    isActive
                      ? "w-6 h-1.5 sm:h-2 bg-accent shadow-xs shadow-accent/40"
                      : "w-1.5 sm:w-2 h-1.5 sm:h-2 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                  }`}
                  title={`Slayt ${idx + 1}`}
                  aria-label={`Slide ${idx + 1}`}
                />
              );
            })}
          </div>

          {/* Sağ Taraf: Modern Swipe Butonları (Önceki / Sonraki) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => swiperRef.current?.slidePrev()}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-border/80 bg-secondary/60 hover:bg-card hover:border-accent hover:text-accent text-muted-foreground flex items-center justify-center transition-all duration-150 shadow-2xs active:scale-90 cursor-pointer"
              title="Önceki"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              type="button"
              onClick={() => swiperRef.current?.slideNext()}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-border/80 bg-secondary/60 hover:bg-card hover:border-accent hover:text-accent text-muted-foreground flex items-center justify-center transition-all duration-150 shadow-2xs active:scale-90 cursor-pointer"
              title="Sonraki"
              aria-label="Next slide"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomeGuide;
