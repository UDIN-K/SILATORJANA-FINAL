import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiDeleteUser, apiListUsers } from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Edit, Trash2, Eye, Loader2, Users, Shield, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export function UserManagementPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await apiListUsers();
        const docs = res.data || res || [];
        setUsers(Array.isArray(docs) ? docs : []);
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    })();
  }, [roleFilter]);

  const filtered = users.filter(u => !search || u.nama?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));
  const roleCounts: Record<string, number> = {};
  users.forEach(u => { roleCounts[u.role] = (roleCounts[u.role] || 0) + 1; });

  const roleColors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700', 
    pengusul: 'bg-blue-100 text-blue-700', 
    verifikator: 'bg-emerald-100 text-emerald-700',
    ppk: 'bg-amber-100 text-amber-700', 
    wadir1: 'bg-indigo-100 text-indigo-700',
    wadir2: 'bg-indigo-100 text-indigo-700',
    wadir3: 'bg-indigo-100 text-indigo-700',
    wadir4: 'bg-indigo-100 text-indigo-700',
    bendahara: 'bg-rose-100 text-rose-700', 
    rektorat: 'bg-cyan-100 text-cyan-700',
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Yakin ingin menghapus user ini?')) return;
    try {
      await apiDeleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (e: any) { alert('Gagal: ' + e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-slate-900">Manajemen User</h2><p className="text-slate-500">Kelola semua akun pengguna sistem.</p></div>
        <Button onClick={() => navigate('/dashboard/admin/users/tambah')} className="bg-emerald-700 hover:bg-emerald-800"><Plus className="size-4 mr-2" />Tambah User</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setRoleFilter('')}>
          <CardContent className="p-4 flex items-center gap-3"><Users className="size-8 text-blue-500" /><div><p className="text-2xl font-bold">{users.length}</p><p className="text-xs text-slate-500">Total</p></div></CardContent>
        </Card>
        {Object.entries(roleCounts).slice(0,3).map(([role, count]) => (
          <Card key={role} className="shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setRoleFilter(role)}>
            <CardContent className="p-4 flex items-center gap-3"><Shield className="size-8 text-slate-400" /><div><p className="text-2xl font-bold">{count}</p><p className="text-xs text-slate-500 capitalize">{role}</p></div></CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="p-4 border-b bg-slate-50/50">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1"><Search className="absolute left-3 top-2.5 size-4 text-slate-400" /><Input placeholder="Cari nama/email..." className="pl-9 bg-white" value={search} onChange={e => setSearch(e.target.value)} /></div>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant={roleFilter === '' ? 'default' : 'outline'} onClick={() => setRoleFilter('')}>Semua</Button>
              {['pengusul','verifikator','ppk','wadir1','wadir2','wadir3','wadir4','bendahara','rektorat','admin'].map(r => (
                <Button key={r} size="sm" variant={roleFilter === r ? 'default' : 'outline'} onClick={() => setRoleFilter(r)}>
                  {r.startsWith('wadir') ? `Wadir ${r.slice(5) === '1' ? 'I' : r.slice(5) === '2' ? 'II' : r.slice(5) === '3' ? 'III' : 'IV'}` : r.charAt(0).toUpperCase() + r.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow className="bg-slate-50/80"><TableHead className="px-6">Nama</TableHead><TableHead className="px-6">Email</TableHead><TableHead className="px-6">Role</TableHead><TableHead className="px-6 text-right">Aksi</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={4} className="py-8 text-center"><Loader2 className="animate-spin text-emerald-700 mx-auto" /></TableCell></TableRow> :
              filtered.length === 0 ? <TableRow><TableCell colSpan={4} className="py-8 text-center text-slate-500">Tidak ada user.</TableCell></TableRow> :
              filtered.map(u => (
                <TableRow key={u.id} className="hover:bg-slate-50/50">
                  <TableCell className="px-6 font-medium">{u.nama}</TableCell>
                  <TableCell className="px-6 text-slate-600">{u.email}</TableCell>
                  <TableCell className="px-6">
                    <Badge className={`${roleColors[u.role] || 'bg-slate-100 text-slate-700'}`}>
                      {u.role.startsWith('wadir') 
                        ? `Wadir ${u.role.slice(5) === '1' ? 'I' : u.role.slice(5) === '2' ? 'II' : u.role.slice(5) === '3' ? 'III' : 'IV'}` 
                        : u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 text-right space-x-2">
                    <Button variant="outline" size="icon" className="h-8 w-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => navigate(`/dashboard/admin/users/${u.id}`)}><Eye className="size-4" /></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(`/dashboard/admin/users/edit/${u.id}`)}><Edit className="size-4" /></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleDelete(u.id)}><Trash2 className="size-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
