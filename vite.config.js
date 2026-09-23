import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  // Relative Pfade, damit der Build in jedem Unterordner läuft
  base: './',
  // Lagesensoren gibt der Browser nur über HTTPS frei; daher ein selbstsigniertes Zertifikat
  plugins: [basicSsl()],
  server: { port: 5180 },
});
