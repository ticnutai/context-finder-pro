import { useState, useCallback } from 'react';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { findTalmudReferences, formatReference, TalmudReference } from '@/utils/talmudParser';
import { 
  createDocument, 
  saveSourceReferences, 
  uploadDocument,
  Tractate 
} from '@/services/indexService';

interface DocumentUploaderProps {
  tractates: Tractate[];
  onDocumentProcessed: () => void;
}

export function DocumentUploader({ tractates, onDocumentProcessed }: DocumentUploaderProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [docName, setDocName] = useState('');
  const [textContent, setTextContent] = useState('');
  const [previewRefs, setPreviewRefs] = useState<TalmudReference[]>([]);
  const [file, setFile] = useState<File | null>(null);

  const handleTextChange = useCallback((text: string) => {
    setTextContent(text);
    // תצוגה מקדימה של מראי המקומות
    const refs = findTalmudReferences(text);
    setPreviewRefs(refs);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setDocName(uploadedFile.name.replace(/\.[^/.]+$/, ''));

    // קריאת תוכן הקובץ אם זה טקסט
    if (uploadedFile.type.includes('text') || uploadedFile.name.endsWith('.txt')) {
      const text = await uploadedFile.text();
      handleTextChange(text);
    } else {
      toast({
        title: 'שים לב',
        description: 'לעיבוד אוטומטי של PDF יש להעתיק את הטקסט לשדה למטה',
        variant: 'default',
      });
    }
  };

  const handleProcess = async () => {
    if (!docName.trim() || !textContent.trim()) {
      toast({
        title: 'שגיאה',
        description: 'יש להזין שם מסמך ותוכן טקסט',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      // העלאת קובץ אם קיים
      let filePath: string | undefined;
      if (file) {
        filePath = await uploadDocument(file);
      }

      // יצירת רשומת מסמך
      const doc = await createDocument(docName, textContent, filePath);

      // חיפוש וזיהוי מראי מקומות
      const refs = findTalmudReferences(textContent);

      // שמירת מראי המקומות
      await saveSourceReferences(doc.id, refs, tractates, textContent);

      toast({
        title: 'המסמך עובד בהצלחה!',
        description: `נמצאו ${refs.length} מראי מקומות`,
      });

      // איפוס הטופס
      setDocName('');
      setTextContent('');
      setPreviewRefs([]);
      setFile(null);
      onDocumentProcessed();

    } catch (error) {
      console.error('Error processing document:', error);
      toast({
        title: 'שגיאה בעיבוד המסמך',
        description: 'אנא נסה שנית',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-navy flex items-center gap-2">
          <FileText className="w-5 h-5" />
          העלאת מסמך חדש
        </h3>
      </div>

      {/* העלאת קובץ */}
      <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-gold transition-colors">
        <input
          type="file"
          onChange={handleFileUpload}
          accept=".txt,.doc,.docx,.pdf"
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {file ? (
              <span className="text-navy font-medium">{file.name}</span>
            ) : (
              'גרור קובץ לכאן או לחץ לבחירה'
            )}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            TXT, DOC, DOCX, PDF
          </p>
        </label>
        {file && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFile(null)}
            className="mt-2"
          >
            <X className="w-4 h-4 ml-1" />
            הסר קובץ
          </Button>
        )}
      </div>

      {/* שם המסמך */}
      <div>
        <label className="block text-sm font-medium text-navy mb-2">
          שם המסמך / פסק הדין
        </label>
        <Input
          value={docName}
          onChange={(e) => setDocName(e.target.value)}
          placeholder="לדוגמה: פסק דין בעניין גירושין..."
          className="rounded-xl"
        />
      </div>

      {/* תוכן הטקסט */}
      <div>
        <label className="block text-sm font-medium text-navy mb-2">
          תוכן הטקסט לניתוח
        </label>
        <Textarea
          value={textContent}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="הדבק כאן את תוכן פסק הדין..."
          className="min-h-[200px] rounded-xl font-mono text-sm"
        />
      </div>

      {/* תצוגה מקדימה של מראי מקומות */}
      {previewRefs.length > 0 && (
        <div className="bg-gold/10 rounded-xl p-4 border border-gold/30">
          <h4 className="font-semibold text-navy mb-3">
            מראי מקומות שזוהו ({previewRefs.length}):
          </h4>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {previewRefs.map((ref, idx) => (
              <Badge 
                key={idx} 
                variant="secondary"
                className="rounded-full bg-white"
              >
                {formatReference(ref)}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* כפתור עיבוד */}
      <Button
        onClick={handleProcess}
        disabled={isProcessing || !docName.trim() || !textContent.trim()}
        className="w-full h-14 text-lg rounded-xl bg-navy hover:bg-navy-light gap-2"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            מעבד את המסמך...
          </>
        ) : (
          <>
            <FileText className="w-5 h-5" />
            עבד מסמך וצור אינדקס
          </>
        )}
      </Button>
    </div>
  );
}
