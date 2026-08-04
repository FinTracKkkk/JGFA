// ============================================================
// Joseph Group FA Materials Issuance Register
// Vanilla JS PWA — Supabase backend
// ============================================================

function fatalScreen(title, detail) {
  const el = document.getElementById('app');
  if (el) {
    el.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f5f7fa;padding:24px;font-family:sans-serif;">
        <div style="max-width:480px;background:#fff;border:1px solid #e2e6ed;border-radius:14px;padding:26px 24px;box-shadow:0 8px 32px rgba(20,30,60,.12);">
          <div style="font-size:15px;font-weight:800;color:#a02529;margin-bottom:8px;">${title}</div>
          <div style="font-size:13px;color:#444;line-height:1.5;white-space:pre-wrap;">${detail}</div>
        </div>
      </div>`;
  }
}
window.addEventListener('error', (e) => {
  if (!document.getElementById('main-content') && !document.querySelector('.pin-screen')) {
    fatalScreen('Something went wrong loading the app', (e.error && e.error.message) || e.message || 'Unknown script error. Open DevTools (F12) → Console for details.');
  }
});

if (!window.APP_CONFIG || !window.APP_CONFIG.SUPABASE_URL || window.APP_CONFIG.SUPABASE_URL.includes('YOUR-PROJECT')) {
  fatalScreen('Configuration missing', 'config.js did not load, or SUPABASE_URL/SUPABASE_ANON_KEY are still placeholders.\n\nCheck that config.js was committed to your repo and deployed alongside index.html, and that it has your real Supabase project URL + anon key.');
  throw new Error('APP_CONFIG missing — stopping init.');
}
if (!window.supabase || typeof window.supabase.createClient !== 'function') {
  fatalScreen('Supabase library failed to load', 'The Supabase JS library (from unpkg.com) did not load in this browser.\n\nThis is usually a network/firewall block on unpkg.com. Try a different network, or check the browser console (F12) for a blocked-request error.');
  throw new Error('window.supabase missing — stopping init.');
}

const { SUPABASE_URL, SUPABASE_ANON_KEY, APP_PIN } = window.APP_CONFIG;
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------------- Icons (inline SVG, stroke-based) ----------------
const ICONS = {
  menu:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
  back:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>`,
  refresh:`<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>`,
  dashboard:`<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>`,
  inventory:`<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>`,
  issue:`<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`,
  register:`<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 2h6a2 2 0 012 2v16a2 2 0 01-2 2H9a2 2 0 01-2-2V4a2 2 0 012-2z"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>`,
  reports:`<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>`,
  checklist:`<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>`,
  master:`<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-1.87-.34 1.7 1.7 0 00-1 1.55V21a2 2 0 01-4 0v-.09A1.7 1.7 0 008.9 19.5a1.7 1.7 0 00-1.87.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.7 1.7 0 004.5 15.1 1.7 1.7 0 003 14.1H3a2 2 0 010-4h.09A1.7 1.7 0 004.6 9a1.7 1.7 0 00-.34-1.87l-.06-.06a2 2 0 112.83-2.83l.06.06A1.7 1.7 0 009 4.6a1.7 1.7 0 001-1.55V3a2 2 0 014 0v.09A1.7 1.7 0 0015.1 4.6a1.7 1.7 0 001.87-.34l.06-.06a2 2 0 112.83 2.83l-.06.06A1.7 1.7 0 0019.5 9c.24.62.82 1.05 1.55 1H21a2 2 0 010 4h-.09A1.7 1.7 0 0019.4 15z"/></svg>`,
  logout:`<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  plus:`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  pdf:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  share:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg>`,
  edit:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z"/></svg>`,
  trash:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>`,
  empty:`<svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/></svg>`,
};
const svgIcon = (path) => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;

// ---------------- State ----------------
const S = {
  user: JSON.parse(localStorage.getItem('fa_user') || 'null'),
  pinEntered: '',
  pinError: false,
  route: 'dashboard',
  sidebarOpen: false,
  data: { departments: [], locations: [], users: [], materials: [], stockTx: [], issuances: [], issuanceItems: [], auditLog: [] },
  loading: false,
  history: ['dashboard'],
};

const uid = () => 'id-' + Math.random().toString(36).slice(2, 10);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const todayISO = () => new Date().toISOString().slice(0, 10);
const daysUntil = (d) => Math.ceil((new Date(d) - new Date()) / 86400000);
const esc = (s) => (s ?? '').toString().replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function toast(msg, type = '') {
  const wrap = document.getElementById('toast-wrap') || (() => {
    const w = document.createElement('div'); w.id = 'toast-wrap'; document.body.appendChild(w); return w;
  })();
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

function isAdmin() { return S.user && S.user.role === 'admin'; }
function isViewer() { return S.user && S.user.role === 'viewer'; }
// Per the role spec: Admin = full access. HSE = add stock,
// record issuances, view stock levels, generate reports. Department Viewer = read-only.
function canWrite() { return S.user && (S.user.role === 'admin' || S.user.role === 'store_keeper'); }
function roleLabel(role) { const r = ROLE_OPTIONS.find(x => x.role === role); return r ? r.label : (role || '').replace('_', ' '); }
function requireWrite(actionLabel) {
  if (canWrite()) return true;
  toast(`Your role (${roleLabel(S.user.role)}) is read-only — ${actionLabel} requires HSE or Admin access`, 'error');
  return false;
}

// ---------------- Data loading ----------------
async function loadAll(showToast) {
  S.loading = true;
  try {
    const [dep, loc, usr, mat, stx, iss, isi, aud] = await Promise.all([
      sb.from('fa_departments').select('*').order('name'),
      sb.from('fa_locations').select('*').order('name'),
      sb.from('fa_users').select('*').order('name'),
      sb.from('fa_materials').select('*').order('name'),
      sb.from('fa_stock_transactions').select('*').order('created_at', { ascending: false }),
      sb.from('fa_issuances').select('*').order('created_at', { ascending: false }),
      sb.from('fa_issuance_items').select('*'),
      sb.from('fa_audit_log').select('*').order('changed_at', { ascending: false }).limit(300),
    ]);
    const errs = [dep, loc, usr, mat, stx, iss, isi, aud].filter(r => r.error);
    if (errs.length) {
      console.error(errs);
      toast('Could not reach Supabase — check config.js credentials', 'error');
    } else {
      S.data.departments = dep.data; S.data.locations = loc.data; S.data.users = usr.data;
      S.data.materials = mat.data; S.data.stockTx = stx.data; S.data.issuances = iss.data;
      S.data.issuanceItems = isi.data; S.data.auditLog = aud.data;
      if (showToast) toast('Data refreshed', 'success');
    }
  } catch (e) {
    console.error(e);
    toast('Network error while loading data', 'error');
  }
  S.loading = false;
}

function stockBalance(materialId) {
  return S.data.stockTx.filter(t => t.material_id === materialId && !t.voided).reduce((sum, t) => sum + Number(t.qty), 0)
    - S.data.issuanceItems.filter(i => {
        const parent = S.data.issuances.find(x => x.id === i.issuance_id);
        return i.material_id === materialId && parent && !parent.voided;
      }).reduce((sum, i) => sum + Number(i.qty_issued), 0);
}

function nearestExpiry(materialId) {
  const txs = S.data.stockTx.filter(t => t.material_id === materialId && !t.voided && t.expiry_date);
  if (!txs.length) return null;
  return txs.map(t => t.expiry_date).sort()[0];
}

async function logAudit(table, recordId, action, fieldChanged, oldVal, newVal) {
  await sb.from('fa_audit_log').insert({
    table_name: table, record_id: recordId, action, field_changed: fieldChanged,
    old_value: oldVal != null ? String(oldVal) : null, new_value: newVal != null ? String(newVal) : null,
    changed_by: S.user.name,
  });
}

// ---------------- Router ----------------
// roles: which roles can see/use this screen. Matches the spec:
// Admin = full access. HSE = stock-in, issuance, reports.
// Department Viewer = read-only (dashboard, register, reports).
const ROUTES = [
  { id: 'dashboard', label: 'Dashboard', icon: ICONS.dashboard, roles: ['admin', 'store_keeper', 'viewer'] },
  { id: 'inventory', label: 'Inventory', icon: ICONS.inventory, roles: ['admin', 'store_keeper', 'viewer'] },
  { id: 'issue', label: 'Issue Materials', icon: ICONS.issue, roles: ['admin', 'store_keeper'] },
  { id: 'register', label: 'Issuance Register', icon: ICONS.register, roles: ['admin', 'store_keeper', 'viewer'] },
  { id: 'reports', label: 'Reports', icon: ICONS.reports, roles: ['admin', 'store_keeper', 'viewer'] },
  { id: 'checklist', label: 'Checklist (Phase 2)', icon: ICONS.checklist, roles: ['admin', 'store_keeper'] },
  { id: 'master', label: 'Master Data', icon: ICONS.master, roles: ['admin'] },
];
function canSeeRoute(routeId) {
  const r = ROUTES.find(x => x.id === routeId);
  return r && S.user && r.roles.includes(S.user.role);
}
function firstAllowedRoute() {
  return (ROUTES.find(r => S.user && r.roles.includes(S.user.role)) || ROUTES[0]).id;
}

function navigate(route) {
  S.route = route;
  S.sidebarOpen = false;
  if (S.history[S.history.length - 1] !== route) S.history.push(route);
  render();
}
function goBack() {
  if (S.history.length > 1) {
    S.history.pop(); S.route = S.history[S.history.length - 1];
    render();
  } else {
    logout();
  }
}

// ============================================================
// RENDER
// ============================================================
function render() {
  const app = document.getElementById('app');
  if (!S.user) { app.innerHTML = renderAuth(); attachAuthEvents(); return; }

  app.innerHTML = `
    <div class="overlay ${S.sidebarOpen ? 'show' : ''}" onclick="closeSidebar()"></div>
    <div class="sidebar ${S.sidebarOpen ? 'open' : ''}" id="sidebar">
      <div class="sidebar-head">
        <img src="assets/icon-192.png" alt="JG"/>
        <div>
          <div style="font-weight:800;font-size:13px;">Joseph Group</div>
          <div style="font-size:10.5px;color:rgba(255,255,255,.6);">FA Materials Register</div>
        </div>
        <button class="close" onclick="closeSidebar()">✕</button>
      </div>
      <nav>
        ${ROUTES.filter(r => S.user && r.roles.includes(S.user.role)).map(r => `
          <a class="${S.route === r.id ? 'active' : ''}" onclick="navigate('${r.id}')">${r.icon}<span>${r.label}</span></a>
        `).join('')}
        <div style="flex:1;"></div>
        <a onclick="logout()" style="color:#ffb4ac;">${ICONS.logout}<span>Exit</span></a>
      </nav>
      <div class="sidebar-foot">Signed in as <strong style="color:#fff">${esc(S.user.name)}</strong><br/>Role: ${esc(roleLabel(S.user.role))}</div>
    </div>

    <div class="shell">
      <div style="flex:1;min-width:0;">
        <div class="header">
          <button class="hamburger" onclick="toggleSidebar()">${ICONS.menu}</button>
          <button class="backbtn" title="${S.history.length > 1 ? 'Back' : 'Exit'}" onclick="goBack()">${ICONS.back}</button>
          <div class="brand">
            <img src="assets/icon-192.png" alt="JG logo"/>
            <div class="titles">
              <div class="t1">FA Materials Issuance Register</div>
              <div class="t2">${ROUTES.find(r => r.id === S.route)?.label || ''}</div>
            </div>
          </div>
          <div class="actions">
            <button class="iconbtn ${S.loading ? 'spin' : ''}" title="Refresh" onclick="doRefresh()">${ICONS.refresh}</button>
            <button class="user-chip" onclick="logout()" title="Switch role / exit">
              <span class="av">${esc(S.user.name[0])}</span>
              <span class="nm">${esc(S.user.name)}</span>
              ${ICONS.logout}
            </button>
          </div>
        </div>
        <div class="main" id="main-content">
          ${renderPage()}
        </div>
      </div>
    </div>
    <div id="toast-wrap"></div>
  `;
  attachPageEvents();
}

function toggleSidebar() { S.sidebarOpen = !S.sidebarOpen; render(); }
function closeSidebar() { S.sidebarOpen = false; render(); }
async function doRefresh() { S.loading = true; render(); await loadAll(true); S.loading = false; render(); }
function logout() {
  confirmDialog('Exit and return to role selection?', () => {
    S.user = null;
    localStorage.removeItem('fa_user');
    S.history = ['dashboard']; S.sidebarOpen = false;
    render();
  }, { title: 'Exit', okLabel: 'Exit', danger: false });
}

function renderPage() {
  if (!canSeeRoute(S.route)) {
    return `<div class="empty-state">${svgIcon('<circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>')}<p style="margin-top:10px;">Your role (${esc(roleLabel(S.user.role))}) doesn't have access to this screen.</p></div>`;
  }
  switch (S.route) {
    case 'dashboard': return pageDashboard();
    case 'inventory': return pageInventory();
    case 'issue': return pageIssue();
    case 'register': return pageRegister();
    case 'reports': return pageReports();
    case 'checklist': return pageChecklist();
    case 'master': return pageMaster();
    default: return pageDashboard();
  }
}

