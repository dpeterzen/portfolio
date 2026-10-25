// Alternate the exterior and interior without interrupting desktop activity.
(() => {
  'use strict';
  const root = document.documentElement;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const control = document.querySelector('#wallpaper-cycle');
  const hint = document.querySelector('#wallpaper-cycle-hint');
  const status = document.querySelector('#wallpaper-view');
  const scenes = ['city', 'room'];
  const key = 'portfolio-wallpaper-cycle-v1';
  let enabled = true;
  let theme = root.dataset.theme;
  let timer;
  try { enabled = localStorage.getItem(key) !== 'off'; } catch { /* Storage is optional. */ }
  root.dataset.wallpaperScene = 'city';

  function advance(direction, manual = false) {
    const index = scenes.indexOf(root.dataset.wallpaperScene);
    root.dataset.wallpaperTransition = manual ? 'manual' : 'auto';
    root.dataset.wallpaperScene = scenes[(index + direction + scenes.length) % scenes.length];
    status.textContent = manual ? (root.dataset.wallpaperScene === 'city' ? 'City view' : 'Indoor view') : '';
  }

  function schedule() {
    window.clearTimeout(timer);
    if (!enabled || motion.matches || document.hidden) return;
    timer = window.setTimeout(() => {
      advance(1);
      schedule();
    }, 30000);
  }

  document.querySelectorAll('[data-scene-step]').forEach(button => {
    button.addEventListener('click', () => {
      advance(Number(button.dataset.sceneStep), true);
      // Cancel the old deadline and give this manually selected scene a full interval.
      schedule();
    });
  });

  function syncControl() {
    control.checked = enabled && !motion.matches;
    control.disabled = motion.matches;
    hint.textContent = motion.matches
      ? 'Automatic cycling is off with reduced motion. Use the arrows to switch views.'
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
    status.textContent = '';
    schedule();
  });
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', () => {
    root.dataset.wallpaperScene = 'city';
    status.textContent = '';
    syncControl();
    schedule();
  });
  syncControl();
  schedule();
})();
