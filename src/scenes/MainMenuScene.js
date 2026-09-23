import Phaser from 'phaser';
import { LEVELS } from './levels/index.js';
import { tilt } from '../input/tilt.js';

const FONT = 'system-ui, sans-serif';

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenu');
  }

  create() {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height * 0.2, 'TOP-DOWN CITY', {
        fontFamily: FONT,
        fontSize: Math.round(Math.min(width, height) * 0.1) + 'px',
        fontStyle: 'bold',
        color: '#f2c14e',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.2 + Math.min(width, height) * 0.1, 'Level wählen', {
        fontFamily: FONT,
        fontSize: '18px',
        color: '#c9ccd3',
      })
      .setOrigin(0.5);

    const buttonHeight = Math.max(48, height * 0.12);
    const gap = buttonHeight * 0.3;
    const startY = height * 0.5;

    LEVELS.forEach((Level, i) => {
      this.createButton(width / 2, startY + i * (buttonHeight + gap), buttonHeight, Level.meta);
    });

    // Bei Größenänderung (Drehen, Vollbild) das Menü neu aufbauen
    const onResize = () => this.scene.restart();
    this.scale.on('resize', onResize);
    this.events.once('shutdown', () => this.scale.off('resize', onResize));
  }

  createButton(x, y, height, meta) {
    const width = Math.min(360, this.scale.width * 0.7);
    const bg = this.add
      .rectangle(x, y, width, height, 0x2c2f36)
      .setStrokeStyle(2, 0xf2c14e)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(x, y, meta.title, { fontFamily: FONT, fontSize: '22px', fontStyle: 'bold', color: '#ffffff' })
      .setOrigin(0.5);

    bg.on('pointerover', () => bg.setFillStyle(0x3a3e47));
    bg.on('pointerout', () => bg.setFillStyle(0x2c2f36));
    bg.on('pointerup', () => this.startLevel(meta.key));
  }

  startLevel(key) {
    // Beides braucht die Nutzergeste dieses Tipps
    tilt.requestAndStart();
    this.enterFullscreen();
    this.scene.start(key);
  }

  // Auf Touch-Geräten Vollbild und Querformat anfordern, wo der Browser es erlaubt
  // (Android ja, iPhone-Safari nein; dort bleibt es beim Dreh-Hinweis)
  enterFullscreen() {
    if (!this.sys.game.device.input.touch) return;
    if (this.scale.fullscreen.available && !this.scale.isFullscreen) {
      this.scale.startFullscreen();
    }
    screen.orientation?.lock?.('landscape').catch(() => {});
  }
}
