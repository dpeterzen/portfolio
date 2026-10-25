// Alternate the exterior and interior without interrupting desktop activity.
(() => {
  'use strict';
  const root = document.documentElement;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const control = document.querySelector('#wallpaper-cycle');
  const hint = document.querySelector('#wallpaper-cycle-hint');
  const key = 'portfolio-wallpaper-cycle-v1';
  let enabled = true;
  let theme = root.dataset.theme;
  let timer;
  try { enabled = localStorage.getItem(key) !== 'off'; } catch { /* Storage is optional. */ }
  root.dataset.wallpaperScene = 'city';

  function schedule() {
    window.clearTimeout(timer);
    if (!enabled || motion.matches || document.hidden) return;
    timer = window.setTimeout(() => {
      root.dataset.wallpaperScene = root.dataset.wallpaperScene === 'city' ? 'room' : 'city';
      schedule();
    }, 30000);
  }

  function syncControl() {
    control.checked = enabled && !motion.matches;
    control.disabled = motion.matches;
    hint.textContent = motion.matches
      ? 'Wallpaper stays still with reduced motion.'
      : 'City first, then indoors. Your settings are saved on this device.';
  }

  control.addEventListener('change', () => {
    enabled = control.checked;
    try { localStorage.setItem(key, enabled ? 'on' : 'off'); } catch { /* Keep the session choice. */ }
    schedule();
  });
  document.addEventListener('portfolio:theme', event => {
    if (event.detail.theme === theme) return;
    theme = event.detail.theme;
    root.dataset.wallpaperScene = 'city';
    schedule();
  });
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', () => {
    root.dataset.wallpaperScene = 'city';
    syncControl();
    schedule();
  });
  syncControl();
  schedule();
})();
