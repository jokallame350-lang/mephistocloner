/**
 * BYOK (Bring Your Own Key) Manager
 * Manages user-supplied API keys for Anthropic, OpenAI, DeepSeek, and Google Gemini.
 * Provides format validation, header encryption/masking, and priority resolution:
 * User Key > Server Key (process.env) > Fallback Offline Mock Engine.
 */

const crypto = require('crypto');

// Encryption constants
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const DEFAULT_SECRET = process.env.BYOK_ENCRYPTION_SECRET || 'siteprompter-v2-byok-secret-key-32b!'; // 32 chars fallback

/**
 * Supported AI Providers & Specifications
 */
const SUPPORTED_PROVIDERS = {
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    aliases: ['claude', 'anthropic'],
    envVars: ['ANTHROPIC_API_KEY'],
    keyPrefix: 'sk-ant-',
    minKeyLength: 20,
    defaultModel: 'claude-3-7-sonnet-20250219',
    models: [
      { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet (Hybrid/Thinking)', default: true },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (v2)' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku' },
    ],
    endpoint: 'https://api.anthropic.com/v1/messages',
    headers: {
      'anthropic-version': '2023-06-01',
    },
  },
  openai: {
    id: 'openai',
    name: 'OpenAI GPT-4o',
    aliases: ['openai', 'chatgpt'],
    envVars: ['OPENAI_API_KEY'],
    keyPrefix: 'sk-',
    minKeyLength: 20,
    defaultModel: 'gpt-4o',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o (Omni Flagship)', default: true },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast & Lightweight)' },
      { id: 'o1', name: 'OpenAI o1 (Reasoning)' },
      { id: 'o3-mini', name: 'OpenAI o3-mini' },
    ],
    endpoint: 'https://api.openai.com/v1/chat/completions',
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek V3 / R1',
    aliases: ['deepseek'],
    envVars: ['DEEPSEEK_API_KEY'],
    keyPrefix: 'sk-',
    minKeyLength: 20,
    defaultModel: 'deepseek-chat',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek-V3 (Chat & Code)', default: true },
      { id: 'deepseek-reasoner', name: 'DeepSeek-R1 (Reasoning)' },
    ],
    endpoint: 'https://api.deepseek.com/chat/completions',
  },
  google: {
    id: 'google',
    name: 'Google Gemini',
    aliases: ['google', 'gemini'],
    envVars: ['GEMINI_API_KEY', 'GOOGLE_API_KEY', 'GOOGLE_AI_API_KEY'],
    keyPrefix: 'AIzaSy',
    minKeyLength: 25,
    defaultModel: 'gemini-2.5-pro',
    models: [
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Ultra Reasoning)', default: true },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    ],
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
  },
  mock: {
    id: 'mock',
    name: 'Offline Mock Simulator',
    aliases: ['mock', 'offline', 'simulator', 'local'],
    envVars: [],
    keyPrefix: '',
    minKeyLength: 0,
    defaultModel: 'mock-synth-engine',
    models: [
      { id: 'mock-synth-engine', name: 'SitePrompter Offline Synthesis Engine', default: true },
    ],
  },
};

/**
 * Normalizes provider name from aliases
 */
function normalizeProvider(provider = '') {
  const p = String(provider).trim().toLowerCase();
  for (const [key, spec] of Object.entries(SUPPORTED_PROVIDERS)) {
    if (key === p || spec.aliases.includes(p)) {
      return key;
    }
  }
  return 'mock';
}

/**
 * Validates an API key against provider format requirements
 * @param {string} provider - 'anthropic' | 'openai' | 'deepseek' | 'google' | 'mock'
 * @param {string} key - Raw API key
 * @returns {{ valid: boolean, provider: string, error?: string }}
 */
function validateApiKey(provider, key) {
  const normProvider = normalizeProvider(provider);

  if (normProvider === 'mock') {
    return { valid: true, provider: 'mock' };
  }

  if (!key || typeof key !== 'string') {
    return {
      valid: false,
      provider: normProvider,
      error: `API key for ${normProvider} is required and must be a non-empty string.`,
    };
  }

  const cleanKey = key.trim();
  const spec = SUPPORTED_PROVIDERS[normProvider];

  if (!spec) {
    return {
      valid: false,
      provider: normProvider,
      error: `Unsupported AI provider: ${provider}`,
    };
  }

  if (cleanKey.length < spec.minKeyLength) {
    return {
      valid: false,
      provider: normProvider,
      error: `Invalid API key length for ${spec.name}. Expected at least ${spec.minKeyLength} characters, received ${cleanKey.length}.`,
    };
  }

  // Format checks
  if (normProvider === 'anthropic') {
    if (!cleanKey.startsWith('sk-ant-')) {
      return {
        valid: false,
        provider: normProvider,
        error: `Invalid Anthropic API key format. Key must start with 'sk-ant-'.`,
      };
    }
  } else if (normProvider === 'openai') {
    if (!cleanKey.startsWith('sk-')) {
      return {
        valid: false,
        provider: normProvider,
        error: `Invalid OpenAI API key format. Key must start with 'sk-'.`,
      };
    }
  } else if (normProvider === 'deepseek') {
    if (!cleanKey.startsWith('sk-')) {
      return {
        valid: false,
        provider: normProvider,
        error: `Invalid DeepSeek API key format. Key must start with 'sk-'.`,
      };
    }
  } else if (normProvider === 'google') {
    if (!cleanKey.startsWith('AIzaSy') && cleanKey.length < 30) {
      return {
        valid: false,
        provider: normProvider,
        error: `Invalid Google Gemini API key format. Key usually begins with 'AIzaSy' and is ~39 characters.`,
      };
    }
  }

  return {
    valid: true,
    provider: normProvider,
  };
}

