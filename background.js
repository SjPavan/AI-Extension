/**
 * Enhanced Background Service Worker
 * - Multi-provider API routing with retry logic
 * - Request queuing and deduplication
 * - Timeout management and cancellation
 * - Response caching
 * - Silent Google Search scraping with fallback
 */

const CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_BACKOFF: 1000,
  REQUEST_TIMEOUT: 30000,
  CACHE_TTL: 3600000, // 1 hour
  MAX_QUEUE_SIZE: 50,
  RATE_LIMIT_PER_MINUTE: 10
};

class RequestQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.rateLimitTracker = [];
  }

  isRateLimited() {
    const now = Date.now();
    this.rateLimitTracker = this.rateLimitTracker.filter(t => now - t < 60000);
    return this.rateLimitTracker.length >= CONFIG.RATE_LIMIT_PER_MINUTE;
  }

  addRequest(request, sendResponse) {
    if (this.queue.length >= CONFIG.MAX_QUEUE_SIZE) {
      sendResponse({ error: "Request queue full. Please try again in a moment." });
      return;
    }
    this.queue.push({ request, sendResponse, timestamp: Date.now() });
    this.process();
  }

  async process() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    while (this.queue.length > 0) {
      if (this.isRateLimited()) {
        console.log("Rate limit reached. Pausing queue processing.");
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      const { request, sendResponse, timestamp } = this.queue.shift();
      this.rateLimitTracker.push(timestamp);

      try {
        const result = await handleChatRequest(request);
        sendResponse(result);
      } catch (error) {
        sendResponse({ error: error.message });
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.processing = false;
  }
}

const requestQueue = new RequestQueue();
const responseCache = new Map();

/**
 * Generate cache key from request
 */
function getCacheKey(request) {
  const lastMsg = request.history[request.history.length - 1]?.text || "";
  const provider = request.provider || "nvidia";
  return `${provider}:${lastMsg.substring(0, 100)}`;
}

/**
 * Check if response is in cache and not expired
 */
function getCachedResponse(key) {
  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.timestamp < CONFIG.CACHE_TTL) {
    console.log("Returning cached response");
    return cached.data;
  }
  responseCache.delete(key);
  return null;
}

/**
 * Silent Google Search scraper with enhanced parsing
 */
async function fetchWebSearchData(query) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(
      `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=en`,
      { signal: controller.signal, headers: { "User-Agent": "Mozilla/5.0" } }
    );
    clearTimeout(timeoutId);

    if (!response.ok) return "";

    const text = await response.text();
    const snippets = [];

    // Multiple regex patterns for robustness
    const patterns = [
      /<div[^>]*class="[^"]*(?:VwiC3b|BNeawe|yXK7lf)[^"]*"[^>]*>(.*?)<\/div>/gs,
      /<span[^>]*>(.*?)<\/span>/gs
    ];

    for (const regex of patterns) {
      let match;
      let count = 0;
      while ((match = regex.exec(text)) !== null && count < 4 && snippets.length < 4) {
        let cleanSnippet = match[1]
          .replace(/<\/?b>/g, "")
          .replace(/<[^>]+>/g, "")
          .trim();
        if (cleanSnippet.length > 30 && !snippets.includes(cleanSnippet)) {
          snippets.push(cleanSnippet);
          count++;
        }
      }
      if (snippets.length >= 3) break;
    }

    return snippets.slice(0, 4).join(" | ");
  } catch (e) {
    console.warn("Web search failed:", e.message);
    return "";
  }
}

/**
 * Retry logic with exponential backoff
 */
async function retryWithBackoff(fn, retries = CONFIG.MAX_RETRIES) {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < retries - 1) {
        const backoff = CONFIG.INITIAL_BACKOFF * Math.pow(2, i);
        console.log(`Retry ${i + 1}/${retries} after ${backoff}ms:`, error.message);
        await new Promise(resolve => setTimeout(resolve, backoff));
      }
    }
  }
  throw lastError;
}

/**
 * Timeout wrapper for fetch
 */
