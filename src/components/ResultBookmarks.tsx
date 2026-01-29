import { Star, Trash2, MessageSquare, Download, Upload, Search, Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useEffect, useRef } from 'react';
import { useBookmarks, Bookmark } from '@/hooks/useBookmarks';
import { useToast } from '@/hooks/use-toast';

interface BookmarkedResult {
  id: string;
  result: any;
  note?: string;
  color?: string;
  timestamp: number;
}

interface ResultBookmarksProps {
  results: any[];
  bookmarkedIds: Set<string>;
  onToggleBookmark: (resultId: string) => void;
  onAddNote: (resultId: string, note: string) => void;
  onSetColor: (resultId: string, color: string) => void;
}

const COLORS = [
  { name: 'צהוב', value: '#fef08a', text: '#713f12' },
  { name: 'ירוק', value: '#bbf7d0', text: '#14532d' },
  { name: 'כחול', value: '#bfdbfe', text: '#1e3a8a' },
  { name: 'ורוד', value: '#fbcfe8', text: '#831843' },
  { name: 'סגול', value: '#e9d5ff', text: '#581c87' },
  { name: 'כתום', value: '#fed7aa', text: '#7c2d12' },
];

export function ResultBookmarks({
  results,
  bookmarkedIds,
  onToggleBookmark,
  onAddNote,
  onSetColor,
}: ResultBookmarksProps) {
  const { toast } = useToast();
  const {
    bookmarks,
    addBookmark,
    removeBookmark,
    updateBookmark,
    exportBookmarks,
    importBookmarks,
    filterBookmarks,
    clearAllBookmarks,
  } = useBookmarks();

  const [noteDialog, setNoteDialog] = useState<{ open: boolean; resultId: string; currentNote: string }>({
    open: false,
    resultId: '',
    currentNote: '',
  });

  const [bookmarksSheetOpen, setBookmarksSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveNote = () => {
    onAddNote(noteDialog.resultId, noteDialog.currentNote);
    setNoteDialog({ open: false, resultId: '', currentNote: '' });
  };

  const filteredBookmarks = filterBookmarks(searchQuery);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const count = await importBookmarks(file);
      toast({ title: `יובאו ${count} סימניות חדשות` });
    } catch {
      toast({ title: 'שגיאה בייבוא', variant: 'destructive' });
    }
  };

  return (
    <>
      {/* Bookmarks Manager Sheet */}
      <Sheet open={bookmarksSheetOpen} onOpenChange={setBookmarksSheetOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-gold text-navy dark:text-foreground"
          >
            <Star className="w-4 h-4" />
            סימניות ({bookmarks.length})
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:w-[400px] p-0">
          <SheetHeader className="p-4 border-b border-gold/30">
            <SheetTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-gold" />
              סימניות שמורות
            </SheetTitle>
            
            {/* Search */}
            <div className="relative mt-3">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="חפש בסימניות..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9"
              />
            </div>
            
            {/* Actions */}
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={exportBookmarks}
                className="flex-1 gap-1"
              >
                <Download className="w-3 h-3" />
                ייצא
              </Button>
              <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                onChange={handleImport}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 gap-1"
              >
                <Upload className="w-3 h-3" />
                ייבא
              </Button>
              {bookmarks.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllBookmarks}
                  className="text-destructive gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-200px)]">
            {filteredBookmarks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Star className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>אין סימניות שמורות</p>
              </div>
            ) : (
              <div className="space-y-3 p-4">
                {filteredBookmarks.map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="p-3 rounded-xl border"
                    style={{ backgroundColor: bookmark.color || 'white' }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="text-xs">
                        {new Date(bookmark.createdAt).toLocaleDateString('he-IL')}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeBookmark(bookmark.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-sm line-clamp-3 mb-2">{bookmark.text}</p>
                    {bookmark.note && (
                      <p className="text-xs text-muted-foreground bg-white/50 p-2 rounded">
                        {bookmark.note}
                      </p>
                    )}
                    {bookmark.tags.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {bookmark.tags.map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Results with bookmark controls */}
      {results.map((result, index) => {
        const resultId = `result-${index}`;
        const isBookmarked = bookmarkedIds.has(resultId);

        return (
          <div key={resultId} className="relative group">
            {/* Bookmark controls */}
            <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onToggleBookmark(resultId)}
                className={`touch-target ${
                  isBookmarked
                    ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30'
                    : 'text-muted-foreground hover:text-yellow-600'
                }`}
              >
                <Star className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </Button>
              {isBookmarked && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setNoteDialog({
                        open: true,
                        resultId,
                        currentNote: result.note || '',
                      })
                    }
                    className="text-blue-600 hover:text-blue-700 touch-target"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                  <div className="flex gap-0.5">
                    {COLORS.map(color => (
                      <button
                        key={color.value}
                        onClick={() => onSetColor(resultId, color.value)}
                        className="w-5 h-5 rounded-full border-2 border-white hover:scale-110 transition-transform touch-target"
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Result display */}
            <div
              className="p-4 sm:p-6 rounded-xl border shadow-sm hover:shadow-md transition-all"
              style={{
                backgroundColor: result.highlightColor || 'var(--card)',
                borderColor: isBookmarked ? '#D4AF37' : 'hsl(var(--gold))',
              }}
            >
              <div className="text-right">
                <div className="flex items-center gap-2 mb-3 flex-row-reverse flex-wrap">
                  {isBookmarked && (
                    <Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300">
                      <Star className="w-3 h-3 fill-current mr-1" />
                      מסומן
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-navy dark:text-foreground">
                    מיקום: {result.position}
                  </Badge>
                  <Badge variant="outline" className="text-navy dark:text-foreground">
                    תוצאה #{index + 1}
                  </Badge>
                </div>

                <p className="text-base sm:text-lg leading-relaxed mb-3 text-foreground">{result.context}</p>

                {result.note && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                    <div className="flex items-start gap-2 text-right">
                      <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-900 dark:text-blue-200">{result.note}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Note Dialog */}
      <Dialog open={noteDialog.open} onOpenChange={(open) => setNoteDialog({ ...noteDialog, open })}>
        <DialogContent dir="rtl" className="bg-white dark:bg-card">
          <DialogHeader>
            <DialogTitle className="text-right text-navy dark:text-foreground">הוסף הערה לתוצאה</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={noteDialog.currentNote}
              onChange={(e) => setNoteDialog({ ...noteDialog, currentNote: e.target.value })}
              placeholder="כתוב כאן הערות, תובנות או קישורים..."
              className="min-h-[150px] text-right"
              dir="rtl"
            />
            <div className="flex gap-2 justify-start">
              <Button onClick={handleSaveNote} className="bg-gold hover:bg-gold/90 text-navy">
                שמור הערה
              </Button>
              <Button
                variant="outline"
                onClick={() => setNoteDialog({ open: false, resultId: '', currentNote: '' })}
              >
                ביטול
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
