import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiListIkuMaster, apiCreateIkuMaster, apiUpdateIkuMaster, apiDeleteIkuMaster } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export function IkuConfigPage() {
  const [ikuList, setIkuList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const load = async () => {
    try {
      const res = await apiListIkuMaster();
      setIkuList((res.data || res));
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      await apiCreateIkuMaster({ nama_indikator: newName.trim(), is_visible: true });
      setNewName('');
      load();
    } catch (e: any) { alert('Gagal: ' + e.message); }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await apiUpdateIkuMaster(id, { nama_indikator: editName.trim() });
      setEditId(null);
      load();
    } catch (e: any) { alert('Gagal: ' + e.message); }
  };

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await apiUpdateIkuMaster(id, { is_visible: !current });
      load();
    } catch (e: any) { alert('Gagal: ' + e.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin hapus indikator ini?')) return;
    try { await apiDeleteIkuMaster(id); load(); } catch (e: any) { alert('Gagal: ' + e.message); }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="space-y-1 sm:space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Konfigurasi IKU</h2>
        <p className="text-slate-500 mt-1">Kelola Indikator Kinerja Utama master data.</p>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b"><CardTitle className="text-base">Tambah Indikator Baru</CardTitle></CardHeader>
        <CardContent className="p-4 flex gap-3">
          <Input placeholder="Nama indikator IKU..." value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          <Button onClick={handleAdd} className="bg-emerald-700 hover:bg-emerald-800 shrink-0"><Plus className="size-4 mr-2" />Tambah</Button>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b"><CardTitle className="text-base">Daftar IKU ({ikuList.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? <div className="py-12 text-center"><Loader2 className="animate-spin text-emerald-700 mx-auto" /></div> :
          ikuList.length === 0 ? <div className="py-12 text-center text-slate-500">Belum ada indikator.</div> :
          <div className="divide-y divide-slate-100">
            {ikuList.map((iku, idx) => (
              <div key={iku.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 sm:gap-4 hover:bg-slate-50/50">
                <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                  <span className="text-sm font-medium text-slate-400 w-6 shrink-0">{idx + 1}.</span>
                  {editId === iku.id ? (
                    <div className="flex flex-col sm:flex-row gap-2 flex-1 w-full"><Input value={editName} onChange={e => setEditName(e.target.value)} className="flex-1 w-full" />
                    <div className="flex gap-2 shrink-0"><Button size="sm" onClick={() => handleUpdate(iku.id)}>Simpan</Button><Button size="sm" variant="ghost" onClick={() => setEditId(null)}>Batal</Button></div></div>
                  ) : (
                    <span className={`text-sm min-w-0 break-words ${iku.is_visible ? 'text-slate-800' : 'text-slate-400 line-through'}`}>{iku.nama_indikator}</span>
                  )}
                </div>
                {editId !== iku.id && (
                  <div className="flex gap-1 shrink-0 ml-9 sm:ml-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggle(iku.id, iku.is_visible)} title={iku.is_visible ? 'Sembunyikan' : 'Tampilkan'}>
                      {iku.is_visible ? <Eye className="size-4 text-emerald-600" /> : <EyeOff className="size-4 text-slate-400" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditId(iku.id); setEditName(iku.nama_indikator); }}><Edit className="size-4 text-emerald-700" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(iku.id)}><Trash2 className="size-4 text-red-500" /></Button>
                  </div>
                )}
              </div>
            ))}
          </div>}
        </CardContent>
      </Card>
    </div>
  );
}
