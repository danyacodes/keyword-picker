import { useCallback } from "react";
import { MessageType } from "../../shared/messages";
import { WordEntry } from "../types";

interface UseClipboardOptions {
  words: WordEntry[];
  lowercase: boolean;
  cssSelector: string;
  showToast: (msg: string) => void;
}

export function useClipboard({
  words,
  lowercase,
  cssSelector,
  showToast,
}: UseClipboardOptions) {
  const copyWords = useCallback(async () => {
    const text = words
      .map((w) => (lowercase ? w.edited.toLowerCase() : w.edited))
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied to clipboard!");
    } catch {
      showToast("Copy failed");
    }
  }, [words, lowercase, showToast]);

  const copyUrl = useCallback(async () => {
    chrome.runtime.sendMessage(
      { type: MessageType.GetPageUrl },
      async (response) => {
        if (response?.url) {
          try {
            await navigator.clipboard.writeText(response.url);
            showToast("URL copied!");
          } catch {
            showToast("Copy failed");
          }
        }
      },
    );
  }, [showToast]);

  const copyCssText = useCallback(async () => {
    if (!cssSelector.trim()) {
      showToast("Enter a CSS selector");
      return;
    }
    chrome.runtime.sendMessage(
      { type: MessageType.GetCssText, selector: cssSelector },
      async (response) => {
        if (response?.error === "invalid-selector") {
          showToast("Invalid CSS selector");
          return;
        }
        if (response?.text) {
          try {
            await navigator.clipboard.writeText(response.text);
            showToast("Text copied!");
          } catch {
            showToast("Copy failed");
          }
        } else {
          showToast("Element not found");
        }
      },
    );
  }, [cssSelector, showToast]);

  return { copyWords, copyUrl, copyCssText };
}