/**
 * Masks an API key for safe logging and client display
 * e.g., "sk-ant-api03-abcdef1234567890" -> "sk-ant-••••••••7890"
 * @param {string} key
 * @returns {string}
 */
function maskApiKey(key) {
  if (!key || typeof key !== 'string') {
    return '••••••••';
  }

  const clean = key.trim();
  if (clean.length <= 8) {
    return '••••••••';
  }

  // Identify prefix if standard
  let prefix = '';
  if (clean.startsWith('sk-ant-api')) {
    prefix = clean.slice(0, 10);
  } else if (clean.startsWith('sk-ant-')) {
    prefix = 'sk-ant-';
  } else if (clean.startsWith('sk-proj-')) {
    prefix = 'sk-proj-';
  } else if (clean.startsWith('sk-')) {
    prefix = 'sk-';
  } else if (clean.startsWith('AIzaSy')) {
    prefix = 'AIzaSy';
  } else {
    prefix = clean.slice(0, 4);
  }

  const suffix = clean.slice(-4);
  return `${prefix}••••••••${suffix}`;
}

/**
 * Encrypts an API key using AES-256-GCM for secure transit or storage
 * @param {string} text - Raw key
 * @param {string} secret - 32-byte secret (optional)
 * @returns {string} - Formatted as iv:authTag:encryptedHex
 */
function encryptKey(text, secret = DEFAULT_SECRET) {
  if (!text) return '';
  const key = crypto.createHash('sha256').update(String(secret)).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an encrypted key string
 * @param {string} encryptedString - iv:authTag:encryptedHex
 * @param {string} secret - 32-byte secret (optional)
 * @returns {string} - Decrypted plaintext
 */
function decryptKey(encryptedString, secret = DEFAULT_SECRET) {
  if (!encryptedString || typeof encryptedString !== 'string') return '';
  const parts = encryptedString.split(':');
  if (parts.length !== 3) {
    // Might be plaintext
    return encryptedString;
  }

  try {
    const [ivHex, authTagHex, encryptedHex] = parts;
    const key = crypto.createHash('sha256').update(String(secret)).digest();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    // Fallback: If decryption fails, assume invalid key or invalid secret
    return '';
  }
}

/**
 * Extracts API keys from request headers
 * Supports headers like:
 * - x-anthropic-key, x-openai-key, x-deepseek-key, x-gemini-key, x-google-key
 * - authorization: Bearer ...
 * - x-byok-keys: JSON or encrypted JSON
 * @param {object} headers - Express req.headers
 * @returns {object} - Map of { provider: key }
 */
function extractKeysFromHeaders(headers = {}) {
  const extracted = {};

  if (!headers || typeof headers !== 'object') {
    return extracted;
  }

  // Lowercase keys
  const h = {};
  for (const [k, v] of Object.entries(headers)) {
    h[k.toLowerCase()] = v;
  }

  // 1. Direct provider headers
  if (h['x-anthropic-key'] || h['anthropic-api-key']) {
    extracted.anthropic = h['x-anthropic-key'] || h['anthropic-api-key'];
  }
  if (h['x-openai-key'] || h['openai-api-key']) {
    extracted.openai = h['x-openai-key'] || h['openai-api-key'];
  }
  if (h['x-deepseek-key'] || h['deepseek-api-key']) {
    extracted.deepseek = h['x-deepseek-key'] || h['deepseek-api-key'];
  }
  if (h['x-gemini-key'] || h['x-google-key'] || h['gemini-api-key']) {
    extracted.google = h['x-gemini-key'] || h['x-google-key'] || h['gemini-api-key'];
  }

  // 2. Encrypted or JSON BYOK payload in x-byok-keys
  if (h['x-byok-keys']) {
    try {
      let raw = h['x-byok-keys'];
      if (raw.includes(':')) {
        raw = decryptKey(raw);
      }
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        Object.assign(extracted, parsed);
      }
    } catch (_) {}
  }

  // 3. Generic Bearer Token
  if (h['authorization'] && typeof h['authorization'] === 'string' && h['authorization'].startsWith('Bearer ')) {
    const bearer = h['authorization'].slice(7).trim();
    if (bearer.startsWith('sk-ant-')) extracted.anthropic = bearer;
    else if (bearer.startsWith('AIzaSy')) extracted.google = bearer;
    else if (bearer.startsWith('sk-')) extracted.openai = bearer;
  }

  return extracted;
}

