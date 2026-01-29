import { Search, Sparkles, Book } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { MobileMenu } from '@/components/MobileMenu';

export function Header() {
  const location = useLocation();
  
  return (
    <header className="bg-navy dark:bg-card border-b-4 border-gold sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-5">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 sm:gap-4">
            <div className="relative">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gold rounded-xl flex items-center justify-center shadow-md">
                <Search className="w-5 h-5 sm:w-6 sm:h-6 text-navy" />
              </div>
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-gold absolute -top-1 -left-1 animate-pulse-soft" />
            </div>
            <div className="text-right">
              <h1 className="text-lg sm:text-2xl font-bold text-white dark:text-foreground">חיפוש חכם</h1>
              <p className="text-xs sm:text-sm text-gold-light hidden sm:block">ניתוח טקסטים מתקדם</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <Link
              to="/"
              className={cn(
                "px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2",
                location.pathname === '/' 
                  ? "bg-gold text-navy" 
                  : "text-white hover:bg-white/10"
              )}
            >
              <Search className="w-4 h-4" />
              חיפוש
            </Link>
            <Link
              to="/index"
              className={cn(
                "px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2",
                location.pathname === '/index' 
                  ? "bg-gold text-navy" 
                  : "text-white hover:bg-white/10"
              )}
            >
              <Book className="w-4 h-4" />
              אינדקס
            </Link>
            <div className="w-px h-6 bg-gold/30 mx-2" />
            <ThemeToggle />
          </nav>

          {/* Mobile Menu */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
