# Feature Documentation

## 🎨 UI/UX Features

### Dark Mode
**Location:** Popup Settings → Dark Mode toggle
**Keyboard:** `Ctrl+Shift+D`

Toggles the chat interface between light and dark themes:
- Automatically applies to all UI components
- Preserves setting across sessions
- Smooth CSS transitions
- Optimized colors for readability

### Message Search
**Location:** Chat Window → Search Icon (🔍)
**Keyboard:** `Ctrl+/`

Search all messages in real-time:
- Case-insensitive search
- Instant results as you type
- Filter by message type (User/AI)
- Highlights matching content

### Export Chat
**Location:** Chat Window → Export Icon (📥)
**Keyboard:** `Ctrl+Shift+E`

Export conversation in multiple formats:
- **JSON**: Full structure with metadata
- **CSV**: Spreadsheet-compatible format
- Both include timestamps

## ⚡ Performance Features

### Request Queue
Automatically manages multiple API requests:
- Prevents bottlenecks
- Rate limits at 10 req/min
- Max queue size: 50 requests
- Auto-processes in FIFO order

### Retry Logic
Automatic retry on API failures:
- Up to 3 retry attempts
- Exponential backoff strategy
- Detailed error messages
- Fallback provider support

### Response Caching
Caches API responses for 1 hour:
- Reduces redundant API calls
- Improves response time
- Automatic cleanup every 5 minutes
- Manual cache clear available

## 🚀 New Features

### Conversation Templates
**Location:** Floating Prompt Buttons

Pre-built conversation starters:
1. **Business Research** - Extract company data
2. **Content Analysis** - Summarize web pages
3. **Lead Generation** - Find contacts
4. **Competitor Analysis** - Market research
5. **SEO Audit** - Analyze page optimization

Click any template to start a guided conversation.

### Command Palette
**Keyboard:** `Ctrl+K`

Quick access to all commands:
- Export conversations
- Clear history
- Toggle settings
- Open preferences
- Search with fuzzy matching

### Analytics Dashboard
**Location:** Popup Settings (Session Stats tab)

Track usage metrics:
- Messages sent
- API calls made
- Average response time
- Success rate
- Session duration
- Export stats

### Prompt Editing
**Location:** Popup Settings → Active Prompts

Manage custom prompts:
- Edit existing prompts (✏️)
- Pin favorites (📌)
- Delete unused (🗑️)
- Real-time preview

## 🔧 Configuration

### UI Customization
**Settings available:**
- Button size: 40-80px (default: 56px)
- Opacity: 10-100% (default: 100%)
- Position: Left or Right (default: Right)
- Dark mode: On/Off (default: Off)
- Auto-save: On/Off (default: On)

### API Settings
**Configurable per provider:**
- API Key (required)
- Provider selection
- Max tokens per request
- Timeout duration
- Retry attempts

### Feature Toggles
- Auto-copy AI output to clipboard
- Web search integration (NVIDIA only)
- Analytics tracking
- Chat history persistence

## 📊 Advanced Settings

### Provider Comparison

| Provider | Speed | Cost | Best For |
|----------|-------|------|----------|
| NVIDIA | ⚡⚡⚡ | Free | General use |
| OpenAI | ⚡⚡ | $$$ | Advanced reasoning |
| Gemini | ⚡⚡⚡ | $$ | Vision & speed |
| Groq | ⚡⚡⚡⚡ | $ | Real-time |
| Anthropic | ⚡⚡ | $$$$ | Complex reasoning |

### Rate Limits by Provider
- NVIDIA: 100 req/min
- OpenAI: 90 req/min
- Gemini: 60 req/min
- Groq: 30 req/min
- Anthropic: 50 req/min

## 🎯 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt+Space` | Toggle chat window |
| `Ctrl+K` | Open command palette |
| `Ctrl+/` | Toggle search |
| `Ctrl+Shift+E` | Export as JSON |
| `Ctrl+Shift+D` | Toggle dark mode |
| `Ctrl+L` | Clear history |
| `Enter` | Send message |
| `Escape` | Close search/palette |

## 🔐 Security

### API Key Security
- Keys validated before storage
- Never logged or exposed
- Stored in Chrome local storage
- Only transmitted to official APIs

### Input Sanitization
- All user input cleaned
- XSS prevention
- HTML encoding in display
- URL validation

### Data Privacy
- No tracking or telemetry
- Chat history stored locally
- Optional analytics (user choice)
- No external data transmission

## ⚙️ System Requirements

- Chrome 90+
- 50MB free storage
- Stable internet connection
- Valid API key for chosen provider

## 🐛 Troubleshooting

### Chat not responding
1. Check API key validity
2. Verify internet connection
3. Check provider status
4. Clear cache (Ctrl+L)
5. Reload extension

### Slow responses
1. Check queue status
2. Reduce message length
3. Switch to faster provider (Groq)
4. Disable search integration
5. Check system resources

### Settings not saving
1. Check storage quota
2. Verify permissions
3. Clear browser cache
4. Restart browser
5. Reinstall extension

## 📞 Support

For issues or feature requests:
1. Check GitHub Issues
2. Review documentation
3. Check troubleshooting guide
4. File a new issue with details
