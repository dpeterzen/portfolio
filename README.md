# Portfolio

Daniel Peterson’s portfolio. Static HTML, CSS, and JavaScript, with Vista and Matrix themes.

## Run

```sh
git clone https://github.com/dpeterzen/portfolio.git
cd portfolio
python3 -m http.server 4173 --directory dist
```

Open [localhost:4173](http://localhost:4173). Use `?theme=matrix` to open the dark theme directly.

## Edit

| File | Purpose |
| --- | --- |
| `dist/index.html` | Layout and copy |
| `dist/projects.js` | Project names, descriptions, links, and status |
| `dist/styles.css` | Vista styling and responsive layout |
| `dist/matrix.css` | Matrix theme |
| `dist/theme.js` | Saved theme preferences |
| `dist/matrix-rain.js` | Background animation |
| `dist/app.js` | Project rendering, guestbook, and navigation |
| `dist/windows.js` | Dragging, keyboard movement, and saved window positions |
| `dist/assets/` | Wallpaper and favicon |

Add an object to `window.PORTFOLIO_PROJECTS` to add a project. Set `pending: true` if its website is still in development. Reload the browser after editing.

## Check

Requires Node.js:

```sh
node --check dist/app.js
node --check dist/theme.js
node --check dist/matrix-rain.js
node tests/theme.test.cjs
node tests/windows.test.cjs
```

The theme checks cover preferences, direct links, unavailable storage, reduced motion, pause/resume, hidden tabs, and animation scheduling. Check layout separately in a browser.

## Windows

Drag the Work and Guestbook title bars to reposition them. Positions are saved on the device. Double-click a title bar to reset that window, or choose **Reset layout** in the navigation menu to reset both. With a title bar focused, use arrow keys to move, Shift for larger steps, and Home to reset. Escape cancels a drag.

## Guestbook

Messages are stored only on the visitor’s device. They are not shared between visitors. A shared guestbook requires a backend.

## Hosting

Serve `dist/` with a static host; no build step is required. Pushing to GitHub does not automatically deploy the hosted preview. Hosting credentials and configuration are excluded from this repository.

## Artwork

The wallpaper was generated with an early-2000s Frutiger Aero landscape prompt: blue sky, green hills, a river, a glass city, and iridescent bubbles. The miniature canvases are CSS illustrations, not reproductions of Ruthie’s paintings.
