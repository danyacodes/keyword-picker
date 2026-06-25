interface HeaderProps {
  wordCount: number;
}

export function Header({ wordCount }: HeaderProps) {
  return (
    <div className="header">
      <div className="header-title">
        Keyword Picker
        {wordCount > 0 && <span className="word-count">{wordCount}</span>}
      </div>
      <div className="header-subtitle">
        Click a word on the page to add it to the list
      </div>
    </div>
  );
}
