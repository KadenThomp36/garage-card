[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-support-yellow?style=flat&logo=buy-me-a-coffee)](https://buymeacoffee.com/kadenthomp36)

# Garage Card

A custom Home Assistant Lovelace card that provides a top-down visual representation of your garage. See your garage door state, car presence, light control, and more — all in one card.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Creating Custom Assets](#creating-custom-assets)
- [Companion Blueprints](#companion-blueprints)
- [Other Cards](#other-cards)
- [Star History](#star-history)
- [Support](#support)

| Both Cars Home, Light Off | Both Cars Home, Light On |
|:---:|:---:|
| ![Both Cars, Light Off](https://raw.githubusercontent.com/KadenThomp36/garage-card/main/images/both-cars-door-closed-light-off.jpeg) | ![Both Cars, Light On](https://raw.githubusercontent.com/KadenThomp36/garage-card/main/images/both-cars-door-closed-light-on.jpeg) |

| One Car Home, Door Closed | One Car Home, Door Open |
|:---:|:---:|
| ![One Car, Door Closed](https://raw.githubusercontent.com/KadenThomp36/garage-card/main/images/car-present-door-closed-light-on.jpeg) | ![One Car, Door Open](https://raw.githubusercontent.com/KadenThomp36/garage-card/main/images/car-present-door-open-light-on.jpeg) |

## Features

- **Garage door visualization** — See door open/closed/moving state with animated overlay
- **Car presence tracking** — Visual indicators for up to 3 cars with home/away status and duration
- **Light control** — Optional garage light toggle with brightness dimming effect
- **Keep open toggle** — Override auto-close with a keep-open switch
- **Visual editor** — Full GUI configuration in the HA dashboard editor

## Installation

### HACS (Recommended)

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=KadenThomp36&repository=garage-card&category=plugin)

Or manually: open HACS, search for "Garage Card", click Install, and restart Home Assistant.

### Manual

1. Download `garage-card.js` from the [latest release](https://github.com/KadenThomp36/garage-card/releases/latest)
2. Copy it to your `config/www/` directory
3. Add the resource in **Settings > Dashboards > Resources**:
   - URL: `/local/garage-card.js`
   - Type: JavaScript Module

### Assets

The card ships with default assets in the `assets/` folder. After installing, copy the `assets/` folder to `config/www/garage-card/` so the images are accessible at `/local/garage-card/assets/`.

The default assets include images for 2 cars. If you configure a 3rd car, you'll need to create a `car-3.png` asset (see [Creating Custom Assets](#creating-custom-assets) below).

| File | Size | Format | Description |
|------|------|--------|-------------|
| `garage-base.png` | 800x700px | PNG, transparent background | Top-down view of the garage floor/walls (always visible) |
| `garage-door-closed.png` | 800x700px | PNG, transparent background | Garage door overlay (fades out when door opens) |
| `car-1.png` | 800x700px | PNG, transparent background | Car 1 image positioned in its parking spot |
| `car-2.png` | 800x700px | PNG, transparent background | Car 2 image positioned in its parking spot |
| `car-3.png` | 800x700px | PNG, transparent background | Car 3 image — only needed if you configure a 3rd car |

All images must be the same dimensions so they layer correctly. The card stacks them in order: base → cars → door.

## Configuration

Add the card to your dashboard and configure it through the visual editor, or use YAML:

```yaml
type: custom:garage-card
name: Garage
door_entity: cover.garage_door
car1_presence_entity: binary_sensor.car1_present
car2_presence_entity: binary_sensor.car2_present
light_entity: light.garage_light
keep_open_entity: input_boolean.keep_garage_door_open
```

### Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `name` | string | No | `Garage` | Card title |
| `door_entity` | string | Yes | — | Garage door cover entity |
| `car1_presence_entity` | string | No | — | Binary sensor for car 1 presence |
| `car2_presence_entity` | string | No | — | Binary sensor for car 2 presence |
| `car3_presence_entity` | string | No | — | Binary sensor for car 3 presence |
| `light_entity` | string | No | — | Garage light entity (enables light button and dimming effect) |
| `keep_open_entity` | string | No | — | An `input_boolean` helper you create and use in your own automations (e.g., to prevent auto-close). The card provides a toggle for it — the logic is up to you. |

Only configured cars are rendered. If you set `car1_presence_entity` and `car2_presence_entity` but leave `car3_presence_entity` empty, the card shows 2 cars. Each car slot maps to an asset image: car 1 → `car-1.png`, car 2 → `car-2.png`, car 3 → `car-3.png`.

## Creating Custom Assets

Want to customize the look? You can generate your own garage and car images using an AI image generator like ChatGPT/DALL-E. For the best results, provide your own reference photos (a picture of your actual garage, your cars, etc.) so the AI can match them.

### Garage Base

Generate the garage floor plan with a prompt like:

> Create a top-down bird's eye view of a 2-car garage interior floor plan. Style: soft, friendly illustration with clean lines and soft cel-shading. View: directly from above, looking straight down. Show: rectangular garage floor with two parking spots (subtle outlines or different floor shading for each spot), back wall with shelving/storage, front of the garage shows the door opening with the door shut, side walls visible as thick borders. Colors: warm gray concrete floor, soft white/cream walls, subtle shadows. Size: 800x700 pixels, transparent PNG background outside the walls.

Tips:
- You may need to ask the AI to redo the transparent background — be explicit that everything outside the garage walls should be PNG transparent.
- If you have a photo of your garage, upload it as a reference for layout and proportions.

### Garage Door Overlay

The garage door overlay is what makes the open/closed animation work. The card layers `garage-door-closed.png` on top of the base and fades it out when the door opens.

This part **must be done manually** in a photo editor (Photoshop, GIMP, Pixelmator, etc.):

1. Open your generated garage base image
2. Select and crop out just the garage door portion
3. Save it as a separate PNG — transparent everywhere except the door itself
4. Keep the same dimensions (800x700px) so it lines up as a perfect overlay

### Car Images

Generate each car separately. Upload your garage base image as a style reference so the AI matches the look:

> Using the same art style as the attached garage image, create a top-down bird's eye view of a [year] [make] [model] in [color]. The car should be completely trimmed out with a transparent PNG background. Size: 800x700 pixels.

Tips:
- Upload a real photo of your car alongside the garage image so the AI gets the make/model/color right.
- Each car image should be positioned where it would sit in its parking spot.
- Generate one car per image — the card layers them independently.
- Name your files `car-1.png`, `car-2.png`, `car-3.png` to match the car slots in the config. Only create images for the cars you've configured.

### Replace the Files

Drop your new images into the `assets/` folder using the same filenames (`garage-base.png`, `garage-door-closed.png`, `car-1.png`, `car-2.png`, `car-3.png`), and the card will use them automatically.

## Companion Blueprints

These automation blueprints pair well with the Garage Card. Click the badge to import directly into your Home Assistant instance.

### Auto-Close on Departure

Closes the garage door when a car leaves or when nobody is home. Sends an optional mobile notification with the reason. Respects the "keep open" helper toggle.

[![Import Blueprint](https://my.home-assistant.io/badges/blueprint_import.svg)](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fgithub.com%2FKadenThomp36%2Fgarage-card%2Fblob%2Fmain%2Fblueprints%2Fauto_close_on_departure.yaml)

### Auto-Close if Left Open

Closes the garage door after a period of no occupancy or at a scheduled time (e.g., midnight safety close). Configurable inactivity timeout and optional notification.

[![Import Blueprint](https://my.home-assistant.io/badges/blueprint_import.svg)](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fgithub.com%2FKadenThomp36%2Fgarage-card%2Fblob%2Fmain%2Fblueprints%2Fauto_close_left_open.yaml)

### Auto-Open on Arrival

Opens the garage door when a person enters a zone near home while driving. Uses your phone's activity sensor to avoid false triggers from walking or biking.

[![Import Blueprint](https://my.home-assistant.io/badges/blueprint_import.svg)](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fgithub.com%2FKadenThomp36%2Fgarage-card%2Fblob%2Fmain%2Fblueprints%2Fauto_open_on_arrival.yaml)

## Other Cards

If you like this card, check out my other Home Assistant cards:

- [Air Quality Card](https://github.com/KadenThomp36/air-quality-card) — Monitor indoor air quality sensors with recommendations and health indicators

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=KadenThomp36/garage-card&type=Date)](https://star-history.com/#KadenThomp36/garage-card&Date)

## Support

If you find this card useful, consider buying me a coffee!

[![Buy Me a Coffee](https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png)](https://buymeacoffee.com/kadenthomp36)
