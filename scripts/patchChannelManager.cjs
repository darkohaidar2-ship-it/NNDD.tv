const fs = require('fs');
let content = fs.readFileSync('src/components/ChannelManagerTab.jsx', 'utf8');

// 1. Update handleInlineFieldChange to skip notification and prevent feedback loop
content = content.replace(
  /const handleInlineFieldChange = \(id, field, value\) => \{[\s\S]*?savePersistentChannels\(updated\);\s*\};/,
  `const handleInlineFieldChange = (id, field, value) => {
    const updated = channels.map(ch => {
      if (ch.id === id) {
        const next = { ...ch, [field]: value };
        if (field === 'nameKu' && (!ch.name || ch.name === ch.nameKu)) {
          next.name = value;
        }
        return next;
      }
      return ch;
    });
    setChannels(updated);
    // skipNotify=true silently updates IndexedDB/localStorage without re-fetching App.jsx state
    savePersistentChannels(updated, true);
  };`
);

// 2. Replace all Dicebear fallbacks with /nndd_logo.png
content = content.replace(/https:\/\/api\.dicebear\.com\/7\.x\/identicon\/svg\?seed=[^'"`}]+/g, '/nndd_logo.png');
content = content.replace(/ch\.fallbackLogo \|\| '[^']+'/g, "ch.fallbackLogo || '/nndd_logo.png'");

// 3. Make table table-fixed with locked colgroup
const oldTableHead = `<table className="w-full text-start border-collapse text-xs">
              <thead>`;

const newTableHead = `<table className="w-full text-start border-collapse text-xs table-fixed">
              <colgroup>
                <col style={{ width: '42px' }} />
                <col style={{ width: '48px' }} />
                <col style={{ width: '130px' }} />
                <col style={{ width: '56px' }} />
                <col style={{ width: '180px' }} />
                <col style={{ width: '150px' }} />
                <col style={{ width: '150px' }} />
                <col style={{ width: '140px' }} />
                <col style={{ width: '95px' }} />
                <col style={{ width: '240px' }} />
                <col style={{ width: '85px' }} />
                <col style={{ width: '80px' }} />
              </colgroup>
              <thead className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-md">`;

content = content.replace(oldTableHead, newTableHead);

// 4. In table container, give a max height with locked overflow so scrolling does not jump page
content = content.replace(
  '<div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60 shadow-inner">',
  '<div className="overflow-x-auto overflow-y-auto max-h-[72vh] rounded-2xl border border-white/10 bg-slate-950/60 shadow-inner relative scrollbar-thin">'
);

// 5. Remove redundant view mode buttons in header
content = content.replace(
  /\{\/\* View Mode Toggle \*\/\}[\s\S]*?<\/div>\s*<\/div>/,
  '/* Single unified spreadsheet view */'
);

// 6. Remove redundant VIEW MODE 2 block at bottom
content = content.replace(
  /\{\/\* VIEW MODE 2: STANDARD DETAILED TABLE \*\/\}[\s\S]*?\{\/\* Pagination Controls \*\/\}/,
  '{/* Pagination Controls */}'
);

fs.writeFileSync('src/components/ChannelManagerTab.jsx', content, 'utf8');
console.log('ChannelManagerTab.jsx patched successfully');