// ============================================================
// AUTH — PIN only, then role select (no personal name required)
// ============================================================
const ROLE_OPTIONS = [
  { role: 'admin', label: 'Admin (HSE Manager)', sub: 'Full access — master data, edit/delete, audit log' },
  { role: 'store_keeper', label: 'HSE', sub: 'Add stock, issue materials, view reports' },
  { role: 'viewer', label: 'Department Viewer', sub: 'Read-only — view issuance history' },
];
function renderAuth() {
  if (!S.pinAuthed) {
    const dots = Array.from({ length: 4 }, (_, i) => `<div class="dot ${S.pinEntered.length > i ? (S.pinError ? 'err' : 'filled') : ''}"></div>`).join('');
    return `
    <div class="pin-screen">
      <div class="pin-card">
        <img src="assets/icon-192.png" alt="Joseph Group"/>
        <h2>FA Materials Issuance Register</h2>
        <div class="sub">Enter PIN to continue</div>
        <div class="pin-dots">${dots}</div>
        <div class="pin-error">${S.pinError ? 'Incorrect PIN — try again' : ''}</div>
        <div class="pin-pad">
          ${[1,2,3,4,5,6,7,8,9].map(n => `<button onclick="pinPress('${n}')">${n}</button>`).join('')}
          <button class="wide" onclick="pinClear()">Clear</button>
          <button onclick="pinPress('0')">0</button>
          <button class="wide" onclick="pinBackspace()">⌫</button>
        </div>
      </div>
    </div>`;
  }
  // role select — no personal name required
  return `
  <div class="pin-screen">
    <div class="pin-card" style="max-width:420px;">
      <img src="assets/icon-192.png" alt="Joseph Group"/>
      <h2>Continue as…</h2>
      <div class="sub">Select your role to continue</div>
      <div class="user-select-list">
        ${ROLE_OPTIONS.map(r => `
          <button class="user-select-item" onclick="selectRole('${r.role}','${r.label.replace(/'/g,"\\'")}')">
            <span class="av">${esc(r.label[0])}</span>
            <span style="flex:1;">
              <div class="nm">${esc(r.label)}</div>
              <div class="rl">${esc(r.sub)}</div>
            </span>
          </button>`).join('')}
      </div>
      <button class="btn btn-ghost btn-block" style="margin-top:14px;" onclick="pinLogoutStage()">← Back to PIN</button>
    </div>
  </div>`;
}
function pinPress(n) { if (S.pinEntered.length >= 4) return; S.pinEntered += n; S.pinError = false;
  if (S.pinEntered.length === 4) checkPin(); render(); }
function pinClear() { S.pinEntered = ''; S.pinError = false; render(); }
function pinBackspace() { S.pinEntered = S.pinEntered.slice(0, -1); render(); }
async function checkPin() {
  if (S.pinEntered === APP_PIN) {
    S.pinAuthed = true; S.pinEntered = '';
    render();
    await loadAll(); render();
  } else {
    S.pinError = true; render();
    setTimeout(() => { S.pinEntered = ''; S.pinError = false; render(); }, 700);
  }
}
function pinLogoutStage() { S.pinAuthed = false; S.pinEntered = ''; render(); }
function selectRole(role, label) {
  S.user = { id: 'role-' + role, name: label, role };
  localStorage.setItem('fa_user', JSON.stringify(S.user));
  S.route = 'dashboard'; S.history = ['dashboard'];
  render();
}
function attachAuthEvents() {}

