const http = require('http');
const fs = require('fs');
const path = require('path');

const HOST = 'http://134669063096.elg-26.com';
const USERNAME = '0chyx0wx3z';
const PASSWORD = 'fi7do1vucm';

// 1. Read curated channels from kurdishPlaylist.js
const kpContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'kurdishPlaylist.js'), 'utf8');
const curatedList = [];
const chBlocks = kpContent.split(/\{\s*"number":/g).slice(1);
for (const b of chBlocks) {
  const numMatch = b.match(/^(\d+)/);
  const nameMatch = b.match(/"name":\s*"([^"]+)"/);
  const nameKuMatch = b.match(/"nameKu":\s*"([^"]+)"/);
  const urlMatch = b.match(/"url":\s*"([^"]+)"/);
  const logoMatch = b.match(/"logo":\s*"([^"]+)"/);
  const catMatch = b.match(/"category":\s*"([^"]+)"/);
  const aliasesMatch = b.match(/"xtreamSearchAliases":\s*(\[[^\]]+\])/);

  let aliases = [];
  if (aliasesMatch) {
    try { aliases = JSON.parse(aliasesMatch[1]); } catch(e) {}
  }

  if (nameMatch && urlMatch) {
    curatedList.push({
      curatedNumber: numMatch ? parseInt(numMatch[1], 10) : 0,
      name: nameMatch[1],
      nameKu: nameKuMatch ? nameKuMatch[1] : nameMatch[1],
      url: urlMatch[1],
      logo: logoMatch ? logoMatch[1] : '',
      category: catMatch ? catMatch[1] : 'کەناڵە کوردییەکان',
      aliases: aliases.length > 0 ? aliases : [nameMatch[1].toLowerCase()]
    });
  }
}

console.log(`Loaded ${curatedList.length} curated base channels with authentic HTTPS streams.`);

function cleanStreamName(raw) {
  return (raw || '')
    .replace(/^\|KRD\|\s*/i, '')
    .replace(/^KRD\|\s*/i, '')
    .replace(/^\|KU\|\s*/i, '')
    .replace(/^KU\|\s*/i, '')
    .replace(/^\|KD\|\s*/i, '')
    .replace(/\s*ku\s*$/i, '')
    .replace(/\s*ᴴᴰ/g, ' HD')
    .replace(/\s*ᵁᴴᴰ/g, ' UHD')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeForMatch(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]/g, '');
}

function findCuratedMatch(streamName) {
  const sNorm = normalizeForMatch(streamName);
  for (const c of curatedList) {
    for (const a of c.aliases) {
      const aNorm = normalizeForMatch(a);
      if (aNorm.length >= 3 && (sNorm.includes(aNorm) || aNorm.includes(sNorm))) {
        return c;
      }
    }
  }
  return null;
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

async function main() {
  console.log('Fetching Category 576 from ELG-26...');
  const streams = await fetchStreams(576);
  console.log(`Fetched ${streams.length} streams.`);

  let matchedCount = 0;

  const channels = streams.map((s, index) => {
    const cName = cleanStreamName(s.name);
    const streamId = s.stream_id;
    const isUHD = s.name.includes('ᵁᴴᴰ') || s.name.includes('4K') || s.name.includes('UHD');
    const isHD = s.name.includes('ᴴᴰ') || s.name.includes('HD') || isUHD;

    const xtreamHls = `${HOST}/live/${USERNAME}/${PASSWORD}/${streamId}.m3u8`;
    const xtreamTs = `${HOST}/live/${USERNAME}/${PASSWORD}/${streamId}.ts`;

    const match = findCuratedMatch(cName);
    let primaryUrl = xtreamHls;
    let backupUrl = xtreamTs;
    let logo = s.stream_icon && !s.stream_icon.includes('redbubble') && s.stream_icon.startsWith('http') ? s.stream_icon : 'https://kurdtvs.net/uploads/rudawhd.png';
    let category = categorize(cName);
    let displayName = cName;
    let nameKu = cName;

    if (match) {
      matchedCount++;
      // If channel has verified HTTPS stream from curated playlist, use it as primary so it NEVER fails on HTTPS web app!
      primaryUrl = match.url;
      backupUrl = xtreamHls; // ELG-26 server stream as reliable backup
      logo = match.logo || logo;
      category = match.category || category;
      nameKu = match.nameKu || cName;
    }

    return {
      number: index + 1,
      id: `elg-${streamId}`,
      streamId: streamId,
      name: displayName,
      nameEn: displayName,
      nameKu: nameKu,
      category: category,
      url: primaryUrl,
      backupUrl: backupUrl,
      tsUrl: xtreamTs,
      xtreamUrl: xtreamHls,
      hasDirectHttps: Boolean(match && match.url.startsWith('https:')),
      logo: logo,
      fallbackLogo: logo,
      quality: isUHD ? '4K UHD' : (isHD ? '1080p FHD' : '720p HD'),
      is4K: isUHD,
      isLocked: false,
      isFavorite: index < 15,
      serverId: 'srv-elg26',
      description: `کەناڵی ${displayName} لە ڕێگەی سێرڤەری ELG-26 و تۆڕی NNDD پەخش دەکرێت.`,
      epg: {
        currentShow: `پەخشی ڕاستەوخۆ - ${displayName}`,
        nextShow: 'بەرنامەی داهاتوو',
        timeSlot: '24/7',
        progress: 50
      }
    };
  });

  // Put Rudaw, K24, Channel 8, Kurdsat, AVA at the very top (first 10 numbers)
  channels.sort((a, b) => {
    const priority = ['rudaw', 'k24', 'channel 8', 'kurdsat', 'ava', 'nrt 1', 'kurdmax', 'gali kurdistan'];
    const aLower = a.name.toLowerCase();
    const bLower = b.name.toLowerCase();
    const aPri = priority.findIndex(p => aLower.includes(p));
    const bPri = priority.findIndex(p => bLower.includes(p));
    if (aPri !== -1 && bPri !== -1) return aPri - bPri;
    if (aPri !== -1) return -1;
    if (bPri !== -1) return 1;
    return 0;
  });

  // Re-number strictly 1 to 180
  channels.forEach((ch, idx) => {
    ch.number = idx + 1;
  });

  console.log(`Matched ${matchedCount} channels with authentic HTTPS streams.`);
  console.log('Top 5 channels:', channels.slice(0, 5).map(c => `#${c.number} ${c.name} (HTTPS: ${c.hasDirectHttps})`));

  // Write public/channels.json
  const outJsonPath = path.join(__dirname, '..', 'public', 'channels.json');
  fs.writeFileSync(outJsonPath, JSON.stringify(channels, null, 2), 'utf8');
  console.log(`Wrote ${channels.length} channels to ${outJsonPath}`);

  // Write src/data/elg26Channels.js
  const outJsPath = path.join(__dirname, '..', 'src', 'data', 'elg26Channels.js');
  const jsContent = `/**
 * NNDD TV - ELG-26 Hybrid Kurdish Channels Dataset (180 Channels)
 * Direct HTTPS Primary for guaranteed web playback + Full ELG-26 Xtream Backup
 */

export const ELG26_CHANNELS = ${JSON.stringify(channels, null, 2)};
`;
  fs.writeFileSync(outJsPath, jsContent, 'utf8');
  console.log(`Wrote channels export to ${outJsPath}`);
}

main().catch(console.error);
