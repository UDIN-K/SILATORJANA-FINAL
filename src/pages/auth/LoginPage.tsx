import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { AppLogo } from '@/components/AppLogo';
import { databases, APPWRITE_DB_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { hashPassword } from '@/lib/helpers';

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

      const hashedInput = await hashPassword(password);
      if (userDoc.password !== password && userDoc.password !== hashedInput) {
        throw new Error('Password salah.');
      }

      localStorage.setItem('currentUser', JSON.stringify(userDoc));
      const r = userDoc.role;
      navigate(r === 'admin' ? '/dashboard/admin' : r === 'verifikator' ? '/dashboard/verifikator' : r === 'ppk' ? '/dashboard/ppk' : r === 'bendahara' ? '/dashboard/bendahara' : r === 'wadir2' ? '/dashboard/wadir2' : r === 'rektorat' ? '/dashboard/rektorat' : '/dashboard/pengusul');
    } catch (err: any) {
      setError(err.message || 'Login gagal. Silakan cek kembali kredensial Anda.');
    } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Visual Section - Hidden on smaller screens */}
      <div className="hidden lg:flex flex-col justify-between p-16 bg-[#022c22] relative overflow-hidden">
        {/* Subtle geometric background */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")', backgroundSize: '30px 30px' }} />
        
        {/* Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-600/20 blur-[120px]" />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative z-10">
          <img src="/assets/images/logo-pnj.png" alt="Logo PNJ" className="h-16 w-auto object-contain drop-shadow-lg mb-16" />
          
          <div className="max-w-md">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6 leading-[1.15]">
              Sistem Pengelolaan<br />Kegiatan Digital
            </h1>
            <p className="text-emerald-100/70 text-lg leading-relaxed font-light">
              Platform modern dan terintegrasi untuk Admin Jurusan dan Himpunan Mahasiswa dalam mengelola proposal, pendanaan, dan pelaporan secara transparan.
            </p>
          </div>
        </motion.div>

        <div className="relative z-10 flex items-center gap-4 text-emerald-400/60 text-sm font-medium">
          <AppLogo className="size-8 opacity-60" />
          <span>&copy; {new Date().getFullYear()} Politeknik Negeri Jakarta.<br/>All rights reserved.</span>
        </div>
      </div>

      {/* Login Form Section */}
      <div className="flex items-center justify-center p-8 sm:p-12 lg:p-24 relative">
        <div className="absolute inset-0 bg-slate-50/50" />
        <div className="w-full max-w-[420px] relative z-10 space-y-10">
          
          <div className="text-center lg:text-left space-y-3">
            <div className="flex justify-center lg:hidden items-center gap-4 mb-10">
              <img src="/assets/images/logo-pnj.png" alt="Logo PNJ" className="h-14 w-auto object-contain drop-shadow-sm" />
            </div>
            <div className="inline-flex items-center gap-3 bg-emerald-50 px-4 py-2 rounded-full text-emerald-700 font-semibold text-sm mb-4 border border-emerald-100/50 shadow-sm">
                <AppLogo className="size-5" /> Si-Latorjana
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Selamat Datang</h2>
            <p className="text-slate-500 font-medium text-sm">Masuk menggunakan kredensial Anda yang sah.</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 text-red-700 border border-red-100 shadow-sm">
              <AlertCircle className="size-5 mt-0.5 shrink-0 text-red-500" />
              <p className="text-sm font-medium leading-relaxed">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Alamat Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-emerald-600 text-slate-400">
                  <Mail className="size-5" />
                </div>
                <input type="text" className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-slate-200 bg-white placeholder:text-slate-400 font-medium text-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all hover:border-slate-300" placeholder="nama@domain.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                 <label className="text-sm font-semibold text-slate-700">Password</label>
                 <a href="#" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors">Lupa Password?</a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-emerald-600 text-slate-400">
                  <Lock className="size-5" />
                </div>
                <input type={showPass ? 'text' : 'password'} className="w-full pl-12 pr-12 py-3.5 rounded-2xl border-2 border-slate-200 bg-white placeholder:text-slate-400 font-medium text-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all hover:border-slate-300" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors">
                  {showPass ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full py-4 px-4 rounded-2xl text-white font-bold bg-[#047857] hover:bg-[#065F46] focus:ring-4 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-900/20 active:scale-[0.98]">
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
