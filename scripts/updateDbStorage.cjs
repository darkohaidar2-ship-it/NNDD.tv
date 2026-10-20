const fs = require('fs');
let content = fs.readFileSync('src/data/dbStorage.js', 'utf8');

content = content.replace(
  /if \(Array\.isArray\(dbChannels\) && dbChannels\.length > 0\)/,
  'if (Array.isArray(dbChannels) && dbChannels.length > 55)'
);

content = content.replace(
  /if \(Array\.isArray\(parsed\) && parsed\.length > 0\)/,
  'if (Array.isArray(parsed) && parsed.length > 55)'
);

fs.writeFileSync('src/data/dbStorage.js', content, 'utf8');
console.log('dbStorage.js updated');
