import { useState } from "react";
import { ActionsBar } from "./components/ActionsBar";
import { CssSelectorInput } from "./components/CssSelectorInput";
import { Header } from "./components/Header";
import { Toast } from "./components/Toast";
import { WordList } from "./components/WordList";
import { useClipboard } from "./hooks/useClipboard";
import { useToast } from "./hooks/useToast";
import { useWords } from "./hooks/useWords";

export default function App() {
  const [cssSelector, setCssSelector] = useState("li[data-qa] > div > div");
  const [lowercase, setLowercase] = useState(false);

  const { toast, showToast } = useToast();
  const { words, updateWord, removeWord, clearAll } = useWords();
  const { copyWords, copyUrl, copyCssText } = useClipboard({
    words,
    lowercase,
    cssSelector,
    showToast,
  });

  return (
    <div className="app">
      <Header wordCount={words.length} />
      <ActionsBar
        wordCount={words.length}
        lowercase={lowercase}
        onLowercaseChange={setLowercase}
        onCopyWords={copyWords}
        onCopyUrl={copyUrl}
        onCopyCss={copyCssText}
        onClear={clearAll}
      />
      <CssSelectorInput value={cssSelector} onChange={setCssSelector} />
      <WordList
        words={words}
        onUpdateWord={updateWord}
        onRemoveWord={removeWord}
      />
      <Toast message={toast} />
    </div>
  );
}
