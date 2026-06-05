import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Bell, Menu, User, Home, FileText, Settings, Database, Activity, Users, BarChart3, DollarSign, ClipboardList, X, AlertTriangle, Archive, Building2, ChevronLeft, ChevronRight, HelpCircle, CheckCircle } from 'lucide-react';
import { getUserName, getUserRole } from '@/lib/helpers';
import { NotificationDropdown } from '@/components/NotificationDropdown';
import { CalendarWidget } from '@/components/CalendarWidget';
import { useState, useEffect } from 'react';
import { Joyride, Step, EventData } from 'react-joyride';
import { JanaAssistant } from '@/components/JanaAssistant';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
    { icon: Settings, label: 'Panduan', path: '/panduan' },
    { icon: FileText, label: 'Template', path: '/template' },
  ],
  verifikator: [
    { icon: Home, label: 'Dashboard', path: '' },
    { icon: ClipboardList, label: 'Semua Proposal', path: '/proposals' },
    { icon: Archive, label: 'Arsip', path: '/archive' },
    { icon: Activity, label: 'Monitoring', path: '/monitoring' },
  ],
  ppk: [
    { icon: Home, label: 'Dashboard', path: '' },
    { icon: ClipboardList, label: 'Semua Proposal', path: '/proposals' },
    { icon: Archive, label: 'Arsip', path: '/archive' },
    { icon: Activity, label: 'Monitoring', path: '/monitoring' },
  ],
  wadir2: [
    { icon: Home, label: 'Dashboard', path: '' },
    { icon: ClipboardList, label: 'Semua Proposal', path: '/proposals' },
    { icon: Archive, label: 'Arsip', path: '/archive' },
    { icon: Activity, label: 'Monitoring', path: '/monitoring' },
  ],
  bendahara: [
    { icon: Home, label: 'Dashboard', path: '' },
    { icon: DollarSign, label: 'Pencairan & LPJ', path: '/proposals' },
    { icon: CheckCircle, label: 'Laporan LPJ', path: '/laporan-lpj' },
    { icon: Activity, label: 'Monitoring', path: '/monitoring' },
  ],
  rektorat: [
    { icon: Home, label: 'Dashboard', path: '' },
    { icon: BarChart3, label: 'Laporan', path: '/laporan' },
    { icon: Building2, label: 'Rekap Jurusan', path: '/rekap-jurusan' },
    { icon: Activity, label: 'Monitoring', path: '/monitoring' },
  ],
};

import { AppLogo } from '@/components/AppLogo';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Super Admin',
  pengusul: 'Pengusul',
  verifikator: 'Verifikator',
  ppk: 'PPK',
  wadir1: 'Wadir I',
  wadir2: 'Wadir II',
  wadir3: 'Wadir III',
  wadir4: 'Wadir IV',
  bendahara: 'Bendahara',
  rektorat: 'Rektorat',
};

import { Hand } from 'lucide-react';
import React from 'react';

const CustomBeacon = React.forwardRef<HTMLDivElement, any>((props, ref) => {
  return (
    <div ref={ref} {...props} className="relative flex flex-col items-center justify-center cursor-pointer">
      <div className="absolute -top-10 animate-bounce text-emerald-600">
        <Hand className="size-8 rotate-180 drop-shadow-md text-emerald-600 fill-emerald-200" />
      </div>
      <span className="relative flex h-4 w-4 mt-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
      </span>
    </div>
  );
});

