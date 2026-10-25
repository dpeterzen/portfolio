# Portfolio

Daniel Peterson’s portfolio as a functioning retro desktop, with two lo-fi pixel-art office themes. Both use a distant view, a small laptop-workstation figure, and a restrained tonal palette:

- **Dune** — a laptop workspace in a desert outpost, in warm sand and brown tones.
- **Keep** — a laptop workspace in a castle study, in slate and midnight blue.

Static HTML, CSS, and JavaScript. No build step or production dependencies.

## Run

```sh
git clone https://github.com/dpeterzen/portfolio.git
cd portfolio
python3 -m http.server 4173 --directory dist
```

Open [localhost:4173](http://localhost:4173). Use `?theme=dune` or `?theme=keep` for an environment link; theme selection is remembered on the visitor’s device.

## Desktop controls

- Double-click a desktop folder to open it; on touchscreens, tap once. Keyboard users can focus an icon and press Enter or Space.
- Drag a window by its title bar. Use the bottom-right resize handle on desktop.
- Minimize, maximize/restore, and close controls work independently for every window. Double-clicking a title bar also toggles maximize.
- Taskbar buttons restore or minimize their window. The far-right taskbar control shows the desktop and restores the prior visible windows.
- The Start menu opens projects, the guestbook, and Display Properties. Theme choices are also available in the top bar.
- Project folders contain `readme.txt` for information and `preview.img` for an illustrative study.
- Escape dismisses Start or closes the active window. Direct project links such as `?theme=keep#tilerecall` and browser Back/Forward are supported.

The welcome window starts minimized on phones so the desktop folders stay visible. Phone windows fit the workspace. Reduced-motion preferences disable opening and theme transitions.

## Edit

| File | Purpose |
| --- | --- |
| `dist/projects.js` | Project records and folder metadata |
| `dist/index.html` | Desktop shell, icon sprites, Start menu, taskbar |
| `dist/styles.css` | Both palettes, retro chrome, project illustrations, responsive layout |
| `dist/theme.js` | Saved theme and URL preferences |
| `dist/window-state.js` | Independent window state and focus ordering |
| `dist/app.js` | Window manager, drag, file views, guestbook, clock, routing |
| `dist/assets/` | Office wallpapers and favicon |
| `ARTWORK.md` | Built-in image-generation prompts and asset paths |

Add a record to `window.PORTFOLIO_PROJECTS` to create a desktop folder, Start entry, and project window. Keep `id` unique and URL-safe for direct links. `visual` selects the `tiles` or `paintings` illustration. Add another case to `projectStudy()` and corresponding CSS for a new project visual. Set `pending: true` until the project’s website launches. Check desktop and phone layouts when extending the collection.

## Check

```sh
node --check dist/app.js
node --check dist/window-state.js
node --check dist/theme.js
node --check dist/projects.js
node tests/theme.test.cjs
node tests/windows.test.cjs
```

Theme tests cover persistence, URL precedence, unavailable storage, accessible toggle state, and environment text. Window tests cover focus stacking, taskbar behavior, minimize/maximize restoration, closed-window behavior, and showing/restoring desktop groups. Validate pointer interactions and responsive layouts separately in a browser.

## Guestbook

Messages are stored only on the visitor’s device, and are not shared between visitors. Existing notes from earlier portfolio versions are retained. A shared guestbook requires a backend.

## Hosting

Serve `dist/` with a static host. Pushing to GitHub does not automatically deploy the hosted site. Private hosting configuration and credentials are excluded from this repository.

## Content

TileRecall’s description is based on its project README and remains marked in development. Both project previews are labeled as conceptual studies. The gallery study is not a reproduction of Ruthie’s paintings. The wallpaper character is a stylized person seen from behind, not a photographic likeness.
