import { useState } from "react";

interface AiSectionProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  prompt: string;
  onPromptChange: (prompt: string) => void;
  model: string;
  onModelChange: (model: string) => void;
  loading: boolean;
  error: string | null;
  onRun: () => void;
  defaultPrompt: string;
  defaultModel: string;
}

export function AiSection({
  apiKey,
  onApiKeyChange,
  prompt,
  onPromptChange,
  model,
  onModelChange,
  loading,
  error,
  onRun,
  defaultPrompt,
  defaultModel,
}: AiSectionProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="ai-section">
      <button
        className="ai-section-header"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className="ai-section-title">
          <span className="ai-icon">✨</span>
          AI Pick
        </span>
        <span className={`ai-chevron ${collapsed ? "collapsed" : ""}`}>▾</span>
      </button>

      {!collapsed && (
        <div className="ai-section-body">
          <div className="ai-field">
            <label className="ai-label">OpenRouter API Key</label>
            <div className="ai-key-row">
              <input
                className="ai-input ai-key-input"
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => onApiKeyChange(e.target.value)}
                placeholder="sk-or-..."
                spellCheck={false}
              />
              <button
                className="ai-key-toggle"
                onClick={() => setShowKey(!showKey)}
                title={showKey ? "Hide key" : "Show key"}
              >
                {showKey ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          <div className="ai-field">
            <div className="ai-label-row">
              <label className="ai-label">Model</label>
              {model !== defaultModel && (
                <button
                  className="ai-reset-btn"
                  onClick={() => onModelChange(defaultModel)}
                  title="Reset to default"
                >
                  ↺
                </button>
              )}
            </div>
            <input
              className="ai-input"
              type="text"
              value={model}
              onChange={(e) => onModelChange(e.target.value)}
              placeholder={defaultModel}
              spellCheck={false}
            />
          </div>

          <div className="ai-field">
            <div className="ai-label-row">
              <label className="ai-label">Prompt</label>
              {prompt !== defaultPrompt && (
                <button
                  className="ai-reset-btn"
                  onClick={() => onPromptChange(defaultPrompt)}
                  title="Reset to default"
                >
                  ↺
                </button>
              )}
            </div>
            <textarea
              className="ai-input ai-textarea"
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder="Describe which keywords to extract..."
              rows={3}
              spellCheck={false}
            />
          </div>

          {error && <div className="ai-error">{error}</div>}

          <button
            className="btn btn-ai-run"
            onClick={onRun}
            disabled={loading || !apiKey.trim()}
          >
            {loading ? (
              <>
                <span className="ai-spinner" />
                Processing…
              </>
            ) : (
              <>
                <span className="btn-icon">✨</span>
                AI Pick Keywords
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
