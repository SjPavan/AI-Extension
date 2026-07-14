/**
 * Message Filters & Processors
 * Advanced filtering, tagging, and categorization
 */

const MESSAGE_CATEGORIES = {
  question: { icon: "❓", color: "#3b82f6", label: "Question" },
  summary: { icon: "📋", color: "#8b5cf6", label: "Summary" },
  code: { icon: "<>", color: "#ec4899", label: "Code" },
  data: { icon: "📊", color: "#f59e0b", label: "Data" },
  error: { icon: "❌", color: "#ef4444", label: "Error" },
  success: { icon: "✅", color: "#10b981", label: "Success" },
  other: { icon: "💬", color: "#6b7280", label: "Other" }
};

class MessageProcessor {
  /**
   * Categorize message content
   */
  static categorizeMessage(text) {
    if (!text) return "other";

    const lower = text.toLowerCase();

    if (lower.includes("?")) return "question";
    if (lower.includes("error") || lower.includes("failed")) return "error";
    if (lower.includes("success") || lower.includes("completed"))
      return "success";
    if (
      lower.includes("```") ||
      lower.includes("function") ||
      lower.includes("const")
    )
      return "code";
    if (
      lower.includes("[")
      && lower.includes("]"))
      return "data";
    if (
      lower.includes("summary") ||
      lower.includes("overview") ||
      lower.includes("table")
    )
      return "summary";

    return "other";
  }

  /**
   * Tag message for categorization
   */
  static tagMessage(text) {
    const category = this.categorizeMessage(text);
    return MESSAGE_CATEGORIES[category];
  }

  /**
   * Extract key entities from message
   */
  static extractEntities(text) {
    if (!text) return [];

    const entities = {
      emails: (text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []),
      urls: (text.match(/https?:\/\/[^\s]+/g) || []),
      numbers: (text.match(/\b\d+(?:,\d{3})*(?:\.\d+)?\b/g) || []),
      mentions: (text.match(/@\w+/g) || [])
    };

    return entities;
  }

  /**
   * Sanitize message for display
   */
  static sanitize(text) {
    return text
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/["']/g, "&quot;")
      .substring(0, 5000); // Cap at 5000 chars
  }

  /**
   * Count tokens (rough estimate)
   */
  static estimateTokens(text) {
    return Math.ceil(text.split(/\s+/).length / 0.75);
  }

  /**
   * Detect sentiment (simple heuristic)
   */
  static detectSentiment(text) {
    const positive = /great|excellent|love|awesome|perfect|amazing/gi;
    const negative = /bad|terrible|hate|awful|horrible|worst/gi;
    const neutral = /ok|fine|normal|regular|usual/gi;

    const posCount = (text.match(positive) || []).length;
    const negCount = (text.match(negative) || []).length;
    const neuCount = (text.match(neutral) || []).length;

    if (posCount > negCount) return "positive";
    if (negCount > posCount) return "negative";
    if (neuCount > 0) return "neutral";
    return "unknown";
  }
}

export { MessageProcessor, MESSAGE_CATEGORIES };
