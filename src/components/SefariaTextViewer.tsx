import { useState, useEffect } from 'react';
import { 
  fetchSefariaText, 
  getAllTractates, 
  getTractatesByCategory,
  extractHebrewText,
  getSefariaLink,
  TractateInfo,
  SefariaText
} from '@/services/sefariaService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { 
  Book, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink, 
  Loader2, 
  Copy, 
  ChevronDown,
  Search,
  FileText
} from 'lucide-react';

interface SefariaTextViewerProps {
  onTextSelect?: (text: string, reference: string) => void;
}

export const SefariaTextViewer = ({ onTextSelect }: SefariaTextViewerProps) => {
  const { toast } = useToast();
  const [selectedTractate, setSelectedTractate] = useState<TractateInfo | null>(null);
  const [selectedDaf, setSelectedDaf] = useState<number>(2);
  const [selectedAmud, setSelectedAmud] = useState<'א' | 'ב'>('א');
  const [textData, setTextData] = useState<SefariaText | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(['מועד']));
  
  const tractatesByCategory = getTractatesByCategory();
  const categories = ['זרעים', 'מועד', 'נשים', 'נזיקין', 'קדשים', 'טהרות'];

  const loadText = async () => {
    if (!selectedTractate) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchSefariaText(selectedTractate.name, selectedDaf, selectedAmud);
      setTextData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת הטקסט');
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לטעון את הטקסט מ-Sefaria',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTractate) {
      loadText();
    }
  }, [selectedTractate, selectedDaf, selectedAmud]);

  const handlePrevDaf = () => {
    if (selectedAmud === 'ב') {
      setSelectedAmud('א');
    } else if (selectedDaf > 2) {
      setSelectedDaf(d => d - 1);
      setSelectedAmud('ב');
    }
  };

  const handleNextDaf = () => {
    if (selectedAmud === 'א') {
      setSelectedAmud('ב');
    } else if (selectedTractate && selectedDaf < selectedTractate.totalDafs) {
      setSelectedDaf(d => d + 1);
      setSelectedAmud('א');
    }
  };

  const copyText = () => {
    if (textData) {
      const text = extractHebrewText(textData);
      navigator.clipboard.writeText(text);
      toast({
        title: 'הטקסט הועתק',
        description: `${textData.heRef} הועתק ללוח`,
      });
    }
  };

  const handleUseText = () => {
    if (textData && onTextSelect) {
      const text = extractHebrewText(textData);
      onTextSelect(text, textData.heRef);
      toast({
        title: 'הטקסט נטען',
        description: 'הטקסט הועבר לחיפוש',
      });
    }
  };

  const toggleCategory = (category: string) => {
    setOpenCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-4" dir="rtl">
      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browse" className="gap-2">
            <Book className="w-4 h-4" />
            עיון במסכתות
          </TabsTrigger>
          <TabsTrigger value="search" className="gap-2">
            <Search className="w-4 h-4" />
            חיפוש ב-Sefaria
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          {/* רשימת מסכתות */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Book className="w-5 h-5 text-primary" />
                בחר מסכת
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {categories.map(category => (
                    <Collapsible 
                      key={category}
                      open={openCategories.has(category)}
                      onOpenChange={() => toggleCategory(category)}
                    >
                      <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 hover:bg-muted rounded-lg transition-colors">
                        <ChevronDown className={`w-4 h-4 transition-transform ${openCategories.has(category) ? 'rotate-180' : ''}`} />
                        <span className="font-semibold">סדר {category}</span>
                        <Badge variant="secondary" className="mr-auto">
                          {tractatesByCategory[category]?.length || 0}
                        </Badge>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="flex flex-wrap gap-2 p-2 pr-6">
                          {tractatesByCategory[category]?.map(tractate => (
                            <Button
                              key={tractate.name}
                              variant={selectedTractate?.name === tractate.name ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => {
                                setSelectedTractate(tractate);
                                setSelectedDaf(2);
                                setSelectedAmud('א');
                              }}
                              className="text-sm"
                            >
                              {tractate.name}
                              <span className="text-xs opacity-70 mr-1">({tractate.totalDafs})</span>
                            </Button>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* בחירת דף */}
          {selectedTractate && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  {selectedTractate.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label>דף:</Label>
                    <Input
                      type="number"
                      min={2}
                      max={selectedTractate.totalDafs}
                      value={selectedDaf}
                      onChange={(e) => setSelectedDaf(Math.max(2, Math.min(selectedTractate.totalDafs, parseInt(e.target.value) || 2)))}
                      className="w-20"
                    />
                    <span className="text-muted-foreground text-sm">
                      מתוך {selectedTractate.totalDafs}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label>עמוד:</Label>
                    <div className="flex gap-1">
                      <Button
                        variant={selectedAmud === 'א' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedAmud('א')}
                      >
                        א
                      </Button>
                      <Button
                        variant={selectedAmud === 'ב' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedAmud('ב')}
                      >
                        ב
                      </Button>
                    </div>
                  </div>
                </div>

                {/* ניווט */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevDaf}
                    disabled={selectedDaf === 2 && selectedAmud === 'א'}
                  >
                    <ChevronRight className="w-4 h-4 ml-1" />
                    הקודם
                  </Button>
                  
                  <Badge variant="secondary" className="text-lg px-4 py-1">
                    {selectedTractate.name} {selectedDaf} {selectedAmud === 'א' ? 'ע"א' : 'ע"ב'}
                  </Badge>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextDaf}
                    disabled={selectedDaf === selectedTractate.totalDafs && selectedAmud === 'ב'}
                  >
                    הבא
                    <ChevronLeft className="w-4 h-4 mr-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* תצוגת טקסט */}
          {selectedTractate && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {textData?.heRef || 'טוען...'}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {textData && (
                      <>
                        <Button variant="ghost" size="sm" onClick={copyText}>
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(getSefariaLink(selectedTractate.name, selectedDaf, selectedAmud), '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        {onTextSelect && (
                          <Button variant="default" size="sm" onClick={handleUseText}>
                            השתמש בטקסט
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : error ? (
                  <div className="text-center py-8 text-destructive">
                    <p>{error}</p>
                    <Button variant="outline" className="mt-4" onClick={loadText}>
                      נסה שוב
                    </Button>
                  </div>
                ) : textData ? (
                  <ScrollArea className="h-[300px]">
                    <div className="prose prose-lg max-w-none leading-relaxed text-right font-serif">
                      {extractHebrewText(textData).split('\n').map((paragraph, idx) => (
                        <p key={idx} className="mb-2">{paragraph}</p>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    בחר מסכת ודף להצגה
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="search">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>חיפוש ב-Sefaria יהיה זמין בקרוב</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => window.open('https://www.sefaria.org/search', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 ml-2" />
                  חפש ב-Sefaria
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
