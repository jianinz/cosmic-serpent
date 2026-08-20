# Cosmic Serpent

Cosmic Serpent is a browser-based space snake game designed for desktop and iPad.

The player travels through the Solar System as a cosmic snake, collecting energy, avoiding black holes, asteroids, space debris, hostile snakes, and the dangerous inner zone of the Sun.

## Current build

**iPad Touch V2**

### Gameplay

- Planet progression: Moon → Mars → Earth → Mercury → Neptune → Pluto → Jupiter → Saturn
- Three difficulty levels: Easy / Medium / Hard
- Energy collection and snake growth
- Special traversal beans unlock the next planet
- Hostile AI snakes
- Black holes, asteroids, and space debris
- Solar risk/reward mechanic: rapid energy harvesting near the Sun, continuous body loss when too close
- Pause, save, and continue
- Procedural ambient music

### Controls

#### iPad / touch

- Drag a finger anywhere on the play field to steer
- Release the finger to continue in the current direction
- Hold **BOOST** to accelerate
- Use the pause button to pause the game

#### Desktop

- WASD / Arrow keys: steer
- Shift: boost
- P / Esc: pause

## PWA installation on iPad

1. Deploy this repository over HTTPS, for example with GitHub Pages.
2. Open the site in Safari on iPad.
3. Tap **Share**.
4. Choose **Add to Home Screen**.
5. Launch Cosmic Serpent from the Home Screen.

The PWA includes a web app manifest, Apple touch icon, and service worker for offline caching.

## Local development

From the repository root:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000` on desktop, or use the computer's LAN IP from an iPad on the same network.

## Project structure

```text
.
├── index.html
├── styles.css
├── game-core.js
├── game-render.js
├── game-input.js
├── manifest.webmanifest
├── service-worker.js
├── icons/
│   ├── icon-180.png
│   ├── icon-192.png
│   └── icon-512.png
└── README.md
```

## Status

Early playable prototype. Gameplay, visual design, planet-specific mechanics, touch controls, and balancing are under active iteration.
