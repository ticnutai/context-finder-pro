// Sefaria API Service - ממשק לטעינת טקסטים תלמודיים
// API Documentation: https://www.sefaria.org/api

const SEFARIA_API_BASE = 'https://www.sefaria.org/api';

// מיפוי שמות מסכתות לפורמט Sefaria
const tractateMapping: Record<string, string> = {
  'ברכות': 'Berakhot',
  'שבת': 'Shabbat',
  'עירובין': 'Eruvin',
  'פסחים': 'Pesachim',
  'שקלים': 'Shekalim',
  'יומא': 'Yoma',
  'סוכה': 'Sukkah',
  'ביצה': 'Beitzah',
  'ראש השנה': 'Rosh_Hashanah',
  'תענית': 'Taanit',
  'מגילה': 'Megillah',
  'מועד קטן': 'Moed_Katan',
  'חגיגה': 'Chagigah',
  'יבמות': 'Yevamot',
  'כתובות': 'Ketubot',
  'נדרים': 'Nedarim',
  'נזיר': 'Nazir',
  'סוטה': 'Sotah',
  'גיטין': 'Gittin',
  'קידושין': 'Kiddushin',
  'בבא קמא': 'Bava_Kamma',
  'בבא מציעא': 'Bava_Metzia',
  'בבא בתרא': 'Bava_Batra',
  'סנהדרין': 'Sanhedrin',
  'מכות': 'Makkot',
  'שבועות': 'Shevuot',
  'עבודה זרה': 'Avodah_Zarah',
  'הוריות': 'Horayot',
  'זבחים': 'Zevachim',
  'מנחות': 'Menachot',
  'חולין': 'Chullin',
  'בכורות': 'Bekhorot',
  'ערכין': 'Arakhin',
  'תמורה': 'Temurah',
  'כריתות': 'Keritot',
  'מעילה': 'Meilah',
  'תמיד': 'Tamid',
  'נדה': 'Niddah',
};

// מיפוי הפוך - מאנגלית לעברית
const reverseTractateMapping = Object.fromEntries(
  Object.entries(tractateMapping).map(([heb, eng]) => [eng.replace(/_/g, ' '), heb])
);

export interface SefariaText {
  ref: string;
  heRef: string;
  text: string | string[];
  he: string | string[];
  versions?: {
    he: { versionTitle: string; language: string }[];
    en: { versionTitle: string; language: string }[];
  };
  sectionRef?: string;
  toSections?: number[];
  fromSections?: number[];
  type?: string;
  book?: string;
  categories?: string[];
  titleVariants?: string[];
  heTitleVariants?: string[];
}

export interface SefariaIndex {
  title: string;
  heTitle: string;
  categories: string[];
  order?: number[];
  length?: number;
  lengths?: number[];
  firstSection?: string;
  schema?: {
    nodes?: Array<{
      title: string;
      heTitle: string;
      depth?: number;
      addressTypes?: string[];
    }>;
  };
}

export interface TractateInfo {
  name: string;
  nameEnglish: string;
  totalDafs: number;
  order: number;
  category: string;
}

