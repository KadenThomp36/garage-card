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

## Configuration

Add the card to your dashboard and configure it through the visual editor, or use YAML:

```yaml
type: custom:garage-card
name: Garage
door_entity: cover.garage_door
car1_name: "Car 1"
car1_presence_entity: binary_sensor.car1_present
car2_name: "Car 2"
car2_presence_entity: binary_sensor.car2_present
light_entity: light.garage_light
countdown_entity: sensor.garage_door_auto_close_countdown
keep_open_entity: input_boolean.keep_garage_door_open
assets_path: /local/garage-card/assets
```

### Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `name` | string | No | `Garage` | Card title |
| `door_entity` | string | Yes | - | Garage door cover entity |
| `car1_name` | string | No | - | Display name for car 1 |
| `car1_presence_entity` | string | No | - | Binary sensor for car 1 presence |
| `car2_name` | string | No | - | Display name for car 2 |
| `car2_presence_entity` | string | No | - | Binary sensor for car 2 presence |
| `light_entity` | string | No | - | Garage light entity |
| `countdown_entity` | string | No | - | Auto-close countdown sensor |
| `keep_open_entity` | string | No | - | Keep door open input_boolean toggle |
| `assets_path` | string | No | `/local/garage-card/assets` | Path to card image assets |

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=KadenThomp36/garage-card&type=Date)](https://star-history.com/#KadenThomp36/garage-card&Date)

## Support

If you find this card useful, consider buying me a coffee!

[![Buy Me a Coffee](https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png)](https://buymeacoffee.com/kadenthomp36)
