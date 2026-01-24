import { useRef, useCallback } from 'react';
import { CheckCircle2, AlertCircle, MapPin, ChevronLeft } from 'lucide-react';
import { SearchResult } from '@/types/search';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SearchResultsProps {
  results: SearchResult[];
  highlightedText: string;
  hasSearched: boolean;
  textRef?: React.RefObject<HTMLDivElement>;
}

export function SearchResults({ results, highlightedText, hasSearched, textRef }: SearchResultsProps) {
  const highlightedTextRef = useRef<HTMLDivElement>(null);

  const scrollToMatch = useCallback((startIndex: number, matchedTerm: string) => {
    const container = highlightedTextRef.current;
    if (!container) return;

    // Find all mark elements and locate the one closest to the startIndex
    const marks = container.querySelectorAll('mark');
    let targetMark: Element | null = null;
    
    // Find the mark that contains the matched term
    for (const mark of marks) {
      if (mark.textContent?.includes(matchedTerm)) {
        targetMark = mark;
        break;
      }
    }

    if (targetMark) {
      // Add a temporary highlight effect
      targetMark.classList.add('ring-4', 'ring-accent', 'ring-offset-2');
      targetMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Remove the ring after animation
      setTimeout(() => {
        targetMark?.classList.remove('ring-4', 'ring-accent', 'ring-offset-2');
      }, 2000);
    }
  }, []);

  if (!hasSearched) {
    return (
      <div className="glass-effect rounded-2xl p-10 text-center animate-fade-in">
        <div className="text-muted-foreground">
          <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔍</span>
          </div>
          <p className="text-lg font-medium mb-2">הגדר מילות חיפוש ולחץ על כפתור החיפוש</p>
          <p className="text-sm">השתמש בבנאי השאילתות למעלה להגדרת תנאי החיפוש</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Results summary */}
      <div className={`glass-effect rounded-2xl p-5 flex items-center gap-4 flex-row-reverse ${
        results.length > 0 
          ? 'border-success/30' 
          : 'border-warning/30'
      }`}>
        {results.length > 0 ? (
          <>
            <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-success" />
            </div>
            <div className="text-right flex-1">
              <span className="font-bold text-lg text-foreground">נמצאו {results.length} התאמות</span>
              <p className="text-sm text-muted-foreground">לחץ על תוצאה לניווט ישיר</p>
            </div>
          </>
        ) : (
          <>
            <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-warning" />
            </div>
            <div className="text-right flex-1">
              <span className="font-bold text-lg text-foreground">לא נמצאו התאמות</span>
              <p className="text-sm text-muted-foreground">נסה לשנות את מילות החיפוש</p>
            </div>
          </>
        )}
      </div>

      {results.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Results Summary List */}
          <div className="glass-effect rounded-2xl overflow-hidden">
            <div className="bg-navy px-5 py-4">
              <h3 className="font-bold text-lg text-white text-right flex items-center gap-2 justify-end">
                <span>סיכום תוצאות ({results.length})</span>
                <MapPin className="w-5 h-5 text-gold" />
              </h3>
            </div>
            <ScrollArea className="h-[400px]">
              <div className="p-4 space-y-3">
                {results.map((result, idx) => (
                  <button
                    key={idx}
                    onClick={() => scrollToMatch(result.startIndex, result.matchedTerms[0])}
                    className="w-full text-right p-4 bg-secondary/30 hover:bg-gold/10 rounded-xl border border-border hover:border-gold transition-all group animate-slide-up"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-gold transition-colors mt-1 shrink-0" />
                      <div className="flex-1">
                        <p className="text-foreground text-sm leading-relaxed line-clamp-2 mb-2" dir="rtl">
                          {result.text.substring(0, 100)}
                          {result.text.length > 100 && '...'}
                        </p>
                        <div className="flex flex-wrap gap-1.5 justify-end">
                          {result.matchedTerms.slice(0, 3).map((term, termIdx) => (
                            <Badge 
                              key={termIdx} 
                              className="bg-gold/20 text-navy border border-gold/30 font-medium text-xs"
                            >
                              {term}
                            </Badge>
                          ))}
                          {result.matchedTerms.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{result.matchedTerms.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Highlighted text */}
          <div className="glass-effect rounded-2xl overflow-hidden">
            <div className="bg-gold px-5 py-4">
              <h3 className="font-bold text-lg text-navy text-right">טקסט עם הדגשות</h3>
            </div>
            <ScrollArea className="h-[400px]">
              <div className="p-5">
                <div
                  ref={highlightedTextRef}
                  className="text-foreground leading-loose whitespace-pre-wrap text-base text-right"
                  dir="rtl"
                  dangerouslySetInnerHTML={{ __html: highlightedText }}
                />
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
}
