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
  skip: string;
  skipped: string;
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

  // Faz 10.6 — Kelime Bankası (Cümle Kurucu)
  wordBank: string;
  sentenceBuilder: string;
  buildSentence: string;
  translateToRussian: string;
  translateToTarget: string;
  tapWordsInOrder: string;
  checkAnswer: string;

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

  // Faz 9 — Veri Yedekleme ve Geri Yukleme
  dataManagement: string;
  exportData: string;
  importData: string;
  exportSuccess: string;
  importSuccess: string;
  importError: string;
  confirmImportWarning: string;
  backupVersion: string;

  // Faz 10.2 — Soru Sayısı ve Konuşma Modu
  speaking: string;
  micNotSupported: string;
  speakNow: string;
  correctPronunciation: string;
  wrongPronunciation: string;
  heardAs: string;
  questionCount: string;
  startSpeaking: string;
  stopSpeaking: string;
  listeningState: string;

  // Faz 10.9 & 11.0 — Review yardım ve tüm kelimeler
  reviewHelp: string;
  againDesc: string;
  hardDesc: string;
  goodDesc: string;
  easyDesc: string;
  includeAllWords: string;
  includeAllWordsDesc: string;
  includeAllWordsHelp: string;
  matchingLimitInfo: string;

  // Faz 11.3 — Ekstra kelime bağlamı
  context: string;

  // Faz 11.4 — Sayılar filtreleme
  numbersExcludedFromReview: string;
  practiceNumbers: string;

  // Faz 11.5 — Kilit Aşma & FAQ
  confirmUnlockTitle: string;
  confirmUnlockDesc: string;
  confirmUnlockAction: string;
  cancel: string;
  faq: string;
  faqTitle: string;
  faqSubtitle: string;
  faqQ1: string;
  faqA1: string;
  faqQ2: string;
  faqA2: string;
  faqQ3: string;
  faqA3: string;
  faqQ4: string;
  faqA4: string;
  faqQ5: string;
  faqA5: string;
  faqQ6: string;
  faqA6: string;
  faqQ7: string;
  faqA7: string;

  // Faz 11.6 — Gramer Modal, Ceviri ve Onboarding
  startExercise: string;
  examples: string;
  example: string;
  gender: string;
  rule: string;
  grammarNotFound: string;
  congratulationsPassed: string;
  failedTryAgain: string;
  grammarSubtitle: string;
  onboardingFaqTooltip: string;
  goToFaq: string;
  close: string;

  // Faz 11.7 — Mixed Mode & Ekstra İyileştirmeler
  selectModes: string;
  selectAtLeastTwoModes: string;
  mixedModesModalTitle: string;
  mixedModesModalDesc: string;
  allModesSelected: string;
  modesSelectedCount: string;
  done: string;
  noExampleSentences: string;
  questionCountTooltip: string;
  questionsLabel: string;
  micPermissionDenied: string;
  speechNotDetected: string;
  speechRecognitionError: string;
  numberBadgeTitle: string;
  sentenceExtraWord: string;
  mixedModeDesc: string;

  // Faz 11.8 — Ana Sayfa PC Rehberi (Swiper)
  welcomeTitle: string;
  welcomeDesc: string;
  progressTitle: string;
  progressDesc: string;
  reviewTitle: string;
  reviewDesc: string;
  dismissGuide: string;

  // Faz 12.0 — Erişilebilirlik ve Hızlı Erişim
  jumpToUnit: string;
  unitList: string;
  openUnits: string;
  lockedUnits: string;
  navHelp: string;

  // Faz 14.0 — SpeedType ve Grammar Test
  speedType: string;
  speedTypeDesc: string;
  grammarTest: string;
  grammarTestDesc: string;
  wpm: string;
  accuracy: string;
  timeLeft: string;
  restartTest: string;
  typingTestInstruction: string;
  speedTypeTime: string;
  speedTypeWords: string;
  speedTypePunct: string;
  speedTypeNumbers: string;
  speedTypeRace: string;
  speedTypeSoundOn: string;
  speedTypeSoundOff: string;
  speedTypeFocusMessage: string;
  speedTypeRestartHint: string;
  speedTypeTestType: string;
  speedTypeRaw: string;
  speedTypeCharacters: string;
  speedTypeConsistency: string;
  speedTypeSearchPlaceholder: string;
  raceTitle: string;
  raceSubtitle: string;
  raceUsernamePlaceholder: string;
  raceStartBtn: string;
  raceBackToSolo: string;
  raceFindingOpponent: string;
  raceFindingDesc: string;
  raceCancelMatchmaking: string;
  raceYourProgress: string;
  raceOpponentDisconnected: string;
  raceResults: string;
  raceWaitingForOpponent: string;
  raceAgain: string;
  raceWinner: string;
  raceLoser: string;
  raceTie: string;
  raceRussian: string;
  raceEnglish: string;
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
    skip: "Geç",
    skipped: "Geçildi",
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

    // Faz 10.6 — Kelime Bankası (Cümle Kurucu)
    wordBank: "Kelime Bankası",
    sentenceBuilder: "Cümle Kurucu",
    buildSentence: "Cümleyi Kurun",
    translateToRussian: "Bu cümleyi Rusça kurun",
    translateToTarget: "Cümleyi oluşturun",
    tapWordsInOrder: "Kelimelere doğru sırada tıklayın",
    checkAnswer: "Kontrol Et",

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

    // Faz 9 — Veri Yedekleme ve Geri Yukleme
    dataManagement: "Veri Yönetimi",
    exportData: "Verileri Yedekle (İndir)",
    importData: "Yedekten Geri Yükle",
    exportSuccess: "Yedek dosyası başarıyla indirildi.",
    importSuccess: "Veriler başarıyla geri yüklendi. Sayfa yenileniyor...",
    importError: "Geçersiz yedek dosyası veya yükleme hatası.",
    confirmImportWarning: "Dikkat! Mevcut tüm ilerlemeniz silinecek ve seçtiğiniz dosyadaki veriler yüklenecektir. Onaylıyor musunuz?",
    backupVersion: "Yedek Sürümü",

    // Faz 10.2 — Soru Sayısı ve Konuşma Modu
    speaking: "Konuşma",
    micNotSupported: "Tarayıcınız konuşma tanımayı desteklemiyor",
    speakNow: "Şimdi konuşun...",
    correctPronunciation: "Harika! Doğru telaffuz.",
    wrongPronunciation: "Yanlış duydum. Tekrar deneyin.",
    heardAs: "Duyulan",
    questionCount: "Soru Sayısı",
    startSpeaking: "Konuşmaya Başla",
    stopSpeaking: "Durdur",
    listeningState: "Dinleniyor...",

    // Faz 10.9 & 11.0 — Review yardım ve tüm kelimeler
    reviewHelp: "Puanlama Rehberi",
    againDesc: "Hatırlamadım, birkaç dakika içinde tekrar gösterilecek.",
    hardDesc: "Zor hatırladım, birkaç gün içinde tekrar gösterilecek.",
    goodDesc: "Biraz düşündüm ama doğru yaptım, yaklaşık bir hafta sonra gösterilecek.",
    easyDesc: "Anında bildim, bir ay sonra gösterilecek.",
    includeAllWords: "Tüm Kelimeleri Dahil Et",
    includeAllWordsDesc: "Kilitli ünitelerin kelimelerini de tekrara dahil eder.",
    includeAllWordsHelp: "Bu ayar açıkken, bir üniteye dahil olmasalar bile veritabanındaki tüm kelimeleri çalışabilirsiniz. Kapalıyken ise sadece ilgili ünitedeki kelimeler gösterilir.",
    matchingLimitInfo: "Eşleştirme modu maks. 4 çift gösterir.",

    // Faz 11.3 — Ekstra kelime bağlamı
    context: "Bağlam",

    // Faz 11.4 — Sayılar filtreleme
    numbersExcludedFromReview: "Sayılar genel tekrar havuzuna dahil edilmez. Sayıları Alıştırma (Practice) sayfasından çalışabilirsiniz.",
    practiceNumbers: "Sayıları Alıştırma Modunda Çalış",

    // Faz 11.5 — Kilit Aşma & FAQ
    confirmUnlockTitle: "Ünite Kilidini Aç",
    confirmUnlockDesc: "Bu ünite kilitli. Önceki üniteleri tamamlamadan bu üniteye geçmek istediğinize emin misiniz?",
    confirmUnlockAction: "Evet, Kilidi Aç",
    cancel: "Vazgeç",
    faq: "SSS",
    faqTitle: "Sıkça Sorulan Sorular",
    faqSubtitle: "Uygulama ve öğrenme süreciyle ilgili merak edilenler",
    faqQ1: "Nereden başlanmalı?",
    faqA1: "Alfabe ile başlayın, sırayla ilerleyin. Ders -> Gün Tekrarı -> Alıştırma Tiplerini Çöz -> Gramer Çalış",
    faqQ2: "Üniteleri atlayabilir miyim?",
    faqA2: "Evet, kilitli bir üniteye tıkladığınızda onay vererek o üniteyi açabilirsiniz.",
    faqQ3: "Dil ayarları nasıl çalışır?",
    faqA3: "Arayüz dili uygulamanın menülerini değiştirir. Çeviri dili ise Rusça kelimelerin hangi dilde karşılığını göreceğinizi belirler.",
    faqQ4: "Tekrar ve Bütün Kelimeleri Dahil Et nedir?",
    faqA4: "Tekrar, SRS algoritmasıyla kelimeleri unutmadan tekrar etmenizi sağlar. Bütün Kelimeleri Dahil Et açıkken, örnek cümlelerin içindeki ekstra kelimeler de havuza dahil edilir.",
    faqQ5: "Mistakes (Yanlışlarım) nasıl çalışır?",
    faqA5: "Testlerde veya alıştırmalarda yanlış yaptığınız sorular buraya kaydedilir. Bir soruyu doğru yapana kadar burada kalır.",
    faqQ6: "Alıştırmalar ve Test arasındaki fark nedir?",
    faqA6: "Alıştırmalar sınırsız ve serbest çalışma modudur, üniteyi tamamlamaz. Test ise üniteyi geçmek için çözmeniz gereken sınavdır.",
    faqQ7: "Verilerimi nasıl yedeklerim?",
    faqA7: "Ayarlar sayfasından 'Verileri Yedekle' diyerek JSON dosyası olarak indirebilir ve başka bir cihazda 'Yedekten Geri Yükle' ile açabilirsiniz.",

    // Faz 11.6 — Gramer Modal, Ceviri ve Onboarding
    startExercise: "Alıştırmayı Başlat",
    examples: "Örnekler",
    example: "Örnek",
    gender: "Cinsiyet",
    rule: "Kural",
    grammarNotFound: "Gramer notu bulunamadı.",
    congratulationsPassed: "Tebrikler, geçtiniz",
    failedTryAgain: "Kaldınız, tekrar deneyin",
    grammarSubtitle: "Temel Rusça dilbilgisi kuralları, tablolar ve mini alıştırmalar.",
    onboardingFaqTooltip: "Rusça öğrenmeye yeni mi başladın? Başlamadan önce Sıkça Sorulan Sorular (FAQ) kısmına göz atmalısın!",
    goToFaq: "FAQ'ya Git",
    close: "Kapat",

    // Faz 11.7 — Mixed Mode & Ekstra İyileştirmeler
    selectModes: "Modları Seç",
    selectAtLeastTwoModes: "Lütfen en az 2 mod seçin.",
    mixedModesModalTitle: "Karışık Mod Türleri",
    mixedModesModalDesc: "Alıştırmada yer almasını istediğiniz en az 2 modu seçin.",
    allModesSelected: "Tüm Modlar Aktif",
    modesSelectedCount: "mod seçildi",
    done: "Tamam",
    noExampleSentences: "Örnek cümle bulunmuyor",
    questionCountTooltip: "Alıştırma oturumundaki soru veya çift sayısı",
    questionsLabel: "Soru",
    micPermissionDenied: "Mikrofon izni verilmedi. Lütfen tarayıcı ayarlarından mikrofona izin verin.",
    speechNotDetected: "Ses algılanamadı. Lütfen tekrar deneyin.",
    speechRecognitionError: "Konuşma tanıma hatası. Lütfen tekrar deneyin.",
    numberBadgeTitle: "Sayı:",
    sentenceExtraWord: "Cümleden Ekstra Kelime",
    mixedModeDesc: "Çoktan seçmeli, boşluk doldurma, eşleştirme, dinleme, konuşma ve cümle kurma sorularını rastgele harmanlar.",

    // Faz 11.8 — Ana Sayfa PC Rehberi (Swiper)
    welcomeTitle: "Hoş Geldiniz!",
    welcomeDesc: "Derse başlamak için aşağıdaki ünitelere tıklayın.",
    progressTitle: "Nasıl İlerlenir?",
    progressDesc: "Dersleri bitirin, testleri geçin ve yeni ünitelerin kilidini açın.",
    reviewTitle: "Tekrar Etmeyi Unutmayın!",
    reviewDesc: "Öğrendiklerinizi unutmamak için her gün Review kısmına göz atın.",
    dismissGuide: "Rehberi Kapat",

    // Faz 12.0 — Erişilebilirlik ve Hızlı Erişim
    jumpToUnit: "Üniteye Atla",
    unitList: "Ünite Listesi",
    openUnits: "Açık Üniteler",
    lockedUnits: "Kilitli Üniteler",
    navHelp: "İstediğiniz üniteye hızlıca geçiş yapın",

    // Faz 14.0 — SpeedType ve Grammar Test
    speedType: "SpeedType",
    speedTypeDesc: "Rusça klavye hız ve doğruluk testi.",
    grammarTest: "Gramer Testi",
    grammarTestDesc: "Tüm ünitelerden karışık 10 soruluk kapsamlı gramer testi.",
    wpm: "WPM",
    accuracy: "Doğruluk",
    timeLeft: "Kalan Süre",
    restartTest: "Tekrar Dene",
    typingTestInstruction: "Yazmaya başlayın...",
    speedTypeTime: "süre",
    speedTypeWords: "kelime",
    speedTypePunct: "noktalama",
    speedTypeNumbers: "sayılar",
    speedTypeRace: "Yarış",
    speedTypeSoundOn: "Sesi kapat",
    speedTypeSoundOff: "Sesi aç",
    speedTypeFocusMessage: "Odaklanmak için buraya tıklayın",
    speedTypeRestartHint: "Yeniden başlatmak için Shift + Enter",
    speedTypeTestType: "test türü",
    speedTypeRaw: "ham",
    speedTypeCharacters: "karakterler",
    speedTypeConsistency: "tutarlılık",
    speedTypeSearchPlaceholder: "Aramak için yazın...",
    raceTitle: "Çevrimiçi 1v1 Yarış",
    raceSubtitle: "Canlı olarak başka bir oyuncuyla yarışmak için kullanıcı adınızı girin",
    raceUsernamePlaceholder: "Kullanıcı adınız",
    raceStartBtn: "Yarışı Başlat",
    raceBackToSolo: "← Tekli Alıştırmaya Dön",
    raceFindingOpponent: "Rakip aranıyor...",
    raceFindingDesc: "Sizi başka bir oyuncuyla eşleştirirken lütfen bekleyin",
    raceCancelMatchmaking: "Eşleşmeyi İptal Et",
    raceYourProgress: "Sizin İlerlemeniz",
    raceOpponentDisconnected: "Rakibin bağlantısı kesildi!",
    raceResults: "Yarış Sonuçları",
    raceWaitingForOpponent: "Rakibin bitirmesi bekleniyor...",
    raceAgain: "Yeniden Yarış",
    raceWinner: "KAZANAN",
    raceLoser: "KAYBEDEN",
    raceTie: "BERABERE",
    raceRussian: "RU Rusça",
    raceEnglish: "EN İngilizce",
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
    skip: "Skip",
    skipped: "Skipped",
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

    // Faz 9 — Data Backup & Restore
    dataManagement: "Data Management",
    exportData: "Export Data",
    importData: "Import Data",
    exportSuccess: "Backup file downloaded successfully.",
    importSuccess: "Data restored successfully. Reloading page...",
    importError: "Invalid backup file or restore failed.",
    confirmImportWarning: "Warning! All your current progress will be deleted and data from the selected file will be restored. Do you want to continue?",
    backupVersion: "Backup Version",

    // Faz 10.2 — Soru Sayısı ve Konuşma Modu
    speaking: "Speaking",
    micNotSupported: "Your browser does not support speech recognition",
    speakNow: "Speak now...",
    correctPronunciation: "Great! Correct pronunciation.",
    wrongPronunciation: "Heard incorrectly. Try again.",
    heardAs: "Heard as",
    questionCount: "Question Count",
    startSpeaking: "Start Speaking",
    stopSpeaking: "Stop",
    listeningState: "Listening...",

    // Faz 10.6 — Word Bank (Sentence Builder)
    wordBank: "Word Bank",
    sentenceBuilder: "Sentence Builder",
    buildSentence: "Build the sentence",
    translateToRussian: "Translate this sentence to Russian",
    translateToTarget: "Build the sentence",
    tapWordsInOrder: "Tap the words in the correct order",
    checkAnswer: "Check Answer",

    // Faz 10.9 & 11.0 — Review help and include all words
    reviewHelp: "Rating Guide",
    againDesc: "Didn't remember, will be shown in a few minutes.",
    hardDesc: "Remembered but struggled, will be shown in a few days.",
    goodDesc: "Thought a bit but got it right, will be shown in about a week.",
    easyDesc: "Knew it instantly, will be shown in a month.",
    includeAllWords: "Include All Words",
    includeAllWordsDesc: "Also include words from locked units in review.",
    includeAllWordsHelp: "When enabled, you can practice all words in the database even if they are not on units lesson. When disabled, only words on the unit that are are shown.",
    matchingLimitInfo: "Matching mode shows max 4 pairs.",

    // Faz 11.3 — Ekstra kelime bağlamı
    context: "Context",

    // Faz 11.4 — Sayılar filtreleme
    numbersExcludedFromReview: "Numbers are not included in the general review pool. You can practice numbers in Practice mode.",
    practiceNumbers: "Practice Numbers in Practice Mode",

    // Faz 11.5 — Kilit Aşma & FAQ
    confirmUnlockTitle: "Unlock Unit",
    confirmUnlockDesc: "This unit is locked. Are you sure you want to proceed to this unit without completing previous units?",
    confirmUnlockAction: "Yes, Unlock Unit",
    cancel: "Cancel",
    faq: "FAQ",
    faqTitle: "Frequently Asked Questions",
    faqSubtitle: "Frequently asked questions about the app and learning process",
    faqQ1: "Where should I start?",
    faqA1: "Start with the alphabet and progress in units step by step. Follow the Unit Lessons -> Review Cycle -> Go To Practice try all of the question type -> Learn some grammar",
    faqQ2: "Can I skip units?",
    faqA2: "Yes, when you click on a locked unit, you can confirm to unlock and access it directly.",
    faqQ3: "How do language settings work?",
    faqA3: "UI language changes the application menus and interface. Translation language determines the language used for Russian word meanings.",
    faqQ4: "What is Review and Include All Words?",
    faqA4: "Review lets you practice words before you forget them using an SRS algorithm. When Include All Words is enabled, extra words appearing in example sentences are also included in the pool.",
    faqQ5: "How does Mistakes work?",
    faqA5: "Questions you answer incorrectly in tests or practice sessions are saved here. They remain until you answer them correctly.",
    faqQ6: "What is the difference between Practice and Test?",
    faqA6: "Practice is an unlimited free study mode that does not require to complete a unit. Test is the exam you must pass to successfully complete the unit.",
    faqQ7: "How do I backup my data?",
    faqA7: "You can download a JSON file by clicking 'Export Data' in the Settings page, and restore it on another device using 'Import Data'.",

    // Faz 11.6 — Gramer Modal, Ceviri ve Onboarding
    startExercise: "Start Exercise",
    examples: "Examples",
    example: "Example",
    gender: "Gender",
    rule: "Rule",
    grammarNotFound: "Grammar note not found.",
    congratulationsPassed: "Congratulations, you passed",
    failedTryAgain: "Failed, try again",
    grammarSubtitle: "Essential Russian grammar rules, reference tables, and mini exercises.",
    onboardingFaqTooltip: "New to learning Russian? Check out the Frequently Asked Questions (FAQ) before getting started!",
    goToFaq: "Go to FAQ",
    close: "Close",

    // Faz 11.7 — Mixed Mode & Ekstra İyileştirmeler
    selectModes: "Select Modes",
    selectAtLeastTwoModes: "Please select at least 2 modes.",
    mixedModesModalTitle: "Mixed Mode Types",
    mixedModesModalDesc: "Select at least 2 modes you want to include in the practice.",
    allModesSelected: "All Modes Active",
    modesSelectedCount: "modes selected",
    done: "Done",
    noExampleSentences: "No example sentences",
    questionCountTooltip: "Number of questions or pairs in the practice session",
    questionsLabel: "Questions",
    micPermissionDenied: "Microphone permission denied. Please allow microphone access in browser settings.",
    speechNotDetected: "No speech detected. Please try again.",
    speechRecognitionError: "Speech recognition error. Please try again.",
    numberBadgeTitle: "Number:",
    sentenceExtraWord: "Sentence Extra Word",
    mixedModeDesc: "Randomly blends multiple choice, fill in the blank, matching, listening, speaking, and sentence building.",

    // Faz 11.8 — Ana Sayfa PC Rehberi (Swiper)
    welcomeTitle: "Welcome!",
    welcomeDesc: "Click on the units below to start learning.",
    progressTitle: "How to Progress?",
    progressDesc: "Complete lessons, pass tests, and unlock new units, practice all modes and check your mistakes",
    reviewTitle: "Don't Forget to Review!",
    reviewDesc: "Check the Review section daily to retain what you've learned.",
    dismissGuide: "Dismiss Guide",

    // Faz 12.0 — Accessibility & Quick Navigation
    jumpToUnit: "Jump to Unit",
    unitList: "Unit List",
    openUnits: "Unlocked Units",
    lockedUnits: "Locked Units",
    navHelp: "Quickly navigate to any unit",

    // Faz 14.0 — SpeedType ve Grammar Test
    speedType: "SpeedType",
    speedTypeDesc: "Russian keyboard speed and accuracy test.",
    grammarTest: "Grammar Test",
    grammarTestDesc: "10-question comprehensive mixed grammar test from all units.",
    wpm: "WPM",
    accuracy: "Accuracy",
    timeLeft: "Time Left",
    restartTest: "Restart Test",
    typingTestInstruction: "Start typing...",
    speedTypeTime: "time",
    speedTypeWords: "words",
    speedTypePunct: "punct",
    speedTypeNumbers: "numbers",
    speedTypeRace: "Race",
    speedTypeSoundOn: "Mute sound",
    speedTypeSoundOff: "Enable sound",
    speedTypeFocusMessage: "Click here to focus",
    speedTypeRestartHint: "Shift + Enter to restart",
    speedTypeTestType: "test type",
    speedTypeRaw: "raw",
    speedTypeCharacters: "characters",
    speedTypeConsistency: "consistency",
    speedTypeSearchPlaceholder: "Type to search...",
    raceTitle: "Online 1v1 Race",
    raceSubtitle: "Enter your username to race against another player live",
    raceUsernamePlaceholder: "Your username",
    raceStartBtn: "Start Racing",
    raceBackToSolo: "← Back to Solo Practice",
    raceFindingOpponent: "Finding opponent...",
    raceFindingDesc: "Please wait while we match you with another player",
    raceCancelMatchmaking: "Cancel Matchmaking",
    raceYourProgress: "Your Progress",
    raceOpponentDisconnected: "Opponent disconnected!",
    raceResults: "Race Results",
    raceWaitingForOpponent: "Waiting for opponent to finish...",
    raceAgain: "Race Again",
    raceWinner: "WINNER",
    raceLoser: "LOSER",
    raceTie: "TIE",
    raceRussian: "RU Russian",
    raceEnglish: "EN English",
  },
};

/**
 * Belirli bir dil ve anahtar için mesajı döndürür.
 * Anahtar bulunamazsa anahtarın kendisini döndürür.
 */
export function getMessage(lang: Lang, key: keyof Messages): string {
  return messages[lang]?.[key] ?? messages.en[key] ?? messages.tr[key] ?? key;
}

/**
 * Tüm mesaj objesini döndürür.
 * Bileşen içinde birden fazla mesaj gerektiğinde kullanılır.
 */
export function getMessages(lang: Lang): Messages {
  return messages[lang] ?? messages.en ?? messages.tr;
}
