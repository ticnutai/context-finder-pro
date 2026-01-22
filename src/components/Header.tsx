import { Search, Sparkles } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-navy border-b-4 border-gold sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-6 py-5">
        <div className="flex items-center justify-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 bg-gold rounded-xl flex items-center justify-center shadow-md">
              <Search className="w-6 h-6 text-navy" />
            </div>
            <Sparkles className="w-4 h-4 text-gold absolute -top-1 -left-1 animate-pulse-soft" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">חיפוש חכם</h1>
            <p className="text-sm text-gold-light">ניתוח טקסטים מתקדם</p>
          </div>
        </div>
      </div>
    </header>
  );
}
