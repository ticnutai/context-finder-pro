import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { IndexViewer } from '@/components/IndexViewer';
import { DocumentUploader } from '@/components/DocumentUploader';
import { FolderManager } from '@/components/FolderManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Book, Upload, FolderOpen } from 'lucide-react';
import { fetchTractates, Tractate } from '@/services/indexService';

const IndexPage = () => {
  const [tractates, setTractates] = useState<Tractate[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  useEffect(() => {
    loadTractates();
  }, []);

  const loadTractates = async () => {
    try {
      const data = await fetchTractates();
      setTractates(data);
    } catch (error) {
      console.error('Error loading tractates:', error);
    }
  };

  const handleDocumentProcessed = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      
      <main className="container mx-auto px-6 py-10">
        <div className="max-w-4xl mr-auto ml-0 lg:mr-[10%] space-y-8">
          {/* Hero section */}
          <div className="text-right py-8 animate-fade-in">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-gold to-gold-light rounded-2xl flex items-center justify-center shadow-lg">
                <Book className="w-7 h-7 text-navy" />
              </div>
              <div>
                <h2 className="text-4xl font-extrabold text-navy">
                  אינדקס מראי מקומות
                </h2>
                <p className="text-lg text-muted-foreground">
                  העלה מסמכים וצור אינדקס אוטומטי של מראי מקומות בש"ס
                </p>
              </div>
            </div>
            <div className="h-1 w-32 bg-gradient-to-l from-gold to-transparent rounded-full" />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="index" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-16 rounded-2xl bg-secondary/80 p-1.5 shadow-inner">
              <TabsTrigger 
                value="index" 
                className="text-base gap-3 rounded-xl font-semibold data-[state=active]:bg-gradient-to-l data-[state=active]:from-navy data-[state=active]:to-navy-light data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
              >
                <Book className="w-5 h-5" />
                האינדקס
              </TabsTrigger>
              <TabsTrigger 
                value="folders" 
                className="text-base gap-3 rounded-xl font-semibold data-[state=active]:bg-gradient-to-l data-[state=active]:from-navy data-[state=active]:to-navy-light data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
              >
                <FolderOpen className="w-5 h-5" />
                תיקיות
              </TabsTrigger>
              <TabsTrigger 
                value="upload" 
                className="text-base gap-3 rounded-xl font-semibold data-[state=active]:bg-gradient-to-l data-[state=active]:from-navy data-[state=active]:to-navy-light data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
              >
                <Upload className="w-5 h-5" />
                העלאת מסמך
              </TabsTrigger>
            </TabsList>

            <TabsContent value="index" className="mt-8">
              <div className="bg-card rounded-2xl border-2 border-border/50 p-8 shadow-xl text-right">
                <IndexViewer refreshTrigger={refreshTrigger} selectedFolderId={selectedFolderId} />
              </div>
            </TabsContent>

            <TabsContent value="folders" className="mt-8">
              <div className="bg-card rounded-2xl border-2 border-border/50 p-8 shadow-xl text-right">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-foreground flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-gold to-gold-light rounded-xl flex items-center justify-center shadow-md">
                      <FolderOpen className="w-5 h-5 text-navy" />
                    </div>
                    ניהול תיקיות
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    צור תיקיות לסיווג ואירגון המסמכים שלך. לחץ על תיקייה כדי לסנן את האינדקס.
                  </p>
                </div>
                <FolderManager 
                  onFolderSelect={(folderId) => setSelectedFolderId(folderId)}
                  selectedFolderId={selectedFolderId}
                  showAddButton={true}
                />
              </div>
            </TabsContent>

            <TabsContent value="upload" className="mt-8">
              <div className="bg-card rounded-2xl border-2 border-border/50 p-8 shadow-xl text-right">
                <DocumentUploader 
                  tractates={tractates} 
                  onDocumentProcessed={handleDocumentProcessed}
                  defaultFolderId={selectedFolderId}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-navy border-t-4 border-gold mt-16 py-8">
        <div className="container mx-auto px-6 text-right">
          <p className="text-white font-medium">אינדקס מראי מקומות - ניתוח פסקי דין</p>
          <p className="text-gold-light text-sm mt-1">זיהוי אוטומטי של מראי מקומות בש"ס 📚</p>
        </div>
      </footer>
    </div>
  );
};

export default IndexPage;
