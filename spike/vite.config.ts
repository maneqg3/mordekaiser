import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    // Permite acesso via tailscale serve (Host: *.ts.net) — proteção de
    // DNS rebinding do Vite 6 bloquearia o proxy sem isso.
    allowedHosts: ['.ts.net'],
  },
});
