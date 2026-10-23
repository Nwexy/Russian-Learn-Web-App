/**
 * Örnek cümlelerden (exampleRu) ana kelime olmayan yardımcı / ekstra kelimeleri çıkarma modülü.
 * Faz 11.2 & 11.3: "Include All Words" açıkken havuza bu ekstra kelimeler de dahil edilir.
 * Faz 11.3: Ekstra kelimelerin kendi sözlük anlamı (wordTr, wordEn) ve cümle bağlamı ayrıldı.
 */

import type { Item, UnitData } from "@/types";

// Statik import edilen modüller
import unitAlphabet from "@/content/unit-00-alphabet.json";
import unitGreetings from "@/content/unit-01-greetings.json";
import unitNumbers from "@/content/unit-02-numbers.json";
import unitColors from "@/content/unit-03-colors.json";
import unitFamily from "@/content/unit-04-family.json";
import unitVerbs from "@/content/unit-05-verbs.json";
import unitAdjectives from "@/content/unit-06-adjectives.json";
import unitFood from "@/content/unit-07-food.json";
import unitHobbies from "@/content/unit-08-hobbies.json";
import unitWeather from "@/content/unit-09-weather.json";
import unitTime from "@/content/unit-10-time.json";
import unitHouse from "@/content/unit-11-house.json";
import unitCity from "@/content/unit-12-city.json";
import unitClothes from "@/content/unit-13-clothes.json";
import unitBody from "@/content/unit-14-body.json";

const ALL_UNIT_DATA: UnitData[] = [
  unitAlphabet as UnitData,
  unitGreetings as UnitData,
  unitNumbers as UnitData,
  unitColors as UnitData,
  unitFamily as UnitData,
  unitVerbs as UnitData,
  unitAdjectives as UnitData,
  unitFood as UnitData,
  unitHobbies as UnitData,
  unitWeather as UnitData,
  unitTime as UnitData,
  unitHouse as UnitData,
  unitCity as UnitData,
  unitClothes as UnitData,
  unitBody as UnitData,
];

/**
 * Ekstra kelime sözlüğü — Cümlelerde geçen yardımcı kelimelerin kendi tekil anlamları.
 * Faz 11.3: Cümlenin genel çevirisi yerine kelimenin gerçek sözlük anlamı gösterilir.
 */
