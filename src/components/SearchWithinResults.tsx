import { useState, useMemo } from 'react';
import { Filter, X, Search as SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchResult } from '@/types/search';

interface SearchWithinResultsProps {
  results: SearchResult[];
  onFilteredResults: (filteredResults: SearchResult[]) => void;
}

export function SearchWithinResults({ results, onFilteredResults }: SearchWithinResultsProps) {
  const [filterQuery, setFilterQuery] = useState('');
  const [isActive, setIsActive] = useState(false);

  const filteredResults = useMemo(() => {
    if (!filterQuery.trim()) {
      return results;
    }
    
    const query = filterQuery.toLowerCase();
    return results.filter(result => 
      result.text.toLowerCase().includes(query) ||
      result.matchedTerms.some(term => term.toLowerCase().includes(query))
    );
  }, [results, filterQuery]);

  const handleSearch = () => {
    onFilteredResults(filteredResults);
  };

  const handleClear = () => {
    setFilterQuery('');
    setIsActive(false);
    onFilteredResults(results);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      handleClear();
    }
  };

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2" dir="rtl">
      {isActive ? (
        <div className="flex items-center gap-2 flex-1 animate-fade-in">
          <Input
            value={filterQuery}
            onChange={(e) => {
              setFilterQuery(e.target.value);
              // Auto-filter on type
              const query = e.target.value.toLowerCase();
              if (!query.trim()) {
                onFilteredResults(results);
              } else {
                const filtered = results.filter(result => 
                  result.text.toLowerCase().includes(query) ||
                  result.matchedTerms.some(term => term.toLowerCase().includes(query))
                );
                onFilteredResults(filtered);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="חפש בתוצאות..."
            className="text-right h-9"
            autoFocus
          />
          
          {filterQuery && (
            <Badge variant="secondary" className="text-xs whitespace-nowrap">
              {filteredResults.length} / {results.length}
            </Badge>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="h-9 w-9"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsActive(true)}
          className="gap-2 text-navy border-gold hover:bg-gold/10"
        >
          <Filter className="w-4 h-4" />
          חיפוש בתוצאות
        </Button>
      )}
    </div>
  );
}
