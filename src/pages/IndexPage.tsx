import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { IndexViewer } from '@/components/IndexViewer';
import { DocumentUploader } from '@/components/DocumentUploader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Book, Upload } from 'lucide-react';
import { fetchTractates, Tractate } from '@/services/indexService';

const IndexPage = () => {
  const [tractates, setTractates] = useState<Tractate[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero section */}
          <div className="text-center py-8 animate-fade-in">
            <h2 className="text-4xl font-extrabold text-navy mb-3">
              אינדקס מראי מקומות
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              העלה מסמכים וצור אינדקס אוטומטי של מראי מקומות בש"ס
            </p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="index" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-16 rounded-2xl bg-secondary p-1.5">
              <TabsTrigger 
                value="index" 
                className="text-base gap-3 rounded-xl font-semibold data-[state=active]:bg-navy data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
              >
                <Book className="w-5 h-5" />
                האינדקס
              </TabsTrigger>
              <TabsTrigger 
                value="upload" 
                className="text-base gap-3 rounded-xl font-semibold data-[state=active]:bg-navy data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
              >
                <Upload className="w-5 h-5" />
                העלאת מסמך
              </TabsTrigger>
            </TabsList>

            <TabsContent value="index" className="mt-8">
              <div className="bg-card rounded-2xl border-2 border-border/50 p-6 shadow-lg">
                <IndexViewer refreshTrigger={refreshTrigger} />
              </div>
            </TabsContent>

            <TabsContent value="upload" className="mt-8">
              <div className="bg-card rounded-2xl border-2 border-border/50 p-6 shadow-lg">
                <DocumentUploader 
                  tractates={tractates} 
                  onDocumentProcessed={handleDocumentProcessed} 
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-navy border-t-4 border-gold mt-16 py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-white font-medium">אינדקס מראי מקומות - ניתוח פסקי דין</p>
          <p className="text-gold-light text-sm mt-1">זיהוי אוטומטי של מראי מקומות בש"ס 📚</p>
        </div>
      </footer>
    </div>
  );
};

export default IndexPage;
