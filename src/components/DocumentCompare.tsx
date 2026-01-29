import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, FileText, GitCompare, Download, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import * as Diff from 'diff';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import jsPDF from 'jspdf';

export function DocumentCompare() {
  const [file1Text, setFile1Text] = useState('');
  const [file2Text, setFile2Text] = useState('');
  const [file1Name, setFile1Name] = useState('');
  const [file2Name, setFile2Name] = useState('');
  const [diffResult, setDiffResult] = useState<any[]>([]);
  const [lineDiffResult, setLineDiffResult] = useState<any[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [diffMode, setDiffMode] = useState<'words' | 'lines'>('words');
  const [syncScroll, setSyncScroll] = useState(true);
  const file1Ref = useRef<HTMLInputElement>(null);
  const file2Ref = useRef<HTMLInputElement>(null);
  const scroll1Ref = useRef<HTMLDivElement>(null);
  const scroll2Ref = useRef<HTMLDivElement>(null);

  // Synchronized scrolling
  useEffect(() => {
    if (!syncScroll) return;

    const handleScroll1 = () => {
      if (scroll2Ref.current && scroll1Ref.current) {
        scroll2Ref.current.scrollTop = scroll1Ref.current.scrollTop;
      }
    };

    const handleScroll2 = () => {
      if (scroll1Ref.current && scroll2Ref.current) {
        scroll1Ref.current.scrollTop = scroll2Ref.current.scrollTop;
      }
    };

    const el1 = scroll1Ref.current;
    const el2 = scroll2Ref.current;

    el1?.addEventListener('scroll', handleScroll1);
    el2?.addEventListener('scroll', handleScroll2);

    return () => {
      el1?.removeEventListener('scroll', handleScroll1);
      el2?.removeEventListener('scroll', handleScroll2);
    };
  }, [syncScroll]);

  const extractText = async (file: File): Promise<string> => {
    if (file.name.endsWith('.pdf')) {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(' ') + '\n';
      }
      return text;
    }

    if (file.name.endsWith('.docx')) {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (file.name.endsWith('.html') || file.name.endsWith('.htm')) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(content, 'text/html');
          doc.querySelectorAll('script, style').forEach(el => el.remove());
          resolve(doc.body?.innerText || '');
        } else {
          resolve(content);
        }
      };
      reader.readAsText(file);
    });
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fileNum: 1 | 2
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await extractText(file);
      if (fileNum === 1) {
        setFile1Text(text);
        setFile1Name(file.name);
      } else {
        setFile2Text(text);
        setFile2Name(file.name);
      }
    } catch (error) {
      console.error('Error reading file:', error);
      alert('שגיאה בקריאת הקובץ');
    }
  };

  const compareDocuments = () => {
    if (!file1Text || !file2Text) {
      alert('נא להעלות שני קבצים');
      return;
    }

    setIsComparing(true);
    
    // Word diff
    const wordDiff = Diff.diffWords(file1Text, file2Text);
    setDiffResult(wordDiff);
    
    // Line diff
    const lineDiff = Diff.diffLines(file1Text, file2Text);
    setLineDiffResult(lineDiff);
    
    setIsComparing(false);
  };

  const exportDiffToPDF = () => {
    const doc = new jsPDF();
    doc.setR2L(true);
    
    let y = 20;
    doc.setFontSize(16);
    doc.text('השוואת מסמכים', 190, y, { align: 'right' });
    
    y += 15;
    doc.setFontSize(10);
    doc.text(`קובץ 1: ${file1Name}`, 190, y, { align: 'right' });
    y += 7;
    doc.text(`קובץ 2: ${file2Name}`, 190, y, { align: 'right' });
    
    y += 15;
    doc.setFontSize(12);
    doc.text(`סה"כ שינויים: ${stats.added} נוספו, ${stats.removed} נמחקו`, 190, y, { align: 'right' });
    
    y += 15;
    doc.setFontSize(10);
    
    const diff = diffMode === 'lines' ? lineDiffResult : diffResult;
    diff.forEach(part => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      
      const prefix = part.added ? '[+] ' : part.removed ? '[-] ' : '';
      const text = prefix + part.value.substring(0, 100);
      doc.text(text, 190, y, { align: 'right' });
      y += 5;
    });
    
    doc.save(`comparison-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const currentDiff = diffMode === 'lines' ? lineDiffResult : diffResult;
  
  const stats = {
    added: currentDiff.filter(d => d.added).length,
    removed: currentDiff.filter(d => d.removed).length,
    unchanged: currentDiff.filter(d => !d.added && !d.removed).length,
    addedChars: currentDiff.filter(d => d.added).reduce((sum, d) => sum + d.value.length, 0),
    removedChars: currentDiff.filter(d => d.removed).reduce((sum, d) => sum + d.value.length, 0),
  };

  return (
    <div className="bg-white dark:bg-card rounded-2xl border border-gold p-4 sm:p-6 shadow-md text-right space-y-6">
      <div className="flex items-center gap-3 justify-between flex-wrap">
        <div className="flex items-center gap-3">
          <GitCompare className="w-6 h-6 text-gold" />
          <h3 className="font-bold text-xl text-navy dark:text-foreground">השוואת מסמכים</h3>
        </div>
        
        {diffResult.length > 0 && (
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Switch
                id="sync-scroll"
                checked={syncScroll}
                onCheckedChange={setSyncScroll}
              />
              <Label htmlFor="sync-scroll" className="text-sm">סנכרון גלילה</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="diff-mode"
                checked={diffMode === 'lines'}
                onCheckedChange={(v) => setDiffMode(v ? 'lines' : 'words')}
              />
              <Label htmlFor="diff-mode" className="text-sm">השוואת שורות</Label>
            </div>
          </div>
        )}
      </div>

      {/* File Upload Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* File 1 */}
        <div className="bg-secondary/30 dark:bg-muted/30 rounded-xl p-4 border border-gold/30">
          <input
            ref={file1Ref}
            type="file"
            accept=".txt,.html,.htm,.docx,.pdf"
            onChange={(e) => handleFileUpload(e, 1)}
            className="hidden"
          />
          <Button
            onClick={() => file1Ref.current?.click()}
            variant="outline"
            className="w-full mb-3 border-gold text-navy dark:text-foreground touch-target"
          >
            <Upload className="w-4 h-4 ml-2" />
            העלה מסמך ראשון
          </Button>
          {file1Name && (
            <div className="flex items-center gap-2 text-sm text-navy dark:text-foreground bg-white dark:bg-card p-2 rounded-lg border border-gold/50">
              <FileText className="w-4 h-4 text-gold" />
              <span className="truncate">{file1Name}</span>
            </div>
          )}
        </div>

        {/* File 2 */}
        <div className="bg-secondary/30 dark:bg-muted/30 rounded-xl p-4 border border-gold/30">
          <input
            ref={file2Ref}
            type="file"
            accept=".txt,.html,.htm,.docx,.pdf"
            onChange={(e) => handleFileUpload(e, 2)}
            className="hidden"
          />
          <Button
            onClick={() => file2Ref.current?.click()}
            variant="outline"
            className="w-full mb-3 border-gold text-navy dark:text-foreground touch-target"
          >
            <Upload className="w-4 h-4 ml-2" />
            העלה מסמך שני
          </Button>
          {file2Name && (
            <div className="flex items-center gap-2 text-sm text-navy dark:text-foreground bg-white dark:bg-card p-2 rounded-lg border border-gold/50">
              <FileText className="w-4 h-4 text-gold" />
              <span className="truncate">{file2Name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Compare Button */}
      <Button
        onClick={compareDocuments}
        disabled={!file1Text || !file2Text || isComparing}
        className="w-full bg-gold hover:bg-gold-dark text-navy font-bold text-lg h-12 touch-target"
      >
        {isComparing ? <RefreshCw className="w-5 h-5 ml-2 animate-spin" /> : <GitCompare className="w-5 h-5 ml-2" />}
        השווה מסמכים
      </Button>

      {/* Results */}
      {diffResult.length > 0 && (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.added}</div>
              <div className="text-xs text-green-600 dark:text-green-500">קטעים נוספו</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.removed}</div>
              <div className="text-xs text-red-600 dark:text-red-500">קטעים נמחקו</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-green-700 dark:text-green-400">+{stats.addedChars}</div>
              <div className="text-xs text-green-600 dark:text-green-500">תווים נוספו</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-red-700 dark:text-red-400">-{stats.removedChars}</div>
              <div className="text-xs text-red-600 dark:text-red-500">תווים נמחקו</div>
            </div>
          </div>

          {/* Export button */}
          <Button
            onClick={exportDiffToPDF}
            variant="outline"
            className="w-full gap-2 border-gold"
          >
            <Download className="w-4 h-4" />
            ייצא השוואה ל-PDF
          </Button>

          {/* Diff Display */}
          <div className="bg-white dark:bg-card border border-gold rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-navy dark:text-foreground">הבדלים:</h4>
              <Badge variant="outline">
                {diffMode === 'lines' ? 'השוואת שורות' : 'השוואת מילים'}
              </Badge>
            </div>
            <ScrollArea className="h-[400px]">
              <div 
                className="space-y-1 text-right font-mono text-sm leading-relaxed" 
                dir="rtl"
                ref={scroll1Ref}
              >
                {currentDiff.map((part, index) => (
                  <span
                    key={index}
                    className={`${
                      part.added
                        ? 'bg-green-200 dark:bg-green-800/50 text-green-900 dark:text-green-100'
                        : part.removed
                        ? 'bg-red-200 dark:bg-red-800/50 text-red-900 dark:text-red-100 line-through'
                        : 'text-foreground'
                    } px-1 ${diffMode === 'lines' ? 'block py-1' : ''}`}
                  >
                    {part.value}
                  </span>
                ))}
              </div>
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  );
}
