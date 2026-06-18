chrome.storage.local.get(['apiKey', 'apiProvider', 'autoCopy', 'uiSettings'], function(result) {
    if (result.apiKey) document.getElementById('apiKey').value = result.apiKey;
    if (result.apiProvider) document.getElementById('apiProvider').value = result.apiProvider;
    if (result.autoCopy !== undefined) document.getElementById('autoCopyToggle').checked = result.autoCopy;
    
    if (result.uiSettings) {
        document.getElementById('uiSize').value = result.uiSettings.btnSize || 56;
        document.getElementById('sizeVal').innerText = (result.uiSettings.btnSize || 56) + 'px';
        
        document.getElementById('uiOpacity').value = (result.uiSettings.opacity || 1) * 100;
        document.getElementById('opacVal').innerText = ((result.uiSettings.opacity || 1) * 100) + '%';
        
        if (result.uiSettings.side === 'left') {
            document.querySelector('input[name="uiSide"][value="left"]').checked = true;
        } else {
            document.querySelector('input[name="uiSide"][value="right"]').checked = true;
        }
    }
});

// Update UI Range labels dynamically
document.getElementById('uiSize').addEventListener('input', function() {
    document.getElementById('sizeVal').innerText = this.value + 'px';
});
document.getElementById('uiOpacity').addEventListener('input', function() {
    document.getElementById('opacVal').innerText = this.value + '%';
});

document.getElementById('saveBtn').addEventListener('click', () => {
    const key = document.getElementById('apiKey').value.trim();
    const provider = document.getElementById('apiProvider').value;
    const autoCopy = document.getElementById('autoCopyToggle').checked;
    
    const uiSettings = {
        btnSize: parseInt(document.getElementById('uiSize').value),
        opacity: parseInt(document.getElementById('uiOpacity').value) / 100,
        side: document.querySelector('input[name="uiSide"]:checked').value
    };
    
    chrome.storage.local.set({
        apiKey: key, 
        apiProvider: provider, 
        autoCopy: autoCopy,
        uiSettings: uiSettings
    }, function() {
        const status = document.getElementById('status');
        status.textContent = 'Configuration Saved!';
        status.style.display = 'block';
        setTimeout(() => status.style.display = 'none', 2000);
    });
});

const promptListDiv = document.getElementById('promptList');

function renderPrompts() {
    chrome.storage.local.get(['customPrompts'], function(result) {
        const prompts = result.customPrompts || [];
        promptListDiv.innerHTML = '';
        if (prompts.length === 0) {
            promptListDiv.innerHTML = '<p style="font-size: 12px; color: #94a3b8; text-align:center; margin: 10px 0;">No active prompts.</p>';
            return;
        }
        prompts.forEach((p, index) => {
            const item = document.createElement('div');
            item.className = `prompt-item ${p.pinned ? 'pinned' : ''}`;
            
            const pinBtn = document.createElement('button');
            pinBtn.className = `icon-btn ${p.pinned ? 'active' : ''}`;
            pinBtn.innerHTML = '📌';
            pinBtn.title = p.pinned ? "Unpin prompt" : "Pin prompt";
            pinBtn.onclick = () => togglePin(index);
            
            const titleSpan = document.createElement('span');
            titleSpan.className = 'prompt-title';
            titleSpan.textContent = p.title;
            titleSpan.title = p.text; 
            
            const delBtn = document.createElement('button');
            delBtn.className = 'icon-btn del-btn';
            delBtn.innerHTML = '🗑️';
            delBtn.title = "Delete prompt";
            delBtn.onclick = () => deletePrompt(index);
            
            item.appendChild(pinBtn);
            item.appendChild(titleSpan);
            item.appendChild(delBtn);
            promptListDiv.appendChild(item);
        });
    });
}

function togglePin(index) {
    chrome.storage.local.get(['customPrompts'], function(result) {
        let prompts = result.customPrompts || [];
        prompts[index].pinned = !prompts[index].pinned;
        chrome.storage.local.set({customPrompts: prompts}, () => renderPrompts());
    });
}

function deletePrompt(index) {
    chrome.storage.local.get(['customPrompts'], function(result) {
        let prompts = result.customPrompts || [];
        prompts.splice(index, 1); 
        chrome.storage.local.set({customPrompts: prompts}, () => renderPrompts());
    });
}

document.getElementById('addPromptBtn').addEventListener('click', () => {
    const title = document.getElementById('promptTitle').value.trim();
    const text = document.getElementById('promptText').value.trim();
    if (!title || !text) { alert("Please enter both a button name and the prompt text."); return; }
    chrome.storage.local.get(['customPrompts'], function(result) {
        let prompts = result.customPrompts || [];
        prompts.push({title: title, text: text, pinned: false});
        chrome.storage.local.set({customPrompts: prompts}, () => {
            document.getElementById('promptTitle').value = '';
            document.getElementById('promptText').value = '';
            renderPrompts();
        });
    });
});

renderPrompts();