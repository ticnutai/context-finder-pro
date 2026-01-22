export type ConditionOperator = 'AND' | 'OR' | 'NOT' | 'NEAR' | 'LIST';
export type ProximityDirection = 'before' | 'after' | 'both';
export type ListMode = 'any' | 'all';

export interface SmartSearchOptions {
  numberToHebrew: boolean;      // דף 20 <-> דף כ'
  wordVariations: boolean;       // singular/plural, ה prefix
  ignoreNikud: boolean;          // התעלמות מניקוד
  sofitEquivalence: boolean;     // ך=כ, ם=מ, ן=נ, ף=פ, ץ=צ
  gematriaSearch: boolean;       // חיפוש לפי ערך גימטריא
  acronymExpansion: boolean;     // הרחבת ראשי תיבות
}

export interface SearchCondition {
  id: string;
  term: string;
  operator: ConditionOperator;
  proximityRange?: number;
  proximityDirection?: ProximityDirection;
  listWords?: string[];
  listMode?: ListMode;
}

export interface SearchResult {
  text: string;
  startIndex: number;
  endIndex: number;
  matchedTerms: string[];
}
