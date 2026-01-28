import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Star, Trash2, Search, Plus, X, Copy, Edit2, Tag, ChevronDown, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SearchCondition, SmartSearchOptions, FilterRules } from '@/types/search';
import { useSavedSearches, SavedSearch } from '@/hooks/useSavedSearches';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface AdvancedSavedSearchesProps {
  currentConditions: SearchCondition[];
  currentSmartOptions?: SmartSearchOptions;
  currentFilterRules?: FilterRules;
  onLoadSearch: (
    conditions: SearchCondition[],
    smartOptions?: SmartSearchOptions,
    filterRules?: FilterRules
  ) => void;
}

export function AdvancedSavedSearches({
  currentConditions,
  currentSmartOptions,
  currentFilterRules,
  onLoadSearch,
}: AdvancedSavedSearchesProps) {
  const {
    savedSearches,
    saveSearch,
    updateSearch,
    deleteSearch,
    duplicateSearch,
    searchSavedSearches,
    getAllTags,
  } = useSavedSearches();

  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [searchDescription, setSearchDescription] = useState('');
  const [searchTags, setSearchTags] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);

  const allTags = getAllTags();

  const filteredSearches = useMemo(() => {
    let results = searchSavedSearches(searchQuery);
    if (selectedTag) {
      results = results.filter(s => s.tags?.includes(selectedTag));
    }
    return results;
  }, [searchQuery, selectedTag, searchSavedSearches]);

  const handleSave = () => {
    if (!searchName.trim()) {
      toast({
        title: 'שגיאה',
        description: 'נא להזין שם לחיפוש',
        variant: 'destructive',
      });
      return;
    }

    const tags = searchTags
      .split(',')
      .map(t => t.trim())
      .filter(t => t);

    if (editingId) {
      updateSearch(editingId, {
        name: searchName,
        description: searchDescription,
        conditions: currentConditions,
        smartOptions: currentSmartOptions,
        filterRules: currentFilterRules,
        tags,
      });
      toast({
        title: 'עודכן!',
        description: `החיפוש "${searchName}" עודכן בהצלחה`,
      });
    } else {
      saveSearch(searchName, currentConditions, {
        description: searchDescription,
        smartOptions: currentSmartOptions,
        filterRules: currentFilterRules,
        tags,
      });
      toast({
        title: 'נשמר!',
        description: `החיפוש "${searchName}" נשמר בהצלחה`,
      });
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const resetForm = () => {
    setSearchName('');
    setSearchDescription('');
    setSearchTags('');
    setEditingId(null);
  };

  const handleEdit = (search: SavedSearch) => {
    setEditingId(search.id);
    setSearchName(search.name);
    setSearchDescription(search.description || '');
    setSearchTags(search.tags?.join(', ') || '');
    setIsDialogOpen(true);
  };

  const handleLoad = (search: SavedSearch) => {
    onLoadSearch(search.conditions, search.smartOptions, search.filterRules);
    toast({
      title: 'נטען!',
      description: `החיפוש "${search.name}" נטען`,
    });
  };

  const handleDuplicate = (id: string) => {
    const dup = duplicateSearch(id);
    if (dup) {
      toast({
        title: 'שוכפל!',
        description: `נוצר העתק "${dup.name}"`,
      });
    }
  };

  const handleDelete = (id: string, name: string) => {
    deleteSearch(id);
    toast({
      title: 'נמחק',
      description: `החיפוש "${name}" נמחק`,
    });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="bg-white rounded-2xl border-2 border-gold/30 shadow-md overflow-hidden">
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gold/5 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center">
                <Star className="w-5 h-5 text-navy" />
              </div>
              <div className="text-right">
                <h3 className="font-bold text-lg text-navy">חיפושים שמורים</h3>
                <p className="text-sm text-muted-foreground">
                  {savedSearches.length} חיפושים שמורים
                </p>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-navy transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 pt-0 space-y-4" dir="rtl">
            {/* Actions Bar */}
            <div className="flex items-center gap-2 flex-wrap">
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="bg-gold hover:bg-gold-dark text-navy gap-2"
                    disabled={currentConditions.every(c => !c.term.trim())}
                  >
                    <Save className="w-4 h-4" />
                    שמור חיפוש נוכחי
                  </Button>
                </DialogTrigger>
                <DialogContent className="text-right" dir="rtl">
                  <DialogHeader>
                    <DialogTitle className="text-right">
                      {editingId ? 'עריכת חיפוש' : 'שמירת חיפוש'}
                    </DialogTitle>
                    <DialogDescription className="text-right">
                      {editingId 
                        ? 'עדכן את פרטי החיפוש'
                        : 'שמור את החיפוש הנוכחי לשימוש עתידי'
                      }
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-navy">שם החיפוש *</label>
                      <Input
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        placeholder="לדוגמה: חיפוש מקורות גמרא"
                        className="text-right"
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-navy">תיאור</label>
                      <Textarea
                        value={searchDescription}
                        onChange={(e) => setSearchDescription(e.target.value)}
                        placeholder="תיאור קצר של החיפוש..."
                        className="text-right resize-none"
                        dir="rtl"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-navy">תגיות (מופרדות בפסיק)</label>
                      <Input
                        value={searchTags}
                        onChange={(e) => setSearchTags(e.target.value)}
                        placeholder="למשל: גמרא, הלכה, אגדה"
                        className="text-right"
                        dir="rtl"
                      />
                    </div>
                  </div>
                  <DialogFooter className="flex-row-reverse gap-2">
                    <Button onClick={handleSave} className="bg-gold hover:bg-gold-dark text-navy">
                      {editingId ? 'עדכן' : 'שמור'}
                    </Button>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      ביטול
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="חפש בחיפושים..."
                className="flex-1 min-w-[150px] h-9 text-right"
                dir="rtl"
              />

              {allTags.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Tag className="w-3 h-3" />
                      {selectedTag || 'תגיות'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="text-right">
                    <DropdownMenuItem onClick={() => setSelectedTag(null)}>
                      כל התגיות
                    </DropdownMenuItem>
                    {allTags.map(tag => (
                      <DropdownMenuItem key={tag} onClick={() => setSelectedTag(tag)}>
                        {tag}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Saved Searches List */}
            {filteredSearches.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {savedSearches.length === 0 
                    ? 'אין חיפושים שמורים עדיין'
                    : 'לא נמצאו חיפושים תואמים'
                  }
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[250px]">
                <div className="space-y-2 pr-2">
                  {filteredSearches.map((search) => (
                    <div
                      key={search.id}
                      className="p-3 bg-secondary/30 rounded-xl border border-gold/20 hover:border-gold/50 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(search.id, search.name)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-navy"
                            onClick={() => handleDuplicate(search.id)}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-navy"
                            onClick={() => handleEdit(search)}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>

                        <div className="flex-1 text-right">
                          <div className="flex items-center gap-2 justify-end mb-1">
                            <button
                              onClick={() => handleLoad(search)}
                              className="font-bold text-navy hover:text-gold transition-colors"
                            >
                              {search.name}
                            </button>
                            <Star className="w-4 h-4 text-gold fill-gold" />
                          </div>
                          
                          {search.description && (
                            <p className="text-xs text-muted-foreground mb-1 line-clamp-1">
                              {search.description}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap gap-1 justify-end">
                            <Badge variant="secondary" className="text-xs">
                              {search.conditions.length} תנאים
                            </Badge>
                            {search.tags?.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {(search.tags?.length || 0) > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{(search.tags?.length || 0) - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
