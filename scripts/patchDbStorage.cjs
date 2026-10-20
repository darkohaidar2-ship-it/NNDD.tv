const fs = require('fs');
let content = fs.readFileSync('src/data/dbStorage.js', 'utf8');

// Update savePersistentChannels signature and skipNotify check
content = content.replace(
  'export async function savePersistentChannels(channels) {',
  'export async function savePersistentChannels(channels, skipNotify = false) {'
);

content = content.replace(
  `  // 4. Notify app listeners
  if (typeof window !== 'undefined') {`,
  `  // 4. Notify app listeners (skip during inline typing to prevent table jumping)
  if (!skipNotify && typeof window !== 'undefined') {`
);

fs.writeFileSync('src/data/dbStorage.js', content, 'utf8');
console.log('dbStorage.js updated with skipNotify support');
