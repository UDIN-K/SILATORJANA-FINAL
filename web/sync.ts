import fs from 'fs';
import path from 'path';

const copyRecursiveSync = (src, dest) => {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest);
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
};

const itemsToCopy = ['src', 'package.json', 'server.ts', 'vite.config.ts', 'components.json', 'tsconfig.json', 'index.html'];

for (const item of itemsToCopy) {
  const srcPath = path.join('temp_repo', item);
  const destPath = path.join('.', item);
  if (fs.existsSync(srcPath)) {
    if (fs.statSync(srcPath).isDirectory()) {
      if (fs.existsSync(destPath)) {
        fs.rmSync(destPath, { recursive: true, force: true });
      }
    }
    copyRecursiveSync(srcPath, destPath);
    console.log(`Copied ${item}`);
  }
}
