import { CheckCircle2, AlertCircle } from 'lucide-react';
import { SearchResult } from '@/types/search';
import { Badge } from '@/components/ui/badge';

interface SearchResultsProps {
  results: SearchResult[];
  highlightedText: string;
  hasSearched: boolean;
}

export function SearchResults({ results, highlightedText, hasSearched }: SearchResultsProps) {
  if (!hasSearched) {
    return (
      <div className="bg-white rounded-2xl border-2 border-border p-10 text-center shadow-md animate-fade-in">
        <div className="text-muted-foreground">
          <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔍</span>
          </div>
          <p className="text-lg font-medium mb-2">הגדר מילות חיפוש ולחץ על "חפש עכשיו"</p>
          <p className="text-sm">השתמש בקבוצות "חייב להכיל", "אחד מאלה" ו-"לא להכיל"</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Results summary */}
      <div className={`rounded-2xl p-5 flex items-center gap-4 border-2 shadow-md flex-row-reverse ${
        results.length > 0 
          ? 'bg-white border-success/30' 
          : 'bg-white border-warning/30'
      }`}>
        {results.length > 0 ? (
          <>
            <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-success" />
            </div>
            <div className="text-right">
              <span className="font-bold text-lg text-foreground">נמצאו {results.length} התאמות</span>
              <p className="text-sm text-muted-foreground">הטקסט המודגש מוצג למטה</p>
            </div>
          </>
        ) : (
          <>
            <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-warning" />
            </div>
            <div className="text-right">
              <span className="font-bold text-lg text-foreground">לא נמצאו התאמות</span>
              <p className="text-sm text-muted-foreground">נסה לשנות את מילות החיפוש</p>
            </div>
          </>
        )}
      </div>

      {/* Highlighted text */}
      {results.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-border shadow-md overflow-hidden">
          <div className="bg-navy px-6 py-4">
            <h3 className="font-bold text-lg text-white text-right">טקסט עם הדגשות</h3>
          </div>
          <div className="p-6">
            <div
              className="text-foreground leading-loose whitespace-pre-wrap text-base text-right"
              dir="rtl"
              dangerouslySetInnerHTML={{ __html: highlightedText }}
            />
          </div>
        </div>
      )}

      {/* Individual results */}
      {results.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-border shadow-md overflow-hidden">
          <div className="bg-gold px-6 py-4">
            <h3 className="font-bold text-lg text-navy text-right">משפטים שנמצאו ({results.length})</h3>
          </div>
          <div className="p-6 space-y-4">
            {results.map((result, idx) => (
              <div
                key={idx}
                className="p-5 bg-secondary/30 rounded-xl border border-border animate-slide-up"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <p className="text-foreground mb-3 leading-relaxed text-right" dir="rtl">
                  {result.text}
                </p>
                <div className="flex flex-wrap gap-2 justify-end">
                  {result.matchedTerms.map((term, termIdx) => (
                    <Badge 
                      key={termIdx} 
                      className="bg-gold/20 text-navy border border-gold/30 font-medium"
                    >
                      {term}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
