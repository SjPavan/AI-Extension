/**
 * Analytics & Conversation Templates Module
 * Tracks usage metrics and provides pre-built conversation starters
 */

const ANALYTICS_CONFIG = {
  STORAGE_KEY: "analytics",
  SESSION_KEY: "currentSession"
};

class AnalyticsTracker {
  constructor() {
    this.sessionStart = Date.now();
    this.messageCount = 0;
    this.apiCallCount = 0;
    this.errorCount = 0;
    this.totalApiTime = 0;
  }

  recordMessage() {
    this.messageCount++;
    this.save();
  }

  recordApiCall(duration) {
    this.apiCallCount++;
    this.totalApiTime += duration;
    this.save();
  }

  recordError() {
    this.errorCount++;
    this.save();
  }

  getStats() {
    const avgResponseTime = this.apiCallCount > 0 
      ? Math.round(this.totalApiTime / this.apiCallCount) 
      : 0;
    
    return {
      sessionDuration: Date.now() - this.sessionStart,
      messagesCount: this.messageCount,
      apiCallsCount: this.apiCallCount,
      errorsCount: this.errorCount,
      avgResponseTime: avgResponseTime,
      successRate: this.apiCallCount > 0 
        ? Math.round(((this.apiCallCount - this.errorCount) / this.apiCallCount) * 100)
        : 0
    };
  }

  save() {
    chrome.storage.local.set({
      [ANALYTICS_CONFIG.SESSION_KEY]: this.getStats()
    });
  }

  export() {
    const stats = this.getStats();
    const json = JSON.stringify(stats, null, 2);
    const link = document.createElement("a");
    link.setAttribute(
      "href",
      `data:application/json;charset=utf-8,${encodeURIComponent(json)}`
    );
    link.setAttribute("download", `sj_analytics_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}

const analytics = new AnalyticsTracker();

// Conversation Templates
const CONVERSATION_TEMPLATES = [
  {
    id: "business_research",
    title: "🏢 Business Research",
    description: "Extract company details, financials, and contacts",
    messages: [
      "Find company headquarters, employees, and revenue information",
      "Who are the key executives and board members?",
      "What are the recent news and announcements?"
    ]
  },
  {
    id: "content_analysis",
    title: "📰 Content Analysis",
    description: "Analyze and summarize web page content",
    messages: [
      "Summarize the main topics on this page",
      "Extract key facts and figures",
      "Identify the target audience and tone"
    ]
  },
  {
    id: "lead_generation",
    title: "👥 Lead Generation",
    description: "Find contact information and leads",
    messages: [
      "Find all email addresses on this page",
      "Extract phone numbers and addresses",
      "List all social media profiles mentioned"
    ]
  },
  {
    id: "competitor_analysis",
    title: "🎯 Competitor Analysis",
    description: "Analyze competitor offerings and positioning",
    messages: [
      "What products/services are offered?",
      "What is the pricing strategy?",
      "How do they compare to their competitors?"
    ]
  },
  {
    id: "seo_audit",
    title: "🔍 SEO Audit",
    description: "Analyze page for SEO optimization",
    messages: [
      "Extract meta titles and descriptions",
      "Identify header structure (H1, H2, H3)",
      "List all images and their alt text"
    ]
  }
];

function getTemplateById(id) {
  return CONVERSATION_TEMPLATES.find(t => t.id === id);
}

function startTemplate(templateId) {
  const template = getTemplateById(templateId);
  if (!template) return;

  // Clear chat and start with template messages
  chatHistory = [];
  hasContext = false;
  renderChatHistory();

  // Start with first message
  sendMessage(template.messages[0], `${template.title} - Step 1`);
}

export { analytics, CONVERSATION_TEMPLATES, getTemplateById, startTemplate };
