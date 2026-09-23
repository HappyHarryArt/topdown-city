import Phaser from 'phaser';
import { createPlaceholderTextures } from '../utils/placeholders.js';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, 304, 16).setStrokeStyle(2, 0xffffff, 0.6);
    const bar = this.add.rectangle(width / 2 - 150, height / 2, 300, 10, 0xf2c14e).setOrigin(0, 0.5);
    bar.scaleX = 0;
    this.load.on('progress', (value) => (bar.scaleX = value));

    // Echte Grafiken liegen in public/assets und werden hier geladen, z.B.:
    // this.load.image('car', 'assets/car.png');
    // this.load.image('building', 'assets/building.png');
    // Für jeden geladenen Schlüssel entfällt der Platzhalter.
  }

  create() {
    createPlaceholderTextures(this);
    this.scene.start('MainMenu');
  }
}
