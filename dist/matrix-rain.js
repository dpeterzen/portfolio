(() => {
  'use strict';
  const canvas = document.querySelector('#matrix-rain');
  const context = canvas.getContext('2d');
  if (!context) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const glyphs = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ';
  const cell = 22;
  let width = 0;
  let height = 0;
  let streams = [];
  let frame = null;
  let lastPaint = 0;
  let lastStep = 0;
  let resizeTimer;
  const inMatrix = () => document.documentElement.dataset.theme === 'matrix';
  const mayAnimate = () => inMatrix() && !document.hidden && !reducedMotion.matches && !document.body.classList.contains('motion-paused');

  function paint() {
    context.clearRect(0, 0, width, height);
    context.font = '13px monospace';
    context.textAlign = 'center';
    for (const stream of streams) {
      for (let i = 0; i < stream.length; i++) {
        const y = stream.y - i * cell;
        if (y < -cell || y > height + cell) continue;
        const symbol = glyphs[(stream.seed + i * 7 + stream.tick) % glyphs.length];
        const fade = (1 - i / stream.length) * stream.opacity;
        context.fillStyle = i === 0 ? `rgba(185,255,211,${fade})` : `rgba(51,209,111,${fade * 0.75})`;
        context.fillText(symbol, stream.x, y);
      }
    }
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    streams = Array.from({length: Math.ceil(width / cell)}, (_, index) => ({
      x: index * cell + cell / 2,
      y: Math.random() * (height + 400),
      length: 9 + Math.floor(Math.random() * 17),
      speed: 24 + Math.random() * 45,
      opacity: index % 3 === 0 ? 0.58 : 0.12 + Math.random() * 0.18,
      seed: Math.floor(Math.random() * glyphs.length),
      tick: 0
    }));
    if (inMatrix()) paint();
  }

  function stop() {
    if (frame !== null) window.cancelAnimationFrame(frame);
    frame = null;
    lastPaint = 0;
    lastStep = 0;
  }

  function animate(now) {
    frame = null;
    if (!mayAnimate()) return;
    if (!lastPaint || now - lastPaint >= 65) {
      const elapsed = lastPaint ? Math.min((now - lastPaint) / 1000, 0.15) : 0;
      const changeSymbols = now - lastStep > 280;
      for (const stream of streams) {
        stream.y += stream.speed * elapsed;
        if (stream.y - stream.length * cell > height) stream.y = -cell;
        if (changeSymbols) stream.tick = (stream.tick + 1) % glyphs.length;
      }
      if (changeSymbols) lastStep = now;
      paint();
      lastPaint = now;
    }
    frame = window.requestAnimationFrame(animate);
  }

  function sync() {
    stop();
    if (!inMatrix()) return;
    paint();
    if (mayAnimate()) frame = window.requestAnimationFrame(animate);
  }

  document.addEventListener('portfolio:theme', sync);
  document.addEventListener('portfolio:motion', sync);
  document.addEventListener('visibilitychange', sync);
  reducedMotion.addEventListener('change', sync);
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => { resize(); sync(); }, 120);
  });
  resize();
  sync();
})();
