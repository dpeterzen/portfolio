// Apply the environment before the first paint. The URL overrides the saved choice.
(() => {
  'use strict';
  const key = 'portfolio-environment-v2';
  const unlockKey = 'portfolio-coda-unlocked-v1';
  let unlocked = false;
  try { unlocked = localStorage.getItem(unlockKey) === 'true'; } catch { /* Session discovery. */ }
  document.documentElement.dataset.codaUnlocked = String(unlocked);
  const allowed = theme => ['dune','keep'].includes(theme) || (theme === 'coda' && unlocked);
  const query = new URLSearchParams(window.location.search).get('theme');
  let saved;
  try { saved = localStorage.getItem(key); } catch { /* Storage is optional. */ }
  const initial = allowed(query) ? query : allowed(saved) ? saved : 'dune';
  document.documentElement.dataset.theme = initial;
  function setFavicon(theme) {
    const icon = theme === 'coda' ? 'assets/favicon-notes.svg' : theme === 'keep' ? 'assets/favicon-keep.svg' : 'assets/favicon.svg';
    document.querySelector('link[rel="icon"]').href = icon;
    document.querySelectorAll('[data-theme-logo]').forEach(image => { image.src = icon; });
  }
  setFavicon(initial);
  function setTheme(theme, persist = false) {
    if (!allowed(theme)) return;
    document.documentElement.dataset.theme = theme;
    setFavicon(theme);
    document.querySelector('meta[name="theme-color"]').content = theme === 'coda' ? '#152321' : theme === 'keep' ? '#202c3d' : '#514637';
    document.querySelectorAll('[data-theme-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.themeChoice === theme)));
    document.querySelectorAll('[data-dune]').forEach(element => { element.textContent = element.dataset[theme]; });
    if (persist) {
      try { localStorage.setItem(key, theme); } catch { /* Keep the session choice. */ }
      const url = new URL(window.location.href);
      if (url.searchParams.has('theme')) { url.searchParams.set('theme', theme); window.history.replaceState(null, '', url); }
    }
    document.dispatchEvent(new CustomEvent('portfolio:theme', {detail: {theme}}));
  }
  // The page is CSS-zoomed on very large screens; rects and pointer coordinates are in screen px.
  window.PortfolioZoom = () => parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
  window.PortfolioTheme = {
    restart() {
      unlocked = false;
      document.documentElement.dataset.codaUnlocked = 'false';
      try { localStorage.setItem(unlockKey, 'false'); localStorage.setItem(key, 'dune'); } catch { /* Reload resets session discovery. */ }
      const url = new URL(window.location.href);
      url.searchParams.set('theme', 'dune'); url.hash = '';
      window.location.replace(url);
    },
    unlockCoda(origin) {
      const discovered = !unlocked;
      unlocked = true;
      document.documentElement.dataset.codaUnlocked = 'true';
      try { localStorage.setItem(unlockKey, 'true'); } catch { /* Keep this session. */ }
      setTheme('coda', true);
      if (discovered) document.dispatchEvent(new CustomEvent('portfolio:coda-unlocked', {detail:{origin}}));
    }
  };
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-theme-choice]').forEach(button => button.addEventListener('click', () => setTheme(button.dataset.themeChoice, true)));
    setTheme(initial);
  });
})();
