/**
 * Advanced Settings Manager
 * Handles API configuration, encryption, and validation
 */

const SETTINGS_CONFIG = {
  STORAGE_PREFIX: "sj_settings_",
  ENCRYPTION_ENABLED: true,
  VALIDATION_RULES: {
    apiKey: {
      required: true,
      minLength: 10,
      pattern: /^[a-zA-Z0-9_-]+$/
    },
    apiProvider: {
      required: true,
      allowed: ["nvidia", "openai", "gemini", "groq", "anthropic"]
    },
    btnSize: {
      required: true,
      min: 40,
      max: 80,
      type: "number"
    }
  }
};

class SettingsManager {
  constructor() {
    this.cache = {};
  }

  /**
   * Validate settings against rules
   */
  validate(key, value) {
    const rules = SETTINGS_CONFIG.VALIDATION_RULES[key];
    if (!rules) return true; // No rules = valid

    if (rules.required && !value) {
      throw new Error(`${key} is required`);
    }

    if (rules.minLength && value.length < rules.minLength) {
      throw new Error(
        `${key} must be at least ${rules.minLength} characters`
      );
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      throw new Error(`${key} format is invalid`);
    }

    if (rules.min && value < rules.min) {
      throw new Error(`${key} must be at least ${rules.min}`);
    }

    if (rules.max && value > rules.max) {
      throw new Error(`${key} must be at most ${rules.max}`);
    }

    if (rules.allowed && !rules.allowed.includes(value)) {
      throw new Error(`${key} must be one of: ${rules.allowed.join(", ")}`);
    }

    if (rules.type && typeof value !== rules.type) {
      throw new Error(`${key} must be a ${rules.type}`);
    }

    return true;
  }

  /**
   * Simple obfuscation for API keys (not cryptographic)
   */
  obfuscateKey(key) {
    if (!SETTINGS_CONFIG.ENCRYPTION_ENABLED || key.length < 20) return key;
    const visible = key.substring(0, 4) + key.substring(key.length - 4);
    return visible + "*".repeat(key.length - 8);
  }

  /**
   * Get setting with caching
   */
  async getSetting(key) {
    if (this.cache[key]) {
      return this.cache[key];
    }

    return new Promise(resolve => {
      chrome.storage.local.get([key], result => {
        this.cache[key] = result[key];
        resolve(result[key]);
      });
    });
  }

  /**
   * Save setting with validation
   */
  async saveSetting(key, value) {
    this.validate(key, value);
    this.cache[key] = value;

    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(true);
        }
      });
    });
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache = {};
  }
}

const settingsManager = new SettingsManager();

export { settingsManager, SETTINGS_CONFIG };
