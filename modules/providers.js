/**
 * AI Providers Configuration & Management
 * Centralized provider configuration with fallback support
 */

const AI_PROVIDERS = {
  nvidia: {
    name: "NVIDIA NIM",
    endpoint: "https://integrate.api.nvidia.com/v1/chat/completions",
    model: "meta/llama-3.1-8b-instruct",
    maxTokens: 2048,
    features: ["web_search", "streaming"],
    rateLimit: 100,
    costPer1kTokens: 0.00,
    description: "Fast open-source model with web search integration"
  },
  openai: {
    name: "OpenAI GPT-4o Mini",
    endpoint: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4o-mini",
    maxTokens: 2048,
    features: ["streaming", "vision"],
    rateLimit: 90,
    costPer1kTokens: 0.15,
    description: "Advanced GPT-4 capabilities with vision support"
  },
  gemini: {
    name: "Google Gemini",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
    model: "gemini-1.5-flash",
    maxTokens: 4096,
    features: ["vision", "streaming"],
    rateLimit: 60,
    costPer1kTokens: 0.075,
    description: "Fast and cost-effective with multimodal support"
  },
  groq: {
    name: "Groq Llama 3",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    model: "llama3-8b-8192",
    maxTokens: 8192,
    features: ["streaming", "fast"],
    rateLimit: 30,
    costPer1kTokens: 0.05,
    description: "Lightning-fast inference engine"
  },
  anthropic: {
    name: "Anthropic Claude",
    endpoint: "https://api.anthropic.com/v1/messages",
    model: "claude-3-haiku-20240307",
    maxTokens: 4096,
    features: ["reasoning", "streaming"],
    rateLimit: 50,
    costPer1kTokens: 0.25,
    description: "Advanced reasoning and long-context understanding"
  }
};

class ProviderManager {
  constructor() {
    this.activeProvider = "nvidia";
    this.fallbackProviders = ["openai", "gemini"];
  }

  /**
   * Get provider configuration
   */
  getProvider(name) {
    return AI_PROVIDERS[name];
  }

  /**
   * Get all providers
   */
  getAllProviders() {
    return AI_PROVIDERS;
  }

  /**
   * Get provider features
   */
  getFeatures(providerName) {
    const provider = this.getProvider(providerName);
    return provider?.features || [];
  }

  /**
   * Check if provider supports feature
   */
  supportsFeature(providerName, feature) {
    const features = this.getFeatures(providerName);
    return features.includes(feature);
  }

  /**
   * Get cost estimate
   */
  estimateCost(providerName, tokenCount) {
    const provider = this.getProvider(providerName);
    if (!provider) return 0;
    return (tokenCount / 1000) * provider.costPer1kTokens;
  }

  /**
   * Get fallback provider
   */
  getFallbackProvider() {
    for (const provider of this.fallbackProviders) {
      if (provider !== this.activeProvider) {
        return provider;
      }
    }
    return null;
  }

  /**
   * Set active provider
   */
  setActiveProvider(providerName) {
    if (AI_PROVIDERS[providerName]) {
      this.activeProvider = providerName;
      return true;
    }
    return false;
  }
}

const providerManager = new ProviderManager();

export { AI_PROVIDERS, providerManager };
