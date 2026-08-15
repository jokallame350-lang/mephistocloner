const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  // Show Results Dashboard so iframe is rendered
  await page.evaluate(() => {
    document.getElementById('resultsDashboard').style.display = 'block';
    const code = `
interface FeatureProps {
  title: string;
}

function Feature({ title }: FeatureProps) {
  return <div className="text-emerald-400 font-bold">{title}</div>;
}

export default function SynthesizedApp() {
  const [count, setCount] = useState<number>(0);
  return (
    <div>
      <h1>Arbitrary App Title</h1>
      <Feature title="Working Feature" />
      <button onClick={() => setCount(count + 1)}>Count: {count}</button>
    </div>
  );
}
`;
    document.getElementById('liveCodeEditor').value = code;
    document.getElementById('liveCodeEditor').dispatchEvent(new Event('input'));
  });

  await new Promise(r => setTimeout(r, 2000));

  const iframeHandle = await page.$('#studioSandboxIframe');
  const frame = await iframeHandle.contentFrame();
  const html = await frame.content();
  console.log('Frame HTML:\n', html);

  await browser.close();
})();
