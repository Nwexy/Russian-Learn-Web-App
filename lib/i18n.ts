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
  footerTextExtra: string;
  footerPortfolio: string;

  // SRS / Review
  todayReview: string;
  dueCards: string;
  study: string;
  nothingDue: string;
  showAnswer: string;
  again: string;
  hard: string;
  good: string;
  easy: string;
  noCardsDue: string;
  backToHome: string;
  review: string;
  progress: string;

  // Alıştırmalar / Practice
  practice: string;
  practiceTitle: string;
  practiceDesc: string;
  multipleChoice: string;
  fillBlank: string;
  matching: string;
  listening: string;
  start: string;
  next: string;
  check: string;
  correct: string;
  wrong: string;
  showCorrect: string;
  play: string;
  replay: string;
  result: string;
  yourScore: string;
  tryAgain: string;
  typeYourAnswer: string;
  chooseAnswer: string;
  matchPairs: string;
  listenAndType: string;
  exerciseComplete: string;
  ttsNotSupported: string;

  // Mistakes
  myMistakes: string;
  noMistakes: string;
  startMistakesReview: string;
  mistakesRemaining: string;
  mistakeFixed: string;
  mistakeStillWrong: string;
  mistakesCount: string;
  clearMistakes: string;
  confirmClear: string;
  mistakesCleared: string;
  dataSection: string;

  // Unit flow
  lesson: string;
  test: string;
  completeLesson: string;
  lessonCompleted: string;
  completed: string;
  inProgress: string;
  notStarted: string;
  unitsCompleted: string;
  passed: string;
  failed: string;
  testResult: string;
  retry: string;
  backToUnit: string;
  startTest: string;
  startPractice: string;
  unitPractice: string;
  unitTest: string;

  // Meaning feedback
  meaningEquals: string;

  // Faz 4.5 — ünite filtresi, telaffuz, alfabe notu
  noExercisesForUnit: string;
  selectUnit: string;
  allUnits: string;
  pronunciation: string;
  pronunciationNotAvailable: string;
  buUnitHasNoExercises: string;
  chooseRussian: string;

  // Faz 4.7
  showPronunciations: string;
  display: string;
  listen: string;
  speak: string;
  sessionActive: string;
  practicingAllUnits: string;
  practicingUnit: string;

  // Faz 5 — Gramer
  grammar: string;
  grammarNotes: string;
  relatedGrammar: string;
  grammarCompleted: string;
  grammarInProgress: string;
  grammarNotStarted: string;
  startLesson: string;
  finishLesson: string;
  lessonComplete: string;
  backToGrammar: string;
  correctAnswers: string;
  totalQuestions: string;
  reviewGrammar: string;
  noGrammarForUnit: string;
  miniExercise: string;

  // Faz 6.6 — Ünite içi kilit
  mustCompleteLessonFirst: string;
  locked: string;
  completeLessonToUnlock: string;

  // Faz 7.5 — Çoklu ünite ve karışık mod
  mixedMode: string;
  selectUnits: string;
  allUnitsSelected: string;
  multipleUnitsSelected: string;

  // Faz 7.6 — Doğrusal ilerleme ve ünite kilit sistemi
  unitLocked: string;
  completePreviousUnitToUnlock: string;
  unitLockedMessage: string;
}

