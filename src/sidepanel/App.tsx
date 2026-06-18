import { useCallback, useEffect, useRef, useState } from 'react'
import { MessageType } from '../shared/messages'

interface WordEntry {
  id: string
  original: string
  edited: string
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export default function App() {
  const [words, setWords] = useState<WordEntry[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const [cssSelector, setCssSelector] = useState('li[data-qa] > div > div')
  const [lowercase, setLowercase] = useState(false)
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimeout.current) clearTimeout(toastTimeout.current)
    toastTimeout.current = setTimeout(() => setToast(null), 2000)
  }, [])

  useEffect(() => {
    const port = chrome.runtime.connect({ name: 'sidepanel' })
    return () => port.disconnect()
  }, [])

  // Listen for word selections from content script
  useEffect(() => {
    const handler = (message: any) => {
      if (message.type === MessageType.WordSelected) {
        setWords((prev) => {
          // Avoid duplicates (case insensitive)
          const exists = prev.some(
            (w) => w.original.toLowerCase() === message.word.toLowerCase(),
          )
          if (exists) return prev
          return [...prev, { id: generateId(), original: message.word, edited: message.word }]
        })
      }
      if (message.type === MessageType.WordDeselected) {
        setWords((prev) =>
          prev.filter((w) => w.original.toLowerCase() !== message.word.toLowerCase()),
        )
      }
    }
    chrome.runtime.onMessage.addListener(handler)
    return () => chrome.runtime.onMessage.removeListener(handler)
  }, [])

  const updateWord = useCallback((id: string, value: string) => {
    setWords((prev) =>
      prev.map((w) => (w.id === id ? { ...w, edited: value } : w)),
    )
  }, [])

  const removeWord = useCallback(
    (id: string, original: string) => {
      setWords((prev) => prev.filter((w) => w.id !== id))
      // Tell content script to remove highlights for this word
      chrome.runtime.sendMessage({
        type: MessageType.RemoveWordHighlights,
        word: original.toLowerCase(),
      })
    },
    [],
  )

  const clearAll = useCallback(() => {
    setWords([])
    chrome.runtime.sendMessage({ type: MessageType.ClearHighlights })
  }, [])

  const copyWords = useCallback(async () => {
    const text = words
      .map((w) => (lowercase ? w.edited.toLowerCase() : w.edited))
      .join('\n')
    try {
      await navigator.clipboard.writeText(text)
      showToast('Copied to clipboard!')
    } catch {
      showToast('Copy failed')
    }
  }, [words, lowercase, showToast])

  const copyUrl = useCallback(async () => {
    chrome.runtime.sendMessage({ type: MessageType.GetPageUrl }, async (response) => {
      if (response?.url) {
        try {
          await navigator.clipboard.writeText(response.url)
          showToast('URL copied!')
        } catch {
          showToast('Copy failed')
        }
      }
    })
  }, [showToast])

  const copyCssText = useCallback(async () => {
    if (!cssSelector.trim()) {
      showToast('Enter a CSS selector')
      return
    }
    chrome.runtime.sendMessage(
      { type: MessageType.GetCssText, selector: cssSelector },
      async (response) => {
        if (response?.text) {
          try {
            await navigator.clipboard.writeText(response.text)
            showToast('Text copied!')
          } catch {
            showToast('Copy failed')
          }
        } else {
          showToast('Element not found')
        }
      },
    )
  }, [cssSelector, showToast])

  return (
    <div className="app">
      {/* Header */}
      <div className="header">
        <div className="header-title">
          Keyword Picker
          {words.length > 0 && (
            <span className="word-count">{words.length}</span>
          )}
        </div>
        <div className="header-subtitle">
          Click a word on the page to add it to the list
        </div>
      </div>

      {/* Action Buttons */}
      <div className="actions-bar">
        <button
          className="btn btn-accent"
          onClick={copyWords}
          disabled={words.length === 0}
          title="Copy all words"
        >
          <span className="btn-icon">📋</span>
          Words
        </button>
        <button className="btn" onClick={copyUrl} title="Copy page URL">
          <span className="btn-icon">🔗</span>
          URL
        </button>
        <button
          className="btn"
          onClick={copyCssText}
          title="Copy text by CSS selector"
        >
          <span className="btn-icon">🎯</span>
          CSS
        </button>
        {words.length > 0 && (
          <button
            className="btn btn-danger"
            onClick={clearAll}
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
            onChange={(e) => setLowercase(e.target.checked)}
          />
          <span className="toggle-switch" />
          <span className="toggle-label">aa</span>
        </label>
      </div>

      {/* CSS Selector */}
      <div className="css-section">
        <div className="css-section-label">CSS Selector</div>
        <div className="css-input-row">
          <input
            className="css-input"
            type="text"
            value={cssSelector}
            onChange={(e) => setCssSelector(e.target.value)}
            placeholder="For example, .job-title, #company-name"
          />
        </div>
      </div>

      {/* Words list */}
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
            <div className="word-item" key={word.id}>
              <span className="word-index">{index + 1}</span>
              <input
                className="word-input"
                value={word.edited}
                onChange={(e) => updateWord(word.id, e.target.value)}
                spellCheck={false}
              />
              {word.edited !== word.original && (
                <span className="word-original" title={word.original}>
                  {word.original}
                </span>
              )}
              <button
                className="word-remove"
                onClick={() => removeWord(word.id, word.original)}
                title="Remove"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      {/* Toast */}
      <div className={`toast ${toast ? 'visible' : ''}`}>
        <span className="toast-icon">✓</span>
        {toast}
      </div>
    </div>
  )
}
