import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
await mkdir('test-results', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
try {
  await page.goto('http://127.0.0.1:5174', { waitUntil: 'networkidle' });
  await page.locator('#contact').evaluate(el => el.scrollIntoView({ behavior: 'instant' }));
  await page.waitForTimeout(400);
  const pixels = () => page.locator('.contact-wind').evaluate(el => el.toDataURL());
  const a = await pixels();
  await page.waitForTimeout(200);
  assert.notEqual(await pixels(), a);
  assert.equal(await page.locator('#contact').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(16, 17, 16)');
  assert.equal(await page.locator('#about').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(16, 17, 16)');
  // Sample the actual canvas after sustained motion: no empty vertical bands.
  await page.clock.install();
  for (let sample = 0; sample < 4; sample++) {
    await page.clock.runFor(15000);
    const coverage = await page.locator('.contact-wind').evaluate(canvas => {
      const { width, height } = canvas;
      const data = canvas.getContext('2d').getImageData(0, 0, width, height).data;
      const bins = Array(12).fill(0);
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        if (data[(y * width + x) * 4 + 3] > 45) bins[Math.min(11, Math.floor(x / width * 12))]++;
      }
      return bins;
    });
    assert.ok(Math.min(...coverage) > 80, `Empty particle band after ${(sample + 1) * 15}s: ${coverage}`);
    assert.ok(Math.max(...coverage) / Math.min(...coverage) < 4, `Uneven particle density: ${coverage}`);
  }
  await page.clock.resume();
  await page.screenshot({ path: 'test-results/contact-wind-desktop.png' });
  await page.evaluate(() => document.querySelector('#motion-toggle').click());
  const b = await pixels();
  await page.waitForTimeout(200);
  assert.equal(await pixels(), b);
  await page.evaluate(() => document.querySelector('#motion-toggle').click());
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#contact').evaluate(el => el.scrollIntoView({ behavior: 'instant' }));
  await page.waitForTimeout(200);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: 'test-results/contact-wind-mobile.png' });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(100);
  const c = await pixels();
  await page.waitForTimeout(200);
  assert.equal(await pixels(), c);
  assert.deepEqual(errors, []);
  console.log('PASS: animated contact particles, black background, pause, reduced motion, mobile overflow, no browser errors.');
} finally { await browser.close(); }
