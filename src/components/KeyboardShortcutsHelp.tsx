import { Keyboard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useState } from 'react';

interface ShortcutItem {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: ShortcutItem[] = [
  // Navigation
  { keys: ['↑'], description: 'תוצאה קודמת', category: 'ניווט' },
  { keys: ['↓'], description: 'תוצאה הבאה', category: 'ניווט' },
  { keys: ['Enter'], description: 'קפיצה לתוצאה נבחרת', category: 'ניווט' },
  { keys: ['Ctrl', 'N'], description: 'תוצאה הבאה', category: 'ניווט' },
  { keys: ['Ctrl', 'P'], description: 'תוצאה קודמת', category: 'ניווט' },
  { keys: ['Home'], description: 'תוצאה ראשונה', category: 'ניווט' },
  { keys: ['End'], description: 'תוצאה אחרונה', category: 'ניווט' },
  
  // Search
  { keys: ['Ctrl', 'F'], description: 'התמקד בחיפוש', category: 'חיפוש' },
  { keys: ['Ctrl', 'Enter'], description: 'בצע חיפוש', category: 'חיפוש' },
  { keys: ['Ctrl', 'S'], description: 'שמור חיפוש', category: 'חיפוש' },
  { keys: ['Ctrl', 'L'], description: 'נקה חיפוש', category: 'חיפוש' },
  
  // Actions
  { keys: ['Ctrl', 'E'], description: 'ייצא תוצאות', category: 'פעולות' },
  { keys: ['Ctrl', 'B'], description: 'הוסף/הסר סימניה', category: 'פעולות' },
  { keys: ['Ctrl', 'D'], description: 'שכפל תנאי חיפוש', category: 'פעולות' },
  
  // General
  { keys: ['Escape'], description: 'סגור חלון / ביטול', category: 'כללי' },
  { keys: ['?'], description: 'פתח מדריך קיצורים', category: 'כללי' },
  { keys: ['Ctrl', '/'], description: 'פתח/סגור עזרה', category: 'כללי' },
];

interface KeyboardShortcutsHelpProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function KeyboardShortcutsHelp({ open, onOpenChange }: KeyboardShortcutsHelpProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;
  
  const categories = [...new Set(shortcuts.map(s => s.category))];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 border-gold text-navy hover:bg-gold/10"
        >
          <Keyboard className="w-4 h-4" />
          קיצורי מקלדת
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white dark:bg-card border-gold"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-right text-xl font-bold text-navy dark:text-foreground">
            <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center">
              <Keyboard className="w-5 h-5 text-navy" />
            </div>
            קיצורי מקלדת
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {categories.map(category => (
            <div key={category} className="space-y-3">
              <h3 className="font-bold text-navy dark:text-gold text-lg border-b border-gold/30 pb-2">
                {category}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {shortcuts
                  .filter(s => s.category === category)
                  .map((shortcut, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 dark:bg-muted/30 hover:bg-gold/10 transition-colors"
                    >
                      <span className="text-sm text-muted-foreground">
                        {shortcut.description}
                      </span>
                      <div className="flex gap-1">
                        {shortcut.keys.map((key, keyIdx) => (
                          <span key={keyIdx}>
                            <kbd className="px-2 py-1 text-xs font-mono bg-navy dark:bg-gold text-white dark:text-navy rounded-md shadow-sm">
                              {key}
                            </kbd>
                            {keyIdx < shortcut.keys.length - 1 && (
                              <span className="text-muted-foreground mx-0.5">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-4 bg-gold/10 rounded-xl text-sm text-muted-foreground text-center">
          💡 טיפ: לחץ <kbd className="px-2 py-0.5 bg-navy text-white rounded mx-1">?</kbd> בכל מקום לפתיחת מדריך זה
        </div>
      </DialogContent>
    </Dialog>
  );
}
