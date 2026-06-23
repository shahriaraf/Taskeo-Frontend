// src/hooks/useDebounce.ts
import { useState, useEffect } from "react";

/**
 * Delays updating the returned value until `delay` ms have passed
 * without the input value changing. Used to avoid firing API calls
 * on every keystroke.
 *
 * @example
 * const debouncedQuery = useDebounce(searchInput, 300);
 * // debouncedQuery only updates 300ms after the user stops typing
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
