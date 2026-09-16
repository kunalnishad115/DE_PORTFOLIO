import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

await mkdir('test-results', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ baseURL: 'http://127.0.0.1:5173', viewport: { width: 1440, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'] });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
try {
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'test-results/desktop.png' });
  assert.equal(await page.locator('h1').getAttribute('aria-label'), 'Kunal Nishad');
  assert.equal(await page.locator('[data-project]').count(), 6);
  assert.equal(await page.locator('nav sup').textContent(), '06');
  await page.waitForTimeout(1300);
  assert.equal((await page.locator('h1').textContent()).replace(/\s/g, ''), 'KUNALNISHAD');
  assert.equal(await page.locator('#motion-toggle').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('.ticker-track').evaluate(el => getComputedStyle(el).animationName), 'marquee');
  await page.locator('#motion-toggle').click();
  assert.equal(await page.locator('.ticker-track').evaluate(el => getComputedStyle(el).animationName), 'none');
  await page.locator('#motion-toggle').click();
  const scrollToProject = async index => {
    await page.evaluate(index => {
      const list = document.querySelector('.project-list');
      const cards = [...list.children];
      const gap = parseFloat(getComputedStyle(list).rowGap);
      const inset = innerWidth <= 700 ? 20 + index * 10 : 64 + index * 16;
      scrollTo({ top: scrollY + list.getBoundingClientRect().top + cards.slice(0, index).reduce((sum, card) => sum + card.offsetHeight + gap, 0) - inset, behavior: 'instant' });
    }, index);
    await page.waitForTimeout(200);
  };
  assert.ok(await page.locator('.project-list').evaluate(el => el.classList.contains('stack-ready')));
  await scrollToProject(1);
  const overlap = await page.locator('.project').evaluateAll(cards => {
    const first = cards[0].getBoundingClientRect(), second = cards[1].getBoundingClientRect();
    return { firstTop: first.top, secondTop: second.top, firstBottom: first.bottom, scale: getComputedStyle(cards[0]).transform };
  });
  assert.ok(Math.abs(overlap.firstTop - 64) < 2);
  assert.ok(Math.abs(overlap.secondTop - 80) < 2);
  assert.ok(overlap.secondTop < overlap.firstBottom, 'Cards should overlap');
  assert.notEqual(overlap.scale, 'matrix(1, 0, 0, 1, 0, 0)');
  await page.screenshot({ path: 'test-results/stack-desktop.png' });
  await scrollToProject(0);
  assert.ok(await page.locator('.project').evaluateAll(cards => cards[1].getBoundingClientRect().top > cards[0].getBoundingClientRect().bottom), 'Scrolling back should unstack cards');
  const projectCases = [['zomato', 'Zomato AI Data Platform'], ['uber', 'From Batch to Real-Time: Uber Data Engineering on Azure'], ['azure', 'Amazon Review Analytics'], ['adf', 'Multi-Source Azure Data Factory ETL Pipeline'], ['rag', 'Hybrid Retrieval RAG Application'], ['ragpulse', 'RAGPulse']];
  assert.deepEqual(await page.locator('[data-project]').evaluateAll(cards => cards.map(card => card.dataset.project)), projectCases.map(([id]) => id));
  assert.match(await page.locator('.timeline').textContent(), /BridgeLabz Pvt. Ltd./);
  assert.match(await page.locator('.timeline').textContent(), /Six-month fellowship program/);
  assert.match(await page.locator('.timeline').textContent(), /reducing data errors by 20%/);
  for (const [index, [id, title]] of projectCases.entries()) {
    await scrollToProject(index);
    await page.locator(`[data-project="${id}"]`).click();
    assert.equal(await page.locator('#dialog-title').textContent(), title);
    assert.equal(await page.locator('dialog').evaluate(el => el.open), true);
    if (id === 'adf') {
      assert.equal(await page.locator('dialog .button').getAttribute('href'), 'https://docs.google.com/document/d/1duzaGe8rhN13898-jjpK1dcq0mCpDUT7p95lPj1xxe0/edit?usp=sharing');
      assert.match(await page.locator('dialog .button').textContent(), /READ PROJECT DOCUMENTATION/);
    }
    if (id === 'ragpulse') assert.equal(await page.locator('dialog .button').getAttribute('href'), 'https://github.com/kunalnishad115/RAG-PULSE_AIOPPS');
    if (id === 'uber') {
      assert.equal(await page.locator('dialog .button').getAttribute('href'), 'https://github.com/kunalnishad115/UBER_STREAM_AZURE_PROJECT');
      assert.match(await page.locator('#dialog-content').textContent(), /SCD Type 2 and AUTO CDC/);
    }
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('dialog').evaluate(el => el.open), false);
  }
  await page.keyboard.press('Shift+Tab');
  await page.waitForTimeout(200);
  assert.equal(await page.evaluate(() => document.activeElement.dataset.project), 'rag');
  assert.ok(await page.locator('[data-project="rag"]').evaluate(el => { const rect = el.getBoundingClientRect(); return rect.top >= 0 && rect.bottom < innerHeight; }));
  await page.locator('#about').evaluate(el => scrollTo({ top: scrollY + el.getBoundingClientRect().top, behavior: 'instant' }));
  await page.waitForTimeout(200);
  assert.ok(await page.locator('.project').last().evaluate(el => el.getBoundingClientRect().bottom < 0), 'Stack should release before About');
  const pdf = await page.request.get('/Kunal_Nishad_Resume.pdf');
  assert.equal(pdf.status(), 200);
  assert.ok((await pdf.body()).subarray(0, 4).toString() === '%PDF');
  await page.locator('#copy-email').click();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'nishadkunal1234567@gmail.com');
  await page.locator('#sound-toggle').click();
  assert.equal(await page.locator('#sound-toggle').getAttribute('aria-pressed'), 'true');
  await page.locator('#sound-toggle').click();
  assert.equal(await page.locator('#sound-toggle').getAttribute('aria-pressed'), 'false');
  for (const width of [375, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}px`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(200);
  assert.ok(await page.locator('.project-list').evaluate(el => el.classList.contains('stack-ready')));
  await scrollToProject(1);
  assert.ok(await page.locator('.project').evaluateAll(cards => cards[1].getBoundingClientRect().top < cards[0].getBoundingClientRect().bottom));
  await page.screenshot({ path: 'test-results/stack-mobile.png' });
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(200);
  assert.equal(await page.locator('.project-list').evaluate(el => el.classList.contains('stack-ready')), false);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: 'test-results/mobile.png' });
  await page.locator('nav a[href="#work"]').click();
  await page.waitForTimeout(700);
  assert.equal(new URL(page.url()).hash, '#work');
  await page.locator('[data-project="zomato"]').click();
  await page.locator('.dialog-close').click();
  assert.equal(await page.locator('dialog').evaluate(el => el.open), false);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await page.locator('.flap > span').first().evaluate(el => getComputedStyle(el).animationName), 'none');
  assert.equal(await page.locator('#motion-toggle').getAttribute('aria-pressed'), 'false');
  assert.equal(await page.locator('.ticker-track').evaluate(el => getComputedStyle(el).animationName), 'none');
  assert.equal(await page.locator('.project').first().evaluate(el => getComputedStyle(el).position), 'relative');
  assert.equal((await page.locator('h1').textContent()).replace(/\s/g, ''), 'KUNALNISHAD');
  assert.deepEqual(errors, []);
  console.log('PASS: six projects, Uber content/link, reversible desktop/mobile stacking, stack release, keyboard access, short-screen fallback, motion controls, dialogs, PDF, email, sound, navigation, reduced motion, and browser errors.');
} finally { await browser.close(); }
