import { Download, FileText, FileSpreadsheet, FileJson, FileType, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { SearchResult, SearchCondition } from '@/types/search';
import { jsPDF } from 'jspdf';

interface ExportResultsProps {
  results: SearchResult[];
  text: string;
  conditions: SearchCondition[];
}

export function ExportResults({ results, text, conditions }: ExportResultsProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const getConditionText = (c: SearchCondition) => {
    if (c.operator === 'LIST') {
      return `רשימה (${c.listWords?.length || 0} מילים)`;
    }
    return c.term || '—';
  };

  const getOperatorLabel = (op: string) => {
    const labels: Record<string, string> = {
      AND: 'וגם',
      OR: 'או',
      NOT: 'ללא',
      NEAR: 'בקרבת',
      LIST: 'רשימה',
      PATTERN: 'דפוס',
    };
    return labels[op] || op;
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Add RTL support for Hebrew
      doc.setR2L(true);

      // Title
      doc.setFontSize(20);
      doc.setTextColor(30, 58, 138); // Navy
      doc.text('תוצאות חיפוש', 105, 20, { align: 'center' });

      // Date and count
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`תאריך: ${new Date().toLocaleDateString('he-IL')}`, 190, 30, { align: 'right' });
      doc.text(`סה"כ תוצאות: ${results.length}`, 190, 36, { align: 'right' });

      // Search conditions
      doc.setFontSize(14);
      doc.setTextColor(30, 58, 138);
      doc.text('תנאי חיפוש:', 190, 48, { align: 'right' });

      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      let yPos = 54;
      conditions.forEach((c, i) => {
        const prefix = i > 0 ? `${getOperatorLabel(c.operator)}: ` : '';
        doc.text(`${i + 1}. ${prefix}${getConditionText(c)}`, 190, yPos, { align: 'right' });
        yPos += 6;
      });

      // Separator
      yPos += 4;
      doc.setDrawColor(212, 175, 55); // Gold
      doc.line(20, yPos, 190, yPos);
      yPos += 10;

      // Results
      doc.setFontSize(14);
      doc.setTextColor(30, 58, 138);
      doc.text('תוצאות:', 190, yPos, { align: 'right' });
      yPos += 8;

      doc.setFontSize(9);
      doc.setTextColor(40, 40, 40);

      for (let i = 0; i < Math.min(results.length, 50); i++) {
        const result = results[i];
        
        // Check if we need a new page
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        // Result header
        doc.setFillColor(245, 245, 245);
        doc.rect(20, yPos - 4, 170, 8, 'F');
        doc.setFontSize(10);
        doc.setTextColor(212, 175, 55);
        doc.text(`תוצאה #${i + 1}`, 190, yPos, { align: 'right' });
        
        if (result.matchedTerms[0]) {
          doc.text(`נמצא: "${result.matchedTerms[0]}"`, 120, yPos, { align: 'right' });
        }
        yPos += 8;

        // Result text (truncated)
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        const resultText = result.text.substring(0, 200) + (result.text.length > 200 ? '...' : '');
        const lines = doc.splitTextToSize(resultText, 170);
        lines.forEach((line: string) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(line, 190, yPos, { align: 'right' });
          yPos += 5;
        });
        yPos += 6;
      }

      if (results.length > 50) {
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`... ועוד ${results.length - 50} תוצאות נוספות`, 105, yPos, { align: 'center' });
      }

      doc.save(`חיפוש-${new Date().getTime()}.pdf`);
      
      toast({
        title: 'ייצוא PDF הצליח',
        description: 'הקובץ הורד למחשב',
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: 'שגיאה בייצוא',
        description: 'לא ניתן ליצור קובץ PDF',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  const exportToJSON = () => {
    const data = {
      exportDate: new Date().toISOString(),
      searchConditions: conditions.map(c => ({
        operator: c.operator,
        term: c.term,
        listWords: c.listWords,
        proximityRange: c.proximityRange,
      })),
      totalResults: results.length,
      results: results.map(r => ({
        startIndex: r.startIndex,
        endIndex: r.endIndex,
        text: r.text,
        matchedTerms: r.matchedTerms,
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `חיפוש-${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'ייצוא JSON הצליח',
      description: 'הקובץ הורד למחשב',
    });
    setIsOpen(false);
  };

  const exportToCSV = () => {
    const headers = ['מספר', 'טקסט מתאים', 'מילות מפתח', 'מיקום התחלה'];
    const rows = results.map((r, i) => [
      (i + 1).toString(),
      `"${r.text.replace(/"/g, '""').substring(0, 300)}"`,
      `"${r.matchedTerms.join(', ')}"`,
      r.startIndex.toString(),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    // Add BOM for Hebrew support in Excel
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `חיפוש-${new Date().getTime()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'ייצוא Excel הצליח',
      description: 'הקובץ הורד למחשב - פתח ב-Excel',
    });
    setIsOpen(false);
  };

  const exportToText = () => {
    const content = [
      '═'.repeat(60),
      '              תוצאות חיפוש',
      '═'.repeat(60),
      '',
      `תאריך: ${new Date().toLocaleDateString('he-IL')}`,
      `סה"כ תוצאות: ${results.length}`,
      '',
      'תנאי חיפוש:',
      ...conditions.map((c, i) => `  ${i + 1}. ${i > 0 ? getOperatorLabel(c.operator) + ': ' : ''}${getConditionText(c)}`),
      '',
      '═'.repeat(60),
      '',
      ...results.flatMap((r, i) => [
        `━━━ תוצאה #${i + 1} ━━━`,
        `מילות מפתח: ${r.matchedTerms.join(', ')}`,
        '',
        r.text,
        '',
      ]),
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `חיפוש-${new Date().getTime()}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'ייצוא טקסט הצליח',
      description: 'הקובץ הורד למחשב',
    });
    setIsOpen(false);
  };

  const exportToHTML = () => {
    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>תוצאות חיפוש</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', 'David', Tahoma, Geneva, Verdana, sans-serif;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      background: #fafafa;
      direction: rtl;
      line-height: 1.6;
    }
    .header {
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      color: white;
      padding: 30px;
      border-radius: 16px;
      margin-bottom: 30px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }
    .header h1 { margin: 0 0 10px 0; font-size: 28px; }
    .header p { margin: 5px 0; opacity: 0.9; }
    .conditions {
      background: white;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 20px;
      border: 2px solid #D4AF37;
    }
    .conditions h3 { color: #1e3a8a; margin-top: 0; }
    .conditions ul { margin: 0; padding-right: 20px; }
    .result {
      background: white;
      padding: 20px;
      margin-bottom: 16px;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      transition: all 0.2s;
    }
    .result:hover {
      border-color: #D4AF37;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #f0f0f0;
    }
    .result-number {
      color: #D4AF37;
      font-weight: bold;
      font-size: 14px;
    }
    .keywords {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .keyword {
      background: #fef3c7;
      color: #92400e;
      padding: 2px 10px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
    }
    .result-text {
      color: #374151;
      font-size: 15px;
    }
    mark {
      background: #fef08a;
      padding: 1px 4px;
      border-radius: 3px;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #9ca3af;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📋 תוצאות חיפוש</h1>
    <p>תאריך: ${new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    <p>סה"כ תוצאות: ${results.length}</p>
  </div>
  
  <div class="conditions">
    <h3>🔍 תנאי החיפוש</h3>
    <ul>
      ${conditions.map((c, i) => `<li>${i > 0 ? `<strong>${getOperatorLabel(c.operator)}</strong>: ` : ''}${getConditionText(c)}</li>`).join('')}
    </ul>
  </div>

  ${results.map((r, i) => `
    <div class="result">
      <div class="result-header">
        <div class="keywords">
          ${r.matchedTerms.map(t => `<span class="keyword">${t}</span>`).join('')}
        </div>
        <span class="result-number">תוצאה #${i + 1}</span>
      </div>
      <div class="result-text">${r.text.replace(new RegExp(`(${r.matchedTerms.join('|')})`, 'gi'), '<mark>$1</mark>')}</div>
    </div>
  `).join('')}
  
  <div class="footer">
    נוצר באמצעות מערכת החיפוש המתקדם
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `חיפוש-${new Date().getTime()}.html`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'ייצוא HTML הצליח',
      description: 'הקובץ הורד למחשב - פתח בדפדפן',
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 rounded-xl border-gold hover:bg-gold/5 flex-row-reverse text-navy"
          disabled={results.length === 0}
          aria-label="ייצא תוצאות"
        >
          <Download className="w-4 h-4" />
          ייצא תוצאות
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right text-navy">ייצוא {results.length} תוצאות</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <Button
            onClick={exportToPDF}
            disabled={isExporting}
            className="w-full justify-between bg-white hover:bg-gold/5 text-navy border border-gold"
          >
            <span className="flex items-center gap-2">
              {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
              PDF - מסמך מעוצב
            </span>
            <span className="text-xs text-muted-foreground">הכי מקצועי</span>
          </Button>

          <Button
            onClick={exportToHTML}
            className="w-full justify-between bg-white hover:bg-gold/5 text-navy border border-gold"
          >
            <span className="flex items-center gap-2">
              <FileType className="w-5 h-5" />
              HTML - עמוד אינטרנט
            </span>
            <span className="text-xs text-muted-foreground">עם הדגשות</span>
          </Button>

          <Button
            onClick={exportToCSV}
            className="w-full justify-between bg-white hover:bg-gold/5 text-navy border border-gold"
          >
            <span className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              CSV - אקסל
            </span>
            <span className="text-xs text-muted-foreground">לניתוח נתונים</span>
          </Button>

          <Button
            onClick={exportToText}
            className="w-full justify-between bg-white hover:bg-gold/5 text-navy border border-gold"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              TXT - קובץ טקסט
            </span>
            <span className="text-xs text-muted-foreground">פשוט וקל</span>
          </Button>

          <Button
            onClick={exportToJSON}
            className="w-full justify-between bg-white hover:bg-gold/5 text-navy border border-gold"
          >
            <span className="flex items-center gap-2">
              <FileJson className="w-5 h-5" />
              JSON - מבנה נתונים
            </span>
            <span className="text-xs text-muted-foreground">לתכנות</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
