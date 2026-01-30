# Send to OpenClaw

Send readable page content from Chrome to a OpenClaw instance using a simple webhook.

## What it does
- Grab the main readable text from the current page (or highlighted selection)
- Add optional instructions from a popup message field
- Send everything to a configurable webhook
- Webhook server calls `clawdbot system event` to inject a formatted message into your session

## Quick start

### 1) Run the webhook server
```bash
cd server
npm install
cp .env.example .env
npm start
```

The server listens on `http://localhost:3847/send-to-openclaw` by default.

### 2) Load the Chrome extension
1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `extension/` folder
4. Click the extension’s **Options** link and set your Webhook URL

## Configuration

### Extension options
- **Webhook URL**: where the extension sends content
- **Auth token**: optional bearer token

Settings are stored in `chrome.storage.sync`.

### Server environment variables
Set these in `server/.env` or your environment:
- `PORT` (default `3847`)
- `WEBHOOK_TOKEN` (optional bearer token)
- `OPENCLAW_WAKE_MODE` (`now` or `next-heartbeat`)

`.env.example` is included for reference.

## How to use
- Click the toolbar icon to open the popup
- Add an optional message and press **Send**
- Highlight text first to send only the selection
- Right-click the page or selection and choose **Send to OpenClaw**

## OpenClaw formatting
The webhook server formats a wake message like:
```
📎 Page sent from browser: {title}
URL: {url}
Time: {timestamp}

{message if provided}

---
{selection || content}
```

## Running as a service

### systemd (Linux)
Edit paths in `server/send-to-openclaw.service` and copy to:
`/etc/systemd/system/send-to-openclaw.service`

```bash
sudo systemctl daemon-reload
sudo systemctl enable send-to-openclaw
sudo systemctl start send-to-openclaw
```

### launchd (macOS)
Edit paths in `server/com.sendtoopenclaw.plist` and copy to:
`~/Library/LaunchAgents/com.sendtoopenclaw.plist`

```bash
launchctl load ~/Library/LaunchAgents/com.sendtoopenclaw.plist
```

## Notes
- No URLs or tokens are hardcoded; everything is configured via the options page or env vars.
- The extension uses an on-demand content script to avoid broad host permissions.

## License
MIT
