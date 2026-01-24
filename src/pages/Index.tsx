import { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/Header';
import { TextInput } from '@/components/TextInput';
import { SearchResults } from '@/components/SearchResults';
import { SearchHistory } from '@/components/SearchHistory';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useWordLists } from '@/hooks/useWordLists';
import { SearchCondition, SearchResult, SmartSearchOptions, FilterRules, ConditionOperator, ProximityDirection, ListMode } from '@/types/search';
import { useToast } from '@/hooks/use-toast';
import { FilterRulesBuilder } from '@/components/FilterRulesBuilder';
import { RulesValidationSystem } from '@/components/RulesValidationSystem';
import { ActiveRulesPreview } from '@/components/ActiveRulesPreview';
import { SettingsButton } from '@/components/SettingsButton';
import { Search, Plus, X, Filter, Sparkles, ChevronDown, HelpCircle, BookTemplate, Hash, Languages, Type, AlignJustify, Calculator, FileText, List, Eye, Zap, ArrowUp } from 'lucide-react';
import { expandSearchTerm } from '@/utils/hebrewUtils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { WordListSelector } from '@/components/WordListSelector';

// תבניות חיפוש מוכנות
const searchTemplates = [
  {
    id: 'exact-phrase',
    name: 'חיפוש מדויק',
    description: 'מצא ביטוי מדויק בטקסט',
    conditions: [{ id: '1', term: '', operator: 'AND' as ConditionOperator }],
  },
  {
    id: 'include-exclude',
    name: 'כולל + לא כולל',
    description: 'מצא מילה אחת אבל לא אחרת',
    conditions: [
      { id: '1', term: '', operator: 'AND' as ConditionOperator },
      { id: '2', term: '', operator: 'NOT' as ConditionOperator },
    ],
  },
  {
    id: 'multiple-options',
    name: 'אחת מכמה אפשרויות',
    description: 'מצא אחת מרשימת מילים',
    conditions: [
      { id: '1', term: '', operator: 'AND' as ConditionOperator },
      { id: '2', term: '', operator: 'LIST' as ConditionOperator, listWords: [], listMode: 'any' as ListMode },
    ],
  },
  {
    id: 'proximity',
    name: 'מילים קרובות',
    description: 'מצא מילים בקרבה זו לזו',
    conditions: [
      { id: '1', term: '', operator: 'AND' as ConditionOperator },
      { id: '2', term: '', operator: 'NEAR' as ConditionOperator, proximityRange: 10, proximityDirection: 'both' as ProximityDirection },
    ],
  },
];

// הסברים לאופרטורים
const operatorHelp: Record<ConditionOperator, { label: string; description: string; example: string }> = {
  AND: {
    label: 'וגם',
    description: 'שתי המילים חייבות להופיע יחד',
    example: '"תורה" וגם "משה" → ימצא רק שורות עם שתי המילים',
  },
  OR: {
    label: 'או',
    description: 'לפחות אחת מהמילים צריכה להופיע',
    example: '"משה" או "אהרון" → ימצא שורות עם אחת מהן',
  },
  NOT: {
    label: 'ללא',
    description: 'המילה לא צריכה להופיע',
    example: '"תורה" ללא "משנה" → ימצא תורה ללא משנה',
  },
  NEAR: {
    label: 'בקרבת',
    description: 'המילים צריכות להיות קרובות זו לזו',
    example: '"משה" בקרבת 5 מילים מ-"הר" → ימצא כשהן קרובות',
  },
  LIST: {
    label: 'רשימה',
    description: 'חפש אחת או כל המילים מרשימה',
    example: 'רשימה של שמות → ימצא כל שם מהרשימה',
  },
};

