const puppeteer = require('puppeteer-core');

async function testSandboxTs() {
  console.log('\n======================================================');
  console.log('🧪 TESTING BABEL TYPESCRIPT & ARBITRARY SITES SANDBOX');
  console.log('======================================================\n');

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    // Test TS code with interfaces & SynthesizedApp component
    const tsCode = `
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
      <div className="text-2xl mb-2">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400">{description}</p>
    </div>
  );
}

export default function SynthesizedApp() {
  const [activeTab, setActiveTab] = useState<'monthly' | 'yearly'>('monthly');
  return (
    <div className="min-h-screen bg-black text-white p-12">
      <h1 className="text-4xl font-extrabold text-blue-500 mb-6">Arbitrary Website Clone Test</h1>
      <FeatureCard icon="⚡" title="Lightning Fast" description="Instant edge execution and rendering" />
      <button className="mt-4 px-4 py-2 bg-blue-600 rounded">Tab: {activeTab}</button>
    </div>
  );
}
`;

    // Inject into editor and render sandbox
    await page.evaluate((code) => {
      document.getElementById('liveCodeEditor').value = code;
      document.getElementById('liveCodeEditor').dispatchEvent(new Event('input'));
    }, tsCode);

    await new Promise(r => setTimeout(r, 2000));

    // Verify sandbox iframe content
    const iframeHandle = await page.$('#studioSandboxIframe');
    const frame = await iframeHandle.contentFrame();
    const renderedText = await frame.$eval('h1', el => el.textContent);
    console.log(`   ✅ Rendered Heading: "${renderedText}"`);

    // Check that there is NO "JSX Render Notice" or error in the iframe
    const errorNotice = await frame.$eval('.bg-red-900, [style*="color:#fca5a5"]', el => el.textContent).catch(() => null);
    if (errorNotice) {
      throw new Error(`Sandbox contains render error: ${errorNotice}`);
    }
    console.log('   ✅ 0 TypeScript / Interface errors in sandbox!');

    console.log('\n======================================================');
    console.log('🎉 BABEL TYPESCRIPT & ARBITRARY COMPONENT TEST PASSED!');
    console.log('======================================================\n');
  } finally {
    await browser.close();
  }
}

testSandboxTs().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
