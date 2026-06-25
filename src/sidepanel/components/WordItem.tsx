import { WordEntry } from "../types";

interface WordItemProps {
  word: WordEntry;
  index: number;
  onUpdate: (id: string, value: string) => void;
  onRemove: (id: string, original: string) => void;
}

export function WordItem({ word, index, onUpdate, onRemove }: WordItemProps) {
  return (
    <div className="word-item">
      <span className="word-index">{index + 1}</span>
      <input
        className="word-input"
        value={word.edited}
        onChange={(e) => onUpdate(word.id, e.target.value)}
        spellCheck={false}
      />
      {word.edited !== word.original && (
        <span className="word-original" title={word.original}>
          {word.original}
        </span>
      )}
      <button
        className="word-remove"
        onClick={() => onRemove(word.id, word.original)}
        title="Remove"
      >
        ×
      </button>
    </div>
  );
}
