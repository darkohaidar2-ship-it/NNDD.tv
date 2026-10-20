const http = require('http');
const fs = require('fs');
const path = require('path');

const HOST = 'http://134669063096.elg-26.com';
const USERNAME = '0chyx0wx3z';
const PASSWORD = 'fi7do1vucm';

// Load existing curated playlist to extract logos and metadata
const curatedPlaylistPath = path.join(__dirname, '..', 'src', 'data', 'kurdishPlaylist.js');
let existingLogos = {};

try {
  const content = fs.readFileSync(curatedPlaylistPath, 'utf8');
  // Simple regex parser for existing channels
  const regex = /\{[\s\S]*?"id":\s*"([^"]+)"[\s\S]*?"name":\s*"([^"]+)"[\s\S]*?"logo":\s*"([^"]+)"[\s\S]*?\}/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const id = match[1];
    const name = match[2];
    const logo = match[3];
    existingLogos[name.toLowerCase()] = logo;
    existingLogos[id] = logo;
  }
} catch (e) {
  console.warn('Could not parse kurdishPlaylist:', e.message);
}

// Known logos map for popular Kurdish channels
const KNOWN_LOGOS = {
  rudaw: 'https://kurdtvs.net/uploads/rudawhd.png',
  k24: 'https://kurdtvs.net/uploads/k24.png',
  kurdistan24: 'https://kurdtvs.net/uploads/k24.png',
  ava: 'https://kurdtvs.net/uploads/avatv.png',
  channel8: 'https://kurdtvs.net/uploads/channel8.png',
  kurdsat: 'https://kurdtvs.net/uploads/kurdsat.png',
  kurdsatnews: 'https://kurdtvs.net/uploads/kurdsatnews.png',
  galikurdistan: 'https://kurdtvs.net/uploads/galikurdistannew.png',
  kirkuk: 'https://kurdtvs.net/uploads/kirkuktv.png',
  nrt1: 'https://kurdtvs.net/uploads/nrt1.png',
  nrt: 'https://kurdtvs.net/uploads/nrt1.png',
  nrt2: 'https://kurdtvs.net/uploads/nrt2.png',
  nrt4: 'https://kurdtvs.net/uploads/nrt4.png',
  kurdmax: 'https://kurdtvs.net/uploads/kurdmax.png',
  kurdmaxshow: 'https://kurdtvs.net/uploads/kurdmaxshow.png',
  khak: 'https://kurdtvs.net/uploads/khak.png',
  speda: 'https://kurdtvs.net/uploads/speda.png',
  payam: 'https://kurdtvs.net/uploads/payam.png',
  ronahi: 'https://kurdtvs.net/uploads/ronahitv.png',
  sterk: 'https://kurdtvs.net/uploads/sterktv.png',
  amozhgary: 'https://kurdtvs.net/uploads/amozhgary.png',
  waar: 'https://kurdtvs.net/uploads/waartv.png',
  zagros: 'https://kurdtvs.net/uploads/zagros.png',
  kurdistantv: 'https://kurdtvs.net/uploads/kurdistantv.png',
  rojava: 'https://kurdtvs.net/uploads/rojavatv.png',
  jin: 'https://kurdtvs.net/uploads/jintv.png',
  cira: 'https://kurdtvs.net/uploads/ciratv.png',
  trtkurdi: 'https://kurdtvs.net/uploads/trtkurdi.png',
  iraqia: 'https://kurdtvs.net/uploads/iraqia.png',
  knn: 'https://kurdtvs.net/uploads/knn.png',
  duhok: 'https://kurdtvs.net/uploads/duhoktv.png',
  shams: 'https://stream.shams.tv/logo.png',
  zarok: 'https://kurdtvs.net/uploads/zaroktv.png',
  afarin: 'https://kurdtvs.net/uploads/afarin.png',
  eman: 'https://kurdtvs.net/uploads/emantv.png',
  quran: 'https://kurdtvs.net/uploads/alquran.png',
  wwe: 'https://kurdtvs.net/uploads/wwe.png',
  fox: 'https://kurdtvs.net/uploads/fox.png'
};

function cleanName(raw) {
  let name = (raw || '')
    .replace(/^\|KRD\|\s*/i, '')
    .replace(/^KRD\|\s*/i, '')
    .replace(/^\|KU\|\s*/i, '')
    .replace(/^KU\|\s*/i, '')
    .replace(/^\|KD\|\s*/i, '')
    .replace(/\s*ku\s*$/i, '')
    .replace(/\s*ᴴᴰ/g, ' HD')
    .replace(/\s*ᵁᴴᴰ/g, ' UHD')
    .trim();

  // Normalize duplicate spaces
  name = name.replace(/\s+/g, ' ');
  return name;
}

