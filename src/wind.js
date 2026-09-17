export function initContactWind(isEnabled) {
  const section = document.querySelector('#contact');
  const canvas = document.createElement('canvas');
  canvas.className = 'contact-wind';
  canvas.setAttribute('aria-hidden', 'true');
  section.prepend(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  let width = 0, height = 0, visible = false, frame = 0, last = 0, time = 0;
  let seed = 73129;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  // Each depth layer is a continuous, evenly populated loop. Shared drift per
  // layer prevents faster particles catching slower ones and forming bands.
  const layers = [0.4, 0.7, 1].map(depth => ({ depth, offset: 0 }));
  let particles = [];
  function populate() {
    const count = Math.max(60, Math.min(220, Math.round(width * height / 6200)));
    particles = layers.flatMap(layer => Array.from({ length: count }, (_, i) => ({
      x: (i + random() * 0.8) / count,
      y: random(), size: 0.65 + random() * 1.7,
      depth: layer.depth, layer, phase: random() * Math.PI * 2,
      leaf: random() < 0.24,
      color: ['#ff8b32', '#ffad56', '#f87520', '#ffc17b'][Math.floor(random() * 4)]
    })));
  }
  function draw() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
      const position = ((p.x - p.layer.offset) % 1 + 1) % 1;
      const x = position * (width + 40) - 20;
      const y = ((p.y * height + Math.sin(time * 0.55 + p.phase + position * 5) * 20 + height) % height);
      const edge = Math.max(0, Math.min(1, (x + 10) / 25, (width + 10 - x) / 25));
      ctx.save(); ctx.translate(x, y);
      ctx.globalAlpha = edge * (0.3 + p.depth * 0.65);
      ctx.fillStyle = p.color;
      if (p.leaf) {
        ctx.rotate(-0.35 + Math.sin(time * 0.75 + p.phase) * 0.7);
        ctx.scale(1, 0.65 + Math.sin(time + p.phase) * 0.2);
        ctx.beginPath(); ctx.ellipse(0, 0, p.size * 2.8, p.size * 0.65, 0, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.beginPath(); ctx.arc(0, 0, p.size * 0.65, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    });
  }
  function tick(now) {
    frame = 0;
    if (!visible || !isEnabled() || document.hidden) return;
    const dt = last ? Math.min((now - last) / 1000, 0.04) : 0;
    last = now; time += dt;
    layers.forEach(layer => {
      const gust = 1 + 0.18 * Math.sin(time * 0.6 + layer.depth * 4);
      layer.offset = (layer.offset + dt * (25 + layer.depth * 42) * gust / Math.max(width + 40, 1)) % 1;
    });
    draw(); frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame); frame = 0; last = 0; draw();
    if (visible && isEnabled() && !document.hidden) frame = requestAnimationFrame(tick);
  }
  new ResizeObserver(() => {
    width = section.clientWidth; height = section.clientHeight;
    populate();
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0); sync();
  }).observe(section);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }).observe(section);
  document.addEventListener('visibilitychange', sync);
  return sync;
}
