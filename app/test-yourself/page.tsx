"use client";

import React, { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Sparkles, Loader2, ArrowLeft, RotateCcw, HelpCircle, BookOpen } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { getMessages } from "@/lib/i18n";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SpeakButton } from "@/components/SpeakButton";
import type { AnalyzedWord } from "@/types";

const EXAMPLE_SENTENCES = [
  "Привет, как дела?",
  "Я учу русский язык каждый день.",
  "Мы живём в красивом городе.",
  "Она читает интересную книгу в библиотеке.",
];

export default function TestYourselfPage() {
  const { uiLang, translationLang } = useLang();
  const t = getMessages(uiLang);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [analyzedText, setAnalyzedText] = useState("");
  const [fullTranslation, setFullTranslation] = useState("");
  const [words, setWords] = useState<AnalyzedWord[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleAnalyze = async (textToAnalyze?: string) => {
    const targetText = (textToAnalyze ?? input).trim();
    const activeLang = translationLang || uiLang || "tr";

    if (!targetText) {
      toast.error(
        activeLang === "tr"
          ? "Lütfen analiz edilecek bir Rusça metin girin."
          : "Please enter Russian text to analyze."
      );
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: targetText, lang: activeLang }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const errorMsg = data?.error || t.analysisError;
        toast.error(errorMsg);
        return;
      }

      if (data && Array.isArray(data.words)) {
        setWords(data.words);
        setAnalyzedText(data.text || targetText);
        setFullTranslation(data.fullTranslation || "");
        toast.success(
          activeLang === "tr"
            ? `${data.words.length} kelime başarıyla analiz edildi.`
            : `Successfully analyzed ${data.words.length} words.`
        );
      } else {
        toast.error(t.analysisError);
      }
    } catch {
      toast.error(t.analysisError);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExample = (sentence: string) => {
    setInput(sentence);
    handleAnalyze(sentence);
  };

  const handleClear = () => {
    setInput("");
    setWords([]);
    setAnalyzedText("");
    setFullTranslation("");
    setHasSearched(false);
  };

  return (
    <div className="page-container max-w-5xl mx-auto px-4 py-8">
      {/* Geri Dön Butonu */}
      <Link href="/" className="back-link mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={16} />
        {t.backToHome}
      </Link>

      {/* Sayfa Başlığı */}
      <div className="page-header mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
            <Sparkles size={22} />
          </div>
          <h1 className="page-title text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t.testYourself}
          </h1>
        </div>
        <p className="page-subtitle text-muted-foreground text-sm sm:text-base max-w-2xl">
          {t.testYourselfDesc}
        </p>
      </div>

      {/* Giriş Alanı Kartı */}
      <Card className="mb-8 p-6 bg-card/60 border border-border/70 rounded-2xl shadow-lg">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.enterRussianSentence}
              disabled={loading}
              rows={4}
              maxLength={1000}
              className="w-full p-4 rounded-xl border border-border bg-background/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-base sm:text-lg resize-y transition-all disabled:opacity-60"
            />
            <div className="absolute right-3 bottom-3 text-xs text-muted-foreground">
              {input.length}/1000
            </div>
          </div>

          {/* Hızlı Örnek Cümleler */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <HelpCircle size={13} />
              {uiLang === "tr" ? "Örnekler:" : "Examples:"}
            </span>
            {EXAMPLE_SENTENCES.map((example, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectExample(example)}
                disabled={loading}
                className="text-xs px-2.5 py-1 rounded-lg bg-secondary/80 hover:bg-secondary text-secondary-foreground border border-border/60 transition-colors cursor-pointer disabled:opacity-50"
              >
                {example}
              </button>
            ))}
          </div>

          {/* Butonlar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div>
              {input && (
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl border border-border/70 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw size={15} />
                  {uiLang === "tr" ? "Temizle" : "Clear"}
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleAnalyze()}
              disabled={loading || !input.trim()}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{t.analyzing}</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>{t.analyze}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Card>

      {/* Yükleniyor Göstergesi */}
      {loading && (
        <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="relative flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <Sparkles size={18} className="absolute text-primary animate-pulse" />
          </div>
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            {t.analyzing}
          </p>
        </div>
      )}

      {/* Sonuç Alanı */}
      {!loading && hasSearched && words.length > 0 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <BookOpen size={20} className="text-primary" />
                <span>{t.analysisResult}</span>
              </h2>
              {analyzedText && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 text-base sm:text-lg font-medium text-foreground">
                    <span className="italic">"{analyzedText}"</span>
                    <SpeakButton text={analyzedText} size="sm" />
                  </div>
                  {fullTranslation && (
                    <p className="text-muted-foreground text-base sm:text-lg italic mt-1.5 font-normal">
                      {fullTranslation}
                    </p>
                  )}
                </div>
              )}
            </div>
            <Badge variant="outline" className="self-start sm:self-auto py-1 px-3">
              {words.length} {uiLang === "tr" ? "kelime" : "words"}
            </Badge>
          </div>

          {/* Kelime Kartları Grid Yapısı */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {words.map((w, idx) => (
              <Card
                key={idx}
                className="flex flex-col justify-between hover:border-primary/50 hover:shadow-md transition-all duration-200"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-2xl font-bold text-primary tracking-tight">
                      {w.word}
                    </CardTitle>
                    <SpeakButton text={w.word} size="sm" />
                  </div>
                  <p className="text-base font-semibold text-foreground mt-1">
                    {w.meaning}
                  </p>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  {/* Etiketler (Tür, Cinsiyet, Hal, Zaman) */}
                  <div className="flex flex-wrap gap-1.5">
                    {w.type && (
                      <Badge variant="default">
                        {w.type}
                      </Badge>
                    )}
                    {w.gender && (
                      <Badge variant="accent">
                        {w.gender}
                      </Badge>
                    )}
                    {w.case && (
                      <Badge variant="secondary">
                        {w.case}
                      </Badge>
                    )}
                    {w.tense && (
                      <Badge variant="outline">
                        {w.tense}
                      </Badge>
                    )}
                  </div>

                  {/* Gramer Açıklaması */}
                  {w.grammarNote && (
                    <div className="mt-2 p-2.5 rounded-lg bg-secondary/50 border border-border/50 text-xs text-muted-foreground leading-relaxed">
                      <span className="font-semibold text-foreground/80 mr-1">
                        {uiLang === "tr" ? "Not:" : "Note:"}
                      </span>
                      {w.grammarNote}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Boş Sonuç Durumu */}
      {!loading && hasSearched && words.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          <p className="text-sm">
            {uiLang === "tr"
              ? "Herhangi bir kelime analiz edilemedi."
              : "No words could be analyzed."}
          </p>
        </Card>
      )}
    </div>
  );
}

