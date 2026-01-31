# Send to Polaris

Chrome extension to send web page content to Polaris AI assistant.

Forked from [Nateliason/send-to-openclaw](https://github.com/Nateliason/send-to-openclaw).

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked" and select the `extension/` folder
4. Click the extension icon and go to **Options**
5. Enter your auth token (get from gateway admin)

The extension comes pre-configured with the Polaris webhook URL.

## Usage

- **Click the toolbar icon** to send current page
- **Right-click** any page or selection → **Send to Polaris**
- **Keyboard shortcut**: `Alt+Shift+S`
- Select text first to send just the selection
- Add an optional message/instructions before sending

## Features

- Extracts readable content from any page
- Special handling for Twitter/X threads
- Google Docs export support (uses your browser session)
- Optional message/context with each send
- Clean content extraction (removes ads, nav, etc.)

## What Polaris Receives

```
📎 Page sent from browser: Document Title
URL: https://example.com/page
Time: 2026-01-30T21:00:05.560Z

Your optional message here

---
The page content or selected text...
```

## License

MIT
