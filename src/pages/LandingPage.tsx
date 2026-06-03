import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText, ShieldCheck, Printer, Receipt, Bell, FolderKanban,
  Zap, Eye, Lock, ClipboardCheck, Cloud,
  Menu, X, ArrowRight, LayoutDashboard, Route, CheckCircle
} from 'lucide-react';

import { AppLogo } from '@/components/AppLogo';

/* ─── Data ─────────────────────────────────────────────────────── */
const features = [
  { icon: FileText, title: 'Pengajuan Digital', desc: 'Submit proposal lengkap dengan TOR, KAK, dan RAB secara online.', color: 'text-emerald-600', bg: 'bg-emerald-100' },
  { icon: ShieldCheck, title: 'Tracking Verifikasi', desc: 'Pantau status verifikasi dari Verifikator, Wadir II, hingga PPK.', color: 'text-blue-600', bg: 'bg-blue-100' },
  { icon: Printer, title: 'Generate Hard Copy', desc: 'Download dokumen yang sudah disetujui dalam format PDF siap cetak.', color: 'text-indigo-600', bg: 'bg-indigo-100' },
  { icon: Receipt, title: 'Upload LPJ Digital', desc: 'Sistem otomatis track deadline 14 hari kerja untuk pertanggungjawaban.', color: 'text-amber-600', bg: 'bg-amber-100' },
  { icon: Bell, title: 'Notifikasi Real-time', desc: 'Terima peringatan instant setiap perubahan status melalui sistem.', color: 'text-rose-600', bg: 'bg-rose-100' },
  { icon: FolderKanban, title: 'Manajemen Aman', desc: 'Dokumen proposal dan LPJ tersimpan rapi untuk referensi & audit.', color: 'text-teal-600', bg: 'bg-teal-100' },
];

const steps = [
  { title: 'Pengajuan', desc: 'Admin jurusan/himpunan upload KAK & RAB.' },
  { title: 'Verifikasi', desc: 'Cek kelengkapan dokumen oleh Verifikator.' },
  { title: 'Persetujuan', desc: 'Validasi anggaran oleh PPK & Wadir II.' },
  { title: 'Pencairan', desc: 'Proses pencairan dana oleh tim Bendahara.' },
  { title: 'Pelaksanaan', desc: 'Pelaksanaan kegiatan sesuai proposal.' },
  { title: 'LPJ', desc: 'Upload LPJ keuangan maksimal 14 hari kerja.' },
];

const benefits = [
  { icon: Zap, title: 'Proses Lebih Cepat', desc: 'Routing otomatis pangkas waktu persetujuan hingga 40%.' },
  { icon: Eye, title: 'Transparansi Penuh', desc: 'Posisi dokumen terlacak akurat di setiap titik.' },
  { icon: Lock, title: 'Akses Terkelola', desc: 'Keamanan data berlapis untuk pengusul resmi.' },
  { icon: ClipboardCheck, title: 'Audit Trail', desc: 'Riwayat revisi dan status tercatat komprehensif.' },
  { icon: Cloud, title: 'Sistem 24/7', desc: 'Akses kapanpun dan dimanapun via browser.' },
];

const stats = [
  { num: '500+', label: 'Kegiatan Terkelola' },
  { num: '50+', label: 'Himpunan & Jurusan' },
  { num: '98%', label: 'Tingkat Kepuasan' },
  { num: '1', label: 'Platform Terpadu' },
];

/* ─── Animation Variants ───────────────────────────────────────── */
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

