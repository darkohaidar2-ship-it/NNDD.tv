const fs = require('fs');
let content = fs.readFileSync('src/components/KurdLocalTvApp.jsx', 'utf8');

// 1. Fix getOptimalStreamUrl
const oldOptimal = `  const getOptimalStreamUrl = (channel, isBackup = false) => {
    if (!channel) return '';
    let streamUrl = isBackup ? (channel.backupUrl || channel.url) : channel.url;
    if (!streamUrl) return '';

    // If live channel has Xtream Codes pattern and mpegts is supported, prefer raw MPEG-TS (.ts)
    if (streamUrl.includes('/live/') && streamUrl.includes('.m3u8') && mpegts.isSupported()) {
      streamUrl = streamUrl.replace(/\\.m3u8(\\?.*)?$/i, '.ts$1');
    }
    return streamUrl;
  };`;

const newOptimal = `  const getOptimalStreamUrl = (channel, isBackup = false) => {
    if (!channel) return '';
    let streamUrl = isBackup ? (channel.backupUrl || channel.url) : channel.url;
    if (!streamUrl) return '';

    // On HTTPS web pages (like Vercel), if primary is HTTP but backup is HTTPS, prefer HTTPS to avoid browser Mixed Content block
    const isHttpsPage = typeof window !== 'undefined' && window.location.protocol === 'https:';
    if (isHttpsPage && streamUrl.startsWith('http:') && !isBackup && channel.backupUrl && channel.backupUrl.startsWith('https:')) {
      return channel.backupUrl;
    }

    return streamUrl;
  };`;

if (content.includes(oldOptimal)) {
  content = content.replace(oldOptimal, newOptimal);
  console.log('Replaced getOptimalStreamUrl');
} else {
  console.warn('Could not find old getOptimalStreamUrl exactly, trying regex');
  content = content.replace(
    /const getOptimalStreamUrl = \(channel, isBackup = false\) => \{[\s\S]*?return streamUrl;\s*\};/,
    newOptimal
  );
  console.log('Replaced getOptimalStreamUrl via regex');
}

// 2. Fix failoverToBackup to try channel.backupUrl before giving up in dedicated mode
const oldFailover = `      // RULE 1: DEDICATED SERVER MODE
      // "ئەگەر کەناڵی نەهێنا لەسەر ئەو سێفەرە ئەوە کەناڵەکە سێرفەری مەگۆرە لەسەر سێرفەرێک بیهێنێ - با لەسەر سێرفەری دیاری کراو بێت"
      if (serverMode === 'dedicated') {`;

const newFailover = `      // If primary failed and channel has a valid alternative backupUrl, try it immediately!
      if (!isBackup && channel.backupUrl && channel.backupUrl !== streamUrl) {
        console.info(\`[STREAM FAILOVER (\${reason})] Trying backupUrl for #\${channel.number}: \${channel.backupUrl}\`);
        setIsBackupStreamActive(true);
        startPlayerForSlot(slot, channel, reqId, true, 4000, onReadyCallback);
        return;
      }

      // RULE 1: DEDICATED SERVER MODE
      // "ئەگەر کەناڵی نەهێنا لەسەر ئەو سێفەرە ئەوە کەناڵەکە سێرفەری مەگۆرە لەسەر سێرفەرێک بیهێنێ - با لەسەر سێرفەری دیاری کراو بێت"
      if (serverMode === 'dedicated') {`;

if (content.includes(oldFailover)) {
  content = content.replace(oldFailover, newFailover);
  console.log('Replaced failoverToBackup');
}

// 3. Fix mpegts type 'mse' to 'm2ts'
content = content.replace(/type:\s*'mse'/, "type: 'm2ts'");

// 4. Update Hls.isSupported() condition so it's not blocked if isRawTsStream was true
content = content.replace(
  /if \(Hls\.isSupported\(\) && streamUrl && \(streamUrl\.includes\('\.m3u8'\) \|\| !isRawTsStream\(streamUrl\)\)\)/,
  "if (Hls.isSupported() && streamUrl)"
);

fs.writeFileSync('src/components/KurdLocalTvApp.jsx', content, 'utf8');
console.log('KurdLocalTvApp.jsx successfully patched');