export const EXTRA_WORDS_DICTIONARY: Record<string, { tr: string; en: string }> = {
  // Soru kelimeleri ve zamirler
  "где": { tr: "nerede", en: "where" },
  "куда": { tr: "nereye", en: "where to" },
  "откуда": { tr: "nereden", en: "where from" },
  "когда": { tr: "ne zaman", en: "when" },
  "почему": { tr: "neden", en: "why" },
  "зачем": { tr: "ne için / ne amaçla", en: "what for" },
  "как": { tr: "nasıl", en: "how" },
  "кто": { tr: "kim", en: "who" },
  "что": { tr: "ne / ki", en: "what / that" },
  "сколько": { tr: "kaç / ne kadar", en: "how much / how many" },
  "чей": { tr: "kimin", en: "whose" },

  // Kişi zamirleri ve halleri
  "вы": { tr: "siz", en: "you (formal/plural)" },
  "ты": { tr: "sen", en: "you (informal)" },
  "мы": { tr: "biz", en: "we" },
  "он": { tr: "o (eril)", en: "he" },
  "она": { tr: "o (dişil)", en: "she" },
  "оно": { tr: "o (nötr)", en: "it" },
  "они": { tr: "onlar", en: "they" },
  "меня": { tr: "beni / benim", en: "me / my" },
  "тебя": { tr: "seni / senin", en: "you / your" },
  "вас": { tr: "sizi / sizin", en: "you / your" },
  "вам": { tr: "size", en: "to you" },
  "мне": { tr: "bana", en: "to me" },
  "ему": { tr: "ona (eril)", en: "to him" },
  "ей": { tr: "ona (dişil)", en: "to her" },
  "нам": { tr: "bize", en: "to us" },
  "им": { tr: "onlara", en: "to them" },
  "него": { tr: "onun / onu (eril)", en: "him / his" },
  "неё": { tr: "onun / onu (dişil)", en: "her" },

  // İşaret zamirleri
  "это": { tr: "bu", en: "this / it is" },
  "этот": { tr: "bu (eril)", en: "this (masc.)" },
  "эта": { tr: "bu (dişil)", en: "this (fem.)" },
  "эти": { tr: "bunlar", en: "these" },
  "этом": { tr: "bu (edat halinde)", en: "this (prep.)" },
  "этой": { tr: "bu (dişil)", en: "this (fem.)" },
  "эту": { tr: "bu (belirtme hali)", en: "this (acc.)" },
  "тот": { tr: "şu / o", en: "that" },
  "та": { tr: "şu / o (dişil)", en: "that (fem.)" },
  "то": { tr: "o / şu", en: "that" },
  "те": { tr: "şunlar / onlar", en: "those" },

  // Sık geçen yardımcı kelimeler ve edatlar
  "метро": { tr: "metro", en: "metro / subway" },
  "скажите": { tr: "söyleyin", en: "tell / tell me" },
  "сказать": { tr: "söylemek", en: "to say / to tell" },
  "пожалуйста": { tr: "lütfen / rica ederim", en: "please / you're welcome" },
  "помощь": { tr: "yardım", en: "help" },
  "помочь": { tr: "yardım etmek", en: "to help" },
  "могу": { tr: "yapabilirim", en: "I can" },
  "может": { tr: "yapabilir", en: "can / he can" },
  "можете": { tr: "yapabilirsiniz", en: "you can" },
  "опоздал": { tr: "geç kaldı (eril)", en: "is late (masc.)" },
  "опоздала": { tr: "geç kaldı (dişil)", en: "was late (fem.)" },
  "фильме": { tr: "filmde", en: "in the movie" },
  "фильм": { tr: "film", en: "movie" },
  "пора": { tr: "vakti geldi", en: "it's time" },
  "всё": { tr: "her şey / hepsi", en: "everything / all" },
  "все": { tr: "herkes / tümü", en: "everyone / all" },
  "ещё": { tr: "daha / henüz / bir daha", en: "more / yet / again" },
  "раз": { tr: "kez / defa", en: "time / once" },
  "стоит": { tr: "maliyeti / tutar", en: "costs" },
  "рублей": { tr: "ruble", en: "rubles" },
  "градусов": { tr: "derece", en: "degrees" },
  "через": { tr: "sonra / içinden", en: "in / after / through" },
  "минут": { tr: "dakika", en: "minutes" },
  "минуту": { tr: "bir dakika", en: "a minute" },
  "года": { tr: "yıl / yaşında", en: "years" },
  "лет": { tr: "yıl / yaşında", en: "years" },
  "год": { tr: "yıl", en: "year" },
  "спали": { tr: "uyudunuz", en: "slept" },
  "спать": { tr: "uyumak", en: "to sleep" },
  "рад": { tr: "memnun", en: "glad / pleased" },
  "рада": { tr: "memnun (kadın)", en: "glad (fem.)" },
  "увидимся": { tr: "görüşürüz", en: "see you" },
  "приятных": { tr: "tatlı / hoş", en: "pleasant / sweet" },
  "снов": { tr: "rüyalar", en: "dreams" },
  "сон": { tr: "rüya / uyku", en: "dream / sleep" },
  "плохая": { tr: "kötü (dişil)", en: "bad (fem.)" },
  "плохой": { tr: "kötü (eril)", en: "bad (masc.)" },
  "придёшь": { tr: "geleceksin", en: "will come" },
  "русски": { tr: "Rusça", en: "in Russian" },
  "температура": { tr: "sıcaklık", en: "temperature" },
  "зовут": { tr: "çağrılır / adı", en: "is called" },
  "имя": { tr: "isim / ad", en: "name" },
  "кот": { tr: "kedi", en: "cat" },
  "лампа": { tr: "lampa", en: "lamp" },
  "торт": { tr: "pasta", en: "cake" },
  "фото": { tr: "fotoğraf", en: "photo" },
  "центр": { tr: "merkez", en: "center" },
  "журнал": { tr: "dergi", en: "magazine" },
  "йогурт": { tr: "yoğurt", en: "yogurt" },
  "ёлка": { tr: "çam ağacı", en: "fir / christmas tree" },
  "ель": { tr: "göknar / çam", en: "fir tree" },
  "щука": { tr: "turna balığı", en: "pike (fish)" },
  "объект": { tr: "nesne / tesis", en: "object / facility" },

  // Zaman ve durum zarfları
  "очень": { tr: "çok", en: "very" },
  "тоже": { tr: "de / da / aynı şekilde", en: "also / too" },
  "также": { tr: "ayrıca", en: "also / as well" },
  "хорошо": { tr: "iyi / güzel", en: "well / good" },
  "отлично": { tr: "harika / mükemmel", en: "great / excellent" },
  "конечно": { tr: "elbette / tabii ki", en: "of course" },
  "сегодня": { tr: "bugün", en: "today" },
  "завtra": { tr: "yarın", en: "tomorrow" },
  "завтра": { tr: "yarın", en: "tomorrow" },
  "вчера": { tr: "dün", en: "yesterday" },
  "сейчас": { tr: "şimdi", en: "now" },
  "здесь": { tr: "burada", en: "here" },
  "там": { tr: "orada", en: "there" },
  "тут": { tr: "burada", en: "here" },
  "уже": { tr: "zaten / artık", en: "already" },
  "только": { tr: "sadece", en: "only" },
  "много": { tr: "çok / fazla", en: "a lot / many" },
  "мало": { tr: "az", en: "few / little" },
  "немного": { tr: "biraz", en: "a little" },
  "всегда": { tr: "her zaman", en: "always" },
  "никогда": { tr: "asla / hiçbir zaman", en: "never" },
  "иногда": { tr: "bazen", en: "sometimes" },
  "часто": { tr: "sık sık", en: "often" },
  "редко": { tr: "nadiren", en: "rarely" },
  "быстро": { tr: "hızlıca", en: "quickly" },
  "медленно": { tr: "yavaşça", en: "slowly" },
  "вместе": { tr: "birlikte", en: "together" },
  "домой": { tr: "eve (yönelme)", en: "home / homeward" },
  "дома": { tr: "evde", en: "at home" },

  // Fiiller ve çekimleri
  "живу": { tr: "yaşıyorum", en: "I live" },
  "живёт": { tr: "yaşıyor", en: "lives" },
  "живут": { tr: "yaşıyorlar", en: "they live" },
  "учусь": { tr: "öğrenim görüyorum", en: "I study" },
  "учится": { tr: "öğrenim görüyor", en: "studies" },
  "работаю": { tr: "çalışıyorum", en: "I work" },
  "работает": { tr: "çalışıyor", en: "works" },
  "работают": { tr: "çalışıyorlar", en: "they work" },
  "люблю": { tr: "seviyorum", en: "I love" },
  "любит": { tr: "seviyor", en: "loves" },
  "хочу": { tr: "istiyorum", en: "I want" },
  "хочет": { tr: "istiyor", en: "wants" },
  "знаю": { tr: "biliyorum", en: "I know" },
  "знает": { tr: "biliyor", en: "knows" },
  "понимаю": { tr: "anlıyorum", en: "I understand" },
  "понимает": { tr: "anlıyor", en: "understands" },
  "говорю": { tr: "konuşuyorum", en: "I speak" },
  "говорит": { tr: "konuşuyor", en: "speaks" },
  "читаю": { tr: "okuyorum", en: "I read" },
  "читает": { tr: "okuyor", en: "reads" },
  "пишу": { tr: "yazıyorum", en: "I write" },
  "пишет": { tr: "yazıyor", en: "writes" },
  "слушаю": { tr: "dinliyorum", en: "I listen" },
  "слушает": { tr: "dinliyor", en: "listens" },
  "смотрю": { tr: "izliyorum", en: "I watch" },
  "смотрит": { tr: "izliyor", en: "watches" },
  "делаю": { tr: "yapıyorum", en: "I do" },
  "делает": { tr: "yapıyor", en: "does" },
  "иду": { tr: "gidiyorum (yürüyerek)", en: "I walk / go" },
  "идёт": { tr: "gidiyor / yağıyor", en: "goes / is raining" },
  "еду": { tr: "gidiyorum (araçla)", en: "I drive / ride" },
  "едет": { tr: "gidiyor (araçla)", en: "drives / rides" },
  "купить": { tr: "satın almak", en: "to buy" },
  "купил": { tr: "satın aldı (eril)", en: "bought (masc.)" },
  "купила": { tr: "satın aldı (dişil)", en: "bought (fem.)" },
  "сидит": { tr: "oturuyor / duruyor", en: "sits / fits" },
  "идеально": { tr: "mükemmelce", en: "perfectly" },

  // Giyim, eşya ve sıfatlar
  "длинную": { tr: "uzun (belirtme)", en: "long (acc.)" },
  "синюю": { tr: "mavi (belirtme)", en: "blue (acc.)" },
  "юбку": { tr: "etek (belirtme)", en: "skirt (acc.)" },
  "юбка": { tr: "etek", en: "skirt" },
  "шерстяные": { tr: "yün / yünden", en: "woolen" },
  "носки": { tr: "çoraplar", en: "socks" },
  "согревают": { tr: "ısıtırlar", en: "warm up" },
  "ноги": { tr: "ayaklar / bacaklar", en: "feet / legs" },
  "нога": { tr: "ayak / bacak", en: "foot / leg" },
  "рука": { tr: "el / kol", en: "hand / arm" },
  "руку": { tr: "el (belirtme)", en: "hand (acc.)" },
  "кожаные": { tr: "deri / deriden", en: "leather" },
  "перчатки": { tr: "eldivenler", en: "gloves" },
  "погоду": { tr: "hava (belirtme)", en: "weather (acc.)" },
  "погода": { tr: "hava", en: "weather" },
  "холодную": { tr: "soğuk (belirtme)", en: "cold (acc.)" },
  "утренняя": { tr: "sabahki", en: "morning (adj.)" },
  "зарядка": { tr: "egzersiz / şarj", en: "exercise / workout" },
  "полезна": { tr: "faydalıdır", en: "is beneficial" },
  "тела": { tr: "vücudun", en: "of the body" },
  "тело": { tr: "vücut", en: "body" },
  "всего": { tr: "tümünün / hepsi", en: "of all / whole" },

  // Sağlık, vücut ve durum
  "сильно": { tr: "şiddetli / çok", en: "strongly / badly" },
  "болит": { tr: "ağrıyor", en: "hurts / aches" },
  "голова": { tr: "baş / kafa", en: "head" },
  "поднял": { tr: "kaldırdı", en: "raised / lifted" },
  "правую": { tr: "sağ (belirtme)", en: "right (acc.)" },
  "поздоровался": { tr: "selam verdi", en: "greeted / said hello" },
  "после": { tr: "sonra (-den sonra)", en: "after" },
  "долгой": { tr: "uzun", en: "long" },
  "прогулки": { tr: "yürüyüşün", en: "of a walk" },
  "прогулка": { tr: "yürüyüş", en: "walk" },
  "устала": { tr: "yoruldu (dişil)", en: "got tired (fem.)" },
  "девочки": { tr: "kızın / kızlar", en: "girl's / girls" },
  "девочка": { tr: "kız çocuk", en: "girl" },
  "красивые": { tr: "güzel (çoğul)", en: "beautiful (plural)" },
  "карие": { tr: "ela / kahverengi (göz)", en: "hazel / brown" },
  "глаза": { tr: "gözler", en: "eyes" },
  "глаз": { tr: "göz", en: "eye" },
  "ухо": { tr: "kulak", en: "ear" },
  "нос": { tr: "burun", en: "nose" },
  "рот": { tr: "ağız", en: "mouth" },
  "внимательно": { tr: "dikkatle", en: "attentively" },
  "осмотрел": { tr: "muayene etti / inceledi", en: "examined" },
  "больное": { tr: "ağrıyan / hasta", en: "painful / sick" },
  "сильном": { tr: "şiddetli", en: "severe / strong" },
  "морозе": { tr: "ayazda", en: "in the frost" },
  "мороз": { tr: "ayaz / don", en: "frost / severe cold" },
  "замёрз": { tr: "dondu", en: "froze" },
  "выписал": { tr: "yazdı (reçete)", en: "prescribed" },
  "больному": { tr: "hastaya", en: "to the patient" },
  "больной": { tr: "hasta", en: "patient / sick" },
  "врач": { tr: "doktor", en: "doctor" },
  "опытный": { tr: "deneyimli", en: "experienced" },
  "рецепт": { tr: "reçete", en: "prescription" },
  "крепкое": { tr: "sağlam / güçlü", en: "strong / robust" },
  "здоровье": { tr: "sağlık", en: "health" },
  "самое": { tr: "en (üstünlük)", en: "the most" },
  "главное": { tr: "en önemli / esas", en: "main / most important" },
  "богатство": { tr: "zenginlik", en: "wealth / richness" },
  "примите": { tr: "alınız / içiniz", en: "take (pill)" },
  "таблетку": { tr: "hap / tablet", en: "pill / tablet" },
  "еды": { tr: "yemeğin / yemekten", en: "of food / meal" },
  "еда": { tr: "yemek / yiyecek", en: "food" },

  // Mekan ve diğer genel kelimeler
  "аптека": { tr: "eczane", en: "pharmacy" },
  "больница": { tr: "hastane", en: "hospital" },
  "музей": { tr: "müze", en: "museum" },
  "театр": { tr: "tiyatro", en: "theater" },
  "билет": { tr: "bilet", en: "ticket" },
  "друг": { tr: "arkadaş", en: "friend" },
  "человек": { tr: "insan / kişi", en: "person / human" },
  "люди": { tr: "insanlar", en: "people" },
  "зима": { tr: "kış", en: "winter" },
  // Ek cümle kelimeleri (Faz 11.3 analizi)
  "анна": { tr: "Anna (kadın ismi)", en: "Anna (female name)" },
  "за": { tr: "için / arkasında", en: "for / behind" },
  "иван": { tr: "İvan (erkek ismi)", en: "Ivan (male name)" },
  "по": { tr: "boyunca / göre / üzerinden", en: "along / by / in" },
  "номер": { tr: "numara", en: "number" },
  "комнаты": { tr: "odanın / odalar", en: "of the room / rooms" },
  "автобус": { tr: "otobüs", en: "bus" },
  "автомобиль": { tr: "otomobil / araba", en: "automobile / car" },
  "костюм": { tr: "takım elbise", en: "suit" },
  "на": { tr: "üstünde / -de / -e", en: "on / at / to" },
  "столе": { tr: "masada", en: "on the table" },
  "лежит": { tr: "duruyor / yatıyor", en: "lies / is lying" },
  "лимон": { tr: "limon", en: "lemon" },
  "пью": { tr: "içiyorum", en: "I drink" },
  "без": { tr: "olmadan / -siz", en: "without" },
  "сахара": { tr: "şeker / şekerin", en: "of sugar" },
  "зимой": { tr: "kışın", en: "in winter" },
  "парке": { tr: "parkta", en: "in the park" },
  "улице": { tr: "sokakta / caddede", en: "on the street" },
  "дети": { tr: "çocuklar", en: "children" },
  "любят": { tr: "seviyorlar", en: "they love / like" },
  "апельсин": { tr: "portakal", en: "orange" },
  "шарф": { tr: "atkı / şal", en: "scarf" },
  "нас": { tr: "bizde / bizi", en: "us / of us" },
  "комнате": { tr: "odada", en: "in the room" },
  "диван": { tr: "kanepe / divan", en: "sofa / couch" },
  "вазе": { tr: "vazoda", en: "in the vase" },
  "цветок": { tr: "çiçek", en: "flower" },
  "летом": { tr: "yazın", en: "in summer" },
  "небо": { tr: "gökyüzü", en: "sky" },
  "чистое": { tr: "temiz / berrak", en: "clean / clear" },
  "голубое": { tr: "açık mavi", en: "light blue" },
  "моя": { tr: "benim (dişil)", en: "my (fem.)" },
  "готовит": { tr: "pişiriyor / hazırlıyor", en: "cooks / is cooking" },
  "мой": { tr: "benim (eril)", en: "my (masc.)" },
  "инженером": { tr: "mühendis olarak", en: "as an engineer" },
  "старший": { tr: "büyük / kıdemli", en: "older / senior" },
  "университете": { tr: "üniversitede", en: "at the university" },
  "книги": { tr: "kitaplar / kitabın", en: "books / of the book" },
  "их": { tr: "onların / onları", en: "their / them" },
  "ходит": { tr: "gidiyor (yürüyerek)", en: "goes / walks" },
  "школу": { tr: "okula", en: "to school" },
  "наша": { tr: "bizim (dişil)", en: "our (fem.)" },
  "рисует": { tr: "resim yapıyor / çiziyor", en: "draws / paints" },
  "печёт": { tr: "fırında pişiriyor / börek yapıyor", en: "bakes" },
  "вкусные": { tr: "lezzetli (çoğul)", en: "delicious (pl.)" },
  "пироги": { tr: "turtalar / börekler", en: "pies / pastries" },
  "утреннюю": { tr: "sabah (sıfat)", en: "morning (adj.)" },
  "газету": { tr: "gazeteyi", en: "newspaper (acc.)" },
  "лучший": { tr: "en iyi", en: "best" },
  "москве": { tr: "Moskova'da", en: "in Moscow" },
  "школьная": { tr: "okul (sıfat)", en: "school (adj.)" },
  "большая": { tr: "büyük (dişil)", en: "big (fem.)" },
  "druzhnaia": { tr: "sıcak / uyumlu", en: "friendly" },
  "дружная": { tr: "sıcak / bağlı / uyumlu", en: "friendly / close-knit" },
  "честный": { tr: "dürüst", en: "honest" },
  "думаешь": { tr: "düşünüyorsun", en: "you think" },
  "об": { tr: "hakkında", en: "about" },
  "делаем": { tr: "yapıyoruz", en: "we do / are doing" },
  "домашнее": { tr: "ev (sıfat)", en: "home / domestic" },
  "задание": { tr: "ödev / görev", en: "assignment / task" },
  "свободно": { tr: "akıcı bir şekilde / serbestçe", en: "fluently / freely" },
  "говорят": { tr: "konuşuyorlar", en: "they speak" },
  "интересную": { tr: "ilginç (nesne hali)", en: "interesting (acc.)" },
  "книгу": { tr: "kitabı", en: "book (acc.)" },
  "студент": { tr: "öğrenci (üniversite)", en: "student" },
  "письмо": { tr: "mektup", en: "letter" },
  "родителям": { tr: "ebeveynlere / anne-babaya", en: "to parents" },
  "идёте": { tr: "gidiyorsunuz", en: "you are going" },
  "вижу": { tr: "görüyorum", en: "I see" },
  "из": { tr: "-den / içinden", en: "from / out of" },
  "окна": { tr: "pencereden / pencereler", en: "from window / windows" },
  "классическую": { tr: "klasik (nesne hali)", en: "classical (acc.)" },
  "музыку": { tr: "müziği", en: "music (acc.)" },
  "центре": { tr: "merkezde", en: "in the center" },
  "города": { tr: "şehrin / şehirler", en: "of the city / cities" },
  "живём": { tr: "yaşıyoruz", en: "we live" },
  "красивом": { tr: "güzel (-de hali)", en: "beautiful (prep.)" },
  "новом": { tr: "yeni (-de hali)", en: "new (prep.)" },
  "доме": { tr: "evde", en: "in the house" },
  "пить": { tr: "içmek", en: "to drink" },
  "лимоном": { tr: "limonlu / limon ile", en: "with lemon" },
  "аппетит": { tr: "iştah", en: "appetite" },
  "гостиной": { tr: "oturma odasında", en: "in the living room" },
  "есть": { tr: "var / bulunuyor / yemek", en: "there is / to eat" },
  "сад": { tr: "bahçe", en: "garden" },
  "около": { tr: "yanında / civarında", en: "near / around" },
  "компьютер": { tr: "bilgisayar", en: "computer" },
  "любим": { tr: "seviyoruz", en: "we love / like" },
  "гулять": { tr: "yürümek / gezintiye çıkmak", en: "to walk / stroll" },
  "старому": { tr: "eski (-e hali)", en: "old (dat.)" },
  "городу": { tr: "şehre / şehirde", en: "around the city" },
  "нашей": { tr: "bizim (dişil -de hali)", en: "our (fem. prep.)" },
  "фирме": { tr: "şirkette / firmada", en: "at the company" },
  "специалист": { tr: "uzman", en: "specialist" },
  "подарила": { tr: "hediye etti", en: "gave as a gift" },
  "подарок": { tr: "hediye", en: "gift / present" },
  "рассказ": { tr: "öykü / hikaye", en: "story / tale" },
  "приготовила": { tr: "hazırladı / pişirdi", en: "prepared / cooked" },
  "обед": { tr: "öğle yemeği", en: "lunch" },
  "поезд": { tr: "tren", en: "train" },
  "остановок": { tr: "duraklar olmadan / duraksız", en: "stops (gen. pl.)" },
  "интернет": { tr: "internet", en: "internet" },
  "вкусная": { tr: "lezzetli (dişil)", en: "delicious (fem.)" },
  "воду": { tr: "suyu", en: "water (acc.)" },
  "покупаем": { tr: "satın alıyoruz", en: "we buy" },
  "свежий": { tr: "taze (eril)", en: "fresh (masc.)" },
  "ест": { tr: "yiyor", en: "eats / is eating" },
  "ужин": { tr: "akşam yemeği", en: "dinner" },
  "сладкое": { tr: "tatlı (nötr)", en: "sweet (neut.)" },
  "красное": { tr: "kırmızı (nötr)", en: "red (neut.)" },
  "утром": { tr: "sabahları / sabahleyin", en: "in the morning" },
  "хочешь": { tr: "istiyor musun", en: "do you want" },
  "горячий": { tr: "sıcak (eril)", en: "hot (masc.)" },
  "кошка": { tr: "kedi", en: "cat" },
  "пьёт": { tr: "içiyor", en: "drinks / is drinking" },
  "тёплое": { tr: "ılık / sıcak (nötr)", en: "warm (neut.)" },
  "завтрак": { tr: "kahvaltı", en: "breakfast" },
  "едим": { tr: "yiyoruz", en: "we eat" },
  "варит": { tr: "kaynatıyor / çorba pişiriyor", en: "boils / cooks" },
  "важен": { tr: "önemlidir", en: "is important" },
  "для": { tr: "için", en: "for" },
  "здоровья": { tr: "sağlık için / sağlığın", en: "of health" },
  "нравится": { tr: "hoşuna gidiyor / beğeniyor", en: "likes / pleases" },
  "классическая": { tr: "klasik (dişil)", en: "classical (fem.)" },
  "интересная": { tr: "ilginç (dişil)", en: "interesting (fem.)" },
  "вечером": { tr: "akşamları / akşamleyin", en: "in the evening" },
  "смотрим": { tr: "izliyoruz / bakıyoruz", en: "we watch / look" },
  "увлекательная": { tr: "sürükleyici / çekici", en: "fascinating / captivating" },
  "компьютерная": { tr: "bilgisayar (sıfat)", en: "computer (adj.)" },
  "друзья": { tr: "arkadaşlar", en: "friends" },
  "играют": { tr: "oynuyorlar", en: "they play" },
  "во": { tr: "içinde / -de", en: "in / into" },
  "дворе": { tr: "avluda / bahçede", en: "in the yard" },
  "помогает": { tr: "yardım ediyor", en: "helps" },
  "расслабиться": { tr: "rahatlamak / gevşemek", en: "to relax" },
  "любимый": { tr: "en sevilen / favori", en: "favorite" },
  "вид": { tr: "tür / çeşit / manzara", en: "kind / view" },
  "спорта": { tr: "sporun", en: "of sport" },
  "горы": { tr: "dağlar / dağlara", en: "mountains" },
  "было": { tr: "idi / oldu", en: "was" },
  "прекрасным": { tr: "harika / mükemmel", en: "wonderful / magnificent" },
  "современные": { tr: "modern / çağdaş", en: "modern / contemporary" },
  "стала": { tr: "oldu / haline geldi", en: "became" },
  "его": { tr: "onun (eril)", en: "his / him" },
  "главной": { tr: "ana / başlıca", en: "main / principal" },
  "профессией": { tr: "meslek olarak", en: "as a profession" },
  "приносит": { tr: "getiriyor", en: "brings" },
  "радости": { tr: "neşe / sevinç", en: "joy / pleasure" },
  "какая": { tr: "nasıl / ne biçim", en: "what a / which" },
  "хорошая": { tr: "iyi / güzel (dişil)", en: "good / fine (fem.)" },
  "небе": { tr: "gökyüzünde", en: "in the sky" },
  "ярко": { tr: "parlak / ışıl ışıl", en: "brightly" },
  "светит": { tr: "parlıyor / ışık saçıyor", en: "shines" },
  "сильный": { tr: "güçlü / kuvvetli", en: "strong" },
  "дует": { tr: "esiyor (rüzgar)", en: "blows" },
  "холодный": { tr: "soğuk (eril)", en: "cold (masc.)" },
  "плывёт": { tr: "yüzüyor / süzülüyor", en: "floats / swims" },
  "белое": { tr: "beyaz (nötr)", en: "white (neut.)" },
  "весной": { tr: "ilkbaharda", en: "in spring" },
  "полдень": { tr: "öğle vakti / gün ortası", en: "noon / midday" },
  "бывает": { tr: "olur / gerçekleşir", en: "happens / occurs" },
  "началась": { tr: "başladı", en: "began / started" },
  "сильная": { tr: "güçlü / şiddetli (dişil)", en: "strong / heavy (fem.)" },
  "над": { tr: "üzerinde / üstünde", en: "above / over" },
  "рекой": { tr: "nehir üzerinde", en: "over the river" },
  "стоял": { tr: "duruyordu", en: "stood" },
  "густой": { tr: "yoğun / koyu (sis vb.)", en: "thick / dense" },
  "лесу": { tr: "ormanda", en: "in the forest" },
  "трещит": { tr: "çatırdıyor / sertleşiyor", en: "crackles / is biting" },
  "свободное": { tr: "serbest / boş (zaman vb.)", en: "free / spare" },
  "прибудет": { tr: "varacak / gelecek", en: "will arrive" },
  "подождите": { tr: "bekleyiniz (lütfen)", en: "wait (polite)" },
  "одну": { tr: "bir (nesne hali, örn. bir dakika)", en: "one (acc.)" },
  "был": { tr: "idi / vardı", en: "was" },
  "прекрасный": { tr: "harika / mükemmel (eril)", en: "wonderful (masc.)" },
  "солнечный": { tr: "güneşli (eril)", en: "sunny (masc.)" },
  "прошла": { tr: "geçti (hafta vb.)", en: "passed" },
  "целая": { tr: "bütün / koca bir", en: "whole / entire" },
  "рабочая": { tr: "çalışma / iş (haftası vb.)", en: "working (adj.)" },
  "май": { tr: "Mayıs", en: "May" },
  "празднуем": { tr: "kutluyoruz", en: "we celebrate" },
  "каждое": { tr: "her (nötr, örn. her sabah)", en: "every (neut.)" },
  "зарядку": { tr: "sabah egzersizini", en: "morning exercise (acc.)" },
  "приятный": { tr: "hoş / keyifli", en: "pleasant" },
  "провели": { tr: "geçirdiler (vakit)", en: "spent (time)" },
  "тёмная": { tr: "karanlık (dişil)", en: "dark (fem.)" },
  "наступила": { tr: "başladı / bastırdı (gece/mevsim)", en: "set in / arrived" },
  "тихо": { tr: "sessizce / sessiz", en: "quietly / quiet" },
  "важный": { tr: "önemli", en: "important" },
  "урок": { tr: "ders", en: "lesson" },
  "долго": { tr: "uzun süre", en: "for a long time" },
  "гуляли": { tr: "gezdiler / yürüdüler", en: "walked / strolled" },
  "поедем": { tr: "gideceğiz (araçla)", en: "we will go (by vehicle)" },
  "гости": { tr: "misafirliğe / konuklar", en: "as guests / visiting" },
  "правду": { tr: "gerçeği / doğruyu", en: "truth (acc.)" },
  "наш": { tr: "bizim (eril)", en: "our (masc.)" },
  "кухне": { tr: "mutfakta", en: "in the kitchen" },
  "удобный": { tr: "rahat / kullanışlı (eril)", en: "comfortable (masc.)" },
  "спальне": { tr: "yatak odasında", en: "in the bedroom" },
  "откройте": { tr: "açınız (emir)", en: "open (polite)" },
  "закройте": { tr: "kapatınız (emir)", en: "close (polite)" },
  "свежее": { tr: "taze (nötr)", en: "fresh (neut.)" },
  "холодильнике": { tr: "buzdolabında", en: "in the refrigerator" },
  "от": { tr: "-den / parçası (anahtarı)", en: "of / from" },
  "квартиры": { tr: "dairenin", en: "of the apartment" },
  "них": { tr: "onlarda / onları", en: "them" },
  "светлая": { tr: "aydınlık (dişil)", en: "bright (fem.)" },
  "уютная": { tr: "ferah / samimi / sıcak", en: "cozy / homey" },
  "москва": { tr: "Moskova", en: "Moscow" },
  "гуляем": { tr: "yürüyoruz / geziyoruz", en: "we walk / stroll" },
  "старой": { tr: "eski (-de hali)", en: "old (prep.)" },
  "продуктовый": { tr: "gıda / market (sıfat)", en: "grocery (adj.)" },
  "хлебом": { tr: "ekmek (almak için)", en: "for bread" },
  "круглосуточная": { tr: "24 saat açık / nöbetçi", en: "24-hour (adj.)" },
  "находится": { tr: "bulunuyor / yer alıyor", en: "is located" },
  "рядом": { tr: "yanında / bitişiğinde", en: "nearby / next to" },
  "центральный": { tr: "merkezi (eril)", en: "central (masc.)" },
  "открыт": { tr: "açıktır", en: "is open" },
  "шести": { tr: "altıya / altı", en: "six" },
  "часов": { tr: "saatler / saat", en: "hours / o'clock" },
  "вечера": { tr: "akşamın", en: "of the evening" },
  "идём": { tr: "gidiyoruz", en: "we go / are going" },
  "русский": { tr: "Rus / Rusça", en: "Russian" },
  "весело": { tr: "neşeyle / eğlenerek", en: "cheerfully / merrily" },
  "городском": { tr: "şehir (-de hali)", en: "city (prep.)" },
  "станция": { tr: "istasyon", en: "station" },
  "прямо": { tr: "tam / dümdüz", en: "straight / right" },
  "скорый": { tr: "hızlı / ekspres", en: "express / fast" },
  "прибывает": { tr: "varıyor / geliyor", en: "arrives" },
  "главный": { tr: "ana / başlıca", en: "main / chief" },
  "городской": { tr: "şehir (sıfat)", en: "city (adj.)" },
  "больнице": { tr: "hastanede", en: "in the hospital" },
  "ученики": { tr: "öğrenciler (okul)", en: "pupils / students" },
  "ходят": { tr: "gidip geliyorlar", en: "they attend / go" },
  "работе": { tr: "işte", en: "at work" },
  "магазине": { tr: "mağazada / dükkanda", en: "in the store / shop" },
  "продаётся": { tr: "satılıyor", en: "is sold" },
  "стильная": { tr: "şık / tarz", en: "stylish" },
  "ношу": { tr: "giyiyorum / takıyorum", en: "I wear" },
  "белую": { tr: "beyaz (nesne hali)", en: "white (acc.)" },
  "хлопковую": { tr: "pamuklu (nesne hali)", en: "cotton (acc.)" },
  "футболку": { tr: "tişörtü", en: "T-shirt (acc.)" },
  "работы": { tr: "iş için / işin", en: "of work" },
  "нужна": { tr: "lazım / gerekli (dişil)", en: "is needed (fem.)" },
  "чистая": { tr: "temiz (dişil)", en: "clean (fem.)" },
  "тёмные": { tr: "koyu renk (çoğul)", en: "dark (pl.)" },
  "удобные": { tr: "rahat (çoğul)", en: "comfortable (pl.)" },
  "удобная": { tr: "rahat (dişil)", en: "comfortable (fem.)" },
  "зимняя": { tr: "kışlık (dişil)", en: "winter (adj.)" },
  "осенью": { tr: "sonbaharda", en: "in autumn" },
  "тёплая": { tr: "sıcak / kalın (dişil)", en: "warm (fem.)" },
  "обязательно": { tr: "mutlaka / kesinlikle", en: "definitely / necessarily" },
  "надень": { tr: "giy / tak (emir)", en: "put on (imperative)" },
  "тёплую": { tr: "sıcak / kalın (nesne hali)", en: "warm (acc.)" },
  "шапку": { tr: "bereyi / şapkayı", en: "hat / beanie (acc.)" },
  "надела": { tr: "giydi (kadın)", en: "put on (fem.)" },
  "красивое": { tr: "güzel (nötr)", en: "beautiful (neut.)" },
  "чёрное": { tr: "siyah (nötr)", en: "black (neut.)" },
  "вечернее": { tr: "gece / abiye (nötr)", en: "evening (adj.)" },
};

