/**
 * Garage Card - Top-Down View
 * A custom Home Assistant Lovelace card for garage visualization
 */

const GARAGE_DEFAULTS = {
  door_entity: 'cover.ratgdo32disco_7b7cd8_door',
  car1_name: "Kaden's Honda",
  car1_presence_entity: 'binary_sensor.kade_car_present',
  car2_name: "Jackie's Mazda",
  car2_presence_entity: 'binary_sensor.jackie_car_present',
  light_entity: 'light.ratgdo32disco_7b7cd8_light',
  countdown_entity: 'sensor.garage_door_auto_close_countdown',
  keep_open_entity: 'input_boolean.keep_garage_door_open',
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
    // Start interval for updating countdown and durations
    this._updateInterval = setInterval(() => {
      this._updateTimers();
    }, 1000);
  }

  disconnectedCallback() {
    // Clean up interval when card is removed
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

  _getDoorState() {
    const state = this._hass?.states[this._config.door_entity];
    return state?.state ?? 'unknown';
  }

  _isCar1Present() {
    const entity = this._hass?.states[this._config.car1_presence_entity];
    return entity?.state === 'on';
  }

  _isCar2Present() {
    const entity = this._hass?.states[this._config.car2_presence_entity];
    return entity?.state === 'on';
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

  _getCountdownState() {
    if (!this._config.countdown_entity) return null;
    const state = this._hass?.states[this._config.countdown_entity];
    return state?.state ?? null;
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
          cursor: pointer;
          filter: brightness(0.6);
          transition: filter 0.5s ease;
        }

        .garage-scene.lit {
          filter: brightness(1);
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

        .countdown-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 20px;
          background: var(--secondary-background-color);
          font-size: 0.85em;
          height: 36px;
          box-sizing: border-box;
        }

        .countdown-badge.active {
          background: rgba(255, 159, 10, 0.2);
        }

        .countdown-badge .countdown-value {
          font-weight: 600;
          font-variant-numeric: tabular-nums;
        }

        .countdown-badge.active .countdown-value {
          color: var(--warning-color, #FF9F0A);
        }

        .countdown-badge ha-icon {
          --mdc-icon-size: 16px;
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

          <div class="garage-scene" id="garage-scene">
            <div class="layer garage-base">
              <img src="${assetsPath}/garage-base.png" alt="Garage">
            </div>
            <div class="layer car" id="car-kade">
              <img src="${assetsPath}/car-kade.png" alt="${this._config.car1_name}">
            </div>
            <div class="layer car" id="car-jackie">
              <img src="${assetsPath}/car-jackie.png" alt="${this._config.car2_name}">
            </div>
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
              ${this._config.countdown_entity ? `
                <div class="countdown-badge" id="countdown-badge">
                  <ha-icon icon="mdi:timer-outline"></ha-icon>
                  <span class="countdown-value" id="countdown-value">--</span>
                </div>
              ` : ''}
              ${this._config.keep_open_entity ? `
                <div class="keep-open-toggle" id="keep-open-toggle">
                  <ha-icon icon="mdi:lock-open-variant-outline"></ha-icon>
                  <span>Keep Open</span>
                  <div class="toggle-indicator"></div>
                </div>
              ` : ''}
            </div>
            <div class="car-status">
              <div class="car-badge">
                <div class="badge-row">
                  <span class="dot" id="car1-dot"></span>
                  <span class="status" id="car1-status">Away</span>
                </div>
                <span class="time-info" id="car1-time"></span>
              </div>
              <div class="car-badge">
                <div class="badge-row">
                  <span class="dot" id="car2-dot"></span>
                  <span class="status" id="car2-status">Away</span>
                </div>
                <span class="time-info" id="car2-time"></span>
              </div>
            </div>
          </div>
        </div>
      </ha-card>
    `;

    // Attach event listeners once
    this.shadowRoot.getElementById('garage-scene').addEventListener('click', () => this._toggleDoor());
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
    const car1Present = this._isCar1Present();
    const car2Present = this._isCar2Present();
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

    // Update car 1
    const car1El = this.shadowRoot.getElementById('car-kade');
    const car1Dot = this.shadowRoot.getElementById('car1-dot');
    const car1Status = this.shadowRoot.getElementById('car1-status');
    const car1Time = this.shadowRoot.getElementById('car1-time');
    if (car1El) car1El.classList.toggle('away', !car1Present);
    if (car1Dot) car1Dot.classList.toggle('home', car1Present);
    if (car1Status) {
      car1Status.textContent = car1Present ? 'Home' : 'Away';
      car1Status.classList.toggle('home', car1Present);
    }
    if (car1Time) {
      const car1LastChanged = this._getCarLastChanged(this._config.car1_presence_entity);
      car1Time.textContent = car1LastChanged ?
        `${this._formatTime(car1LastChanged)} • ${this._formatDuration(car1LastChanged)}` : '';
    }

    // Update car 2
    const car2El = this.shadowRoot.getElementById('car-jackie');
    const car2Dot = this.shadowRoot.getElementById('car2-dot');
    const car2Status = this.shadowRoot.getElementById('car2-status');
    const car2Time = this.shadowRoot.getElementById('car2-time');
    if (car2El) car2El.classList.toggle('away', !car2Present);
    if (car2Dot) car2Dot.classList.toggle('home', car2Present);
    if (car2Status) {
      car2Status.textContent = car2Present ? 'Home' : 'Away';
      car2Status.classList.toggle('home', car2Present);
    }
    if (car2Time) {
      const car2LastChanged = this._getCarLastChanged(this._config.car2_presence_entity);
      car2Time.textContent = car2LastChanged ?
        `${this._formatTime(car2LastChanged)} • ${this._formatDuration(car2LastChanged)}` : '';
    }

    // Update light button and scene brightness
    const garageScene = this.shadowRoot.getElementById('garage-scene');
    const lightBtn = this.shadowRoot.getElementById('light-toggle');
    const lightIcon = this.shadowRoot.getElementById('light-icon');
    if (garageScene) garageScene.classList.toggle('lit', lightOn);
    if (lightBtn) lightBtn.classList.toggle('on', lightOn);
    if (lightIcon) lightIcon.setAttribute('icon', lightOn ? 'mdi:lightbulb' : 'mdi:lightbulb-outline');

    // Update countdown
    const countdownState = this._getCountdownState();
    const countdownBadge = this.shadowRoot.getElementById('countdown-badge');
    const countdownValue = this.shadowRoot.getElementById('countdown-value');
    if (countdownBadge && countdownValue) {
      // Check if it's an active countdown (MM:SS format or "Closing Soon")
      const isActiveCountdown = countdownState && (
        /^\d{2}:\d{2}$/.test(countdownState) ||
        countdownState === 'Closing Soon'
      );
      countdownBadge.classList.toggle('active', isActiveCountdown);
      countdownValue.textContent = countdownState || '--';
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

    // Update countdown display
    const countdownState = this._getCountdownState();
    const countdownBadge = this.shadowRoot.getElementById('countdown-badge');
    const countdownValue = this.shadowRoot.getElementById('countdown-value');
    if (countdownBadge && countdownValue) {
      const isActiveCountdown = countdownState && (
        /^\d{2}:\d{2}$/.test(countdownState) ||
        countdownState === 'Closing Soon'
      );
      countdownBadge.classList.toggle('active', isActiveCountdown);
      countdownValue.textContent = countdownState || '--';
    }

    // Update car duration displays
    const car1Time = this.shadowRoot.getElementById('car1-time');
    if (car1Time) {
      const car1LastChanged = this._getCarLastChanged(this._config.car1_presence_entity);
      car1Time.textContent = car1LastChanged ?
        `${this._formatTime(car1LastChanged)} • ${this._formatDuration(car1LastChanged)}` : '';
    }

    const car2Time = this.shadowRoot.getElementById('car2-time');
    if (car2Time) {
      const car2LastChanged = this._getCarLastChanged(this._config.car2_presence_entity);
      car2Time.textContent = car2LastChanged ?
        `${this._formatTime(car2LastChanged)} • ${this._formatDuration(car2LastChanged)}` : '';
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

console.info('%c GARAGE-CARD %c v1.2.0 ',
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
      car1_presence_entity: 'Car 1 Presence Sensor',
      car2_presence_entity: 'Car 2 Presence Sensor',
      light_entity: 'Garage Light Entity (optional)',
      countdown_entity: 'Auto-Close Countdown Sensor (optional)',
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
      { name: 'light_entity', selector: { entity: { domain: 'light' } } },
      { name: 'countdown_entity', selector: { entity: { domain: 'sensor' } } },
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
