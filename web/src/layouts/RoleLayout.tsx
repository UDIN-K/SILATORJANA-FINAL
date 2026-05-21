import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Bell, Menu, User, Home, FileText, Settings, Database, Activity, Users, BarChart3, DollarSign, ClipboardList, X, AlertTriangle, Archive, Building2 } from 'lucide-react';
import { getUserName, getUserRole } from '@/lib/helpers';
import { useState } from 'react';

const ROLE_MENUS: Record<string, { icon: any; label: string; path: string }[]> = {
  admin: [
    { icon: Home, label: 'Dashboard', path: '' },
    { icon: Users, label: 'Management Users', path: '/users' },
    { icon: Database, label: 'Data & Configuration', path: '/master' },
    { icon: Activity, label: 'Monitoring', path: '/monitoring' },
  ],
  pengusul: [
    { icon: Home, label: 'Dashboard', path: '' },
    { icon: FileText, label: 'Usulan Saya', path: '/usulan' },
    { icon: AlertTriangle, label: 'Perlu Revisi', path: '/needs-work' },
    { icon: Archive, label: 'Riwayat', path: '/history' },
    { icon: Activity, label: 'Monitoring', path: '/monitoring' },
  ],
  verifikator: [
    { icon: Home, label: 'Dashboard', path: '' },
    { icon: ClipboardList, label: 'Semua Proposal', path: '/proposals' },
    { icon: Activity, label: 'Monitoring', path: '/monitoring' },
  ],
  ppk: [
    { icon: Home, label: 'Dashboard', path: '' },
    { icon: ClipboardList, label: 'Semua Proposal', path: '/proposals' },
    { icon: Activity, label: 'Monitoring', path: '/monitoring' },
  ],
  wadir2: [
    { icon: Home, label: 'Dashboard', path: '' },
    { icon: ClipboardList, label: 'Semua Proposal', path: '/proposals' },
    { icon: Activity, label: 'Monitoring', path: '/monitoring' },
  ],
  bendahara: [
    { icon: Home, label: 'Dashboard', path: '' },
    { icon: DollarSign, label: 'Pencairan & LPJ', path: '/proposals' },
    { icon: Activity, label: 'Monitoring', path: '/monitoring' },
  ],
  rektorat: [
    { icon: Home, label: 'Dashboard', path: '' },
    { icon: BarChart3, label: 'Laporan', path: '/laporan' },
    { icon: Building2, label: 'Rekap Jurusan', path: '/rekap-jurusan' },
    { icon: Activity, label: 'Monitoring', path: '/monitoring' },
  ],
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Super Admin',
  pengusul: 'Pengusul',
  verifikator: 'Verifikator',
  ppk: 'PPK',
  wadir2: 'Wadir II',
  bendahara: 'Bendahara',
  rektorat: 'Rektorat',
};

export function RoleLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = location.pathname.split('/')[2] || 'user';
  const userName = getUserName();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  const menuItems = ROLE_MENUS[role] || ROLE_MENUS.pengusul;
  const basePath = `/dashboard/${role}`;

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex flex-col items-center pt-6 pb-8 shrink-0">
        <div className="size-28 rounded-full flex items-center justify-center mb-5" style={{ background: '#e6dec2' }}>
          <div className="text-3xl font-black" style={{ color: '#1A4D2E' }}>Si</div>
        </div>
        <div className="text-white font-bold text-sm tracking-wide opacity-80">{ROLE_LABELS[role] || role}</div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto px-4 space-y-2">
        {menuItems.map((item, index) => {
          const fullPath = basePath + item.path;
          const isActive = item.path === '' ? location.pathname === basePath : location.pathname.startsWith(fullPath);
          return (
            <button key={index}
              onClick={() => { navigate(fullPath); setMobileOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all relative group"
              style={{
                color: isActive ? '#fff' : 'rgba(255,255,255,0.92)',
                background: isActive ? 'linear-gradient(90deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))' : 'transparent',
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {isActive && <div className="absolute left-0 top-2 bottom-2 w-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.35)' }} />}
              <item.icon className="size-5" style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.7)' }} />
              {item.label}
              {!isActive && <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(255,255,255,0.08)' }} />}
            </button>
          );
        })}
      </div>

      {/* Divider + Logout */}
      <div className="px-4 pb-6 pt-4 shrink-0">
        <hr className="border-0 mb-4" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }} />
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/80 hover:text-white transition-colors group relative">
          <LogOut className="size-5" />
          Logout
          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(255,255,255,0.08)' }} />
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen w-full" style={{ background: 'linear-gradient(135deg, #c8e6c9 0%, #e8f5e9 15%, #a5d6a7 30%, #e8f5e9 50%, #81c784 70%, #a5d6a7 100%)', backgroundAttachment: 'fixed' }}>
      {/* Desktop Sidebar */}
      <aside className="w-[260px] hidden md:flex flex-col fixed top-0 left-0 h-screen z-50 overflow-y-auto overflow-x-hidden" style={{ background: 'linear-gradient(180deg, #0f5137 0%, #0b3f2e 100%)', borderTopRightRadius: 25, borderBottomRightRadius: 25, boxShadow: '8px 0 24px rgba(21,62,48,0.25)' }}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[260px] flex flex-col" style={{ background: 'linear-gradient(180deg, #0f5137 0%, #0b3f2e 100%)', borderTopRightRadius: 25, borderBottomRightRadius: 25, boxShadow: '8px 0 24px rgba(21,62,48,0.25)' }}>
            <button className="absolute top-4 right-4 text-white/70 hover:text-white" onClick={() => setMobileOpen(false)}>
              <X className="size-6" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:ml-[260px] min-h-screen">
        {/* Top Navbar */}
        <header className="h-16 flex items-center justify-between px-5 sm:px-8 sticky top-0 z-40" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 rounded-lg hover:bg-white/50" onClick={() => setMobileOpen(true)}>
              <Menu className="size-5" style={{ color: '#1A4D2E' }} />
            </button>
            <h1 className="text-lg font-bold hidden sm:block" style={{ color: '#1A4D2E' }}>
              Panel {ROLE_LABELS[role] || role}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-white/50 transition-colors">
              <Bell className="size-5" style={{ color: '#2D6A4F' }} />
              <span className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            
            <div className="relative">
              <button className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/50 transition-colors" onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}>
                <div className="size-9 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1A4D2E, #36C06C)' }}>
                  <User className="size-4 text-white" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold" style={{ color: '#1A4D2E' }}>{userName}</p>
                  <p className="text-xs capitalize" style={{ color: '#666' }}>{ROLE_LABELS[role] || role}</p>
                </div>
              </button>

              {profileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-white z-50 flex flex-col py-1 animate-in fade-in slide-in-from-top-2" style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.12)', border: '1px solid rgba(0,0,0,0.06)' }}>
                    <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                      <p className="text-sm font-bold" style={{ color: '#1A4D2E' }}>Akun Saya</p>
                    </div>
                    <div className="p-1">
                      <button className="w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors" style={{ color: '#333' }} onClick={() => { setProfileDropdownOpen(false); navigate(`/dashboard/${role}/profile`); }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(54,192,108,0.08)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        Profil
                      </button>
                      <button className="w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors" style={{ color: '#333' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(54,192,108,0.08)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        Pengaturan
                      </button>
                    </div>
                    <div className="p-1 border-t" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                      <button className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors" onClick={() => { setProfileDropdownOpen(false); handleLogout(); }}>
                        <LogOut className="size-4" /> Keluar
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-5 sm:p-7 lg:p-9 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
