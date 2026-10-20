const fs = require('fs');
let content = fs.readFileSync('src/components/ServersManagerTab.jsx', 'utf8');

// Add import
if (!content.includes('ELG26_CHANNELS')) {
  content = content.replace(
    "import { KURDISH_PLAYLIST_CHANNELS } from '../data/kurdishPlaylist';",
    "import { KURDISH_PLAYLIST_CHANNELS } from '../data/kurdishPlaylist';\nimport { ELG26_CHANNELS } from '../data/elg26Channels';"
  );
}

const fastPath = `        if (serverId === 'srv-elg26') {
          setChannels(ELG26_CHANNELS);
          savePersistentChannels(ELG26_CHANNELS);
          window.dispatchEvent(new CustomEvent('nndd_channels_updated', { detail: ELG26_CHANNELS }));
          window.dispatchEvent(new CustomEvent('nndd_server_switched', { detail: srv }));
          onNotify?.({
            title: 'سێرڤەر بە سەرکەوتوویی گۆڕدرا 🎉',
            message: 'سێرڤەری "' + srv.name + '" بوو بە سێرڤەری سەرەکی و ١٨٠ کەناڵی کوردی هاوردە کران.',
            type: 'success'
          });
          setSwitchingServerId(null);
          return;
        }\n\n`;

if (!content.includes("if (serverId === 'srv-elg26')")) {
  content = content.replace(
    "// Import fresh channels directly from the newly selected primary server!",
    fastPath + "        // Import fresh channels directly from the newly selected primary server!"
  );
}

fs.writeFileSync('src/components/ServersManagerTab.jsx', content, 'utf8');
console.log('ServersManagerTab.jsx updated');
