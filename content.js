// --- 1. GLOBALS & SETTINGS ---
let uiSettings = {
    btnSize: 56,
    opacity: 1,
    side: 'right'
};

function applySettingsToBtn(btnElement) {
    btnElement.style.width = `${uiSettings.btnSize}px`;
    btnElement.style.height = `${uiSettings.btnSize}px`;
    btnElement.style.opacity = uiSettings.opacity;
    
    // Reset positioning based on side
    if (uiSettings.side === 'left') {
        btnElement.style.right = 'auto';
        btnElement.style.left = '30px';
    } else {
        btnElement.style.left = 'auto';
        btnElement.style.right = '30px';
    }
    btnElement.style.top = 'auto';
    btnElement.style.bottom = '30px';
}

function applySettingsToPrompts() {
    let bottomOffset = 95; 
    document.querySelectorAll('.sj-floating-prompt').forEach((fBtn) => {
        fBtn.style.opacity = uiSettings.opacity;
        if (uiSettings.side === 'left') {
            fBtn.style.right = 'auto';
            fBtn.style.left = '30px';
        } else {
            fBtn.style.left = 'auto';
            fBtn.style.right = '30px';
        }
        fBtn.style.top = 'auto';
        fBtn.style.bottom = `${bottomOffset}px`;
        bottomOffset += 48;
    });
}

// Fetch initial settings
chrome.storage.local.get(['uiSettings'], function(result) {
    if (result.uiSettings) {
        uiSettings = { ...uiSettings, ...result.uiSettings };
    }
    applySettingsToBtn(document.getElementById('sj-powerup-btn'));
    applySettingsToPrompts();
});


// --- 2. BULLETPROOF DRAG LOGIC ---
function makeDraggable(element, clickCallback) {
    let startX, startY;
    let isDragging = false;

    element.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return; 
        startX = e.clientX;
        startY = e.clientY;
        isDragging = false;

        const offsetX = e.clientX - element.getBoundingClientRect().left;
        const offsetY = e.clientY - element.getBoundingClientRect().top;

        function onMouseMove(moveEvent) {
            // Pythagorean distance threshold: Move > 5px to trigger drag
            if (Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) > 5) {
                isDragging = true;
                element.style.cursor = 'grabbing';
                element.style.left = (moveEvent.clientX - offsetX) + 'px';
                element.style.top = (moveEvent.clientY - offsetY) + 'px';
                element.style.bottom = 'auto'; 
                element.style.right = 'auto';
            }
        }

        function onMouseUp(upEvent) {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            element.style.cursor = 'grab';
            
            // If we didn't drag far enough, it's a valid click!
            if (!isDragging && clickCallback) {
                clickCallback(upEvent);
            }
        }
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}

// --- 3. MAIN UI SETUP ---
// Remove old UI if extension reloads
document.querySelectorAll('#sj-powerup-btn, #sj-chat-container, .sj-floating-prompt').forEach(el => el.remove());

const btn = document.createElement('div');
btn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`; 
btn.id = 'sj-powerup-btn';
document.body.appendChild(btn);

const chatContainer = document.createElement('div');
chatContainer.id = 'sj-chat-container';
chatContainer.style.display = 'none';

chatContainer.innerHTML = `
    <div id="sj-chat-header">
        <div class="sj-header-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            <strong>SJ Power UP</strong>
        </div>
        <div class="sj-header-actions">
            <button id="sj-chat-export" title="Download as CSV">📥</button>
            <button id="sj-chat-clear" title="Clear Chat History">🔄</button>
            <button id="sj-chat-close" title="Close">✖</button>
        </div>
    </div>
    <div id="sj-chat-messages">
        <div class="sj-msg sj-msg-model">Greetings! I am active and connected.</div>
    </div>
    <div id="sj-chat-input-area">
        <input type="text" id="sj-chat-input" placeholder="Type a message or prompt...">
        <button id="sj-chat-send">➤</button>
    </div>
