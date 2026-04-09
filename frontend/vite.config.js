import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0',
        port: 3000,
        allowedHosts: ['ica.logistica.compras', 'ica3d.local'],
        https: {
            key: fs.readFileSync(path.resolve(__dirname, '../backend/certs/key.pem')),
            cert: fs.readFileSync(path.resolve(__dirname, '../backend/certs/cert.pem')),
        },
    }
});
