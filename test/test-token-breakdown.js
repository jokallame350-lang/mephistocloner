const { scrapeUrl } = require('../lib/scraper');
const { buildTelemetrySections } = require('../lib/telemetry-formatter');
const { estimateTokens } = require('../lib/token-estimator');

async function testBreakdown() {
  const telemetry = await scrapeUrl('https://paddle.com');
  const sections = buildTelemetrySections(telemetry, { detailLevel: 'compact' });

  console.log('\n--- TOKEN BREAKDOWN (COMPACT) ---');
  for (const [key, val] of Object.entries(sections)) {
    console.log(`${key.padEnd(20)}: ${estimateTokens(String(val))} tokens`);
  }
}
testBreakdown();
