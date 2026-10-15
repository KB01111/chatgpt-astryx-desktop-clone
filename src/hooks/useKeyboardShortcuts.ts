import { useEffect, useEffectEvent } from "react";

interface ShortcutActions {
  command: () => void;
  newChat: () => void;
  companion: () => void;
  sidebar: () => void;
}

export function useKeyboardShortcuts(actions: ShortcutActions) {
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const mod = event.metaKey || event.ctrlKey;
    if (mod && event.key.toLowerCase() === "k") {
      event.preventDefault();
      actions.command();
    } else if (mod && event.key.toLowerCase() === "n") {
      event.preventDefault();
      actions.newChat();
    } else if (event.altKey && event.code === "Space") {
      event.preventDefault();
      actions.companion();
    } else if (mod && event.shiftKey && event.key.toLowerCase() === "s") {
      event.preventDefault();
      actions.sidebar();
    }
  });

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
