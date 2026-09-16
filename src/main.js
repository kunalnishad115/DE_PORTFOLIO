import { projects, skills } from './data.js';
import { initMotion } from './motion.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
document.querySelectorAll('[data-flap]').forEach(line => {
  line.innerHTML = [...line.dataset.flap].map((letter, i) => `<span class="flap" style="--i:${i}"><span>${letter}</span></span>`).join('');
});

document.querySelector('#projects').innerHTML = projects.map(project => `
  <button class="project" data-project="${project.id}" aria-label="View ${project.subtitle} project details">
    <div class="project-visual visual-${project.id}"><div class="visual-label mono"><span>SYS / ${project.number}</span><span>${project.subtitle.toUpperCase()}</span><span class="accent">●</span></div><div class="architecture">${project.nodes.map((node, i) => `<span class="node"><span class="node-icon">${['≋', '▤', '⋈', '↗'][i]}</span><span>${node}</span></span>${i < 3 ? '<span class="connector"><i></i></span>' : ''}`).join('')}</div><div class="layers mono">${project.layers.map((layer,i) => `<span><i class="layer-dot layer-${i}"></i>${layer}</span>`).join('<b>→</b>')}</div><div class="visual-stats"><div><strong>${project.metric}</strong><span class="mono">${project.metricLabel}</span></div><div><strong>${project.second}</strong><span class="mono">${project.secondLabel}</span></div></div><span class="visual-corner mono">ARCHITECTURE / OVERVIEW</span></div>
    <div class="project-copy"><div class="project-meta mono"><span>${project.number} / ${project.category}</span><span class="project-arrow">↗</span></div><h3>${project.title}</h3><span class="project-subtitle">${project.subtitle}</span><p>${project.description}</p><div class="tags">${project.tags.map(tag => `<span>${tag}</span>`).join('')}</div><span class="case-link mono">EXPLORE PROJECT <span>↗</span></span></div>
  </button>`).join('');
document.querySelector('#skills').innerHTML = skills.map(([number, title, ...items]) => `<div class="skill-row"><span class="skill-number mono">${number}</span><h3>${title}</h3><div>${items.map(item => `<span>${item}</span>`).join('')}</div><span class="skill-plus" aria-hidden="true">+</span></div>`).join('');

const dialog = document.querySelector('#project-dialog');
document.querySelector('nav sup').textContent = String(projects.length).padStart(2, '0');
document.querySelectorAll('[data-project]').forEach(button => button.addEventListener('click', () => {
  const project = projects.find(item => item.id === button.dataset.project);
  document.querySelector('#dialog-content').innerHTML = `<p class="eyebrow accent">PROJECT ${project.number} / ${project.category}</p><h2 id="dialog-title">${project.subtitle}</h2><p class="dialog-intro">${project.description}</p><div class="dialog-flow mono">${project.nodes.join(' <span>→</span> ')}</div><h3>What I built</h3><ul>${project.details.map(detail => `<li>${detail}</li>`).join('')}</ul><h3>The stack</h3><p class="dialog-stack">${project.fullStack}</p><a class="button button-primary" href="${project.documentation || project.repository || 'https://github.com/kunalnishad115'}" target="_blank" rel="noopener noreferrer">${project.documentation ? 'READ PROJECT DOCUMENTATION' : project.repository ? 'VIEW REPOSITORY' : 'VISIT MY GITHUB'} <span>↗</span></a>`;
  dialog.showModal();
  document.body.classList.add('dialog-open');
}));
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
dialog.addEventListener('close', () => document.body.classList.remove('dialog-open'));

const toast = document.querySelector('#toast');
let toastTimer;
function notify(message) { toast.textContent = message; toast.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('visible'), 3500); }
document.querySelector('#copy-email').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText('nishadkunal1234567@gmail.com'); notify('Email copied. Let’s build something.'); }
  catch { notify('Please select the email address to copy it.'); }
});

let audioContext;
let soundEnabled = false;
function clickSound() {
  if (!soundEnabled || !audioContext) return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = 'triangle'; oscillator.frequency.setValueAtTime(160, audioContext.currentTime);
  gain.gain.setValueAtTime(0.035, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.06);
  oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.start(); oscillator.stop(audioContext.currentTime + 0.065);
}
document.querySelector('#sound-toggle').addEventListener('click', async event => {
  const button = event.currentTarget;
  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
    await audioContext.resume(); soundEnabled = !soundEnabled;
    button.textContent = soundEnabled ? '◉ SOUND ON' : '◌ SOUND OFF';
    button.setAttribute('aria-pressed', String(soundEnabled)); clickSound();
  } catch { notify('Sound is unavailable in this browser.'); }
});
document.querySelectorAll('.project').forEach(card => card.addEventListener('pointermove', event => {
  if (reducedMotion.matches) return;
  const rect = card.getBoundingClientRect(); card.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`); card.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`);
}));
const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('revealed'); observer.unobserve(entry.target); } }), { threshold: 0.08 });
document.querySelectorAll('.section-heading, .project, .about-grid, .skill-row, .contact h2').forEach(element => { element.classList.add('reveal'); observer.observe(element); });
const navObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) document.querySelectorAll('nav a').forEach(link => { const active = link.hash === `#${entry.target.id}`; link.classList.toggle('active', active); if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
}), { rootMargin: '-15% 0px -55% 0px' });
document.querySelectorAll('main > section').forEach(section => navObserver.observe(section));
document.querySelector('#year').textContent = new Date().getFullYear();
initMotion({ clickSound });
