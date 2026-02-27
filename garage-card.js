/**
 * Garage Card - Top-Down View
 * A custom Home Assistant Lovelace card for garage visualization
 */

const GARAGE_DEFAULTS = {
  door_entity: '',
  light_entity: '',
  keep_open_entity: '',
  assets_path: '/local/garage-card/assets'
};

class GarageCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement('garage-card-editor');
  }

  static getStubConfig() {
    return {
      name: 'Garage',
      ...GARAGE_DEFAULTS
    };
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass = null;
    this._rendered = false;
    this._updateInterval = null;
  }

  connectedCallback() {
    this._updateInterval = setInterval(() => {
      this._updateTimers();
    }, 1000);
  }

  disconnectedCallback() {
    if (this._updateInterval) {
      clearInterval(this._updateInterval);
      this._updateInterval = null;
    }
  }

  setConfig(config) {
    if (!config) {
      throw new Error('Invalid configuration');
    }
    this._config = {
      name: 'Garage',
      ...GARAGE_DEFAULTS,
      ...config
    };
    this._rendered = false;
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._rendered) {
      this._initialRender();
      this._rendered = true;
    }
    this._updateStates();
  }

  getCardSize() {
    return 4;
  }

  _getCars() {
    const cars = [];
    for (let i = 1; i <= 3; i++) {
      const entity = this._config[`car${i}_presence_entity`];
      if (entity) {
        cars.push({
          index: i,
          presenceEntity: entity,
          image: `car-${i}.png`
        });
      }
    }
    return cars;
  }

  _isCarPresent(entityId) {
    const entity = this._hass?.states[entityId];
    return entity?.state === 'on';
  }

  _getDoorState() {
    const state = this._hass?.states[this._config.door_entity];
    return state?.state ?? 'unknown';
  }

  _getCarLastChanged(entityId) {
    const state = this._hass?.states[entityId];
    return state?.last_changed ? new Date(state.last_changed) : null;
  }

  _formatTime(date) {
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  _formatDuration(date) {
    if (!date) return '';
    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  _isLightOn() {
    if (!this._config.light_entity) return false;
    const state = this._hass?.states[this._config.light_entity];
    return state?.state === 'on';
  }

  _isKeepOpenEnabled() {
    if (!this._config.keep_open_entity) return false;
    const state = this._hass?.states[this._config.keep_open_entity];
    return state?.state === 'on';
  }

  _toggleKeepOpen() {
    if (!this._config.keep_open_entity) return;
    this._hass.callService('input_boolean', 'toggle', {
      entity_id: this._config.keep_open_entity
    });
  }

  _toggleDoor() {
    this._hass.callService('cover', 'toggle', {
      entity_id: this._config.door_entity
    });
  }

  _toggleLight() {
    if (!this._config.light_entity) return;
    this._hass.callService('light', 'toggle', {
      entity_id: this._config.light_entity
    });
  }

  _initialRender() {
    if (!this._hass || !this._config) return;

    const assetsPath = this._config.assets_path;
    const cars = this._getCars();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --status-home: var(--green-color, #32D74B);
          --status-away: var(--secondary-text-color, #888);
          --door-open: var(--green-color, #32D74B);
          --door-closed: var(--red-color, #FF453A);
          --door-moving: var(--warning-color, #FF9F0A);
        }

        .garage-card {
          background: transparent;
          border-radius: var(--ha-card-border-radius, 20px);
          padding: 16px;
          color: var(--primary-text-color);
          font-family: var(--paper-font-body1_-_font-family);
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .header-title {
          font-size: 1.3em;
          font-weight: 600;
        }

        .garage-scene {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;
          margin: 0 auto;
        }

        .garage-scene.has-light {
          filter: brightness(0.6);
          transition: filter 0.5s ease;
        }

        .garage-scene.has-light.lit {
          filter: brightness(1);
        }

        .door-touch-target {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 33.33%;
          z-index: 5;
          cursor: pointer;
        }

        .layer {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .light-btn {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 10;
          background: rgba(0, 0, 0, 0.4);
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          width: 48px;
          height: 48px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }

        .light-btn:hover {
          background: rgba(0, 0, 0, 0.5);
          transform: translate(-50%, -50%) scale(1.1);
        }

        .light-btn.on {
          background: var(--warning-color, #FF9F0A);
          border-color: var(--warning-color, #FF9F0A);
          box-shadow: 0 0 20px rgba(255, 159, 10, 0.5);
        }

        .light-btn ha-icon {
          --mdc-icon-size: 24px;
          color: rgba(255, 255, 255, 0.8);
          transition: color 0.3s ease;
        }

        .light-btn.on ha-icon {
          color: #000;
        }

        .garage-base {
          z-index: 1;
        }

        .car {
          z-index: 2;
          opacity: 1;
          filter: grayscale(0%);
          transition: opacity 0.4s ease, filter 0.4s ease;
        }

        .car.away {
          opacity: 0.15;
          filter: grayscale(100%);
        }

        .garage-door {
          z-index: 3;
          opacity: 1;
          transition: opacity 0.6s ease;
        }

        .garage-door.open {
          opacity: 0;
        }

        .garage-door.moving {
          animation: doorPulse 0.8s ease-in-out infinite;
        }

        @keyframes doorPulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 0.3; }
        }

        .layer img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .status-bar {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--divider-color, rgba(255,255,255,0.1));
          align-items: center;
        }

        .controls-row {
          display: flex;
          gap: 8px;
          justify-content: center;
          flex-wrap: wrap;
          align-items: stretch;
        }

        .car-status {
          display: flex;
          gap: 24px;
          justify-content: center;
        }

        .car-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          font-size: 0.9em;
        }

        .car-badge .badge-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .car-badge .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--status-away);
          transition: background 0.3s ease;
        }

        .car-badge .dot.home {
          background: var(--status-home);
        }

        .car-badge .status {
          font-weight: 500;
          color: var(--status-away);
          transition: color 0.3s ease;
        }

        .car-badge .status.home {
          color: var(--status-home);
        }

        .car-badge .time-info {
          font-size: 0.75em;
          color: var(--secondary-text-color);
          opacity: 0.8;
          text-align: center;
        }

        .door-status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 20px;
          background: var(--secondary-background-color);
          font-size: 0.85em;
          cursor: pointer;
          transition: background 0.2s;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
          height: 36px;
          box-sizing: border-box;
        }

        .door-status:hover {
          background: var(--primary-background-color);
        }

        .door-status:active {
          transform: scale(0.97);
        }

        .door-status .indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--door-closed);
          transition: background 0.3s ease;
        }

        .door-status .indicator.open {
          background: var(--door-open);
        }

        .door-status .indicator.moving {
          background: var(--door-moving);
          animation: pulse 1s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }

        .door-status .text {
          font-weight: 500;
        }

        .keep-open-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 20px;
          background: var(--secondary-background-color);
          font-size: 0.85em;
          cursor: pointer;
          transition: all 0.2s ease;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
          height: 36px;
          box-sizing: border-box;
        }

        .keep-open-toggle:hover {
          background: var(--primary-background-color);
        }

        .keep-open-toggle:active {
          transform: scale(0.97);
        }

        .keep-open-toggle.enabled {
          background: rgba(50, 215, 75, 0.2);
        }

        .keep-open-toggle .toggle-indicator {
          width: 32px;
          height: 18px;
          border-radius: 9px;
          background: var(--disabled-color, #555);
          position: relative;
          transition: background 0.2s ease;
        }

        .keep-open-toggle.enabled .toggle-indicator {
          background: var(--status-home, #32D74B);
        }

        .keep-open-toggle .toggle-indicator::after {
          content: '';
          position: absolute;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: white;
          top: 2px;
          left: 2px;
          transition: transform 0.2s ease;
        }

        .keep-open-toggle.enabled .toggle-indicator::after {
          transform: translateX(14px);
        }

        .keep-open-toggle ha-icon {
          --mdc-icon-size: 16px;
        }
      </style>

      <ha-card>
        <div class="garage-card">
          <div class="header">
            <span class="header-title">${this._config.name}</span>
          </div>

          <div class="garage-scene ${this._config.light_entity ? 'has-light' : ''}" id="garage-scene">
            <div class="door-touch-target" id="door-touch-target"></div>
            <div class="layer garage-base">
              <img src="${assetsPath}/garage-base.png" alt="Garage">
            </div>
            ${cars.map(car => `
              <div class="layer car" id="car-${car.index}">
                <img src="${assetsPath}/${car.image}" alt="Car ${car.index}">
              </div>
            `).join('')}
            <div class="layer garage-door" id="garage-door">
              <img src="${assetsPath}/garage-door-closed.png" alt="Door">
            </div>
            ${this._config.light_entity ? `
              <button class="light-btn" id="light-toggle">
                <ha-icon icon="mdi:lightbulb-outline" id="light-icon"></ha-icon>
              </button>
            ` : ''}
          </div>

          <div class="status-bar">
            <div class="controls-row">
              <div class="door-status" id="door-toggle">
                <span class="indicator" id="door-indicator"></span>
                <span class="text" id="door-text">Unknown</span>
                <ha-icon icon="mdi:garage" id="door-icon"></ha-icon>
              </div>
              ${this._config.keep_open_entity ? `
                <div class="keep-open-toggle" id="keep-open-toggle">
                  <ha-icon icon="mdi:lock-open-variant-outline"></ha-icon>
                  <span>Keep Open</span>
                  <div class="toggle-indicator"></div>
                </div>
              ` : ''}
            </div>
            ${cars.length > 0 ? `
              <div class="car-status">
                ${cars.map(car => `
                  <div class="car-badge">
                    <div class="badge-row">
                      <span class="dot" id="car${car.index}-dot"></span>
                      <span class="status" id="car${car.index}-status">Away</span>
                    </div>
                    <span class="time-info" id="car${car.index}-time"></span>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        </div>
      </ha-card>
    `;

    // Attach event listeners
    this.shadowRoot.getElementById('door-touch-target').addEventListener('click', () => this._toggleDoor());
    this.shadowRoot.getElementById('door-toggle').addEventListener('click', (e) => {
      e.stopPropagation();
      this._toggleDoor();
    });

    const lightBtn = this.shadowRoot.getElementById('light-toggle');
    if (lightBtn) {
      lightBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._toggleLight();
      });
    }

    const keepOpenToggle = this.shadowRoot.getElementById('keep-open-toggle');
    if (keepOpenToggle) {
      keepOpenToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        this._toggleKeepOpen();
      });
    }
  }

  _updateStates() {
    if (!this._hass || !this._config || !this._rendered) return;

    const doorState = this._getDoorState();
    const lightOn = this._isLightOn();

    const isDoorOpen = doorState === 'open' || doorState === 'opening';
    const isDoorMoving = doorState === 'opening' || doorState === 'closing';

    // Update door
    const doorEl = this.shadowRoot.getElementById('garage-door');
    if (doorEl) {
      doorEl.classList.toggle('open', isDoorOpen);
      doorEl.classList.toggle('moving', isDoorMoving);
    }

    // Update door indicator
    const doorIndicator = this.shadowRoot.getElementById('door-indicator');
    if (doorIndicator) {
      doorIndicator.classList.toggle('open', isDoorOpen && !isDoorMoving);
      doorIndicator.classList.toggle('moving', isDoorMoving);
    }

    // Update door text
    const doorText = this.shadowRoot.getElementById('door-text');
    if (doorText) {
      doorText.textContent = doorState.charAt(0).toUpperCase() + doorState.slice(1);
    }

    // Update door icon
    const doorIcon = this.shadowRoot.getElementById('door-icon');
    if (doorIcon) {
      doorIcon.setAttribute('icon', isDoorOpen ? 'mdi:garage-open' : 'mdi:garage');
    }

    // Update cars
    for (const car of this._getCars()) {
      const present = this._isCarPresent(car.presenceEntity);
      const carEl = this.shadowRoot.getElementById(`car-${car.index}`);
      const dot = this.shadowRoot.getElementById(`car${car.index}-dot`);
      const status = this.shadowRoot.getElementById(`car${car.index}-status`);
      const time = this.shadowRoot.getElementById(`car${car.index}-time`);

      if (carEl) carEl.classList.toggle('away', !present);
      if (dot) dot.classList.toggle('home', present);
      if (status) {
        status.textContent = present ? 'Home' : 'Away';
        status.classList.toggle('home', present);
      }
      if (time) {
        const lastChanged = this._getCarLastChanged(car.presenceEntity);
        time.textContent = lastChanged
          ? `${this._formatTime(lastChanged)} \u2022 ${this._formatDuration(lastChanged)}`
          : '';
      }
    }

    // Update light button and scene brightness (only when light entity is configured)
    if (this._config.light_entity) {
      const garageScene = this.shadowRoot.getElementById('garage-scene');
      const lightBtn = this.shadowRoot.getElementById('light-toggle');
      const lightIcon = this.shadowRoot.getElementById('light-icon');
      if (garageScene) garageScene.classList.toggle('lit', lightOn);
      if (lightBtn) lightBtn.classList.toggle('on', lightOn);
      if (lightIcon) lightIcon.setAttribute('icon', lightOn ? 'mdi:lightbulb' : 'mdi:lightbulb-outline');
    }

    // Update keep open toggle
    const keepOpenEnabled = this._isKeepOpenEnabled();
    const keepOpenToggle = this.shadowRoot.getElementById('keep-open-toggle');
    if (keepOpenToggle) {
      keepOpenToggle.classList.toggle('enabled', keepOpenEnabled);
    }
  }

  _updateTimers() {
    if (!this._rendered || !this._hass) return;

    for (const car of this._getCars()) {
      const time = this.shadowRoot.getElementById(`car${car.index}-time`);
      if (time) {
        const lastChanged = this._getCarLastChanged(car.presenceEntity);
        time.textContent = lastChanged
          ? `${this._formatTime(lastChanged)} \u2022 ${this._formatDuration(lastChanged)}`
          : '';
      }
    }
  }
}

// Register the card
customElements.define('garage-card', GarageCard);

// Register with Home Assistant card picker
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'garage-card',
  name: 'Garage Card',
  description: 'A custom card showing garage with car presence and door control',
  preview: true
});

console.info('%c GARAGE-CARD %c v1.3.0 ',
  'color: white; background: #4A90D9; font-weight: bold;',
  'color: #4A90D9; background: white; font-weight: bold;'
);

// ============================================
// VISUAL CONFIGURATION EDITOR
// ============================================

const LitElement = Object.getPrototypeOf(
  customElements.get("hui-masonry-view") || customElements.get("hui-view")
);
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

class GarageCardEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      _config: { type: Object }
    };
  }

  setConfig(config) {
    this._config = { ...GARAGE_DEFAULTS, ...config };
  }

  _computeLabel(schema) {
    const labels = {
      name: 'Card Name',
      door_entity: 'Garage Door Entity',
      car1_presence_entity: 'Car 1 Presence Sensor (optional)',
      car2_presence_entity: 'Car 2 Presence Sensor (optional)',
      car3_presence_entity: 'Car 3 Presence Sensor (optional)',
      light_entity: 'Garage Light Entity (optional)',
      keep_open_entity: 'Keep Door Open Toggle (optional)'
    };
    return labels[schema.name] || schema.name;
  }

  _schema() {
    return [
      { name: 'name', selector: { text: {} } },
      { name: 'door_entity', selector: { entity: { domain: 'cover' } } },
      { name: 'car1_presence_entity', selector: { entity: { domain: ['binary_sensor', 'input_boolean'] } } },
      { name: 'car2_presence_entity', selector: { entity: { domain: ['binary_sensor', 'input_boolean'] } } },
      { name: 'car3_presence_entity', selector: { entity: { domain: ['binary_sensor', 'input_boolean'] } } },
      { name: 'light_entity', selector: { entity: { domain: 'light' } } },
      { name: 'keep_open_entity', selector: { entity: { domain: 'input_boolean' } } }
    ];
  }

  render() {
    if (!this._config) {
      return html``;
    }

    return html`
      <div class="card-config">
        <ha-form
          .hass=${this.hass}
          .data=${this._config}
          .schema=${this._schema()}
          .computeLabel=${this._computeLabel}
          @value-changed=${this._valueChanged}
        ></ha-form>
      </div>
    `;
  }

  _valueChanged(ev) {
    const newConfig = { type: 'custom:garage-card', ...ev.detail.value };
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: newConfig },
      bubbles: true,
      composed: true
    }));
  }

  static get styles() {
    return css`
      .card-config {
        padding: 16px;
      }
      ha-form {
        display: block;
      }
    `;
  }
}

customElements.define('garage-card-editor', GarageCardEditor);
