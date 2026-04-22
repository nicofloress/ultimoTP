import { useCallback, useEffect, useRef, useState } from 'react';

interface Options<T> {
  onSelect: (item: T) => void;
  onEscape?: () => void;
  dataAttr?: string;
  enabled?: boolean;
}

export function useListNavigation<T>(items: T[], opts: Options<T>) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const indexRef = useRef(-1);
  indexRef.current = activeIndex;

  useEffect(() => {
    setActiveIndex(-1);
    indexRef.current = -1;
  }, [items]);

  const scrollTo = useCallback((i: number) => {
    if (!opts.dataAttr || i < 0) return;
    document.querySelector(`[${opts.dataAttr}="${i}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [opts.dataAttr]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (opts.enabled === false) return;
    if (e.key === 'ArrowDown') {
      if (items.length === 0) return;
      e.preventDefault();
      setActiveIndex(prev => {
        const next = Math.min(prev + 1, items.length - 1);
        scrollTo(next);
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      if (items.length === 0) return;
      e.preventDefault();
      setActiveIndex(prev => {
        const next = Math.max(prev - 1, -1);
        scrollTo(next);
        return next;
      });
    } else if (e.key === 'Enter') {
      const i = indexRef.current;
      if (i >= 0 && i < items.length) {
        e.preventDefault();
        opts.onSelect(items[i]);
      }
    } else if (e.key === 'Escape') {
      if (opts.onEscape) {
        e.preventDefault();
        opts.onEscape();
      }
      setActiveIndex(-1);
    }
  };

  return { activeIndex, setActiveIndex, handleKeyDown };
}
