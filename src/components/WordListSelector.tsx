import { useState } from 'react';
import { List, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { WordList, WordListCategory } from '@/types/wordList';

interface WordListSelectorProps {
  wordLists: WordList[];
  categories: WordListCategory[];
  onSelectList: (words: string[]) => void;
}

export function WordListSelector({ wordLists, categories, onSelectList }: WordListSelectorProps) {
  const [open, setOpen] = useState(false);

  const getCategoryColor = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.color || 'hsl(220, 60%, 50%)';
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'כללי';
  };

  const handleSelect = (list: WordList) => {
    onSelectList(list.words);
    setOpen(false);
  };

  if (wordLists.length === 0) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 rounded-lg border-gold/50 text-navy hover:bg-gold/10"
        >
          <List className="w-4 h-4" />
          בחר מרשימה
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-72 p-0 rounded-xl" 
        align="start"
        dir="rtl"
      >
        <div className="p-3 border-b">
          <h4 className="font-semibold text-navy">בחר רשימת מילים</h4>
          <p className="text-xs text-muted-foreground">המילים יתווספו לשדה הרשימה</p>
        </div>
        <ScrollArea className="h-64">
          <div className="p-2 space-y-1">
            {categories.map((category) => {
              const listsInCategory = wordLists.filter(l => l.category === category.id);
              if (listsInCategory.length === 0) return null;
              
              return (
                <div key={category.id} className="mb-3">
                  <div className="flex items-center gap-2 px-2 py-1">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-xs font-medium text-muted-foreground">
                      {category.name}
                    </span>
                  </div>
                  {listsInCategory.map((list) => (
                    <button
                      key={list.id}
                      onClick={() => handleSelect(list)}
                      className="w-full text-right p-2 rounded-lg hover:bg-secondary/50 transition-colors flex items-center justify-between group"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm text-navy">{list.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {list.words.length} מילים
                        </div>
                      </div>
                      <Check className="w-4 h-4 text-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
