import { WordEntry } from "../types";
import { WordItem } from "./WordItem";

interface WordListProps {
  words: WordEntry[];
  onUpdateWord: (id: string, value: string) => void;
  onRemoveWord: (id: string, original: string) => void;
}

export function WordList({ words, onUpdateWord, onRemoveWord }: WordListProps) {
  return (
    <div className="words-container">
      {words.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✦</div>
          <div className="empty-title">No selected words</div>
          <div className="empty-text">
            Click any word on the page. It will appear here and be highlighted.
          </div>
        </div>
      ) : (
        words.map((word, index) => (
          <WordItem
            key={word.id}
            word={word}
            index={index}
            onUpdate={onUpdateWord}
            onRemove={onRemoveWord}
          />
        ))
      )}
    </div>
  );
}
