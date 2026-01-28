/**
 * Fuzzy Search - חיפוש מעורפל עם תמיכה בשגיאות כתיב
 */

/**
 * חישוב מרחק Levenshtein בין שתי מחרוזות
 * @param a מחרוזת ראשונה
 * @param b מחרוזת שנייה
 * @returns מספר השינויים הנדרשים
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * חישוב ציון דמיון בין שתי מחרוזות (0-1)
 * @param a מחרוזת ראשונה
 * @param b מחרוזת שנייה
 * @returns ציון דמיון בין 0 ל-1
 */
export function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;
  
  const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase());
  const maxLength = Math.max(a.length, b.length);
  return 1 - distance / maxLength;
}

/**
 * בדיקה האם מילה דומה מספיק למילה אחרת
 * @param word המילה לבדיקה
 * @param target מילת היעד
 * @param threshold סף דמיון מינימלי (ברירת מחדל 0.7)
 * @returns האם המילים דומות מספיק
 */
export function isFuzzyMatch(word: string, target: string, threshold: number = 0.7): boolean {
  return similarity(word, target) >= threshold;
}

/**
 * מציאת מילים דומות מתוך רשימה
 * @param word המילה לחיפוש
 * @param wordList רשימת מילים לבדיקה
 * @param threshold סף דמיון מינימלי
 * @param maxResults מספר תוצאות מקסימלי
 * @returns מילים דומות מסודרות לפי דמיון
 */
export function findSimilarWords(
  word: string,
  wordList: string[],
  threshold: number = 0.6,
  maxResults: number = 5
): Array<{ word: string; similarity: number }> {
  const results: Array<{ word: string; similarity: number }> = [];
  
  for (const candidate of wordList) {
    const sim = similarity(word, candidate);
    if (sim >= threshold && word !== candidate) {
      results.push({ word: candidate, similarity: sim });
    }
  }
  
  return results
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxResults);
}

/**
 * חיפוש מעורפל בטקסט
 * @param text הטקסט לחיפוש
 * @param searchTerm מונח החיפוש
 * @param threshold סף דמיון
 * @returns האם נמצאה התאמה מעורפלת
 */
export function fuzzySearchInText(
  text: string,
  searchTerm: string,
  threshold: number = 0.7
): { found: boolean; matchedWord: string | null } {
  const words = text.split(/\s+/);
  const normalizedSearch = searchTerm.toLowerCase();
  
  for (const word of words) {
    const normalizedWord = word.toLowerCase().replace(/[^\u0590-\u05FFa-zA-Z]/g, '');
    if (!normalizedWord) continue;
    
    // Exact match
    if (normalizedWord === normalizedSearch) {
      return { found: true, matchedWord: word };
    }
    
    // Fuzzy match
    if (isFuzzyMatch(normalizedWord, normalizedSearch, threshold)) {
      return { found: true, matchedWord: word };
    }
  }
  
  return { found: false, matchedWord: null };
}

/**
 * חילוץ כל המילים הייחודיות מטקסט
 * @param text הטקסט לניתוח
 * @returns מערך מילים ייחודיות
 */
export function extractUniqueWords(text: string): string[] {
  const words = text.split(/\s+/);
  const uniqueWords = new Set<string>();
  
  for (const word of words) {
    const cleaned = word.replace(/[^\u0590-\u05FFa-zA-Z0-9]/g, '').trim();
    if (cleaned && cleaned.length >= 2) {
      uniqueWords.add(cleaned);
    }
  }
  
  return Array.from(uniqueWords);
}

/**
 * מציאת הצעות לתיקון שגיאות כתיב
 * @param word המילה עם השגיאה
 * @param text הטקסט להשוואה
 * @returns הצעות לתיקון
 */
export function getSuggestions(
  word: string,
  text: string
): Array<{ word: string; similarity: number }> {
  const uniqueWords = extractUniqueWords(text);
  return findSimilarWords(word, uniqueWords, 0.5, 5);
}

/**
 * שגיאות עבריות נפוצות - המרות
 */
const hebrewCommonMistakes: Record<string, string[]> = {
  'א': ['ע', 'ה'],
  'ע': ['א', 'ה'],
  'ה': ['א', 'ע'],
  'כ': ['ח', 'ך'],
  'ח': ['כ'],
  'ך': ['כ'],
  'ב': ['ו'],
  'ו': ['ב'],
  'ט': ['ת'],
  'ת': ['ט'],
  'ס': ['ש', 'צ'],
  'ש': ['ס'],
  'צ': ['ס', 'ץ'],
  'ץ': ['צ'],
  'ק': ['כ'],
  'ם': ['מ'],
  'ן': ['נ'],
  'ף': ['פ'],
};

/**
 * יצירת וריאציות אפשריות למילה עברית
 * @param word המילה המקורית
 * @returns וריאציות אפשריות
 */
export function generateHebrewVariations(word: string): string[] {
  const variations = new Set<string>([word]);
  
  // החלפת אותיות נפוצות בטעות
  for (let i = 0; i < word.length; i++) {
    const char = word[i];
    const replacements = hebrewCommonMistakes[char];
    if (replacements) {
      for (const replacement of replacements) {
        const variation = word.slice(0, i) + replacement + word.slice(i + 1);
        variations.add(variation);
      }
    }
  }
  
  // הוספה/הסרה של ה' הידיעה
  if (word.startsWith('ה')) {
    variations.add(word.slice(1));
  } else {
    variations.add('ה' + word);
  }
  
  // אותיות סופיות
  const sofitMap: Record<string, string> = {
    'כ': 'ך', 'ך': 'כ',
    'מ': 'ם', 'ם': 'מ',
    'נ': 'ן', 'ן': 'נ',
    'פ': 'ף', 'ף': 'פ',
    'צ': 'ץ', 'ץ': 'צ',
  };
  
  const lastChar = word[word.length - 1];
  if (sofitMap[lastChar]) {
    variations.add(word.slice(0, -1) + sofitMap[lastChar]);
  }
  
  return Array.from(variations);
}
