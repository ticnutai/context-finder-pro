import { useState } from 'react';
import { Menu, X, Search, Book, Settings, Moon, Sun } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { resolvedTheme, toggleTheme } = useTheme();

  const navItems = [
    { path: '/', label: 'חיפוש', icon: Search },
    { path: '/index', label: 'אינדקס', icon: Book },
  ];

  return (
    <div className="md:hidden">
      {/* Hamburger button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="text-white hover:bg-white/10 touch-target"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </Button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile menu drawer */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-72 bg-navy dark:bg-card z-50 shadow-2xl transform transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white dark:text-foreground">תפריט</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all touch-target",
                  location.pathname === item.path
                    ? "bg-gold text-navy"
                    : "text-white hover:bg-white/10"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Divider */}
          <div className="border-t border-gold/30" />

          {/* Theme toggle */}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-white font-medium">מצב תצוגה</span>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="bg-gold/20 border-gold text-white"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>
          </div>

          {/* Footer */}
          <div className="absolute bottom-6 left-6 right-6">
            <p className="text-gold/70 text-sm text-center">
              חיפוש חכם v1.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
