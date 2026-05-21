import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { databases, APPWRITE_DB_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { motion } from 'motion/react';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const data = await databases.listDocuments(APPWRITE_DB_ID, 'users', [Query.equal('email', email)]);
      if (!data.documents || data.documents.length === 0) throw new Error('Email tidak ditemukan di sistem.');
      const userDoc = data.documents[0];
      if (userDoc.password !== password) throw new Error('Password salah.');
      localStorage.setItem('currentUser', JSON.stringify(userDoc));
      const r = userDoc.role;
      navigate(r === 'admin' ? '/dashboard/admin' : r === 'verifikator' ? '/dashboard/verifikator' : r === 'ppk' ? '/dashboard/ppk' : r === 'bendahara' ? '/dashboard/bendahara' : r === 'wadir2' ? '/dashboard/wadir2' : r === 'rektorat' ? '/dashboard/rektorat' : '/dashboard/pengusul');
    } catch (err: any) {
      setError(err.message || 'Login gagal.');
    } finally { setIsLoading(false); }
  };

  const quickLogin = (val: string) => { if (val) { setEmail(val); setPassword('123'); } };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: '#0A0E27' }}>
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #1A4D2E 0%, #0D2818 50%, #1A4D2E 100%)', backgroundSize: '400% 400%', animation: 'gradientMove 20s ease infinite' }} />
        <div className="absolute rounded-full" style={{ width: 500, height: 500, background: 'radial-gradient(circle, #36C06C, transparent)', top: -200, right: -200, filter: 'blur(60px)', opacity: 0.4, animation: 'float 15s ease-in-out infinite' }} />
        <div className="absolute rounded-full" style={{ width: 400, height: 400, background: 'radial-gradient(circle, #2D6A4F, transparent)', bottom: -150, left: -150, filter: 'blur(60px)', opacity: 0.4, animation: 'float 15s ease-in-out infinite 5s' }} />
        <div className="absolute rounded-full" style={{ width: 350, height: 350, background: 'radial-gradient(circle, #52DE97, transparent)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', filter: 'blur(60px)', opacity: 0.4, animation: 'float 15s ease-in-out infinite 10s' }} />
      </div>

      {/* Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 80, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="relative z-10 grid lg:grid-cols-[500px_550px] overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', borderRadius: 30, boxShadow: '0 30px 80px rgba(0,0,0,0.5), 0 0 100px rgba(54,192,108,0.1), inset 0 0 60px rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {/* Login Form Section */}
        <div className="relative p-[70px_50px] max-lg:p-[60px_40px] max-sm:p-[45px_30px]" style={{ background: 'rgba(255,255,255,0.95)' }}>
          {/* Top gradient bar */}
          <div className="absolute top-0 left-0 w-full h-1" style={{ background: 'linear-gradient(90deg, #1A4D2E, #36C06C, #52DE97, #36C06C, #1A4D2E)', backgroundSize: '200% 100%', animation: 'shimmer 3s linear infinite' }} />

          {/* Logo */}
          <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex items-center gap-4 mb-9">
            <div className="size-14 rounded-2xl flex items-center justify-center font-black text-xl text-white" style={{ background: 'linear-gradient(135deg, #1A4D2E, #36C06C)' }}>Si</div>
            <h2 className="text-2xl font-extrabold" style={{ background: 'linear-gradient(135deg, #1A4D2E 0%, #36C06C 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Si-Latorjana</h2>
          </motion.div>

          {/* Title */}
          <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex items-center gap-4 mb-4">
            <span className="size-2.5 rounded-full shadow-lg animate-pulse" style={{ background: '#FFD700', boxShadow: '0 0 20px #FFD700' }} />
            <h1 className="text-4xl max-sm:text-3xl font-extrabold tracking-tight" style={{ background: 'linear-gradient(135deg, #1A4D2E 0%, #36C06C 50%, #52DE97 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Sign In</h1>
            <span className="size-2.5 rounded-full shadow-lg animate-pulse" style={{ background: '#FF6B6B', boxShadow: '0 0 20px #FF6B6B', animationDelay: '1s' }} />
          </motion.div>

          <motion.p initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-sm text-slate-500 mb-9 leading-7">
            Selamat datang kembali! Masuk dengan akun resmi Anda untuk mengakses sistem pengelolaan kegiatan kampus.
          </motion.p>

          {/* Error */}
          {error && (
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-3 p-4 mb-6 rounded-2xl text-sm font-semibold" style={{ background: 'linear-gradient(135deg, rgba(255,107,107,0.1), rgba(255,235,238,0.8))', color: '#C62828', borderLeft: '4px solid #FF6B6B', boxShadow: '0 4px 15px rgba(255,107,107,0.2)' }}>
              <span className="material-icons text-xl" style={{ color: '#FF6B6B' }}>error</span>
              {error}
            </motion.div>
          )}

          {/* Quick Login */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <div className="mb-5">
              <label className="flex items-center gap-2 text-sm font-bold mb-3" style={{ color: '#1A4D2E' }}>
                <span className="material-icons text-lg" style={{ color: '#36C06C' }}>bolt</span> Login Cepat (Testing)
              </label>
              <select className="w-full p-3 pl-5 rounded-xl border-2 border-slate-200 text-sm font-medium bg-slate-50 focus:border-[#36C06C] focus:ring-2 focus:ring-[#36C06C]/10 outline-none transition-all" onChange={e => quickLogin(e.target.value)}>
                <option value="">Pilih Role...</option>
                <option value="admin@si-latorjana.com">Admin</option>
                <option value="rektorat@si-latorjana.com">Rektorat Utama</option>
                <option value="verifikator@si-latorjana.com">Verifikator</option>
                <option value="ppk@si-latorjana.com">PPK Keuangan</option>
                <option value="wadir2@si-latorjana.com">Wadir II</option>
                <option value="bendahara@si-latorjana.com">Bendahara</option>
                <option value="tik@si-latorjana.com">Pengusul - TIK</option>
                <option value="mesin@si-latorjana.com">Pengusul - MESIN</option>
              </select>
            </div>

            <form onSubmit={handleLogin}>
              {/* Email */}
              <div className="mb-7">
                <label className="flex items-center gap-2 text-sm font-bold mb-3" style={{ color: '#1A4D2E' }}>
                  <span className="material-icons text-lg" style={{ color: '#36C06C' }}>person</span> Email
                </label>
                <div className="relative">
                  <input type="text" className="w-full p-4 pl-12 rounded-xl border-2 border-slate-200 text-sm font-medium bg-slate-50 focus:border-[#36C06C] focus:bg-white focus:shadow-[0_0_0_5px_rgba(54,192,108,0.1),0_10px_30px_rgba(54,192,108,0.15)] focus:-translate-y-0.5 outline-none transition-all" placeholder="Masukkan email" value={email} onChange={e => setEmail(e.target.value)} required />
                  <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">account_circle</span>
                </div>
              </div>

              {/* Password */}
              <div className="mb-7">
                <label className="flex items-center gap-2 text-sm font-bold mb-3" style={{ color: '#1A4D2E' }}>
                  <span className="material-icons text-lg" style={{ color: '#36C06C' }}>lock</span> Password
                </label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} className="w-full p-4 pl-12 rounded-xl border-2 border-slate-200 text-sm font-medium bg-slate-50 focus:border-[#36C06C] focus:bg-white focus:shadow-[0_0_0_5px_rgba(54,192,108,0.1),0_10px_30px_rgba(54,192,108,0.15)] focus:-translate-y-0.5 outline-none transition-all" placeholder="Masukkan password" value={password} onChange={e => setPassword(e.target.value)} required />
                  <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">vpn_key</span>
                </div>
              </div>

              {/* Show password */}
              <label className="flex items-center gap-3 mb-8 cursor-pointer select-none">
                <input type="checkbox" checked={showPass} onChange={() => setShowPass(!showPass)} className="size-5 rounded-md border-2 border-slate-300 accent-[#36C06C]" />
                <span className="text-sm text-slate-500 font-medium">Tampilkan Password</span>
              </label>

              {/* Submit */}
              <button type="submit" disabled={isLoading} className="w-full p-4.5 text-white border-none rounded-xl text-base font-bold cursor-pointer transition-all relative overflow-hidden group disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #1A4D2E 0%, #2D6A4F 50%, #36C06C 100%)', backgroundSize: '200% 100%', boxShadow: '0 8px 30px rgba(26,77,46,0.4)', letterSpacing: 0.5 }}>
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                <span className="relative z-10">{isLoading ? 'Memproses...' : 'Masuk ke Sistem'}</span>
              </button>
            </form>
          </motion.div>
        </div>

        {/* Visual Section */}
        <div className="relative hidden lg:flex items-center justify-center p-16 overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(26,77,46,0.9), rgba(45,106,79,0.9))' }}>
          {/* Geometric patterns */}
          <div className="absolute opacity-10 border-3 border-white rounded-full" style={{ width: 200, height: 200, top: '10%', right: '10%', animation: 'rotate 20s linear infinite' }} />
          <div className="absolute opacity-10 border-3 border-white" style={{ width: 150, height: 150, bottom: '15%', left: '10%', transform: 'rotate(45deg)', animation: 'rotate 15s linear infinite reverse' }} />
          {/* Orbs */}
          <div className="absolute rounded-full" style={{ width: 150, height: 150, top: '20%', left: '15%', background: 'radial-gradient(circle, rgba(255,255,255,0.3), transparent)', filter: 'blur(30px)', animation: 'floatOrb 8s ease-in-out infinite' }} />
          <div className="absolute rounded-full" style={{ width: 100, height: 100, bottom: '25%', right: '20%', background: 'radial-gradient(circle, rgba(255,255,255,0.3), transparent)', filter: 'blur(30px)', animation: 'floatOrb 8s ease-in-out infinite 3s' }} />

          <div className="relative z-10 text-center">
            <div className="flex flex-col items-center gap-12 mb-12">
              <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} className="p-8 rounded-2xl" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
                <div className="text-5xl font-black text-white tracking-tight" style={{ textShadow: '0 4px 15px rgba(255,255,255,0.3)' }}>Si</div>
                <div className="text-lg font-bold text-white/90 mt-1">LATORJANA</div>
              </motion.div>
            </div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              <h2 className="text-white text-3xl font-extrabold mb-5 leading-snug" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>Sistem Pengelolaan<br />Kegiatan Digital</h2>
              <p className="text-white/95 text-sm leading-7 font-medium">Platform terintegrasi untuk Admin Jurusan<br />dan Himpunan Mahasiswa</p>
              <div className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)' }}>
                <span className="material-icons text-xl text-yellow-400">verified</span>
                <span className="text-white text-sm font-semibold">Aman & Terpercaya</span>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Global keyframes */}
      <style>{`
        @keyframes gradientMove { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes float { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(50px,-50px) scale(1.1)} 66%{transform:translate(-30px,30px) scale(0.9)} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes rotate { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes floatOrb { 0%,100%{transform:translate(0,0)} 50%{transform:translate(30px,-30px)} }
      `}</style>
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
    </div>
  );
}
