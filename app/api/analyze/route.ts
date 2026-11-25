import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface AnalyzedWord {
  word: string;
  meaning: string;
  type?: string;
  gender?: string;
  case?: string;
  tense?: string;
  grammarNote?: string;
}

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

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "Lütfen analiz edilecek bir Rusça metin girin." },
        { status: 400 }
      );
    }

    const trimmedText = text.trim();
    if (trimmedText.length > 1000) {
      return NextResponse.json(
        { error: "Metin çok uzun (en fazla 1000 karakter)." },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const prompt = `Aşağıdaki Rusça cümleyi kelime kelime analiz et. Noktalama işaretlerini ayrı kelime olarak alma, yalnızca kelimeleri analiz et. Her kelime için şu bilgileri içeren bir JSON dizisi döndür:
- "word": Rusça kelime (yalın veya cümledeki hali)
- "meaning": Türkçe anlamı
- "type": Kelime türü (isim, fiil, sıfat, zamir, edat, zarf, bağlaç vb.)
- "gender": Cinsiyeti (eril, dişil, nötr - varsa, yoksa "")
- "case": Hali (nominatif, akuzatif, genitif, datif, enstrümental, prepozisyonel - varsa, yoksa "")
- "tense": Zamanı (şimdiki, geçmiş, gelecek - varsa, yoksa "")
- "grammarNote": Kısa bir gramer açıklaması (örn: "çoğul dişil isim", "1. tekil şahıs şimdiki zaman", "в edatından sonra prepozisyonel hal" vb.)

Cümle: "${trimmedText}"

Yalnızca belirtilen JSON dizisini döndür:
[
  {
    "word": "...",
    "meaning": "...",
    "type": "...",
    "gender": "...",
    "case": "...",
    "tense": "...",
    "grammarNote": "..."
  }
]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let rawText = response.text().trim();

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
          error: "Gemini API yanıtı JSON olarak ayrıştırılamadı.",
          raw: rawText,
        },
        { status: 502 }
      );
    }

    let words: AnalyzedWord[] = [];
    if (Array.isArray(parsedData)) {
      words = parsedData;
    } else if (
      parsedData &&
      typeof parsedData === "object" &&
      "words" in parsedData &&
      Array.isArray((parsedData as { words: unknown }).words)
    ) {
      words = (parsedData as { words: AnalyzedWord[] }).words;
    } else if (
      parsedData &&
      typeof parsedData === "object" &&
      "analysis" in parsedData &&
      Array.isArray((parsedData as { analysis: unknown }).analysis)
    ) {
      words = (parsedData as { analysis: AnalyzedWord[] }).analysis;
    } else {
      return NextResponse.json(
        {
          error: "Gemini API yanıt formatı beklenen dizi yapısında değil.",
          raw: rawText,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      text: trimmedText,
      words,
    });
  } catch (err: unknown) {
    const error = err as Error;
    const message = error?.message || "Bilinmeyen bir hata oluştu";

    if (message.includes("API_KEY_INVALID") || message.includes("API key not valid")) {
      return NextResponse.json(
        { error: "Geçersiz Gemini API anahtarı. Lütfen .env.local dosyasındaki anahtarı kontrol edin." },
        { status: 401 }
      );
    }

    if (message.includes("RESOURCE_EXHAUSTED") || message.includes("quota")) {
      return NextResponse.json(
        { error: "Gemini API kullanım kotası aşıldı. Lütfen daha sonra tekrar deneyin." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: `Gemini API hatası: ${message}` },
      { status: 500 }
    );
  }
}
