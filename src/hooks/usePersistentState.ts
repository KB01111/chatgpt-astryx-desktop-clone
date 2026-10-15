import { useEffect, useState } from "react";

export function usePersistentState<T>(
  key: string,
  initial: T,
  validate: (value: unknown) => value is T,
) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
      return validate(saved) ? saved : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* Storage can be disabled or full. Keep the session usable. */
      }
    }, 200);
    return () => window.clearTimeout(timeout);
  }, [key, value]);

  return [value, setValue] as const;
}
