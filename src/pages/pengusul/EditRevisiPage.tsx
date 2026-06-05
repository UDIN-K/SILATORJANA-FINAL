import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiGetKegiatan, apiUpdateKegiatan } from '@/lib/api';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Send, Plus, Loader2, Trash2, MessageSquare, AlertTriangle, ShoppingCart, Wrench, Plane, Target } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { fetchKAK, fetchIKU, fetchRAB, formatCurrency, getCurrentUser } from '@/lib/helpers';

const BULAN_INDONESIA = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember'
];
const SATUAN_BARANG    = ['', 'OK', 'LS', 'PCS', 'PACK', 'SET', 'UNIT', 'BOX'];
const SATUAN_JASA      = ['', 'ORG', 'JAM', 'KALI', 'LS'];
const SATUAN_PERJALANAN = ['', 'PP', 'ORG', 'KALI', 'LS'];

interface RabItem {
  id?: number;
  kategori: string;
  uraian: string;
  qty1: number;
  satuan1: string;
  qty2: number;
  satuan2: string;
  qty3: number | null;
  satuan3: string;
  harga_satuan: number;
}

interface IndikatorRow {
  bulan: string;
  indikator: string;
  target: number | null;
}

interface IkuItem {
  id?: number;
  nama_indikator: string;
  target_persen: number | null;
}

function calcTotal(r: RabItem): number {
  const q1 = r.qty1 || 0, q2 = r.qty2 || 1, q3 = r.qty3 || 0, h = r.harga_satuan || 0;
  if (q3 > 0) return q1 * q2 * q3 * h;
  return q1 * q2 * h;
}

function parseRevisiComments(catatan: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!catatan) return result;
  const lines = catatan.split('\n');
  for (const line of lines) {
    const match = line.match(/^\[(.+?)\]:\s*(.+)$/);
    if (match) result[match[1]] = match[2];
    else if (line.trim()) result['Umum'] = (result['Umum'] ? result['Umum'] + '\n' : '') + line.trim();
  }
  return result;
}

// Parse indikator_kinerja string (JSON or plain text) to rows
function parseIndikatorKinerja(rawValue: string | undefined | null): IndikatorRow[] {
  if (!rawValue) return [];
  try {
    const parsed = JSON.parse(rawValue);
    if (Array.isArray(parsed)) {
      return parsed.map((item: any) => ({
        bulan: item.bulan || '',
        indikator: item.indikator || '',
        target: item.target !== undefined ? Number(item.target) : null,
      }));
    }
  } catch {
    // Not JSON – treat as plain text indikator
    if (rawValue.trim()) {
      return [{ bulan: '', indikator: rawValue, target: null }];
    }
  }
  return [];
}

// Split RAB items by category
function splitRabByKategori(items: RabItem[]) {
  const barang = items.filter(i => i.kategori === 'barang');
  const jasa   = items.filter(i => i.kategori === 'jasa');
  const perjalanan = items.filter(i => i.kategori === 'perjalanan');
  return { barang, jasa, perjalanan };
}

