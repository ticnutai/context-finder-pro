import { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/Header';
import { TextInput } from '@/components/TextInput';
import { SearchResults } from '@/components/SearchResults';
import { SearchHistory } from '@/components/SearchHistory';
import { VisualQueryBuilder, VisualWordGroup } from '@/components/VisualQueryBuilder';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useWordLists } from '@/hooks/useWordLists';
import { SearchCondition, SearchResult, SmartSearchOptions, FilterRules } from '@/types/search';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchConditionBuilder } from '@/components/SearchConditionBuilder';
import { FilterRulesBuilder } from '@/components/FilterRulesBuilder';
import { RulesValidationSystem } from '@/components/RulesValidationSystem';
import { SettingsButton } from '@/components/SettingsButton';
import { Wand2, Settings2, Filter } from 'lucide-react';
import { expandSearchTerm } from '@/utils/hebrewUtils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

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
  const [mode, setMode] = useState<'visual' | 'advanced'>('visual');
  
  const [visualGroups, setVisualGroups] = useState<VisualWordGroup[]>([
    { id: crypto.randomUUID(), words: [], type: 'must' },
  ]);

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

  const visualToConditions = (groups: VisualWordGroup[]): SearchCondition[] => {
    const result: SearchCondition[] = [];
    
    const mustGroup = groups.find(g => g.type === 'must');
    if (mustGroup && mustGroup.words.length > 0) {
      mustGroup.words.forEach((word) => {
        result.push({
          id: crypto.randomUUID(),
          term: word,
          operator: 'AND',
        });
      });
    }

    const anyGroup = groups.find(g => g.type === 'any');
    if (anyGroup && anyGroup.words.length > 0) {
      result.push({
        id: crypto.randomUUID(),
        term: '',
        operator: 'LIST',
        listWords: anyGroup.words,
        listMode: 'any',
      });
    }

    const notGroup = groups.find(g => g.type === 'not');
    if (notGroup) {
      notGroup.words.forEach(word => {
        result.push({
          id: crypto.randomUUID(),
          term: word,
          operator: 'NOT',
        });
      });
    }

    return result.length > 0 ? result : [{ id: crypto.randomUUID(), term: '', operator: 'AND' }];
  };

  // Helper function to check filter rules
  const checkFilterRules = (segment: string, words: string[]): boolean => {
    // Check position rules (before/after)
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
    
    // Check text position rules (start/end of line)
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
    
    // Check word count limits
    if (filterRules.minWordCount && words.length < filterRules.minWordCount) {
      return false;
    }
    if (filterRules.maxWordCount && words.length > filterRules.maxWordCount) {
      return false;
    }
    
    // Check must contain numbers
    if (filterRules.mustContainNumbers && !/\d/.test(segment)) {
      return false;
    }
    
    // Check letters only
    if (filterRules.mustContainLettersOnly && /[\d]/.test(segment)) {
      return false;
    }
    
    return true;
  };

  const performSearch = () => {
    const searchConditions = mode === 'visual' 
      ? visualToConditions(visualGroups) 
      : conditions;

    if (!text.trim()) {
      setResults([]);
      setHasSearched(true);
      return;
    }

    const normalize = (str: string) => str.trim().toLowerCase();
    const segments = text.split(/[\n]+/).filter(s => s.trim());
    const foundResults: SearchResult[] = [];

    // Expand terms with smart variations
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

      const firstTermConditions = searchConditions.filter(c => c.operator !== 'LIST' && c.operator !== 'NOT' && c.operator !== 'OR');
      const listConditions = searchConditions.filter(c => c.operator === 'LIST');
      const notConditions = searchConditions.filter(c => c.operator === 'NOT');

      // Check AND terms with variations
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

      // Check LIST (any) terms with variations
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

      // Check NOT terms with variations
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
      
      // Apply filter rules
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
    addToHistory(text, searchConditions, foundResults.length, allMatchedTerms);
  };

  const highlightedText = useMemo(() => {
    if (results.length === 0) return text;

    let highlighted = text;
    const allTerms: string[] = [];

    if (mode === 'visual') {
      visualGroups.forEach(group => {
        if (group.type !== 'not') {
          group.words.forEach(word => {
            // Add original and variations for highlighting
            const variations = expandSearchTerm(word, {
              includeNumberVariations: smartOptions.numberToHebrew,
              includeWordVariations: smartOptions.wordVariations,
            });
            allTerms.push(...variations);
          });
        }
      });
    } else {
      conditions.forEach(c => {
        if (c.operator === 'NOT') return;
        if (c.operator === 'LIST' && c.listWords) {
          allTerms.push(...c.listWords.filter(w => w.trim()));
        } else if (c.term.trim()) {
          allTerms.push(c.term);
        }
      });
    }

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
  }, [text, results, mode, visualGroups, conditions, smartOptions]);

  const handleRestore = (savedText: string, savedConditions: SearchCondition[]) => {
    setText(savedText);
    setConditions(savedConditions);
    setMode('advanced');
    setHasSearched(false);
    toast({
      title: 'שוחזר מהיסטוריה',
      description: 'הטקסט והתנאים שוחזרו בהצלחה',
    });
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      
      <main className="container mx-auto px-6 py-10">
        <div className="max-w-4xl mx-auto space-y-8">
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
            <h2 className="text-4xl font-extrabold text-navy mb-3">
              מערכת חיפוש מתקדמת
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              בחר מילים בקלות ומצא בדיוק מה שאתה מחפש בטקסט
            </p>
          </div>

          {/* Text input */}
          <TextInput text={text} onTextChange={setText} />

          {/* Mode tabs */}
          <Tabs value={mode} onValueChange={(v) => setMode(v as 'visual' | 'advanced')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-16 rounded-2xl bg-secondary p-1.5">
              <TabsTrigger 
                value="visual" 
                className="text-base gap-3 rounded-xl font-semibold data-[state=active]:bg-navy data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
              >
                <Wand2 className="w-5 h-5" />
                מצב פשוט
              </TabsTrigger>
              <TabsTrigger 
                value="advanced" 
                className="text-base gap-3 rounded-xl font-semibold data-[state=active]:bg-navy data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
              >
                <Settings2 className="w-5 h-5" />
                מצב מתקדם
              </TabsTrigger>
            </TabsList>

            <TabsContent value="visual" className="mt-8">
              <VisualQueryBuilder
                groups={visualGroups}
                onGroupsChange={setVisualGroups}
                onSearch={performSearch}
              />
            </TabsContent>

            <TabsContent value="advanced" className="mt-8">
              <SearchConditionBuilder
                conditions={conditions}
                onConditionsChange={setConditions}
                onSearch={performSearch}
                smartOptions={smartOptions}
                onSmartOptionsChange={setSmartOptions}
                wordLists={wordLists}
                categories={categories}
              />
            </TabsContent>
          </Tabs>

          {/* Filter Rules Section */}
          <Collapsible open={filterRulesOpen} onOpenChange={setFilterRulesOpen}>
            <div className="bg-gradient-to-br from-gold/5 to-navy/5 rounded-2xl border-2 border-gold/20 overflow-hidden">
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-white/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-gold to-gold-dark rounded-xl flex items-center justify-center shadow-md">
                      <Filter className="w-6 h-6 text-navy" />
                    </div>
                    <div className="text-right">
                      <h3 className="font-bold text-lg text-navy">כללי סינון מתקדמים</h3>
                      <p className="text-sm text-muted-foreground">
                        מיקום מילים, לפני/אחרי, אורך שורה ועוד
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {(filterRules.positionRules.length > 0 || filterRules.textPositionRules.length > 0) && (
                      <span className="bg-gold text-navy text-sm font-semibold px-3 py-1 rounded-full">
                        {filterRules.positionRules.length + filterRules.textPositionRules.length} כללים
                      </span>
                    )}
                    <ChevronDown className={`w-5 h-5 text-navy transition-transform duration-200 ${filterRulesOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="p-5 pt-0">
                  <FilterRulesBuilder
                    rules={filterRules}
                    onRulesChange={setFilterRules}
                  />
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

      {/* Footer */}
      <footer className="bg-navy border-t-4 border-gold mt-16 py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-white font-medium">חיפוש חכם - ניתוח טקסטים מתקדם</p>
          <p className="text-gold-light text-sm mt-1">הנתונים נשמרים במחשב שלך 💾</p>
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
  );
};

export default Index;