/**
 * Resolves the effective API key following the priority:
 * 1. User-supplied Key (from body, params, or request headers)
 * 2. Server Environment Key (process.env[PROVIDER_API_KEY])
 * 3. Offline Mock Engine Fallback
 *
 * @param {object} params
 * @param {string} [params.provider] - 'anthropic' | 'openai' | 'deepseek' | 'google' | 'mock'
 * @param {string} [params.userKey] - Direct user key
 * @param {object} [params.headers] - Request headers
 * @param {boolean} [params.serverFallback=true] - Whether to fallback to server process.env key
 * @param {boolean} [params.allowMockFallback=true] - Whether to fallback to mock simulator if no keys
 * @returns {{
 *   provider: string,
 *   source: 'user' | 'server' | 'offline_mock',
 *   key: string | null,
 *   masked: string,
 *   isMock: boolean,
 *   valid: boolean,
 *   model: string,
 *   spec: object
 * }}
 */
function resolveApiKey(params = {}) {
  const {
    userKey: rawUserKey,
    headers = {},
    serverFallback = true,
    allowMockFallback = true,
  } = params;

  let provider = normalizeProvider(params.provider);
  let model = params.model || SUPPORTED_PROVIDERS[provider]?.defaultModel || 'mock-synth-engine';

  // Explicit mock request
  if (provider === 'mock') {
    return {
      provider: 'mock',
      source: 'offline_mock',
      key: null,
      masked: 'OFFLINE_MOCK_SIMULATOR',
      isMock: true,
      valid: true,
      model: 'mock-synth-engine',
      spec: SUPPORTED_PROVIDERS.mock,
    };
  }

  // Step 1: Check User-supplied Key
  let userKey = rawUserKey;
  if (!userKey && headers) {
    const extracted = extractKeysFromHeaders(headers);
    userKey = extracted[provider];
  }

  if (userKey) {
    // Decrypt if encrypted format
    if (typeof userKey === 'string' && userKey.includes(':')) {
      const decrypted = decryptKey(userKey);
      if (decrypted) userKey = decrypted;
    }

    const validation = validateApiKey(provider, userKey);
    if (validation.valid) {
      return {
        provider,
        source: 'user',
        key: userKey.trim(),
        masked: maskApiKey(userKey),
        isMock: false,
        valid: true,
        model,
        spec: SUPPORTED_PROVIDERS[provider],
      };
    }
  }

  // Step 2: Check Server Environment Key
  if (serverFallback) {
    const spec = SUPPORTED_PROVIDERS[provider];
    if (spec && spec.envVars) {
      for (const envVar of spec.envVars) {
        const envVal = process.env[envVar];
        if (envVal && typeof envVal === 'string' && envVal.trim().length > 0) {
          const validation = validateApiKey(provider, envVal);
          if (validation.valid) {
            return {
              provider,
              source: 'server',
              key: envVal.trim(),
              masked: maskApiKey(envVal),
              isMock: false,
              valid: true,
              model,
              spec,
            };
          }
        }
      }
    }
  }

  // Step 3: Offline Mock Fallback
  if (allowMockFallback) {
    return {
      provider: 'mock',
      requestedProvider: provider,
      source: 'offline_mock',
      key: null,
      masked: 'OFFLINE_MOCK_SIMULATOR',
      isMock: true,
      valid: true,
      model: 'mock-synth-engine',
      spec: SUPPORTED_PROVIDERS.mock,
      fallbackReason: `No valid API key found for provider '${provider}'. Falling back to built-in Mock Simulator.`,
    };
  }

  return {
    provider,
    source: 'none',
    key: null,
    masked: 'NONE',
    isMock: false,
    valid: false,
    model,
    spec: SUPPORTED_PROVIDERS[provider],
    error: `No valid API key provided for '${provider}'. Provide a valid API key or enable Mock Simulator.`,
  };
}

/**
 * Returns available server-side provider status
 */
function getProviderStatus() {
  const status = {};

  for (const [key, spec] of Object.entries(SUPPORTED_PROVIDERS)) {
    if (key === 'mock') {
      status[key] = {
        name: spec.name,
        available: true,
        source: 'built-in',
        defaultModel: spec.defaultModel,
        models: spec.models,
      };
      continue;
    }

    let serverConfigured = false;
    let masked = null;
    for (const envVar of spec.envVars) {
      const val = process.env[envVar];
      if (val && val.trim().length > 0) {
        serverConfigured = true;
        masked = maskApiKey(val);
        break;
      }
    }

    status[key] = {
      name: spec.name,
      serverConfigured,
      maskedKey: masked,
      defaultModel: spec.defaultModel,
      models: spec.models,
      requiresKey: !serverConfigured,
    };
  }

  return status;
}

module.exports = {
  SUPPORTED_PROVIDERS,
  normalizeProvider,
  validateApiKey,
  maskApiKey,
  encryptKey,
  decryptKey,
  extractKeysFromHeaders,
  resolveApiKey,
  getProviderStatus,
};
