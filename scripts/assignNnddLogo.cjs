const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '..', 'public', 'channels.json');
const jsPath = path.join(__dirname, '..', 'src', 'data', 'elg26Channels.js');

const channels = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const KNOWN_LOGOS = {
  rudaw: 'https://kurdtvs.net/uploads/rudawhd.png',
  k24: 'https://kurdtvs.net/uploads/k24.png',
  kurdistan24: 'https://kurdtvs.net/uploads/k24.png',
  channel8: 'https://kurdtvs.net/uploads/channel8.png',
  kurdsatnews: 'https://kurdtvs.net/uploads/kurdsatnews.png',
  kurdsat: 'https://kurdtvs.net/uploads/kurdsat.png',
  avatv: 'https://kurdtvs.net/uploads/avatv.png',
  avamedia: 'https://kurdtvs.net/uploads/avatv.png',
  ava: 'https://kurdtvs.net/uploads/avatv.png',
  nrt1: 'https://kurdtvs.net/uploads/nrt1.png',
  nrt2: 'https://kurdtvs.net/uploads/nrt2.png',
  nrt4: 'https://kurdtvs.net/uploads/nrt4.png',
  nrt: 'https://kurdtvs.net/uploads/nrt1.png',
  kurdmaxshow: 'https://kurdtvs.net/uploads/kurdmaxshow.png',
  kurdmax: 'https://kurdtvs.net/uploads/kurdmax.png',
  galikurdistan: 'https://kurdtvs.net/uploads/galikurdistannew.png',
  geli: 'https://kurdtvs.net/uploads/galikurdistannew.png',
  speda: 'https://kurdtvs.net/uploads/speda.png',
  payam: 'https://kurdtvs.net/uploads/payam.png',
  waar: 'https://kurdtvs.net/uploads/waartv.png',
  kirkuk: 'https://kurdtvs.net/uploads/kirkuktv.png',
  kurdistantv: 'https://kurdtvs.net/uploads/kurdistantv.png',
  zagros: 'https://kurdtvs.net/uploads/zagros.png',
  trtkurdi: 'https://kurdtvs.net/uploads/trtkurdi.png',
  shams: 'https://stream.shams.tv/logo.png',
  zarok: 'https://kurdtvs.net/uploads/zaroktv.png',
  afarin: 'https://kurdtvs.net/uploads/afarin.png',
  amozhgary: 'https://kurdtvs.net/uploads/amozhgary.png',
  khak: 'https://kurdtvs.net/uploads/khak.png',
  ronahi: 'https://kurdtvs.net/uploads/ronahitv.png',
  sterk: 'https://kurdtvs.net/uploads/sterktv.png',
  rojava: 'https://kurdtvs.net/uploads/rojavatv.png',
  cira: 'https://kurdtvs.net/uploads/ciratv.png',
  jin: 'https://kurdtvs.net/uploads/jintv.png',
  duhok: 'https://kurdtvs.net/uploads/duhoktv.png',
  knn: 'https://kurdtvs.net/uploads/knn.png',
  eman: 'https://kurdtvs.net/uploads/emantv.png'
};

function resolveLogo(ch) {
  const norm = (ch.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  // 1. Check known logos
  for (const [key, logoUrl] of Object.entries(KNOWN_LOGOS)) {
    if (norm.includes(key)) {
      return logoUrl;
    }
  }

  // 2. If current logo is valid and NOT fake rudaw and NOT redbubble/dicebear
  if (ch.logo && 
      ch.logo.startsWith('http') && 
      !ch.logo.includes('redbubble') && 
      !ch.logo.includes('dicebear') && 
      !ch.logo.includes('rudawhd.png')) {
    return ch.logo;
  }

  // 3. Fallback to official NNDD TV logo
  return '/nndd_logo.png';
}

let nnddLogoCount = 0;
let knownLogoCount = 0;

channels.forEach(ch => {
  const logo = resolveLogo(ch);
  ch.logo = logo;
  ch.fallbackLogo = '/nndd_logo.png';
  if (logo === '/nndd_logo.png') {
    nnddLogoCount++;
  } else {
    knownLogoCount++;
  }
});

console.log(`Logos resolved: ${knownLogoCount} specific TV logos, ${nnddLogoCount} set to official NNDD TV logo.`);

// Write back to public/channels.json
fs.writeFileSync(jsonPath, JSON.stringify(channels, null, 2), 'utf8');
console.log('Saved public/channels.json');

// Write back to src/data/elg26Channels.js
const jsContent = `/**
 * NNDD TV - ELG-26 Hybrid Kurdish Channels Dataset (180 Channels)
 * Direct HTTPS Primary for guaranteed web playback + Full ELG-26 Xtream Backup
 * Official NNDD TV Logo fallback applied to all unbranded channels
 */

export const ELG26_CHANNELS = ${JSON.stringify(channels, null, 2)};
`;
fs.writeFileSync(jsPath, jsContent, 'utf8');
console.log('Saved src/data/elg26Channels.js');
