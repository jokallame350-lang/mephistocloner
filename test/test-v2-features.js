/**
 * Test Suite for V2 Pro SaaS Features
 */

const assert = require('assert');
const { exportTailwindConfig, exportFigmaTokens, exportCssTheme } = require('../lib/design-tokens-exporter');
const { sliceComponent, SECTION_DEFINITIONS } = require('../lib/component-slicer');
const { createProjectZip } = require('../lib/project-packager');

const mockTelemetry = {
  meta: {
    title: 'DarthKubo Stream',
    canonical: 'https://kick.com/darthkubo',
    description: 'Minecraft Hardcore Series',
    lang: 'tr',
  },
  colors: [
    { color: '#53FC18', frequency: 18 },
    { color: '#0B0B0C', frequency: 17 },
    { color: '#FFFFFF', frequency: 766 },
  ],
  fonts: {
    families: ['Inter', 'system-ui'],
    sizes: ['20px', '16px', '14px', '12px'],
  },
  shadows: ['0 4px 6px rgba(0,0,0,0.2)'],
  borderRadius: ['4px', '8px'],
  cssVariables: {
    '--neon-green': '#53FC18',
    '--bg-dark': '#0B0B0C',
  },
};

console.log('🚀 Running V2 Pro SaaS Feature Tests...\n');

// 1. Test Design Tokens Exporters
const tailwindCfg = exportTailwindConfig(mockTelemetry);
assert(tailwindCfg.includes('#53FC18'), 'Tailwind config should contain neon green #53FC18');
assert(tailwindCfg.includes('brand-primary'), 'Tailwind config should define brand-primary');
console.log('  ✅ [PASS] Tailwind Config Exporter');

const figmaTokens = exportFigmaTokens(mockTelemetry);
const parsedFigma = JSON.parse(figmaTokens);
assert.strictEqual(parsedFigma.tokens.color['color-1'].value, '#53FC18');
console.log('  ✅ [PASS] Figma Tokens JSON Exporter');

const cssTheme = exportCssTheme(mockTelemetry);
assert(cssTheme.includes('--neon-green: #53FC18;'), 'CSS Theme should contain :root variables');
console.log('  ✅ [PASS] CSS Theme Exporter');

// 2. Test Component Slicer
Object.keys(SECTION_DEFINITIONS).forEach((section) => {
  const prompt = sliceComponent(mockTelemetry, section, { framework: 'react-tailwind' });
  assert(prompt.includes(SECTION_DEFINITIONS[section].name), `Prompt should mention ${section}`);
  assert(prompt.includes('COMPONENT SPECIFICATIONS'), 'Prompt should have specifications');
});
console.log(`  ✅ [PASS] Component Slicer (${Object.keys(SECTION_DEFINITIONS).length} sections verified)`);

// 3. Test ZIP Packager
const zipBuffer = createProjectZip('export default function App() {}', mockTelemetry, { framework: 'react-tailwind' });
assert(Buffer.isBuffer(zipBuffer), 'ZIP Packager should return a Buffer');
assert(zipBuffer.length > 500, 'ZIP Buffer should have content');
console.log(`  ✅ [PASS] Full Project ZIP Packager (${zipBuffer.length} bytes generated)`);

console.log('\n✨ ALL V2 PRO SAAS TESTS PASSED!\n');
