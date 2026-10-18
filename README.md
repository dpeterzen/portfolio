# Daniel’s World

A personal portfolio with Windows Vista glass, a surreal landscape, and an optional Matrix theme. Links to [TileRecall](https://tilerecall.com) (in development) and [Ruthie Paintings](https://ruthiepaintings.com), with space for future projects.

Plain HTML, CSS, and JavaScript. No build step or dependency installation is required.

## Run locally

```sh
git clone https://github.com/dpeterzen/daniels-world.git
cd daniels-world
python3 -m http.server 4173 --directory dist
```

Open [localhost:4173](http://localhost:4173). For the dark theme, open [localhost:4173/?theme=matrix](http://localhost:4173/?theme=matrix).

## Make changes

| File | What to edit |
| --- | --- |
| `dist/index.html` | Page layout, headings, navigation, and copy |
| `dist/projects.js` | Project names, descriptions, links, and status |
| `dist/styles.css` | Vista styling and responsive layouts |
| `dist/matrix.css` | Matrix dark theme |
| `dist/theme.js` | Theme selection and saved preferences |
| `dist/matrix-rain.js` | Digital rain and motion behavior |
| `dist/app.js` | Project rendering, guestbook, and desktop controls |
| `dist/assets/` | Wallpaper and favicon |

To add a project, add an object to `window.PORTFOLIO_PROJECTS` in `dist/projects.js`. Set `pending: true` for a website that is not live yet. The future-project card follows the configured projects automatically.

Reload the browser after editing; this is a static site without hot reloading.

## Check changes

With Node.js installed, run:

```sh
node --check dist/app.js
node --check dist/theme.js
node --check dist/matrix-rain.js
node tests/theme.test.cjs
```

The theme checks use a simulated browser to verify saved preferences, direct theme links, unavailable storage, reduced motion, pause/resume, hidden tabs, and animation scheduling. They do not replace checking the layout in a browser.

## Themes

Use **Vista / Matrix** in the header. Vista is the default; explicit selections are remembered on the device. `?theme=matrix` opens the dark theme directly without replacing a saved preference.

Matrix includes smoked glass, phosphor-green accents, a wireframe sphere, scanlines, and canvas code rain. The motion control pauses animations. Reduced-motion preferences show a still rain pattern; animation stops in hidden tabs and in Vista mode.

## Guestbook

The guestbook is a browser-local prototype. Messages stay in localStorage on the visitor’s device and are not shared between visitors. The interface labels this limitation. A shared guestbook would require a backend.

## Deploy

Serve the contents of `dist/` using a static host. There is no build command. The GitHub repository contains the public website source; it does not automatically update the existing hosted preview. Private hosting configuration and credentials are excluded.

## Artwork

`dist/assets/dreamscape.jpg` is an original wallpaper made with the built-in image generation tool. Its prompt described a surreal early-2000s Frutiger Aero / Windows Vista landscape with saturated blue sky, white clouds, luminous green hills, a winding turquoise river, a distant glass city, and iridescent bubbles. The miniature canvases on the Ruthie Paintings card are CSS illustrations, not reproductions of Ruthie’s work.
