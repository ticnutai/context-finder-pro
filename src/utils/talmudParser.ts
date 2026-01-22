// Talmud reference patterns and utilities

export interface TalmudReference {
  tractate: string;
  daf: number;
  amud: 'א' | 'ב';
  originalText: string;
  startIndex: number;
  endIndex: number;
}

// רשימת מסכתות הש"ס עם וריאציות כתיב
const TRACTATE_VARIANTS: Record<string, string[]> = {
  'ברכות': ['ברכות', 'ברכ\'', 'ברכ׳'],
  'שבת': ['שבת', 'שב\'', 'שב׳'],
  'עירובין': ['עירובין', 'עירוב\'', 'עירוב׳', 'ערובין'],
  'פסחים': ['פסחים', 'פסח\'', 'פסח׳'],
  'שקלים': ['שקלים', 'שקל\'', 'שקל׳'],
  'יומא': ['יומא', 'יומ\'', 'יומ׳'],
  'סוכה': ['סוכה', 'סוכ\'', 'סוכ׳'],
  'ביצה': ['ביצה', 'ביצ\'', 'ביצ׳'],
  'ראש השנה': ['ראש השנה', 'ר"ה', 'ר״ה', 'רה"ש', 'רה״ש'],
  'תענית': ['תענית', 'תענ\'', 'תענ׳'],
  'מגילה': ['מגילה', 'מגיל\'', 'מגיל׳'],
  'מועד קטן': ['מועד קטן', 'מו"ק', 'מו״ק', 'מ"ק', 'מ״ק'],
  'חגיגה': ['חגיגה', 'חגיג\'', 'חגיג׳'],
  'יבמות': ['יבמות', 'יבמ\'', 'יבמ׳'],
  'כתובות': ['כתובות', 'כתוב\'', 'כתוב׳'],
  'נדרים': ['נדרים', 'נדר\'', 'נדר׳'],
  'נזיר': ['נזיר', 'נזי\'', 'נזי׳'],
  'סוטה': ['סוטה', 'סוט\'', 'סוט׳'],
  'גיטין': ['גיטין', 'גיט\'', 'גיט׳'],
  'קידושין': ['קידושין', 'קידוש\'', 'קידוש׳', 'קיד\'', 'קיד׳'],
  'בבא קמא': ['בבא קמא', 'ב"ק', 'ב״ק', 'בב"ק', 'בב״ק'],
  'בבא מציעא': ['בבא מציעא', 'ב"מ', 'ב״מ', 'בב"מ', 'בב״מ'],
  'בבא בתרא': ['בבא בתרא', 'ב"ב', 'ב״ב', 'בב"ב', 'בב״ב'],
  'סנהדרין': ['סנהדרין', 'סנהד\'', 'סנהד׳', 'סנה\'', 'סנה׳'],
  'מכות': ['מכות', 'מכו\'', 'מכו׳'],
  'שבועות': ['שבועות', 'שבוע\'', 'שבוע׳'],
  'עבודה זרה': ['עבודה זרה', 'ע"ז', 'ע״ז', 'עבו"ז', 'עבו״ז'],
  'הוריות': ['הוריות', 'הורי\'', 'הורי׳'],
  'זבחים': ['זבחים', 'זבח\'', 'זבח׳'],
  'מנחות': ['מנחות', 'מנח\'', 'מנח׳'],
  'חולין': ['חולין', 'חול\'', 'חול׳'],
  'בכורות': ['בכורות', 'בכור\'', 'בכור׳'],
  'ערכין': ['ערכין', 'ערכ\'', 'ערכ׳'],
  'תמורה': ['תמורה', 'תמור\'', 'תמור׳'],
  'כריתות': ['כריתות', 'כריתו\'', 'כריתו׳'],
  'מעילה': ['מעילה', 'מעיל\'', 'מעיל׳'],
  'תמיד': ['תמיד', 'תמי\'', 'תמי׳'],
  'נדה': ['נדה', 'נד\'', 'נד׳'],
};

// המרת אותיות עבריות למספרים
const HEBREW_NUMERALS: Record<string, number> = {
  'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9,
  'י': 10, 'כ': 20, 'ך': 20, 'ל': 30, 'מ': 40, 'ם': 40, 'נ': 50, 'ן': 50,
  'ס': 60, 'ע': 70, 'פ': 80, 'ף': 80, 'צ': 90, 'ץ': 90, 'ק': 100,
  'ר': 200, 'ש': 300, 'ת': 400,
};

