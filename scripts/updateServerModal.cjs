const fs = require('fs');
let content = fs.readFileSync('src/components/ServerControlCenterModal.jsx', 'utf8');

// Add import
if (!content.includes('ELG26_CHANNELS')) {
  content = content.replace(
    "import { KURDISH_PLAYLIST_CHANNELS } from '../data/kurdishPlaylist';",
    "import { KURDISH_PLAYLIST_CHANNELS } from '../data/kurdishPlaylist';\nimport { ELG26_CHANNELS } from '../data/elg26Channels';"
  );
}

// In handleActivateServer, handle srv-elg26 fast path
const elgFastPath = `      if (srv.id === 'srv-elg26') {
        setRefreshMessage('⚡ بارکردنی راستەوخۆی ١٨٠ کەناڵی کوردی سێرڤەری ELG-26...');
        savePersistentChannels(ELG26_CHANNELS);
        try {
          localStorage.setItem('nndd_cached_channels', JSON.stringify(ELG26_CHANNELS));
          localStorage.removeItem('nndd_last_channel_id');
        } catch(e) {}

        localStorage.setItem('nndd_active_xtream_config', JSON.stringify(cleanConfig));
        localStorage.setItem('nndd_custom_osd_server_code', 'ELG-26');

        const updatedServers = servers.map(s => ({
          ...s,
          isPrimary: s.id === srv.id,
          status: s.id === srv.id ? 'active' : 'standby'
        }));
        saveStoredServers(updatedServers);
        setServers(updatedServers);

        const newSettings = { ...settings, activeServerId: srv.id };
        saveStoredServerSettings(newSettings);
        setSettings(newSettings);

        onServerApplied?.(cleanConfig, ELG26_CHANNELS);
        window.dispatchEvent(new CustomEvent('nndd_channels_updated', { detail: ELG26_CHANNELS }));
        window.dispatchEvent(new CustomEvent('nndd_server_switched', { detail: srv }));

        onNotify?.({
          title: 'سێرڤەری ELG-26 چالاککرا ⚡',
          message: '١٨٠ کەناڵی کوردی سێرڤەری نوێی ELG-26 خرایە کار بە سەرکەوتوویی.',
          type: 'success'
        });
        return;
      }\n\n`;

if (!content.includes("srv.id === 'srv-elg26'")) {
  content = content.replace(
    "// 1. Fast Hybrid Channel Resolver: Map 53 base channels to new server stream URLs instantly!",
    elgFastPath + "      // 1. Fast Hybrid Channel Resolver: Map base channels to new server stream URLs instantly!"
  );
}

fs.writeFileSync('src/components/ServerControlCenterModal.jsx', content, 'utf8');
console.log('ServerControlCenterModal.jsx updated');
