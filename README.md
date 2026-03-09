# QuantumSupremacyRTS

QuantumSupremacyRTS is a small browser-based real-time strategy prototype built with plain HTML, CSS, and JavaScript modules. It currently includes player and AI headquarters, tanks, collectors, resource harvesting, fog of war, pathfinding, and a standalone map editor.

## Current Features

- RTS-style camera movement with zoom and panning
- Box selection and right-click move commands for player tanks
- Headquarters that spend resources to build tanks and collectors
- Collectors that harvest resource nodes and return materials to HQ
- AI-controlled base that builds units and scouts or attacks dynamically
- Fog of war with explored and visible areas
- Tile-based map loading from `map.json`
- Browser map editor for painting tiles and saving maps as JSON

## Game Controls

- Mouse wheel: zoom toward the cursor
- Left drag: box select units
- Right click: move selected units
- Middle drag: pan camera
- Shift + left drag: pan camera
- Click HQ: open build panel

## Map Editor

Open `map_editor.html` through the same local server.

The editor supports:

- Painting tiles on a 32 x 22 map grid
- Zooming and middle-mouse panning
- Loading an existing JSON map
- Saving maps through the browser file picker

Notes:

- Saving and loading use the browser File System Access API.
- A current Chromium-based browser is the safest choice for the editor.


## Map Format

The default map file is JSON with this structure:

```json
{
  "cols": 32,
  "rows": 22,
  "tileSize": 100,
  "tiles": [["grass", "head_quarter"]]
}
```

Currently used tile ids:

- `grass`
- `desert`
- `wall`
- `resource_grass`
- `resource_desert`
- `head_quarter`

## Roadmap

From `TODO.txt`:

- Move tank code out of `vehicles.js` into `tank.js`
- Move tank rendering code into `tank.js`
- Add more units
- Add more buildings
- Add more maps
- Add networking