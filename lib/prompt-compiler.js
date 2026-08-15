/**
 * SitePrompter Prompt Compiler & Multi-Framework Engine
 * Compiles telemetry data into hyper-targeted, high-fidelity AI prompts across 5 frameworks:
 * - vanilla-html
 * - react-tailwind
 * - nextjs-shadcn
 * - vue3-tailwind
 * - svelte
 */

const FRAMEWORKS = (typeof require === 'function' ? require('./framework-templates').FRAMEWORKS : (typeof window !== 'undefined' ? window.SitePrompterFrameworks?.FRAMEWORKS : null)) || {};
const { buildTelemetrySections } = (typeof require === 'function' ? require('./telemetry-formatter') : (typeof window !== 'undefined' ? window.SitePrompterTelemetryFormatter : null)) || {};
const { estimateTokens, getTokenMetrics } = (typeof require === 'function' ? require('./token-estimator') : (typeof window !== 'undefined' ? window.SitePrompterTokenEstimator : null)) || {};

const DETAIL_LEVELS = ['compact', 'balanced', 'exhaustive'];
const ASSET_MODES = ['original-urls', 'placeholders', 'svg-inline'];

/**
 * Format markdown text to ensure clean GitHub-flavored markdown standards
 */
function formatMarkdown(prompt) {
  if (!prompt || typeof prompt !== 'string') return '';

  let formatted = prompt.replace(/\r\n/g, '\n');

  // Strip trailing whitespace per line
  formatted = formatted
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n');

  // Collapse 3 or more consecutive empty lines to 2
  formatted = formatted.replace(/\n{3,}/g, '\n\n');

  // Ensure file starts and ends cleanly
  return formatted.trim() + '\n';
}

/**
 * Main compilation function
 * @param {Object} telemetryData Raw telemetry extracted from web page
 * @param {Object} options Options object with framework, detailLevel, assetMode
 * @returns {string} Compiled prompt markdown
 */
function compilePrompt(telemetryData, options = {}) {
  const frameworkId = options.framework && FRAMEWORKS[options.framework]
    ? options.framework
    : 'vanilla-html';

  const detailLevel = DETAIL_LEVELS.includes(options.detailLevel)
    ? options.detailLevel
    : 'balanced';

  const assetMode = ASSET_MODES.includes(options.assetMode)
    ? options.assetMode
    : 'original-urls';

  const fw = FRAMEWORKS[frameworkId];
  const sections = buildTelemetrySections(telemetryData, { detailLevel, assetMode });

  // Framework-specific asset instruction
  let assetInstruction = '';
  if (assetMode === 'original-urls') {
    assetInstruction = 'Use the EXACT original asset URLs provided in section 11. Do not modify or replace them.';
  } else if (assetMode === 'placeholders') {
    assetInstruction = 'Use clean, responsive placeholder image URLs (placehold.co / Unsplash) with the exact aspect ratios and dimensions indicated in section 11.';
  } else if (assetMode === 'svg-inline') {
    assetInstruction = 'Replace all icons, badges, and graphical visual assets with clean inline SVG markup (or Lucide icons) rather than external image tags.';
  }

  // Framework-specific directives formatted
  const directivesList = fw.frameworkDirectives.map((d, idx) => {
    if (d.startsWith('  •')) return d;
    return `${idx + 1}. ${d}`;
  }).join('\n');

  // Framework-specific output requirements formatted
  const requirementsList = fw.outputRequirements.map((r, idx) => `${idx + 1}. ${r}`).join('\n');

  // Assemble full prompt
  const rawPrompt = `\
${fw.persona}

TARGET STACK: ${fw.name} (${fw.stack})
DETAIL LEVEL: ${detailLevel.toUpperCase()}
ASSET MODE  : ${assetMode}
${assetInstruction}

═══════════════════════════════════════════════════════════════
  SITE RECONSTRUCTION BRIEF — SitePrompter Telemetry Compiler
═══════════════════════════════════════════════════════════════

${sections.overview}

${sections.designTokens}

${sections.colors}

${sections.typography}

${sections.layout}

${sections.domStructure}

${sections.components}

${sections.interactions}

${sections.animations}

${sections.responsive}

${sections.assets}

${sections.extractedCss}

${sections.external}

${sections.accessibility}

═══════════════════════════════════════════════════════════════
  FRAMEWORK ARCHITECTURE & DIRECTIVES (${fw.name})
═══════════════════════════════════════════════════════════════

${directivesList}

═══════════════════════════════════════════════════════════════
  OUTPUT REQUIREMENTS
═══════════════════════════════════════════════════════════════

${requirementsList}

── Target Code Reference / Architecture Pattern ──
\`\`\`${fw.fileExtension}
${fw.codeSampleHint}
\`\`\`
`;

  return formatMarkdown(rawPrompt);
}

/**
 * Get metadata for all supported frameworks
 */
function getAvailableFrameworks() {
  return Object.values(FRAMEWORKS).map(f => ({
    id: f.id,
    name: f.name,
    stack: f.stack,
    fileExtension: f.fileExtension,
  }));
}

/**
 * Get metadata for a specific framework
 */
function getFrameworkMetadata(frameworkId) {
  return FRAMEWORKS[frameworkId] || FRAMEWORKS['vanilla-html'];
}

const SitePrompterCompiler = {
  compilePrompt,
  estimateTokens,
  getTokenMetrics,
  formatMarkdown,
  getAvailableFrameworks,
  getFrameworkMetadata,
  FRAMEWORKS,
  DETAIL_LEVELS,
  ASSET_MODES,
};

if (typeof window !== 'undefined') {
  window.SitePrompterCompiler = SitePrompterCompiler;
}

module.exports = SitePrompterCompiler;
