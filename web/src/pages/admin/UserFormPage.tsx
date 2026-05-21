import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { databases, APPWRITE_DB_ID } from '@/lib/appwrite';
import { ID } from 'appwrite';

export function UserFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ nama: '', email: '', password: '', role: 'pengusul', jurusan_id: '', verifikator_unit: '' });

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const doc = await databases.getDocument(APPWRITE_DB_ID, 'users', id);
        setForm({ nama: doc.nama || '', email: doc.email || '', password: '', role: doc.role || 'pengusul', jurusan_id: doc.jurusan_id || '', verifikator_unit: doc.verifikator_unit || '' });
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    })();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const data: any = { nama: form.nama, email: form.email, role: form.role };
      if (form.password) data.password = form.password;
      if (form.role === 'pengusul' && form.jurusan_id) data.jurusan_id = form.jurusan_id;
      if (form.role === 'verifikator' && form.verifikator_unit) data.verifikator_unit = form.verifikator_unit;

      if (isEdit) {
        await databases.updateDocument(APPWRITE_DB_ID, 'users', id!, data);
      } else {
        data.password = form.password || 'password123';
        await databases.createDocument(APPWRITE_DB_ID, 'users', ID.unique(), data);
      }
      navigate('/dashboard/admin/users');
    } catch (e: any) { alert('Gagal: ' + e.message); }
    finally { setIsSaving(false); }
  };

  if (isLoading) return <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-emerald-700 size-8" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/admin/users')}><ArrowLeft className="size-5" /></Button>
        <h2 className="text-2xl font-bold text-slate-900">{isEdit ? 'Edit User' : 'Tambah User Baru'}</h2>
      </div>
      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2"><Label>Nama Lengkap</Label><Input value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} required /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required /></div>
            <div className="space-y-2"><Label>Password {isEdit && '(kosongkan jika tidak diubah)'}</Label><Input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required={!isEdit} /></div>
            <div className="space-y-2"><Label>Role</Label>
              <Select value={form.role} onValueChange={v => setForm({...form, role: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['pengusul','verifikator','ppk','wadir2','bendahara','rektorat','admin'].map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {form.role === 'verifikator' && (
              <div className="space-y-2"><Label>Unit Verifikator</Label>
                <Select value={form.verifikator_unit} onValueChange={v => setForm({...form, verifikator_unit: v})}>
                  <SelectTrigger><SelectValue placeholder="Pilih unit" /></SelectTrigger>
                  <SelectContent>{['wadir1','wadir2','wadir3','wadir4'].map(u => <SelectItem key={u} value={u}>{u.replace('wadir','Wadir ')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" type="button" onClick={() => navigate('/dashboard/admin/users')}>Batal</Button>
              <Button type="submit" disabled={isSaving} className="bg-emerald-700 hover:bg-emerald-800">{isSaving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}{isSaving ? 'Menyimpan...' : 'Simpan'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
