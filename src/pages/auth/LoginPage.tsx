import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { AppLogo } from '@/components/AppLogo';
import { apiLogin } from '@/lib/api';

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
      const { user } = await apiLogin(email, password);
      const r = user.role || '';
      const targetPath = r === 'admin'
        ? '/dashboard/admin'
        : r === 'verifikator'
        ? '/dashboard/verifikator'
        : r === 'ppk'
        ? '/dashboard/ppk'
        : r === 'bendahara'
        ? '/dashboard/bendahara'
        : r.startsWith('wadir')
        ? '/dashboard/wadir2'
        : r === 'rektorat'
        ? '/dashboard/rektorat'
        : '/dashboard/pengusul';
      navigate(targetPath);
    } catch (err: any) {
      setError(err.message || 'Login gagal. Silakan cek kembali kredensial Anda.');
    } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50 selection:bg-emerald-200">
      {/* Visual Section - Hidden on smaller screens */}
      <div className="hidden lg:flex flex-col justify-between p-16 bg-[#022c22] relative overflow-hidden">
        {/* Subtle geometric background */}
        <div className="absolute inset-0 opacity-10 bg-[url('/svg/pattern-bg.svg')] bg-repeat mix-blend-overlay" />
        
        {/* Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-600/30 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-600/20 blur-[120px]" />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative z-10 flex flex-col items-start">
          <div className="flex items-center gap-3 mb-16 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 shadow-xl">
             <AppLogo className="size-8 text-white drop-shadow-md" />
             <span className="font-bold text-xl text-white tracking-tight">Si-Latorjana</span>
          </div>
          
          <div className="max-w-lg mb-12">
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-6 leading-tight">
              Sistem Otomasi <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Administrasi PNJ</span>
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed font-light">
              Platform modern dan terintegrasi untuk mengelola pengajuan dana, persetujuan proposal, dan pelaporan pertanggungjawaban secara transparan.
            </p>
          </div>

          <div className="relative w-full max-w-sm self-center">
            <img src="/svg/login-illustration.svg" alt="Login Graphic" className="w-full drop-shadow-2xl animate-float" />
          </div>
        </motion.div>

        <div className="relative z-10 flex items-center justify-between text-slate-400 text-sm font-medium border-t border-white/10 pt-8 mt-12 w-full">
           <span>&copy; {new Date().getFullYear()} Politeknik Negeri Jakarta.</span>
           <span>Sistem Layanan Terpadu</span>
        </div>
      </div>

      {/* Login Form Section */}
      <div className="flex items-center justify-center p-6 sm:p-12 lg:p-24 relative overflow-hidden bg-white">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-50 rounded-full blur-[100px] opacity-60 pointer-events-none" />
        
        <div className="w-full max-w-[420px] relative z-10">
          
          <div className="text-center lg:text-left space-y-3 mb-10">
            <div className="flex justify-center lg:hidden items-center gap-3 mb-8">
               <div className="p-3 bg-emerald-50 rounded-2xl">
                 <AppLogo className="size-10 text-emerald-600" />
               </div>
            </div>
            
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Selamat Datang</h2>
            <p className="text-slate-500 font-medium text-base">Masuk menggunakan kredensial Anda yang sah.</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3 p-4 mb-6 rounded-2xl bg-red-50 text-red-700 border border-red-100 shadow-sm">
              <AlertCircle className="size-5 mt-0.5 shrink-0 text-red-500" />
              <p className="text-sm font-medium leading-relaxed">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Alamat Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-emerald-600 text-slate-400">
                  <Mail className="size-5" />
                </div>
                <input type="text" className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-slate-200 bg-white placeholder:text-slate-400 font-semibold text-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all hover:border-slate-300" placeholder="nama@domain.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                 <label className="text-sm font-bold text-slate-700">Password</label>
                 <Link to="/forgot-password" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors">Lupa Password?</Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-emerald-600 text-slate-400">
                  <Lock className="size-5" />
                </div>
                <input type={showPass ? 'text' : 'password'} className="w-full pl-12 pr-12 py-3.5 rounded-2xl border-2 border-slate-200 bg-white placeholder:text-slate-400 font-semibold text-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all hover:border-slate-300" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                  {showPass ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full py-4 px-4 rounded-2xl text-white font-bold bg-[#047857] hover:bg-[#065F46] focus:ring-4 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-900/20 active:scale-[0.98] mt-2 flex items-center justify-center">
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">Memproses...</span>
              ) : 'Masuk ke Sistem'}
            </button>
          </form>
          
        </div>
      </div>
    </div>
  );
}
