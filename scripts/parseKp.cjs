const fs = require('fs');
const path = require('path');

// Read kurdishPlaylist.js
const kpContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'kurdishPlaylist.js'), 'utf8');

// Simple parser for kurdishPlaylist channels
const kpChannels = [];
const chBlocks = kpContent.split(/\{\s*"number":/g).slice(1);
for (const b of chBlocks) {
  const numMatch = b.match(/^(\d+)/);
  const nameMatch = b.match(/"name":\s*"([^"]+)"/);
  const urlMatch = b.match(/"url":\s*"([^"]+)"/);
  const logoMatch = b.match(/"logo":\s*"([^"]+)"/);
  const catMatch = b.match(/"category":\s*"([^"]+)"/);
  if (nameMatch && urlMatch) {
    kpChannels.push({
      number: numMatch ? parseInt(numMatch[1], 10) : 0,
      name: nameMatch[1],
      url: urlMatch[1],
      logo: logoMatch ? logoMatch[1] : '',
      category: catMatch ? catMatch[1] : ''
    });
  }
}
console.log('Parsed curated channels:', kpChannels.length);
console.log(kpChannels.slice(0, 5).map(c => c.name + ' => ' + c.url));
