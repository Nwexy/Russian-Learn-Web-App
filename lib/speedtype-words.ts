/**
 * SpeedTypeApp dictionary words data
 * Ported directly from SpeedTypeApp/wwwroot/js/words.js with Russian language support added
 */

export interface LanguageItem {
  id: string;
  name: string;
  words: string[];
}

export const commonEn: string[] = [
  "the", "be", "of", "and", "a", "to", "in", "he", "have", "it", "that", "for", "they", "with", "as", "not", "on", "she", "at", "by",
  "this", "we", "you", "do", "but", "from", "or", "which", "one", "would", "all", "will", "there", "say", "who", "make", "when", "can", "more", "if",
  "no", "man", "out", "other", "so", "what", "time", "up", "go", "about", "than", "into", "could", "state", "only", "new", "year", "some", "take", "come",
  "these", "know", "see", "use", "get", "like", "then", "first", "any", "work", "now", "may", "such", "give", "over", "think", "most", "even", "find", "day",
  "also", "after", "way", "many", "must", "look", "before", "great", "back", "through", "long", "where", "much", "should", "well", "people", "down", "own", "just", "because",
  "good", "each", "those", "feel", "seem", "how", "high", "too", "place", "little", "world", "very", "still", "nation", "hand", "old", "life", "tell", "write", "become",
  "here", "show", "house", "both", "between", "need", "mean", "call", "develop", "under", "last", "right", "move", "thing", "general", "school", "never", "same", "another", "begin",
  "while", "number", "part", "turn", "real", "leave", "might", "want", "point", "form", "off", "child", "few", "small", "since", "against", "ask", "late", "home", "interest",
  "large", "person", "end", "open", "public", "follow", "during", "present", "without", "again", "hold", "govern", "around", "possible", "head", "consider", "word", "program", "problem", "however",
  "lead", "system", "set", "order", "eye", "plan", "run", "keep", "face", "fact", "group", "play", "stand", "increase", "early", "course", "change", "help", "line", "city",
  "put", "close", "case", "force", "meet", "once", "water", "upon", "war", "build", "hear", "light", "unite", "live", "every", "country", "bring", "center", "let", "side",
  "try", "provide", "continue", "name", "certain", "power", "pay", "result", "question", "study", "woman", "member", "until", "far", "night", "always", "service", "away", "report", "something",
  "company", "week", "church", "toward", "start", "social", "room", "figure", "nature", "though", "young", "less", "enough", "almost", "read", "include", "president", "nothing", "yet", "better",
  "big", "boy", "cost", "business", "value", "second", "why", "clear", "expect", "family", "complete", "act", "sense", "mind", "experience", "art", "next", "near", "direct", "car",
  "law", "industry", "important", "girl", "god", "several", "matter", "usual", "rather", "per", "often", "kind", "among", "white", "reason", "action", "return", "foot", "care", "simple",
  "within", "love", "human", "along", "appear", "doctor", "believe", "speak", "active", "student", "month", "drive", "concern", "best", "door", "hope", "example", "inform", "body", "ever",
  "least", "probable", "understand", "reach", "effect", "different", "idea", "whole", "control", "condition", "field", "pass", "fall", "note", "special", "talk", "particular", "today", "measure", "walk",
  "teach", "low", "hour", "type", "carry", "rate", "remain", "full", "street", "easy", "although", "record", "sit", "determine", "level", "local", "sure", "receive", "thus", "moment",
  "spirit", "train", "college", "religion", "perhaps", "music", "grow", "free", "cause", "serve", "age", "book", "board", "recent", "sound", "office", "cut", "step", "class", "true",
  "history", "position", "above", "strong", "friend", "necessary", "add", "court", "deal", "tax", "support", "party", "whether", "either", "land", "material", "happen", "education", "death", "agree",
  "arm", "mother", "across", "quite", "anything", "town", "past", "view", "society", "manage", "answer", "break", "organize", "half", "fire", "lose", "money", "stop", "actual", "already",
  "effort", "wait", "department", "able", "political", "learn", "voice", "air", "together", "shall", "cover", "common", "subject", "draw", "short", "wife", "treat", "limit", "road", "letter",
  "color", "behind", "produce", "send", "term", "total", "university", "rise", "century", "success", "minute", "remember", "purpose", "test", "fight", "watch", "situation", "south", "ago", "stage",
  "father", "table", "rest", "bear", "entire", "market", "prepare", "explain", "offer", "plant", "charge", "ground", "west", "picture", "hard", "front", "lie", "modern", "dark", "surface",
  "rule", "regard", "dance", "peace", "observe", "future", "wall", "farm", "claim", "firm", "operation", "further", "pressure", "property", "morning", "amount", "top", "outside", "piece", "sometimes",
  "beauty", "trade", "fear", "demand", "wonder", "list", "accept", "judge", "paint", "mile", "soon", "responsible", "allow", "secretary", "heart", "union", "slow", "island", "enter", "drink",
  "story", "experiment", "stay", "paper", "space", "apply", "decide", "share", "desire", "spend", "sign", "therefore", "various", "visit", "supply", "officer", "doubt", "private", "immediate", "wish",
  "contain", "feed", "raise", "describe", "ready", "horse", "son", "exist", "north", "suggest", "station", "effective", "food", "identity", "buy", "led"
];

