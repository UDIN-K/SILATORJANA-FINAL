import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { databases, APPWRITE_DB_ID } from '@/lib/appwrite';
import { Query, ID } from 'appwrite';

export function IkuConfigPage() {
  const [ikuList, setIkuList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const load = async () => {
    try {
      const res = await databases.listDocuments(APPWRITE_DB_ID, 'iku_master', [Query.orderAsc('$createdAt'), Query.limit(100)]);
      setIkuList(res.documents);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      await databases.createDocument(APPWRITE_DB_ID, 'iku_master', ID.unique(), { nama_indikator: newName.trim(), is_visible: true });
      setNewName('');
      load();
    } catch (e: any) { alert('Gagal: ' + e.message); }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await databases.updateDocument(APPWRITE_DB_ID, 'iku_master', id, { nama_indikator: editName.trim() });
      setEditId(null);
      load();
    } catch (e: any) { alert('Gagal: ' + e.message); }
  };

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await databases.updateDocument(APPWRITE_DB_ID, 'iku_master', id, { is_visible: !current });
      load();
    } catch (e: any) { alert('Gagal: ' + e.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin hapus indikator ini?')) return;
    try { await databases.deleteDocument(APPWRITE_DB_ID, 'iku_master', id); load(); } catch (e: any) { alert('Gagal: ' + e.message); }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div><h2 className="text-2xl font-bold text-slate-900">Konfigurasi IKU</h2><p className="text-slate-500">Kelola Indikator Kinerja Utama master data.</p></div>

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
              <div key={iku.$id} className="flex items-center justify-between p-4 hover:bg-slate-50/50">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-sm font-medium text-slate-400 w-6">{idx + 1}.</span>
                  {editId === iku.$id ? (
                    <div className="flex gap-2 flex-1"><Input value={editName} onChange={e => setEditName(e.target.value)} className="flex-1" />
                    <Button size="sm" onClick={() => handleUpdate(iku.$id)}>Simpan</Button><Button size="sm" variant="ghost" onClick={() => setEditId(null)}>Batal</Button></div>
                  ) : (
                    <span className={`text-sm ${iku.is_visible ? 'text-slate-800' : 'text-slate-400 line-through'}`}>{iku.nama_indikator}</span>
                  )}
                </div>
                {editId !== iku.$id && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggle(iku.$id, iku.is_visible)} title={iku.is_visible ? 'Sembunyikan' : 'Tampilkan'}>
                      {iku.is_visible ? <Eye className="size-4 text-emerald-600" /> : <EyeOff className="size-4 text-slate-400" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditId(iku.$id); setEditName(iku.nama_indikator); }}><Edit className="size-4 text-emerald-700" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(iku.$id)}><Trash2 className="size-4 text-red-500" /></Button>
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