/** Tüm çeviriler */
const messages: Record<Lang, Messages> = {
  tr: {
    appName: "Rusça Öğreniyorum",
    home: "Ana Sayfa",
    settings: "Ayarlar",
    units: "Üniteler",
    unit: "Ünite",
    items: "öğe",
    level: "Seviye",
    back: "Ana Sayfaya Dön",
    goToUnit: "Üniteye git",
    heroDesc: "Kiril alfabesinden başlayarak adım adım Rusça öğren.",

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
    dataStorageDesc: "Tüm veriler tarayıcınızda (IndexedDB) yerel olarak saklanır.",
    settingsDesc: "Uygulama tercihlerini buradan yönetin.",

    footerText: "Rusça Öğren — Eğlenerek Öğren",
    footerTextExtra: "© 2026 Bu Proje Nwexy Tarafından Yapılmıştır. Tüm Hakları Saklıdır.",
    footerPortfolio: "Portofolyom",

    // SRS / Review
    todayReview: "Bugünün Tekrarı",
    dueCards: "kart tekrar bekliyor",
    study: "Çalış",
    nothingDue: "Bugün için tekrar yok.",
    showAnswer: "Cevabı Göster",
    again: "Tekrar",
    hard: "Zor",
    good: "İyi",
    easy: "Kolay",
    noCardsDue: "Bugün için tekrar edilecek kart yok.",
    backToHome: "Ana Sayfaya Dön",
    review: "Tekrar",
    progress: "İlerleme",

    // Alıştırmalar / Practice
    practice: "Alıştırma",
    practiceTitle: "Alıştırmalar",
    practiceDesc: "Kelime bilginizi pekiştirmek için alıştırma yapın.",
    multipleChoice: "Çoktan Seçmeli",
    fillBlank: "Boşluk Doldurma",
    matching: "Eşleştirme",
    listening: "Dinleme",
    start: "Başlat",
    next: "Sonraki",
    check: "Kontrol Et",
    correct: "Doğru",
    wrong: "Yanlış",
    showCorrect: "Doğru cevap",
    play: "Dinle",
    replay: "Tekrar Dinle",
    result: "Sonuç",
    yourScore: "Puanınız",
    tryAgain: "Tekrar Dene",
    typeYourAnswer: "Cevabınızı yazın...",
    chooseAnswer: "Doğru çeviriyi seçin",
    matchPairs: "Eşleşen çiftleri bulun",
    listenAndType: "Dinleyin ve Rusça yazın",
    exerciseComplete: "Alıştırma tamamlandı!",
    ttsNotSupported: "Tarayıcınız ses okumayı desteklemiyor.",

    // Mistakes
    myMistakes: "Yanlışlarım",
    noMistakes: "Yanlışın yok.",
    startMistakesReview: "Yanlışları Tekrarla",
    mistakesRemaining: "kalan yanlış",
    mistakeFixed: "Doğru! Listeden düştü.",
    mistakeStillWrong: "Yanlış. Listede kaldı.",
    mistakesCount: "yanlış",
    clearMistakes: "Yanlışları Temizle",
    confirmClear: "Tüm yanlış kayıtları silinecek. Emin misiniz?",
    mistakesCleared: "Tüm yanlışlar temizlendi.",
    dataSection: "Veri",

    // Unit flow
    lesson: "Ders",
    test: "Test",
    completeLesson: "Dersi Tamamla",
    lessonCompleted: "Ders tamamlandı.",
    completed: "Tamamlandı",
    inProgress: "Devam ediyor",
    notStarted: "Başlanmadı",
    unitsCompleted: "ünite tamamlandı",
    passed: "Geçtin",
    failed: "Kaldın",
    testResult: "Test Sonucu",
    retry: "Tekrar Dene",
    backToUnit: "Üniteye Dön",
    startTest: "Teste Başla",
    startPractice: "Alıştırmaya Başla",
    unitPractice: "Ünite Alıştırması",
    unitTest: "Ünite Testi",

    meaningEquals: "=",

    noExercisesForUnit: "Seçili ünitede alıştırma için kelime yok.",
    selectUnit: "Ünite seç",
    allUnits: "Tüm üniteler",
    pronunciation: "Okunuş",
    pronunciationNotAvailable: "Okunuş bilgisi yok.",
    buUnitHasNoExercises: "Bu ünitede alıştırma yok. Harfler /review sayfasında tekrar edilir.",
    chooseRussian: "Rusça karşılığını seçin",

    // Faz 4.7
    showPronunciations: "Telaffuzları Göster",
    display: "Görünüm",
    listen: "Dinle",
    speak: "Seslendir",
    sessionActive: "Oturum aktif",
    practicingAllUnits: "Alıştırma: Tüm Üniteler",
    practicingUnit: "Alıştırma",

    // Faz 5 — Gramer
    grammar: "Gramer",
    grammarNotes: "Gramer Notları",
    relatedGrammar: "İlgili Gramer",
    grammarCompleted: "Tamamlandı",
    grammarInProgress: "Devam ediyor",
    grammarNotStarted: "Başlanmadı",
    startLesson: "Dersi Başlat",
    finishLesson: "Dersi Bitir",
    lessonComplete: "Ders Tamamlandı",
    backToGrammar: "Gramer Notlarına Dön",
    correctAnswers: "Doğru",
    totalQuestions: "Toplam Soru",
    reviewGrammar: "Grameri İncele",
    noGrammarForUnit: "Bu ünite için ilgili gramer konusu bulunmuyor.",
    miniExercise: "Mini Alıştırma",

    // Faz 6.6 — Ünite içi kilit
    mustCompleteLessonFirst: "Önce dersi tamamlamalısın.",
    locked: "Kilitli",
    completeLessonToUnlock: "Kilidi açmak için dersi tamamlayın.",

    // Faz 7.5 — Çoklu ünite ve karışık mod
    mixedMode: "Karışık Mod",
    selectUnits: "Üniteleri Seç",
    allUnitsSelected: "Tüm Üniteler",
    multipleUnitsSelected: "Seçili Üniteler",

    // Faz 7.6 — Doğrusal ilerleme ve ünite kilit sistemi
    unitLocked: "Ünite Kilitli",
    completePreviousUnitToUnlock: "Devam etmek için önceki üniteyi tamamlayın.",
    unitLockedMessage: "Bu ünite kilitli. Lütfen önceki üniteleri tamamlayın.",
  },
  en: {
    appName: "Learning Russian",
    home: "Home",
    settings: "Settings",
    units: "Units",
    unit: "Unit",
    items: "items",
    level: "Level",
    back: "Back to Home",
    goToUnit: "Go to unit",
    heroDesc: "Learn Russian step by step, starting with the Cyrillic alphabet.",

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
    dataStorageDesc: "All data is stored locally in your browser (IndexedDB).",
    settingsDesc: "Manage your app preferences here.",

    footerText: "Learn Russian — Learn & Enjoy",
    footerTextExtra: "© 2026 This Project Was Made By Nwexy. All Rights Reserved.",
    footerPortfolio: "My Portofolio",

    // SRS / Review
    todayReview: "Today's Review",
    dueCards: "cards due for review",
    study: "Study",
    nothingDue: "Nothing due today.",
    showAnswer: "Show Answer",
    again: "Again",
    hard: "Hard",
    good: "Good",
    easy: "Easy",
    noCardsDue: "No cards due for review today.",
    backToHome: "Back to Home",
    review: "Review",
    progress: "Progress",

    // Practice
    practice: "Practice",
    practiceTitle: "Practice",
    practiceDesc: "Practice to reinforce your vocabulary.",
    multipleChoice: "Multiple Choice",
    fillBlank: "Fill in the Blank",
    matching: "Matching",
    listening: "Listening",
    start: "Start",
    next: "Next",
    check: "Check",
    correct: "Correct",
    wrong: "Wrong",
    showCorrect: "Correct answer",
    play: "Play",
    replay: "Replay",
    result: "Result",
    yourScore: "Your score",
    tryAgain: "Try Again",
    typeYourAnswer: "Type your answer...",
    chooseAnswer: "Choose the correct translation",
    matchPairs: "Find the matching pairs",
    listenAndType: "Listen and type in Russian",
    exerciseComplete: "Exercise complete!",
    ttsNotSupported: "Your browser does not support text-to-speech.",

    // Mistakes
    myMistakes: "My Mistakes",
    noMistakes: "No mistakes.",
    startMistakesReview: "Review Mistakes",
    mistakesRemaining: "mistakes remaining",
    mistakeFixed: "Correct! Removed from list.",
    mistakeStillWrong: "Wrong. Stays on list.",
    mistakesCount: "mistakes",
    clearMistakes: "Clear Mistakes",
    confirmClear: "All mistake records will be deleted. Are you sure?",
    mistakesCleared: "All mistakes cleared.",
    dataSection: "Data",

    // Unit flow
    lesson: "Lesson",
    test: "Test",
    completeLesson: "Complete Lesson",
    lessonCompleted: "Lesson completed.",
    completed: "Completed",
    inProgress: "In Progress",
    notStarted: "Not Started",
    unitsCompleted: "units completed",
    passed: "Passed",
    failed: "Failed",
    testResult: "Test Result",
    retry: "Retry",
    backToUnit: "Back to Unit",
    startTest: "Start Test",
    startPractice: "Start Practice",
    unitPractice: "Unit Practice",
    unitTest: "Unit Test",

    meaningEquals: "=",

    noExercisesForUnit: "The selected unit has no words to practice.",
    selectUnit: "Select unit",
    allUnits: "All units",
    pronunciation: "Pronunciation",
    pronunciationNotAvailable: "No pronunciation available.",
    buUnitHasNoExercises: "This unit has no exercises. Letters are reviewed on the /review page.",
    chooseRussian: "Choose the Russian word",

    // Faz 4.7
    showPronunciations: "Show Pronunciations",
    display: "Display",
    listen: "Listen",
    speak: "Speak",
    sessionActive: "Session active",
    practicingAllUnits: "Practice: All Units",
    practicingUnit: "Practice",

    // Faz 5 — Grammar
    grammar: "Grammar",
    grammarNotes: "Grammar Notes",
    relatedGrammar: "Related Grammar",
    grammarCompleted: "Completed",
    grammarInProgress: "In Progress",
    grammarNotStarted: "Not Started",
    startLesson: "Start Lesson",
    finishLesson: "Finish Lesson",
    lessonComplete: "Lesson Complete",
    backToGrammar: "Back to Grammar",
    correctAnswers: "Correct",
    totalQuestions: "Total Questions",
    reviewGrammar: "Review Grammar",
    noGrammarForUnit: "No related grammar notes for this unit.",
    miniExercise: "Mini Exercise",

    // Faz 6.6 — Ünite içi kilit
    mustCompleteLessonFirst: "You must complete the lesson first.",
    locked: "Locked",
    completeLessonToUnlock: "Complete the lesson to unlock.",

    // Faz 7.5 — Çoklu ünite ve karışık mod
    mixedMode: "Mixed Mode",
    selectUnits: "Select Units",
    allUnitsSelected: "All Units",
    multipleUnitsSelected: "Selected Units",

    // Faz 7.6 — Doğrusal ilerleme ve ünite kilit sistemi
    unitLocked: "Unit Locked",
    completePreviousUnitToUnlock: "Complete the previous unit to continue.",
    unitLockedMessage: "This unit is locked. Please complete the previous units first.",
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
