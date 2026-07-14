/**
 * Enhanced Popup Script
 * - Settings management with validation
 * - Custom prompt management (add, edit, pin, delete)
 * - UI customization (size, opacity, position, dark mode)
 * - API provider selection
 */

/**
 * Load settings from storage and populate UI
 */
function loadSettings() {
  chrome.storage.local.get(
    ["apiKey", "apiProvider", "autoCopy", "uiSettings"],
    function(result) {
      if (result.apiKey) {
        document.getElementById("apiKey").value = result.apiKey;
      }
      if (result.apiProvider) {
        document.getElementById("apiProvider").value = result.apiProvider;
      }
      if (result.autoCopy !== undefined) {
        document.getElementById("autoCopyToggle").checked = result.autoCopy;
      }

      if (result.uiSettings) {
        document.getElementById("uiSize").value = result.uiSettings.btnSize || 56;
        document.getElementById("sizeVal").innerText =
          (result.uiSettings.btnSize || 56) + "px";

        document.getElementById("uiOpacity").value =
          (result.uiSettings.opacity || 1) * 100;
        document.getElementById("opacVal").innerText =
          (result.uiSettings.opacity || 1) * 100 + "%";

        if (result.uiSettings.side === "left") {
          document.querySelector('input[name="uiSide"][value="left"]').checked = true;
        } else {
          document.querySelector('input[name="uiSide"][value="right"]').checked = true;
        }

        document.getElementById("autoSaveToggle").checked =
          result.uiSettings.autoSave !== false;
        document.getElementById("darkModeToggle").checked =
          result.uiSettings.darkMode === true;
      }
    }
  );
}

/**
 * Update UI range labels
 */
document.getElementById("uiSize").addEventListener("input", function() {
  document.getElementById("sizeVal").innerText = this.value + "px";
});

document.getElementById("uiOpacity").addEventListener("input", function() {
  document.getElementById("opacVal").innerText = this.value + "%";
});

/**
 * Save settings
 */
document.getElementById("saveBtn").addEventListener("click", () => {
  const key = document.getElementById("apiKey").value.trim();
  const provider = document.getElementById("apiProvider").value;
  const autoCopy = document.getElementById("autoCopyToggle").checked;
  const autoSave = document.getElementById("autoSaveToggle").checked;
  const darkMode = document.getElementById("darkModeToggle").checked;

  if (!key) {
    showStatus("Please enter an API key.", "error");
    return;
  }

  const uiSettings = {
    btnSize: parseInt(document.getElementById("uiSize").value),
    opacity: parseInt(document.getElementById("uiOpacity").value) / 100,
    side: document.querySelector('input[name="uiSide"]:checked').value,
    autoSave: autoSave,
    darkMode: darkMode
  };

  chrome.storage.local.set(
    {
      apiKey: key,
      apiProvider: provider,
      autoCopy: autoCopy,
      uiSettings: uiSettings
    },
    function() {
      showStatus("Configuration saved successfully!", "success");
      setTimeout(loadSettings, 500);
    }
  );
});

/**
 * Show status message
 */
function showStatus(message, type = "success") {
  const status = document.getElementById("status");
  status.textContent = message;
  status.className = `sj-status sj-status-${type}`;
  status.style.display = "block";
  setTimeout(() => (status.style.display = "none"), 3000);
}

/**
 * Prompt management
 */
const promptListDiv = document.getElementById("promptList");