// ============================================================
// DASHBOARD
// ============================================================
function pageDashboard() {
  const mats = S.data.materials.filter(m => m.active !== false);
  const low = mats.filter(m => stockBalance(m.id) <= Number(m.reorder_level) && stockBalance(m.id) > 0);
  const out = mats.filter(m => stockBalance(m.id) <= 0);
  const expiring = mats.filter(m => { const e = nearestExpiry(m.id); return e && daysUntil(e) <= 60 && daysUntil(e) >= 0; });
  const expired = mats.filter(m => { const e = nearestExpiry(m.id); return e && daysUntil(e) < 0; });
  const thisMonth = todayISO().slice(0, 7);
  const issuancesThisMonth = S.data.issuances.filter(i => !i.voided && i.date && i.date.slice(0, 7) === thisMonth).length;

  return `
    <div class="page-title">
      <div><h1>Dashboard</h1><div class="sub">Live overview of first aid stock across the factory</div></div>
    </div>
    <div class="kpi-grid">
      <div class="kpi"><div class="lbl">Materials tracked</div><div class="val">${mats.length}</div></div>
      <div class="kpi accent-gold"><div class="lbl">Below reorder level</div><div class="val">${low.length}</div></div>
      <div class="kpi accent-red"><div class="lbl">Out of stock</div><div class="val">${out.length}</div></div>
      <div class="kpi accent-orange"><div class="lbl">Expiring ≤ 60 days</div><div class="val">${expiring.length}</div></div>
      <div class="kpi accent-teal"><div class="lbl">Issuances this month</div><div class="val">${issuancesThisMonth}</div></div>
    </div>

    ${(out.length + low.length + expired.length + expiring.length) > 0 ? `
    <div class="card" style="border-left:4px solid var(--jg-orange);">
      <h3>⚠ Alerts</h3>
      ${out.map(m => `<div style="padding:6px 0;font-size:13.5px;">🔴 <strong>${esc(m.name)}</strong> is out of stock</div>`).join('')}
      ${low.map(m => `<div style="padding:6px 0;font-size:13.5px;">🟡 <strong>${esc(m.name)}</strong> is low (${stockBalance(m.id)} ${esc(m.unit)} left, reorder at ${m.reorder_level})</div>`).join('')}
      ${expired.map(m => `<div style="padding:6px 0;font-size:13.5px;">⛔ <strong>${esc(m.name)}</strong> has expired stock</div>`).join('')}
      ${expiring.map(m => `<div style="padding:6px 0;font-size:13.5px;">⏳ <strong>${esc(m.name)}</strong> expires ${fmtDate(nearestExpiry(m.id))}</div>`).join('')}
    </div>` : `<div class="card" style="border-left:4px solid var(--jg-green);">✅ All stock levels healthy — no alerts.</div>`}

    <div class="card">
      <h3>Stock overview</h3>
      <div class="table-wrap"><table>
        <thead><tr><th>Material</th><th>Category</th><th>Balance</th><th>Reorder Level</th><th>Nearest Expiry</th><th>Status</th></tr></thead>
        <tbody>
          ${mats.length ? mats.map(m => {
            const bal = stockBalance(m.id); const exp = nearestExpiry(m.id);
            let status = `<span class="badge badge-ok">OK</span>`;
            if (bal <= 0) status = `<span class="badge badge-danger">Out of stock</span>`;
            else if (bal <= Number(m.reorder_level)) status = `<span class="badge badge-warn">Low</span>`;
            if (exp && daysUntil(exp) < 0) status += ` <span class="badge badge-danger">Expired</span>`;
            else if (exp && daysUntil(exp) <= 60) status += ` <span class="badge badge-warn">Expiring soon</span>`;
            return `<tr><td><strong>${esc(m.name)}</strong></td><td>${esc(m.category)}</td><td>${bal} ${esc(m.unit)}</td><td>${m.reorder_level}</td><td>${exp ? fmtDate(exp) : '—'}</td><td>${status}</td></tr>`;
          }).join('') : `<tr class="empty-row"><td colspan="6">No materials yet — add some in Master Data.</td></tr>`}
        </tbody>
      </table></div>
    </div>
  `;
}

// ============================================================
// INVENTORY (STOCK-IN)
// ============================================================
function pageInventory() {
  const mats = S.data.materials.filter(m => m.active !== false);
  const recent = S.data.stockTx.slice(0, 40);
  return `
    <div class="page-title">
      <div><h1>Inventory</h1><div class="sub">Stock-in records and current balances</div></div>
      ${canWrite() ? `<button class="btn btn-accent" onclick="openStockInModal()">${ICONS.plus} Add Stock</button>` : ''}
    </div>

    <div class="table-wrap" style="margin-bottom:20px;">
      <table>
        <thead><tr><th>Material</th><th>Balance</th><th>Unit</th><th>Reorder Level</th><th>Status</th></tr></thead>
        <tbody>
          ${mats.map(m => {
            const bal = stockBalance(m.id);
            let status = bal <= 0 ? `<span class="badge badge-danger">Out</span>` : bal <= Number(m.reorder_level) ? `<span class="badge badge-warn">Low</span>` : `<span class="badge badge-ok">OK</span>`;
            return `<tr><td><strong>${esc(m.name)}</strong></td><td>${bal}</td><td>${esc(m.unit)}</td><td>${m.reorder_level}</td><td>${status}</td></tr>`;
          }).join('') || `<tr class="empty-row"><td colspan="5">No materials configured.</td></tr>`}
        </tbody>
      </table>
    </div>

    <div class="card">
      <h3>Recent stock-in transactions</h3>
      <div class="table-wrap"><table>
        <thead><tr><th>Date</th><th>Material</th><th>Qty</th><th>Batch</th><th>Expiry</th><th>Supplier</th><th>Entered By</th>${isAdmin() ? '<th>Actions</th>' : ''}</tr></thead>
        <tbody>
          ${recent.length ? recent.map(t => {
            const mat = S.data.materials.find(m => m.id === t.material_id);
            return `<tr style="${t.voided ? 'opacity:.45;text-decoration:line-through;' : ''}">
              <td>${fmtDate(t.date_received)}</td><td>${esc(mat?.name || '—')}</td><td>${t.qty}</td>
              <td>${esc(t.batch_no || '—')}</td><td>${t.expiry_date ? fmtDate(t.expiry_date) : '—'}</td>
              <td>${esc(t.supplier || '—')}</td><td>${esc(t.entered_by)}</td>
              ${isAdmin() ? `<td style="display:flex;gap:6px;">
                <button class="iconbtn-sm" onclick="editStockTx('${t.id}')">${ICONS.edit}</button>
                <button class="iconbtn-sm danger" onclick="deleteStockTx('${t.id}')">${ICONS.trash}</button>
              </td>` : ''}
            </tr>`;
          }).join('') : `<tr class="empty-row"><td colspan="8">No stock-in records yet.</td></tr>`}
        </tbody>
      </table></div>
    </div>
  `;
}

function openStockInModal(existing) {
  if (!requireWrite('adding stock')) return;
  const mats = S.data.materials.filter(m => m.active !== false);
  const isEdit = !!existing;
  showModal(`${isEdit ? 'Edit' : 'Add'} Stock`, `
    <form id="stockin-form">
      <div class="field"><label>Material *</label>
        <select name="material_id" required>${mats.map(m => `<option value="${m.id}" ${existing?.material_id === m.id ? 'selected' : ''}>${esc(m.name)} (${esc(m.unit)})</option>`).join('')}</select>
      </div>
      <div class="row">
        <div class="field"><label>Quantity received *</label><input type="number" min="0.01" step="0.01" name="qty" required value="${existing?.qty ?? ''}"/></div>
        <div class="field"><label>Date received *</label><input type="date" name="date_received" required value="${existing?.date_received || todayISO()}"/></div>
      </div>
      <div class="row">
        <div class="field"><label>Batch / Lot No.</label><input type="text" name="batch_no" value="${esc(existing?.batch_no || '')}"/></div>
        <div class="field"><label>Expiry date</label><input type="date" name="expiry_date" value="${existing?.expiry_date || ''}"/></div>
      </div>
      <div class="field"><label>Supplier</label><input type="text" name="supplier" value="${esc(existing?.supplier || '')}"/></div>
    </form>
  `, [
    { label: 'Cancel', cls: 'btn-ghost', onClick: closeModal },
    { label: isEdit ? 'Save changes' : 'Add Stock', cls: 'btn-accent', onClick: () => submitStockIn(existing) },
  ]);
}
async function submitStockIn(existing) {
  if (!requireWrite('adding stock')) return;
  const f = document.getElementById('stockin-form');
  const fd = new FormData(f);
  const payload = {
    material_id: fd.get('material_id'), qty: Number(fd.get('qty')),
    batch_no: fd.get('batch_no') || null, expiry_date: fd.get('expiry_date') || null,
    supplier: fd.get('supplier') || null, date_received: fd.get('date_received'),
    entered_by: S.user.name, entered_by_id: null, updated_at: new Date().toISOString(),
  };
  if (!payload.material_id || !payload.qty || !payload.date_received) { toast('Please fill required fields', 'error'); return; }
  if (existing) {
    const { error } = await sb.from('fa_stock_transactions').update(payload).eq('id', existing.id);
    if (error) { toast('Error saving: ' + error.message, 'error'); return; }
    await logAudit('fa_stock_transactions', existing.id, 'edit', 'multiple', JSON.stringify(existing), JSON.stringify(payload));
    toast('Stock entry updated', 'success');
  } else {
    const { error } = await sb.from('fa_stock_transactions').insert(payload);
    if (error) { toast('Error saving: ' + error.message, 'error'); return; }
    toast('Stock added', 'success');
  }
  closeModal(); await loadAll(); render();
}
function editStockTx(id) { openStockInModal(S.data.stockTx.find(t => t.id === id)); }
async function deleteStockTx(id) {
  confirmDialog('Delete this stock-in record? This is audit-logged and cannot be undone from the app.', async () => {
    const rec = S.data.stockTx.find(t => t.id === id);
    const { error } = await sb.from('fa_stock_transactions').delete().eq('id', id);
    if (error) { toast('Delete failed: ' + error.message, 'error'); return; }
    await logAudit('fa_stock_transactions', id, 'delete', 'record', JSON.stringify(rec), null);
    toast('Stock entry deleted', 'success');
    await loadAll(); render();
  }, { title: 'Delete stock entry' });
}

