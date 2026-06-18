// Silent Google Search scraper
async function fetchWebSearchData(query) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); 

    try {
        const response = await fetch(`https://www.google.com/search?q=${encodeURIComponent(query)}&hl=en`, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) return ""; 
        
        const text = await response.text();
        const snippets = [];
        
        const regex = /<div[^>]*class="[^"]*(VwiC3b|BNeawe|yXK7lf)[^"]*"[^>]*>(.*?)<\/div>/gs;
        let match;
        let count = 0;
        
        while ((match = regex.exec(text)) !== null && count < 4) {
            let cleanSnippet = match[2].replace(/<\/?b>/g, '').replace(/<[^>]+>/g, '').trim();
            if (cleanSnippet.length > 30) {
                snippets.push(cleanSnippet);
                count++;
            }
        }
        return snippets.join(" | ");
    } catch (e) {
        return ""; 
    }
}

// Modern MV3 Async Handler
async function handleChatRequest(request) {
    const data = await chrome.storage.local.get(['apiKey', 'apiProvider']);
    const apiKey = data.apiKey;
    const provider = data.apiProvider || 'nvidia';

    if (!apiKey) throw new Error("API Key is missing. Please configure it in the extension menu.");

    const userMsg = request.history[request.history.length - 1].text;
    let searchContext = "";

    // ONLY trigger search if the user prompt explicitly contains our secret trigger tag
    if (userMsg.includes("[TRIGGER_WEB_SEARCH]")) {
        const titleMatch = userMsg.match(/Website Context:\n"""\n(.*?)\n/);
        let companyQuery = "company";
        if (titleMatch && titleMatch[1]) {
            companyQuery = titleMatch[1].substring(0, 50).replace(/[^a-zA-Z0-9 ]/g, " ").trim();
        }
        
        const searchResults = await fetchWebSearchData(`${companyQuery} headquarters address parent company info`);
        if (searchResults) {
            searchContext = `\n\n[EXTERNAL GOOGLE SEARCH RESULTS TO HELP FILL GAPS]:\n${searchResults}`;
        }
    }

    const finalHistory = [...request.history];
    // Clean out the secret tag before sending to the AI
    finalHistory[finalHistory.length - 1].text = finalHistory[finalHistory.length - 1].text.replace("[TRIGGER_WEB_SEARCH]", "");
    
    if (searchContext) finalHistory[finalHistory.length - 1].text += searchContext;

    let endpoint = "";
    let headers = { "Content-Type": "application/json" };
    let body = {};

    if (provider === 'nvidia') {
        endpoint = "https://integrate.api.nvidia.com/v1/chat/completions";
        headers["Authorization"] = `Bearer ${apiKey}`;
        body = {
            model: "meta/llama-3.1-8b-instruct", 
            messages: finalHistory.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.text
            })),
            max_tokens: 2048
        };
    } else if (provider === 'gemini') {
        endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        body = {
            contents: finalHistory.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }))
        };
    } else if (provider === 'openai') {
        endpoint = "https://api.openai.com/v1/chat/completions";
        headers["Authorization"] = `Bearer ${apiKey}`;
        body = {
            model: "gpt-4o-mini",
            messages: finalHistory.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.text
            }))
        };
    } else if (provider === 'groq') {
        endpoint = "https://api.groq.com/openai/v1/chat/completions";
        headers["Authorization"] = `Bearer ${apiKey}`;
        body = {
            model: "llama3-8b-8192", 
            messages: finalHistory.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.text
            }))
        };
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
    });

    const respData = await response.json();

    if (!response.ok || respData.error) {
        throw new Error(respData.error?.message || respData.error?.err?.message || respData.error || `HTTP ${response.status}`);
    }

    let extractedText = "";
    if (provider === 'gemini') {
        extractedText = respData.candidates[0].content.parts[0].text;
    } else {
        extractedText = respData.choices[0].message.content;
    }

    return { text: extractedText };
}

// Master Listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "chat") {
        handleChatRequest(request)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ error: error.message }));
        return true; 
    }
});