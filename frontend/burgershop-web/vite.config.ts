import path from 'path'
import fs from 'fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { execSync } from 'child_process'

// Generar versión automática: 1.{commitCount}.{shortHash}
function getAutoVersion() {
  try {
    const count = execSync('git rev-list --count HEAD', { encoding: 'utf8' }).trim();
    const hash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    return `1.${count}.${hash}`;
  } catch {
    return `1.0.${Date.now()}`;
  }
}

const APP_VERSION = getAutoVersion();

// Escribir version.json en public/ para que el SW lo sirva
fs.writeFileSync(
  path.resolve(__dirname, 'public/version.json'),
  JSON.stringify({ version: APP_VERSION }) + '\n'
);

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ...(process.env.NODE_ENV !== 'production' ? [basicSsl()] : []),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5021'
    }
  }
})
