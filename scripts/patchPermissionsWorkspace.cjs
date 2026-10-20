const fs = require('fs');
let content = fs.readFileSync('src/components/PermissionsWorkspace.jsx', 'utf8');

// 1. Change default active tab to 'channels'
content = content.replace(
  "const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('erp');",
  "const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('channels');"
);

// 2. Remove erp button from navigation
const erpBtn = `            <button
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
            </button>`;

if (content.includes(erpBtn)) {
  content = content.replace(erpBtn, '');
  console.log('Removed ERP nav button');
} else {
  content = content.replace(/<button[\s\S]*?setActiveWorkspaceTab\('erp'\)[\s\S]*?<\/button>/, '');
  console.log('Removed ERP nav button via regex');
}

// 3. Remove roles button from navigation
const rolesBtnRegex = /<button[\s\S]*?setActiveWorkspaceTab\('roles'\)[\s\S]*?<\/button>/;
content = content.replace(rolesBtnRegex, '');
console.log('Removed Roles nav button');

// 4. In render body, remove activeWorkspaceTab === 'erp' block
const erpBlockRegex = /\{activeWorkspaceTab === 'erp' && \([\s\S]*?<\/\div>\s*\)\}/;
content = content.replace(erpBlockRegex, '');
console.log('Removed ERP render block');

// 5. In render body, remove activeWorkspaceTab === 'roles' block
const rolesBlockRegex = /\{activeWorkspaceTab === 'roles' && \([\s\S]*?<\/>\s*\)\}/;
content = content.replace(rolesBlockRegex, '');
console.log('Removed Roles render block');

// 6. Clean up unused imports if any
content = content.replace("import IosErpDashboard from './IosErpDashboard';", "// IosErpDashboard removed for simplicity");

fs.writeFileSync('src/components/PermissionsWorkspace.jsx', content, 'utf8');
console.log('PermissionsWorkspace.jsx patched successfully');
