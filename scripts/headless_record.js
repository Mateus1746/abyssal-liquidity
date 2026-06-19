import puppeteer from 'puppeteer';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runDeterministicRecord() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  // Inject deterministic time overrides BEFORE navigation
  await page.evaluateOnNewDocument(() => {
    // Deterministic timers for deterministic rendering
    let mockTime = 0;
    const TIME_STEP = 1000 / 60; // 60 FPS (16.666ms)

    // Freeze Date and performance
    Date.now = () => mockTime;
    const originalPerformanceNow = performance.now.bind(performance);
    performance.now = () => mockTime;

    // Fully deterministic requestAnimationFrame
    let rafCallbacks = [];
    window.requestAnimationFrame = (callback) => {
      rafCallbacks.push(callback);
      return rafCallbacks.length;
    };

    window.cancelAnimationFrame = (id) => {};

    // Mock setInterval and setTimeout to advance deterministically based on mockTime
    let timers = [];
    let timerIdCounter = 1;

    window.setTimeout = (callback, delay) => {
      const id = timerIdCounter++;
      timers.push({ id, callback, triggerTime: mockTime + Math.max(delay || 0, 0), isInterval: false });
      return id;
    };

    window.setInterval = (callback, delay) => {
      const id = timerIdCounter++;
      timers.push({ id, callback, delay: Math.max(delay || 0, 0), triggerTime: mockTime + Math.max(delay || 0, 0), isInterval: true });
      return id;
    };

    window.clearTimeout = window.clearInterval = (id) => {
      timers = timers.filter(t => t.id !== id);
    };

    // We expose a global function that Puppeteer can call to step the frame forward deterministically
    window.__stepFrame = () => {
      mockTime += TIME_STEP;

      // Trigger timers
      let activeTimers = timers.filter(t => mockTime >= t.triggerTime);
      activeTimers.forEach(t => {
        try {
          t.callback();
        } catch (e) {
          console.error(e);
        }
        if (t.isInterval) {
          t.triggerTime = mockTime + t.delay;
        }
      });
      // Remove one-off timers that fired
      timers = timers.filter(t => t.isInterval || mockTime < t.triggerTime);

      const callbacks = [...rafCallbacks];
      rafCallbacks = [];
      callbacks.forEach(cb => {
        try {
          cb(mockTime);
        } catch (e) {
          console.error(e);
        }
      });
      return mockTime;
    };
  });

  console.log('Navigating to local preview server...');
  try {
    await page.goto('http://localhost:4173', { waitUntil: 'load', timeout: 30000 });

    console.log('Advancing deterministic frames to load initial state...');

    // Step forward frames. We need to pass 3000ms to see the first event.
    // 3000ms / (1000/60) = 180 frames. Let's do 240 frames to be safe and see multiple events.
    for (let i = 0; i < 240; i++) {
       await page.evaluate(() => {
         if (window.__stepFrame) window.__stepFrame();
       });
    }

    console.log('Taking deterministic screenshots...');
    // Ensure exports directory exists
    const exportDir = resolve(__dirname, '../exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    // Take a single screenshot for the task requirement
    await page.screenshot({ path: resolve(exportDir, 'headless_capture_deterministic.png') });

    console.log('Deterministic headless recording setup completed and captured frame.');
  } catch (err) {
    console.error('Failed to run headless record:', err);
  } finally {
    await browser.close();
    process.exit(0);
  }
}

runDeterministicRecord().catch(err => {
  console.error(err);
  process.exit(1);
});
