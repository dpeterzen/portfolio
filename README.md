# Portfolio

Daniel Peterson’s desktop portfolio. Two environments, custom project folders, and focused project views:

- **Dune** — a quiet future-western outpost, weathered folders, and field dossiers.
- **Keep** — a moonlit castle, bound folios, and a silver-framed archive.

Static HTML, CSS, and JavaScript. No build step or production dependencies.

## Run

```sh
git clone https://github.com/dpeterzen/portfolio.git
cd portfolio
python3 -m http.server 4173 --directory dist
```

Open [localhost:4173](http://localhost:4173). Use `?theme=dune` or `?theme=keep` for an environment link. The theme selection is remembered on the visitor’s device.

Click a project folder to zoom in. Use **Desktop** or **Escape** to return. The next-project link moves between projects; browser Back/Forward and direct links such as `?theme=keep#tilerecall` are supported. Reduced-motion preferences disable zoom and transition animations.

## Edit

| File | Purpose |
| --- | --- |
| `dist/projects.js` | Project records: folder, description, details, link, and status |
| `dist/index.html` | Desktop, environment switch, project dialog, guestbook |
| `dist/styles.css` | Both environments, folder objects, project studies, responsive layouts |
| `dist/theme.js` | Theme persistence, URL preferences, environment copy |
| `dist/app.js` | Folder rendering, zoom, project routing, guestbook, clock |
| `dist/assets/` | Environment artwork and favicon |
| `ARTWORK.md` | Image generation prompts and attribution of illustrative studies |

Each record in `window.PORTFOLIO_PROJECTS` creates a folder and a project view. Keep `id` unique and URL-safe; it is used for direct links. `visual` chooses the `tiles` or `paintings` folder and illustration. Extend the visual functions and CSS for a new custom project object. Set `pending: true` for a project that has not launched; its domain is shown as coming soon rather than as an active website link. Review desktop and phone layouts after adding projects.

## Check

```sh
node --check dist/app.js
node --check dist/projects.js
node --check dist/theme.js
node tests/theme.test.cjs
```

The automated checks cover theme persistence, URL precedence, unavailable storage, accessible toggle state, and environment text. Browser checks for the redesign covered both environments, project opening and switching, Escape and focus restoration, phone layouts, and guestbook validation. Test notes are local to the preview browser.

## Guestbook

Messages are stored only on the visitor’s device. They are not shared between visitors. Existing notes from the previous portfolio are retained. A shared guestbook requires a backend.

## Hosting

Serve `dist/` with a static host. Pushing to GitHub does not automatically deploy the hosted site. Private hosting configuration and credentials are excluded from this repository.

## Content

TileRecall’s description is based on its project README; it remains marked in development. Both project illustrations are labeled as conceptual studies. The gallery artwork is not a reproduction of Ruthie’s paintings.
