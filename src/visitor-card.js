import './visitor-card.css';

export function initVisitorCard(isEnabled) {
  const host = document.createElement('section');
  host.className = 'visitor-pass';
  host.setAttribute('aria-label', 'Your portfolio visitor pass');
  host.innerHTML = `<div class="visitor-stage">
    <div class="visitor-fallback"><span class="pass-brand">k.n</span><span>KUNAL NISHAD / PORTFOLIO</span><strong>Good to have<br>you here.</strong><span class="pass-fallback-name">VISITOR</span><small>ALL ACCESS · 2026</small></div>
    <canvas aria-label="Hanging visitor pass. Drag and release to swing it." role="img"></canvas>
    <span class="visitor-hint">DRAG IT. MAKE YOURSELF AT HOME.</span>
  </div><form class="visitor-form"><label for="visitor-name">Make this pass yours <span>GUEST / 001</span></label><div><input id="visitor-name" name="visitor" autocomplete="given-name" maxlength="20" placeholder="Your name" aria-label="Name on your visitor pass"><button type="submit">Apply <span aria-hidden="true">↗</span></button><button type="button" class="visitor-replay" aria-label="Drop the visitor pass again" title="Drop again">↻</button></div><p class="visitor-status" role="status" aria-live="polite"></p></form>`;
  document.querySelector('.pipeline-preview').replaceWith(host);
  let card, visible = false, loading = false;
  const canvas = host.querySelector('canvas');
  const nameInput = host.querySelector('input');
  function sync() {
    card?.setRunning(visible && isEnabled() && !document.hidden);
    host.querySelector('.visitor-replay').disabled = !isEnabled();
    if (!visible || loading) return;
    loading = true;
    import('./visitor-scene.js').then(({ createVisitorScene }) => createVisitorScene(canvas, isEnabled)).then(scene => {
      card = scene;
      card.setName(nameInput.value.trim());
      host.dataset.renderer = 'webgl';
      sync();
    }).catch(error => {
      host.dataset.renderer = 'fallback';
      console.warn('Visitor pass using static display:', error.message);
    });
  }
  host.querySelector('form').addEventListener('submit', event => {
    event.preventDefault();
    const name = nameInput.value.trim();
    card?.setName(name);
    host.querySelector('.pass-fallback-name').textContent = name || 'VISITOR';
    host.querySelector('.visitor-status').textContent = name ? `Welcome, ${name}. Your pass is ready.` : 'Your visitor pass is ready.';
  });
  host.querySelector('.visitor-replay').addEventListener('click', () => { if (isEnabled()) card?.drop(); });
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: .05 }).observe(host);
  document.addEventListener('visibilitychange', sync);
  return sync;
}
