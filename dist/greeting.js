// A brief text scramble between long, still greetings. The accessible label stays stable.
(() => {
  'use strict';
  const root = document.documentElement;
  const text = document.querySelector('#status-greeting-text');
  const notepad = document.querySelector('#window-about');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const greetings = [
    ['en', 'Hello world!'],
    ['ko', '안녕, 세상!'],
    ['el', 'Γεια σου, κόσμε!'],
    ['zh-Hans', '你好，世界！'],
    ['es', '¡Hola, mundo!']
  ];
  const glyphs = '01/<>_+*';
  let index = 0, timer;
  const canRun = () => !document.hidden && !notepad.hidden && !reduced.matches && root.dataset.motion !== 'off';

  function settle() {
    const [lang, greeting] = greetings[index];
    text.lang = lang;
    text.textContent = greeting;
  }

  function schedule() {
    clearTimeout(timer);
    settle();
    if (canRun()) timer = setTimeout(scramble, 9000);
  }

  function scramble() {
    if (!canRun()) return schedule();
    index = (index + 1) % greetings.length;
    const characters = Array.from(greetings[index][1]);
    text.lang = greetings[index][0];
    let step = 0;
    function tick() {
      if (!canRun() || step === 9) return schedule();
      const resolved = Math.floor(characters.length * step / 9);
      text.textContent = characters.map((character, position) =>
        position < resolved || /[\s,!！，]/u.test(character)
          ? character : glyphs[Math.floor(Math.random() * glyphs.length)]
      ).join('');
      step++;
      timer = setTimeout(tick, 70);
    }
    tick();
  }

  // Stop immediately when motion is disabled or the notepad/tab is hidden.
  new MutationObserver(schedule).observe(root, {attributes:true, attributeFilter:['data-motion']});
  new MutationObserver(schedule).observe(notepad, {attributes:true, attributeFilter:['hidden']});
  reduced.addEventListener('change', schedule);
  document.addEventListener('visibilitychange', schedule);
  schedule();
})();
