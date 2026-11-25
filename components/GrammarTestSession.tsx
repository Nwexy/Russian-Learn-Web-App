"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw, Award, BookOpen } from "lucide-react";
import type { Lang, MiniExercise } from "@/types";
import { getRandomGrammarTest } from "@/lib/grammar";
import { getMessages } from "@/lib/i18n";

interface GrammarTestSessionProps {
  uiLang: Lang;
  onExit: () => void;
}

export function GrammarTestSession({ uiLang, onExit }: GrammarTestSessionProps) {
  const t = getMessages(uiLang);

  const [questions, setQuestions] = useState<MiniExercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // 10 adet rastgele soru yükle
  const startNewTest = () => {
    const list = getRandomGrammarTest(10);
    setQuestions(list);
    setCurrentIndex(0);
    setSelectedOption(null);
    setHasAnswered(false);
    setScore(0);
    setIsFinished(false);
  };

  useEffect(() => {
    startNewTest();
  }, []);

  if (questions.length === 0) {
    return null;
  }

  const currentQ = questions[currentIndex];
  const questionText =
    uiLang === "en" ? currentQ.questionEn || currentQ.questionTr : currentQ.questionTr;
  const options =
    uiLang === "en"
      ? currentQ.optionsEn || currentQ.optionsTr || currentQ.options || []
      : currentQ.optionsTr || currentQ.options || [];
  const explanation =
    uiLang === "en"
      ? currentQ.explanationEn || currentQ.explanationTr
      : currentQ.explanationTr;

  const handleSelectOption = (idx: number) => {
    if (hasAnswered) return;
    setSelectedOption(idx);
    setHasAnswered(true);

    if (idx === currentQ.correctIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setHasAnswered(false);
    } else {
      setIsFinished(true);
    }
  };

  // Sonuç Ekranı
  if (isFinished) {
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <div className="w-full max-w-xl mx-auto py-10 px-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-card border border-border rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-primary/15 border border-primary/30 mx-auto flex items-center justify-center text-primary shadow-inner">
            <Award size={40} />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              {t.grammarTest}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
              {uiLang === "tr" ? "Test Tamamlandı!" : "Test Completed!"}
            </h2>
          </div>

          {/* Skor Kutusu */}
          <div className="p-6 rounded-2xl bg-secondary/50 border border-border flex flex-col items-center justify-center gap-1">
            <div className="text-5xl font-black text-foreground">
              {score} <span className="text-2xl text-muted-foreground font-semibold">/ {questions.length}</span>
            </div>
            <span className="text-sm font-semibold text-emerald-500">
              %{percentage} {uiLang === "tr" ? "Başarı" : "Success"}
            </span>
          </div>

          <p className="text-sm text-muted-foreground">
            {percentage >= 80
              ? uiLang === "tr"
                ? "Harika! Gramer kurallarına son derece hakimsin."
                : "Great job! You have an excellent command of the grammar rules."
              : percentage >= 50
              ? uiLang === "tr"
                ? "İyi iş! Birkaç tekrarla daha da başarılı olacaksın."
                : "Good effort! A little more practice will make it even better."
              : uiLang === "tr"
              ? "Gramer notlarını gözden geçirmeni tavsiye ederiz."
              : "We recommend reviewing the grammar notes."}
          </p>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={startNewTest}
              className="px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw size={16} />
              <span>{t.restartTest}</span>
            </button>
            <button
              type="button"
              onClick={onExit}
              className="px-6 py-3 rounded-xl border border-border text-foreground hover:bg-secondary font-semibold text-sm transition-colors cursor-pointer"
            >
              <span>{t.backToHome}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Aktif Soru Ekranı
  return (
    <div className="w-full max-w-2xl mx-auto py-8 px-4">
      {/* Üst Bilgi Barı */}
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-border/50">
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>{t.backToHome}</span>
        </button>

        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
          <BookOpen size={16} className="text-primary" />
          <span>
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
      </div>

      {/* İlerleme Çubuğu */}
      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Soru Kartı */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-lg space-y-6">
        <h2 className="text-lg sm:text-xl font-bold text-foreground leading-relaxed">
          {questionText}
        </h2>

        {/* Şıklar */}
        <div className="flex flex-col gap-3">
          {options.map((opt, idx) => {
            let optionClasses =
              "w-full text-left p-4 rounded-2xl border-2 font-medium text-sm sm:text-base transition-all cursor-pointer flex items-center justify-between";

            if (hasAnswered) {
              if (idx === currentQ.correctIndex) {
                optionClasses +=
                  " border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm";
              } else if (idx === selectedOption) {
                optionClasses +=
                  " border-rose-500 bg-rose-500/15 text-rose-500 dark:text-rose-400";
              } else {
                optionClasses += " border-border opacity-50 bg-secondary/30";
              }
            } else {
              optionClasses +=
                " border-border bg-card hover:bg-secondary/60 hover:border-primary/40 text-foreground";
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectOption(idx)}
                disabled={hasAnswered}
                className={optionClasses}
              >
                <span>{opt}</span>
                {hasAnswered && idx === currentQ.correctIndex && (
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0 ml-2" />
                )}
                {hasAnswered && idx === selectedOption && idx !== currentQ.correctIndex && (
                  <XCircle size={18} className="text-rose-500 shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>

        {/* Açıklama ve Sonraki Butonu */}
        {hasAnswered && (
          <div className="pt-4 border-t border-border/60 space-y-4 animate-in fade-in duration-200">
            {explanation && (
              <div className="p-4 rounded-xl bg-secondary/60 border border-border/80 text-xs sm:text-sm text-foreground/90 leading-relaxed">
                <span className="font-bold mr-1 text-primary">
                  {uiLang === "tr" ? "Açıklama:" : "Explanation:"}
                </span>
                {explanation}
              </div>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              {currentIndex + 1 < questions.length
                ? uiLang === "tr"
                  ? "Sonraki Soru"
                  : "Next Question"
                : uiLang === "tr"
                ? "Testi Bitir"
                : "Finish Test"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default GrammarTestSession;