function findLogo(name, stream) {
  const lower = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const [k, v] of Object.entries(KNOWN_LOGOS)) {
    if (lower.includes(k)) return v;
  }
  for (const [k, v] of Object.entries(existingLogos)) {
    const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanK && (lower.includes(cleanK) || cleanK.includes(lower))) return v;
  }
  // If stream icon is valid and not redbubble placeholder
  if (stream.stream_icon && !stream.stream_icon.includes('redbubble') && stream.stream_icon.startsWith('http')) {
    return stream.stream_icon;
  }
  return 'https://kurdtvs.net/uploads/rudawhd.png'; // default fallback
}

function categorize(name) {
  const lower = name.toLowerCase();
  if (lower.includes('sport') || lower.includes('wwe') || lower.includes('aso')) {
    return 'وەرزش';
  }
  if (lower.includes('quran') || lower.includes('amozhgary') || lower.includes('eman') || lower.includes('sunnah') || lower.includes('minhrab') || lower.includes('bangawaz') || lower.includes('rasoulallah') || lower.includes('tasawf') || lower.includes('noor')) {
    return 'ئاینی و پەروەردەیی';
  }
  if (lower.includes('kid') || lower.includes('zarok') || lower.includes('afarin') || lower.includes('helhelok')) {
    return 'منداڵان و فێرکاری';
  }
  if (lower.includes('rudaw') || lower.includes('k24') || lower.includes('kurdsat news') || lower.includes('nrt 1') || lower.includes('channel 8') || lower.includes('speda tv') || lower.includes('payam') || lower.includes('knn') || lower.includes('gali kurdistan') || lower.includes('ronahi') || lower.includes('sterk') || lower.includes('kirkuk') || lower.includes('rojava')) {
    return 'هەواڵ و ڕووداوەکان';
  }
  if (lower.includes('drama') || lower.includes('cinema') || lower.includes('show') || lower.includes('box') || lower.includes('film') || lower.includes('clip') || lower.includes('max')) {
    return 'دراما و سینەما';
  }
  if (lower.includes('doc') || lower.includes('culture') || lower.includes('srusht') || lower.includes('kalapor')) {
    return 'دۆکیۆمێنتاری و سروشت';
  }
  return 'کەناڵە کوردییەکان';
}

function fetchStreams(categoryId) {
  return new Promise((resolve, reject) => {
    const url = `${HOST}/player_api.php?username=${USERNAME}&password=${PASSWORD}&action=get_live_streams&category_id=${categoryId}`;
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('Fetching Category 576 (|KD| ✪ KURDISTAN)...');
  const streams = await fetchStreams(576);
  console.log(`Fetched ${streams.length} streams.`);

  const channels = streams.map((s, index) => {
    const cName = cleanName(s.name);
    const logo = findLogo(cName, s);
    const category = categorize(cName);
    const isUHD = s.name.includes('ᵁᴴᴰ') || s.name.includes('4K') || s.name.includes('UHD');
    const isHD = s.name.includes('ᴴᴰ') || s.name.includes('HD') || isUHD;
    const streamId = s.stream_id;

    const streamUrl = `${HOST}/live/${USERNAME}/${PASSWORD}/${streamId}.m3u8`;
    const tsUrl = `${HOST}/live/${USERNAME}/${PASSWORD}/${streamId}.ts`;

    return {
      number: index + 1,
      id: `elg-${streamId}`,
      streamId: streamId,
      name: cName,
      nameEn: cName,
      nameKu: cName,
      category: category,
      url: streamUrl,
      backupUrl: tsUrl,
      tsUrl: tsUrl,
      logo: logo,
      fallbackLogo: logo,
      quality: isUHD ? '4K UHD' : (isHD ? '1080p FHD' : '720p HD'),
      is4K: isUHD,
      isLocked: false,
      isFavorite: index < 15,
      serverId: 'srv-elg26',
      description: `کەناڵی ${cName} لە ڕێگەی سێرڤەری نوێی ELG-26 OTT پەخش دەکرێت بە کوالێتی بەرز.`,
      epg: {
        currentShow: `پەخشی ڕاستەوخۆ - ${cName}`,
        nextShow: 'بەرنامەی داهاتوو',
        timeSlot: '24/7',
        progress: 50
      }
    };
  });

  // Save to public/channels.json
  const outJsonPath = path.join(__dirname, '..', 'public', 'channels.json');
  fs.writeFileSync(outJsonPath, JSON.stringify(channels, null, 2), 'utf8');
  console.log(`Wrote ${channels.length} channels to ${outJsonPath}`);

  // Create src/data/elg26Channels.js
  const outJsPath = path.join(__dirname, '..', 'src', 'data', 'elg26Channels.js');
  const jsContent = `/**
 * NNDD TV - ELG-26 Primary Channels Dataset
 * Automatically generated from ELG-26 OTT Server Category 576 (180 Kurdish Channels)
 */

export const ELG26_CHANNELS = ${JSON.stringify(channels, null, 2)};
`;
  fs.writeFileSync(outJsPath, jsContent, 'utf8');
  console.log(`Wrote channels export to ${outJsPath}`);

  console.log('Sample channel generated:', channels[1]);
}

main().catch(console.error);
