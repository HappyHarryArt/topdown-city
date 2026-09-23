import GameScene from '../GameScene.js';

// Straßenraster: Blocks mit Straßen dazwischen und rundherum
const ROAD = 160;
const BLOCK_W = 300;
const BLOCK_H = 280;
const COLS = 5;
const ROWS = 3;

const TINTS = [0xffffff, 0xd9c7a7, 0xb8c7d9, 0xc9b3b3, 0xb5c9b0];

export default class Level1Scene extends GameScene {
  static meta = { key: 'Level1', title: 'Testgelände' };

  constructor() {
    super(Level1Scene.meta.key);
  }

  getLevelData() {
    const buildings = [];
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (row === 1 && col === 2) continue; // freier Platz in der Mitte
        buildings.push({
          x: ROAD + col * (BLOCK_W + ROAD),
          y: ROAD + row * (BLOCK_H + ROAD),
          w: BLOCK_W,
          h: BLOCK_H,
          tint: TINTS[(row * COLS + col) % TINTS.length],
        });
      }
    }

    // Straßenmitten für die Markierungen
    const horizontal = [];
    for (let row = 0; row <= ROWS; row++) horizontal.push(ROAD / 2 + row * (BLOCK_H + ROAD));
    const vertical = [];
    for (let col = 0; col <= COLS; col++) vertical.push(ROAD / 2 + col * (BLOCK_W + ROAD));

    const props = [
      // Kistenstapel auf der Straße
      { type: 'crate', x: 760, y: 500 },
      { type: 'crate', x: 792, y: 500 },
      { type: 'crate', x: 760, y: 532 },
      // halbe Sperre, rechts vorbei
      { type: 'crate', x: 1680, y: 900 },
      { type: 'crate', x: 1680, y: 932 },
      { type: 'crate', x: 1680, y: 964 },
      { type: 'crate', x: 1900, y: 280 },
      { type: 'crate', x: 1940, y: 330 },
    ];

    // Slalom auf dem freien Platz
    for (let i = 0; i < 4; i++) {
      props.push({ type: 'crate', x: 1140 + i * 60, y: i % 2 ? 790 : 690 });
    }

    return {
      title: Level1Scene.meta.title,
      world: {
        width: ROAD + COLS * (BLOCK_W + ROAD),
        height: ROAD + ROWS * (BLOCK_H + ROAD),
      },
      spawn: { x: ROAD / 2, y: ROAD / 2, angle: 0 },
      roads: { horizontal, vertical },
      buildings,
      props,
    };
  }
}