function renderPrompts() {
  chrome.storage.local.get(["customPrompts"], function(result) {
    const prompts = result.customPrompts || [];
    promptListDiv.innerHTML = "";

    if (prompts.length === 0) {
      promptListDiv.innerHTML =
        '<p style="font-size: 12px; color: #94a3b8; text-align:center; margin: 10px 0;">No active prompts.</p>';
      return;
    }

    prompts.forEach((p, index) => {
      const item = document.createElement("div");
      item.className = `prompt-item ${p.pinned ? "pinned" : ""}`;

      // Pin button
      const pinBtn = document.createElement("button");
      pinBtn.className = `icon-btn ${p.pinned ? "active" : ""}`;
      pinBtn.innerHTML = "📌";
      pinBtn.title = p.pinned ? "Unpin prompt" : "Pin prompt";
      pinBtn.onclick = () => togglePin(index);

      // Title
      const titleSpan = document.createElement("span");
      titleSpan.className = "prompt-title";
      titleSpan.textContent = p.title;
      titleSpan.title = p.text;

      // Edit button
      const editBtn = document.createElement("button");
      editBtn.className = "icon-btn edit-btn";
      editBtn.innerHTML = "✏️";
      editBtn.title = "Edit prompt";
      editBtn.onclick = () => editPrompt(index);

      // Delete button
      const delBtn = document.createElement("button");
      delBtn.className = "icon-btn del-btn";
      delBtn.innerHTML = "🗑️";
      delBtn.title = "Delete prompt";
      delBtn.onclick = () => deletePrompt(index);

      item.appendChild(pinBtn);
      item.appendChild(titleSpan);
      item.appendChild(editBtn);
      item.appendChild(delBtn);
      promptListDiv.appendChild(item);
    });
  });
}

function togglePin(index) {
  chrome.storage.local.get(["customPrompts"], function(result) {
    let prompts = result.customPrompts || [];
    if (prompts[index]) {
      prompts[index].pinned = !prompts[index].pinned;
      chrome.storage.local.set({ customPrompts: prompts }, () => renderPrompts());
    }
  });
}

function editPrompt(index) {
  chrome.storage.local.get(["customPrompts"], function(result) {
    const prompts = result.customPrompts || [];
    const prompt = prompts[index];

    document.getElementById("promptTitle").value = prompt.title;
    document.getElementById("promptText").value = prompt.text;

    // Change button text and behavior
    const addBtn = document.getElementById("addPromptBtn");
    const originalText = addBtn.textContent;
    addBtn.textContent = "Update Prompt";

    addBtn.onclick = () => {
      const title = document.getElementById("promptTitle").value.trim();
      const text = document.getElementById("promptText").value.trim();

      if (!title || !text) {
        showStatus("Please enter both button name and prompt text.", "error");
        return;
      }

      prompts[index] = { ...prompts[index], title, text };
      chrome.storage.local.set({ customPrompts: prompts }, () => {
        document.getElementById("promptTitle").value = "";
        document.getElementById("promptText").value = "";
        addBtn.textContent = originalText;
        addBtn.onclick = null; // Reset to default
        renderPrompts();
        showStatus("Prompt updated successfully!", "success");
      });
    };
  });
}

function deletePrompt(index) {
  if (!confirm("Delete this prompt?")) return;

  chrome.storage.local.get(["customPrompts"], function(result) {
    let prompts = result.customPrompts || [];
    prompts.splice(index, 1);
    chrome.storage.local.set({ customPrompts: prompts }, () => {
      renderPrompts();
      showStatus("Prompt deleted.", "success");
    });
  });
}

/**
 * Add new prompt
 */
function resetAddPromptButton() {
  const addBtn = document.getElementById("addPromptBtn");
  addBtn.textContent = "Add Quick Prompt";
  addBtn.onclick = addPrompt;
}

function addPrompt() {
  const title = document.getElementById("promptTitle").value.trim();
  const text = document.getElementById("promptText").value.trim();

  if (!title || !text) {
    showStatus("Please enter both button name and prompt text.", "error");
    return;
  }

  chrome.storage.local.get(["customPrompts"], function(result) {
    let prompts = result.customPrompts || [];
    prompts.push({ title: title, text: text, pinned: false });
    chrome.storage.local.set({ customPrompts: prompts }, () => {
      document.getElementById("promptTitle").value = "";
      document.getElementById("promptText").value = "";
      renderPrompts();
      showStatus("Prompt added successfully!", "success");
    });
  });
}

document.getElementById("addPromptBtn").addEventListener("click", addPrompt);

// Initialize
loadSettings();
renderPrompts();
