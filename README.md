[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-support-yellow?style=flat&logo=buy-me-a-coffee)](https://buymeacoffee.com/kadenthomp36)

# Garage Card

A custom Home Assistant Lovelace card that provides a top-down visual representation of your garage. See your garage door state, car presence, light control, and auto-close countdown all in one card.

![Garage Card Preview](https://raw.githubusercontent.com/KadenThomp36/garage-card/main/images/preview.png)

## Features

- **Garage door visualization** - See door open/closed/moving state with animated overlay
- **Car presence tracking** - Visual indicators for up to two cars with home/away status and duration
- **Light control** - Toggle your garage light directly from the card with brightness effect
- **Auto-close countdown** - Display a countdown timer for automatic door closing
- **Keep open toggle** - Override auto-close with a keep-open switch
- **Visual editor** - Full GUI configuration in the HA dashboard editor

## Installation

### HACS (Recommended)

1. Open HACS in your Home Assistant instance
2. Search for "Garage Card"
3. Click Install
4. Restart Home Assistant

### Manual

1. Download `garage-card.js` from the [latest release](https://github.com/KadenThomp36/garage-card/releases/latest)
2. Copy it to your `config/www/` directory
3. Add the resource in **Settings > Dashboards > Resources**:
   - URL: `/local/garage-card.js`
   - Type: JavaScript Module

### Assets Setup

The card uses custom images for the garage visualization. Copy the `assets/` folder to your `config/www/garage-card/` directory so the images are accessible at `/local/garage-card/assets/`.

The card expects these files in the assets folder:

| File | Size | Format | Description |
|------|------|--------|-------------|
| `garage-base.png` | 800x700px | PNG, transparent background | Top-down view of the garage floor/walls (always visible) |
| `garage-door-closed.png` | 800x700px | PNG, transparent background | The garage door overlay (fades out when door opens) |
| `car-kade.png` | 800x700px | PNG, transparent background | Car 1 image positioned in its parking spot (fades when away) |
| `car-jackie.png` | 800x700px | PNG, transparent background | Car 2 image positioned in its parking spot (fades when away) |

All images must be the same dimensions so they layer correctly. The card stacks them in order: base → cars → door.

## Creating Custom Assets

You can generate your own garage and car images using an AI image generator like ChatGPT/DALL-E. For the best results, provide your own reference photos (a picture of your actual garage, your cars, etc.) so the AI can match them.

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

### Replace the Files

Drop your new images into the `assets/` folder using the same filenames (`garage-base.png`, `garage-door-closed.png`, `car-kade.png`, `car-jackie.png`), and the card will use them automatically.

## Configuration

Add the card to your dashboard and configure it through the visual editor, or use YAML:

```yaml
type: custom:garage-card
name: Garage
door_entity: cover.garage_door
car1_presence_entity: binary_sensor.car1_present
car2_presence_entity: binary_sensor.car2_present
light_entity: light.garage_light
countdown_entity: sensor.garage_door_auto_close_countdown
keep_open_entity: input_boolean.keep_garage_door_open
```

### Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `name` | string | No | `Garage` | Card title |
| `door_entity` | string | Yes | - | Garage door cover entity |
| `car1_presence_entity` | string | No | - | Binary sensor for car 1 presence |
| `car2_presence_entity` | string | No | - | Binary sensor for car 2 presence |
| `light_entity` | string | No | - | Garage light entity |
| `countdown_entity` | string | No | - | Auto-close countdown sensor |
| `keep_open_entity` | string | No | - | Keep door open input_boolean toggle |

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=KadenThomp36/garage-card&type=Date)](https://star-history.com/#KadenThomp36/garage-card&Date)

## Support

If you find this card useful, consider buying me a coffee!

[![Buy Me a Coffee](https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png)](https://buymeacoffee.com/kadenthomp36)