// הגדרות חיפוש חכם
const smartSearchConfig = [
  {
    key: 'numberToHebrew' as keyof SmartSearchOptions,
    icon: Hash,
    label: 'מספרים ↔ אותיות',
    description: 'דף 20 ימצא גם דף כ׳',
    example: 'פרק 5 = פרק ה׳',
  },
  {
    key: 'wordVariations' as keyof SmartSearchOptions,
    icon: Languages,
    label: 'וריאציות מילים',
    description: 'יחיד/רבים, עם/בלי ה׳',
    example: 'ספר = הספר = ספרים',
  },
  {
    key: 'ignoreNikud' as keyof SmartSearchOptions,
    icon: Type,
    label: 'התעלמות מניקוד',
    description: 'מתעלם מסימני ניקוד בחיפוש',
    example: 'שָׁלוֹם = שלום',
  },
  {
    key: 'sofitEquivalence' as keyof SmartSearchOptions,
    icon: AlignJustify,
    label: 'אותיות סופיות',
    description: 'ך=כ, ם=מ, ן=נ, ף=פ, ץ=צ',
    example: 'שלם = שלום (עם ם סופית)',
  },
  {
    key: 'gematriaSearch' as keyof SmartSearchOptions,
    icon: Calculator,
    label: 'חיפוש גימטריא',
    description: 'מוצא מילים עם אותו ערך מספרי',
    example: 'אחד (13) = אהבה (13)',
  },
  {
    key: 'acronymExpansion' as keyof SmartSearchOptions,
    icon: FileText,
    label: 'ראשי תיבות',
    description: 'מרחיב קיצורים נפוצים',
    example: 'רמב"ם = רבי משה בן מימון',
  },
];