// ──────────────── RAB Table for edit ────────────────
function EditRabTable({
  title, icon, items, onAdd, onRemove, onUpdate, satuanOptions
}: {
  title: string;
  icon: React.ReactNode;
  items: RabItem[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  onUpdate: (i: number, field: keyof RabItem, val: any) => void;
  satuanOptions: string[];
}) {
  const subtotal = items.reduce((s, it) => s + calcTotal(it), 0);

  return (
    <Card className="shadow-sm border-slate-200/60 bg-white">
      <CardHeader className="bg-slate-50/30 border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-8 rounded-lg bg-emerald-100 text-emerald-700">
            {icon}
          </div>
          <CardTitle className="text-base text-emerald-900">{title} ({items.length} item)</CardTitle>
        </div>
        <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={onAdd}>
          <Plus className="size-3.5 mr-1" /> Tambah Item
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left min-w-[860px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-3 py-3 w-8">No</th>
                <th className="px-3 py-3">Uraian</th>
                <th className="px-3 py-3 w-14 text-center">Jml 1 *</th>
                <th className="px-3 py-3 w-24">Satuan 1 *</th>
                <th className="px-3 py-3 w-14 text-center">Jml 2 *</th>
                <th className="px-3 py-3 w-24">Satuan 2 *</th>
                <th className="px-3 py-3 w-14 text-center">Jml 3</th>
                <th className="px-3 py-3 w-24">Satuan 3</th>
                <th className="px-3 py-3 w-28 text-right">Harga (Rp) *</th>
                <th className="px-3 py-3 w-28 text-right">Total (Rp)</th>
                <th className="px-3 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 && (
                <tr><td colSpan={11} className="py-6 text-center text-slate-400">Belum ada item.</td></tr>
              )}
              {items.map((item, idx) => (
                <tr key={idx} className="bg-white hover:bg-slate-50/50 transition-colors">
                  <td className="px-3 py-2 text-slate-500">{idx + 1}</td>
                  <td className="p-1.5">
                    <Input value={item.uraian} onChange={e => onUpdate(idx, 'uraian', e.target.value)} className="h-8 rounded-lg text-xs" />
                  </td>
                  <td className="p-1.5">
                    <Input type="number" min={1} value={item.qty1} onChange={e => onUpdate(idx, 'qty1', Math.max(1, parseInt(e.target.value) || 1))} className="h-8 rounded-lg text-xs text-center px-1" />
                  </td>
                  <td className="p-1.5">
                    <select value={item.satuan1} onChange={e => onUpdate(idx, 'satuan1', e.target.value)}
                      className="w-full h-8 rounded-lg border border-slate-200 text-xs px-2 bg-white focus:border-emerald-500 focus:outline-none">
                      {satuanOptions.map(s => <option key={s} value={s}>{s || 'Pilih'}</option>)}
                    </select>
                  </td>
                  <td className="p-1.5">
                    <Input type="number" min={1} value={item.qty2} onChange={e => onUpdate(idx, 'qty2', Math.max(1, parseInt(e.target.value) || 1))} className="h-8 rounded-lg text-xs text-center px-1" />
                  </td>
                  <td className="p-1.5">
                    <select value={item.satuan2} onChange={e => onUpdate(idx, 'satuan2', e.target.value)}
                      className="w-full h-8 rounded-lg border border-slate-200 text-xs px-2 bg-white focus:border-emerald-500 focus:outline-none">
                      {satuanOptions.map(s => <option key={s} value={s}>{s || 'Pilih'}</option>)}
                    </select>
                  </td>
                  <td className="p-1.5">
                    <Input type="number" min={0} value={item.qty3 ?? ''} placeholder="Opsional" onChange={e => onUpdate(idx, 'qty3', e.target.value ? Math.max(0, parseInt(e.target.value) || 0) : null)} className="h-8 rounded-lg text-xs text-center px-1" />
                  </td>
                  <td className="p-1.5">
                    <select value={item.satuan3} onChange={e => onUpdate(idx, 'satuan3', e.target.value)}
                      className="w-full h-8 rounded-lg border border-slate-200 text-xs px-2 bg-white focus:border-emerald-500 focus:outline-none">
                      {satuanOptions.map(s => <option key={s} value={s}>{s || 'Pilih'}</option>)}
                    </select>
                  </td>
                  <td className="p-1.5">
                    <Input type="number" min={0} value={item.harga_satuan || ''} placeholder="0" onChange={e => onUpdate(idx, 'harga_satuan', Math.max(0, parseInt(e.target.value) || 0))} className="h-8 rounded-lg text-xs text-right px-2" />
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-slate-800 bg-slate-50/50 whitespace-nowrap">
                    {formatCurrency(calcTotal(item))}
                  </td>
                  <td className="p-1.5 text-center">
                    <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg h-8 w-8" onClick={() => onRemove(idx)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
            {items.length > 0 && (
              <tfoot>
                <tr className="bg-emerald-50 border-t border-emerald-100">
                  <td colSpan={9} className="px-4 py-3 text-right font-bold text-emerald-900 text-xs uppercase tracking-wider">Subtotal {title}:</td>
                  <td className="px-3 py-3 text-right font-black text-emerald-700">{formatCurrency(subtotal)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────── Main Page ────────────────
export function EditRevisiPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [kegiatan, setKegiatan] = useState<any>(null);
  const [revisiComments, setRevisiComments] = useState<Record<string, string>>({});
  const [currentUser] = useState<any>(getCurrentUser());
  const todayStr = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    nama_kegiatan: '',
    jenis_kegiatan: '',
    tanggal_kegiatan: '',
    tempat: '',
    pengusul_organisasi: '',
    gambaran_umum: '',
    penerima_manfaat: '',
    strategi_pencapaian: '',
    metode_pelaksanaan: '',
    tahapan_pelaksanaan: '',
    kurun_waktu_mulai: '',
    kurun_waktu_selesai: '',
  });

  const [indikatorRows, setIndikatorRows] = useState<IndikatorRow[]>([]);
  const [ikuItems, setIkuItems] = useState<IkuItem[]>([]);
  const [ikuMasterList, setIkuMasterList] = useState<any[]>([]);
  const [rabBarang, setRabBarang] = useState<RabItem[]>([]);
  const [rabJasa, setRabJasa] = useState<RabItem[]>([]);
  const [rabPerjalanan, setRabPerjalanan] = useState<RabItem[]>([]);

  function emptyRab(kategori: string): RabItem {
    return { kategori, uraian: '', qty1: 1, satuan1: '', qty2: 1, satuan2: '', qty3: null, satuan3: '', harga_satuan: 0 };
  }

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const doc = await apiGetKegiatan(id);
        setKegiatan(doc);
        setRevisiComments(parseRevisiComments(doc.catatan_revisi || ''));
        setForm(prev => ({
          ...prev,
          nama_kegiatan: doc.nama_kegiatan || '',
          jenis_kegiatan: doc.jenis_kegiatan || '',
          tanggal_kegiatan: doc.tanggal_kegiatan || '',
          tempat: doc.tempat || '',
          pengusul_organisasi: doc.pengusul_organisasi || '',
        }));

        const kak = await fetchKAK(id);
        if (kak) {
          setForm(prev => ({
            ...prev,
            gambaran_umum: kak.gambaran_umum || '',
            penerima_manfaat: kak.penerima_manfaat || '',
            strategi_pencapaian: kak.strategi_pencapaian || '',
            metode_pelaksanaan: kak.metode_pelaksanaan || '',
            tahapan_pelaksanaan: kak.tahapan_pelaksanaan || '',
            kurun_waktu_mulai: kak.kurun_waktu_mulai || '',
            kurun_waktu_selesai: kak.kurun_waktu_selesai || '',
          }));
          setIndikatorRows(parseIndikatorKinerja(kak.indikator_kinerja));
        }

        const ikusDocs = await fetchIKU(id);
        if (ikusDocs) {
          setIkuItems(ikusDocs.map((i: any) => ({
            id: i.id,
            nama_indikator: i.nama_iku || i.nama_indikator || '',
            target_persen: i.target_persen !== undefined ? Number(i.target_persen) : null,
          })));
        }

        const fallbackIku = [
          { id: 1, nama_indikator: 'Lulusan Mendapat Pekerjaan yang Layak', is_visible: true },
          { id: 2, nama_indikator: 'Mahasiswa Mendapat Pengalaman di Luar Kampus', is_visible: true },
          { id: 3, nama_indikator: 'Dosen Berkegatan di Luar Kampus', is_visible: true },
          { id: 4, nama_indikator: 'Praktisi Mengajar di Dalam Kampus', is_visible: true },
          { id: 5, nama_indikator: 'Hasil Kerja Dosen Digunakan oleh Masyarakat', is_visible: true },
        ];
        
        try {
          const res = await api.get('/api/iku-master');
          let data = Array.isArray((res as any).data) ? (res as any).data : (res as any).data?.data || [];
          data = data.filter((item: any) => item.is_visible !== false);
          if (data.length === 0) data = fallbackIku;
          setIkuMasterList(data);
        } catch {
          setIkuMasterList(fallbackIku);
        }

        const rabDocs = await fetchRAB(id);
        const mapped: RabItem[] = rabDocs.map((r: any) => ({
          id: r.id,
          kategori: r.kategori || 'barang',
          uraian: r.uraian || '',
          qty1: r.qty1 || 1,
          satuan1: r.satuan1 || '',
          qty2: r.qty2 || 1,
          satuan2: r.satuan2 || '',
          qty3: r.qty3 !== undefined && r.qty3 !== null ? r.qty3 : null,
          satuan3: r.satuan3 || '',
          harga_satuan: r.harga_satuan || 0,
        }));
        const { barang, jasa, perjalanan } = splitRabByKategori(mapped);
        setRabBarang(barang.length ? barang : [emptyRab('barang')]);
        setRabJasa(jasa.length ? jasa : [emptyRab('jasa')]);
        setRabPerjalanan(perjalanan.length ? perjalanan : [emptyRab('perjalanan')]);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  const updateForm = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  // Indikator helpers
  const addIndikatorRow = () =>
    setIndikatorRows(prev => [...prev, { bulan: '', indikator: '', target: null }]);
  const removeIndikatorRow = (i: number) =>
    setIndikatorRows(prev => prev.filter((_, idx) => idx !== i));
  const updateIndikator = (i: number, field: keyof IndikatorRow, val: any) =>
    setIndikatorRows(prev => { const n = [...prev]; (n[i] as any)[field] = val; return n; });

  // IKU helpers
  const addIku = () => setIkuItems(prev => [...prev, { nama_indikator: '', target_persen: null }]);
  const removeIku = (i: number) => setIkuItems(prev => prev.filter((_, idx) => idx !== i));
  const updateIku = (i: number, field: keyof IkuItem, val: any) =>
    setIkuItems(prev => { const n = [...prev]; (n[i] as any)[field] = val; return n; });

  // RAB helpers per kategori
  const makeRabUpdater = (setter: React.Dispatch<React.SetStateAction<RabItem[]>>) =>
    (i: number, field: keyof RabItem, val: any) =>
      setter(prev => { const n = [...prev]; (n[i] as any)[field] = val; return n; });

  const grandTotal = [...rabBarang, ...rabJasa, ...rabPerjalanan].reduce((s, r) => s + calcTotal(r), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !kegiatan) return;

    // Validation
    const allRab = [...rabBarang, ...rabJasa, ...rabPerjalanan];
    const filledRab = allRab.filter(it => it.uraian.trim() && it.harga_satuan > 0);
    if (filledRab.length === 0) {
      setForm(prev => ({...prev, submitError: 'Gagal mengirim: Minimal 1 item RAB harus diisi lengkap (uraian dan harga satuan).'}));
      return;
    }
    const filledIku = ikuItems.filter(it => it.nama_indikator.trim() && it.target_persen !== null);
    if (filledIku.length === 0) {
      setForm(prev => ({...prev, submitError: 'Gagal mengirim: Minimal 1 indikator IKU harus ditambahkan dan diisi lengkap.'}));
      return;
    }

    setIsSubmitting(true);
    setForm(prev => ({...prev, submitError: ''}));
    try {
      const toRabPayload = (items: RabItem[], kategori: string) =>
        items.filter(it => it.uraian.trim()).map(it => ({
          kategori,
          uraian: it.uraian,
          qty1: it.qty1, satuan1: it.satuan1,
          qty2: it.qty2, satuan2: it.satuan2,
          qty3: it.qty3 ?? null, satuan3: it.satuan3,
          harga_satuan: it.harga_satuan,
        }));

      await apiUpdateKegiatan(id, {
        nama_kegiatan: form.nama_kegiatan,
        jenis_kegiatan: form.jenis_kegiatan || null,
        tanggal_kegiatan: form.tanggal_kegiatan || null,
        tempat: form.tempat || null,
        pengusul_organisasi: form.pengusul_organisasi || null,
        status: 'submitted',
        catatan_revisi: null,
        total_anggaran: grandTotal,
        kak: {
          gambaran_umum: form.gambaran_umum || null,
          penerima_manfaat: form.penerima_manfaat || null,
          strategi_pencapaian: form.strategi_pencapaian || null,
          metode_pelaksanaan: form.metode_pelaksanaan || null,
          tahapan_pelaksanaan: form.tahapan_pelaksanaan || null,
          kurun_waktu_mulai: form.kurun_waktu_mulai || null,
          kurun_waktu_selesai: form.kurun_waktu_selesai || null,
          indikator_kinerja: indikatorRows.length > 0 ? JSON.stringify(indikatorRows) : null,
        },
        iku: ikuItems.filter(it => it.nama_indikator).map(it => ({
          nama_iku: it.nama_indikator,
          target_persen: it.target_persen
        })),
        rab: [
          ...toRabPayload(rabBarang, 'barang'),
          ...toRabPayload(rabJasa, 'jasa'),
          ...toRabPayload(rabPerjalanan, 'perjalanan'),
        ],
      });

      navigate('/dashboard/pengusul/usulan');
    } catch (error: any) {
      console.error(error);
      const errMsg = error?.response?.data?.message || error.message;
      setForm(prev => ({...prev, submitError: 'Gagal menyimpan revisi: ' + errMsg}));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="py-12 text-center"><Loader2 className="animate-spin text-emerald-700 mx-auto size-8" /></div>;
  if (!kegiatan) return <div className="py-12 text-center text-slate-500">Data tidak ditemukan.</div>;

  const hasComments = Object.keys(revisiComments).length > 0;

  const getMatchedComments = (fields: string[]) => {
    const matched = fields.flatMap(f =>
      Object.entries(revisiComments).filter(([k]) => k.toLowerCase().includes(f.toLowerCase()))
    );
    const unique = new Map();
    matched.forEach(([k, v]) => unique.set(k, v));
    return Array.from(unique.entries());
  };

  const RevisiNote = ({ fields }: { fields: string[] }) => {
    const matched = getMatchedComments(fields);
    if (matched.length === 0) return null;
    return (
      <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
        <div className="flex items-start gap-2">
          <MessageSquare className="size-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-amber-800 mb-1">Catatan Revisi Verifikator:</p>
            {matched.map(([k, v]) => <p key={k} className="text-amber-700 font-medium">{v}</p>)}
          </div>
        </div>
      </div>
    );
  };

  const inputHighlight = (fields: string[]) =>
    getMatchedComments(fields).length > 0 ? 'border-amber-400 bg-amber-50/50' : '';

  const taClass = (fields: string[]) =>
    `flex min-h-[80px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-700 ${inputHighlight(fields)}`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 py-4 border-b border-slate-100 mb-6">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="h-10 w-10 sm:h-11 sm:w-11 border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 shadow-sm transition-all rounded-xl shrink-0">
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Revisi Usulan</h2>
          <p className="text-slate-500 mt-1">Perbaiki data sesuai catatan verifikator, lalu kirim ulang.</p>
        </div>
      </div>

      {hasComments && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-sm mb-6">
          <div className="flex items-center gap-3 border-b border-amber-200/60 pb-3 mb-4">
            <AlertTriangle className="size-6 text-amber-600" />
            <h3 className="text-lg font-bold text-amber-900">Perhatian: Revisi Diperlukan</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(revisiComments).map(([k, v]) => (
              <div key={k} className="flex flex-col sm:flex-row gap-1 sm:gap-4 bg-white/60 p-3 rounded-md border border-amber-100">
                <span className="font-bold text-amber-900 min-w-[140px] capitalize">{k.replace(/_/g, ' ')}</span>
                <span className="text-amber-800 leading-relaxed">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {(form as any).submitError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 font-semibold flex items-center justify-between">
            <div>
              <span className="block text-sm">Gagal Mengirim Revisi</span>
              <span className="block text-xs font-normal mt-1">{(form as any).submitError}</span>
              <span className="block text-xs font-normal mt-1">Saran: Silakan cek apakah backend Laravel di laptopmu sudah menyala dan URL sudah tersambung (jika pakai ssh tunnel, periksa terminal ssh-nya).</span>
            </div>
            <Button type="button" variant="ghost" className="h-8 w-8 p-0" onClick={() => setForm(prev => { const n = {...prev}; delete (n as any).submitError; return n; })}>
              x
            </Button>
          </div>
        )}

        {/* ── Info Kegiatan ── */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle>1. Informasi Kegiatan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-2">
              <Label>Nama Kegiatan *</Label>
              <Input className={inputHighlight(['nama', 'info - nama'])} value={form.nama_kegiatan} onChange={e => updateForm('nama_kegiatan', e.target.value)} required />
              <RevisiNote fields={['nama', 'info - nama']} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Jurusan - readonly */}
              <div className="space-y-2">
                <Label>Jurusan</Label>
                <Input
                  value={currentUser?.jurusan || currentUser?.nama_jurusan || kegiatan?.nama_jurusan || ''}
                  readOnly
                  className="bg-slate-100 border-slate-200 text-slate-600 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500">Jurusan otomatis sesuai akun Anda</p>
              </div>
              {/* Pengusul / Organisasi */}
              <div className="space-y-2">
                <Label>Pengusul / Organisasi</Label>
                <Input
                  value={form.pengusul_organisasi}
                  onChange={e => updateForm('pengusul_organisasi', e.target.value)}
                  placeholder="Cth: Himpunan Mahasiswa TIK"
                  className={inputHighlight(['pengusul', 'organisasi'])}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label>Jenis Kegiatan</Label>
                <Input
                  value={form.jenis_kegiatan}
                  onChange={e => updateForm('jenis_kegiatan', e.target.value)}
                  placeholder="Cth: Seminar / Workshop"
                  className={inputHighlight(['jenis'])}
                />
                <RevisiNote fields={['jenis']} />
              </div>
              <div className="space-y-2">
                <Label>Tanggal</Label>
                <Input type="date" min={todayStr} className={inputHighlight(['tanggal'])} value={form.tanggal_kegiatan} onChange={e => updateForm('tanggal_kegiatan', e.target.value)} />
                <RevisiNote fields={['tanggal']} />
              </div>
              <div className="space-y-2">
                <Label>Tempat</Label>
                <Input className={inputHighlight(['tempat'])} value={form.tempat} onChange={e => updateForm('tempat', e.target.value)} />
                <RevisiNote fields={['tempat']} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── KAK ── */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle>2. KAK (Kerangka Acuan Kerja)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            {(
              [
                ['gambaran_umum', 'Gambaran Umum Acara', ['gambaran', 'umum']],
                ['penerima_manfaat', 'Penerima Manfaat', ['penerima', 'manfaat']],
                ['metode_pelaksanaan', 'Metode Pelaksanaan', ['metode']],
                ['tahapan_pelaksanaan', 'Tahapan Pelaksanaan', ['tahapan']],
                ['strategi_pencapaian', 'Strategi Pencapaian Keluaran', ['strategi']],
              ] as [string, string, string[]][]
            ).map(([key, label, fields]) => (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <textarea className={taClass(fields)} value={(form as any)[key]} onChange={e => updateForm(key, e.target.value)} />
                <RevisiNote fields={fields} />
              </div>
            ))}

            {/* Indikator Kinerja Table */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <Label className="leading-tight block">Indikator Kinerja Keberhasilan</Label>
                <Button type="button" variant="secondary" size="sm" className="h-9 w-full sm:w-auto rounded-xl" onClick={addIndikatorRow}>
                  <Plus className="mr-1 h-3.5 w-3.5 shrink-0" /> Tambah Baris
                </Button>
              </div>
              <div className="border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
                {/* Mobile View */}
                <div className="lg:hidden flex flex-col gap-4 bg-slate-50/50 p-2 sm:p-4">
                  {indikatorRows.length === 0 && (
                    <div className="text-center py-6 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl bg-white mx-2 mt-2">
                       Belum ada indikator. Klik "Tambah Baris" untuk menambahkan.
                    </div>
                  )}
                  {indikatorRows.map((row, idx) => (
                    <div key={idx} className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
                      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                        <div className="font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg text-xs">Indikator {idx + 1}</div>
                        <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50 focus:ring-0" onClick={() => removeIndikatorRow(idx)}>
                          <Trash2 className="size-4" /> <span className="ml-1 text-xs">Hapus</span>
                        </Button>
                      </div>
                      <div>
                        <Label className="text-xs mb-1.5 block text-slate-600 font-semibold">Bulan</Label>
                        <select
                          value={row.bulan}
                          onChange={e => updateIndikator(idx, 'bulan', e.target.value)}
                          className="w-full h-11 rounded-xl border border-slate-200 text-sm px-3 bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value="">Pilih Bulan</option>
                          {BULAN_INDONESIA.map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs mb-1.5 block text-slate-600 font-semibold">Indikator Keberhasilan</Label>
                        <Input
                          placeholder="Contoh: Tersusunnya dokumen RPKL"
                          value={row.indikator}
                          onChange={e => updateIndikator(idx, 'indikator', e.target.value)}
                          className="h-11 rounded-xl text-sm focus:ring-indigo-500/20"
                        />
                      </div>
                      <div>
                        <Label className="text-xs mb-1.5 block text-slate-600 font-semibold">Target (%)</Label>
                        <Input
                          type="number" min={0} placeholder="0"
                          value={row.target ?? ''}
                          onChange={e => updateIndikator(idx, 'target', e.target.value ? Math.max(0, Number(e.target.value)) : null)}
                          className="h-11 rounded-xl text-sm focus:ring-indigo-500/20"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop View */}
                <table className="hidden lg:table w-full text-sm text-left min-w-[600px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase">
                    <tr>
                      <th className="px-3 py-3 w-8 text-center">No</th>
                      <th className="px-3 py-3 w-36">Bulan</th>
                      <th className="px-3 py-3">Indikator Keberhasilan</th>
                      <th className="px-3 py-3 w-24 text-center">Target</th>
                      <th className="px-3 py-3 w-10 text-center">%</th>
                      <th className="px-3 py-3 w-12 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {indikatorRows.length === 0 && (
                      <tr><td colSpan={6} className="py-5 text-center text-slate-400 text-sm">Belum ada indikator.</td></tr>
                    )}
                    {indikatorRows.map((row, idx) => (
                      <tr key={idx} className="bg-white hover:bg-slate-50/50">
                        <td className="px-3 py-2 text-center text-slate-500">{idx + 1}</td>
                        <td className="p-1.5">
                          <select
                            value={row.bulan}
                            onChange={e => updateIndikator(idx, 'bulan', e.target.value)}
                            className="w-full h-9 rounded-lg border border-slate-200 text-sm px-2 bg-white focus:border-indigo-500 focus:outline-none"
                          >
                            <option value="">Pilih Bulan</option>
                            {BULAN_INDONESIA.map(b => (
                              <option key={b} value={b}>{b}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-1.5">
                          <Input
                            placeholder="Contoh: Tersusunnya dokumen RPKL"
                            value={row.indikator}
                            onChange={e => updateIndikator(idx, 'indikator', e.target.value)}
                            className="h-9 rounded-lg text-sm"
                          />
                        </td>
                        <td className="p-1.5">
                          <Input
                            type="number" min={0} placeholder="0"
                            value={row.target ?? ''}
                            onChange={e => updateIndikator(idx, 'target', e.target.value ? Math.max(0, Number(e.target.value)) : null)}
                            className="h-9 rounded-lg text-sm text-center"
                          />
                        </td>
                        <td className="px-3 py-2 text-center text-slate-500 font-semibold">%</td>
                        <td className="p-1.5 text-center">
                          <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg h-8 w-8" onClick={() => removeIndikatorRow(idx)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <RevisiNote fields={['indikator']} />
            </div>

            {/* Kurun Waktu */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100">
              <div className="space-y-2">
                <Label>Kurun Waktu Pelaksanaan (Dari)</Label>
                <Input type="date" min={todayStr} className={inputHighlight(['waktu', 'kurun'])} value={form.kurun_waktu_mulai} onChange={e => updateForm('kurun_waktu_mulai', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Kurun Waktu Pelaksanaan (Sampai)</Label>
                <Input type="date" min={form.kurun_waktu_mulai || todayStr} className={inputHighlight(['waktu', 'kurun'])} value={form.kurun_waktu_selesai} onChange={e => updateForm('kurun_waktu_selesai', e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Indikator Kinerja Utama (IKU) ── */}
        <Card className="border-slate-200/60 shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-purple-50/50 border-b border-purple-100/50 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-8 rounded-xl bg-purple-100 text-purple-700 shrink-0">
                  <Target className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-800 leading-tight">Indikator Kinerja Utama</CardTitle>
                  <p className="text-sm text-slate-500 mt-0.5">Pilih IKU yang didukung beserta persentase target.</p>
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addIku} className="rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800 w-full sm:w-auto">
                <Plus className="size-4 mr-1.5 shrink-0" />Tambah IKU
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {ikuItems.length === 0 ? (
                 <div className="text-center py-6 text-sm text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Belum ada IKU yang dipilih. Klik "Tambah IKU".
                 </div>
              ) : (
                ikuItems.map((iku, index) => (
                  <div key={index} className="flex gap-4 items-start bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex-1">
                      <Label className="text-xs mb-1.5 block text-slate-600 font-semibold">Nama Indikator</Label>
                      <select
                        value={iku.nama_indikator}
                        onChange={e => updateIku(index, 'nama_indikator', e.target.value)}
                        className="mt-1 w-full h-10 rounded-xl border border-slate-200 px-3 bg-white text-sm focus:border-purple-500 focus:outline-none"
                      >
                        <option value="">-- Pilih Indikator --</option>
                        {ikuMasterList.map(item => (
                          <option key={item.id} value={item.nama_indikator || item.nama_iku || String(item.id)}>
                            {item.nama_indikator || item.nama_iku}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-32">
                      <Label className="text-xs mb-1.5 block text-slate-600 font-semibold">Target (%)</Label>
                      <Input
                        type="number" min={0} max={100}
                        value={iku.target_persen ?? ''}
                        onChange={e => updateIku(index, 'target_persen', e.target.value ? Math.max(0, Math.min(100, Number(e.target.value))) : null)}
                        placeholder="0"
                        className="mt-1 h-10 rounded-xl"
                      />
                    </div>
                    <div className="pt-7">
                      <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl" onClick={() => removeIku(index)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <RevisiNote fields={['iku']} />
          </CardContent>
        </Card>

        {/* ── RAB per kategori ── */}
        <RevisiNote fields={['rab']} />

        <EditRabTable
          title="Belanja Barang"
          icon={<ShoppingCart className="size-4" />}
          items={rabBarang}
          onAdd={() => setRabBarang(prev => [...prev, emptyRab('barang')])}
          onRemove={i => setRabBarang(prev => prev.filter((_, idx) => idx !== i))}
          onUpdate={makeRabUpdater(setRabBarang)}
          satuanOptions={SATUAN_BARANG}
        />

        <EditRabTable
          title="Belanja Jasa"
          icon={<Wrench className="size-4" />}
          items={rabJasa}
          onAdd={() => setRabJasa(prev => [...prev, emptyRab('jasa')])}
          onRemove={i => setRabJasa(prev => prev.filter((_, idx) => idx !== i))}
          onUpdate={makeRabUpdater(setRabJasa)}
          satuanOptions={SATUAN_JASA}
        />

        <EditRabTable
          title="Belanja Perjalanan"
          icon={<Plane className="size-4" />}
          items={rabPerjalanan}
          onAdd={() => setRabPerjalanan(prev => [...prev, emptyRab('perjalanan')])}
          onRemove={i => setRabPerjalanan(prev => prev.filter((_, idx) => idx !== i))}
          onUpdate={makeRabUpdater(setRabPerjalanan)}
          satuanOptions={SATUAN_PERJALANAN}
        />

        {/* Grand Total */}
        <div className="rounded-2xl bg-gradient-to-r from-[#0B6B4A] to-[#047857] p-5 flex items-center justify-between shadow-xl">
          <p className="text-white font-bold text-base uppercase tracking-wider">Total Anggaran Keseluruhan</p>
          <div className="text-2xl font-black text-emerald-300">{formatCurrency(grandTotal)}</div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Batal</Button>
          <Button type="submit" disabled={isSubmitting} className="bg-emerald-700 hover:bg-emerald-800">
            {isSubmitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Send className="size-4 mr-2" />}
            {isSubmitting ? 'Menyimpan...' : 'Kirim Revisi'}
          </Button>
        </div>
      </form>
    </div>
  );
}
