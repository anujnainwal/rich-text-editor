const puppeteer = require('puppeteer-core');
const path = require('path');

const executablePath = '/home/nainwal/.cache/puppeteer/chrome-headless-shell/linux-146.0.7680.31/chrome-headless-shell-linux64/chrome-headless-shell';

async function test() {
  const browser = await puppeteer.launch({ 
    executablePath,
    headless: 'new' 
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 600 });
  const fileUrl = `file://${path.join(__dirname, 'test-cdn.html')}`;
  console.log(`Loading ${fileUrl}...`);
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(__dirname, 'cdn-test.png') });
  await browser.close();
  console.log('Saved cdn-test.png');
}
test().catch(console.error);
