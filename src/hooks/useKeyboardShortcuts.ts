import { useEffect, useCallback, useRef } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  callback: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;

        // Allow '?' shortcut even in inputs
        const allowInInput = shortcut.key === '?';

        if (
          e.key.toLowerCase() === shortcut.key.toLowerCase() &&
          ctrlMatch &&
          shiftMatch &&
          altMatch &&
          (!isInput || allowInInput || shortcut.ctrl)
        ) {
          e.preventDefault();
          shortcut.callback();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [shortcuts]);
}

export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts = [];
  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.alt) parts.push('Alt');
  parts.push(shortcut.key.toUpperCase());
  return parts.join('+');
}

// Hook for navigating through results with keyboard
export function useResultsNavigation(
  resultsCount: number,
  onNavigate: (index: number) => void,
  enabled: boolean = true
) {
  const currentIndex = useRef(0);

  const navigateNext = useCallback(() => {
    if (resultsCount === 0) return;
    currentIndex.current = Math.min(currentIndex.current + 1, resultsCount - 1);
    onNavigate(currentIndex.current);
  }, [resultsCount, onNavigate]);

  const navigatePrev = useCallback(() => {
    if (resultsCount === 0) return;
    currentIndex.current = Math.max(currentIndex.current - 1, 0);
    onNavigate(currentIndex.current);
  }, [resultsCount, onNavigate]);

  const navigateFirst = useCallback(() => {
    if (resultsCount === 0) return;
    currentIndex.current = 0;
    onNavigate(0);
  }, [resultsCount, onNavigate]);

  const navigateLast = useCallback(() => {
    if (resultsCount === 0) return;
    currentIndex.current = resultsCount - 1;
    onNavigate(resultsCount - 1);
  }, [resultsCount, onNavigate]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      if (isInput) return;

      switch (e.key) {
        case 'ArrowDown':
        case 'j':
          e.preventDefault();
          navigateNext();
          break;
        case 'ArrowUp':
        case 'k':
          e.preventDefault();
          navigatePrev();
          break;
        case 'Home':
          e.preventDefault();
          navigateFirst();
          break;
        case 'End':
          e.preventDefault();
          navigateLast();
          break;
        case 'n':
          if (e.ctrlKey) {
            e.preventDefault();
            navigateNext();
          }
          break;
        case 'p':
          if (e.ctrlKey) {
            e.preventDefault();
            navigatePrev();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, navigateNext, navigatePrev, navigateFirst, navigateLast]);

  return {
    currentIndex: currentIndex.current,
    navigateNext,
    navigatePrev,
    navigateFirst,
    navigateLast,
    setCurrentIndex: (index: number) => {
      currentIndex.current = index;
    },
  };
}
