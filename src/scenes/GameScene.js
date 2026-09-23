import Phaser from 'phaser';
import Car from '../objects/Car.js';

// Grundlage aller Level: Welt aufbauen, Auto, Kamera, Steuerung.
// Ein Level erbt davon und liefert nur seine Daten über getLevelData().
export default class GameScene extends Phaser.Scene {
  getLevelData() {
    throw new Error(`${this.scene.key}: getLevelData() fehlt`);
  }

  create() {
    const level = this.getLevelData();
    const { width, height } = level.world;

    this.physics.world.setBounds(0, 0, width, height);
    this.add.tileSprite(0, 0, width, height, 'asphalt').setOrigin(0);
    this.drawRoadMarkings(level, width, height);

    this.obstacles = this.physics.add.staticGroup();
    level.buildings.forEach((b) => this.addBuilding(b));
    level.props.forEach((p) => this.obstacles.create(p.x, p.y, p.type));

    this.car = new Car(this, level.spawn.x, level.spawn.y);
    this.car.rotation = level.spawn.angle ?? 0;
    this.physics.add.collider(this.car, this.obstacles);

    const cam = this.cameras.main;
    cam.setBounds(0, 0, width, height);
    cam.startFollow(this.car, true, 0.12, 0.12);
    cam.setZoom(this.targetZoom(0));

    // Tastatur als Ersatz am Rechner
    this.keys = this.input.keyboard?.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT');

    this.scene.launch('Controls', { gameKey: this.scene.key, title: level.title });
    this.controls = this.scene.get('Controls');
    this.events.once('shutdown', () => this.scene.stop('Controls'));
  }

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    this.car.drive(this.readInput(), dt);
    this.updateCamera();
  }

  readInput() {
    const t = this.controls.state;
    const k = this.keys;
    return {
      gas: t.gas || !!(k && (k.W.isDown || k.UP.isDown)),
      brake: t.brake || !!(k && (k.S.isDown || k.DOWN.isDown)),
      left: t.left || !!(k && (k.A.isDown || k.LEFT.isDown)),
      right: t.right || !!(k && (k.D.isDown || k.RIGHT.isDown)),
    };
  }

  // Kamera schaut in Fahrtrichtung voraus und zoomt mit dem Tempo heraus
  updateCamera() {
    const cam = this.cameras.main;
    const v = this.car.body.velocity;
    cam.followOffset.x += (-v.x * 0.35 - cam.followOffset.x) * 0.05;
    cam.followOffset.y += (-v.y * 0.35 - cam.followOffset.y) * 0.05;

    const ratio = Math.abs(this.car.speed) / this.car.cfg.maxSpeed;
    cam.setZoom(cam.zoom + (this.targetZoom(ratio) - cam.zoom) * 0.03);
  }

  // Unabhängig von der Bildschirmgröße sind im Stand etwa 480 Weltpixel in der Höhe sichtbar
  targetZoom(speedRatio) {
    return this.scale.height / (480 + 180 * speedRatio);
  }

  addBuilding({ x, y, w, h, tint }) {
    const pad = 14;
    this.add.tileSprite(x - pad, y - pad, w + pad * 2, h + pad * 2, 'sidewalk').setOrigin(0);
    this.add.rectangle(x + w / 2 + 8, y + h / 2 + 8, w, h, 0x000000, 0.35);
    const building = this.add.tileSprite(x + w / 2, y + h / 2, w, h, 'building');
    if (tint) building.setTint(tint);
    this.obstacles.add(building);
  }

  drawRoadMarkings({ roads }, width, height) {
    const g = this.add.graphics().fillStyle(0xe8d27a, 0.8);
    for (const y of roads.horizontal) {
      for (let x = 0; x < width; x += 60) g.fillRect(x, y - 2, 30, 4);
    }
    for (const x of roads.vertical) {
      for (let y = 0; y < height; y += 60) g.fillRect(x - 2, y, 4, 30);
    }
  }
}
