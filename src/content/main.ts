import { MessageType } from "../shared/messages";

/**
 * Content script: word selection and highlighting on the page.
 *
 * Clicking a word on the page:
 * 1. Determines the clicked word via caret range
 * 2. Walks all text nodes and wraps matching words with highlight spans
 * 3. Sends the word to the side panel via background
 */

const HIGHLIGHT_CLASS = "rh-word-highlight";
const HIGHLIGHT_ATTR = "data-rh-word";

// Tracks which words are currently highlighted (lowercased)
const highlightedWords = new Set<string>();

/**
 * Get the word at the click position using caretRangeFromPoint / caretPositionFromPoint.
 */
function getWordAtPoint(x: number, y: number): string | null {
  let range: Range | null = null;

  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(x, y);
  } else if ((document as any).caretPositionFromPoint) {
    const pos = (document as any).caretPositionFromPoint(x, y);
    if (pos && pos.offsetNode) {
      range = document.createRange();
      range.setStart(pos.offsetNode, pos.offset);
      range.collapse(true);
    }
  }

  if (
    !range ||
    !range.startContainer ||
    range.startContainer.nodeType !== Node.TEXT_NODE
  ) {
    return null;
  }

  const textNode = range.startContainer as Text;
  const text = textNode.textContent || "";
  const offset = range.startOffset;

  // Find word boundaries
  let start = offset;
  let end = offset;

  while (start > 0 && /\S/.test(text[start - 1])) start--;
  while (end < text.length && /\S/.test(text[end])) end++;

  const word = text.slice(start, end).trim();

  // Clean punctuation from edges
  const cleaned = word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");

  return cleaned || null;
}

/**
 * Walk all text nodes in the document body and wrap matching words with highlight spans.
 */
function highlightWord(word: string): void {
  const lower = word.toLowerCase();
  if (highlightedWords.has(lower)) return;
  highlightedWords.add(lower);

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        // Skip our own extension elements
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (parent.closest("#crxjs-app")) return NodeFilter.FILTER_REJECT;
        if (parent.closest("[data-rh-word]")) return NodeFilter.FILTER_REJECT;
        if (
          parent.tagName === "SCRIPT" ||
          parent.tagName === "STYLE" ||
          parent.tagName === "NOSCRIPT"
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    },
  );

  const textNodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    textNodes.push(node as Text);
  }

  // Use a regex to find whole-word matches (case insensitive)
  const escaped = lower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(
    `(?<=[\\s\\p{P}]|^)(${escaped})(?=[\\s\\p{P}]|$)`,
    "gui",
  );

  for (const textNode of textNodes) {
    const content = textNode.textContent || "";
    if (!regex.test(content)) continue;
    regex.lastIndex = 0;

    const parent = textNode.parentNode;
    if (!parent) continue;

    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
      // Text before the match
      if (match.index > lastIndex) {
        fragment.appendChild(
          document.createTextNode(content.slice(lastIndex, match.index)),
        );
      }

      // The highlighted word
      const span = document.createElement("span");
      span.className = HIGHLIGHT_CLASS;
      span.setAttribute(HIGHLIGHT_ATTR, lower);
      span.textContent = match[0];
      fragment.appendChild(span);

      lastIndex = match.index + match[0].length;
    }

    // Remaining text
    if (lastIndex < content.length) {
      fragment.appendChild(document.createTextNode(content.slice(lastIndex)));
    }

    if (lastIndex > 0) {
      parent.replaceChild(fragment, textNode);
    }
  }
}

/**
 * Remove highlights for a specific word.
 */
function removeHighlightsForWord(word: string): void {
  const lower = word.toLowerCase();
  highlightedWords.delete(lower);

  const spans = document.querySelectorAll(
    `[${HIGHLIGHT_ATTR}="${CSS.escape(lower)}"]`,
  );
  for (const span of spans) {
    const parent = span.parentNode;
    if (!parent) continue;
    const text = document.createTextNode(span.textContent || "");
    parent.replaceChild(text, span);
    parent.normalize(); // Merge adjacent text nodes
  }
}

/**
 * Remove all highlights.
 */
function clearAllHighlights(): void {
  const spans = document.querySelectorAll(`[${HIGHLIGHT_ATTR}]`);
  for (const span of spans) {
    const parent = span.parentNode;
    if (!parent) continue;
    const text = document.createTextNode(span.textContent || "");
    parent.replaceChild(text, span);
    parent.normalize();
  }
  highlightedWords.clear();
}

/**
 * Extract text content by CSS selector.
 * Throws when the selector is syntactically invalid so callers can
 * distinguish "no match" from "bad selector".
 */
function getTextBySelector(selector: string): string {
  if (!selector.trim()) return "";
  const elements = document.querySelectorAll(selector);
  return Array.from(elements)
    .map((el) => (el as HTMLElement).innerText || el.textContent || "")
    .join("\n")
    .trim();
}

async function isSidePanelOpen(): Promise<boolean> {
  try {
    const response = await chrome.runtime.sendMessage({
      type: MessageType.IsSidePanelOpen,
    });
    return response?.open === true;
  } catch {
    return false;
  }
}

// --- Event listeners ---

// Click handler to pick words
document.addEventListener(
  "click",
  async (e: MouseEvent) => {
    if (!(await isSidePanelOpen())) return;

    // Ignore clicks on our own highlight spans (they're already selected)
    const target = e.target as HTMLElement;
    if (target.closest("#crxjs-app")) return;
    // Don't interfere with links, buttons, inputs
    if (target.closest("a, button, input, textarea, select, [contenteditable]"))
      return;

    const word = getWordAtPoint(e.clientX, e.clientY);
    if (!word || word.length < 2) return;

    // Check if word is already highlighted — if so, deselect
    const lower = word.toLowerCase();
    if (highlightedWords.has(lower)) {
      removeHighlightsForWord(lower);
      chrome.runtime.sendMessage({
        type: MessageType.WordDeselected,
        word: lower,
      });
      return;
    }

    highlightWord(word);

    // Notify side panel
    chrome.runtime.sendMessage({
      type: MessageType.WordSelected,
      word,
    });
  },
  true,
);

// Listen for messages from background / side panel
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === MessageType.ClearHighlights) {
    clearAllHighlights();
  }

  if (message.type === MessageType.RemoveWordHighlights) {
    removeHighlightsForWord(message.word);
  }

  if (message.type === MessageType.GetCssText) {
    try {
      const text = getTextBySelector(message.selector);
      sendResponse({ text });
    } catch {
      sendResponse({ error: "invalid-selector" });
    }
  }
});
