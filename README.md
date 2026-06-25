# Keyword Picker

Keyword Picker is a Chrome extension that helps collect useful words and text snippets from job pages, resumes, profiles, and other web pages while you browse.

The extension opens in the Chrome side panel. Click a word on the current page to add it to the list, highlight all matching occurrences on the page, edit the collected word if needed, and copy the final list to the clipboard.

## Features

- Click any word on a web page to add it to the side panel
- Highlight selected words directly on the page
- Click a highlighted word again or remove it from the panel to deselect it
- Edit collected words before copying
- Copy the collected word list, one word per line
- Optionally copy words in lowercase
- Copy the active page URL
- Extract and copy text from page elements by CSS selector
- **AI-powered keyword extraction** via OpenRouter — automatically pick keywords from the page using a custom prompt
- Clear all selected words and page highlights at once

## Tech Stack

- React
- TypeScript
- Vite
- CRXJS Vite plugin
- Chrome Manifest V3

## Quick Start

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build the extension:

```bash
npm run build
```

Load the extension in Chrome:

1. Open `chrome://extensions/`
2. Enable Developer mode
3. Click Load unpacked
4. Select the generated `dist` directory
5. Click the extension icon to open the side panel

## Project Structure

- `src/sidepanel/` - React side panel UI
- `src/content/` - Content script for word detection, highlighting, and CSS selector extraction
- `src/background/` - Service worker for opening the side panel and relaying messages
- `manifest.config.ts` - Chrome extension manifest configuration
- `public/logo.png` - Extension icon

## Available Scripts

- `npm run dev` - Start Vite in development mode
- `npm run build` - Type-check and build the extension
- `npm run preview` - Preview the production build

## AI Keyword Selection

The extension can automatically extract keywords from the current page using AI via the [OpenRouter](https://openrouter.ai/) API.

1. Open the **✨ AI Pick** section in the side panel
2. Enter your OpenRouter API key (it is saved locally in `chrome.storage.local` and never sent anywhere except OpenRouter)
3. Optionally change the model (default: `google/gemini-2.5-flash`) and customize the prompt
4. Click **AI Pick Keywords** — the extension extracts page text (using the CSS selector if set, or the full page), sends it to the AI, and adds the returned keywords to your list with highlights

## How It Works

The content script listens for clicks on regular page text. When a word is selected, it wraps matching words in highlight spans and sends the selected word to the side panel. The side panel keeps the editable list of selected words and sends commands back to the content script when words are removed or all highlights are cleared.

For CSS selector extraction, the side panel sends the selector to the active tab. The content script reads matching elements, joins their text content, and returns it for copying.

For AI keyword extraction, the side panel requests the page text from the content script, sends it along with the user's prompt to the OpenRouter API, parses the JSON array of keywords from the response, adds them to the word list, and highlights all matches on the page.
