# Portfolio

Daniel Peterson’s personal portfolio, built with HTML, CSS, and JavaScript. A desktop-style interface for browsing projects. No build step or dependencies.

## Run locally

```sh
python3 -m http.server 4173 --directory dist
```

Open [localhost:4173](http://localhost:4173).

Project content is in `dist/projects.js`. Serve `dist/` to deploy.

The desktop includes Snake and Asteroids, available from their icons or the Start menu. Snake uses arrows/WASD; Asteroids uses left/right to rotate, up to thrust, and Space to fire. Both support P to pause, R to restart, F for fullscreen, and on-screen touch controls. Switching apps or leaving the browser pauses play. Best scores stay in this browser.

Game simulations live in `dist/games-engine.js`; desktop controls and rendering are in `dist/arcade.js`. Run `node tests/games.test.cjs` for gameplay checks.
