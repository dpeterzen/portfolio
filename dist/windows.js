(() => {
  'use strict';
  const key = 'portfolio-window-positions-v1';
  const panels = [...document.querySelectorAll('[data-movable-window]')].map(element => ({
    element,
    handle: element.querySelector('[data-drag-handle]'),
    name: element.querySelector('h2').textContent.trim(),
    x: 0,
    y: 0
  }));
  const status = document.querySelector('#layout-status');
  const resetButton = document.querySelector('#reset-layout');
  const taskbar = document.querySelector('.taskbar');
  let drag = null;

  function save() {
    const positions = Object.fromEntries(panels.map(panel => [panel.element.id, {x: panel.x, y: panel.y}]));
    try { localStorage.setItem(key, JSON.stringify(positions)); } catch { /* Moving works without storage. */ }
  }

  function draw(panel) {
    panel.element.style.transform = panel.x || panel.y ? `translate(${panel.x}px, ${panel.y}px)` : '';
  }

  function move(panel, x, y) {
    const rect = panel.element.getBoundingClientRect();
    const baseLeft = rect.left - panel.x;
    const baseTop = rect.top - panel.y;
    const margin = 10;
    const rightEdge = Math.max(margin, document.documentElement.clientWidth - rect.width - margin);
    const barHeight = taskbar.getBoundingClientRect().height;
    const titleHeight = panel.handle.getBoundingClientRect().height;
    // Keep the entire width and the title bar reachable, including on short screens.
    const bottomEdge = Math.max(margin, window.innerHeight - barHeight - titleHeight - margin);
    panel.x = Math.round(Math.min(rightEdge - baseLeft, Math.max(margin - baseLeft, x)));
    panel.y = Math.round(Math.min(bottomEdge - baseTop, Math.max(margin - baseTop, y)));
    draw(panel);
  }

  function focusPanel(panel) {
    panels.forEach(other => { other.element.style.zIndex = other === panel ? '2' : '1'; });
  }

  function reset(panel) {
    panel.x = 0;
    panel.y = 0;
    draw(panel);
  }

  function finish(cancelled) {
    if (!drag) return;
    const current = drag;
    drag = null;
    current.panel.element.classList.remove('is-dragging');
    document.body.classList.remove('is-moving-window');
    if (cancelled) {
      current.panel.x = current.x;
      current.panel.y = current.y;
      draw(current.panel);
    } else if (current.moved) save();
    if (current.panel.handle.hasPointerCapture(current.pointerId)) {
      current.panel.handle.releasePointerCapture(current.pointerId);
    }
  }

  let stored;
  try { stored = JSON.parse(localStorage.getItem(key) || '{}'); } catch { stored = {}; }
  for (const panel of panels) {
    const position = stored?.[panel.element.id];
    if (position && Number.isFinite(position.x) && Number.isFinite(position.y) && (position.x || position.y)) {
      move(panel, position.x, position.y);
    }
    panel.element.addEventListener('pointerdown', () => focusPanel(panel), {capture: true});
    panel.handle.addEventListener('pointerdown', event => {
      if (drag || event.button !== 0 || event.isPrimary === false || event.target.closest('button, a, input, textarea, select')) return;
      event.preventDefault();
      focusPanel(panel);
      panel.handle.focus({preventScroll: true});
      drag = {panel, pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY, x: panel.x, y: panel.y, moved: false};
      panel.handle.setPointerCapture(event.pointerId);
    });
    panel.handle.addEventListener('pointermove', event => {
      if (!drag || drag.panel !== panel || drag.pointerId !== event.pointerId) return;
      const dx = event.clientX - drag.clientX;
      const dy = event.clientY - drag.clientY;
      if (!drag.moved && Math.hypot(dx, dy) < 3) return;
      drag.moved = true;
      panel.element.classList.add('is-dragging');
      document.body.classList.add('is-moving-window');
      move(panel, drag.x + dx, drag.y + dy);
    });
    panel.handle.addEventListener('pointerup', event => { if (drag?.pointerId === event.pointerId) finish(false); });
    panel.handle.addEventListener('pointercancel', event => { if (drag?.pointerId === event.pointerId) finish(true); });
    panel.handle.addEventListener('lostpointercapture', event => { if (drag?.pointerId === event.pointerId) finish(true); });
    panel.handle.addEventListener('dblclick', () => {
      finish(true);
      reset(panel);
      save();
      status.textContent = `${panel.name} window reset.`;
    });
    panel.handle.addEventListener('keydown', event => {
      if (event.target !== panel.handle || event.ctrlKey || event.metaKey || event.altKey) return;
      const direction = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]}[event.key];
      if (!direction && event.key !== 'Home') return;
      event.preventDefault();
      finish(true);
      focusPanel(panel);
      if (event.key === 'Home') {
        reset(panel);
        status.textContent = `${panel.name} window reset.`;
      } else {
        const step = event.shiftKey ? 50 : 10;
        move(panel, panel.x + direction[0] * step, panel.y + direction[1] * step);
        status.textContent = `${panel.name} window moved ${event.key.slice(5).toLowerCase()}.`;
      }
      save();
    });
  }

  resetButton.addEventListener('click', () => {
    finish(true);
    panels.forEach(panel => { reset(panel); panel.element.style.zIndex = '1'; });
    try { localStorage.removeItem(key); } catch { /* The visible layout still resets. */ }
    status.textContent = 'Window layout reset.';
    document.querySelector('#start-button')?.focus({preventScroll: true});
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && drag) { event.preventDefault(); finish(true); }
  });
  window.addEventListener('blur', () => finish(true));
  window.addEventListener('resize', () => {
    finish(true);
    panels.forEach(panel => { if (panel.x || panel.y) move(panel, panel.x, panel.y); });
    save();
  });
})();
