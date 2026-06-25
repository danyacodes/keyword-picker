interface ActionsBarProps {
  wordCount: number;
  lowercase: boolean;
  onLowercaseChange: (value: boolean) => void;
  onCopyWords: () => void;
  onCopyUrl: () => void;
  onCopyCss: () => void;
  onClear: () => void;
}

export function ActionsBar({
  wordCount,
  lowercase,
  onLowercaseChange,
  onCopyWords,
  onCopyUrl,
  onCopyCss,
  onClear,
}: ActionsBarProps) {
  return (
    <div className="actions-bar">
      <button
        className="btn btn-accent"
        onClick={onCopyWords}
        disabled={wordCount === 0}
        title="Copy all words"
      >
        <span className="btn-icon">📋</span>
        Words
      </button>
      <button className="btn" onClick={onCopyUrl} title="Copy page URL">
        <span className="btn-icon">🔗</span>
        URL
      </button>
      <button
        className="btn"
        onClick={onCopyCss}
        title="Copy text by CSS selector"
      >
        <span className="btn-icon">🎯</span>
        CSS
      </button>
      {wordCount > 0 && (
        <button
          className="btn btn-danger"
          onClick={onClear}
          title="Clear all"
        >
          <span className="btn-icon">✕</span>
          Clear
        </button>
      )}
      <label className="toggle" title="Copy in lowercase">
        <input
          type="checkbox"
          checked={lowercase}
          onChange={(e) => onLowercaseChange(e.target.checked)}
        />
        <span className="toggle-switch" />
        <span className="toggle-label">aa</span>
      </label>
    </div>
  );
}
