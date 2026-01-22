import { Plus, X, Search, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchCondition, ConditionOperator, ProximityDirection, ListMode } from '@/types/search';

interface SearchConditionBuilderProps {
  conditions: SearchCondition[];
  onConditionsChange: (conditions: SearchCondition[]) => void;
  onSearch: () => void;
}

export function SearchConditionBuilder({
  conditions,
  onConditionsChange,
  onSearch,
}: SearchConditionBuilderProps) {
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
    onConditionsChange([...conditions, newCondition]);
  };

  const removeCondition = (id: string) => {
    onConditionsChange(conditions.filter(c => c.id !== id));
  };

  const updateCondition = (id: string, updates: Partial<SearchCondition>) => {
    onConditionsChange(
      conditions.map(c => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const handleListWordsChange = (id: string, text: string) => {
    const words = text.split('\n').filter(w => w.trim());
    updateCondition(id, { listWords: words, term: words.join(' | ') });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Don't trigger search on Enter in textarea (need Shift+Enter or button)
      if ((e.target as HTMLElement).tagName !== 'TEXTAREA') {
        onSearch();
      }
    }
  };

  return (
    <div className="glass-effect rounded-xl p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">בנאי שאילתות חיפוש</h2>
        <Button
          onClick={addCondition}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          הוסף תנאי
        </Button>
      </div>

      <div className="space-y-3">
        {conditions.map((condition, index) => (
          <div
            key={condition.id}
            className="animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start gap-3">
              {index > 0 && (
                <Select
                  value={condition.operator}
                  onValueChange={(value: ConditionOperator) =>
                    updateCondition(condition.id, { operator: value })
                  }
                >
                  <SelectTrigger className="w-28 bg-card mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AND">וגם</SelectItem>
                    <SelectItem value="OR">או</SelectItem>
                    <SelectItem value="NOT">לא</SelectItem>
                    <SelectItem value="NEAR">בקרבת</SelectItem>
                    <SelectItem value="LIST">רשימה</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {index === 0 && <div className="w-28 text-sm text-muted-foreground text-center mt-4">חפש:</div>}

              {condition.operator === 'LIST' && index > 0 ? (
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg border border-border/50">
                    <List className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">רשימת מילים (כל שורה = מילה אחת)</span>
                    <Select
                      value={condition.listMode || 'any'}
                      onValueChange={(value: ListMode) =>
                        updateCondition(condition.id, { listMode: value })
                      }
                    >
                      <SelectTrigger className="w-32 bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">אחת מהן (או)</SelectItem>
                        <SelectItem value="all">כולן (וגם)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    value={(condition.listWords || []).join('\n')}
                    onChange={(e) => handleListWordsChange(condition.id, e.target.value)}
                    placeholder="הזן מילים - כל שורה מילה אחת..."
                    className="min-h-[100px] bg-card font-mono text-sm"
                    dir="rtl"
                  />
                </div>
              ) : (
                <Input
                  value={condition.term}
                  onChange={(e) => updateCondition(condition.id, { term: e.target.value })}
                  onKeyPress={handleKeyPress}
                  placeholder={index === 0 ? 'הזן מילת חיפוש...' : 'הזן תנאי נוסף...'}
                  className="flex-1 bg-card"
                />
              )}

              {conditions.length > 1 && (
                <Button
                  onClick={() => removeCondition(condition.id)}
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive shrink-0 mt-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Proximity options */}
            {index > 0 && condition.operator === 'NEAR' && (
              <div className="flex items-center gap-3 mt-2 mr-28 p-3 bg-secondary/30 rounded-lg border border-border/50">
                <span className="text-sm text-muted-foreground whitespace-nowrap">טווח:</span>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={condition.proximityRange || 10}
                  onChange={(e) => updateCondition(condition.id, { proximityRange: parseInt(e.target.value) || 10 })}
                  className="w-20 bg-card"
                />
                <span className="text-sm text-muted-foreground">מילים</span>
                
                <Select
                  value={condition.proximityDirection || 'both'}
                  onValueChange={(value: ProximityDirection) =>
                    updateCondition(condition.id, { proximityDirection: value })
                  }
                >
                  <SelectTrigger className="w-32 bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="before">לפני</SelectItem>
                    <SelectItem value="after">אחרי</SelectItem>
                    <SelectItem value="both">לפני ואחרי</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        ))}
      </div>

      <Button
        onClick={onSearch}
        className="w-full mt-4 gap-2 bg-primary hover:bg-primary/90"
        size="lg"
      >
        <Search className="w-5 h-5" />
        חפש בטקסט
      </Button>
    </div>
  );
}
