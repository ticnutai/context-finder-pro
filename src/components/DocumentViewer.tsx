import { useState, useMemo } from 'react';
import { X, Book } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Document, SourceReference } from '@/services/indexService';
import { numberToHebrew } from '@/utils/hebrewUtils';

interface DocumentViewerProps {
  document: Document | null;
  references: SourceReference[];
  open: boolean;
  onClose: () => void;
}

// המרת מספרים לאותיות עבריות בטקסט
function convertNumbersToHebrewLetters(text: string): string {
  // דפוסים לזיהוי דפים ועמודים עם מספרים
  const patterns = [
    // דף + מספר
    { regex: /דף\s*(\d+)/g, prefix: 'דף ' },
    // עמוד + מספר
    { regex: /עמוד\s*(\d+)/g, prefix: 'עמוד ' },
    // ע"א, ע"ב עם מספרים
    { regex: /ע['"]?א\s*(\d+)/g, prefix: 'ע"א ' },
    { regex: /ע['"]?ב\s*(\d+)/g, prefix: 'ע"ב ' },
  ];

  let result = text;
  
  for (const pattern of patterns) {
    result = result.replace(pattern.regex, (match, num) => {
      const hebrewNum = numberToHebrew(parseInt(num));
      return hebrewNum ? `${pattern.prefix}${hebrewNum}` : match;
    });
  }

  // המר גם מספרים בודדים אחרי מילות מפתח
  result = result.replace(/(דף|עמוד|פרק|סימן)\s*(\d+)/g, (match, word, num) => {
    const hebrewNum = numberToHebrew(parseInt(num));
    return hebrewNum ? `${word} ${hebrewNum}` : match;
  });

  return result;
}

// פורמט מראה מקום עם אותיות עבריות
function formatReferenceHebrew(ref: SourceReference): string {
  const dafHebrew = numberToHebrew(ref.daf_number);
  const amudHebrew = ref.amud === 'א' || ref.amud === 'ע"א' ? 'א' : 'ב';
  return `${ref.tractate?.name || ''} דף ${dafHebrew} עמוד ${amudHebrew}`;
}

export function DocumentViewer({ document, references, open, onClose }: DocumentViewerProps) {
  // יצירת טקסט עם הדגשות - hook must be before any early return
  const highlightedContent = useMemo(() => {
    if (!document?.content) return null;

    let content = document.content;
    
    // המרת מספרים לאותיות עבריות
    content = convertNumbersToHebrewLetters(content);

    // מיון הפניות לפי מיקום (מהסוף להתחלה כדי לא לקלקל אינדקסים)
    const sortedRefs = [...references]
      .filter(ref => ref.position_in_doc !== null)
      .sort((a, b) => (b.position_in_doc || 0) - (a.position_in_doc || 0));

    // יצירת segments עם הדגשות
    const segments: { text: string; highlighted: boolean; ref?: SourceReference }[] = [];
    
    if (sortedRefs.length === 0) {
      segments.push({ text: content, highlighted: false });
    } else {
      let lastEnd = content.length;
      
      for (const ref of sortedRefs) {
        const start = ref.position_in_doc || 0;
        const originalText = ref.original_text;
        const end = start + originalText.length;
        
        // טקסט אחרי ההדגשה
        if (end < lastEnd) {
          const afterText = content.substring(end, lastEnd);
          if (afterText) {
            segments.unshift({ text: afterText, highlighted: false });
          }
        }
        
        // הטקסט המודגש
        segments.unshift({ 
          text: convertNumbersToHebrewLetters(originalText), 
          highlighted: true,
          ref 
        });
        
        lastEnd = start;
      }
      
      // טקסט לפני ההדגשה הראשונה
      if (lastEnd > 0) {
        segments.unshift({ text: content.substring(0, lastEnd), highlighted: false });
      }
    }

    return segments;
  }, [document?.content, references]);

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl h-[85vh] p-0 gap-0" dir="rtl">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <Book className="w-5 h-5" />
              {document.name}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
            <span>
              נמצאו {references.length} מראי מקומות
            </span>
            <span>•</span>
            <span>
              {new Date(document.created_at).toLocaleDateString('he-IL')}
            </span>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 h-full">
          <div className="p-6">
            {/* רשימת מראי מקומות שזוהו */}
            {references.length > 0 && (
              <div className="mb-6 p-4 bg-accent/30 rounded-xl border border-accent">
                <h4 className="font-semibold text-foreground mb-3">מראי מקומות שזוהו:</h4>
                <div className="flex flex-wrap gap-2">
                  {references.map((ref, idx) => (
                    <span
                      key={ref.id || idx}
                      className="px-3 py-1 bg-warning text-warning-foreground font-bold rounded-full text-sm"
                    >
                      {formatReferenceHebrew(ref)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* תוכן המסמך עם הדגשות */}
            <div className="prose prose-lg max-w-none text-right leading-relaxed">
              {highlightedContent?.map((segment, idx) => (
                segment.highlighted ? (
                  <mark
                    key={idx}
                    className="bg-warning text-warning-foreground font-bold px-1 rounded"
                    title={segment.ref ? formatReferenceHebrew(segment.ref) : undefined}
                  >
                    {segment.text}
                  </mark>
                ) : (
                  <span key={idx} className="whitespace-pre-wrap">{segment.text}</span>
                )
              ))}
              
              {!document.content && (
                <p className="text-muted-foreground text-center py-8">
                  אין תוכן טקסט זמין למסמך זה
                </p>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}