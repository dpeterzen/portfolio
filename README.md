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
| `dist/windows.js` | Moving, resizing, minimizing, maximizing, closing, and saved layouts |
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

Drag title bars to move windows and drag any edge to resize. Size, position, and window state are saved on the device.

- Minimize keeps a window in the taskbar; select its taskbar button to restore it.
- Maximize fills the available screen. Select Restore, or double-click the title bar, to return to the previous size and position.
- Close removes the taskbar button. Reopen the window from Work or Guestbook in the header or menu.
- Reset layout in the menu opens both windows at their original size and position.

With a title bar focused, arrow keys move the window. With the bottom-right resize handle focused, arrow keys resize it. Shift uses larger steps; Home resets the window. Escape cancels a move or resize.

## Guestbook

Messages are stored only on the visitor’s device. They are not shared between visitors. A shared guestbook requires a backend.

## Hosting

Serve `dist/` with a static host; no build step is required. Pushing to GitHub does not automatically deploy the hosted preview. Hosting credentials and configuration are excluded from this repository.

## Artwork

The wallpaper was generated with an early-2000s Frutiger Aero landscape prompt: blue sky, green hills, a river, a glass city, and iridescent bubbles. The interface uses text labels without decorative logos or icons.
