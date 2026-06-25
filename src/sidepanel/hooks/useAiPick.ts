import { useCallback, useEffect, useState } from "react";
import { MessageType } from "../../shared/messages";

const STORAGE_KEY_API = "openrouter_api_key";
const STORAGE_KEY_PROMPT = "ai_prompt";
const STORAGE_KEY_MODEL = "ai_model";

const DEFAULT_MODEL = "google/gemini-2.5-flash";
const DEFAULT_PROMPT = `Extract the most relevant professional keywords and skills from the following job posting. Return ONLY a valid JSON array of strings, no other text. Example: ["Python", "React", "Leadership"]`;

interface UseAiPickOptions {
  cssSelector: string;
  onWordsFound: (words: string[]) => void;
  showToast: (msg: string) => void;
}

export function useAiPick({
  cssSelector,
  onWordsFound,
  showToast,
}: UseAiPickOptions) {
  const [apiKey, setApiKey] = useState("");
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved values from storage
  useEffect(() => {
    chrome.storage.local.get(
      [STORAGE_KEY_API, STORAGE_KEY_PROMPT, STORAGE_KEY_MODEL],
      (result: Record<string, string>) => {
        if (result[STORAGE_KEY_API]) setApiKey(result[STORAGE_KEY_API]);
        if (result[STORAGE_KEY_PROMPT]) setPrompt(result[STORAGE_KEY_PROMPT]);
        if (result[STORAGE_KEY_MODEL]) setModel(result[STORAGE_KEY_MODEL]);
      },
    );
  }, []);

  // Save API key to storage
  const saveApiKey = useCallback((key: string) => {
    setApiKey(key);
    chrome.storage.local.set({ [STORAGE_KEY_API]: key });
  }, []);

  // Save prompt to storage
  const savePrompt = useCallback((p: string) => {
    setPrompt(p);
    chrome.storage.local.set({ [STORAGE_KEY_PROMPT]: p });
  }, []);

  // Save model to storage
  const saveModel = useCallback((m: string) => {
    setModel(m);
    chrome.storage.local.set({ [STORAGE_KEY_MODEL]: m });
  }, []);

  const runAiPick = useCallback(async () => {
    if (!apiKey.trim()) {
      setError("Enter your OpenRouter API key");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Get page text from content script
      const pageText = await new Promise<string>((resolve, reject) => {
        chrome.runtime.sendMessage(
          {
            type: MessageType.GetPageText,
            selector: cssSelector.trim() || undefined,
          },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            resolve(response?.text || "");
          },
        );
      });

      if (!pageText.trim()) {
        setError("Could not extract text from the page");
        setLoading(false);
        return;
      }

      // 2. Truncate text if too long (keep ~8000 chars to stay within token limits)
      const truncated =
        pageText.length > 8000 ? pageText.slice(0, 8000) + "..." : pageText;

      // 3. Send to OpenRouter API
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "chrome-extension://keyword-picker",
          },
          body: JSON.stringify({
            model: model.trim() || DEFAULT_MODEL,
            messages: [
              {
                role: "user",
                content: `${prompt}\n\n---\n\n${truncated}`,
              },
            ],
            temperature: 0.1,
          }),
        },
      );

      if (!response.ok) {
        const errBody = await response.text();
        if (response.status === 401) {
          setError("Invalid API key");
        } else if (response.status === 402) {
          setError("Insufficient credits on OpenRouter");
        } else if (response.status === 429) {
          setError("Rate limited — try again later");
        } else {
          setError(`API error ${response.status}: ${errBody.slice(0, 100)}`);
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content || "";

      // 4. Parse JSON array from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        setError("AI did not return a valid keyword list");
        setLoading(false);
        return;
      }

      let keywords: string[];
      try {
        keywords = JSON.parse(jsonMatch[0]);
      } catch {
        setError("Failed to parse AI response");
        setLoading(false);
        return;
      }

      if (!Array.isArray(keywords) || keywords.length === 0) {
        setError("AI returned no keywords");
        setLoading(false);
        return;
      }

      // Filter to only strings
      const validKeywords = keywords
        .filter((k): k is string => typeof k === "string" && k.trim().length > 0)
        .map((k) => k.trim());

      onWordsFound(validKeywords);
      showToast(`Added ${validKeywords.length} keywords`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [apiKey, prompt, model, cssSelector, onWordsFound, showToast]);

  return {
    apiKey,
    saveApiKey,
    prompt,
    savePrompt,
    model,
    saveModel,
    loading,
    error,
    runAiPick,
    defaultPrompt: DEFAULT_PROMPT,
    defaultModel: DEFAULT_MODEL,
  };
}