async function fetchWithTimeout(url, options, timeout = CONFIG.REQUEST_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * Main chat request handler with enhanced error handling
 */
async function handleChatRequest(request) {
  const data = await chrome.storage.local.get(["apiKey", "apiProvider"]);
  const apiKey = data.apiKey;
  const provider = data.apiProvider || "nvidia";

  if (!apiKey) {
    throw new Error(
      "API Key is missing. Please configure it in the extension settings."
    );
  }

  // Check cache first
  const cacheKey = getCacheKey(request);
  const cachedResponse = getCachedResponse(cacheKey);
  if (cachedResponse) return cachedResponse;

  const userMsg = request.history[request.history.length - 1].text;
  let searchContext = "";

  // Trigger web search only with explicit tag
  if (userMsg.includes("[TRIGGER_WEB_SEARCH]")) {
    const titleMatch = userMsg.match(/Website Context:\n"""\n(.*?)\n/);
    let companyQuery = "company";
    if (titleMatch && titleMatch[1]) {
      companyQuery = titleMatch[1]
        .substring(0, 50)
        .replace(/[^a-zA-Z0-9 ]/g, " ")
        .trim();
    }

    const searchResults = await fetchWebSearchData(
      `${companyQuery} headquarters address parent company info`
    );
    if (searchResults) {
      searchContext = `\n\n[EXTERNAL GOOGLE SEARCH RESULTS]:\n${searchResults}`;
    }
  }

  const finalHistory = [...request.history];
  finalHistory[finalHistory.length - 1].text = finalHistory[
    finalHistory.length - 1
  ].text.replace("[TRIGGER_WEB_SEARCH]", "");

  if (searchContext)
    finalHistory[finalHistory.length - 1].text += searchContext;

  let endpoint = "";
  let headers = { "Content-Type": "application/json" };
  let body = {};

  if (provider === "nvidia") {
    endpoint = "https://integrate.api.nvidia.com/v1/chat/completions";
    headers["Authorization"] = `Bearer ${apiKey}`;
    body = {
      model: "meta/llama-3.1-8b-instruct",
      messages: finalHistory.map(msg => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.text
      })),
      max_tokens: 2048,
      temperature: 0.7
    };
  } else if (provider === "gemini") {
    endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    body = {
      contents: finalHistory.map(msg => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.text }]
      }))
    };
  } else if (provider === "openai") {
    endpoint = "https://api.openai.com/v1/chat/completions";
    headers["Authorization"] = `Bearer ${apiKey}`;
    body = {
      model: "gpt-4o-mini",
      messages: finalHistory.map(msg => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.text
      })),
      temperature: 0.7
    };
  } else if (provider === "groq") {
    endpoint = "https://api.groq.com/openai/v1/chat/completions";
    headers["Authorization"] = `Bearer ${apiKey}`;
    body = {
      model: "llama3-8b-8192",
      messages: finalHistory.map(msg => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.text
      })),
      temperature: 0.7
    };
  } else if (provider === "anthropic") {
    endpoint = "https://api.anthropic.com/v1/messages";
    headers["x-api-key"] = apiKey;
    headers["anthropic-version"] = "2023-06-01";
    body = {
      model: "claude-3-haiku-20240307",
      max_tokens: 2048,
      messages: finalHistory.map(msg => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.text
      }))
    };
  }

  // Retry logic wrapper
  const response = await retryWithBackoff(async () => {
    return fetchWithTimeout(endpoint, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body)
    });
  });

  const respData = await response.json();

  if (!response.ok || respData.error) {
    const errorMsg =
      respData.error?.message ||
      respData.error?.err?.message ||
      respData.error ||
      `HTTP ${response.status}`;
    throw new Error(errorMsg);
  }

  let extractedText = "";
  if (provider === "gemini") {
    extractedText = respData.candidates[0].content.parts[0].text;
  } else if (provider === "anthropic") {
    extractedText = respData.content[0].text;
  } else {
    extractedText = respData.choices[0].message.content;
  }

  const result = { text: extractedText };

  // Cache the response
  responseCache.set(cacheKey, {
    data: result,
    timestamp: Date.now()
  });

  return result;
}

// Master Listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "chat") {
    requestQueue.addRequest(request, sendResponse);
    return true; // Keep channel open for async response
  }
});

// Periodic cache cleanup
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of responseCache.entries()) {
    if (now - value.timestamp > CONFIG.CACHE_TTL) {
      responseCache.delete(key);
    }
  }
}, 300000); // Every 5 minutes