// רשימת המסכתות עם מספר הדפים
const tractateInfo: Record<string, { totalDafs: number; order: number; category: string }> = {
  'ברכות': { totalDafs: 64, order: 1, category: 'זרעים' },
  'שבת': { totalDafs: 157, order: 2, category: 'מועד' },
  'עירובין': { totalDafs: 105, order: 3, category: 'מועד' },
  'פסחים': { totalDafs: 121, order: 4, category: 'מועד' },
  'שקלים': { totalDafs: 22, order: 5, category: 'מועד' },
  'יומא': { totalDafs: 88, order: 6, category: 'מועד' },
  'סוכה': { totalDafs: 56, order: 7, category: 'מועד' },
  'ביצה': { totalDafs: 40, order: 8, category: 'מועד' },
  'ראש השנה': { totalDafs: 35, order: 9, category: 'מועד' },
  'תענית': { totalDafs: 31, order: 10, category: 'מועד' },
  'מגילה': { totalDafs: 32, order: 11, category: 'מועד' },
  'מועד קטן': { totalDafs: 29, order: 12, category: 'מועד' },
  'חגיגה': { totalDafs: 27, order: 13, category: 'מועד' },
  'יבמות': { totalDafs: 122, order: 14, category: 'נשים' },
  'כתובות': { totalDafs: 112, order: 15, category: 'נשים' },
  'נדרים': { totalDafs: 91, order: 16, category: 'נשים' },
  'נזיר': { totalDafs: 66, order: 17, category: 'נשים' },
  'סוטה': { totalDafs: 49, order: 18, category: 'נשים' },
  'גיטין': { totalDafs: 90, order: 19, category: 'נשים' },
  'קידושין': { totalDafs: 82, order: 20, category: 'נשים' },
  'בבא קמא': { totalDafs: 119, order: 21, category: 'נזיקין' },
  'בבא מציעא': { totalDafs: 119, order: 22, category: 'נזיקין' },
  'בבא בתרא': { totalDafs: 176, order: 23, category: 'נזיקין' },
  'סנהדרין': { totalDafs: 113, order: 24, category: 'נזיקין' },
  'מכות': { totalDafs: 24, order: 25, category: 'נזיקין' },
  'שבועות': { totalDafs: 49, order: 26, category: 'נזיקין' },
  'עבודה זרה': { totalDafs: 76, order: 27, category: 'נזיקין' },
  'הוריות': { totalDafs: 14, order: 28, category: 'נזיקין' },
  'זבחים': { totalDafs: 120, order: 29, category: 'קדשים' },
  'מנחות': { totalDafs: 110, order: 30, category: 'קדשים' },
  'חולין': { totalDafs: 142, order: 31, category: 'קדשים' },
  'בכורות': { totalDafs: 61, order: 32, category: 'קדשים' },
  'ערכין': { totalDafs: 34, order: 33, category: 'קדשים' },
  'תמורה': { totalDafs: 34, order: 34, category: 'קדשים' },
  'כריתות': { totalDafs: 28, order: 35, category: 'קדשים' },
  'מעילה': { totalDafs: 22, order: 36, category: 'קדשים' },
  'תמיד': { totalDafs: 10, order: 37, category: 'קדשים' },
  'נדה': { totalDafs: 73, order: 38, category: 'טהרות' },
};

/**
 * המרת מספר עמוד לפורמט Sefaria
 * בתלמוד, הדפים מתחילים מ-2 (דף ב')
 */
function formatDafForSefaria(daf: number, amud: 'א' | 'ב'): string {
  return `${daf}${amud === 'א' ? 'a' : 'b'}`;
}

/**
 * המרת מספר עברי לערבי
 */
function hebrewToNumber(hebrew: string): number {
  const values: Record<string, number> = {
    'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9,
    'י': 10, 'כ': 20, 'ל': 30, 'מ': 40, 'נ': 50, 'ס': 60, 'ע': 70, 'פ': 80, 'צ': 90,
    'ק': 100, 'ר': 200, 'ש': 300, 'ת': 400,
  };
  
  let total = 0;
  for (const char of hebrew) {
    total += values[char] || 0;
  }
  return total;
}

/**
 * קבלת רשימת כל המסכתות
 */
export function getAllTractates(): TractateInfo[] {
  return Object.entries(tractateInfo)
    .map(([name, info]) => ({
      name,
      nameEnglish: tractateMapping[name] || name,
      totalDafs: info.totalDafs,
      order: info.order,
      category: info.category,
    }))
    .sort((a, b) => a.order - b.order);
}

/**
 * קבלת מסכתות לפי קטגוריה (סדר)
 */
export function getTractatesByCategory(): Record<string, TractateInfo[]> {
  const tractates = getAllTractates();
  const grouped: Record<string, TractateInfo[]> = {};
  
  for (const tractate of tractates) {
    if (!grouped[tractate.category]) {
      grouped[tractate.category] = [];
    }
    grouped[tractate.category].push(tractate);
  }
  
  return grouped;
}

/**
 * טעינת טקסט מ-Sefaria API
 */
