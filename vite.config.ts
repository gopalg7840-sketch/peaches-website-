import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';
import {themeFiles} from './src/theme-source';

function writeShopifyThemePlugin() {
  return {
    name: 'write-shopify-theme-files',
    buildStart() {
      const baseDir = path.resolve(__dirname, 'wave-peaches-theme');
      themeFiles.forEach(file => {
        const fullPath = path.join(baseDir, file.path);
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(fullPath, file.content, 'utf8');
      });
      console.log('Successfully wrote 26 physical Shopify Wave (Peaches Preset) files to wave-peaches-theme/ directory.');
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(), 
      writeShopifyThemePlugin(),
      {
        name: 'copy-input-images',
        buildStart() {
          try {
            const publicDir = path.resolve(__dirname, 'public');
            if (!fs.existsSync(publicDir)) {
              fs.mkdirSync(publicDir, { recursive: true });
            }
            
            const logLines: string[] = [];
            
            // Search function
            function scanDir(dirPath: string, depth: number = 0, maxDepth: number = 2) {
              if (depth > maxDepth) return;
              try {
                if (fs.existsSync(dirPath)) {
                  const files = fs.readdirSync(dirPath);
                  files.forEach(f => {
                    const full = path.join(dirPath, f);
                    try {
                      const stat = fs.statSync(full);
                      if (stat.isFile()) {
                        const nameLower = f.toLowerCase();
                        if (nameLower.includes('input') || nameLower.endsWith('.png') || nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg') || nameLower.endsWith('.webp')) {
                          logLines.push(`FILE: ${full} (${stat.size} bytes)`);
                        }
                      } else if (stat.isDirectory() && !f.startsWith('.') && f !== 'node_modules' && f !== 'dist' && f !== 'wave-peaches-theme') {
                        // Scan but only up to depth of maxDepth
                        scanDir(full, depth + 1, maxDepth);
                      }
                    } catch (e) {}
                  });
                }
              } catch (err) {}
            }
            
            logLines.push('=== SCANNING / DETAILED ===');
            scanDir('/', 0, 4);

            fs.writeFileSync(path.join(__dirname, 'src', 'found_files.txt'), logLines.join('\n'), 'utf8');
            console.log('Successfully wrote scan index to src/found_files.txt');
          } catch (err) {
            console.error('Error in copy-input-images plugin:', err);
          }
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
