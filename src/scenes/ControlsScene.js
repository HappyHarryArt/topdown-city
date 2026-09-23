import Phaser from 'phaser';
import { tilt } from '../input/tilt.js';

const FONT = 'system-ui, sans-serif';

// Ersatz-Knöpfe für Geräte ohne Lagesensor (z.B. am Rechner)
const BUTTONS = [
  { id: 'left', label: '◀', color: 0xffffff },
  { id: 'right', label: '▶', color: 0xffffff },
  { id: 'brake', label: 'BREMSE', color: 0xff6b6b },
  { id: 'gas', label: 'GAS', color: 0x6bdc8b },
];

// Steuerung und Anzeige, läuft als eigene Scene über dem Level.
// So bleibt sie vom Kamera-Zoom unberührt.
export default class ControlsScene extends Phaser.Scene {
  constructor() {
    super('Controls');
    // Das Level liest diesen Zustand in jedem Frame (Werte 0 bis 1)
    this.state = { gas: 0, brake: 0, left: 0, right: 0 };
  }

  init(data) {
    this.gameKey = data.gameKey;
    this.levelTitle = data.title;
  }

  create() {
    for (const key in this.state) this.state[key] = 0;
    tilt.calibrate(); // Haltung beim Levelstart = Nullstellung

    this.buttons = BUTTONS.map((def) => ({
      ...def,
      x: 0,
      y: 0,
      r: 0,
      pressed: false,
      gfx: this.add.graphics(),
      text: this.add.text(0, 0, def.label, { fontFamily: FONT, fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5),
    }));

    const hud = { fontFamily: FONT, fontSize: '16px', fontStyle: 'bold', color: '#ffffff' };
    const chip = { ...hud, backgroundColor: '#00000088', padding: { x: 10, y: 6 } };

    this.menuButton = this.add
      .text(16, 12, '☰ Menü', chip)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.backToMenu());
    this.neutralButton = this.add
      .text(0, 12, '⊙ Neutral', chip)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => tilt.calibrate())
      .setVisible(false);
    this.titleText = this.add.text(0, 18, this.levelTitle, hud).setOrigin(0.5, 0);
    this.speedText = this.add.text(0, 18, '', hud).setOrigin(1, 0);

    // Kleine Anzeige der Neigung: Punkt wandert mit Lenken und Gas
    this.tiltGfx = this.add.graphics().setVisible(false);

    this.layout();
    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.layout, this));
  }

  layout() {
    const { width: w, height: h } = this.scale;
    const r = Phaser.Math.Clamp(Math.min(h * 0.12, w * 0.07), 30, 64);
    const m = r * 1.4;
    const positions = {
      left: [m, h - m],
      right: [m + r * 2.5, h - m],
      brake: [w - m - r * 2.5, h - m],
      gas: [w - m, h - m],
    };

    for (const b of this.buttons) {
      [b.x, b.y] = positions[b.id];
      b.r = r;
      b.text.setPosition(b.x, b.y).setFontSize(b.label.length > 1 ? r * 0.32 : r * 0.7);
      this.drawButton(b);
    }

    this.neutralButton.setX(this.menuButton.x + this.menuButton.width + 10);
    this.titleText.setX(w / 2);
    this.speedText.setX(w - 16);
    this.tiltPad = { x: w / 2, y: h - 50, size: 36 };
  }

  drawButton(b) {
    b.gfx.clear();
    b.gfx.fillStyle(b.color, b.pressed ? 0.45 : 0.15).fillCircle(b.x, b.y, b.r);
    b.gfx.lineStyle(3, b.color, b.pressed ? 0.95 : 0.5).strokeCircle(b.x, b.y, b.r);
  }

  update() {
    const tilted = tilt.read();
    const useTilt = tilted !== null;

    for (const b of this.buttons) {
      b.gfx.setVisible(!useTilt);
      b.text.setVisible(!useTilt);
    }
    this.neutralButton.setVisible(useTilt);
    this.tiltGfx.setVisible(useTilt);

    if (useTilt) {
      Object.assign(this.state, tilted);
      this.drawTilt(tilted);
    } else {
      this.readButtons();
    }

    const car = this.scene.get(this.gameKey)?.car;
    if (car) this.speedText.setText(`${car.speedKmh} km/h`);
  }

  // Alle aktiven Finger prüfen: funktioniert mit Multitouch und beim Hinübergleiten
  readButtons() {
    const pointers = this.input.manager.pointers;
    for (const b of this.buttons) {
      const reach = b.r * 1.25;
      const pressed = pointers.some(
        (p) => p.isDown && Phaser.Math.Distance.Between(p.x, p.y, b.x, b.y) < reach
      );
      if (pressed !== b.pressed) {
        b.pressed = pressed;
        this.drawButton(b);
      }
      this.state[b.id] = pressed ? 1 : 0;
    }
  }

  drawTilt({ gas, brake, left, right }) {
    const { x, y, size } = this.tiltPad;
    const g = this.tiltGfx.clear();
    g.fillStyle(0x000000, 0.35).fillRoundedRect(x - size, y - size, size * 2, size * 2, 8);
    g.lineStyle(1, 0xffffff, 0.4).lineBetween(x - size, y, x + size, y).lineBetween(x, y - size, x, y + size);
    const color = gas > 0 ? 0x6bdc8b : brake > 0 ? 0xff6b6b : 0xffffff;
    g.fillStyle(color, 1).fillCircle(x + (right - left) * size * 0.85, y + (brake - gas) * size * 0.85, 6);
  }

  backToMenu() {
    this.scene.stop(this.gameKey);
    this.scene.start('MainMenu');
  }
}