/* ─── Components ───────────────────────────────────────────────── */
export function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const smoothScroll = (id: string) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      const offset = 80;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-emerald-200">
      
      {/* ── Navbar ── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
          <a href="#home" onClick={(e) => { e.preventDefault(); smoothScroll('home'); }} className="flex items-center gap-3 relative z-50">
            <AppLogo className="h-10 w-10 shrink-0" />
            <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-800 to-emerald-500">
              Si-Latorjana
            </span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {['fitur', 'proses', 'manfaat'].map(id => (
              <a 
                key={id} href={`#${id}`} 
                onClick={(e) => { e.preventDefault(); smoothScroll(id); }}
                className="text-sm font-semibold text-slate-600 hover:text-emerald-700 transition-colors uppercase tracking-wider relative group"
              >
                {id}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-600 transition-all group-hover:w-full"></span>
              </a>
            ))}
            <Link to="/login" className="px-6 py-2.5 rounded-full bg-emerald-700 text-white font-bold text-sm hover:bg-emerald-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
              Login Portal
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button className="md:hidden relative z-50 p-2 text-slate-600" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-0 left-0 w-full h-screen bg-white pt-24 px-8 flex flex-col gap-6 shadow-xl md:hidden"
            >
              {['home', 'fitur', 'proses', 'manfaat'].map(id => (
                <a 
                  key={id} href={`#${id}`} 
                  onClick={(e) => { e.preventDefault(); smoothScroll(id); }}
                  className="text-2xl font-bold text-slate-800 capitalize border-b border-slate-100 pb-4"
                >
                  {id}
                </a>
              ))}
              <Link to="/login" className="mt-4 text-center px-6 py-4 rounded-xl bg-emerald-700 text-white font-bold text-lg" onClick={() => setMenuOpen(false)}>
                Akses Dashboard
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── Hero Unit ── */}
      <section id="home" className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden items-center flex min-h-[90vh]">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-gradient-to-b from-emerald-50 to-white">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-emerald-200/40 rounded-full blur-3xl mix-blend-multiply opacity-70 animate-pulse"></div>
          <div className="absolute top-40 -left-20 w-[500px] h-[500px] bg-teal-200/40 rounded-full blur-3xl mix-blend-multiply opacity-70 animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-12 grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="relative z-10 w-full">
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-8 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Digitalisasi Akademik
            </motion.div>
            <motion.h1 variants={fadeInUp} className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
              Sistem Layanan <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 to-teal-500">Terpadu Politeknik Negeri Jakarta</span>
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-base md:text-lg text-slate-600 mb-10 max-w-lg leading-relaxed">
              Platform modern pengelolaan kegiatan kampus untuk mempermudah alur pengajuan proposal, verifikasi anggaran, hingga proses LPJ secara transparan dan efisien.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-wrap gap-3 sm:gap-4">
              <Link to="/login" className="flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-4 rounded-full bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1">
                <LayoutDashboard size={20} />
                Buka Dashboard
              </Link>
              <a href="#proses" onClick={(e) => { e.preventDefault(); smoothScroll('proses'); }} className="flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-4 rounded-full bg-white text-slate-700 font-bold border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all hover:-translate-y-1">
                Pelajari Alur
              </a>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, type: 'spring' }}
            className="relative hidden md:block group"
          >
            <div className="absolute -inset-4 md:-inset-6 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-[3rem] blur-2xl -z-10 transition-all duration-700 group-hover:from-emerald-400/30 group-hover:to-teal-400/30 group-hover:blur-3xl"></div>
            <div className="relative rounded-[2.5rem] border border-white/60 bg-white/50 p-2 sm:p-4 backdrop-blur-2xl shadow-2xl shadow-slate-200/50">
               <div className="absolute inset-0 bg-[url('/svg/pattern-bg.svg')] opacity-20 -z-10 bg-repeat rounded-[2.5rem] mix-blend-multiply"></div>
               <img src="/svg/hero-illustration.svg" alt="Hero Illustration" className="w-full rounded-3xl shadow-sm group-hover:-translate-y-2 group-hover:scale-[1.02] transition-all duration-700 ease-out relative z-10" />
               
               {/* Decorative UI elements overlapping the image */}
               <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center gap-4 z-20 animate-bounce" style={{animationDuration: '3s'}}>
                  <div className="size-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 text-sm">Disetujui PPK</h5>
                    <p className="text-xs text-slate-500 font-medium">10 Menit yang lalu</p>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Feature Highlights ── */}
      <section id="fitur" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp}
            className="text-center max-w-2xl mx-auto mb-12 md:mb-16"
          >
            <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Kapasitas Platform Terintegrasi</h2>
            <p className="text-slate-500 text-base md:text-lg">Setiap aspek operasional kegiatan direkam secara digital menunjang akuntabilitas publik.</p>
          </motion.div>

          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8"
          >
            {features.map((f, i) => (
              <motion.div key={i} variants={fadeInUp} className="group p-4 sm:p-8 rounded-2xl sm:rounded-[2rem] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-emerald-900/5 hover:-translate-y-1 transition-all duration-300 flex items-start sm:block gap-4">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-[12px] sm:rounded-2xl ${f.bg} ${f.color} flex items-center justify-center sm:mb-6 shadow-sm group-hover:scale-110 transition-transform`}>
                  <f.icon strokeWidth={2.5} className="size-5 sm:size-7" />
                </div>
                <div>
                  <h3 className="text-base sm:text-xl font-bold text-slate-800 mb-1 sm:mb-3">{f.title}</h3>
                  <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Process Timeline ── */}
      <section id="proses" className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-b from-emerald-900/20 to-transparent pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
            className="text-center md:text-left md:flex justify-between items-end mb-16 gap-8"
          >
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 text-emerald-400 text-xs sm:text-sm font-bold uppercase tracking-wider mb-4">
                <Route size={16} /> Alur Birokrasi
              </div>
              <h2 className="text-2xl md:text-4xl font-extrabold mb-4 tracking-tight leading-snug">Sistematis, Transparan, Bebas Hambatan.</h2>
            </div>
            <p className="text-slate-400 max-w-sm text-sm">Birokrasi berlapis kini digantikan dengan aliran status realtime. Seluruh verifikator terhubung dalam satu pipeline.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {steps.map((st, i) => (
              <motion.div 
                key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 * i }}
                className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 shrink-0 sm:p-6 rounded-[1rem] sm:rounded-2xl hover:bg-slate-800 transition-colors relative group flex items-start sm:items-stretch sm:block gap-4"
              >
                <div className="text-3xl shrink-0 sm:text-4xl font-black text-slate-700 group-hover:text-emerald-500/20 transition-colors mb-0 sm:mb-4 leading-none pt-1 sm:pt-0">{`0${i + 1}`}</div>
                <div>
                  <h4 className="text-emerald-400 font-bold mb-1 sm:mb-2 text-sm sm:text-base">{st.title}</h4>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{st.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <ArrowRight className="hidden lg:block absolute -right-5 top-1/2 -translate-y-1/2 text-slate-600 z-10" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-20 bg-emerald-600 relative">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-10 sm:gap-y-0 gap-x-4 sm:gap-x-8 lg:divide-x divide-emerald-500/40 text-center">
            {stats.map((s, i) => (
              <div key={i} className="px-2 sm:px-4">
                <div className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-2 drop-shadow-sm">{s.num}</div>
                <div className="text-[10px] sm:text-xs md:text-sm font-medium text-emerald-100 uppercase tracking-widest">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section id="manfaat" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid md:grid-cols-2 gap-16 items-center">
          <motion.div 
             initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
             className="text-center md:text-left"
          >
            <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 mb-4 sm:mb-6 tracking-tight">Mengapa Menggunakan Ekosistem Si-Latorjana?</h2>
            <p className="text-slate-600 mb-8 sm:mb-10 text-base sm:text-lg">Standardisasi pengajuan yang meminimalisir kesalahan format, kehilangan fisik dokumen, dan blind-spot status proposal.</p>
            <div className="space-y-5 sm:space-y-6 text-left">
              {benefits.map((b, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="mt-1 p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                    <b.icon className="size-5 sm:size-6" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-slate-800 mb-1">{b.title}</h4>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
            className="bg-slate-50 relative p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-slate-100/60 overflow-hidden mx-auto max-w-sm sm:max-w-none"
          >
             <div className="absolute inset-0 bg-[url('/svg/pattern-bg.svg')] opacity-30 bg-repeat bg-center mix-blend-multiply"></div>
             <div className="absolute top-1/2 -translate-y-1/2 -left-6 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-emerald-500 z-20">
               <CheckCircle size={24} />
             </div>
             <img src="/svg/benefits-illustration.svg" alt="Benefits System Overview" className="w-full relative z-10 drop-shadow-2xl transition-transform hover:scale-105 duration-700 ease-out" />
          </motion.div>
        </div>
      </section>

      {/* ── Minimalist CTA ── */}
      <section className="py-24 sm:py-32 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-4 sm:mb-6 tracking-tight">Mulai Otomasi Alur Birokrasi</h2>
          <p className="text-base sm:text-lg text-slate-500 mb-8 sm:mb-10 max-w-2xl mx-auto">
             Portal administratif ini ditujukan secara eksklusif kepada Himpunan Mahasiswa dan Dosen Pengusul yang berafiliasi institusional.
          </p>
          <Link to="/login" className="inline-flex items-center gap-3 px-8 sm:px-10 py-4 sm:py-5 rounded-full bg-emerald-700 text-white font-bold text-base sm:text-lg hover:bg-emerald-800 transition-all shadow-xl hover:-translate-y-1">
            Masuk dengan Akun SI<ArrowRight className="size-5 sm:size-6" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2">
             <div className="flex items-center gap-3 mb-6">
                <AppLogo className="h-8 w-8 shrink-0" />
                <span className="font-extrabold text-xl text-white tracking-tight">Si-Latorjana</span>
             </div>
             <p className="max-w-sm text-sm leading-relaxed mb-6">Sistem Layanan Terpadu Administrasi Pengajuan Kegiatan. Membawa semangat tata kelola modern di lingkungan akademik institusi.</p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-sm">Platform</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/login" className="hover:text-emerald-400 transition-colors">Akses Login</Link></li>
              <li><Link to="/forgot-password" className="hover:text-emerald-400 transition-colors">Lupa Akses</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-sm">Institusi</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="https://pnj.ac.id" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">Portal PNJ Official</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Buku Panduan Teknis</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center border-t border-slate-800/60 pt-8 text-sm">
           © {new Date().getFullYear()} Politeknik Negeri Jakarta. Hak Cipta Administrasi Sistem Terlindungi.
        </div>
      </footer>
    </div>
  );
}
