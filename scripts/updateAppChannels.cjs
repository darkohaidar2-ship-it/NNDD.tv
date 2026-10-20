const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// Update channel state initialization in App.jsx
content = content.replace(
  /const \[channels, setChannels\] = useState\(\(\) => \{[\s\S]*?return CHANNELS_DATA;\s*\}\);/,
  `const [channels, setChannels] = useState(() => {
    try {
      const cached = localStorage.getItem('nndd_cached_channels');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 55) return parsed;
      }
    } catch(e) {}
    return CHANNELS_DATA;
  });`
);

// Update loadPersistentChannels in App.jsx
content = content.replace(
  /loadPersistentChannels\(CHANNELS_DATA\)\.then\(loaded => \{\s*if \(Array\.isArray\(loaded\) && loaded\.length > 0\) \{\s*setChannels\(loaded\);\s*\}\s*\}\);/,
  `loadPersistentChannels(CHANNELS_DATA).then(loaded => {
      if (Array.isArray(loaded) && loaded.length > 55) {
        setChannels(loaded);
      } else {
        setChannels(CHANNELS_DATA);
        savePersistentChannels(CHANNELS_DATA);
      }
    });`
);

// Update SWR channels condition
content = content.replace(
  /if \(!isServerImported && serverCount === 0 && cachedStr !== newStr\) \{/,
  `const currentCount = cachedStr ? (JSON.parse(cachedStr).length || 0) : 0;
                if (data.length > currentCount || currentCount <= 55 || (!isServerImported && cachedStr !== newStr)) {`
);

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log('App.jsx successfully updated');
