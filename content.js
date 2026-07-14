/**
 * Enhanced Content Script
 * - Dark mode toggle
 * - Improved markdown parsing with code blocks
 * - Message search and filtering
 * - Persistent chat history
 * - Keyboard shortcuts
 * - Better error handling
 */

const CONFIG = {
  STORAGE_KEY: "chatHistory",
  MAX_HISTORY_MESSAGES: 500,
  AUTO_SAVE_INTERVAL: 5000
};

let uiSettings = {
  btnSize: 56,
  opacity: 1,
  side: "right",
  darkMode: false,
  autoSave: true
};

let chatHistory = [];
let hasContext = false;
let autoCopyEnabled = false;
let searchQuery = "";
let messageFilter = "all"; // all, user, model

/**
 * Advanced Markdown Parser
 */
function parseMarkdown(text) {
  if (!text) return "No response text found.";

  let html = text
    // Code blocks
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      const cleanCode = code.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return `<pre class="sj-code-block" data-lang="${lang || "text"}"><code>${cleanCode}</code></pre>`;
    })
    // Inline code
    .replace(/`([^`]+)`/g, "<code class='sj-inline-code'>$1</code>")
    // Bold
    .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
    // Italic
    .replace(/\*(.*?)\*/g, "<i>$1</i>")
    // Headers
    .replace(/^### (.*?)$/gm, "<h3 class='sj-h3'>$1</h3>")
    .replace(/^## (.*?)$/gm, "<h2 class='sj-h2'>$1</h2>")
    .replace(/^# (.*?)$/gm, "<h1 class='sj-h1'>$1</h1>")
    // Tables (simple pipe-delimited)
    .replace(/^\|(.*?)\|$/gm, "<tr class='sj-table-row'>" + 
      "$1".split("|").map(cell => `<td class='sj-table-cell'>${cell.trim()}</td>`).join("") + 
      "</tr>")
    // Lists
    .replace(/^- (.*?)$/gm, "<li class='sj-list-item'>$1</li>")
    // Line breaks
    .replace(/\n/g, "<br>");

  return html;
}

/**
 * Load chat history from storage
 */
async function loadChatHistory() {
  return new Promise(resolve => {
    chrome.storage.local.get([CONFIG.STORAGE_KEY], result => {
      chatHistory = result[CONFIG.STORAGE_KEY] || [];
      resolve(chatHistory);
    });
  });
}

/**
 * Save chat history to storage
 */
function saveChatHistory() {
  if (!uiSettings.autoSave) return;
  if (chatHistory.length > CONFIG.MAX_HISTORY_MESSAGES) {
    chatHistory = chatHistory.slice(-CONFIG.MAX_HISTORY_MESSAGES);
  }
  chrome.storage.local.set({ [CONFIG.STORAGE_KEY]: chatHistory });
}

/**
 * Auto-save chat history periodically
 */
setInterval(saveChatHistory, CONFIG.AUTO_SAVE_INTERVAL);

/**
 * Apply settings to UI elements
 */
function applySettingsToBtn(btnElement) {
  if (!btnElement) return;
  btnElement.style.width = `${uiSettings.btnSize}px`;
  btnElement.style.height = `${uiSettings.btnSize}px`;
  btnElement.style.opacity = uiSettings.opacity;

  if (uiSettings.side === "left") {
    btnElement.style.right = "auto";
    btnElement.style.left = "30px";
  } else {
    btnElement.style.left = "auto";
    btnElement.style.right = "30px";
  }
}

function applySettingsToPrompts() {
  let bottomOffset = 95;
  document.querySelectorAll(".sj-floating-prompt").forEach(fBtn => {
    fBtn.style.opacity = uiSettings.opacity;
    if (uiSettings.side === "left") {
      fBtn.style.right = "auto";
      fBtn.style.left = "30px";
    } else {
      fBtn.style.left = "auto";
      fBtn.style.right = "30px";
    }
    fBtn.style.bottom = `${bottomOffset}px`;
    bottomOffset += 48;
  });
}

function applyDarkMode(enabled) {
  const container = document.getElementById("sj-chat-container");
  if (!container) return;
  if (enabled) {
    container.classList.add("sj-dark-mode");
  } else {
    container.classList.remove("sj-dark-mode");
  }
}

/**
 * Fetch and apply initial settings
 */
chrome.storage.local.get(["uiSettings"], function(result) {
  if (result.uiSettings) {
    uiSettings = { ...uiSettings, ...result.uiSettings };
  }
  const btn = document.getElementById("sj-powerup-btn");
  if (btn) applySettingsToBtn(btn);
  applySettingsToPrompts();
  applyDarkMode(uiSettings.darkMode);
});

chrome.storage.local.get(["autoCopy"], function(result) {
  autoCopyEnabled = result.autoCopy === true;
});

/**
 * Enhanced draggable logic
 */
function makeDraggable(element, clickCallback) {
  let startX, startY;
  let isDragging = false;

  element.addEventListener("mousedown", e => {
    if (e.button !== 0) return;
    startX = e.clientX;
    startY = e.clientY;
    isDragging = false;

    const offsetX = e.clientX - element.getBoundingClientRect().left;
    const offsetY = e.clientY - element.getBoundingClientRect().top;

    function onMouseMove(moveEvent) {
      if (Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) > 5) {
        isDragging = true;
        element.style.cursor = "grabbing";
        element.style.left = moveEvent.clientX - offsetX + "px";
        element.style.top = moveEvent.clientY - offsetY + "px";
        element.style.bottom = "auto";
        element.style.right = "auto";
      }
    }

    function onMouseUp() {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      element.style.cursor = "grab";

      if (!isDragging && clickCallback) {
        clickCallback();
      }
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });
}

/**
 * Clean up old UI
 */
document
  .querySelectorAll("#sj-powerup-btn, #sj-chat-container, .sj-floating-prompt")
  .forEach(el => el.remove());

/**
 * Create main button
 */
const btn = document.createElement("div");
btn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`;
btn.id = "sj-powerup-btn";
document.body.appendChild(btn);

