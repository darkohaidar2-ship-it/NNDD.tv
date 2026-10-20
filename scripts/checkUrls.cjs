const fs = require('fs');
const content = fs.readFileSync('src/data/kurdishPlaylist.js', 'utf8');
const urls = content.match(/"url":\s*"([^"]+)"/g) || [];
console.log('Total URLs in kurdishPlaylist:', urls.length);
const httpsUrls = urls.filter(u => u.includes('https://'));
console.log('HTTPS URLs:', httpsUrls.length);
