/**
 * Keyboard Shortcuts & Command Palette
 * Advanced hotkey system and command interface
 */

const KEYBOARD_SHORTCUTS = {
  "Alt+Space": { action: "toggle_chat", description: "Toggle chat window" },
  "Ctrl+Shift+E": {
    action: "export_json",
    description: "Export chat as JSON"
  },
  "Ctrl+K": { action: "open_commands", description: "Open command palette" },
  "Ctrl+/": { action: "toggle_search", description: "Toggle message search" },
  "Ctrl+Shift+D": {
    action: "toggle_dark_mode",
    description: "Toggle dark mode"
  },
  "Ctrl+L": { action: "clear_chat", description: "Clear chat history" }
};

class CommandPalette {
  constructor() {
    this.commands = [
      {
        id: "export_json",
        name: "Export as JSON",
        category: "Export",
        action: () => exportToJSON()
      },
      {
        id: "export_csv",
        name: "Export as CSV",
        category: "Export",
        action: () => exportToCSV()
      },
      {
        id: "export_pdf",
        name: "Export as PDF",
        category: "Export",
        action: () => exportToPDF()
      },
      {
        id: "clear_history",
        name: "Clear Chat History",
        category: "Chat",
        action: () => clearChatHistory()
      },
      {
        id: "toggle_dark_mode",
        name: "Toggle Dark Mode",
        category: "Settings",
        action: () => toggleDarkMode()
      },
      {
        id: "settings",
        name: "Open Settings",
        category: "Settings",
        action: () => openSettings()
      }
    ];
    this.visible = false;
  }

  /**
   * Render command palette
   */
  render() {
    if (this.visible) this.close();

    const palette = document.createElement("div");
    palette.id = "sj-command-palette";
    palette.innerHTML = `
      <div class="sj-palette-container">
        <input 
          type="text" 
          id="sj-palette-input" 
          placeholder="Type command or @ to search..."
          autofocus
        >
        <div id="sj-palette-results"></div>
      </div>
    `;

    document.body.appendChild(palette);
    this.visible = true;

    const input = document.getElementById("sj-palette-input");
    const results = document.getElementById("sj-palette-results");

    input.addEventListener("input", e => this.filterCommands(e.target.value, results));
    input.addEventListener("keydown", e => {
      if (e.key === "Escape") this.close();
    });
  }

  /**
   * Filter and display commands
   */
  filterCommands(query, resultsDiv) {
    const filtered = this.commands.filter(cmd =>
      cmd.name.toLowerCase().includes(query.toLowerCase())
    );

    resultsDiv.innerHTML = filtered
      .map(
        (cmd, i) => `
        <div class="sj-palette-item" data-index="${i}">
          <div class="sj-palette-name">${cmd.name}</div>
          <div class="sj-palette-category">${cmd.category}</div>
        </div>
      `
      )
      .join("");

    // Add click handlers
    resultsDiv.querySelectorAll(".sj-palette-item").forEach((item, i) => {
      item.addEventListener("click", () => {
        filtered[i].action();
        this.close();
      });
    });
  }

  /**
   * Close palette
   */
  close() {
    const palette = document.getElementById("sj-command-palette");
    if (palette) palette.remove();
    this.visible = false;
  }
}

const commandPalette = new CommandPalette();

export { KEYBOARD_SHORTCUTS, commandPalette };
