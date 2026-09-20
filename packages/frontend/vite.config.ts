import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// GitHub Pages liefert Projekt-Seiten unter /<repo-name>/ aus.
// isPreview mitprüfen: `vite preview` läuft mit command 'serve', muss aber wie
// der Produktions-Build unter /streaming-neuheiten/ ausgeliefert werden.
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/streaming-neuheiten/' : '/',
  plugins: [react()],
}));