export const commonTr: string[] = [
  "bir", "ve", "olmak", "için", "bu", "o", "ben", "demek", "çok", "yapmak", "ne", "gibi", "daha", "almak", "var", "kendi", "gelmek", "ile", "vermek", "ama",
  "sonra", "kadar", "yer", "en", "insan", "değil", "istemek", "yıl", "çıkmak", "görmek", "gün", "biz", "gitmek", "iş", "şey", "ara", "her", "iki", "bilmek", "el",
  "zaman", "çocuk", "bakmak", "çalışmak", "içinde", "büyük", "yok", "başlamak", "yol", "kalmak", "neden", "konuşmak", "yeni", "söylemek", "anlamak", "saat", "bulmak", "etmek", "düşmek", "baba",
  "eski", "kadın", "oynamak", "durmak", "yaşamak", "küçük", "geçmek", "bırakmak", "anne", "biri", "devlet", "güzel", "yüz", "son", "söz", "şu", "sevmek", "iyi", "kitap", "girmek",
  "hal", "tutmak", "başka", "getirmek", "dünya", "baş", "koymak", "yazmak", "duymak", "ev", "sormak", "türk", "aynı", "oturmak", "tek", "çekmek", "birlikte", "para", "gece", "genç",
  "ad", "açmak", "ses", "masa", "dışarı", "uzun", "yan", "olay", "zor", "sevgi", "tanrı", "yürümek", "kapı", "haber", "kişi", "konu", "yemek", "hiç", "okumak", "kimse",
  "düşünce", "bugün", "adam", "bilgi", "ölüm", "savaş", "hasta", "hayat", "ay", "sanmak", "kan", "güç", "erkek", "atmak", "gerek", "şehir", "efendi", "anlatmak", "kul", "devam",
  "hızlı", "karşı", "ülke", "düşman", "asker", "hak", "sonuç", "kelime", "okul", "ayak", "bey", "basit", "açık", "sistem", "taraf", "sıra", "sorun", "gerçek", "yaşam", "düşünmek",
  "resim", "hükümet", "sıcak", "ekmek", "üzerine", "kurmak", "kardeş", "korku", "yatak", "mektup", "oda", "kuş", "yüzde", "hafta", "yakın", "sokak", "ilişki", "dikkat", "sevgili", "özel",
  "kız", "program", "dakika", "halk", "tam", "şarkı", "değer", "siyah", "beyaz", "müzik", "bilim", "yasa", "ürün", "derin", "hava", "ağaç", "deniz", "sarı", "mavi", "yeşil",
  "duvar", "pencere", "kalp", "beyin", "araç", "grup", "örnek", "cevap", "toplum", "tarih", "dil", "sanat", "oyun", "alan", "film", "köy", "bölge", "nokta", "beden", "yön",
  "bakan", "araba", "köpek", "kedi", "ağız", "saç", "kulak", "burun", "kol", "bacak", "parmak", "isim", "fikir", "akıl", "ruh", "din", "cam", "bahçe", "çiçek", "dağ",
  "taş", "toprak", "ateş", "rüzgar", "yağmur", "kar", "yıldız", "güneş", "sabah", "akşam", "öğlen", "şimdi", "yarın", "dün", "erken", "geç", "hemen", "çabuk", "yavaş", "doğru",
  "yanlış", "boş", "dolu", "temiz", "kirli", "zengin", "fakir", "mutlu", "üzgün", "kızgın", "yorgun", "aç", "tok", "söğüt", "soğuk", "tatlı", "acı", "ekşi", "tuzlu", "renk",
  "şekil", "sayı", "harf", "yazı", "kalem", "kağıt"
];

