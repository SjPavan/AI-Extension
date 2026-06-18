# AI-Extension

Power Up AI Extension using NVIDIA API

AI-Extension is a browser extension that leverages local JavaScript and the NVIDIA API to accelerate AI-powered features in the browser. It includes a popup UI, content scripts that interact with web pages, and a background service to manage long-running tasks and API integration.

## Contents

- manifest.json — Extension manifest (permissions, scripts, metadata).
- background.js — Background service worker: coordinates API calls, manages state, and handles messaging between popup and content scripts.
- content.js — Content script injected into web pages: collects page context, injects UI elements, and communicates with the background script.
- popup.html — Popup user interface markup.
- popup.js — Popup logic: UI interactions, settings, and commands to invoke extension features.
- style.css — Styles for the popup and any injected UI components.
- SJ Power UP Tool Version 12.0.zip — Optional packaged assets or installer included by the author.

## Features

- Integrates with NVIDIA APIs to accelerate AI/ML operations from the browser.
- Popup UI for quick controls and settings.
- Content script support for page-aware features (text extraction, context-aware suggestions, UI injection).
- Background worker to handle network requests and long-running tasks reliably.

## Installation (for development)

1. Clone the repository or download the ZIP.
2. Open your browser's Extensions/Add-ons page and enable Developer Mode.
3. Click "Load unpacked" and select the repository folder.
4. The extension should appear in your toolbar; open the popup to configure settings.

Note: This project may require local NVIDIA API credentials or additional setup to use GPU-accelerated features. Follow any README or notes inside the ZIP for vendor-specific configuration.

## Contributing

Contributions, bug reports, and improvements are welcome. Open an issue or submit a pull request.

## License

Specify a license for this project (e.g., MIT) or add a LICENSE file to make the terms explicit.
