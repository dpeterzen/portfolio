// Apply the environment before the first paint. The URL overrides the saved choice.
(() => {
  'use strict';
  const key = 'portfolio-environment-v2';
  const allowed = theme => theme === 'dune' || theme === 'keep';
  const query = new URLSearchParams(window.location.search).get('theme');
  let saved;
  try { saved = localStorage.getItem(key); } catch { /* Storage is optional. */ }
  const initial = allowed(query) ? query : allowed(saved) ? saved : 'dune';
  document.documentElement.dataset.theme = initial;
  function setTheme(theme, persist = false) {
    if (!allowed(theme)) return;
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]').content = theme === 'keep' ? '#202c3d' : '#514637';
    document.querySelectorAll('[data-theme-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.themeChoice === theme)));
    document.querySelectorAll('[data-dune]').forEach(element => { element.textContent = element.dataset[theme]; });
    if (persist) {
      try { localStorage.setItem(key, theme); } catch { /* Keep the session choice. */ }
      const url = new URL(window.location.href);
      if (url.searchParams.has('theme')) { url.searchParams.set('theme', theme); window.history.replaceState(null, '', url); }
    }
    document.dispatchEvent(new CustomEvent('portfolio:theme', {detail: {theme}}));
  }
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-theme-choice]').forEach(button => button.addEventListener('click', () => setTheme(button.dataset.themeChoice, true)));
    setTheme(initial);
  });
})();