export const commonRu: string[] = [
  "и", "в", "не", "на", "я", "что", "тот", "быть", "с", "он", "а", "весь", "это", "как", "она", "по", "но", "они", "к", "у",
  "ты", "из", "мы", "за", "вы", "же", "от", "сказать", "этот", "который", "мочь", "человек", "о", "один", "еще", "бы", "такой", "только", "себя", "свое",
  "какой", "когда", "уже", "для", "вот", "кто", "да", "говорить", "год", "знать", "мой", "до", "или", "если", "время", "рука", "нет", "самый", "ни", "стать",
  "большой", "даже", "другой", "наш", "свой", "под", "где", "дело", "есть", "сам", "раз", "чтобы", "два", "там", "чем", "глаз", "жизнь", "первый", "день", "тут",
  "во", "ничто", "потом", "очень", "со", "хотеть", "ли", "при", "голова", "надо", "без", "видеть", "идти", "теперь", "тоже", "стоять", "друг", "дом", "сейчас", "можно",
  "после", "слово", "здесь", "думать", "место", "спросить", "через", "лицо", "чтоб", "тогда", "ведь", "хороший", "каждый", "новый", "жить", "должный", "смотреть", "почему", "понять", "пойти",
  "девушка", "машина", "окно", "город", "вода", "стол", "книга", "мама", "папа", "работа", "школа", "неделя", "месяц", "вопрос", "ответ", "улица", "поезд", "дорога", "парк", "кино",
  "театр", "музыка", "песня", "фильм", "письмо", "телефон", "компьютер", "утро", "вечер", "сегодня", "завтра", "вчера", "хорошо", "плохо", "быстро", "медленно", "много", "мало", "старый", "маленький",
  "красивый", "добрый", "умный", "белый", "черный", "красный", "синий", "зеленый", "желтый", "второй", "третий", "читать", "писать", "слушать", "учить", "любить", "делать", "ехать", "пить", "спать",
  "купить", "открыть", "закрыть", "ждать", "помнить", "ответить", "играть", "гулять", "помогать", "солнце", "небо", "море", "река", "лес", "зима", "весна", "лето", "осень", "погода", "дождь",
  "снег", "ветер", "тепло", "холодно", "правда", "урок", "ручка", "дверь", "брат", "сестра", "друг", "врач", "студент", "учитель", "собака", "кошка", "хлеб", "сыр", "чай", "кофе"
];

export const pythonWords: string[] = [
  "print", "import", "return", "def", "class", "if", "else", "elif", "for", "while", "break", "continue", "True", "False", "None", "list", "dict", "set", "str", "int",
  "float", "try", "except", "finally", "with", "as", "lambda", "map", "filter", "reduce", "len", "range", "open", "read", "write", "append", "split", "join", "strip",
  "yield", "global", "nonlocal", "assert", "del", "pass", "raise", "from", "in", "is", "not", "or", "and", "tuple", "bool", "self", "super", "__init__", "close", "extend"
];

export const csharpWords: string[] = [
  "public", "private", "class", "interface", "void", "int", "string", "bool", "var", "namespace", "using", "return", "new", "this", "base", "virtual", "override", "static", "async", "await",
  "task", "list", "dictionary", "linq", "where", "select", "get", "set", "value", "program", "main", "console", "writeline", "readline", "try", "catch", "finally", "throw", "exception",
  "if", "else", "for", "foreach", "while", "do", "switch", "case", "break", "continue", "protected", "internal", "struct", "enum", "double", "float", "decimal", "lock", "delegate", "event"
];

export const languageData: LanguageItem[] = [
  { id: "russian", name: "Russian", words: commonRu.slice(0, 200) },
  { id: "russian_1k", name: "Russian 1k", words: commonRu.concat(commonRu).concat(commonRu).slice(0, 1000) },
  { id: "english", name: "English", words: commonEn.slice(0, 200) },
  { id: "english_1k", name: "English 1k", words: commonEn },
  { id: "english_5k", name: "English 5k", words: commonEn.concat(commonEn).concat(commonEn) },
  { id: "turkish", name: "Turkish", words: commonTr.slice(0, 200) },
  { id: "turkish_1k", name: "Turkish 1k", words: commonTr },
  { id: "python", name: "Python", words: pythonWords },
  { id: "csharp", name: "C#", words: csharpWords }
];
