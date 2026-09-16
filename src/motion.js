export function initMotion({ clickSound }) {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const root = document.documentElement;
  let enabled = !preference.matches;
  let frame = 0;
  let flapFrame = 0;
  let lastReplay = 0;
  const tiles = [...document.querySelectorAll('.flap')];
  const letters = tiles.map(tile => tile.textContent);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const hero = document.querySelector('.hero');
  const projectList = document.querySelector('.project-list');
  const cards = [...projectList.querySelectorAll('.project')];
  let stackFits = false;
  let stackBase = 64;
  let stackStep = 16;
  cards.forEach((card, index) => card.style.setProperty('--stack-index', index));

  function measureStack() {
    stackBase = innerWidth <= 700 ? 20 : 64;
    stackStep = innerWidth <= 700 ? 10 : 16;
    stackFits = Math.max(...cards.map(card => card.offsetHeight)) + stackBase + stackStep * (cards.length - 1) + 24 < innerHeight;
    projectList.classList.toggle('stack-ready', stackFits && enabled);
    if (stackFits && enabled) cards.forEach(card => card.classList.add('revealed'));
    onScroll();
  }
  // Keyboard navigation must bring a covered card back to its own reading position.
  cards.forEach((card, index) => card.addEventListener('focus', () => {
    if (!stackFits || !enabled || !card.matches(':focus-visible')) return;
    const gap = parseFloat(getComputedStyle(projectList).rowGap);
    const preceding = cards.slice(0, index).reduce((sum, item) => sum + item.offsetHeight + gap, 0);
    const top = projectList.getBoundingClientRect().top + scrollY + preceding - stackBase - index * stackStep;
    scrollTo({ top, behavior: 'instant' });
  }));

  const controls = document.createElement('div');
  controls.className = 'motion-controls';
  const toggle = document.createElement('button');
  toggle.id = 'motion-toggle';
  controls.append(toggle);
  document.querySelector('.hero-footer').append(controls);
  controls.append(document.querySelector('#sound-toggle'));
  const progress = document.createElement('div');
  progress.className = 'reading-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.append(progress);

  // Two identical decorative tracks make the marquee seamless at any width.
  const ticker = document.querySelector('.ticker');
  const track = document.createElement('div');
  track.className = 'ticker-track';
  const group = ticker.firstElementChild;
  group.className = 'ticker-group';
  track.setAttribute('aria-hidden', 'true');
  track.append(group, group.cloneNode(true));
  ticker.append(track);
  ticker.setAttribute('aria-label', 'Core technologies: Python, SQL, Azure, Snowflake, Apache Airflow, dbt, PySpark, AWS');

  function settleLetters() {
    cancelAnimationFrame(flapFrame);
    tiles.forEach((tile, i) => { tile.firstElementChild.textContent = letters[i]; tile.classList.remove('cycling'); });
  }
  function replay() {
    if (!enabled || document.hidden) return;
    settleLetters();
    const start = performance.now();
    lastReplay = start;
    let lastTick = -1;
    function step(now) {
      const tick = Math.floor((now - start) / 85);
      if (tick !== lastTick) {
        lastTick = tick;
        tiles.forEach((tile, i) => {
          const done = now - start > 400 + i * 65;
          tile.firstElementChild.textContent = done ? letters[i] : alphabet[(tick * 7 + i * 11) % alphabet.length];
          tile.classList.toggle('cycling', !done);
        });
        if (tick % 3 === 0) clickSound();
      }
      if (now - start < 1150) flapFrame = requestAnimationFrame(step);
      else settleLetters();
    }
    flapFrame = requestAnimationFrame(step);
  }
  document.querySelector('h1').addEventListener('pointerenter', () => {
    if (performance.now() - lastReplay > 1400 && finePointer.matches) replay();
  });

  // Scroll work is batched into one frame and stops completely when disabled.
  function updateScroll() {
    frame = 0;
    const extent = root.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${extent > 0 ? scrollY / extent : 0})`;
    if (enabled) hero.style.setProperty('--grid-shift', `${Math.min(scrollY, innerHeight) * 0.16}px`);
    if (stackFits && enabled) {
      // Read all positions before writing styles to avoid repeated layout work.
      const positions = cards.map(card => card.getBoundingClientRect().top);
      cards.forEach((card, index) => {
        const nextTop = positions[index + 1];
        const pin = stackBase + (index + 1) * stackStep;
        const overlap = nextTop === undefined ? 0 : Math.min(1, Math.max(0, (pin + card.offsetHeight - nextTop) / card.offsetHeight));
        card.style.setProperty('--stack-scale', (1 - overlap * 0.035).toFixed(4));
        card.style.setProperty('--stack-shade', (overlap * 0.2).toFixed(3));
      });
    }
  }
  function onScroll() { if (!frame) frame = requestAnimationFrame(updateScroll); }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', measureStack, { passive: true });
  const cardResize = new ResizeObserver(measureStack);
  cards.forEach(card => cardResize.observe(card));

  document.querySelectorAll('.project').forEach(card => {
    const badge = document.createElement('span');
    badge.className = 'project-cursor mono';
    badge.textContent = 'EXPLORE ↗';
    badge.setAttribute('aria-hidden', 'true');
    card.append(badge);
    card.addEventListener('pointermove', event => {
      if (!enabled || !finePointer.matches) return;
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty('--tilt-x', `${-y * 5}deg`);
      card.style.setProperty('--tilt-y', `${x * 5}deg`);
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    });
  });
  document.querySelectorAll('.section-heading h2, .about h2, .contact h2').forEach(heading => heading.classList.add('animated-heading'));

  function applyState() {
    root.classList.toggle('motion-on', enabled);
    root.classList.toggle('motion-paused', !enabled);
    toggle.textContent = enabled ? 'Ⅱ MOTION ON' : '▷ MOTION OFF';
    toggle.setAttribute('aria-pressed', String(enabled));
    toggle.setAttribute('aria-label', enabled ? 'Pause animations' : 'Enable animations');
    if (!enabled) { settleLetters(); hero.style.removeProperty('--grid-shift'); }
    measureStack();
    onScroll();
  }
  toggle.addEventListener('click', () => { enabled = !enabled; applyState(); if (enabled) replay(); });
  preference.addEventListener('change', () => { enabled = !preference.matches; applyState(); });
  document.addEventListener('visibilitychange', () => {
    root.classList.toggle('motion-hidden', document.hidden);
    if (document.hidden) settleLetters();
  });
  applyState();
  replay();
}
