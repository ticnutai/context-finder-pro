import { useState, useRef } from 'react';
import { Download, Upload, Link2, Copy, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface SettingsData {
  savedSearches?: any[];
  searchHistory?: any[];
  bookmarks?: any[];
  smartOptions?: any;
  wordLists?: any[];
  filterRules?: any;
  exportedAt: string;
  version: string;
}

const EXPORT_VERSION = '1.0';

export function SettingsExportImport() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [exportOptions, setExportOptions] = useState({
    savedSearches: true,
    searchHistory: true,
    bookmarks: true,
    smartOptions: true,
    wordLists: true,
    filterRules: true,
  });

  const gatherData = (): SettingsData => {
    const data: SettingsData = {
      exportedAt: new Date().toISOString(),
      version: EXPORT_VERSION,
    };

    if (exportOptions.savedSearches) {
      const saved = localStorage.getItem('saved-searches');
      if (saved) data.savedSearches = JSON.parse(saved);
    }

    if (exportOptions.searchHistory) {
      const history = localStorage.getItem('searchHistory');
      if (history) data.searchHistory = JSON.parse(history);
    }

    if (exportOptions.bookmarks) {
      const bookmarks = localStorage.getItem('search-bookmarks');
      if (bookmarks) data.bookmarks = JSON.parse(bookmarks);
    }

    if (exportOptions.smartOptions) {
      const smart = localStorage.getItem('smartOptions');
      if (smart) data.smartOptions = JSON.parse(smart);
    }

    if (exportOptions.wordLists) {
      const lists = localStorage.getItem('wordLists');
      if (lists) data.wordLists = JSON.parse(lists);
    }

    if (exportOptions.filterRules) {
      const rules = localStorage.getItem('filterRules');
      if (rules) data.filterRules = JSON.parse(rules);
    }

    return data;
  };

  const handleExportJSON = () => {
    const data = gatherData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `search-settings-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'ייצוא הושלם',
      description: 'ההגדרות נשמרו לקובץ JSON',
    });
  };

  const handleGenerateShareUrl = () => {
    const data = gatherData();
    const encoded = btoa(encodeURIComponent(JSON.stringify(data)));
    const url = `${window.location.origin}${window.location.pathname}?settings=${encoded}`;
    setShareUrl(url);
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: 'הקישור הועתק!' });
    } catch {
      toast({ title: 'שגיאה בהעתקה', variant: 'destructive' });
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as SettingsData;
        applyImportedData(data);
      } catch {
        toast({ title: 'שגיאה בקריאת הקובץ', variant: 'destructive' });
      }
    };
    reader.readAsText(file);
  };

  const handleImportUrl = () => {
    try {
      const urlParams = new URL(importUrl).searchParams;
      const encoded = urlParams.get('settings');
      if (!encoded) throw new Error('No settings in URL');
      
      const data = JSON.parse(decodeURIComponent(atob(encoded))) as SettingsData;
      applyImportedData(data);
    } catch {
      toast({ title: 'קישור לא תקין', variant: 'destructive' });
    }
  };

  const applyImportedData = (data: SettingsData) => {
    let count = 0;

    if (data.savedSearches) {
      localStorage.setItem('saved-searches', JSON.stringify(data.savedSearches));
      count++;
    }
    if (data.searchHistory) {
      localStorage.setItem('searchHistory', JSON.stringify(data.searchHistory));
      count++;
    }
    if (data.bookmarks) {
      localStorage.setItem('search-bookmarks', JSON.stringify(data.bookmarks));
      count++;
    }
    if (data.smartOptions) {
      localStorage.setItem('smartOptions', JSON.stringify(data.smartOptions));
      count++;
    }
    if (data.wordLists) {
      localStorage.setItem('wordLists', JSON.stringify(data.wordLists));
      count++;
    }
    if (data.filterRules) {
      localStorage.setItem('filterRules', JSON.stringify(data.filterRules));
      count++;
    }

    toast({
      title: 'ייבוא הושלם',
      description: `${count} קטגוריות הוגדרו מחדש. רענן את הדף לטעינה מלאה.`,
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-gold text-navy hover:bg-gold/10">
          <Download className="w-4 h-4" />
          ייבוא/ייצוא
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg bg-white dark:bg-card border-gold" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-navy dark:text-foreground text-right">
            ייבוא וייצוא הגדרות
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="export" className="mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-secondary/30">
            <TabsTrigger value="export" className="gap-2">
              <Download className="w-4 h-4" />
              ייצוא
            </TabsTrigger>
            <TabsTrigger value="import" className="gap-2">
              <Upload className="w-4 h-4" />
              ייבוא
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4 mt-4">
            {/* Export options */}
            <div className="space-y-3 p-4 bg-secondary/30 rounded-xl">
              <h4 className="font-bold text-navy dark:text-foreground mb-3">בחר מה לייצא:</h4>
              {Object.entries(exportOptions).map(([key, value]) => (
                <div key={key} className="flex items-center gap-3">
                  <Checkbox
                    id={key}
                    checked={value}
                    onCheckedChange={(checked) => 
                      setExportOptions(prev => ({ ...prev, [key]: !!checked }))
                    }
                  />
                  <Label htmlFor={key} className="text-sm cursor-pointer">
                    {key === 'savedSearches' && 'חיפושים שמורים'}
                    {key === 'searchHistory' && 'היסטוריית חיפושים'}
                    {key === 'bookmarks' && 'סימניות'}
                    {key === 'smartOptions' && 'הגדרות חיפוש חכם'}
                    {key === 'wordLists' && 'רשימות מילים'}
                    {key === 'filterRules' && 'כללי סינון'}
                  </Label>
                </div>
              ))}
            </div>

            {/* Export buttons */}
            <div className="space-y-3">
              <Button 
                onClick={handleExportJSON} 
                className="w-full bg-gold hover:bg-gold-dark text-navy gap-2"
              >
                <Download className="w-4 h-4" />
                הורד קובץ JSON
              </Button>

              <Button 
                onClick={handleGenerateShareUrl} 
                variant="outline"
                className="w-full gap-2 border-gold"
              >
                <Link2 className="w-4 h-4" />
                צור קישור שיתוף
              </Button>

              {shareUrl && (
                <div className="flex gap-2 p-3 bg-gold/10 rounded-xl">
                  <Input 
                    value={shareUrl} 
                    readOnly 
                    className="text-xs font-mono bg-white"
                  />
                  <Button size="icon" onClick={handleCopyUrl} variant="outline">
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-4 mt-4">
            {/* File import */}
            <div className="space-y-3">
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                ref={fileInputRef}
                className="hidden"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-gold hover:bg-gold-dark text-navy gap-2"
              >
                <Upload className="w-4 h-4" />
                ייבוא מקובץ JSON
              </Button>
            </div>

            {/* URL import */}
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground text-center">או</div>
              <div className="flex gap-2">
                <Input 
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  placeholder="הדבק קישור שיתוף..."
                  className="flex-1"
                />
                <Button 
                  onClick={handleImportUrl}
                  variant="outline"
                  disabled={!importUrl}
                >
                  ייבא
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-sm">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <span className="text-amber-700 dark:text-amber-400">
                ייבוא יחליף את ההגדרות הקיימות. מומלץ לגבות לפני.
              </span>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
