const fs = require('fs');
let content = fs.readFileSync('src/data/serverManager.js', 'utf8');

content = content.replace(
  /return \{\s*id:\s*'srv-lion4k'[\s\S]*?password:\s*'6c86e923'\s*\};/,
  `return {
    id: 'srv-elg26',
    name: 'سێرڤەری ELG-26 OTT',
    type: 'xtream',
    serverUrl: 'http://134669063096.elg-26.com',
    username: '0chyx0wx3z',
    password: 'fi7do1vucm'
  };`
);

fs.writeFileSync('src/data/serverManager.js', content, 'utf8');
console.log('Updated fallback in serverManager.js');
