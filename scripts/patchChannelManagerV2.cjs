const fs = require('fs');
let content = fs.readFileSync('src/components/ChannelManagerTab.jsx', 'utf8');

// 1. Update handleInlineFieldChange
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

// 2. Replace all Dicebear fallbacks cleanly with /nndd_logo.png
content = content.replace(/onError=\{\(e\) => \{\s*e\.target\.src = [^}]+;\s*\}\}/g, "onError={(e) => { e.target.src = '/nndd_logo.png'; }}");
content = content.replace(/ch\.fallbackLogo \|\| '[^']+'/g, "ch.fallbackLogo || '/nndd_logo.png'");

// 3. Remove View Mode Toggle, keeping Import and Add buttons
const oldViewModeToggle = `<div className="flex items-center bg-slate-950/80 border border-white/10 rounded-xl p-1 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('sheets')}
              className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer \${
                viewMode === 'sheets'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm border border-emerald-400/30'
                  : 'text-slate-400 hover:text-white'
              }\`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>خشتەی گۆگڵ شێت (Sheets)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer \${
                viewMode === 'table'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm border border-cyan-400/30'
                  : 'text-slate-400 hover:text-white'
              }\`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>لیستی ستاندارد</span>
            </button>
          </div>`;

if (content.includes(oldViewModeToggle)) {
  content = content.replace(oldViewModeToggle, '');
  console.log('Removed ViewModeToggle');
} else {
  console.warn('ViewModeToggle string not matched exactly, trying regex');
  content = content.replace(/\{\/\* View Mode Toggle \*\/\}[\s\S]*?<\/button>\s*<\/div>/, '');
  console.log('Removed ViewModeToggle via regex');
}

// 4. Update table to table-fixed with locked colgroup
const targetTable = `<table className="w-full text-start border-collapse text-xs">`;
const replacementTable = `<table className="w-full text-start border-collapse text-xs table-fixed">
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
              </colgroup>`;

content = content.replace(targetTable, replacementTable);

// 5. Make thead sticky with solid background
content = content.replace(
  '<thead>',
  '<thead className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-md shadow-md">'
);

// 6. Make table container scrollable with max-h without page jumping
content = content.replace(
  '<div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60 shadow-inner">',
  '<div className="overflow-x-auto overflow-y-auto max-h-[75vh] rounded-2xl border border-white/10 bg-slate-950/60 shadow-inner relative scrollbar-thin">'
);

// 7. Remove VIEW MODE 2 block if viewMode is now purely sheets
content = content.replace(
  /\{\/\* VIEW MODE 2: STANDARD DETAILED TABLE \*\/\}[\s\S]*?\{\/\* Pagination Controls \*\/\}/,
  '{/* Pagination Controls */}'
);

fs.writeFileSync('src/components/ChannelManagerTab.jsx', content, 'utf8');
console.log('ChannelManagerTab.jsx successfully patched V2');
