// Platzhalter-Grafiken, zur Laufzeit gezeichnet.
// Wird unter demselben Schlüssel eine echte Grafik geladen (PreloadScene),
// entfällt der Platzhalter automatisch.

const PLACEHOLDERS = {
  // Auto zeigt nach rechts (Winkel 0 in Phaser)
  car(g) {
    g.fillStyle(0xd7263d).fillRoundedRect(0, 0, 48, 24, 6);
    g.fillStyle(0xe8505f).fillRect(14, 4, 14, 16);
    g.fillStyle(0x1f2a36).fillRect(28, 4, 8, 16).fillRect(8, 5, 5, 14);
    g.fillStyle(0xfff3b0).fillRect(45, 3, 3, 4).fillRect(45, 17, 3, 4);
    return [48, 24];
  },

  asphalt(g) {
    g.fillStyle(0x3a3d42).fillRect(0, 0, 64, 64);
    g.fillStyle(0x44474d);
    for (let i = 0; i < 40; i++) {
      g.fillRect((i * 37) % 64, (i * 23) % 64, 2, 2);
    }
    return [64, 64];
  },

  sidewalk(g) {
    g.fillStyle(0x8d9098).fillRect(0, 0, 32, 32);
    g.lineStyle(1, 0x767982).strokeRect(0.5, 0.5, 31, 31);
    return [32, 32];
  },

  building(g) {
    g.fillStyle(0x6b7280).fillRect(0, 0, 64, 64);
    g.fillStyle(0x9aa0aa).fillRect(3, 3, 58, 58);
    g.fillStyle(0x5a606b).fillRect(38, 10, 14, 14);
    return [64, 64];
  },

  crate(g) {
    g.fillStyle(0x9c6b30).fillRect(0, 0, 32, 32);
    g.lineStyle(3, 0x5e3d17).strokeRect(1.5, 1.5, 29, 29);
    g.lineBetween(3, 3, 29, 29).lineBetween(29, 3, 3, 29);
    return [32, 32];
  },
};

export function createPlaceholderTextures(scene) {
  for (const [key, draw] of Object.entries(PLACEHOLDERS)) {
    if (scene.textures.exists(key)) continue;
    const g = scene.make.graphics({}, false);
    const [width, height] = draw(g);
    g.generateTexture(key, width, height);
    g.destroy();
  }
}