export async function fetchSefariaText(
  tractate: string,
  daf: number | string,
  amud?: 'א' | 'ב'
): Promise<SefariaText> {
  const englishName = tractateMapping[tractate] || tractate;
  
  // המרת מספר עברי אם צריך
  const dafNumber = typeof daf === 'string' ? hebrewToNumber(daf) : daf;
  
  // בניית ה-reference
  let ref = `${englishName}.${dafNumber}`;
  if (amud) {
    ref += amud === 'א' ? 'a' : 'b';
  }
  
  const response = await fetch(`${SEFARIA_API_BASE}/texts/${encodeURIComponent(ref)}?context=0&pad=0`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch text: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * טעינת טקסט עם הקשר (דפים סמוכים)
 */
export async function fetchSefariaTextWithContext(
  tractate: string,
  daf: number,
  amud: 'א' | 'ב',
  contextDafs: number = 1
): Promise<SefariaText> {
  const englishName = tractateMapping[tractate] || tractate;
  const startDaf = Math.max(2, daf - contextDafs);
  const endDaf = Math.min(tractateInfo[tractate]?.totalDafs || 200, daf + contextDafs);
  
  const ref = `${englishName}.${startDaf}a-${endDaf}b`;
  
  const response = await fetch(`${SEFARIA_API_BASE}/texts/${encodeURIComponent(ref)}?context=0&pad=0`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch text: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * חיפוש טקסט ב-Sefaria
 */
export async function searchSefaria(
  query: string,
  filters?: {
    categories?: string[];
    exactMatch?: boolean;
  }
): Promise<{
  hits: Array<{
    ref: string;
    heRef: string;
    text: string;
    highlight: string;
  }>;
  total: number;
}> {
  const params = new URLSearchParams({
    q: query,
    type: 'text',
    field: 'exact' in (filters || {}) ? 'exact' : 'naive_lemmatizer',
  });
  
  if (filters?.categories) {
    params.append('filters', filters.categories.join('|'));
  }
  
  const response = await fetch(`${SEFARIA_API_BASE}/search-wrapper?${params}`);
  
  if (!response.ok) {
    throw new Error(`Search failed: ${response.statusText}`);
  }
  
  const data = await response.json();
  return {
    hits: data.hits?.hits?.map((hit: any) => ({
      ref: hit._source.ref,
      heRef: hit._source.heRef,
      text: hit._source.exact || hit._source.naive_lemmatizer,
      highlight: hit.highlight?.exact?.[0] || hit.highlight?.naive_lemmatizer?.[0] || '',
    })) || [],
    total: data.hits?.total?.value || 0,
  };
}

/**
 * קבלת מידע על ספר/מסכת
 */
export async function fetchBookInfo(tractate: string): Promise<SefariaIndex> {
  const englishName = tractateMapping[tractate] || tractate;
  
  const response = await fetch(`${SEFARIA_API_BASE}/index/${encodeURIComponent(englishName)}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch book info: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * פורמט טקסט מ-Sefaria (יכול להיות מערך או מחרוזת)
 */
export function formatSefariaText(text: string | string[]): string {
  if (Array.isArray(text)) {
    return text.flat(Infinity).filter(Boolean).join('\n');
  }
  return text || '';
}

/**
 * חילוץ טקסט עברי בלבד
 */
export function extractHebrewText(data: SefariaText): string {
  return formatSefariaText(data.he);
}

/**
 * קבלת קישור ל-Sefaria
 */
export function getSefariaLink(tractate: string, daf: number, amud?: 'א' | 'ב'): string {
  const englishName = tractateMapping[tractate] || tractate;
  let ref = `${englishName}.${daf}`;
  if (amud) {
    ref += amud === 'א' ? 'a' : 'b';
  }
  return `https://www.sefaria.org/${ref}`;
}

/**
 * מיפוי שם מסכת מאנגלית לעברית
 */
export function tractateEnglishToHebrew(englishName: string): string {
  return reverseTractateMapping[englishName.replace(/_/g, ' ')] || englishName;
}

/**
 * מיפוי שם מסכת מעברית לאנגלית
 */
export function tractateHebrewToEnglish(hebrewName: string): string {
  return tractateMapping[hebrewName] || hebrewName;
}
