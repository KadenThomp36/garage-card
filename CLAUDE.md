# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Home Assistant Lovelace card (`custom:garage-card`) showing a top-down garage: one or two door states, up to 3 cars' presence, optional light and "keep open" toggles. Public repo, distributed via HACS. HACS serves `garage-card.js` (per `hacs.json`) directly, so the committed file *is* the release artifact. There's no build step, no dependencies and no imports, and it has to stay that way.

## Working with `garage-card.js` (~1.2 MB)

- **Lines 8–11 hold the base64 PNGs** in `GARAGE_EMBEDDED_ASSETS`, and each line runs 85K–830K characters. Don't Read or cat the whole file. Read with `offset` past line 12, or use `awk '{print NR": "substr($0,1,120)}'` / `grep -n ... | cut -c1-120`. Never Edit with an `old_string` that touches those lines.
- The embedded images exist because HACS only installs the single JS file, so the `assets/` folder never reaches users. `assets/*.png` are the source images (800×700). If one changes, regenerate its data URI (`base64 -w0 assets/car-1.png`) and replace the matching line with a script, not by hand.
- `_getAssetSrc()` uses `${assets_path}/${filename}` unless `assets_path` is empty or the legacy default `/local/garage-card/assets`. In those cases it falls back to the embedded images. There's no embedded `car-3.png`.
- Keep the source ASCII. Use escapes like `•` rather than literal non-ASCII characters.
- Syntax check: `node --check garage-card.js`. There are no tests in the repo. CI (`.github/workflows/validate.yml`) only runs HACS validation. Testing in real HA is manual and done on Kaden's side. For a local check, load the file in a headless browser with stub `ha-card`/`ha-icon` elements and a mock `hass` (Playwright's Chromium is in `~/.cache/ms-playwright`).

## Architecture

The card is a vanilla `HTMLElement` with shadow DOM. It deliberately uses only documented HA frontend APIs, with no LitElement borrowed from `hui-*` elements and no internal components except `ha-card`/`ha-icon`.

- **Editor:** `static getConfigForm()` returns an ha-form schema, labels and helpers, and HA renders the editor itself. To add an option, update the schema, `GARAGE_LABELS`/`GARAGE_HELPERS` and the README options table. Use the `filter:` form for entity selectors; the top-level `domain` key is deprecated.
- **Render model:** `setConfig()` validates the config (`door_entity` is required; throwing shows HA's error card) and calls `_render()`, which builds the whole shadow DOM. `set hass` calls `_update()`. That only touches the DOM when one of the tracked entities' state objects changed (identity compare in `_lastStates`), and it only toggles classes and text on elements by id. New dynamic UI needs an element in `_render()` and an update in `_update()`.
- **Doors:** `_getDoors()` returns 1 or 2 doors. In two-door mode the single `garage-door-closed.png` overlay is rendered twice with `clip-path` halves (`door_entity` left, i.e. car 1's bay; `door2_entity` right). The door spans x≈182–611 of the 800px image, with its centre divider at ~398.
- **Actions:** all interactions fire HA's native `hass-action` event (`_fireAction`/`_bindAction`). Tap and hold are detected locally; hold is always `more-info`. HA then handles confirmation dialogs, haptics and service calls. Door tap is `perform-action: cover.toggle` (core stops a moving cover if it supports STOP); light and keep-open use `toggle`; car badges use `more-info`. This is why the minimum HA version is 2024.8 (`perform-action`).
- **States and labels:** door text uses `hass.formatEntityState`; a missing entity shows `hass.localize('ui.card.common.entity_not_found')`. Car presence is `on` or `home`. Times use `hass.locale` (language, 12/24h). A 15 s interval refreshes the car "time • duration" labels.
- **Sizing:** `getGridOptions()` is for the sections view and `getCardSize()` for masonry. `:host` is `display: block` and `ha-card` is `height: 100%`.

## Blueprints

`blueprints/*.yaml` are companion automation blueprints and use the 2024.10+ syntax (`triggers:`/`actions:`, `trigger: state`), so `min_version` is `2024.10.0`. Conventions and the pitfalls already fixed in them:

- An optional input that is **used directly in a trigger** must default to `[]`, not `""`. An empty-string `entity_id` or time makes the whole automation invalid. The safety close time is optional, so it uses a template trigger fed by `trigger_variables`.
- Optional inputs that are only read through `variables:` can default to `""`; guard them with `not x or is_state(x, ...)`.
- Put every "should we act" check in `conditions:`, never in a `choose` with no default. A no-op branch would otherwise fall through to the wait and send a false "failed to close" warning.
- Wait for the door with `wait_template` + `wait.completed`, not `wait_for_trigger`, which misses a door that finished moving before the wait started.
- Presence and zone triggers use `from: "on"` / `not_from: [unavailable, unknown]` so restarts don't close the door.
- `mode: single` + `max_exceeded: silent`. Notifications go to `notify.mobile_app_<device name slug>`.

A local runtime check: `pytest-homeassistant-custom-component` (installed with `uv`) with `async_setup_component(hass, "automation", {... use_blueprint ...})` and mocked `cover.*`/`notify.*` services. `python -m homeassistant --script check_config -c <dir>` catches schema errors.

## Releases

The version is the `CARD_VERSION` constant (shown in the console banner). Bump it, commit, tag `vX.Y.Z`, then `gh release create`. Raise `homeassistant` in `hacs.json` if a newer frontend API is used. Only release or push when Kaden asks.
