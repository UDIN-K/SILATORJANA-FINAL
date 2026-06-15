import React, { useState, useEffect } from 'react';
import { apiGetUser, apiUpdateUser } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Loader2, User, Eye, EyeOff } from 'lucide-react';
import { getCurrentUser } from '@/lib/helpers';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';

export function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id) {
      loadProfile(currentUser.id);
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadProfile = async (id: string) => {
    setIsLoading(true);
    try {
      const doc = await apiGetUser(id);
      setUser(doc);
      setFormData({
        nama: doc.nama || '',
        email: doc.email || '',
        password: '',
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      const updates: any = {
        nama: formData.nama,
        email: formData.email,
      };
      if (formData.password) {
        updates.password = formData.password;
      }
      const updatedUser = await apiUpdateUser(user.id, updates);
      
      // Update local storage
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setFormData(prev => ({ ...prev, password: '' })); // clear password field
      alert('Profil berhasil diperbarui!');
    } catch (error: any) {
      console.error(error);
      alert('Gagal memperbarui profil: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center">
        <Loader2 className="animate-spin text-emerald-700 size-8" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12 text-slate-500">
        Data pengguna tidak ditemukan.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Profil Saya</h2>
        <p className="text-slate-500">Kelola informasi data diri dan kata sandi Anda.</p>
      </div>
      
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center gap-4 py-4">
          <div className="size-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <User className="size-8" />
          </div>
          <div>
            <CardTitle>{user.nama}</CardTitle>
            <CardDescription className="capitalize">
              Role: <span className="font-medium text-slate-700">{user.role}</span>
              {user.verifikator_unit && ` • ${user.verifikator_unit}`}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Lengkap</Label>
              <Input 
                id="nama" 
                value={formData.nama} 
                onChange={e => setFormData({...formData, nama: e.target.value})} 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Kata Sandi Baru</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Kosongkan jika tidak ingin mengubah kata sandi"
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})} 
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Isi kolom ini hanya jika Anda ingin mengubah kata sandi saat ini.
              </p>
              <PasswordStrengthIndicator password={formData.password} />
            </div>
            
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSaving} className="bg-emerald-700 hover:bg-emerald-800">
                {isSaving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
                {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
