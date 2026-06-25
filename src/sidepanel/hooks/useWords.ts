import { useCallback, useEffect, useState } from "react";
import { MessageType } from "../../shared/messages";
import { generateId, WordEntry } from "../types";

export function useWords() {
  const [words, setWords] = useState<WordEntry[]>([]);

  // Keep sidepanel port alive
  useEffect(() => {
    const port = chrome.runtime.connect({ name: "sidepanel" });
    return () => port.disconnect();
  }, []);

  // Listen for word selections from content script
  useEffect(() => {
    const handler = (message: any) => {
      if (message.type === MessageType.WordSelected) {
        setWords((prev) => {
          // Avoid duplicates (case insensitive)
          const exists = prev.some(
            (w) => w.original.toLowerCase() === message.word.toLowerCase(),
          );
          if (exists) return prev;
          return [
            ...prev,
            { id: generateId(), original: message.word, edited: message.word },
          ];
        });
      }
      if (message.type === MessageType.WordDeselected) {
        setWords((prev) =>
          prev.filter(
            (w) => w.original.toLowerCase() !== message.word.toLowerCase(),
          ),
        );
      }
    };
    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, []);

  const updateWord = useCallback((id: string, value: string) => {
    setWords((prev) =>
      prev.map((w) => (w.id === id ? { ...w, edited: value } : w)),
    );
  }, []);

  const removeWord = useCallback((id: string, original: string) => {
    setWords((prev) => prev.filter((w) => w.id !== id));
    // Tell content script to remove highlights for this word
    chrome.runtime.sendMessage({
      type: MessageType.RemoveWordHighlights,
      word: original.toLowerCase(),
    });
  }, []);

  const clearAll = useCallback(() => {
    setWords([]);
    chrome.runtime.sendMessage({ type: MessageType.ClearHighlights });
  }, []);

  return { words, updateWord, removeWord, clearAll };
}