`;
document.body.appendChild(chatContainer);

let chatHistory = [];
let hasContext = false;
let autoCopyEnabled = false; 

chrome.storage.local.get(['autoCopy'], function(result) {
    autoCopyEnabled = result.autoCopy === true;
});

const messagesDiv = document.getElementById('sj-chat-messages');
const inputField = document.getElementById('sj-chat-input');

// Apply drag AND click logic to main button
makeDraggable(btn, () => {
    chatContainer.style.display = chatContainer.style.display === 'none' ? 'flex' : 'none';
});

document.getElementById('sj-chat-close').addEventListener('click', () => { chatContainer.style.display = 'none'; });
document.getElementById('sj-chat-clear').addEventListener('click', () => {
    chatHistory = []; hasContext = false;
    messagesDiv.innerHTML = '<div class="sj-msg sj-msg-model">Memory cleared. Ready for a new page.</div>';
});

// CSV Export Logic
document.getElementById('sj-chat-export').addEventListener('click', () => {
    const msgs = document.querySelectorAll('.sj-msg-model .sj-msg-content');
    if (msgs.length === 0) return;
    
    const lastMsg = msgs[msgs.length - 1].getAttribute('data-raw-text') || msgs[msgs.length - 1].innerText;
    let csv = "data:text/csv;charset=utf-8,";
    const rows = lastMsg.split('\n');
    let valid = false;

    rows.forEach(r => {
        if (r.trim().startsWith('|')) {
            valid = true;
            let clean = r.replace(/^\||\|$/g, '').trim(); 
            let cols = clean.split('|').map(c => `"${c.trim().replace(/"/g, '""')}"`);
            csv += cols.join(",") + "\r\n";
        }
    });

    if (!valid) { alert("No valid table data found to export."); return; }

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", "sj_data.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
});

// --- 4. FLOATING PROMPTS ---
function loadFloatingPrompts() {
    document.querySelectorAll('.sj-floating-prompt').forEach(el => el.remove());
    
    chrome.storage.local.get(['customPrompts'], function(result) {
        let prompts = result.customPrompts || [];
        
        // Ensure default DUAL prompts exist
        if (prompts.length === 0) {
            prompts = [
                {
                    title: "⚡ Quick Extract",
                    pinned: true,
                    text: "You are a Data Extraction Assistant. Analyze the provided website content and extract the business data points.\n\nSTRICT FORMATTING RULES:\n1. Do NOT use standard Markdown table syntax (do not use `|---|---|`).\n2. Format the output EXACTLY using the template below. Use a pipe `|` at the start, the bold category name, another pipe `|`, and then the extracted information.\n3. You MUST leave exactly one blank line between every category to create space.\n4. Capitalize The First Letter Of Every Single Word (Title Case).\n5. Use your AI reasoning skills for the best structural grammar and sentence formation.\n6. Output ONLY the requested format with no introductory or concluding text.\n\nREQUIRED OUTPUT TEMPLATE:\n| **Company Name** | [Value]\n\n| **Company Category** | [Value]\n\n| **Full Address** | [Value]\n\n| **Copyrights** | [Value]\n\n| **Industry** | [Value]\n\n| **Business Type** | [Value]\n\n| **AI Category** | [Value]\n\n| **Business Model** | [Value]\n\n| **Email Addresses** | [Value]\n\n| **Best Magazine Fit** | [Value]\n\n| **High Opens Category** | [Value]"
                },
                {
                    title: "🌐 Deep Extract (Web)",
                    pinned: true,
                    text: "[TRIGGER_WEB_SEARCH] You are a Data Extraction Assistant. Analyze the provided website content and external search context to extract business data.\n\nSTRICT FORMATTING RULES:\n1. Do NOT use standard Markdown table syntax (do not use `|---|---|`).\n2. Format the output EXACTLY using the template below. Use a pipe `|` at the start, the bold category name, another pipe `|`, and then the extracted information.\n3. You MUST leave exactly one blank line between every category to create space.\n4. Capitalize The First Letter Of Every Single Word (Title Case).\n5. Use your AI reasoning skills for the best structural grammar and sentence formation.\n6. Output ONLY the requested format with no introductory or concluding text.\n\nREQUIRED OUTPUT TEMPLATE:\n| **Company Name** | [Value]\n\n| **Company Category** | [Value]\n\n| **Full Address** | [Value]\n\n| **Copyrights** | [Value]\n\n| **Industry** | [Value]\n\n| **Business Type** | [Value]\n\n| **AI Category** | [Value]\n\n| **Business Model** | [Value]\n\n| **Email Addresses** | [Value]\n\n| **Best Magazine Fit** | [Value]\n\n| **High Opens Category** | [Value]"
                },
                {
                    title: "🔗 Extract Links",
                    pinned: true,
                    text: "You are a Link Extraction Assistant. Analyze the provided website context and extract every URL, web address, or link mentioned in the text.\n\nSTRICT FORMATTING RULES:\n1. Do NOT use standard Markdown table syntax (do not use `|---|---|`).\n2. Format the output EXACTLY using the template below. Use a pipe `|` at the start, bold the context/description of the link, add another pipe `|`, and then output the actual URL.\n3. You MUST leave exactly one blank line between every extracted link to create space.\n4. Output ONLY the requested format with no introductory or concluding text.\n5. If no explicit URLs are found, output: | **Status** | No explicit URLs found in the text.\n\nREQUIRED OUTPUT TEMPLATE:\n| **[Description or Context of Link 1]** | https://open.spotify.com/track/0Jlcvv8IykzHaSmj49uNW8\n\n| **[Description or Context of Link 2]** | https://www.youtube.com/watch?v=zTJNaZ9AgFE\n\n| **[Description or Context of Link 3]** | https://www.imdb.com/title/tt4922804/"
                }
            ];
            chrome.storage.local.set({customPrompts: prompts});
        }

        let bottomOffset = 95; 

        prompts.forEach((p, index) => {
            const fBtn = document.createElement('div');
            fBtn.className = 'sj-floating-prompt';
            fBtn.innerHTML = p.pinned ? `📌 ${p.title}` : p.title;
            if(p.pinned) fBtn.classList.add('sj-pinned-prompt');
            
            fBtn.style.opacity = uiSettings.opacity;
            if (uiSettings.side === 'left') {
                fBtn.style.right = 'auto';
                fBtn.style.left = '30px';
            } else {
                fBtn.style.left = 'auto';
                fBtn.style.right = '30px';
            }
            
            fBtn.style.bottom = `${bottomOffset}px`;
            fBtn.style.animationDelay = `${index * 0.1}s`; 
            
            makeDraggable(fBtn, () => {
                chatContainer.style.display = 'flex';
                sendMessage(p.text, p.title); 
            });
            
            document.body.appendChild(fBtn);
            bottomOffset += 48; 
        });
    });
}
loadFloatingPrompts();

