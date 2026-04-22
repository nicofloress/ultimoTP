import { useCallback, useEffect, useRef, useState } from 'react';

interface Options<T> {
  onSelect: (item: T) => void;
  onEscape?: () => void;
  dataAttr?: string;
  enabled?: boolean;
}

export function useListNavigation<T>(items: T[], opts: Options<T>) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const indexRef = useRef(-1);
  indexRef.current = activeIndex;

  useEffect(() => {
    setActiveIndex(-1);
  }, [items]);

  useEffect(() => {
    if (activeIndex < 0 || !optsRef.current.dataAttr) return;
    document.querySelector(`[${optsRef.current.dataAttr}="${activeIndex}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (optsRef.current.enabled === false) return;
    const len = itemsRef.current.length;
    if (e.key === 'ArrowDown') {
      if (len === 0) return;
      e.preventDefault();
      setActiveIndex(prev => Math.min(prev + 1, len - 1));
    } else if (e.key === 'ArrowUp') {
      if (len === 0) return;
      e.preventDefault();
      setActiveIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      const i = indexRef.current;
      if (i >= 0 && i < itemsRef.current.length) {
        e.preventDefault();
        optsRef.current.onSelect(itemsRef.current[i]);
      }
    } else if (e.key === 'Escape') {
      if (optsRef.current.onEscape) {
        e.preventDefault();
        optsRef.current.onEscape();
      }
      setActiveIndex(-1);
    }
  }, []);

  return { activeIndex, setActiveIndex, handleKeyDown };
}