/**
 * Açık olan ünitelerin örnek cümlelerindeki (exampleRu) ana kelime harici ekstra kelimeleri çıkarır.
 *
 * @param unlockedUnitIds - Açık/tamamlanmış ünite ID'leri kümesi
 * @returns Ekstra kelimeler listesi (Item formatında, id: "extra_...")
 */
export function extractExtraWords(unlockedUnitIds: Set<string> | string[]): Item[] {
  const allowedSet =
    unlockedUnitIds instanceof Set ? unlockedUnitIds : new Set(unlockedUnitIds);

  // Sadece kilitleri açılmış üniteleri al
  const activeUnits = ALL_UNIT_DATA.filter((unit) => allowedSet.has(unit.id));

  // 1. Tüm açık ünitelerdeki ana kelimeleri topla (normalize edilmiş Set)
  const mainWordsSet = new Set<string>();

  for (const unit of activeUnits) {
    for (const item of unit.items) {
      if (item.ru) {
        const clean = item.ru.trim().toLowerCase();
        mainWordsSet.add(clean);
        mainWordsSet.add(clean.replace(/ё/g, "е"));

        // Eğer kelime birden fazla kelimeden oluşuyorsa (örn: "до свидания"), parçalarını da ekle
        const parts = clean.match(/[а-яё]+/gu);
        if (parts && parts.length > 1) {
          for (const p of parts) {
            mainWordsSet.add(p);
            mainWordsSet.add(p.replace(/ё/g, "е"));
          }
        }
      }
    }
  }

  // 2. Örnek cümlelerden ekstra kelimeleri ayıkla
  const extraWordsMap = new Map<string, Item>();

  for (const unit of activeUnits) {
    for (const item of unit.items) {
      if (!item.exampleRu) continue;

      // Cümledeki Kiril harfli kelimeleri ayıkla
      const wordsInSentence = item.exampleRu.match(/[а-яА-ЯёЁ]+/gu);
      if (!wordsInSentence) continue;

      for (const rawWord of wordsInSentence) {
        const norm = rawWord.trim().toLowerCase();
        const normNoYo = norm.replace(/ё/g, "е");

        // En az 2 harfli olmalı (tek harfli edat veya rastgele harfler hariç)
        if (norm.length < 2) continue;

        // Ana kelimeler kümesinde varsa ekstra kelime değildir
        if (mainWordsSet.has(norm) || mainWordsSet.has(normNoYo)) continue;

        // Zaten bu ekstra kelimeyi eklediysek tekrar ekleme (tekilleştir)
        if (extraWordsMap.has(norm) || extraWordsMap.has(normNoYo)) continue;

        // Sözlükten kelimenin kendi anlamını çek (doğrudan veya e/ё normalizasyonuyla)
        const dictEntry =
          EXTRA_WORDS_DICTIONARY[norm] ||
          EXTRA_WORDS_DICTIONARY[normNoYo] ||
          EXTRA_WORDS_DICTIONARY[norm.replace(/е/g, "ё")];
        const wordTr = dictEntry?.tr || "";
        const wordEn = dictEntry?.en || "";

        // Yeni ekstra kelime kartı oluştur
        const extraItem: Item = {
          id: `extra_${norm}`,
          unitId: unit.id,
          type: "word",
          ru: norm,
          wordTr,
          wordEn,
          tr: wordTr || "",
          en: wordEn || "",
          exampleRu: item.exampleRu,
          exampleTr: item.exampleTr,
          exampleEn: item.exampleEn,
          tags: ["extra"],
        };

        extraWordsMap.set(norm, extraItem);
      }
    }
  }

  return Array.from(extraWordsMap.values());
}
