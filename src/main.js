import Phaser from 'phaser';
import PreloadScene from './scenes/PreloadScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';
import ControlsScene from './scenes/ControlsScene.js';
import { LEVELS } from './scenes/levels/index.js';

// ?debug in der Adresse zeigt die Kollisionsboxen
const debug = new URLSearchParams(window.location.search).has('debug');

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#1b1d22',
  scale: {
    // Spielfläche füllt immer den ganzen Bildschirm; die Kamera regelt den Ausschnitt
    mode: Phaser.Scale.RESIZE,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  input: {
    // Mehrere Finger gleichzeitig: Gas geben und lenken
    activePointers: 4,
  },
  physics: {
    default: 'arcade',
    arcade: { debug },
  },
  // Die erste Scene in der Liste startet automatisch
  scene: [PreloadScene, MainMenuScene, ...LEVELS, ControlsScene],
};

const game = new Phaser.Game(config);

// Im Hochformat auf Touch-Geräten anhalten; den Hinweis zeigt das CSS in index.html
const portraitTouch = window.matchMedia('(orientation: portrait) and (pointer: coarse)');
const syncOrientation = () => (portraitTouch.matches ? game.pause() : game.resume());
portraitTouch.addEventListener('change', syncOrientation);
game.events.once('ready', syncOrientation);

// Im Entwicklungsmodus in der Browser-Konsole erreichbar
if (import.meta.env.DEV) window.game = game;
