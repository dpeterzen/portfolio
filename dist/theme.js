// Apply the theme before styles load, so a saved dark theme never flashes white.
(() => {
  'use strict';
  const key = 'daniels-world-theme-v1';
  const allowed = value => value === 'matrix' || value === 'vista';
  const query = new URLSearchParams(window.location.search).get('theme');
  let saved;
  try { saved = localStorage.getItem(key); } catch { /* Themes work without storage. */ }
  const initial = allowed(query) ? query : allowed(saved) ? saved : 'vista';
  const root = document.documentElement;
  root.dataset.theme = initial;
  function setTheme(theme, persist = false) {
    root.dataset.theme = theme;
    const matrix = theme === 'matrix';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = matrix ? '#020906' : '#67b7ed';
    document.querySelectorAll('[data-theme-choice]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.themeChoice === theme));
    });
    if (persist) {
      try { localStorage.setItem(key, theme); } catch { /* Retain the in-memory choice. */ }
      const url = new URL(window.location.href);
      if (url.searchParams.has('theme')) {
        url.searchParams.set('theme', theme);
        window.history.replaceState(null, '', url);
      }
    }
    document.dispatchEvent(new CustomEvent('portfolio:theme', {detail: {theme}}));
  }
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-theme-choice]').forEach(button => {
      button.addEventListener('click', () => setTheme(button.dataset.themeChoice, true));
    });
    setTheme(initial);
  });
})();
