/**
 * SitePrompter Token Estimator
 * Heuristic token estimation based on character and tokenization models (OpenAI/Anthropic/Gemini rule of thumb).
 */

function estimateTokens(text) {
  if (text == null) return 0;
  const str = typeof text === 'string' ? text : String(text);
  if (!str.length) return 0;
  
  // Standard rule-of-thumb: ~4 characters per token for English & code
  return Math.ceil(str.length / 4);
}

function getTokenMetrics(text) {
  if (text == null) {
    return {
      charCount: 0,
      tokenEstimate: 0,
      wordCount: 0,
      lineCount: 0,
    };
  }
  const str = typeof text === 'string' ? text : String(text);
  const charCount = str.length;
  const tokenEstimate = estimateTokens(str);
  const words = str.trim() ? str.trim().split(/\s+/).length : 0;
  const lines = str.length ? str.split('\n').length : 0;

  return {
    charCount,
    tokenEstimate,
    wordCount: words,
    lineCount: lines,
  };
}

if (typeof window !== 'undefined') {
  window.SitePrompterTokenEstimator = { estimateTokens, getTokenMetrics };
}

module.exports = {
  estimateTokens,
  getTokenMetrics,
};
