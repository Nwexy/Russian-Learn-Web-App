import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AnalyzedWord, AnalysisResult } from "@/types";

export type { AnalyzedWord, AnalysisResult };

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "buraya_api_anahtarini_yapistir" || apiKey.trim() === "") {
      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY bulunamadı veya yapılandırılmadı. Lütfen .env.local dosyasına geçerli bir Gemini API anahtarı ekleyin.",
        },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    const text = body?.text;
    const lang = (body?.lang === "en" ? "en" : "tr") as "tr" | "en";

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        {
          error:
            lang === "en"
              ? "Please enter Russian text to analyze."
              : "Lütfen analiz edilecek bir Rusça metin girin.",
        },
        { status: 400 }
      );
    }

    const trimmedText = text.trim();
    if (trimmedText.length > 1000) {
      return NextResponse.json(
        {
          error:
            lang === "en"
              ? "Text is too long (maximum 1000 characters)."
              : "Metin çok uzun (en fazla 1000 karakter).",
        },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const candidateModels = Array.from(
      new Set(
        [
          process.env.GEMINI_MODEL,
          "gemini-3.5-flash",
          "gemini-3.5-flash-lite",
          "gemini-3.1-flash-lite",
          "gemini-3-flash-preview",
          "gemini-1.5-flash",
        ].filter(Boolean) as string[]
      )
    );

    const isEnglish = lang === "en";
    const prompt = isEnglish
      ? `Analyze the following Russian sentence word by word. Do not treat punctuation as separate words; only analyze words.
Provide all meanings, grammar notes, and the full translation of the sentence in English.
Return a single JSON object with the following structure:
{
  "fullTranslation": "Full English translation of the entire sentence",
  "words": [
    {
      "word": "Russian word (as in sentence or base form)",
      "meaning": "Meaning in English",
      "type": "Part of speech (noun, verb, adjective, pronoun, preposition, adverb, conjunction, etc.)",
      "gender": "Gender (masculine, feminine, neuter - if applicable, otherwise \"\")",
      "case": "Case (nominative, accusative, genitive, dative, instrumental, prepositional - if applicable, otherwise \"\")",
      "tense": "Tense (present, past, future - if applicable, otherwise \"\")",
      "grammarNote": "Brief grammar explanation in English (e.g. \"plural feminine noun in accusative case\", \"1st person singular present tense\")"
    }
  ]
}

Sentence: "${trimmedText}"`
      : `Aşağıdaki Rusça cümleyi kelime kelime analiz et. Noktalama işaretlerini ayrı kelime olarak alma, yalnızca kelimeleri analiz et.
Cümlenin tam Türkçe çevirisini, tüm kelime anlamlarını ve gramer notlarını Türkçe olarak sağla.
Aşağıdaki yapıya sahip tek bir JSON nesnesi döndür:
{
  "fullTranslation": "Cümlenin tam Türkçe çevirisi",
  "words": [
    {
      "word": "Rusça kelime (yalın veya cümledeki hali)",
      "meaning": "Türkçe anlamı",
      "type": "Kelime türü (isim, fiil, sıfat, zamir, edat, zarf, bağlaç vb.)",
      "gender": "Cinsiyeti (eril, dişil, nötr - varsa, yoksa \"\")",
      "case": "Hali (nominatif, akuzatif, genitif, datif, enstrümental, prepozisyonel - varsa, yoksa \"\")",
      "tense": "Zamanı (şimdiki, geçmiş, gelecek - varsa, yoksa \"\")",
      "grammarNote": "Kısa bir gramer açıklaması (örn: \"çoğul dişil isim\", \"1. tekil şahıs şimdiki zaman\", \"в edatından sonra prepozisyonel hal\" vb.)"
    }
  ]
}

Cümle: "${trimmedText}"`;

    let rawText = "";
    let lastError: Error | null = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textOutput = response.text().trim();
        if (textOutput) {
          rawText = textOutput;
          break;
        }
      } catch (err: unknown) {
        lastError = err as Error;
        // Mevcut model başarısız olursa bir sonraki adayı dene
      }
    }

    if (!rawText) {
      throw lastError || new Error("Gemini modellerinden geçerli yanıt alınamadı.");
    }

    // Markdown kod blokları varsa temizle
    if (rawText.startsWith("```json")) {
      rawText = rawText.replace(/^```json\s*/, "").replace(/```$/, "").trim();
    } else if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```\s*/, "").replace(/```$/, "").trim();
    }

    let parsedData: unknown;
    try {
      parsedData = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        {
          error:
            lang === "en"
              ? "Gemini API response could not be parsed as JSON."
              : "Gemini API yanıtı JSON olarak ayrıştırılamadı.",
          raw: rawText,
        },
        { status: 502 }
      );
    }

    let fullTranslation = "";
    let words: AnalyzedWord[] = [];

    if (Array.isArray(parsedData)) {
      words = parsedData;
    } else if (parsedData && typeof parsedData === "object") {
      const obj = parsedData as Record<string, unknown>;

      if (typeof obj.fullTranslation === "string") {
        fullTranslation = obj.fullTranslation.trim();
      }

      if (Array.isArray(obj.words)) {
        words = obj.words as AnalyzedWord[];
      } else if (Array.isArray(obj.analysis)) {
        words = obj.analysis as AnalyzedWord[];
      }
    }

    if (words.length === 0) {
      return NextResponse.json(
        {
          error:
            lang === "en"
              ? "Gemini API response structure did not match expected format."
              : "Gemini API yanıt formatı beklenen dizi yapısında değil.",
          raw: rawText,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      text: trimmedText,
      fullTranslation,
      words,
    });
  } catch (err: unknown) {
    const error = err as Error;
    const message = error?.message || "Bilinmeyen bir hata oluştu";

    if (message.includes("API_KEY_INVALID") || message.includes("API key not valid")) {
      return NextResponse.json(
        {
          error:
            "Geçersiz Gemini API anahtarı. Lütfen .env.local dosyasındaki anahtarı kontrol edin.",
        },
        { status: 401 }
      );
    }

    if (message.includes("RESOURCE_EXHAUSTED") || message.includes("quota")) {
      return NextResponse.json(
        {
          error:
            "Gemini API kullanım kotası aşıldı. Lütfen daha sonra tekrar deneyin.",
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: `Gemini API hatası: ${message}` },
      { status: 500 }
    );
  }
}