chrome.storage.onChanged.addListener((changes) => {
    if (changes.customPrompts) loadFloatingPrompts();
    if (changes.autoCopy) autoCopyEnabled = changes.autoCopy.newValue;
    if (changes.uiSettings) {
        uiSettings = { ...uiSettings, ...changes.uiSettings.newValue };
        applySettingsToBtn(document.getElementById('sj-powerup-btn'));
        applySettingsToPrompts();
    }
});

// --- UI PARSER ---
function parseMarkdown(text) {
    if (!text) return "No response text found.";
    return text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
}

// --- 5. CHAT LOGIC ---
function appendMessage(text, sender, rawTextForCopy = null) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `sj-msg sj-msg-${sender}`;
    let htmlContent = sender === 'model' ? parseMarkdown(text) : text.replace(/\n/g, '<br>');
    
    msgDiv.innerHTML = `<div class="sj-msg-content" data-raw-text="${encodeURIComponent(rawTextForCopy || text)}">${htmlContent}</div>`;
    
    if (sender === 'model') {
        const copyBtn = document.createElement('div');
        copyBtn.className = 'sj-copy-btn';
        copyBtn.innerHTML = '📋';
        
        const executeCopy = () => {
            navigator.clipboard.writeText(rawTextForCopy || text).then(() => {
                copyBtn.innerHTML = '✅';
                setTimeout(() => copyBtn.innerHTML = '📋', 2000);
            });
        };
        copyBtn.onclick = executeCopy;
        msgDiv.appendChild(copyBtn);
        if (autoCopyEnabled) setTimeout(executeCopy, 500); 
    }

    messagesDiv.appendChild(msgDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    return msgDiv;
}

function sendMessage(userText, displayPrompt) {
    if (!userText.trim()) return;
    
    const isSearching = userText.includes("[TRIGGER_WEB_SEARCH]");
    
    appendMessage(displayPrompt || userText, 'user');
    inputField.value = '';

    let apiText = userText;
    if (!hasContext) {
        const pageLinks = Array.from(document.querySelectorAll('a'))
            .map(a => a.href)
            .filter(href => href.startsWith('http'))
            .slice(0, 30) 
            .join('\n');

        apiText = `Website Context:\n"""\n${document.title}\n\n${document.body.innerText.substring(0, 5000)}\n\nPAGE BACKEND LINKS:\n${pageLinks}\n"""\n\nUser Request: ${userText}`;
        hasContext = true;
    }

    chatHistory.push({ role: "user", text: apiText });
    
    const statusMsg = isSearching ? "Deep Searching Web & Extracting..." : "Quick Extracting Data...";
    const loadingBubble = appendMessage(statusMsg, "model");
    loadingBubble.classList.add('sj-pulse');

    chrome.runtime.sendMessage({action: "chat", history: chatHistory}, (response) => {
        loadingBubble.remove(); 
        
        if (chrome.runtime.lastError || !response) {
            appendMessage(`<span style="color:#ef4444;">System Error: Connection dropped. Please try again.</span>`, "model");
            chatHistory.pop(); hasContext = false; return;
        }
        
        if (response.error) {
            appendMessage(`<span style="color:#ef4444;">API Error:</span> ${response.error}`, "model");
            chatHistory.pop(); hasContext = false; 
        } else {
            appendMessage(response.text, "model", response.text); 
            chatHistory.push({ role: "model", text: response.text });
        }
    });
}

document.getElementById('sj-chat-send').addEventListener('click', () => sendMessage(inputField.value));
inputField.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(inputField.value); });