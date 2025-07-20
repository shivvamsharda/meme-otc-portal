
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "buffer": "buffer",
      "process": "process/browser",
      "util": "util",
      "crypto": "crypto-browserify",
      "stream": "stream-browserify",
      "assert": "assert",
      "http": "stream-http",
      "https": "https-browserify",
      "os": "os-browserify",
      "url": "url",
      "zlib": "browserify-zlib",
    },
  },
  define: {
    global: 'globalThis',
    'process.env': {},
    'process.version': JSON.stringify('v18.0.0'),
    'process.browser': true,
  },
  optimizeDeps: {
    include: [
      'buffer',
      'process',
      'util',
      'crypto-browserify',
      'stream-browserify',
      'assert',
      'stream-http',
      'https-browserify',
      'os-browserify',
      'url',
      'browserify-zlib'
    ],
  },
}));