// המרת מספר עברי לערבי
export function hebrewToNumber(hebrew: string): number {
  // נקה גרשיים וסימנים
  const cleaned = hebrew.replace(/['"״׳]/g, '');
  
  let total = 0;
  for (const char of cleaned) {
    if (HEBREW_NUMERALS[char]) {
      total += HEBREW_NUMERALS[char];
    }
  }
  return total;
}

// תווים שמגדירים גבולות מילה בעברית
const WORD_BOUNDARY_CHARS = '\\s\\.,;:!?\\-\\(\\)\\[\\]\\{\\}«»""\'״׳\\/\\\\';

// בניית regex לזיהוי מסכתות - עם גבולות מילה
function buildTractatePattern(): string {
  const allVariants: string[] = [];
  for (const variants of Object.values(TRACTATE_VARIANTS)) {
    allVariants.push(...variants);
  }
  // מיון לפי אורך יורד כדי לתפוס קודם את הארוכים
  allVariants.sort((a, b) => b.length - a.length);
  return allVariants.map(v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
}

// בדיקה שהמילה היא מילה שלמה ולא חלק ממילה אחרת
function isWholeWord(text: string, startIndex: number, endIndex: number): boolean {
  // בדיקת התו לפני ההתאמה
  if (startIndex > 0) {
    const charBefore = text[startIndex - 1];
    // אם התו לפני הוא אות עברית - זה לא מילה שלמה
    if (/[\u0590-\u05FF]/.test(charBefore)) {
      return false;
    }
  }
  
  // בדיקת התו אחרי ההתאמה
  if (endIndex < text.length) {
    const charAfter = text[endIndex];
    // אם התו אחרי הוא אות עברית - זה לא מילה שלמה
    if (/[\u0590-\u05FF]/.test(charAfter)) {
      return false;
    }
  }
  
  return true;
}

// נורמליזציה של שם מסכת לשם הסטנדרטי
export function normalizeTractate(variant: string): string {
  const cleaned = variant.trim();
  for (const [standard, variants] of Object.entries(TRACTATE_VARIANTS)) {
    if (variants.some(v => v === cleaned || cleaned.includes(v))) {
      return standard;
    }
  }
  return cleaned;
}

// זיהוי מראי מקומות בטקסט
export function findTalmudReferences(text: string): TalmudReference[] {
  const references: TalmudReference[] = [];
  const tractatePattern = buildTractatePattern();
  
  // תבניות לזיהוי מראי מקומות
  const patterns = [
    // מסכת + דף + עמוד: "ב"ק דף ל"ב ע"א", "שבת כ"ב א", "ברכות ב ע"ב"
    new RegExp(
      `(${tractatePattern})\\s*(?:דף\\s*)?([א-ת]+"?[א-ת]*|[א-ת]׳?|\\d+)\\s*(?:ע["\u0022״׳']?)?([אב])`,
      'g'
    ),
    // מסכת + דף בלבד (יניח עמוד א): "שבת כ"ב", "ב"ק ל"ב"
    new RegExp(
      `(${tractatePattern})\\s*(?:דף\\s*)?([א-ת]+"?[א-ת]*|[א-ת]׳?|\\d+)(?![א-ת])`,
      'g'
    ),
    // פורמט עם נקודתיים: "ברכות ב:א"
    new RegExp(
      `(${tractatePattern})\\s*([א-ת]+"?[א-ת]*|\\d+):([אב])`,
      'g'
    ),
  ];

  const seenPositions = new Set<string>();

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const startIdx = match.index;
      const endIdx = match.index + match[0].length;
      
      // בדיקה שזו מילה שלמה ולא חלק ממילה אחרת
      if (!isWholeWord(text, startIdx, endIdx)) {
        continue;
      }
      
      const posKey = `${startIdx}-${match[0].length}`;
      if (seenPositions.has(posKey)) continue;
      seenPositions.add(posKey);

      const tractateVariant = match[1];
      const dafStr = match[2];
      const amudStr = match[3] || 'א'; // ברירת מחדל לעמוד א

      // המרת דף למספר
      let dafNum: number;
      if (/^\d+$/.test(dafStr)) {
        dafNum = parseInt(dafStr, 10);
      } else {
        dafNum = hebrewToNumber(dafStr);
      }

      // וידוא תקינות
      if (dafNum <= 0 || dafNum > 200) continue;

      const tractate = normalizeTractate(tractateVariant);
      const amud = amudStr === 'ב' ? 'ב' : 'א';

      references.push({
        tractate,
        daf: dafNum,
        amud,
        originalText: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }
  }

  // מיון לפי מיקום בטקסט
  references.sort((a, b) => a.startIndex - b.startIndex);

  // הסרת כפילויות חופפות
  const unique: TalmudReference[] = [];
  for (const ref of references) {
    const overlaps = unique.some(
      u => (ref.startIndex >= u.startIndex && ref.startIndex < u.endIndex) ||
           (ref.endIndex > u.startIndex && ref.endIndex <= u.endIndex)
    );
    if (!overlaps) {
      unique.push(ref);
    }
  }

  return unique;
}

// פורמט תצוגה של מראה מקום
export function formatReference(ref: TalmudReference): string {
  return `${ref.tractate} ${ref.daf}${ref.amud}`;
}

// המרת מספר לאותיות עבריות
export function numberToHebrew(num: number): string {
  if (num <= 0 || num > 999) return num.toString();
  
  const ones = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
  const tens = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
  const hundreds = ['', 'ק', 'ר', 'ש', 'ת'];
  
  let result = '';
  
  // מאות
  if (num >= 100) {
    const h = Math.floor(num / 100);
    if (h <= 4) {
      result += hundreds[h];
    } else {
      // 500-900
      result += 'ת' + hundreds[h - 4];
    }
    num %= 100;
  }
  
  // עשרות ואחדות
  if (num === 15) {
    result += 'טו';
  } else if (num === 16) {
    result += 'טז';
  } else {
    if (num >= 10) {
      result += tens[Math.floor(num / 10)];
      num %= 10;
    }
    if (num > 0) {
      result += ones[num];
    }
  }
  
  return result;
}
