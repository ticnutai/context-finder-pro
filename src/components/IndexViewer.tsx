import { useState, useEffect } from 'react';
import { Book, FileText, Trash2, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  fetchAllReferencesGrouped, 
  fetchDocuments, 
  fetchReferencesByDocument,
  deleteDocument,
  SourceReference, 
  Document 
} from '@/services/indexService';
import { useToast } from '@/hooks/use-toast';
import { DocumentViewer } from './DocumentViewer';
import { numberToHebrew } from '@/utils/hebrewUtils';

interface IndexViewerProps {
  refreshTrigger: number;
}

// פורמט דף ועמוד באותיות עבריות
function formatDafAmud(daf: number, amud: string): string {
  const dafHebrew = numberToHebrew(daf);
  const amudHebrew = amud === 'א' || amud === 'ע"א' ? 'א' : 'ב';
  return `דף ${dafHebrew} עמוד ${amudHebrew}`;
}

export function IndexViewer({ refreshTrigger }: IndexViewerProps) {
  const { toast } = useToast();
  const [view, setView] = useState<'tractates' | 'documents'>('tractates');
  const [groupedRefs, setGroupedRefs] = useState<Map<string, SourceReference[]>>(new Map());
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Document viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [selectedDocRefs, setSelectedDocRefs] = useState<SourceReference[]>([]);

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [refs, docs] = await Promise.all([
        fetchAllReferencesGrouped(),
        fetchDocuments(),
      ]);
      setGroupedRefs(refs);
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = async (doc: Document) => {
    try {
      const refs = await fetchReferencesByDocument(doc.id);
      setSelectedDocument(doc);
      setSelectedDocRefs(refs);
      setViewerOpen(true);
    } catch (error) {
      toast({
        title: 'שגיאה בטעינת המסמך',
        description: 'אנא נסה שנית',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      await deleteDocument(id);
      toast({
        title: 'המסמך נמחק',
        description: 'המסמך וכל מראי המקומות שלו נמחקו',
      });
      loadData();
    } catch (error) {
      toast({
        title: 'שגיאה במחיקה',
        description: 'אנא נסה שנית',
        variant: 'destructive',
      });
    }
  };

  const totalRefs = Array.from(groupedRefs.values()).reduce((sum, refs) => sum + refs.length, 0);

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        טוען נתונים...
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Book className="w-5 h-5" />
          אינדקס מראי מקומות
        </h3>
        <div className="flex gap-2">
          <Button
            variant={view === 'tractates' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('tractates')}
            className="rounded-xl"
          >
            לפי מסכת
          </Button>
          <Button
            variant={view === 'documents' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('documents')}
            className="rounded-xl"
          >
            לפי מסמך
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-secondary/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-foreground">{documents.length}</div>
          <div className="text-sm text-muted-foreground">מסמכים</div>
        </div>
        <div className="bg-accent/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-foreground">{groupedRefs.size}</div>
          <div className="text-sm text-muted-foreground">מסכתות</div>
        </div>
        <div className="bg-primary/10 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-foreground">{totalRefs}</div>
          <div className="text-sm text-muted-foreground">מראי מקומות</div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="h-[400px] pr-4">
        {view === 'tractates' ? (
          <Accordion type="multiple" className="space-y-2">
            {Array.from(groupedRefs.entries())
              .sort((a, b) => a[0].localeCompare(b[0], 'he'))
              .map(([tractate, refs]) => (
                <AccordionItem
                  key={tractate}
                  value={tractate}
                  className="bg-card rounded-xl border-2 border-border/50 overflow-hidden"
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-secondary/30">
                    <div className="flex items-center gap-3">
                      <Book className="w-4 h-4 text-accent" />
                      <span className="font-semibold text-foreground">{tractate}</span>
                      <Badge variant="secondary" className="rounded-full">
                        {refs.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-2">
                      {refs.map((ref) => (
                        <div
                          key={ref.id}
                          className="bg-secondary/30 rounded-lg p-3 text-sm"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-foreground">
                              {formatDafAmud(ref.daf_number, ref.amud)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => ref.document && handleViewDocument(ref.document)}
                              className="h-7 text-xs gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              {ref.document?.name}
                            </Button>
                          </div>
                          {ref.context && (
                            <p className="text-muted-foreground text-xs line-clamp-2">
                              ...{ref.context}...
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
          </Accordion>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-card rounded-xl border-2 border-border/50 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-foreground">{doc.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewDocument(doc)}
                      className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(doc.created_at).toLocaleDateString('he-IL')}
                </div>
              </div>
            ))}
            {documents.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                אין מסמכים עדיין. העלה מסמך כדי להתחיל.
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Document Viewer Dialog */}
      <DocumentViewer
        document={selectedDocument}
        references={selectedDocRefs}
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </div>
  );
}
