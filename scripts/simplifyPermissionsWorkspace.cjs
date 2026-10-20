const fs = require('fs');
let content = fs.readFileSync('src/components/PermissionsWorkspace.jsx', 'utf8');

// 1. Set default tab to 'channels'
content = content.replace(
  "const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('erp');",
  "const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('channels');"
);

// 2. Remove IosErpDashboard import
content = content.replace("import IosErpDashboard from './IosErpDashboard';", "// IosErpDashboard removed to simplify panel");

// 3. Clean up the navigation buttons: Channels -> Servers -> Requests -> Codes -> VOD -> Telemetry -> Settings
const oldNavBlock = `<div className="flex items-center flex-wrap gap-2 mt-4 pt-3 border-t border-white/10">
            <button
              onClick={() => setActiveWorkspaceTab('erp')}
              className={\`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer \${
                activeWorkspaceTab === 'erp'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-400/40 ring-1 ring-white/20'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
              }\`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-cyan-300" />
              <span>iOS ERP & JIT</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold">PRO</span>
            </button>

            <button
              onClick={() => setActiveWorkspaceTab('servers')}
              className={\`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer \${
                activeWorkspaceTab === 'servers'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-400/40 ring-1 ring-white/20'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
              }\`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>سێرڤەرەکان</span>
            </button>

            <button
              onClick={() => setActiveWorkspaceTab('channels')}
              className={\`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer \${
                activeWorkspaceTab === 'channels'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-400/40 ring-1 ring-white/20'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
              }\`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>کەناڵەکان ({channels.length})</span>
            </button>

            <button
              onClick={() => setActiveWorkspaceTab('telemetry')}
              className={\`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer \${
                activeWorkspaceTab === 'telemetry'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-400/40 ring-1 ring-white/20'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
              }\`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>ئامێرەکان و IP (Matrix)</span>
            </button>

            <button
              onClick={() => setActiveWorkspaceTab('roles')}
              className={\`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer \${
                activeWorkspaceTab === 'roles'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-400/40 ring-1 ring-white/20'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
              }\`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>دەسەڵات و کارمەندان</span>
            </button>`;

const newNavBlock = `<div className="flex items-center flex-wrap gap-2 mt-4 pt-3 border-t border-white/10">
            <button
              onClick={() => setActiveWorkspaceTab('channels')}
              className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer \${
                activeWorkspaceTab === 'channels'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-400/40 ring-1 ring-white/20'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
              }\`}
            >
              <Tv className="w-3.5 h-3.5 text-cyan-300" />
              <span>📺 کەناڵەکان ({channels.length})</span>
            </button>

            <button
              onClick={() => setActiveWorkspaceTab('servers')}
              className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer \${
                activeWorkspaceTab === 'servers'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-400/40 ring-1 ring-white/20'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
              }\`}
            >
              <Server className="w-3.5 h-3.5 text-blue-300" />
              <span>🌐 سێرڤەرەکان</span>
            </button>

            <button
              onClick={() => setActiveWorkspaceTab('telemetry')}
              className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer \${
                activeWorkspaceTab === 'telemetry'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-400/40 ring-1 ring-white/20'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
              }\`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-300" />
              <span>🛡️ ئامێرەکان و IP</span>
            </button>`;

if (content.includes(oldNavBlock)) {
  content = content.replace(oldNavBlock, newNavBlock);
  console.log('Replaced NavBlock');
} else {
  console.warn('NavBlock exact match failed, using normalized regex');
  content = content.replace(
    /<div className="flex items-center flex-wrap gap-2 mt-4 pt-3 border-t border-white\/10">[\s\S]*?<button[\s\S]*?setActiveWorkspaceTab\('roles'\)[\s\S]*?<\/button>/,
    newNavBlock
  );
  console.log('Replaced NavBlock via regex');
}

// 4. Remove activeWorkspaceTab === 'erp' block
const oldErpRender = `      {/* ========================================================
          TAB: IOS ERP & LIQUID GLASS JIT DASHBOARD
         ======================================================== */}
      {activeWorkspaceTab === 'erp' && (
        <div className="animate-fade-in">
          <IosErpDashboard
            onSwitchToTv={onSwitchToTv}
            onNotify={onNotify}
            currentUser={focusedUser}
            adminTheme={adminTheme}
            onToggleTheme={onToggleTheme}
          />
        </div>
      )}`;

if (content.includes(oldErpRender)) {
  content = content.replace(oldErpRender, '');
  console.log('Removed oldErpRender');
} else {
  content = content.replace(/\{activeWorkspaceTab === 'erp' && \([\s\S]*?<\/\div>\s*\)\}/, '');
  console.log('Removed oldErpRender via regex');
}

// 5. Remove activeWorkspaceTab === 'roles' block
const rolesRegex = /\{activeWorkspaceTab === 'roles' && \([\s\S]*?<\/>\s*\)\}/;
if (rolesRegex.test(content)) {
  content = content.replace(rolesRegex, '');
  console.log('Removed roles block via regex');
} else {
  console.warn('roles block regex did not match');
}

fs.writeFileSync('src/components/PermissionsWorkspace.jsx', content, 'utf8');
console.log('PermissionsWorkspace.jsx successfully updated');