/**
 * Create chat container
 */
const chatContainer = document.createElement("div");
chatContainer.id = "sj-chat-container";
chatContainer.style.display = "none";

chatContainer.innerHTML = `
  <div id="sj-chat-header">
    <div class="sj-header-title">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
      <strong>SJ Power UP</strong>
    </div>
    <div class="sj-header-actions">
      <button id="sj-chat-search-btn" title="Search messages">🔍</button>
      <button id="sj-chat-dark-mode" title="Toggle dark mode">🌙</button>
      <button id="sj-chat-export" title="Download as CSV">📥</button>
      <button id="sj-chat-clear" title="Clear Chat History">🔄</button>
      <button id="sj-chat-close" title="Close">✖</button>
    </div>
  </div>
  <div id="sj-search-bar" style="display:none; padding: 12px; border-bottom: 1px solid #e2e8f0;">
    <input type="text" id="sj-search-input" placeholder="Search messages..." style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px;">
  </div>
  <div id="sj-chat-messages"></div>
  <div id="sj-chat-input-area">
    <input type="text" id="sj-chat-input" placeholder="Type a message or prompt...">
    <button id="sj-chat-send">➤</button>
  </div>
`;
document.body.appendChild(chatContainer);

const messagesDiv = document.getElementById("sj-chat-messages");
const inputField = document.getElementById("sj-chat-input");

/**
 * Append message to chat
 */