const Index = () => {
  const { toast } = useToast();
  const {
    history,
    saveText,
    loadText,
    saveConditions,
    loadConditions,
    addToHistory,
    deleteHistoryItem,
    clearHistory,
  } = useLocalStorage();

  const {
    wordLists,
    categories,
    addWordList,
    updateWordList,
    deleteWordList,
    addCategory,
    deleteCategory,
  } = useWordLists();

  const [text, setText] = useState('');
  
  const [conditions, setConditions] = useState<SearchCondition[]>([
    { id: crypto.randomUUID(), term: '', operator: 'AND' },
  ]);

  const [smartOptions, setSmartOptions] = useState<SmartSearchOptions>({
    numberToHebrew: true,
    wordVariations: false,
    ignoreNikud: true,
    sofitEquivalence: true,
    gematriaSearch: false,
    acronymExpansion: false,
  });

  const [filterRules, setFilterRules] = useState<FilterRules>({
    positionRules: [],
    textPositionRules: [],
    mustContainNumbers: false,
    mustContainLettersOnly: false,
    caseSensitive: false,
  });

  const [showTemplates, setShowTemplates] = useState(false);
  const [smartSearchOpen, setSmartSearchOpen] = useState(true);
  const [filterRulesOpen, setFilterRulesOpen] = useState(false);
  
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const savedText = loadText();
    const savedConditions = loadConditions();

    if (savedText) {
      setText(savedText);
    }
    if (savedConditions && savedConditions.length > 0) {
      setConditions(savedConditions);
    }
    setIsInitialized(true);
  }, [loadText, loadConditions]);

  useEffect(() => {
    if (isInitialized) {
      saveText(text);
    }
  }, [text, saveText, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      saveConditions(conditions);
    }
  }, [conditions, saveConditions, isInitialized]);

  // Helper function to check filter rules
  const checkFilterRules = (segment: string, words: string[]): boolean => {
    for (const rule of filterRules.positionRules) {
      if (!rule.word || !rule.relativeWord) continue;
      
      const wordIndex = words.findIndex(w => w.includes(rule.word.toLowerCase()));
      const relativeIndex = words.findIndex(w => w.includes(rule.relativeWord.toLowerCase()));
      
      if (wordIndex === -1 || relativeIndex === -1) continue;
      
      const distance = Math.abs(wordIndex - relativeIndex);
      const maxDist = rule.maxDistance || 10;
      
      if (rule.position === 'before' && (wordIndex >= relativeIndex || distance > maxDist)) {
        return false;
      }
      if (rule.position === 'after' && (wordIndex <= relativeIndex || distance > maxDist)) {
        return false;
      }
    }
    
    for (const rule of filterRules.textPositionRules) {
      if (!rule.word) continue;
      
      const withinWords = rule.withinWords || 3;
      const wordLower = rule.word.toLowerCase();
      
      if (rule.position === 'start') {
        const startWords = words.slice(0, withinWords);
        if (!startWords.some(w => w.includes(wordLower))) {
          return false;
        }
      }
      if (rule.position === 'end') {
        const endWords = words.slice(-withinWords);
        if (!endWords.some(w => w.includes(wordLower))) {
          return false;
        }
      }
    }
    
    if (filterRules.minWordCount && words.length < filterRules.minWordCount) {
      return false;
    }
    if (filterRules.maxWordCount && words.length > filterRules.maxWordCount) {
      return false;
    }
    
    if (filterRules.mustContainNumbers && !/\d/.test(segment)) {
      return false;
    }
    
    if (filterRules.mustContainLettersOnly && /[\d]/.test(segment)) {
      return false;
    }
    
    return true;
  };

  const addCondition = () => {
    const newCondition: SearchCondition = {
      id: crypto.randomUUID(),
      term: '',
      operator: 'AND',
      proximityRange: 10,
      proximityDirection: 'both',
      listWords: [],
      listMode: 'any',
    };
    setConditions([...conditions, newCondition]);
  };

  const removeCondition = (id: string) => {
    setConditions(conditions.filter(c => c.id !== id));
  };

  const updateCondition = (id: string, updates: Partial<SearchCondition>) => {
    setConditions(
      conditions.map(c => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const handleListWordsChange = (id: string, text: string) => {
    const words = text.split('\n').filter(w => w.trim());
    updateCondition(id, { listWords: words, term: words.join(' | ') });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if ((e.target as HTMLElement).tagName !== 'TEXTAREA') {
        performSearch();
      }
    }
  };

  const applyTemplate = (template: typeof searchTemplates[0]) => {
    const newConditions = template.conditions.map(c => ({
      ...c,
      id: crypto.randomUUID(),
    }));
    setConditions(newConditions);
    setShowTemplates(false);
  };

  const performSearch = () => {
    if (!text.trim()) {
      setResults([]);
      setHasSearched(true);
      return;
    }

    const normalize = (str: string) => str.trim().toLowerCase();
    const segments = text.split(/[\n]+/).filter(s => s.trim());
    const foundResults: SearchResult[] = [];

    const expandTerm = (term: string): string[] => {
      return expandSearchTerm(term, {
        includeNumberVariations: smartOptions.numberToHebrew,
        includeWordVariations: smartOptions.wordVariations,
        ignoreNikud: smartOptions.ignoreNikud,
        sofitEquivalence: smartOptions.sofitEquivalence,
        gematriaSearch: smartOptions.gematriaSearch,
        acronymExpansion: smartOptions.acronymExpansion,
      });
    };

    segments.forEach((segment) => {
      const segmentNorm = normalize(segment);
      const segmentWords = segment.toLowerCase().split(/\s+/).filter(w => w.trim());
      const matchedTerms: string[] = [];

      let hasRequiredTerms = true;
      let hasExcludedTerm = false;
      let hasListMatch = true;

      const firstTermConditions = conditions.filter(c => c.operator !== 'LIST' && c.operator !== 'NOT' && c.operator !== 'OR');
      const listConditions = conditions.filter(c => c.operator === 'LIST');
      const notConditions = conditions.filter(c => c.operator === 'NOT');

      firstTermConditions.forEach(cond => {
        if (!cond.term.trim()) return;
        
        const variations = expandTerm(cond.term);
        let found = false;
        
        for (const variation of variations) {
          if (segmentNorm.includes(normalize(variation))) {
            matchedTerms.push(cond.term);
            found = true;
            break;
          }
        }
        
        if (!found) {
          hasRequiredTerms = false;
        }
      });

      listConditions.forEach(cond => {
        const words = cond.listWords || [];
        if (words.length === 0) return;
        
        let foundAny = false;
        words.forEach(word => {
          if (!word.trim()) return;
          
          const variations = expandTerm(word);
          for (const variation of variations) {
            if (segmentNorm.includes(normalize(variation))) {
              matchedTerms.push(word);
              foundAny = true;
              break;
            }
          }
        });
        
        if (cond.listMode === 'any' && !foundAny) {
          hasListMatch = false;
        }
      });

      notConditions.forEach(cond => {
        if (!cond.term.trim()) return;
        
        const variations = expandTerm(cond.term);
        for (const variation of variations) {
          if (segmentNorm.includes(normalize(variation))) {
            hasExcludedTerm = true;
            break;
          }
        }
      });

      const hasContent = firstTermConditions.some(c => c.term.trim()) || listConditions.some(c => (c.listWords?.length || 0) > 0);
      const passesBasicSearch = hasContent && hasRequiredTerms && hasListMatch && !hasExcludedTerm && matchedTerms.length > 0;
      
      const passesFilterRules = checkFilterRules(segment, segmentWords);
      
      const matches = passesBasicSearch && passesFilterRules;

      if (matches) {
        const startIndex = text.indexOf(segment);
        foundResults.push({
          text: segment.trim(),
          startIndex,
          endIndex: startIndex + segment.length,
          matchedTerms: [...new Set(matchedTerms)],
        });
      }
    });

    setResults(foundResults);
    setHasSearched(true);

    const allMatchedTerms = foundResults.flatMap(r => r.matchedTerms);
    addToHistory(text, conditions, foundResults.length, allMatchedTerms);
  };

  const highlightedText = useMemo(() => {
    if (results.length === 0) return text;

    let highlighted = text;
    const allTerms: string[] = [];

    conditions.forEach(c => {
      if (c.operator === 'NOT') return;
      if (c.operator === 'LIST' && c.listWords) {
        allTerms.push(...c.listWords.filter(w => w.trim()));
      } else if (c.term.trim()) {
        allTerms.push(c.term);
      }
    });

    const uniqueTerms = [...new Set(allTerms)];
    
    uniqueTerms.forEach((term, idx) => {
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedTerm})`, 'gi');
      const highlightClass = idx % 3 === 0 ? 'highlight-match' : 
                            idx % 3 === 1 ? 'highlight-match-secondary' : 
                            'highlight-match-tertiary';
      highlighted = highlighted.replace(regex, `<mark class="${highlightClass}">$1</mark>`);
    });

    return highlighted;
  }, [text, results, conditions]);

  const handleRestore = (savedText: string, savedConditions: SearchCondition[]) => {
    setText(savedText);
    setConditions(savedConditions);
    setHasSearched(false);
    toast({
      title: 'שוחזר מהיסטוריה',
      description: 'הטקסט והתנאים שוחזרו בהצלחה',
    });
  };

  // בניית תצוגה מקדימה של השאילתה
  const queryPreview = useMemo(() => {
    const parts: string[] = [];
    
    conditions.forEach((cond, index) => {
      if (!cond.term.trim() && cond.operator !== 'LIST') return;
      if (cond.operator === 'LIST' && (!cond.listWords || cond.listWords.length === 0)) return;
      
      if (index > 0 && parts.length > 0) {
        parts.push(operatorHelp[cond.operator].label);
      }
      
      if (cond.operator === 'LIST') {
        const words = cond.listWords?.slice(0, 3).join(', ') || '';
        const more = (cond.listWords?.length || 0) > 3 ? '...' : '';
        parts.push(`[${words}${more}]`);
      } else {
        parts.push(`"${cond.term}"`);
      }
    });
    
    return parts.join(' ');
  }, [conditions]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-white" dir="rtl">
        <Header />
        
        <main className="container mx-auto px-4 sm:px-6 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Hero section */}
            <div className="text-center py-8 animate-fade-in">
              <div className="flex justify-center mb-6">
                <SearchHistory
                  history={history}
                  onRestore={handleRestore}
                  onDelete={deleteHistoryItem}
                  onClear={clearHistory}
                />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
                מערכת חיפוש מתקדמת
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                בנה שאילתות חיפוש מורכבות עם כל הכלים במקום אחד
              </p>
            </div>

            {/* Text input */}
            <TextInput text={text} onTextChange={setText} />

            {/* Unified Search Builder Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-border/50 overflow-hidden animate-fade-in">
              {/* Header */}
              <div className="p-6 border-b border-border/30">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-md">
                      <Search className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-right">
                      <h2 className="text-xl font-bold text-foreground">בנאי שאילתות חיפוש</h2>
                      <p className="text-sm text-muted-foreground">בנה חיפוש מתקדם עם תנאים מרובים</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => setShowTemplates(!showTemplates)}
                      variant="outline"
                      size="sm"
                      className="gap-2 rounded-xl border-amber-300 text-foreground hover:bg-amber-50 hover:border-amber-400"
                    >
                      <BookTemplate className="w-4 h-4 text-amber-600" />
                      תבניות
                    </Button>
                    <Button
                      onClick={addCondition}
                      variant="outline"
                      size="sm"
                      className="gap-2 rounded-xl border-amber-300 text-foreground hover:bg-amber-50 hover:border-amber-400"
                    >
                      <Plus className="w-4 h-4 text-amber-600" />
                      הוסף תנאי
                    </Button>
                  </div>
                </div>

                {/* Search templates */}
                {showTemplates && (
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-amber-50/50 rounded-2xl border border-amber-200/50 animate-fade-in">
                    <div className="col-span-full flex items-center gap-2 pb-3 border-b border-amber-200/50">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span className="font-semibold text-foreground">תבניות חיפוש מוכנות</span>
                    </div>
                    {searchTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => applyTemplate(template)}
                        className="text-right p-4 rounded-xl bg-white border-2 border-transparent hover:border-amber-400 transition-all hover:shadow-md"
                      >
                        <div className="font-semibold text-foreground">{template.name}</div>
                        <div className="text-sm text-muted-foreground">{template.description}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Search Conditions */}
              <div className="p-6 space-y-4">
                {conditions.map((condition, index) => (
                  <div
                    key={condition.id}
                    className="animate-slide-up bg-gray-50/50 rounded-2xl p-5 border border-border/30 hover:border-amber-300/50 transition-all"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      {/* Operator */}
                      {index > 0 ? (
                        <div className="flex items-center gap-2">
                          <Select
                            value={condition.operator}
                            onValueChange={(value: ConditionOperator) =>
                              updateCondition(condition.id, { operator: value })
                            }
                          >
                            <SelectTrigger className="w-28 bg-white rounded-xl font-semibold border border-border/50 shadow-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-border/50 rounded-xl shadow-lg">
                              <SelectItem value="AND">וגם</SelectItem>
                              <SelectItem value="OR">או</SelectItem>
                              <SelectItem value="NOT">ללא</SelectItem>
                              <SelectItem value="NEAR">בקרבת</SelectItem>
                              <SelectItem value="LIST">רשימה</SelectItem>
                            </SelectContent>
                          </Select>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button className="p-1.5 text-muted-foreground hover:text-amber-600 transition-colors">
                                <HelpCircle className="w-4 h-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs text-right bg-foreground text-white p-3 rounded-xl">
                              <div className="font-bold mb-1">{operatorHelp[condition.operator].label}</div>
                              <div className="text-sm opacity-90 mb-2">{operatorHelp[condition.operator].description}</div>
                              <div className="text-xs bg-white/10 p-2 rounded-lg">
                                {operatorHelp[condition.operator].example}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="h-10 px-5 bg-amber-500 text-white font-semibold rounded-xl shadow-sm">
                          חפש:
                        </Badge>
                      )}

                      {/* Input field */}
                      {condition.operator === 'LIST' && index > 0 ? (
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-border/30 flex-wrap">
                            <List className="w-5 h-5 text-amber-600" />
                            <span className="text-sm text-muted-foreground font-medium">רשימת מילים (כל שורה = מילה אחת)</span>
                            <Select
                              value={condition.listMode || 'any'}
                              onValueChange={(value: ListMode) =>
                                updateCondition(condition.id, { listMode: value })
                              }
                            >
                              <SelectTrigger className="w-32 bg-white rounded-xl border border-amber-300">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white rounded-xl">
                                <SelectItem value="any">אחת מהן</SelectItem>
                                <SelectItem value="all">כולן</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-3">
                            <Textarea
                              value={condition.listWords?.join('\n') || ''}
                              onChange={(e) => handleListWordsChange(condition.id, e.target.value)}
                              placeholder="הכנס מילים (כל מילה בשורה נפרדת)..."
                              className="flex-1 min-h-[100px] rounded-xl bg-white border border-border/50 focus:border-amber-400 text-right resize-none"
                              dir="rtl"
                            />
                            <div className="flex flex-col gap-2">
                              <WordListSelector
                                wordLists={wordLists}
                                categories={categories}
                                onSelectList={(words) => {
                                  const currentWords = condition.listWords || [];
                                  const newWords = [...new Set([...currentWords, ...words])];
                                  updateCondition(condition.id, { listWords: newWords, term: newWords.join(' | ') });
                                }}
                              />
                            </div>
                          </div>
                          {condition.listWords && condition.listWords.length > 0 && (
                            <div className="flex flex-wrap gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                              {condition.listWords.slice(0, 10).map((word, i) => (
                                <Badge key={i} variant="secondary" className="bg-white text-foreground border border-amber-200">
                                  {word}
                                </Badge>
                              ))}
                              {condition.listWords.length > 10 && (
                                <Badge variant="outline" className="text-muted-foreground border-amber-200">
                                  +{condition.listWords.length - 10} עוד
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Input
                          value={condition.term}
                          onChange={(e) => updateCondition(condition.id, { term: e.target.value })}
                          onKeyPress={handleKeyPress}
                          placeholder="הקלד מילה לחיפוש..."
                          className="flex-1 text-lg h-12 rounded-xl bg-white border border-border/50 focus:border-amber-400 text-right shadow-sm"
                          dir="rtl"
                        />
                      )}

                      {/* NEAR options */}
                      {condition.operator === 'NEAR' && (
                        <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-border/30">
                          <span className="text-sm text-muted-foreground">בטווח</span>
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            value={condition.proximityRange || 10}
                            onChange={(e) =>
                              updateCondition(condition.id, { proximityRange: parseInt(e.target.value) || 10 })
                            }
                            className="w-16 h-8 text-center rounded-lg border-amber-300"
                          />
                          <span className="text-sm text-muted-foreground">מילים</span>
                        </div>
                      )}

                      {/* Remove button */}
                      {conditions.length > 1 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeCondition(condition.id)}
                              className="h-10 w-10 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                              <X className="w-5 h-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="bg-destructive text-white rounded-lg">
                            הסר תנאי
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Query preview */}
              {queryPreview && (
                <div className="mx-6 mb-6 flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-200/50 animate-fade-in">
                  <Eye className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-right">
                    <div className="text-sm font-semibold text-foreground mb-1">תצוגה מקדימה של השאילתה:</div>
                    <div className="text-base font-mono text-foreground bg-white px-3 py-2 rounded-lg inline-block border border-amber-100">
                      {queryPreview}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Smart Search Section */}
            <Collapsible open={smartSearchOpen} onOpenChange={setSmartSearchOpen}>
              <div className="bg-white rounded-3xl shadow-sm border border-border/50 overflow-hidden">
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-md">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-right">
                        <h3 className="font-bold text-lg text-foreground">חיפוש חכם</h3>
                        <p className="text-sm text-muted-foreground">
                          {Object.values(smartOptions).filter(Boolean).length} כללים פעילים
                        </p>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${smartSearchOpen ? 'rotate-180' : ''}`} />
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {smartSearchConfig.map((config) => {
                      const Icon = config.icon;
                      const isActive = smartOptions[config.key];
                      
                      return (
                        <Tooltip key={config.key}>
                          <TooltipTrigger asChild>
                            <div 
                              className={`flex items-center justify-between p-4 rounded-2xl transition-all cursor-pointer ${
                                isActive 
                                  ? 'bg-white border-2 border-amber-400 shadow-sm' 
                                  : 'bg-gray-50/50 border-2 border-transparent hover:border-amber-200'
                              }`}
                              onClick={() => setSmartOptions({ ...smartOptions, [config.key]: !isActive })}
                            >
                              <div className="flex items-center gap-3 text-right">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-amber-500 text-white' : 'bg-gray-100 text-muted-foreground'}`}>
                                  <Icon className="w-5 h-5" />
                                </div>
                                <div>
                                  <Label className={`font-medium text-base ${isActive ? 'text-foreground' : 'text-foreground'}`}>{config.label}</Label>
                                  <p className="text-xs text-muted-foreground">{config.description}</p>
                                </div>
                              </div>
                              <Switch
                                checked={isActive}
                                onCheckedChange={(checked) => setSmartOptions({ ...smartOptions, [config.key]: checked })}
                                onClick={(e) => e.stopPropagation()}
                                className="data-[state=checked]:bg-amber-500"
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="bg-foreground text-white p-3 rounded-xl max-w-xs text-right">
                            <div className="font-bold mb-1">{config.label}</div>
                            <div className="text-sm opacity-90 mb-2">{config.description}</div>
                            <div className="text-xs bg-white/10 px-2 py-1 rounded-lg inline-block">
                              דוגמה: {config.example}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Filter Rules Section */}
            <Collapsible open={filterRulesOpen} onOpenChange={setFilterRulesOpen}>
              <div className="bg-white rounded-3xl shadow-sm border border-border/50 overflow-hidden">
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center shadow-md">
                        <Filter className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-right">
                        <h3 className="font-bold text-lg text-foreground">כללי סינון מתקדמים</h3>
                        <p className="text-sm text-muted-foreground">
                          מיקום מילים, לפני/אחרי, אורך שורה ועוד
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {(filterRules.positionRules.length > 0 || filterRules.textPositionRules.length > 0) && (
                        <span className="bg-amber-500 text-white text-sm font-semibold px-3 py-1 rounded-full">
                          {filterRules.positionRules.length + filterRules.textPositionRules.length} כללים
                        </span>
                      )}
                      <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${filterRulesOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="px-6 pb-6 space-y-6">
                    <FilterRulesBuilder
                      rules={filterRules}
                      onRulesChange={setFilterRules}
                    />
                    
                    {/* Active Rules Preview with Examples */}
                    <ActiveRulesPreview rules={filterRules} />
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Validation System */}
            <RulesValidationSystem 
              rules={filterRules}
              checkFilterRules={checkFilterRules}
            />

            {/* Results */}
            <SearchResults
              results={results}
              highlightedText={highlightedText}
              hasSearched={hasSearched}
            />
          </div>
        </main>

        {/* Floating Search Button */}
        <div className="floating-search-btn">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={performSearch}
                size="lg"
                className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-xl shadow-amber-500/30 transition-all duration-300 hover:scale-110 active:scale-95"
              >
                <Search className="w-7 h-7" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-foreground text-white rounded-xl font-semibold">
              חפש עכשיו
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Scroll to top button */}
        <Button
          onClick={scrollToTop}
          variant="outline"
          size="icon"
          className="fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full border-2 border-amber-400 bg-white/90 backdrop-blur-sm hover:bg-amber-50 text-amber-600 shadow-lg transition-all"
        >
          <ArrowUp className="w-5 h-5" />
        </Button>

        {/* Footer */}
        <footer className="bg-gradient-to-r from-slate-800 to-slate-900 border-t-4 border-amber-500 mt-12 py-8">
          <div className="container mx-auto px-6 text-center">
            <p className="text-white font-medium text-lg">חיפוש חכם - ניתוח טקסטים מתקדם</p>
            <p className="text-amber-400 text-sm mt-2">הנתונים נשמרים במחשב שלך 💾</p>
          </div>
        </footer>

        {/* Settings Button */}
        <SettingsButton
          wordLists={wordLists}
          categories={categories}
          onAddList={addWordList}
          onUpdateList={updateWordList}
          onDeleteList={deleteWordList}
          onAddCategory={addCategory}
          onDeleteCategory={deleteCategory}
        />
      </div>
    </TooltipProvider>
  );
};

export default Index;