// ============================================================
// ISSUE MATERIALS
// ============================================================
let issueLines = [{ material_id: '', qty: '' }];
function pageIssue() {
  const deps = S.data.departments.filter(d => d.active !== false);
  const locs = S.data.locations.filter(l => l.active !== false);
  const mats = S.data.materials.filter(m => m.active !== false);
  return `
    <div class="page-title"><div><h1>Issue Materials</h1><div class="sub">Record materials collected by a department or first aid box</div></div></div>
    <div class="card">
      <form id="issue-form">
        <div class="row">
          <div class="field"><label>Issued to Department *</label>
            <select name="department_id" required><option value="">Select…</option>${deps.map(d => `<option value="${d.id}">${esc(d.name)}</option>`).join('')}</select>
          </div>
          <div class="field"><label>First Aid Box / Location</label>
            <select name="location_id"><option value="">— None —</option>${locs.map(l => `<option value="${l.id}">${esc(l.name)}</option>`).join('')}</select>
          </div>
        </div>
        <div class="row">
          <div class="field"><label>Collected by (Name) *</label><input type="text" name="collected_by_name" required placeholder="Full name"/></div>
          <div class="field"><label>Employee ID / Badge No.</label><input type="text" name="collected_by_id"/></div>
          <div class="field"><label>Designation</label><input type="text" name="collected_by_designation"/></div>
        </div>
        <div class="field"><label>Date of issuance *</label><input type="date" name="date" value="${todayISO()}" required/></div>

        <label style="margin-top:6px;">Materials collected *</label>
        <div id="issue-lines">${renderIssueLines(mats)}</div>
        <button type="button" class="btn btn-outline btn-sm" onclick="addIssueLine()">${ICONS.plus} Add another item</button>

        <div class="field" style="margin-top:14px;"><label>Remarks</label><textarea name="remarks" rows="2"></textarea></div>
        <div class="checkbox-line" style="margin-bottom:14px;"><input type="checkbox" name="confirmed" id="confirmed-chk"/><label for="confirmed-chk" style="margin:0;">Collector confirmed receipt</label></div>

        <button type="button" class="btn btn-accent" onclick="submitIssuance()">${ICONS.issue} Issue Materials</button>
      </form>
    </div>
  `;
}
function renderIssueLines(mats) {
  return issueLines.map((line, idx) => {
    const bal = line.material_id ? stockBalance(line.material_id) : null;
    return `
    <div class="line-item">
      <div class="field"><label>Material</label>
        <select onchange="issueLineChange(${idx}, 'material_id', this.value)">
          <option value="">Select…</option>
          ${mats.map(m => `<option value="${m.id}" ${line.material_id === m.id ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}
        </select>
        ${bal !== null ? `<div class="stockhint">Available: ${bal}</div>` : ''}
      </div>
      <div class="field qtyf"><label>Qty</label><input type="number" min="0.01" step="0.01" value="${line.qty}" onchange="issueLineChange(${idx}, 'qty', this.value)"/></div>
      <button type="button" class="iconbtn-sm danger" onclick="removeIssueLine(${idx})">${ICONS.trash}</button>
    </div>`;
  }).join('');
}
function issueLineChange(idx, key, val) { issueLines[idx][key] = val; rerenderIssueLines(); }
function addIssueLine() { issueLines.push({ material_id: '', qty: '' }); rerenderIssueLines(); }
function removeIssueLine(idx) { if (issueLines.length > 1) issueLines.splice(idx, 1); rerenderIssueLines(); }
function rerenderIssueLines() {
  const el = document.getElementById('issue-lines');
  if (el) el.innerHTML = renderIssueLines(S.data.materials.filter(m => m.active !== false));
}
async function submitIssuance() {
  if (!requireWrite('issuing materials')) return;
  const f = document.getElementById('issue-form');
  const fd = new FormData(f);
  const validLines = issueLines.filter(l => l.material_id && Number(l.qty) > 0);
  if (!fd.get('department_id') || !fd.get('collected_by_name') || !validLines.length) {
    toast('Please complete department, collector name, and at least one material line', 'error'); return;
  }
  // Aggregate by material first — two lines of the same material must be
  // validated against stock TOGETHER, not independently (each line alone
  // could look fine while the combined total oversells the stock).
  const totalsByMaterial = {};
  for (const l of validLines) totalsByMaterial[l.material_id] = (totalsByMaterial[l.material_id] || 0) + Number(l.qty);
  for (const materialId in totalsByMaterial) {
    const bal = stockBalance(materialId);
    if (totalsByMaterial[materialId] > bal) {
      const mat = S.data.materials.find(m => m.id === materialId);
      toast(`Cannot issue ${totalsByMaterial[materialId]} ${mat?.unit || ''} of ${mat?.name || 'this material'} — only ${bal} in stock`, 'error');
      return;
    }
  }
  const issuancePayload = {
    department_id: fd.get('department_id'), location_id: fd.get('location_id') || null,
    collected_by_name: fd.get('collected_by_name'), collected_by_id: fd.get('collected_by_id') || null,
    collected_by_designation: fd.get('collected_by_designation') || null,
    issued_by: S.user.name, issued_by_id: null, date: fd.get('date'),
    remarks: fd.get('remarks') || null, confirmed: fd.get('confirmed') === 'on',
  };
  const { data: newIss, error } = await sb.from('fa_issuances').insert(issuancePayload).select().single();
  if (error) { toast('Error: ' + error.message, 'error'); return; }
  // Track a running local balance per material so "stock remaining after"
  // is correct even when this same submission has multiple lines for the
  // same material (stockBalance() alone won't see the in-progress inserts).
  const runningBalance = {};
  for (const l of validLines) {
    if (!(l.material_id in runningBalance)) runningBalance[l.material_id] = stockBalance(l.material_id);
    runningBalance[l.material_id] -= Number(l.qty);
    await sb.from('fa_issuance_items').insert({ issuance_id: newIss.id, material_id: l.material_id, qty_issued: Number(l.qty), stock_remaining_after: runningBalance[l.material_id] });
  }
  toast('Materials issued successfully', 'success');
  issueLines = [{ material_id: '', qty: '' }];
  await loadAll();
  viewVoucher(newIss.id);
}

// ============================================================
// ISSUANCE REGISTER
// ============================================================
let registerFilters = { dept: '', material: '', from: '', to: '', collector: '' };
function pageRegister() {
  const deps = S.data.departments;
  const mats = S.data.materials;
  let rows = S.data.issuances.map(iss => {
    const items = S.data.issuanceItems.filter(i => i.issuance_id === iss.id);
    return { iss, items };
  });
  rows = rows.filter(({ iss, items }) => {
    if (registerFilters.dept && iss.department_id !== registerFilters.dept) return false;
    if (registerFilters.material && !items.some(it => it.material_id === registerFilters.material)) return false;
    if (registerFilters.from && iss.date < registerFilters.from) return false;
    if (registerFilters.to && iss.date > registerFilters.to) return false;
    if (registerFilters.collector && !iss.collected_by_name.toLowerCase().includes(registerFilters.collector.toLowerCase())) return false;
    return true;
  });
  rows.sort((a, b) => (b.iss.date || '').localeCompare(a.iss.date || '') || (b.iss.created_at || '').localeCompare(a.iss.created_at || ''));

  return `
    <div class="page-title">
      <div><h1>Issuance Register</h1><div class="sub">One entry per person/department — click any row to see exactly what they collected</div></div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-outline btn-sm" onclick="exportRegisterPDF()">${ICONS.pdf} PDF</button>
        <button class="btn btn-outline btn-sm" onclick="shareRegisterPDF()">${ICONS.share} Share</button>
      </div>
    </div>
    <div class="filters card">
      <div class="field"><label>Department</label><select id="f-dept" onchange="setRegFilter('dept', this.value)"><option value="">All</option>${deps.map(d => `<option value="${d.id}" ${registerFilters.dept === d.id ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}</select></div>
      <div class="field"><label>Material</label><select id="f-mat" onchange="setRegFilter('material', this.value)"><option value="">All</option>${mats.map(m => `<option value="${m.id}" ${registerFilters.material === m.id ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select></div>
      <div class="field"><label>From</label><input type="date" value="${registerFilters.from}" onchange="setRegFilter('from', this.value)"/></div>
      <div class="field"><label>To</label><input type="date" value="${registerFilters.to}" onchange="setRegFilter('to', this.value)"/></div>
      <div class="field"><label>Collector name</label><input type="text" placeholder="Search…" value="${esc(registerFilters.collector)}" onkeyup="setRegFilter('collector', this.value)"/></div>
    </div>
    <div class="table-wrap"><table id="register-table">
      <thead><tr><th>Date</th><th>Collected By</th><th>Department</th><th>Location</th><th>Items Collected</th><th>Issued By</th>${isAdmin() ? '<th>Actions</th>' : ''}</tr></thead>
      <tbody>
        ${rows.length ? rows.map(({ iss, items }) => {
          const dep = deps.find(d => d.id === iss.department_id);
          const loc = S.data.locations.find(l => l.id === iss.location_id);
          const itemSummary = items.length
            ? (items.length <= 2
                ? items.map(it => mats.find(m => m.id === it.material_id)?.name || '—').join(', ')
                : `${items.length} items`)
            : '—';
          return `<tr style="cursor:pointer;${iss.voided ? 'opacity:.45;text-decoration:line-through;' : ''}" onclick="viewVoucher('${iss.id}')">
            <td>${fmtDate(iss.date)}</td>
            <td><strong>${esc(iss.collected_by_name)}</strong>${iss.collected_by_designation ? `<div class="stockhint">${esc(iss.collected_by_designation)}</div>` : ''}</td>
            <td>${esc(dep?.name || '—')}</td><td>${esc(loc?.name || '—')}</td>
            <td>${esc(itemSummary)}</td><td>${esc(iss.issued_by)}</td>
            ${isAdmin() ? `<td style="display:flex;gap:6px;" onclick="event.stopPropagation()">
              <button class="iconbtn-sm" onclick="editIssuance('${iss.id}')">${ICONS.edit}</button>
              <button class="iconbtn-sm danger" onclick="deleteIssuance('${iss.id}')">${ICONS.trash}</button>
            </td>` : ''}
          </tr>`;
        }).join('') : `<tr class="empty-row"><td colspan="7">No issuance records match your filters.</td></tr>`}
      </tbody>
    </table></div>
  `;
}
function setRegFilter(k, v) { registerFilters[k] = v; render(); }

async function editIssuance(id) {
  const iss = S.data.issuances.find(i => i.id === id);
  const deps = S.data.departments;
  showModal('Edit Issuance', `
    <form id="edit-iss-form">
      <div class="field"><label>Department</label><select name="department_id">${deps.map(d => `<option value="${d.id}" ${iss.department_id === d.id ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}</select></div>
      <div class="field"><label>Collected by</label><input type="text" name="collected_by_name" value="${esc(iss.collected_by_name)}"/></div>
      <div class="field"><label>Date</label><input type="date" name="date" value="${iss.date}"/></div>
      <div class="field"><label>Remarks</label><textarea name="remarks" rows="2">${esc(iss.remarks || '')}</textarea></div>
      <p class="helptext">Line items (materials/qty) can't be edited here — void and re-issue if quantities were wrong, to keep stock math correct.</p>
    </form>
  `, [
    { label: 'Cancel', cls: 'btn-ghost', onClick: closeModal },
    { label: 'Save changes', cls: 'btn-accent', onClick: async () => {
      const fd = new FormData(document.getElementById('edit-iss-form'));
      const payload = { department_id: fd.get('department_id'), collected_by_name: fd.get('collected_by_name'), date: fd.get('date'), remarks: fd.get('remarks') };
      const { error } = await sb.from('fa_issuances').update(payload).eq('id', id);
      if (error) { toast('Error: ' + error.message, 'error'); return; }
      await logAudit('fa_issuances', id, 'edit', 'multiple', JSON.stringify(iss), JSON.stringify(payload));
      toast('Issuance updated', 'success'); closeModal(); await loadAll(); render();
    } },
  ]);
}
async function deleteIssuance(id) {
  confirmDialog('Delete this issuance? Stock will be restored. This is audit-logged.', async () => {
    const rec = S.data.issuances.find(i => i.id === id);
    const { error } = await sb.from('fa_issuances').delete().eq('id', id);
    if (error) { toast('Delete failed: ' + error.message, 'error'); return; }
    await logAudit('fa_issuances', id, 'delete', 'record', JSON.stringify(rec), null);
    toast('Issuance deleted, stock restored', 'success');
    await loadAll(); render();
  }, { title: 'Delete issuance' });
}

// ---------------- Voucher ----------------
function viewVoucher(issuanceId) {
  const iss = S.data.issuances.find(i => i.id === issuanceId);
  const items = S.data.issuanceItems.filter(i => i.issuance_id === issuanceId);
  const dep = S.data.departments.find(d => d.id === iss.department_id);
  const loc = S.data.locations.find(l => l.id === iss.location_id);
  const body = `
    <div class="voucher" id="voucher-content">
      <div class="vhead">
        <img src="assets/jg-logo.jpg" alt="Joseph Group"/>
        <div style="text-align:right;">
          <div style="font-weight:800;font-size:14px;">Goods Issue Voucher</div>
          <div style="font-size:11.5px;color:#67728a;">FA Materials Issuance Register</div>
        </div>
      </div>
      <div class="row" style="margin-bottom:10px;">
        <div><strong>Date:</strong> ${fmtDate(iss.date)}</div>
        <div><strong>Department:</strong> ${esc(dep?.name || '—')}</div>
        <div><strong>Location:</strong> ${esc(loc?.name || '—')}</div>
      </div>
      <div class="row" style="margin-bottom:14px;">
        <div><strong>Collected by:</strong> ${esc(iss.collected_by_name)} ${iss.collected_by_id ? '(' + esc(iss.collected_by_id) + ')' : ''}</div>
        <div><strong>Issued by:</strong> ${esc(iss.issued_by)}</div>
      </div>
      <table><thead><tr><th>Material</th><th>Qty Issued</th><th>Stock Remaining After</th></tr></thead>
      <tbody>${items.map(it => { const mat = S.data.materials.find(m => m.id === it.material_id); return `<tr><td>${esc(mat?.name || '—')}</td><td>${it.qty_issued} ${esc(mat?.unit || '')}</td><td>${it.stock_remaining_after ?? '—'}</td></tr>`; }).join('')}</tbody></table>
      ${iss.remarks ? `<p style="margin-top:12px;"><strong>Remarks:</strong> ${esc(iss.remarks)}</p>` : ''}
      <p style="margin-top:10px;font-size:11.5px;color:#67728a;">${iss.confirmed ? '✓ Collector confirmed receipt' : 'Not yet confirmed by collector'}</p>
    </div>
  `;
  showModal('Issuance Voucher', body, [
    { label: 'Close', cls: 'btn-ghost', onClick: closeModal },
    { label: 'Download PDF', cls: 'btn-outline', onClick: () => downloadVoucherPDF(iss, items, dep, loc) },
    { label: 'Share', cls: 'btn-accent', onClick: () => shareVoucherPDF(iss, items, dep, loc) },
  ]);
}
function ensurePdfReady() {
  if (!window.jspdf || typeof window.jspdf.jsPDF !== 'function') {
    toast('PDF library failed to load — check your internet connection and refresh the page', 'error');
    return false;
  }
  try {
    if (typeof new window.jspdf.jsPDF().autoTable !== 'function') {
      toast('PDF table plugin failed to load — check your internet connection and refresh the page', 'error');
      return false;
    }
  } catch (e) {
    toast('PDF library error — refresh the page and try again', 'error');
    return false;
  }
  return true;
}
function voucherPDFDoc(iss, items, dep, loc) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(16); doc.setTextColor(30, 62, 115); doc.text('Joseph Group — Goods Issue Voucher', 14, 18);
  doc.setFontSize(10); doc.setTextColor(80);
  doc.text(`Date: ${fmtDate(iss.date)}    Department: ${dep?.name || '—'}    Location: ${loc?.name || '—'}`, 14, 27);
  doc.text(`Collected by: ${iss.collected_by_name} ${iss.collected_by_id ? '(' + iss.collected_by_id + ')' : ''}    Issued by: ${iss.issued_by}`, 14, 33);
  doc.autoTable({
    startY: 40,
    head: [['Material', 'Qty Issued', 'Stock Remaining After']],
    body: items.map(it => { const mat = S.data.materials.find(m => m.id === it.material_id); return [mat?.name || '—', `${it.qty_issued} ${mat?.unit || ''}`, it.stock_remaining_after ?? '—']; }),
    headStyles: { fillColor: [30, 62, 115] }, styles: { fontSize: 10 },
  });
  if (iss.remarks) doc.text(`Remarks: ${iss.remarks}`, 14, doc.lastAutoTable.finalY + 10);
  return doc;
}
function downloadVoucherPDF(iss, items, dep, loc) { if (!ensurePdfReady()) return; voucherPDFDoc(iss, items, dep, loc).save(`Voucher-${iss.collected_by_name}-${iss.date}.pdf`); }
async function shareVoucherPDF(iss, items, dep, loc) {
  if (!ensurePdfReady()) return;
  const doc = voucherPDFDoc(iss, items, dep, loc);
  const blob = doc.output('blob');
  await sharePDFBlob(blob, `Voucher-${iss.date}.pdf`, 'FA Materials Voucher');
}
async function sharePDFBlob(blob, filename, title) {
  const file = new File([blob], filename, { type: 'application/pdf' });
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return;
    } catch (e) {
      // AbortError = the person closed the share sheet themselves — do nothing,
      // don't force a download or show a misleading "not supported" message.
      if (e && e.name === 'AbortError') return;
      // Any other failure: fall through to download below.
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  toast('Direct sharing isn\'t available on this device/browser — PDF downloaded instead. You can attach it to WhatsApp manually.', '');
}

// ============================================================
// REPORTS
// ============================================================
let reportTab = 'lowstock';
function pageReports() {
  const tabs = [
    ['lowstock', 'Low Stock'], ['expiry', 'Expiry'], ['consumption', 'Monthly Consumption'],
    ['history', 'Transaction History'], ['reconciliation', 'Reconciliation'],
  ];
  return `
    <div class="page-title"><div><h1>Reports</h1><div class="sub">Audit-ready exports for HSE, Dubai Municipality, and client submissions</div></div></div>
    <div class="tabs">${tabs.map(([id, label]) => `<button class="${reportTab === id ? 'active' : ''}" onclick="setReportTab('${id}')">${label}</button>`).join('')}</div>
    <div id="report-body">${renderReportBody()}</div>
  `;
}
function setReportTab(t) { reportTab = t; render(); }
function renderReportBody() {
  const mats = S.data.materials;
  if (reportTab === 'lowstock') {
    const rows = mats.filter(m => stockBalance(m.id) <= Number(m.reorder_level));
    return reportTable(['Material', 'Balance', 'Reorder Level', 'Unit'], rows.map(m => [m.name, stockBalance(m.id), m.reorder_level, m.unit]), 'Low Stock Report');
  }
  if (reportTab === 'expiry') {
    const rows = mats.map(m => ({ m, exp: nearestExpiry(m.id) })).filter(r => r.exp && daysUntil(r.exp) <= 90);
    return reportTable(['Material', 'Nearest Expiry', 'Days Remaining'], rows.map(r => [r.m.name, fmtDate(r.exp), daysUntil(r.exp)]), 'Expiry Report (≤90 days)');
  }
  if (reportTab === 'consumption') {
    const map = {};
    S.data.issuanceItems.forEach(it => {
      const iss = S.data.issuances.find(i => i.id === it.issuance_id);
      if (!iss || iss.voided) return;
      const month = (iss.date || '').slice(0, 7);
      const dep = S.data.departments.find(d => d.id === iss.department_id);
      const mat = mats.find(m => m.id === it.material_id);
      const key = `${month}|${dep?.name}|${mat?.name}`;
      map[key] = (map[key] || 0) + Number(it.qty_issued);
    });
    const rows = Object.entries(map).map(([k, v]) => { const [month, dept, mat] = k.split('|'); return [month, dept, mat, v]; }).sort((a, b) => b[0].localeCompare(a[0]));
    return reportTable(['Month', 'Department', 'Material', 'Qty Issued'], rows, 'Monthly Consumption Report');
  }
  if (reportTab === 'history') {
    const rows = S.data.stockTx.map(t => { const m = mats.find(mm => mm.id === t.material_id); return [fmtDate(t.date_received), m?.name, '+' + t.qty, t.entered_by]; });
    const rows2 = S.data.issuanceItems.map(it => { const iss = S.data.issuances.find(i => i.id === it.issuance_id); const m = mats.find(mm => mm.id === it.material_id); return [fmtDate(iss?.date), m?.name, '-' + it.qty_issued, iss?.issued_by]; });
    const all = [...rows, ...rows2].sort((a, b) => (b[0] || '').localeCompare(a[0] || ''));
    return reportTable(['Date', 'Material', 'Qty (+in / -out)', 'By'], all, 'Full Transaction History');
  }
  if (reportTab === 'reconciliation') {
    const rows = mats.map(m => {
      const received = S.data.stockTx.filter(t => t.material_id === m.id && !t.voided).reduce((s, t) => s + Number(t.qty), 0);
      const issued = S.data.issuanceItems.filter(it => { const iss = S.data.issuances.find(i => i.id === it.issuance_id); return it.material_id === m.id && iss && !iss.voided; }).reduce((s, it) => s + Number(it.qty_issued), 0);
      return [m.name, 0, received, issued, received - issued];
    });
    return reportTable(['Material', 'Opening', 'Received', 'Issued', 'Closing'], rows, 'Stock Reconciliation Report');
  }
  return '';
}
function reportTable(headers, rows, title) {
  window._currentReport = { headers, rows, title };
  return `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <h3 style="margin:0;">${title}</h3>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-outline btn-sm" onclick="exportCurrentReportPDF()">${ICONS.pdf} PDF</button>
          <button class="btn btn-outline btn-sm" onclick="shareCurrentReportPDF()">${ICONS.share} Share</button>
        </div>
      </div>
      <div class="table-wrap"><table>
        <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${rows.length ? rows.map(r => `<tr>${r.map(c => `<td>${esc(c ?? '—')}</td>`).join('')}</tr>`).join('') : `<tr class="empty-row"><td colspan="${headers.length}">No data.</td></tr>`}</tbody>
      </table></div>
    </div>
  `;
}
function reportPDFDoc() {
  const { headers, rows, title } = window._currentReport;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(15); doc.setTextColor(30, 62, 115); doc.text(`Joseph Group — ${title}`, 14, 18);
  doc.setFontSize(9); doc.setTextColor(100); doc.text(`Generated ${fmtDateTime(new Date())} by ${S.user.name}`, 14, 24);
  doc.autoTable({ startY: 30, head: [headers], body: rows, headStyles: { fillColor: [30, 62, 115] }, styles: { fontSize: 9 } });
  return doc;
}
function exportCurrentReportPDF() { if (!ensurePdfReady()) return; reportPDFDoc().save(`${window._currentReport.title.replace(/\s+/g, '_')}.pdf`); }
async function shareCurrentReportPDF() { if (!ensurePdfReady()) return; const doc = reportPDFDoc(); await sharePDFBlob(doc.output('blob'), `${window._currentReport.title.replace(/\s+/g, '_')}.pdf`, window._currentReport.title); }
function registerPDFDoc() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('l');
  doc.setFontSize(15); doc.setTextColor(30, 62, 115); doc.text('Joseph Group — Issuance Register', 14, 16);
  const rows = [];
  S.data.issuances.forEach(iss => {
    S.data.issuanceItems.filter(i => i.issuance_id === iss.id).forEach(it => {
      const dep = S.data.departments.find(d => d.id === iss.department_id);
      const mat = S.data.materials.find(m => m.id === it.material_id);
      rows.push([fmtDate(iss.date), dep?.name || '—', iss.collected_by_name, mat?.name || '—', it.qty_issued, it.stock_remaining_after ?? '—', iss.issued_by]);
    });
  });
  doc.autoTable({ startY: 24, head: [['Date', 'Department', 'Collected By', 'Material', 'Qty', 'Stock After', 'Issued By']], body: rows, headStyles: { fillColor: [30, 62, 115] }, styles: { fontSize: 8 } });
  return doc;
}
function exportRegisterPDF() { if (!ensurePdfReady()) return; registerPDFDoc().save('Issuance_Register.pdf'); }
async function shareRegisterPDF() {
  if (!ensurePdfReady()) return;
  const doc = registerPDFDoc();
  await sharePDFBlob(doc.output('blob'), 'Issuance_Register.pdf', 'Issuance Register');
}

// ============================================================
// CHECKLIST (Phase 2 — lightweight)
// ============================================================
function pageChecklist() {
  const locs = S.data.locations.filter(l => l.active !== false);
  return `
    <div class="page-title"><div><h1>Monthly First Aid Box Checklist</h1><div class="sub">Phase 2 module — physical box check vs. live stock data</div></div></div>
    <div class="card">
      <p>Select a First Aid Box location to run this month's checklist. Each material's status is compared against the master list; anything marked "Not Available" can be flagged for immediate re-stock via the Issue Materials screen.</p>
      <div class="field" style="max-width:320px;"><label>First Aid Box Location</label>
        <select onchange="startChecklist(this.value)"><option value="">Select…</option>${locs.map(l => `<option value="${l.id}">${esc(l.name)}</option>`).join('')}</select>
      </div>
      <p class="helptext">Locations are managed in Master Data. Full checklist history/sign-off log can be layered in once Phase 1 is confirmed working well for you.</p>
    </div>
  `;
}
function startChecklist(locId) {
  if (!locId) return;
  const loc = S.data.locations.find(l => l.id === locId);
  const mats = S.data.materials.filter(m => m.active !== false);
  showModal(`Checklist — ${esc(loc.name)}`, `
    <div class="table-wrap"><table>
      <thead><tr><th>Material</th><th>Required</th><th>Available?</th></tr></thead>
      <tbody>${mats.map(m => `<tr><td>${esc(m.name)}</td><td>${m.reorder_level}</td><td>
        <select id="chk-${m.id}"><option value="yes">Available</option><option value="no">Not Available</option></select>
      </td></tr>`).join('')}</tbody>
    </table></div>
    <div class="field" style="margin-top:14px;"><label>Checked by</label><input type="text" id="chk-by" value="${esc(S.user.name)}"/></div>
  `, [
    { label: 'Close', cls: 'btn-ghost', onClick: closeModal },
    { label: 'Save checklist', cls: 'btn-accent', onClick: async () => {
      const { data: cl, error } = await sb.from('fa_checklists').insert({ location_id: locId, month: todayISO().slice(0, 7), checked_by: document.getElementById('chk-by').value }).select().single();
      if (error) { toast('Error: ' + error.message, 'error'); return; }
      for (const m of mats) {
        const val = document.getElementById(`chk-${m.id}`).value;
        await sb.from('fa_checklist_items').insert({ checklist_id: cl.id, material_id: m.id, required_qty: m.reorder_level, available: val === 'yes' });
      }
      toast('Checklist saved', 'success'); closeModal();
    } },
  ], 'modal-lg');
}

// ============================================================
// MASTER DATA (admin only)
// ============================================================
let masterTab = 'materials';
function pageMaster() {
  const tabs = [['materials', 'Materials'], ['departments', 'Departments'], ['locations', 'FA Box Locations'], ['users', 'Users'], ['audit', 'Audit Log']];
  return `
    <div class="page-title"><div><h1>Master Data</h1><div class="sub">Admin-only — catalog, departments, locations, users, audit trail</div></div></div>
    <div class="tabs">${tabs.map(([id, label]) => `<button class="${masterTab === id ? 'active' : ''}" onclick="setMasterTab('${id}')">${label}</button>`).join('')}</div>
    ${renderMasterBody()}
  `;
}
function setMasterTab(t) { masterTab = t; render(); }
function renderMasterBody() {
  if (masterTab === 'materials') return masterMaterials();
  if (masterTab === 'departments') return masterSimpleList('departments', 'fa_departments', 'Department');
  if (masterTab === 'locations') return masterLocations();
  if (masterTab === 'users') return masterUsers();
  if (masterTab === 'audit') return masterAudit();
  return '';
}

function masterMaterials() {
  const rows = S.data.materials;
  return `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <h3 style="margin:0;">Materials Catalog</h3>
        <button class="btn btn-accent btn-sm" onclick="openMaterialModal()">${ICONS.plus} Add material</button>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>Name</th><th>Unit</th><th>Category</th><th>Reorder Level</th><th>Expiry Tracked</th><th>Active</th><th>Actions</th></tr></thead>
        <tbody>${rows.map(m => `<tr>
          <td><strong>${esc(m.name)}</strong></td><td>${esc(m.unit)}</td><td>${esc(m.category)}</td><td>${m.reorder_level}</td>
          <td>${m.expiry_tracked ? '✓' : '—'}</td><td>${m.active !== false ? '✓' : '✕'}</td>
          <td style="display:flex;gap:6px;">
            <button class="iconbtn-sm" onclick="openMaterialModal('${m.id}')">${ICONS.edit}</button>
            <button class="iconbtn-sm danger" onclick="deleteRow('fa_materials','${m.id}','material')">${ICONS.trash}</button>
          </td></tr>`).join('') || `<tr class="empty-row"><td colspan="7">No materials yet.</td></tr>`}
        </tbody>
      </table></div>
    </div>
  `;
}
function openMaterialModal(id) {
  const existing = id ? S.data.materials.find(m => m.id === id) : null;
  showModal(existing ? 'Edit Material' : 'Add Material', `
    <form id="mat-form">
      <div class="field"><label>Name *</label><input type="text" name="name" required value="${esc(existing?.name || '')}"/></div>
      <div class="row">
        <div class="field"><label>Unit *</label><select name="unit">${['pcs','bottle','pairs','box','roll'].map(u => `<option ${existing?.unit === u ? 'selected' : ''}>${u}</option>`).join('')}</select></div>
        <div class="field"><label>Category *</label><select name="category">${['Dressing','Medication','PPE','Instrument','Equipment'].map(c => `<option ${existing?.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
      </div>
      <div class="field"><label>Reorder Level *</label><input type="number" min="0" name="reorder_level" required value="${existing?.reorder_level ?? 3}"/></div>
      <div class="checkbox-line"><input type="checkbox" name="expiry_tracked" id="et" ${existing?.expiry_tracked !== false ? 'checked' : ''}/><label for="et" style="margin:0;">Requires expiry tracking</label></div>
      <div class="checkbox-line" style="margin-top:8px;"><input type="checkbox" name="active" id="ac" ${existing?.active !== false ? 'checked' : ''}/><label for="ac" style="margin:0;">Active</label></div>
    </form>
  `, [
    { label: 'Cancel', cls: 'btn-ghost', onClick: closeModal },
    { label: 'Save', cls: 'btn-accent', onClick: async () => {
      const fd = new FormData(document.getElementById('mat-form'));
      const payload = { name: fd.get('name'), unit: fd.get('unit'), category: fd.get('category'), reorder_level: Number(fd.get('reorder_level')), expiry_tracked: fd.get('expiry_tracked') === 'on', active: fd.get('active') === 'on' };
      if (existing) {
        const { error } = await sb.from('fa_materials').update(payload).eq('id', existing.id);
        if (error) return toast(error.message, 'error');
        await logAudit('fa_materials', existing.id, 'edit', 'multiple', JSON.stringify(existing), JSON.stringify(payload));
      } else {
        const { error } = await sb.from('fa_materials').insert(payload);
        if (error) return toast(error.message, 'error');
      }
      toast('Material saved', 'success'); closeModal(); await loadAll(); render();
    } },
  ]);
}

function masterSimpleList(stateKey, table, label) {
  const rows = S.data[stateKey];
  return `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <h3 style="margin:0;">${label}s</h3>
        <button class="btn btn-accent btn-sm" onclick="openSimpleModal('${stateKey}','${table}','${label}')">${ICONS.plus} Add ${label}</button>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>Name</th><th>Active</th><th>Actions</th></tr></thead>
        <tbody>${rows.map(r => `<tr><td><strong>${esc(r.name)}</strong></td><td>${r.active !== false ? '✓' : '✕'}</td>
          <td style="display:flex;gap:6px;">
            <button class="iconbtn-sm" onclick="openSimpleModal('${stateKey}','${table}','${label}','${r.id}')">${ICONS.edit}</button>
            <button class="iconbtn-sm danger" onclick="deleteRow('${table}','${r.id}','${label.toLowerCase()}')">${ICONS.trash}</button>
          </td></tr>`).join('') || `<tr class="empty-row"><td colspan="3">No ${label.toLowerCase()}s yet.</td></tr>`}
        </tbody>
      </table></div>
    </div>
  `;
}
function openSimpleModal(stateKey, table, label, id) {
  const existing = id ? S.data[stateKey].find(r => r.id === id) : null;
  showModal(existing ? `Edit ${label}` : `Add ${label}`, `
    <form id="simple-form">
      <div class="field"><label>Name *</label><input type="text" name="name" required value="${esc(existing?.name || '')}"/></div>
      <div class="checkbox-line"><input type="checkbox" name="active" id="ac2" ${existing?.active !== false ? 'checked' : ''}/><label for="ac2" style="margin:0;">Active</label></div>
    </form>
  `, [
    { label: 'Cancel', cls: 'btn-ghost', onClick: closeModal },
    { label: 'Save', cls: 'btn-accent', onClick: async () => {
      const fd = new FormData(document.getElementById('simple-form'));
      const payload = { name: fd.get('name'), active: fd.get('active') === 'on' };
      if (existing) { const { error } = await sb.from(table).update(payload).eq('id', existing.id); if (error) return toast(error.message, 'error'); await logAudit(table, existing.id, 'edit', 'multiple', JSON.stringify(existing), JSON.stringify(payload)); }
      else { const { error } = await sb.from(table).insert(payload); if (error) return toast(error.message, 'error'); }
      toast('Saved', 'success'); closeModal(); await loadAll(); render();
    } },
  ]);
}

function masterLocations() {
  const rows = S.data.locations;
  return `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <h3 style="margin:0;">First Aid Box Locations</h3>
        <button class="btn btn-accent btn-sm" onclick="openLocationModal()">${ICONS.plus} Add location</button>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>Name</th><th>Department</th><th>First Aider</th><th>Active</th><th>Actions</th></tr></thead>
        <tbody>${rows.map(l => { const dep = S.data.departments.find(d => d.id === l.department_id); return `<tr>
          <td><strong>${esc(l.name)}</strong></td><td>${esc(dep?.name || '—')}</td><td>${esc(l.responsible_first_aider || '—')}</td><td>${l.active !== false ? '✓' : '✕'}</td>
          <td style="display:flex;gap:6px;">
            <button class="iconbtn-sm" onclick="openLocationModal('${l.id}')">${ICONS.edit}</button>
            <button class="iconbtn-sm danger" onclick="deleteRow('fa_locations','${l.id}','location')">${ICONS.trash}</button>
          </td></tr>`; }).join('') || `<tr class="empty-row"><td colspan="5">No locations yet.</td></tr>`}
        </tbody>
      </table></div>
    </div>
  `;
}
function openLocationModal(id) {
  const existing = id ? S.data.locations.find(l => l.id === id) : null;
  const deps = S.data.departments;
  showModal(existing ? 'Edit Location' : 'Add Location', `
    <form id="loc-form">
      <div class="field"><label>Name *</label><input type="text" name="name" required value="${esc(existing?.name || '')}"/></div>
      <div class="field"><label>Department</label><select name="department_id"><option value="">—</option>${deps.map(d => `<option value="${d.id}" ${existing?.department_id === d.id ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}</select></div>
      <div class="field"><label>Responsible First Aider</label><input type="text" name="responsible_first_aider" value="${esc(existing?.responsible_first_aider || '')}"/></div>
      <div class="checkbox-line"><input type="checkbox" name="active" id="ac3" ${existing?.active !== false ? 'checked' : ''}/><label for="ac3" style="margin:0;">Active</label></div>
    </form>
  `, [
    { label: 'Cancel', cls: 'btn-ghost', onClick: closeModal },
    { label: 'Save', cls: 'btn-accent', onClick: async () => {
      const fd = new FormData(document.getElementById('loc-form'));
      const payload = { name: fd.get('name'), department_id: fd.get('department_id') || null, responsible_first_aider: fd.get('responsible_first_aider') || null, active: fd.get('active') === 'on' };
      if (existing) { const { error } = await sb.from('fa_locations').update(payload).eq('id', existing.id); if (error) return toast(error.message, 'error'); await logAudit('fa_locations', existing.id, 'edit', 'multiple', JSON.stringify(existing), JSON.stringify(payload)); }
      else { const { error } = await sb.from('fa_locations').insert(payload); if (error) return toast(error.message, 'error'); }
      toast('Saved', 'success'); closeModal(); await loadAll(); render();
    } },
  ]);
}

function masterUsers() {
  const rows = S.data.users;
  return `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <h3 style="margin:0;">Users</h3>
        <button class="btn btn-accent btn-sm" onclick="openUserModal()">${ICONS.plus} Add user</button>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>Name</th><th>Role</th><th>Department</th><th>Active</th><th>Actions</th></tr></thead>
        <tbody>${rows.map(u => { const dep = S.data.departments.find(d => d.id === u.department_id); return `<tr>
          <td><strong>${esc(u.name)}</strong></td><td>${esc(u.role.replace('_',' '))}</td><td>${esc(dep?.name || '—')}</td><td>${u.active !== false ? '✓' : '✕'}</td>
          <td style="display:flex;gap:6px;">
            <button class="iconbtn-sm" onclick="openUserModal('${u.id}')">${ICONS.edit}</button>
            <button class="iconbtn-sm danger" onclick="deleteRow('fa_users','${u.id}','user')">${ICONS.trash}</button>
          </td></tr>`; }).join('') || `<tr class="empty-row"><td colspan="5">No users yet.</td></tr>`}
        </tbody>
      </table></div>
    </div>
  `;
}
function openUserModal(id) {
  const existing = id ? S.data.users.find(u => u.id === id) : null;
  const deps = S.data.departments;
  showModal(existing ? 'Edit User' : 'Add User', `
    <form id="user-form">
      <div class="field"><label>Name *</label><input type="text" name="name" required value="${esc(existing?.name || '')}"/></div>
      <div class="field"><label>Email</label><input type="email" name="email" value="${esc(existing?.email || '')}"/></div>
      <div class="row">
        <div class="field"><label>Role *</label><select name="role">${['admin','store_keeper','viewer'].map(r => `<option value="${r}" ${existing?.role === r ? 'selected' : ''}>${r.replace('_',' ')}</option>`).join('')}</select></div>
        <div class="field"><label>Department</label><select name="department_id"><option value="">—</option>${deps.map(d => `<option value="${d.id}" ${existing?.department_id === d.id ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}</select></div>
      </div>
      <div class="checkbox-line"><input type="checkbox" name="active" id="ac4" ${existing?.active !== false ? 'checked' : ''}/><label for="ac4" style="margin:0;">Active</label></div>
    </form>
  `, [
    { label: 'Cancel', cls: 'btn-ghost', onClick: closeModal },
    { label: 'Save', cls: 'btn-accent', onClick: async () => {
      const fd = new FormData(document.getElementById('user-form'));
      const payload = { name: fd.get('name'), email: fd.get('email') || null, role: fd.get('role'), department_id: fd.get('department_id') || null, active: fd.get('active') === 'on' };
      if (existing) { const { error } = await sb.from('fa_users').update(payload).eq('id', existing.id); if (error) return toast(error.message, 'error'); await logAudit('fa_users', existing.id, 'edit', 'multiple', JSON.stringify(existing), JSON.stringify(payload)); }
      else { const { error } = await sb.from('fa_users').insert(payload); if (error) return toast(error.message, 'error'); }
      toast('Saved', 'success'); closeModal(); await loadAll(); render();
    } },
  ]);
}

function masterAudit() {
  const rows = S.data.auditLog;
  return `
    <div class="card">
      <h3>Audit Log</h3>
      <p class="helptext">Every edit or delete made by an Admin is captured here — who changed what, and when.</p>
      <div class="table-wrap"><table>
        <thead><tr><th>When</th><th>Table</th><th>Action</th><th>Field</th><th>Changed By</th></tr></thead>
        <tbody>${rows.length ? rows.map(a => `<tr>
          <td>${fmtDateTime(a.changed_at)}</td><td>${esc(a.table_name)}</td>
          <td><span class="badge ${a.action === 'delete' ? 'badge-danger' : 'badge-warn'}">${esc(a.action)}</span></td>
          <td>${esc(a.field_changed || '—')}</td><td>${esc(a.changed_by)}</td>
        </tr>`).join('') : `<tr class="empty-row"><td colspan="5">No audit entries yet.</td></tr>`}
        </tbody>
      </table></div>
    </div>
  `;
}

async function deleteRow(table, id, label) {
  confirmDialog(`Delete this ${label}? This cannot be undone from the app (audit-logged).`, async () => {
    const stateKey = { fa_departments: 'departments', fa_locations: 'locations', fa_users: 'users', fa_materials: 'materials' }[table];
    const rec = S.data[stateKey]?.find(r => r.id === id);
    const { error } = await sb.from(table).delete().eq('id', id);
    if (error) { toast('Delete failed (it may be referenced elsewhere): ' + error.message, 'error'); return; }
    await logAudit(table, id, 'delete', 'record', JSON.stringify(rec), null);
    toast(`${label} deleted`, 'success');
    await loadAll(); render();
  }, { title: 'Delete record' });
}

// ============================================================
// MODAL SYSTEM
// ============================================================
function showModal(title, bodyHtml, buttons, extraCls = '') {
  closeModal();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'active-modal';
  overlay.innerHTML = `
    <div class="modal ${extraCls}">
      <div class="modal-head"><h3>${title}</h3><button onclick="closeModal()">✕</button></div>
      <div class="modal-body">${bodyHtml}</div>
      <div class="modal-foot">${buttons.map((b, i) => `<button class="btn ${b.cls}" id="modal-btn-${i}">${b.label}</button>`).join('')}</div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  buttons.forEach((b, i) => document.getElementById(`modal-btn-${i}`).addEventListener('click', b.onClick));
}
function closeModal() { const m = document.getElementById('active-modal'); if (m) m.remove(); }
function confirmDialog(message, onConfirm, opts = {}) {
  showModal(opts.title || 'Please confirm', `<p style="margin:0;">${esc(message)}</p>`, [
    { label: opts.cancelLabel || 'Cancel', cls: 'btn-ghost', onClick: closeModal },
    { label: opts.okLabel || 'Confirm', cls: opts.danger === false ? 'btn-accent' : 'btn-danger', onClick: () => { closeModal(); onConfirm(); } },
  ]);
}

function attachPageEvents() {}

// ============================================================
// INIT
// ============================================================
async function init() {
  try {
    if (S.user) { await loadAll(); }
    render();
  } catch (e) {
    console.error(e);
    fatalScreen('Something went wrong starting the app', e.message || String(e));
  }
}
init();
