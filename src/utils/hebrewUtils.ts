// Hebrew Gematria - number to letter conversion
const hebrewLetters: Record<number, string> = {
  1: 'א', 2: 'ב', 3: 'ג', 4: 'ד', 5: 'ה', 6: 'ו', 7: 'ז', 8: 'ח', 9: 'ט',
  10: 'י', 20: 'כ', 30: 'ל', 40: 'מ', 50: 'נ', 60: 'ס', 70: 'ע', 80: 'פ', 90: 'צ',
  100: 'ק', 200: 'ר', 300: 'ש', 400: 'ת',
};

const letterToNumber: Record<string, number> = {
  'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9,
  'י': 10, 'כ': 20, 'ך': 20, 'ל': 30, 'מ': 40, 'ם': 40, 'נ': 50, 'ן': 50,
  'ס': 60, 'ע': 70, 'פ': 80, 'ף': 80, 'צ': 90, 'ץ': 90,
  'ק': 100, 'ר': 200, 'ש': 300, 'ת': 400,
};

// Convert number to Hebrew letters (Gematria)
export function numberToHebrew(num: number): string {
  if (num <= 0 || num > 999) return '';
  
  let result = '';
  
  // Handle hundreds
  const hundreds = Math.floor(num / 100) * 100;
  if (hundreds > 0 && hebrewLetters[hundreds]) {
    result += hebrewLetters[hundreds];
  }
  
  // Handle tens and units
  const remainder = num % 100;
  
  // Special cases for 15 and 16 (טו, טז instead of יה, יו)
  if (remainder === 15) {
    result += 'טו';
  } else if (remainder === 16) {
    result += 'טז';
  } else {
    const tens = Math.floor(remainder / 10) * 10;
    const units = remainder % 10;
    
    if (tens > 0 && hebrewLetters[tens]) {
      result += hebrewLetters[tens];
    }
    if (units > 0 && hebrewLetters[units]) {
      result += hebrewLetters[units];
    }
  }
  
  return result;
}

// Convert Hebrew letters to number
export function hebrewToNumber(str: string): number {
  let total = 0;
  for (const char of str) {
    if (letterToNumber[char]) {
      total += letterToNumber[char];
    }
  }
  return total;
}

// Generate all variations of a term (number <-> Hebrew letters)
export function generateVariations(term: string): string[] {
  const variations: string[] = [term];
  
  // Pattern: "דף X" or "עמוד X" where X is a number
  const pageNumPattern = /(דף|עמוד|פרק|סימן|סעיף|אות)\s*(\d+)/g;
  let match;
  
  while ((match = pageNumPattern.exec(term)) !== null) {
    const prefix = match[1];
    const num = parseInt(match[2]);
    const hebrewNum = numberToHebrew(num);
    
    if (hebrewNum) {
      // Add variation with Hebrew letters
      variations.push(term.replace(match[0], `${prefix} ${hebrewNum}`));
      variations.push(term.replace(match[0], `${prefix} ${hebrewNum}'`));
      variations.push(term.replace(match[0], `${prefix} ${hebrewNum}׳`));
    }
  }
  
  // Pattern: "דף X'" where X is Hebrew letters
  const pageHebrewPattern = /(דף|עמוד|פרק|סימן|סעיף|אות)\s*([א-ת]+)[׳'"]?/g;
  
  while ((match = pageHebrewPattern.exec(term)) !== null) {
    const prefix = match[1];
    const hebrewStr = match[2];
    const num = hebrewToNumber(hebrewStr);
    
    if (num > 0) {
      // Add variation with Arabic numerals
      variations.push(term.replace(match[0], `${prefix} ${num}`));
    }
  }
  
  return [...new Set(variations)];
}

// Common Hebrew word variations (singular/plural, with/without ה)
export function getWordVariations(word: string): string[] {
  const variations: string[] = [word];
  
  // Remove or add definite article ה
  if (word.startsWith('ה')) {
    variations.push(word.substring(1));
  } else {
    variations.push('ה' + word);
  }
  
  // Common plural endings
  if (word.endsWith('ים')) {
    variations.push(word.slice(0, -2)); // Remove ים
    variations.push(word.slice(0, -2) + 'ות'); // Change to ות
  } else if (word.endsWith('ות')) {
    variations.push(word.slice(0, -2)); // Remove ות
    variations.push(word.slice(0, -2) + 'ים'); // Change to ים
  } else {
    variations.push(word + 'ים');
    variations.push(word + 'ות');
  }
  
  return [...new Set(variations)];
}

// Expand search term with all smart variations
export function expandSearchTerm(term: string, options: {
  includeNumberVariations?: boolean;
  includeWordVariations?: boolean;
}): string[] {
  let allVariations: string[] = [term];
  
  if (options.includeNumberVariations) {
    const numVars = generateVariations(term);
    allVariations.push(...numVars);
  }
  
  if (options.includeWordVariations) {
    const wordVars = getWordVariations(term);
    allVariations.push(...wordVars);
  }
  
  return [...new Set(allVariations)];
}
