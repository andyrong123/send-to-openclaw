const statusEl = document.getElementById("status");
const sendBtn = document.getElementById("send");
const optionsBtn = document.getElementById("open-options");
const messageEl = document.getElementById("message");

function setStatus(message, kind) {
  statusEl.textContent = message;
  statusEl.className = `status ${kind || ""}`.trim();
}

function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["webhookUrl", "authToken"], (data) => {
      resolve({
        webhookUrl: data.webhookUrl || "",
        authToken: data.authToken || ""
      });
    });
  });
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

function cleanWhitespace(text) {
  return text.replace(/\s+/g, " ").trim();
}

function extractPageContent() {
  const selection = window.getSelection ? window.getSelection().toString().trim() : "";

  // Google Docs special handling
  function tryGoogleDocs() {
    const host = location.hostname;
    if (host === "docs.google.com") {
      // Google Docs renders content in .kix-appview-editor or similar containers
      const editor = document.querySelector(".kix-appview-editor");
      if (editor) return editor.innerText.trim();
      // Fallback: try the script tag with document content
      const scripts = document.querySelectorAll("script");
      for (const s of scripts) {
        if (s.textContent.includes("DOCS_modelChunk")) {
          const match = s.textContent.match(/"s":"((?:[^"\\]|\\.)*)"/g);
          if (match) {
            return match.map(m => m.slice(4, -1).replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\\\/g, "\\").replace(/\\"/g, '"')).join("");
          }
        }
      }
      // Last resort: get all text from the page body editing area
      const pages = document.querySelectorAll(".kix-page");
      if (pages.length) {
        return Array.from(pages).map(p => p.innerText.trim()).join("\n\n");
      }
    }
    // Granola, Notion, and other SPA special handling
    if (host === "notes.granola.ai" || host === "www.notion.so") {
      const main = document.querySelector("main, [role='main'], article");
      if (main) return main.innerText.trim();
    }
    return null;
  }

  function removeNoise(root) {
    const selectors = [
      "script",
      "style",
      "noscript",
      "nav",
      "footer",
      "header",
      "aside",
      "form",
      "button",
      "input",
      "textarea",
      "svg",
      "canvas",
      "iframe",
      "[role='navigation']",
      "[role='banner']",
      "[role='contentinfo']",
      "[aria-hidden='true']",
      ".ad",
      ".ads",
      ".advert",
      ".advertisement",
      ".promo",
      ".subscribe",
      ".newsletter"
    ];
    selectors.forEach((selector) => {
      root.querySelectorAll(selector).forEach((node) => node.remove());
    });
  }

  function pickBestText(root) {
    const candidates = Array.from(
      root.querySelectorAll("article, main, [role='main'], section, div")
    );
    let bestText = "";
    let bestScore = 0;

    candidates.forEach((el) => {
      const text = el.innerText ? el.innerText.trim() : "";
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      const score = wordCount + Math.min(2000, text.length) / 10;
      if (score > bestScore && wordCount > 80) {
        bestScore = score;
        bestText = text;
      }
    });

    if (bestText) {
      return bestText;
    }
    return root.innerText || "";
  }

  // Try special handlers first (Google Docs, Granola, Notion, etc.)
  let content = tryGoogleDocs();

  if (!content) {
    const clone = document.body ? document.body.cloneNode(true) : document.documentElement.cloneNode(true);
    removeNoise(clone);
    content = pickBestText(clone);
    if (!content && document.body) {
      content = document.body.innerText || "";
    }
  }

  return {
    url: location.href,
    title: document.title || "Untitled",
    selection,
    content
  };
}

async function sendToWebhook() {
  setStatus("", "");
  sendBtn.disabled = true;

  const settings = await getSettings();
  if (!settings.webhookUrl) {
    setStatus("Set a webhook URL in Options first.", "error");
    sendBtn.disabled = false;
    return;
  }

  const tab = await getActiveTab();
  if (!tab || !tab.id) {
    setStatus("No active tab found.", "error");
    sendBtn.disabled = false;
    return;
  }

  let payload;
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractPageContent
    });

    payload = {
      url: result.url,
      title: result.title,
      content: cleanWhitespace(result.content || ""),
      selection: cleanWhitespace(result.selection || ""),
      message: messageEl.value.trim(),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    setStatus("Failed to read page content.", "error");
    sendBtn.disabled = false;
    return;
  }

  try {
    const res = await fetch(settings.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(settings.authToken ? { Authorization: `Bearer ${settings.authToken}` } : {})
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    setStatus("Sent to OpenClaw.", "ok");
    messageEl.value = "";
  } catch (error) {
    setStatus("Failed to send. Check webhook URL/token.", "error");
  } finally {
    sendBtn.disabled = false;
  }
}

sendBtn.addEventListener("click", () => {
  sendToWebhook();
});

optionsBtn.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

setStatus("Ready.");
