// Neigungssteuerung über die Lagesensoren des Handys.
// Nach vorne kippen = Gas, nach hinten = Bremse/Rückwärts, seitlich kippen = Lenken.
// Die Haltung beim Levelstart gilt als Nullstellung.

const DEG = Math.PI / 180;

const SETTINGS = {
  steerRange: 25, // Grad seitliche Neigung für vollen Lenkeinschlag
  throttleRange: 20, // Grad Vor-/Rückneigung für Vollgas bzw. Vollbremsung
  deadZone: 4, // Grad, in denen nichts passiert
};

class TiltInput {
  constructor() {
    this.listening = false;
    this.active = false; // wird wahr, sobald echte Sensordaten ankommen
    this.roll = 0;
    this.pitch = 0;
    this.neutralPitch = null;
    this.onOrientation = this.onOrientation.bind(this);
  }

  // Muss direkt aus einer Nutzergeste heraus aufgerufen werden (iOS fragt dann um Erlaubnis)
  requestAndStart() {
    const DOE = window.DeviceOrientationEvent;
    if (!DOE || !window.isSecureContext) return;

    if (typeof DOE.requestPermission === 'function') {
      DOE.requestPermission()
        .then((result) => result === 'granted' && this.start())
        .catch(() => {});
    } else {
      this.start();
    }
  }

  start() {
    if (this.listening) return;
    this.listening = true;
    window.addEventListener('deviceorientation', this.onOrientation);
  }

  // Aktuelle Haltung wird beim nächsten Messwert zur Nullstellung
  calibrate() {
    this.neutralPitch = null;
  }

  onOrientation(e) {
    if (e.beta == null || e.gamma == null) return;
    this.active = true;

    // Richtung der Schwerkraft im Koordinatensystem des Geräts
    const b = e.beta * DEG;
    const g = e.gamma * DEG;
    const dx = Math.sin(g) * Math.cos(b);
    const dy = -Math.sin(b);
    const dz = -Math.cos(g) * Math.cos(b);

    // ins Bildschirm-System drehen (Querformat links oder rechts herum)
    const a = screenAngle() * DEG;
    const sx = dx * Math.cos(a) - dy * Math.sin(a);
    const sy = dx * Math.sin(a) + dy * Math.cos(a);

    this.roll = Math.asin(Math.max(-1, Math.min(1, sx))) / DEG; // rechts runter = positiv
    this.pitch = Math.atan2(-sy, -dz) / DEG; // 0 = flach, 90 = aufrecht

    if (this.neutralPitch === null) this.neutralPitch = this.pitch;
  }

  // Liefert Werte von 0 bis 1 je Richtung, oder null ohne Sensor
  read() {
    if (!this.active || this.neutralPitch === null) return null;
    const { steerRange, throttleRange, deadZone } = SETTINGS;
    const steer = shape(this.roll, deadZone, steerRange);
    const throttle = shape(this.neutralPitch - this.pitch, deadZone, throttleRange); // vorne = positiv
    return {
      gas: Math.max(throttle, 0),
      brake: Math.max(-throttle, 0),
      left: Math.max(-steer, 0),
      right: Math.max(steer, 0),
    };
  }
}

function screenAngle() {
  if (screen.orientation && typeof screen.orientation.angle === 'number') return screen.orientation.angle;
  return typeof window.orientation === 'number' ? window.orientation : 0;
}

// Totzone abziehen, auf -1 bis 1 begrenzen
function shape(value, deadZone, range) {
  const abs = Math.abs(value);
  if (abs < deadZone) return 0;
  return Math.sign(value) * Math.min((abs - deadZone) / (range - deadZone), 1);
}

export const tilt = new TiltInput();