export function RoleLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const urlRole = location.pathname.split('/')[2];
  const actualRole = getUserRole() || '';
  
  // Normalize wadir roles (wadir1, wadir2, wadir3, wadir4) to wadir2
  const normalizedActualRole = actualRole.startsWith('wadir') ? 'wadir2' : actualRole;
  const normalizedUrlRole = (urlRole || '').startsWith('wadir') ? 'wadir2' : urlRole;
  
  const role = normalizedActualRole || normalizedUrlRole || 'user';
  const userName = getUserName();
  
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [preferencesModalOpen, setPreferencesModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    // Check initial dark mode state
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

  // FRONTEND ROLE GUARD: Cegah ganti URL manual
  useEffect(() => {
    if (location.pathname.includes('/print/')) {
      return; // Bypass role guard for printable views
    }
    if (normalizedActualRole && normalizedUrlRole && normalizedUrlRole !== normalizedActualRole) {
      // Jika mencoba akses dashboard role lain, kembalikan ke dashboard aslinya
      navigate(`/dashboard/${normalizedActualRole}`, { replace: true });
    }
  }, [normalizedActualRole, normalizedUrlRole, navigate, location.pathname]);

  const toggleDarkMode = (e: React.MouseEvent) => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);

    if (!document.startViewTransition) {
      document.documentElement.classList.toggle('dark', nextDark);
      return;
    }

    const x = e.clientX;
    const y = e.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = document.startViewTransition(() => {
      document.documentElement.classList.toggle('dark', nextDark);
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];

      try {
        document.documentElement.animate(
          {
            clipPath: nextDark ? clipPath : [...clipPath].reverse(),
          },
          {
            duration: 500,
            easing: 'ease-out',
            pseudoElement: nextDark ? '::view-transition-new(root)' : '::view-transition-old(root)',
          }
        );
      } catch (err) {
        // Fallback or ignore if animate pseudo-element throws
      }
    });
  };
  const [pageTourSteps, setPageTourSteps] = useState<Step[]>([]);
  const [tourFinished, setTourFinished] = useState(false);

  const [tourKey, setTourKey] = useState(0);

  const isModal = new URLSearchParams(location.search).get('modal') === '1';

  useEffect(() => {
    // Reset page tour steps on navigation so we don't bleed previous tours into pages that lack one
    setPageTourSteps([]);
    setTourFinished(false);
    setRunTour(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        await fetch('/api/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        }).catch(() => {});
      }
    } catch {}
    localStorage.removeItem('currentUser');
    localStorage.removeItem('auth_token');
    navigate('/login');
  };

  const menuItems = ROLE_MENUS[role] || ROLE_MENUS.pengusul;
  const basePath = `/dashboard/${role}`;

  const defaultTourSteps: any[] = [
    {
      target: '.tour-sidebar-menu',
      content: (
        <div>
          <h3 className="font-bold text-slate-800 text-sm mb-1">Sidebar Navigasi</h3>
          <p className="text-slate-600 text-xs leading-relaxed">
            Di sinilah Anda menemukan akses ke seluruh modul dan menu dalam sistem.
          </p>
        </div>
      ),
      placement: 'right'
    },
    ...menuItems.map((item, index) => ({
      target: `.tour-menu-item-${index}`,
      content: (
        <div>
          <h3 className="font-bold text-slate-800 text-sm mb-1">Menu {item.label}</h3>
          <p className="text-slate-600 text-xs leading-relaxed">
            Akses halaman {item.label} untuk mengelola data dan proses terkait modul ini.
          </p>
        </div>
      ),
      placement: 'right' as const,
    })),
    {
      target: '.tour-header-title',
      content: (
        <div>
          <h3 className="font-bold text-slate-800 text-sm mb-1">Identitas Panel</h3>
          <p className="text-slate-600 text-xs leading-relaxed">
            Menampilkan peran aktif Anda saat ini di dalam sistem.
          </p>
        </div>
      ),
      placement: 'bottom'
    },
    {
      target: '.tour-notification',
      content: (
        <div>
          <h3 className="font-bold text-slate-800 text-sm mb-1">Pusat Notifikasi</h3>
          <p className="text-slate-600 text-xs leading-relaxed">
            Pantau status pengajuan, revisi, dan pembaruan dokumen terbaru secara real-time.
          </p>
        </div>
      ),
      placement: 'bottom-end'
    },
    {
      target: '.tour-profile',
      content: (
        <div>
          <h3 className="font-bold text-slate-800 text-sm mb-1">Profil Pengguna</h3>
          <p className="text-slate-600 text-xs leading-relaxed">
            Klik menu ini untuk melihat profil lengkap atau <strong>keluar (logout)</strong> dari sistem.
          </p>
        </div>
      ),
      placement: 'bottom-end'
    }
  ];

  // Chain default steps with Page specific steps so the tour goes from app shell to page content
  const activeTourSteps = [...defaultTourSteps, ...pageTourSteps].map(step => ({
    ...step,
    disableBeacon: false,
    showProgress: true,
    showSkipButton: true,
    disableOverlayClose: true,
    spotlightClicks: false
  }));

  const SidebarContent = ({ isCollapsed }: { isCollapsed?: boolean }) => (
    <>
      <div className={`flex flex-col items-center pt-8 pb-6 shrink-0 border-b border-emerald-800/50 mb-2 transition-all duration-300 ${isCollapsed ? 'px-2' : 'px-6'}`}>
        <div className="w-full flex flex-col items-center gap-4 text-center">
          <div className="flex flex-col items-center gap-3 w-full justify-center group cursor-pointer" onClick={() => navigate('/dashboard/' + role)}>
            <AppLogo className="size-8 shadow-sm group-hover:scale-105 transition-transform shrink-0" />
            {!isCollapsed && (
              <div className="flex flex-col items-center animate-in fade-in duration-300">
                <span className="text-emerald-50 font-bold tracking-wide leading-tight group-hover:text-white transition-colors">Si-LATORJANA</span>
                <span className="text-emerald-400 font-bold text-[9px] tracking-[0.2em] uppercase">{ROLE_LABELS[actualRole] || actualRole}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`tour-sidebar-menu flex-1 overflow-y-auto py-2 space-y-1.5 custom-scrollbar transition-all duration-300 ${isCollapsed ? 'px-3' : 'px-4'}`}>
        {menuItems.map((item, index) => {
          const fullPath = basePath + item.path;
          const isActive = item.path === '' ? location.pathname === basePath : location.pathname.startsWith(fullPath);
          return (
            <button key={index}
              onClick={() => { navigate(fullPath); }}
              title={isCollapsed ? item.label : undefined}
              className={`tour-menu-item-${index} w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'} rounded-xl tracking-tight transition-all relative overflow-hidden group ${
                isActive 
                  ? 'bg-emerald-800/80 text-white font-semibold shadow-md shadow-emerald-900/20 border border-emerald-700/50' 
                  : 'text-emerald-100/70 hover:bg-emerald-800/40 hover:text-emerald-50 font-medium'
              }`}
            >
              {isActive && <div className={`absolute left-0 top-1/2 -translate-y-1/2 bg-emerald-400 rounded-r-full transition-all ${isCollapsed ? 'w-1 h-6' : 'w-1 h-8'}`} />}
              <item.icon className={`size-5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-emerald-400/60 group-hover:text-emerald-400/80'}`} />
              {!isCollapsed && <span className="text-[14px] truncate animate-in fade-in duration-300">{item.label}</span>}
            </button>
          );
        })}
      </div>

      <div className={`py-6 mt-auto border-t border-emerald-800/50 bg-emerald-950/50 transition-all duration-300 ${isCollapsed ? 'px-3' : 'px-4'}`}>
        <button onClick={handleLogout} title={isCollapsed ? "Keluar Sistem" : undefined} className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'} rounded-xl font-medium tracking-tight text-[14px] text-emerald-200/70 hover:text-red-200 hover:bg-red-900/40 transition-colors`}>
          <LogOut className="size-5 shrink-0 opacity-70" />
          {!isCollapsed && <span className="animate-in fade-in duration-300">Keluar Sistem</span>}
        </button>
      </div>
    </>
  );

  if (isModal) {
    return (
      <div className="min-h-screen font-sans selection:bg-emerald-200 selection:text-emerald-900 bg-white">
        <Outlet context={{ setPageTourSteps }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans selection:bg-emerald-200 selection:text-emerald-900 overflow-hidden relative">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M0 40L40 0H20L0 20M40 40V20L20 40" stroke="currentColor" strokeWidth="1" fill="none" className="text-emerald-900 dark:text-emerald-100"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)">
              <animate attributeName="x" from="0" to="-40" dur="4s" repeatCount="indefinite" />
              <animate attributeName="y" from="0" to="-40" dur="4s" repeatCount="indefinite" />
            </rect>
          </svg>
        </div>
        
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-emerald-200/30 dark:bg-emerald-800/10 blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-blob" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-teal-200/30 dark:bg-teal-800/10 blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-2000" />
        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] rounded-full bg-cyan-200/30 dark:bg-cyan-800/10 blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-4000" />
      </div>
      {!tourFinished && activeTourSteps.length > 0 && (
        <Joyride
          key={tourKey}
          steps={activeTourSteps}
          run={runTour}
          continuous={true}
          beaconComponent={CustomBeacon}
          locale={{
            back: 'Kembali',
            close: 'Tutup',
            last: 'Selesai',
            next: 'Lanjut',
            skip: 'Lewati Tour',
          }}
          styles={{
            options: {
              primaryColor: '#047857',
              zIndex: 10000,
              overlayColor: 'rgba(15, 23, 42, 0.75)',
              textColor: '#334155',
              backgroundColor: '#ffffff',
            },
            tooltip: {
              borderRadius: '12px',
              padding: '16px',
            },
            tooltipContainer: {
              textAlign: 'left',
            },
            buttonNext: {
              backgroundColor: '#047857',
              borderRadius: '8px',
              fontWeight: 600,
              padding: '8px 16px',
            },
            buttonBack: {
              color: '#64748b',
              marginRight: 10,
              fontWeight: 500,
            },
            buttonSkip: {
              color: '#64748b',
              fontWeight: 500,
            }
          } as any}
          onEvent={(data: EventData) => {
            if (data.status === 'finished' || data.status === 'skipped') {
              setRunTour(false);
              setTourFinished(true);
            }
            if (data.action === 'start') {
              setRunTour(true);
            }
          }}
        />
      )}
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col fixed inset-y-0 z-50 bg-[#064e3b] border-r border-[#064e3b] shadow-2xl transition-all duration-300 ${desktopCollapsed ? 'w-24' : 'w-64'}`}>
        <SidebarContent isCollapsed={desktopCollapsed} />
        <button 
          onClick={() => setDesktopCollapsed(!desktopCollapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 flex items-center justify-center size-6 bg-white border border-slate-200 rounded-full text-slate-500 hover:text-slate-800 shadow-sm z-50 transition-transform hover:scale-110"
        >
          {desktopCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
      </aside>

      {/* Mobile Sidebar overlay is removed */}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col h-screen min-w-0 overflow-y-auto overflow-x-hidden transition-all duration-300 ${desktopCollapsed ? 'md:pl-24' : 'md:pl-64'}`}>
        {/* Top Navbar */}
        <header className="h-[72px] shrink-0 flex items-center justify-between px-3 sm:px-6 lg:px-10 bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200/60 shadow-sm gap-2">
          <div className="flex items-center gap-2 sm:gap-4 truncate shrink-0 min-w-0">
            {/* Mobile Logo */}
            <div className="flex md:hidden items-center gap-2 shrink-0 cursor-pointer" onClick={() => navigate('/dashboard/' + role)}>
               <AppLogo className="size-7 shadow-sm transition-transform" />
               <div className="flex flex-col">
                 <span className="text-emerald-800 font-bold tracking-wide leading-tight transition-colors text-[13px]">LATORJANA</span>
               </div>
            </div>
            
            <h1 className="hidden md:block tour-header-title text-[15px] sm:text-[17px] font-bold text-slate-800 tracking-tight bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200/50 truncate">
              Panel {ROLE_LABELS[actualRole] || actualRole}
            </h1>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-4 shrink-0">
            <CalendarWidget />
            <JanaAssistant className="mr-0 sm:mr-2" />
            <button 
              onClick={() => {
                setTourFinished(false);
                setTourKey(prev => prev + 1);
                setRunTour(true);
              }}
              className="flex items-center justify-center p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 sm:text-slate-500 sm:hover:text-emerald-700 border border-slate-200/60 sm:border-transparent sm:hover:border-emerald-200/60 transition-all shadow-sm bg-white"
              title="Panduan Interaktif"
            >
              <HelpCircle className="size-[18px] sm:size-5" />
            </button>
            <div className="tour-notification">
              <NotificationDropdown role={role} />
            </div>
            
            <div className="tour-profile relative">
              <button className="flex items-center gap-2 sm:gap-3 p-1.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all shadow-sm bg-white shrink-0" onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}>
                <div className="size-8 sm:size-9 rounded-lg bg-emerald-50 border border-emerald-100/50 flex items-center justify-center text-emerald-700 shadow-inner">
                  <User className="size-4 sm:size-4.5" />
                </div>
                <div className="hidden sm:block text-left pr-2">
                  <p className="text-[13px] font-bold text-slate-800 leading-tight">{userName}</p>
                  <p className="text-[11px] font-semibold text-slate-500 tracking-wider uppercase mt-0.5">{ROLE_LABELS[actualRole] || actualRole}</p>
                </div>
              </button>

              {profileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
                  <div className="fixed inset-x-4 top-[72px] sm:absolute sm:inset-auto sm:right-0 sm:top-full mt-2 w-auto sm:w-56 rounded-2xl bg-white z-[60] shadow-xl border border-slate-200/60 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-5 py-3 border-b border-slate-100 mb-1 bg-slate-50/50">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Akun Saya</p>
                      <p className="font-semibold text-slate-800 text-[13px] truncate">{userName}</p>
                    </div>
                    <div className="px-2 py-1">
                      <button className="w-full text-left px-3 py-2.5 text-[13px] font-medium text-slate-700 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors" onClick={() => { setProfileDropdownOpen(false); setProfileModalOpen(true); }}>
                        Profil Lengkap
                      </button>
                      <button className="w-full text-left px-3 py-2.5 text-[13px] font-medium text-slate-700 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors mt-0.5" onClick={() => { setProfileDropdownOpen(false); setPreferencesModalOpen(true); }}>
                        Pengaturan Preferensi
                      </button>
                    </div>
                    <div className="mt-1 px-3 pt-2 pb-1 border-t border-slate-100">
                      <button className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-[13px] font-bold text-red-600 rounded-xl hover:bg-red-50 hover:text-red-700 transition-colors" onClick={() => { setProfileDropdownOpen(false); handleLogout(); }}>
                        <LogOut className="size-4" /> Keluar Sesi
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="tour-main-content flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-[1600px] w-full mx-auto pb-24 md:pb-10">
          <Outlet context={{ setPageTourSteps }} />
        </main>

        {/* Mobile Bottom Navbar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200/60 shadow-[0_-4px_10px_-2px_rgba(0,0,0,0.05)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="flex flex-row overflow-x-auto px-2 py-2 gap-1 hide-scrollbar">
            {menuItems.map((item, index) => {
              const fullPath = basePath + item.path;
              const isActive = item.path === '' ? location.pathname === basePath : location.pathname.startsWith(fullPath);
              return (
                <button key={index}
                  onClick={() => navigate(fullPath)}
                  className={`flex-1 flex flex-col items-center justify-center min-w-[72px] gap-1 p-2 border border-transparent rounded-xl transition-all ${
                    isActive ? 'text-emerald-700 bg-emerald-50 border-emerald-100 font-semibold shadow-sm' : 'text-slate-500 hover:text-emerald-600 hover:bg-slate-50'
                  }`}
                >
                  <item.icon className={`size-5 shrink-0 ${isActive ? 'text-emerald-600' : ''}`} />
                  <span className="text-[10px] leading-tight truncate px-1 max-w-[80px] w-full text-center">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Profil Lengkap</DialogTitle>
            <DialogDescription>
              Detail informasi akun Anda.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                  <User className="size-8 text-slate-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-slate-900">{userName}</h4>
                  <p className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block mt-1">{ROLE_LABELS[actualRole] || actualRole}</p>
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Email</label>
                  <p className="text-sm font-medium text-slate-800">user@pnj.ac.id</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Departemen/Unit</label>
                  <p className="text-sm font-medium text-slate-800">Teknik Informatika dan Komputer</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setProfileModalOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={preferencesModalOpen} onOpenChange={setPreferencesModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Pengaturan Preferensi</DialogTitle>
            <DialogDescription>
              Sesuaikan preferensi tampilan dan notifikasi.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between cursor-pointer border p-3 rounded-lg border-slate-200 hover:border-emerald-300 transition-colors">
                <div>
                  <p className="text-sm font-medium text-slate-900">Notifikasi Email</p>
                  <p className="text-xs text-slate-500">Terima update status proposal via email</p>
                </div>
                <div className="h-5 w-9 bg-emerald-500 rounded-full relative shadow-inner">
                  <div className="absolute right-0.5 top-0.5 h-4 w-4 bg-white rounded-full shadow-sm"></div>
                </div>
              </div>
              <div 
                className="flex items-center justify-between cursor-pointer border p-3 rounded-lg border-slate-200 hover:border-slate-300 transition-colors"
                onClick={toggleDarkMode}
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">Mode Gelap</p>
                  <p className="text-xs text-slate-500">Dengan efek animasi sirkular</p>
                </div>
                <div className={cn("h-5 w-9 rounded-full relative shadow-inner transition-colors duration-300", isDarkMode ? "bg-emerald-500" : "bg-slate-200 opacity-60")}>
                  <div className={cn("absolute top-0.5 h-4 w-4 bg-white rounded-full shadow-sm transition-all duration-300", isDarkMode ? "left-[1.125rem]" : "left-0.5")}></div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setPreferencesModalOpen(false)}>Simpan Preferensi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
