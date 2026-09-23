import Phaser from 'phaser';

// Fahrwerte in Pixel pro Sekunde; 420 px/s entsprechen etwa 125 km/h
const DEFAULTS = {
  maxSpeed: 420,
  maxReverse: 140,
  acceleration: 260,
  braking: 560,
  rollingDrag: 180,
  turnRate: 2.8, // Radiant pro Sekunde bei voller Lenkwirkung
  fullSteerSpeed: 150, // ab dieser Geschwindigkeit greift die Lenkung voll
  grip: 6, // wie schnell die Fahrtrichtung der Ausrichtung folgt; kleiner = mehr Driften
  bounce: 0.3,
};

export default class Car extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture = 'car', config = {}) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.cfg = { ...DEFAULTS, ...config };
    this.speed = 0; // vorwärts positiv, rückwärts negativ
    this.motion = new Phaser.Math.Vector2();
    this.heading = new Phaser.Math.Vector2();

    this.setCollideWorldBounds(true);
    this.fitBody();
  }

  // input: { gas, brake, left, right } je 0 bis 1 (Neigung) oder true/false (Tasten),
  // dt in Sekunden
  drive(input, dt) {
    const c = this.cfg;
    const gas = +input.gas || 0;
    const brake = +input.brake || 0;
    this.heading.setToPolar(this.rotation, 1);

    this.handleImpact();

    // Halbes Gas heißt halbe Höchstgeschwindigkeit
    if (gas > 0 && this.speed < c.maxSpeed * gas) {
      this.speed += (this.speed < 0 ? c.braking : c.acceleration) * gas * dt;
    } else if (brake > 0) {
      // Erst bremsen, im Stand in den Rückwärtsgang
      this.speed -= (this.speed > 0 ? c.braking : c.acceleration * 0.6) * brake * dt;
    } else {
      const drag = c.rollingDrag * dt;
      this.speed = Math.abs(this.speed) <= drag ? 0 : this.speed - Math.sign(this.speed) * drag;
    }
    this.speed = Phaser.Math.Clamp(this.speed, -c.maxReverse, c.maxSpeed);

    // Lenken wirkt nur in Fahrt, rückwärts spiegelverkehrt
    const steer = (+input.right || 0) - (+input.left || 0);
    const steerFactor = Math.min(Math.abs(this.speed) / c.fullSteerSpeed, 1);
    this.rotation += steer * c.turnRate * steerFactor * Math.sign(this.speed) * dt;
    this.heading.setToPolar(this.rotation, 1);
    this.fitBody();

    // Bewegung folgt der Ausrichtung mit etwas Verzögerung: leichtes Rutschen in Kurven
    const targetX = this.heading.x * this.speed;
    const targetY = this.heading.y * this.speed;
    const blend = 1 - Math.exp(-c.grip * dt);
    this.motion.x += (targetX - this.motion.x) * blend;
    this.motion.y += (targetY - this.motion.y) * blend;
    this.body.setVelocity(this.motion.x, this.motion.y);
  }

  // Arcade-Körper sind achsparallel und drehen nicht mit.
  // Deshalb passt sich die Box der aktuellen Ausrichtung an (etwas knapper als das Bild).
  fitBody() {
    const cos = Math.abs(Math.cos(this.rotation));
    const sin = Math.abs(Math.sin(this.rotation));
    const length = this.width * 0.9;
    const breadth = this.height * 0.9;
    this.body.setSize(length * cos + breadth * sin, length * sin + breadth * cos, true);
  }

  // Setzt das Auto an eine neue Stelle, fahrend in Blickrichtung
  respawn(x, y, rotation, speed) {
    this.rotation = rotation;
    this.fitBody();
    this.body.reset(x, y);
    this.speed = speed;
    this.heading.setToPolar(rotation, 1);
    this.motion.set(this.heading.x * speed, this.heading.y * speed);
    this.skipImpact = true; // Kollision von vorher nicht noch einmal auswerten
  }

  // Wertet Kollisionen aus dem letzten Physikschritt aus
  handleImpact() {
    if (this.skipImpact) {
      this.skipImpact = false;
      return;
    }
    const { touching, blocked } = this.body;
    const nx = (touching.right || blocked.right ? 1 : 0) - (touching.left || blocked.left ? 1 : 0);
    const ny = (touching.down || blocked.down ? 1 : 0) - (touching.up || blocked.up ? 1 : 0);
    if (nx === 0 && ny === 0) return;

    // Wie frontal fährt das Auto in das Hindernis?
    const len = Math.hypot(nx, ny);
    const into = ((this.heading.x * nx + this.heading.y * ny) / len) * Math.sign(this.speed);

    if (into > 0.5 && Math.abs(this.speed) > 30) {
      this.speed *= -this.cfg.bounce; // Abprallen
    } else if (into > 0) {
      this.speed *= 1 - 0.1 * into; // Entlangschrammen
    }
    // Die Physik hat die Geschwindigkeit an der Wand schon gekappt
    this.motion.set(this.body.velocity.x, this.body.velocity.y);
  }

  get speedKmh() {
    return Math.round(Math.abs(this.speed) * 0.3);
  }
}
