import { History, Trash2, Clock, RotateCcw, X, Search, Calendar, Tag, TrendingUp, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SearchHistoryItem } from '@/hooks/useLocalStorage';
import { SearchCondition } from '@/types/search';
import { useState, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SearchHistoryProps {
  history: SearchHistoryItem[];
  onRestore: (text: string, conditions: SearchCondition[]) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

type DateFilter = 'all' | 'today' | 'week' | 'month';
type SortBy = 'date' | 'results';

export function SearchHistory({
  history,
  onRestore,
  onDelete,
  onClear,
}: SearchHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getOperatorLabel = (op: string) => {
    switch (op) {
      case 'AND': return 'וגם';
      case 'OR': return 'או';
      case 'NOT': return 'לא';
      case 'NEAR': return 'בקרבת';
      case 'LIST': return 'רשימה';
      default: return op;
    }
  };

  const isWithinDateRange = (timestamp: number, filter: DateFilter): boolean => {
    if (filter === 'all') return true;
    
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    
    switch (filter) {
      case 'today':
        return now - timestamp < day;
      case 'week':
        return now - timestamp < 7 * day;
      case 'month':
        return now - timestamp < 30 * day;
      default:
        return true;
    }
  };

  const filteredAndSortedHistory = useMemo(() => {
    let filtered = history;

    // Date filter
    filtered = filtered.filter(item => isWithinDateRange(item.timestamp, dateFilter));

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.conditions.some(c => c.term?.toLowerCase().includes(query)) ||
        item.matchedTerms.some(t => t.toLowerCase().includes(query))
      );
    }

    // Sort
    if (sortBy === 'date') {
      filtered = [...filtered].sort((a, b) => b.timestamp - a.timestamp);
    } else {
      filtered = [...filtered].sort((a, b) => b.resultsCount - a.resultsCount);
    }

    return filtered;
  }, [history, dateFilter, searchQuery, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    const totalSearches = history.length;
    const totalResults = history.reduce((sum, h) => sum + h.resultsCount, 0);
    const avgResults = totalSearches > 0 ? Math.round(totalResults / totalSearches) : 0;
    return { totalSearches, totalResults, avgResults };
  }, [history]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 touch-target">
          <History className="w-4 h-4" />
          <span className="hidden sm:inline">היסטוריה</span>
          {history.length > 0 && (
            <Badge variant="secondary" className="mr-1">
              {history.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[400px] md:w-[540px] p-0">
        <SheetHeader className="p-4 border-b border-gold/30">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              היסטוריית חיפושים
            </SheetTitle>
            {history.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive">
                    <Trash2 className="w-4 h-4 ml-1" />
                    נקה
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>מחיקת היסטוריה</AlertDialogTitle>
                    <AlertDialogDescription>
                      האם אתה בטוח שברצונך למחוק את כל היסטוריית החיפושים?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>ביטול</AlertDialogCancel>
                    <AlertDialogAction onClick={onClear}>מחק הכל</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {/* Statistics */}
          {history.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="text-center p-2 bg-gold/10 rounded-lg">
                <div className="text-lg font-bold text-navy dark:text-gold">{stats.totalSearches}</div>
                <div className="text-xs text-muted-foreground">חיפושים</div>
              </div>
              <div className="text-center p-2 bg-gold/10 rounded-lg">
                <div className="text-lg font-bold text-navy dark:text-gold">{stats.totalResults}</div>
                <div className="text-xs text-muted-foreground">תוצאות</div>
              </div>
              <div className="text-center p-2 bg-gold/10 rounded-lg">
                <div className="text-lg font-bold text-navy dark:text-gold">{stats.avgResults}</div>
                <div className="text-xs text-muted-foreground">ממוצע</div>
              </div>
            </div>
          )}

          {/* Filters */}
          {history.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              <div className="relative flex-1 min-w-[150px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="חפש בהיסטוריה..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-9 text-sm"
                />
              </div>
              <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
                <SelectTrigger className="w-28">
                  <Calendar className="w-4 h-4 ml-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-card">
                  <SelectItem value="all">הכל</SelectItem>
                  <SelectItem value="today">היום</SelectItem>
                  <SelectItem value="week">שבוע</SelectItem>
                  <SelectItem value="month">חודש</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                <SelectTrigger className="w-28">
                  <TrendingUp className="w-4 h-4 ml-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-card">
                  <SelectItem value="date">תאריך</SelectItem>
                  <SelectItem value="results">תוצאות</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-280px)]">
          {filteredAndSortedHistory.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{history.length === 0 ? 'אין היסטוריית חיפושים' : 'לא נמצאו תוצאות'}</p>
              <p className="text-sm">החיפושים שלך יישמרו כאן</p>
            </div>
          ) : (
            <div className="space-y-3 p-4">
              {filteredAndSortedHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-card rounded-lg border border-border hover:border-gold/50 transition-colors touch-target"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(item.timestamp)}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 touch-target"
                        onClick={() => onRestore(item.text, item.conditions)}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 touch-target text-muted-foreground hover:text-destructive"
                        onClick={() => onDelete(item.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {item.conditions.map((cond, idx) => (
                        <span key={cond.id} className="flex items-center gap-1">
                          {idx > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {getOperatorLabel(cond.operator)}
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {cond.operator === 'LIST' 
                              ? `רשימה (${cond.listWords?.length || 0})` 
                              : cond.term || '—'}
                          </Badge>
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Badge 
                        variant={item.resultsCount > 0 ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {item.resultsCount} תוצאות
                      </Badge>
                      {item.matchedTerms.length > 0 && (
                        <span className="text-xs text-muted-foreground truncate">
                          נמצאו: {item.matchedTerms.slice(0, 3).join(', ')}
                          {item.matchedTerms.length > 3 && '...'}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {item.text.substring(0, 100)}...
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
