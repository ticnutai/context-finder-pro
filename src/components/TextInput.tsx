import { FileText, Upload } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useRef } from 'react';

interface TextInputProps {
  text: string;
  onTextChange: (text: string) => void;
}

export function TextInput({ text, onTextChange }: TextInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      const textContent = doc.body?.textContent || content;
      onTextChange(textContent);
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-border shadow-md overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="bg-secondary/50 px-6 py-4 border-b border-border flex items-center justify-between flex-row-reverse">
        <div className="flex items-center gap-3 flex-row-reverse text-right">
          <div className="w-10 h-10 bg-navy rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-foreground">טקסט לניתוח</h2>
            <p className="text-sm text-muted-foreground">הדבק או העלה את הטקסט שלך</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.html,.htm"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="gap-2 rounded-xl border-2 border-navy/20 hover:bg-navy/5 flex-row-reverse"
          >
            <Upload className="w-4 h-4" />
            העלה קובץ
          </Button>
        </div>
      </div>

      {/* Text area */}
      <div className="p-6">
        <Textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="הדבק כאן את הטקסט לניתוח, או העלה קובץ טקסט/HTML..."
          className="min-h-[180px] resize-y bg-secondary/30 border-2 border-border focus:border-navy text-foreground leading-relaxed text-base rounded-xl text-right"
          dir="rtl"
        />

        <div className="flex items-center justify-between mt-4 px-1 flex-row-reverse">
          <p className="text-sm text-muted-foreground">
            {text.length > 0 ? `${text.length.toLocaleString()} תווים` : 'הזן טקסט להתחלה'}
          </p>
          {text.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onTextChange('')}
              className="text-muted-foreground hover:text-destructive"
            >
              נקה טקסט
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
