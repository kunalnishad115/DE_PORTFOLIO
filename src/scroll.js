export function initSmoothScroll(isEnabled) {
  let frame = 0, target = scrollY, written = scrollY, position = scrollY, previous = 0;
  const stop = () => { cancelAnimationFrame(frame); frame = 0; };
  function tick(now) {
    if (!isEnabled() || document.hidden || document.body.classList.contains('dialog-open') || Math.abs(scrollY - written) > 3) { stop(); return; }
    target = Math.max(0, Math.min(target, document.documentElement.scrollHeight - innerHeight));
    const blend = 1 - Math.exp(-Math.min(now - previous, 40) / 90);
    previous = now;
    position += (target - position) * blend;
    scrollTo({ top: Math.abs(target - position) < 1 ? target : position, behavior: 'instant' });
    written = scrollY;
    if (Math.abs(target - written) > 1) frame = requestAnimationFrame(tick);
    else frame = 0;
  }
  addEventListener('wheel', event => {
    if (!isEnabled() || event.ctrlKey || event.metaKey || !event.cancelable || Math.abs(event.deltaX) > Math.abs(event.deltaY) || document.body.classList.contains('dialog-open')) { stop(); return; }
    // Preserve high-resolution trackpad input and native nested scrolling.
    if (event.deltaMode === 0 && Math.abs(event.deltaY) < 45) { stop(); return; }
    for (let el = event.target; el instanceof Element && el !== document.body; el = el.parentElement) {
      if (el.matches('input,textarea,select,[contenteditable="true"]') || (/(auto|scroll)/.test(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight)) { stop(); return; }
    }
    if (!frame) { target = scrollY; written = scrollY; position = scrollY; previous = performance.now(); }
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
    if (Math.sign(delta) !== Math.sign(target - scrollY)) target = scrollY;
    target = Math.max(0, Math.min(target + delta, document.documentElement.scrollHeight - innerHeight));
    event.preventDefault();
    if (!frame) frame = requestAnimationFrame(tick);
  }, { passive: false });
  ['pointerdown', 'touchstart', 'keydown', 'resize', 'visibilitychange'].forEach(type => addEventListener(type, stop, { passive: true }));
  return stop;
}
