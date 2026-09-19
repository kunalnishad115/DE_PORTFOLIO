export function initContactWords(isEnabled) {
  const heading = document.querySelector('.contact h2');
  const emphasis = heading.querySelector('em');
  const phrases = ['solid.', 'smart.', 'scalable.', 'impactful.'];
  let current = 0;
  let visible = false;
  let timer;

  // Reserve the longest phrase's space and keep a stable screen-reader label.
  emphasis.classList.add('contact-words');
  const label = document.createElement('span');
  label.className = 'contact-word-label';
  label.textContent = emphasis.textContent;
  const words = phrases.map((phrase, index) => {
    const word = document.createElement('span');
    word.className = `contact-word${index === 0 ? ' is-current' : ''}`;
    word.textContent = phrase;
    word.setAttribute('aria-hidden', 'true');
    return word;
  });
  emphasis.replaceChildren(label, ...words);

  function advance() {
    words.forEach(word => word.classList.remove('is-leaving'));
    words[current].classList.replace('is-current', 'is-leaving');
    current = (current + 1) % words.length;
    words[current].classList.add('is-current');
  }

  function sync() {
    clearInterval(timer);
    words.forEach(word => word.classList.remove('is-leaving'));
    if (!isEnabled()) {
      current = 0;
      words.forEach((word, index) => word.classList.toggle('is-current', index === 0));
    }
    if (isEnabled() && visible && !document.hidden) timer = setInterval(advance, 3200);
  }

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  }, { threshold: 0.15 });
  observer.observe(heading);
  document.addEventListener('visibilitychange', sync);
  return sync;
}
