/**
 * Design Tokens Exporter
 * Converts extracted telemetry into production-grade Tailwind config, Figma tokens, and CSS variables.
 */

function exportTailwindConfig(telemetry = {}) {
  const colors = telemetry.colors || [];
  const fonts = telemetry.fonts || {};
  const shadows = telemetry.shadows || [];
  const borderRadius = telemetry.borderRadius || [];
  const cssVars = telemetry.cssVariables || {};

  // Build colors map
  const colorMap = {};
  colors.slice(0, 12).forEach((c, idx) => {
    const hex = typeof c === 'string' ? c : (c.color || '#000000');
    // Generate semantic names
    const name = idx === 0 ? 'brand-primary' : idx === 1 ? 'brand-secondary' : idx === 2 ? 'brand-accent' : `brand-${idx + 1}`;
    colorMap[name] = hex;
  });

  // Extract primary font
  const primaryFont = fonts.families && fonts.families.length > 0
    ? fonts.families[0].split(',')[0].replace(/['"]/g, '').trim()
    : 'Inter';

  // Build shadow map
  const shadowMap = {};
  shadows.slice(0, 4).forEach((s, idx) => {
    shadowMap[`custom-${idx + 1}`] = s;
  });

  // Build borderRadius map
  const radiusMap = {};
  borderRadius.slice(0, 4).forEach((r, idx) => {
    radiusMap[`custom-${idx + 1}`] = r;
  });

  const configObj = {
    darkMode: 'class',
    theme: {
      extend: {
        colors: colorMap,
        fontFamily: {
          sans: [primaryFont, 'system-ui', 'sans-serif'],
          mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        },
        boxShadow: Object.keys(shadowMap).length > 0 ? shadowMap : undefined,
        borderRadius: Object.keys(radiusMap).length > 0 ? radiusMap : undefined,
      },
    },
    plugins: [],
  };

  return `/** @type {import('tailwindcss').Config} */
module.exports = ${JSON.stringify(configObj, null, 2)};
`;
}

function exportFigmaTokens(telemetry = {}) {
  const colors = telemetry.colors || [];
  const fonts = telemetry.fonts || {};
  const shadows = telemetry.shadows || [];
  const borderRadius = telemetry.borderRadius || [];
  const cssVars = telemetry.cssVariables || {};

  const figmaTokens = {
    version: '1.0.0',
    name: telemetry.meta?.title || 'Extracted Design Tokens',
    sourceUrl: telemetry.meta?.canonical || '',
    tokens: {
      color: {},
      fontFamilies: {},
      fontSize: {},
      borderRadius: {},
      boxShadow: {},
      customProperties: cssVars,
    },
  };

  // Populate colors
  colors.slice(0, 20).forEach((c, idx) => {
    const val = typeof c === 'string' ? c : c.color;
    const freq = c.frequency || 1;
    figmaTokens.tokens.color[`color-${idx + 1}`] = {
      value: val,
      type: 'color',
      description: `Detected on page (used ${freq} times)`,
    };
  });

  // Populate font families
  (fonts.families || []).slice(0, 5).forEach((f, idx) => {
    figmaTokens.tokens.fontFamilies[`font-${idx + 1}`] = {
      value: f,
      type: 'fontFamilies',
    };
  });

  // Populate font sizes
  (fonts.sizes || []).slice(0, 10).forEach((s, idx) => {
    figmaTokens.tokens.fontSize[`size-${idx + 1}`] = {
      value: s,
      type: 'fontSizes',
    };
  });

  // Populate border radius
  (borderRadius || []).slice(0, 6).forEach((r, idx) => {
    figmaTokens.tokens.borderRadius[`radius-${idx + 1}`] = {
      value: r,
      type: 'borderRadius',
    };
  });

  // Populate box shadow
  (shadows || []).slice(0, 6).forEach((s, idx) => {
    figmaTokens.tokens.boxShadow[`shadow-${idx + 1}`] = {
      value: s,
      type: 'boxShadow',
    };
  });

  return JSON.stringify(figmaTokens, null, 2);
}

function exportCssTheme(telemetry = {}) {
  const cssVars = telemetry.cssVariables || {};
  const colors = telemetry.colors || [];
  const fonts = telemetry.fonts || {};

  const lines = [':root {'];

  // Add detected CSS variables
  Object.entries(cssVars).forEach(([k, v]) => {
    lines.push(`  ${k}: ${v};`);
  });

  if (Object.keys(cssVars).length === 0) {
    // Generate fallback CSS variables from extracted colors
    colors.slice(0, 10).forEach((c, idx) => {
      const val = typeof c === 'string' ? c : c.color;
      lines.push(`  --brand-color-${idx + 1}: ${val};`);
    });
  }

  if (fonts.families && fonts.families.length > 0) {
    lines.push(`  --font-primary: ${fonts.families[0]};`);
  }

  lines.push('}');
  return lines.join('\n');
}

module.exports = {
  exportTailwindConfig,
  exportFigmaTokens,
  exportCssTheme,
};