function appendMessage(text, sender, rawTextForCopy = null) {
  const msgDiv = document.createElement("div");
  msgDiv.className = `sj-msg sj-msg-${sender}`;
  const htmlContent =
    sender === "model" ? parseMarkdown(text) : text.replace(/\n/g, "<br>");

  msgDiv.innerHTML = `<div class="sj-msg-content" data-raw-text="${encodeURIComponent(
    rawTextForCopy || text
  )}">${htmlContent}</div>`;

  if (sender === "model") {
    const copyBtn = document.createElement("div");
    copyBtn.className = "sj-copy-btn";
    copyBtn.innerHTML = "📋";

    const executeCopy = () => {
      navigator.clipboard.writeText(rawTextForCopy || text).then(() => {
        copyBtn.innerHTML = "✅";
        setTimeout(() => (copyBtn.innerHTML = "📋"), 2000);
      });
    };
    copyBtn.onclick = executeCopy;
    msgDiv.appendChild(copyBtn);

    if (autoCopyEnabled) {
      setTimeout(executeCopy, 500);
    }
  }

  messagesDiv.appendChild(msgDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
  return msgDiv;
}

/**
 * Render chat history with optional filtering
 */
function renderChatHistory() {
  messagesDiv.innerHTML = "";
  if (chatHistory.length === 0) {
    messagesDiv.innerHTML =
      '<div style="text-align:center; color:#94a3b8; padding:20px;">No messages yet. Start a conversation!</div>';
    return;
  }

  chatHistory.forEach(msg => {
    // Apply filter
    if (messageFilter !== "all" && msg.role !== messageFilter) return;

    // Apply search
    if (searchQuery && !msg.text.toLowerCase().includes(searchQuery.toLowerCase()))
      return;

    appendMessage(msg.text, msg.role === "user" ? "user" : "model", msg.text);
  });
}

/**
 * Send message with enhanced error handling
 */
function sendMessage(userText, displayPrompt) {
  if (!userText.trim()) return;

  const isSearching = userText.includes("[TRIGGER_WEB_SEARCH]");

  appendMessage(displayPrompt || userText, "user");
  chatHistory.push({ role: "user", text: userText });
  inputField.value = "";

  let apiText = userText;
  if (!hasContext) {
    const pageLinks = Array.from(document.querySelectorAll("a"))
      .map(a => a.href)
      .filter(href => href.startsWith("http"))
      .slice(0, 30)
      .join("\n");

    apiText = `Website Context:\n"""\n${document.title}\n\n${document.body.innerText
      .substring(0, 5000)}\n\nPAGE BACKEND LINKS:\n${pageLinks}\n"""\n\nUser Request: ${userText}`;
    hasContext = true;
  }

  const statusMsg = isSearching
    ? "🔍 Deep Searching Web & Extracting..."
    : "⚡ Quick Extracting Data...";
  const loadingBubble = appendMessage(statusMsg, "model");
  loadingBubble.classList.add("sj-pulse");

  saveChatHistory();

  chrome.runtime.sendMessage(
    { action: "chat", history: chatHistory },
    response => {
      loadingBubble.remove();

      if (chrome.runtime.lastError || !response) {
        const errorMsg =
          '<span style="color:#ef4444;">⚠️ System Error: Connection dropped. Please try again.</span>';
        appendMessage(errorMsg, "model");
        chatHistory.pop();
        hasContext = false;
        saveChatHistory();
        return;
      }

      if (response.error) {
        const errorMsg = `<span style="color:#ef4444;">❌ API Error:</span> ${response.error}`;
        appendMessage(errorMsg, "model");
        chatHistory.pop();
        hasContext = false;
      } else {
        appendMessage(response.text, "model", response.text);
        chatHistory.push({ role: "model", text: response.text });
      }
      saveChatHistory();
    }
  );
}

/**
 * Export to CSV
 */
function exportToCSV() {
  if (chatHistory.length === 0) {
    alert("No messages to export.");
    return;
  }

  let csv = 'data:text/csv;charset=utf-8,"Sender","Message","Timestamp"\r\n';
  const now = new Date().toISOString();

  chatHistory.forEach(msg => {
    const sender = msg.role === "user" ? "User" : "AI";
    const text = msg.text.replace(/"/g, '""');
    csv += `"${sender}","${text}","${now}"\r\n`;
  });

  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csv));
  link.setAttribute("download", `sj_chat_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/**
 * Export to JSON
 */
function exportToJSON() {
  if (chatHistory.length === 0) {
    alert("No messages to export.");
    return;
  }

  const data = {
    exportedAt: new Date().toISOString(),
    messages: chatHistory
  };

  const json = JSON.stringify(data, null, 2);
  const link = document.createElement("a");
  link.setAttribute(
    "href",
    `data:text/json;charset=utf-8,${encodeURIComponent(json)}`
  );
  link.setAttribute("download", `sj_chat_${Date.now()}.json`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/**
 * Event listeners
 */
makeDraggable(btn, () => {
  chatContainer.style.display =
    chatContainer.style.display === "none" ? "flex" : "none";
  if (chatContainer.style.display === "flex") {
    loadChatHistory().then(() => renderChatHistory());
    inputField.focus();
  }
});

document.getElementById("sj-chat-close").addEventListener("click", () => {
  chatContainer.style.display = "none";
});

document.getElementById("sj-chat-clear").addEventListener("click", () => {
  if (confirm("Clear all chat history? This cannot be undone.")) {
    chatHistory = [];
    hasContext = false;
    saveChatHistory();
    renderChatHistory();
  }
});

// Dark mode toggle
document
  .getElementById("sj-chat-dark-mode")
  .addEventListener("click", () => {
    uiSettings.darkMode = !uiSettings.darkMode;
    applyDarkMode(uiSettings.darkMode);
    chrome.storage.local.set({ uiSettings });
  });

// Search toggle
document
  .getElementById("sj-chat-search-btn")
  .addEventListener("click", () => {
    const searchBar = document.getElementById("sj-search-bar");
    searchBar.style.display =
      searchBar.style.display === "none" ? "block" : "none";
    if (searchBar.style.display === "block") {
      document.getElementById("sj-search-input").focus();
    }
  });

// Search input
document.getElementById("sj-search-input").addEventListener("input", e => {
  searchQuery = e.target.value;
  renderChatHistory();
});

// Export button
document.getElementById("sj-chat-export").addEventListener("click", () => {
  const format = confirm("Export as JSON? (OK=JSON, Cancel=CSV)") ? "json" : "csv";
  if (format === "json") {
    exportToJSON();
  } else {
    exportToCSV();
  }
});

// Send message
document.getElementById("sj-chat-send").addEventListener("click", () => {
  sendMessage(inputField.value);
});

inputField.addEventListener("keypress", e => {
  if (e.key === "Enter") {
    sendMessage(inputField.value);
  }
});

/**
 * Keyboard shortcuts
 */
document.addEventListener("keydown", e => {
  // Alt+Space to toggle chat
  if (e.altKey && e.code === "Space") {
    e.preventDefault();
    chatContainer.style.display =
      chatContainer.style.display === "none" ? "flex" : "none";
  }
  // Ctrl+Shift+E to export
  if (e.ctrlKey && e.shiftKey && e.code === "KeyE") {
    e.preventDefault();
    exportToJSON();
  }
});

/**
 * Load floating prompts
 */
function loadFloatingPrompts() {
  document.querySelectorAll(".sj-floating-prompt").forEach(el => el.remove());

  chrome.storage.local.get(["customPrompts"], function(result) {
    let prompts = result.customPrompts || [];

    if (prompts.length === 0) {
      prompts = [
        {
          title: "⚡ Quick Extract",
          pinned: true,
          text: "You are a Data Extraction Assistant. Extract key business data points from the website content in a structured table format."
        },
        {
          title: "🌐 Deep Extract (Web)",
          pinned: true,
          text: "[TRIGGER_WEB_SEARCH] You are a Data Extraction Assistant. Analyze website content and external search context to extract comprehensive business data."
        },
        {
          title: "🔗 Extract Links",
          pinned: true,
          text: "Extract every URL, web address, and link mentioned in the provided content. Format as a clean list."
        }
      ];
      chrome.storage.local.set({ customPrompts: prompts });
    }

    let bottomOffset = 95;

    prompts.forEach((p, index) => {
      const fBtn = document.createElement("div");
      fBtn.className = "sj-floating-prompt";
      fBtn.innerHTML = p.pinned ? `📌 ${p.title}` : p.title;
      if (p.pinned) fBtn.classList.add("sj-pinned-prompt");

      fBtn.style.opacity = uiSettings.opacity;
      if (uiSettings.side === "left") {
        fBtn.style.right = "auto";
        fBtn.style.left = "30px";
      } else {
        fBtn.style.left = "auto";
        fBtn.style.right = "30px";
      }

      fBtn.style.bottom = `${bottomOffset}px`;
      fBtn.style.animationDelay = `${index * 0.1}s`;

      makeDraggable(fBtn, () => {
        chatContainer.style.display = "flex";
        loadChatHistory().then(() => {
          renderChatHistory();
          sendMessage(p.text, p.title);
        });
      });

      document.body.appendChild(fBtn);
      bottomOffset += 48;
    });
  });
}

loadFloatingPrompts();

/**
 * Storage change listener
 */
chrome.storage.onChanged.addListener(changes => {
  if (changes.customPrompts) loadFloatingPrompts();
  if (changes.autoCopy) autoCopyEnabled = changes.autoCopy.newValue;
  if (changes.uiSettings) {
    uiSettings = { ...uiSettings, ...changes.uiSettings.newValue };
    applySettingsToBtn(document.getElementById("sj-powerup-btn"));
    applySettingsToPrompts();
    applyDarkMode(uiSettings.darkMode);
  }
});

// Load chat history on page load
loadChatHistory();
