import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { FileText, Shield, DollarSign, ArrowRight, ChevronRight, Activity, Users, BarChart3 } from 'lucide-react';

const features = [
  { icon: FileText, title: 'Pengajuan Cepat', desc: 'Proses usulan barang dan anggaran dengan tracking real-time di tiap tahapan.', color: '#36C06C', bg: 'rgba(54,192,108,0.1)' },
  { icon: Shield, title: 'Verifikasi Berlapis', desc: 'Sistem persetujuan terstruktur mulai dari verifikator, PPK, hingga wadir.', color: '#2D6A4F', bg: 'rgba(45,106,79,0.1)' },
  { icon: DollarSign, title: 'Transparansi Anggaran', desc: 'Monitoring penggunaan dana dari awal usulan hingga LPJ yang dapat diandalkan.', color: '#52DE97', bg: 'rgba(82,222,151,0.1)' },
];

const stats = [
  { icon: Users, label: 'Pengguna Aktif', value: '500+' },
  { icon: Activity, label: 'Kegiatan Dikelola', value: '1,200+' },
  { icon: BarChart3, label: 'Dana Tersalurkan', value: 'Rp 2.5M+' },
];

export function LandingPage() {
  return (
    <div className="min-h-screen" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 border-b" style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', borderColor: 'rgba(0,0,0,0.06)' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{ background: 'linear-gradient(135deg, #1A4D2E, #36C06C)' }}>Si</div>
            <span className="font-extrabold text-xl tracking-tight" style={{ color: '#1A4D2E' }}>LATORJANA</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="px-5 py-2 text-sm font-semibold rounded-lg transition-colors" style={{ color: '#1A4D2E' }}>Masuk</Link>
            <Link to="/login" className="px-6 py-2.5 text-sm font-bold text-white rounded-full transition-all hover:-translate-y-0.5 hover:shadow-lg" style={{ background: 'linear-gradient(135deg, #1A4D2E, #36C06C)', boxShadow: '0 4px 15px rgba(26,77,46,0.3)' }}>
              Mulai Sekarang
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 -z-10" style={{ background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 30%, #e0f2f1 60%, #f5f5f5 100%)' }} />
        <div className="absolute top-0 right-0 -z-10 opacity-30" style={{ width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, #36C06C, transparent)', filter: 'blur(100px)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 -z-10 opacity-25" style={{ width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, #2D6A4F, transparent)', filter: 'blur(80px)', transform: 'translate(-30%, 30%)' }} />

        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-8" style={{ background: 'rgba(54,192,108,0.1)', color: '#1A4D2E', border: '1px solid rgba(54,192,108,0.2)' }}>
              <span className="size-2 rounded-full animate-pulse" style={{ background: '#36C06C' }} />
              Platform Terintegrasi
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight mb-6" style={{ color: '#0D2818' }}>
              Sistem Layanan Terpadu<br />
              <span style={{ background: 'linear-gradient(135deg, #1A4D2E 0%, #36C06C 50%, #52DE97 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Administrasi Pengajuan
              </span>
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: '#555' }}>
              Platform pelayanan usulan pengadaan barang dan manajemen anggaran secara terintegrasi, cepat, dan transparan.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link to="/login" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-bold text-lg transition-all hover:-translate-y-1" style={{ background: 'linear-gradient(135deg, #1A4D2E 0%, #2D6A4F 50%, #36C06C 100%)', backgroundSize: '200% 100%', boxShadow: '0 10px 35px rgba(26,77,46,0.35)' }}>
                Masuk ke Sistem <ArrowRight className="size-5" />
              </Link>
              <a href="#features" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-lg border-2 transition-all hover:-translate-y-0.5" style={{ borderColor: '#c8e6c9', color: '#1A4D2E', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)' }}>
                Pelajari Lebih Lanjut <ChevronRight className="size-5" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10 -mt-8 relative z-10">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-4 p-6 rounded-3xl" style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', border: '1px solid rgba(255,255,255,0.5)' }}>
            {stats.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="text-center p-4">
                <s.icon className="size-6 mx-auto mb-2" style={{ color: '#36C06C' }} />
                <div className="text-2xl font-extrabold" style={{ color: '#1A4D2E' }}>{s.value}</div>
                <div className="text-sm text-slate-500 font-medium">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24" style={{ background: '#f8faf8' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: '#0D2818' }}>Fitur Unggulan</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">Kelola seluruh proses pengajuan kegiatan dengan mudah dan transparan.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}
                className="p-8 rounded-3xl border transition-all hover:-translate-y-2 hover:shadow-xl cursor-default"
                style={{ background: 'white', borderColor: 'rgba(200,230,201,0.5)', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                <div className="size-14 rounded-2xl flex items-center justify-center mb-6" style={{ background: f.bg }}>
                  <f.icon className="size-7" style={{ color: f.color }} />
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: '#1A4D2E' }}>{f.title}</h3>
                <p className="text-slate-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #1A4D2E, #0D2818)' }} />
        <div className="absolute rounded-full opacity-20" style={{ width: 400, height: 400, top: -100, right: -100, background: 'radial-gradient(circle, #36C06C, transparent)', filter: 'blur(80px)' }} />
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6">Siap Memulai?</h2>
          <p className="text-white/80 text-lg mb-10 leading-relaxed">Bergabung sekarang dan rasakan kemudahan pengelolaan kegiatan kampus secara digital.</p>
          <Link to="/login" className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl font-bold text-lg transition-all hover:-translate-y-1" style={{ background: 'linear-gradient(135deg, #36C06C, #52DE97)', color: '#0D2818', boxShadow: '0 10px 35px rgba(54,192,108,0.3)' }}>
            Masuk Sekarang <ArrowRight className="size-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t" style={{ borderColor: '#e8f5e9', background: '#fafff8' }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="size-7 rounded-lg flex items-center justify-center text-white text-xs font-black" style={{ background: '#1A4D2E' }}>Si</div>
            <span className="font-bold" style={{ color: '#1A4D2E' }}>LATORJANA</span>
          </div>
          <p className="text-slate-500 text-sm">© 2026 Politeknik Negeri Jakarta. Hak Cipta Dilindungi.</p>
        </div>
      </footer>
    </div>
  );
}
