import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import api, { apiCreateKegiatan, apiUpdateKegiatan, apiGetKegiatan } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, Send, Plus, Loader2, Trash2, Target, ShoppingCart, Wrench, Plane, X, CheckCircle, Building2, Calendar, FileText, Users, Lightbulb, CheckSquare, CalendarRange, Info, CircleDollarSign, AlertTriangle, Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import { formatCurrency, getCurrentUser, fetchKAK, fetchIKU, fetchRAB } from '@/lib/helpers';

const BULAN_INDONESIA = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember'
];

const SATUAN_BARANG = ['', 'OK', 'LS', 'PCS', 'PACK', 'SET', 'UNIT', 'BOX'];
const SATUAN_JASA   = ['', 'ORG', 'JAM', 'KALI', 'LS'];
const SATUAN_PERJALANAN = ['', 'PP', 'ORG', 'KALI', 'LS'];

type RabItem = {
  uraian: string;
  qty1: number | '';
  satuan1: string;
  qty2: number | '';
  satuan2: string;
  qty3: number | '' | null;
  satuan3: string;
  harga_satuan: number | '';
};

type IndikatorRow = {
  bulan: string;
  indikator: string;
  target: number | null;
};

type IkuItem = {
  nama_indikator: string;
  target_persen: number | null;
};

function emptyRab(): RabItem {
  return { uraian: '', qty1: 1, satuan1: '', qty2: 1, satuan2: '', qty3: null, satuan3: '', harga_satuan: '' };
}

const calcTotal = (item: RabItem) => {
  const q1 = Number(item.qty1) || 0;
  const q2 = Number(item.qty2) || 0;
  const q3 = Number(item.qty3) || 0;
  const h  = Number(item.harga_satuan) || 0;
  return q3 > 0 ? q1 * q2 * q3 * h : q1 * q2 * h;
}

const handlePositiveNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (['-', '+', 'e', 'E'].includes(e.key)) {
    e.preventDefault();
  }
};

// ──────────────── RAB Table per kategori ────────────────
function RabTable({
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
    <Card className="shadow-sm border-slate-200/60 bg-white overflow-hidden">
      <CardHeader className="bg-slate-50/30 border-b border-slate-100/60 py-4 px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center justify-center size-9 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
            {icon}
          </div>
          <div className="flex-1">
            <CardTitle className="text-base text-emerald-900 leading-tight">{title}</CardTitle>
            <p className="text-xs text-slate-500">{items.length} item</p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 w-full sm:w-auto" onClick={onAdd}>
          <Plus className="size-3.5 mr-1 shrink-0" /> Tambah Item
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {/* Mobile View */}
        <div className="lg:hidden flex flex-col gap-4 p-2 sm:p-4 bg-slate-50/50">
          {items.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-2xl bg-white m-2">
              Belum ada item. Klik "Tambah Item" untuk menambahkan.
            </div>
          )}
          {items.map((item, idx) => (
             <div key={idx} className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <div className="font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg text-xs">Item {idx + 1}</div>
                  <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50 focus:ring-0" onClick={() => onRemove(idx)}>
                    <Trash2 className="size-4" /> <span className="ml-1 text-xs">Hapus</span>
                  </Button>
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block text-slate-600 font-semibold">Uraian Belanja <span className="text-red-500">*</span></Label>
                  <Input placeholder="Ketik uraian belanja..." value={item.uraian} onChange={e => onUpdate(idx, 'uraian', e.target.value)} className="h-11 rounded-xl text-sm" />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs mb-1.5 block text-slate-600 font-semibold">Jml 1 <span className="text-red-500">*</span></Label>
                    <Input type="number" min={1} value={item.qty1} onKeyDown={handlePositiveNumberKeyDown} onChange={e => onUpdate(idx, 'qty1', e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 1))} className="h-11 rounded-xl px-3 text-sm focus:ring-emerald-500/20" />
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block text-slate-600 font-semibold">Satuan 1 <span className="text-red-500">*</span></Label>
                    <select value={item.satuan1} onChange={e => onUpdate(idx, 'satuan1', e.target.value)} className="w-full h-11 rounded-xl border border-slate-200 text-sm px-3 bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                      {satuanOptions.map(s => <option key={s} value={s}>{s || 'Pilih'}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs mb-1.5 block text-slate-600 font-semibold">Jml 2 <span className="text-red-500">*</span></Label>
                    <Input type="number" min={1} value={item.qty2} onKeyDown={handlePositiveNumberKeyDown} onChange={e => onUpdate(idx, 'qty2', e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 1))} className="h-11 rounded-xl px-3 text-sm focus:ring-emerald-500/20" />
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block text-slate-600 font-semibold">Satuan 2 <span className="text-red-500">*</span></Label>
                    <select value={item.satuan2} onChange={e => onUpdate(idx, 'satuan2', e.target.value)} className="w-full h-11 rounded-xl border border-slate-200 text-sm px-3 bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                      {satuanOptions.map(s => <option key={s} value={s}>{s || 'Pilih'}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs mb-1.5 block text-slate-600 font-semibold">Jml 3 (Opsional)</Label>
                    <Input type="number" min={0} value={item.qty3 === null ? '' : item.qty3} placeholder="0" onKeyDown={handlePositiveNumberKeyDown} onChange={e => onUpdate(idx, 'qty3', e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))} className="h-11 rounded-xl px-3 text-sm focus:ring-emerald-500/20" />
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block text-slate-600 font-semibold">Satuan 3</Label>
                    <select value={item.satuan3} onChange={e => onUpdate(idx, 'satuan3', e.target.value)} className="w-full h-11 rounded-xl border border-slate-200 text-sm px-3 bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                      {satuanOptions.map(s => <option key={s} value={s}>{s || 'Pilih'}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                   <Label className="text-xs mb-1.5 block text-slate-600 font-semibold">Harga Satuan (Rp) <span className="text-red-500">*</span></Label>
                   <Input type="number" min={0} value={item.harga_satuan} placeholder="0" onKeyDown={handlePositiveNumberKeyDown} onChange={e => onUpdate(idx, 'harga_satuan', e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value)))} className="h-11 rounded-xl text-right font-medium text-sm focus:ring-emerald-500/20" />
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-600">Subtotal:</span>
                  <span className="font-extrabold text-emerald-700 text-base">{formatCurrency(calcTotal(item))}</span>
                </div>
             </div>
          ))}
          {items.length > 0 && (
             <div className="bg-emerald-50/50 p-5 rounded-2xl flex justify-between items-center border border-emerald-200/60 shadow-sm mt-2">
               <span className="font-bold text-emerald-900 text-sm uppercase tracking-wide">Subtotal</span>
               <span className="font-black text-emerald-700 text-xl">{formatCurrency(subtotal)}</span>
             </div>
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-xs text-left min-w-[860px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-3 py-3 w-8">No</th>
                <th className="px-3 py-3 min-w-[160px]">Uraian</th>
                <th className="px-3 py-3 w-16 text-center">Jml 1 <span className="text-red-500">*</span></th>
                <th className="px-3 py-3 w-24">Satuan 1 <span className="text-red-500">*</span></th>
                <th className="px-3 py-3 w-16 text-center">Jml 2 <span className="text-red-500">*</span></th>
                <th className="px-3 py-3 w-24">Satuan 2 <span className="text-red-500">*</span></th>
                <th className="px-3 py-3 w-16 text-center">Jml 3</th>
                <th className="px-3 py-3 w-24">Satuan 3</th>
                <th className="px-3 py-3 w-28 text-right">Harga (Rp) <span className="text-red-500">*</span></th>
                <th className="px-3 py-3 w-28 text-right">Total (Rp)</th>
                <th className="px-3 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    Belum ada item. Klik "Tambah Item" untuk menambahkan.
                  </td>
                </tr>
              )}
              {items.map((item, idx) => (
                <tr key={idx} className="bg-white hover:bg-slate-50/50 transition-colors">
                  <td className="px-3 py-2 text-slate-500 font-medium">{idx + 1}</td>
                  <td className="p-1.5">
                    <Input
                      placeholder="Uraian belanja..."
                      value={item.uraian}
                      onChange={e => onUpdate(idx, 'uraian', e.target.value)}
                      className="h-9 rounded-lg text-xs"
                    />
                  </td>
                  <td className="p-1.5">
                    <Input
                      type="number" min={1}
                      value={item.qty1}
                      onKeyDown={handlePositiveNumberKeyDown}
                      onChange={e => onUpdate(idx, 'qty1', e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 1))}
                      className="h-9 rounded-lg text-xs text-center px-1"
                    />
                  </td>
                  <td className="p-1.5">
                    <select
                      value={item.satuan1}
                      onChange={e => onUpdate(idx, 'satuan1', e.target.value)}
                      className="w-full h-9 rounded-lg border border-slate-200 text-xs px-2 bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      {satuanOptions.map(s => <option key={s} value={s}>{s || 'Pilih'}</option>)}
                    </select>
                  </td>
                  <td className="p-1.5">
                    <Input
                      type="number" min={1}
                      value={item.qty2}
                      onKeyDown={handlePositiveNumberKeyDown}
                      onChange={e => onUpdate(idx, 'qty2', e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 1))}
                      className="h-9 rounded-lg text-xs text-center px-1"
                    />
                  </td>
                  <td className="p-1.5">
                    <select
                      value={item.satuan2}
                      onChange={e => onUpdate(idx, 'satuan2', e.target.value)}
                      className="w-full h-9 rounded-lg border border-slate-200 text-xs px-2 bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      {satuanOptions.map(s => <option key={s} value={s}>{s || 'Pilih'}</option>)}
                    </select>
                  </td>
                  <td className="p-1.5">
                    <Input
                      type="number" min={0}
                      value={item.qty3 ?? ''}
                      placeholder="Opsional"
                      onKeyDown={handlePositiveNumberKeyDown}
                      onChange={e => onUpdate(idx, 'qty3', e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                      className="h-9 rounded-lg text-xs text-center px-1"
                    />
                  </td>
                  <td className="p-1.5">
                    <select
                      value={item.satuan3}
                      onChange={e => onUpdate(idx, 'satuan3', e.target.value)}
                      className="w-full h-9 rounded-lg border border-slate-200 text-xs px-2 bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      {satuanOptions.map(s => <option key={s} value={s}>{s || 'Pilih'}</option>)}
                    </select>
                  </td>
                  <td className="p-1.5">
                    <Input
                      type="number" min={0}
                      value={item.harga_satuan === 0 ? '' : item.harga_satuan}
                      placeholder="0"
                      onKeyDown={handlePositiveNumberKeyDown}
                      onChange={e => onUpdate(idx, 'harga_satuan', e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                      className="h-9 rounded-lg text-xs text-right px-2"
                    />
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-slate-800 bg-slate-50/50 whitespace-nowrap">
                    {formatCurrency(calcTotal(item))}
                  </td>
                  <td className="p-1.5 text-center">
                    <Button
                      type="button" variant="ghost" size="icon"
                      className="text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg h-8 w-8"
                      onClick={() => onRemove(idx)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
            {items.length > 0 && (
              <tfoot>
                <tr className="bg-emerald-50 border-t border-emerald-100">
                  <td colSpan={9} className="px-4 py-3 text-right font-bold text-emerald-900 text-xs uppercase tracking-wider">
                    Subtotal {title}:
                  </td>
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

// ──────────────── Verifikator Modal ────────────────
function VerifikatorModal({
  open, onClose, onConfirm, isSubmitting
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (target: string) => void;
  isSubmitting: boolean;
}) {
  const [selected, setSelected] = useState('');

  if (!open) return null;

  const options = [
    { value: 'wadir1', label: 'Wadir I', desc: 'Bidang Akademik' },
    { value: 'wadir2', label: 'Wadir II', desc: 'Bidang Administrasi & Keuangan' },
    { value: 'wadir3', label: 'Wadir III', desc: 'Bidang Kemahasiswaan & Alumni' },
    { value: 'wadir4', label: 'Wadir IV', desc: 'Bidang Kerjasama & Perencanaan' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="bg-gradient-to-r from-[#0B6B4A] to-[#047857] p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          >
            <X className="size-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2.5 rounded-xl">
              <CheckCircle className="size-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Pilih Verifikator Wadir</h3>
              <p className="text-white/80 text-sm">Tentukan tujuan verifikasi usulan</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-3">
          <p className="text-sm text-slate-600 mb-4">
            Tentukan Wakil Direktur tujuan verifikasi untuk usulan ini. Pengajuan akan diarahkan ke pilihan Anda.
          </p>
          {options.map(opt => (
            <label
              key={opt.value}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selected === opt.value
                  ? 'border-[#047857] bg-emerald-50'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="verifikator_target"
                value={opt.value}
                checked={selected === opt.value}
                onChange={() => setSelected(opt.value)}
                className="accent-[#047857] size-4"
              />
              <div>
                <div className="font-semibold text-slate-800">{opt.label}</div>
                <div className="text-xs text-slate-500">{opt.desc}</div>
              </div>
            </label>
          ))}
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <Button
            type="button" variant="outline"
            className="flex-1 rounded-xl h-12"
            onClick={onClose}
          >
            Batal
          </Button>
          <Button
            type="button"
            className="flex-1 rounded-xl h-12 bg-[#047857] hover:bg-[#065F46] text-white font-bold"
            disabled={!selected || isSubmitting}
            onClick={() => onConfirm(selected)}
          >
            {isSubmitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Send className="size-4 mr-2" />}
            {isSubmitting ? 'Mengirim...' : 'Kirim Usulan'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ──────────────── Main Page ────────────────
export function CreateUsulanPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [currentDraftId, setCurrentDraftId] = useState<string | number | null>(id || null);
  const [isLoadingDraft, setIsLoadingDraft] = useState(!!id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [ikuMasterList, setIkuMasterList] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draftSaving, setDraftSaving] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const isInitialLoad = useRef(true);
  const hasSubmitted = useRef(false);

  // BUG-013/015: localStorage draft key
  const DRAFT_KEY = 'silatorjana_draft_usulan';

  // BUG-003: Tanggal minimum = hari ini
  const todayStr = new Date().toISOString().split('T')[0];
  const [showVerifikatorModal, setShowVerifikatorModal] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) { navigate('/login'); return; }
    setCurrentUser(user);

    const fallbackIku = [
      { id: 1, nama_indikator: 'Lulusan Mendapat Pekerjaan yang Layak', is_visible: true },
      { id: 2, nama_indikator: 'Mahasiswa Mendapat Pengalaman di Luar Kampus', is_visible: true },
      { id: 3, nama_indikator: 'Dosen Berkegatan di Luar Kampus', is_visible: true },
      { id: 4, nama_indikator: 'Praktisi Mengajar di Dalam Kampus', is_visible: true },
      { id: 5, nama_indikator: 'Hasil Kerja Dosen Digunakan oleh Masyarakat', is_visible: true },
      { id: 6, nama_indikator: 'Program Studi Bekerja sama dengan Mitra Kelas Dunia', is_visible: true },
      { id: 7, nama_indikator: 'Kelas yang Kolaboratif dan Partisipatif', is_visible: true },
      { id: 8, nama_indikator: 'Program Studi Bestandar Internasional', is_visible: true },
    ];

    // Fetch IKU master list
    api.get('/api/iku-master')
      .then((res: any) => {
        let data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        data = data.filter((item: any) => item.is_visible !== false);
        if (data.length === 0) data = fallbackIku;
        setIkuMasterList(data);
      })
      .catch(() => {
        setIkuMasterList(fallbackIku);
      });
  }, [navigate]);

  // ── Form State (BUG-013: load from localStorage if available) ──
  const savedDraft = (() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed.draftId === id || (!parsed.draftId && !id)) {
        return parsed;
      }
      return null;
    } catch { return null; }
  })();

  const [step1, setStep1] = useState(savedDraft?.step1 || {
    nama_kegiatan: '',
    jenis_kegiatan: '',
    tanggal_kegiatan: '',
    tempat: '',
    pengusul_organisasi: '',
  });

  const [step2, setStep2] = useState(savedDraft?.step2 || {
    gambaran_umum: '',
    penerima_manfaat: '',
    strategi_pencapaian: '',
    metode_pelaksanaan: '',
    tahapan_pelaksanaan: '',
    kurun_waktu_dari: '',
    kurun_waktu_sampai: '',
  });

  const [indikatorRows, setIndikatorRows] = useState<IndikatorRow[]>(savedDraft?.indikatorRows || []);
  const [ikuItems, setIkuItems] = useState<IkuItem[]>(savedDraft?.ikuItems || []);

  const [rabBarang, setRabBarang] = useState<RabItem[]>(savedDraft?.rabBarang || [emptyRab()]);
  const [rabJasa, setRabJasa]     = useState<RabItem[]>(savedDraft?.rabJasa || [emptyRab()]);
  const [rabPerjalanan, setRabPerjalanan] = useState<RabItem[]>(savedDraft?.rabPerjalanan || [emptyRab()]);

  // BUG-008 Draft Edit Mode: Fetch existing draft from DB if `id` is present
  useEffect(() => {
    if (!id) return;
    setIsLoadingDraft(true);
    (async () => {
      try {
        const doc = await apiGetKegiatan(id);
        const [kakData, ikuData, rabData] = await Promise.all([fetchKAK(id), fetchIKU(id), fetchRAB(id)]);

        setStep1({
          nama_kegiatan: doc.nama_kegiatan || '',
          jenis_kegiatan: doc.jenis_kegiatan || '',
          tanggal_kegiatan: doc.tanggal_kegiatan || '',
          tempat: doc.tempat || '',
          pengusul_organisasi: doc.pengusul_organisasi || '',
        });

        if (kakData) {
          setStep2({
            gambaran_umum: kakData.gambaran_umum || '',
            penerima_manfaat: kakData.penerima_manfaat || '',
            strategi_pencapaian: kakData.strategi_pencapaian || '',
            metode_pelaksanaan: kakData.metode_pelaksanaan || '',
            tahapan_pelaksanaan: kakData.tahapan_pelaksanaan || '',
            kurun_waktu_dari: kakData.kurun_waktu_mulai || '',
            kurun_waktu_sampai: kakData.kurun_waktu_selesai || '',
          });
          if (kakData.indikator && kakData.indikator.length > 0) {
            let inds = kakData.indikator;
            if (typeof inds === 'string') { try { inds = JSON.parse(inds); } catch(e) {} }
            if (Array.isArray(inds)) setIndikatorRows(inds);
          }
        }

        if (ikuData && ikuData.length > 0) {
          setIkuItems(ikuData.map((it: any) => ({
            nama_indikator: it.nama_iku || it.indikator || '',
            target_persen: it.target_persen
          })));
        }

        if (rabData && rabData.length > 0) {
          const mapRab = (cat: string) => {
            const filtered = rabData.filter((r: any) => r.kategori === cat);
            if (filtered.length === 0) return [emptyRab()];
            return filtered.map((r: any) => ({
              uraian: r.uraian || '',
              qty1: r.qty1 || 1, satuan1: r.satuan1 || '',
              qty2: r.qty2 || 1, satuan2: r.satuan2 || '',
              qty3: r.qty3 ?? null, satuan3: r.satuan3 || '',
              harga_satuan: r.harga_satuan || 0,
            }));
          };
          setRabBarang(mapRab('barang'));
          setRabJasa(mapRab('jasa'));
          setRabPerjalanan(mapRab('perjalanan'));
        }
      } catch (err) {
        console.error('Failed to load draft:', err);
      } finally {
        setIsLoadingDraft(false);
      }
    })();
  }, [id]);

  // BUG-013/015: Auto-save draft to localStorage on any change
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    if (isLoadingDraft) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          step1, step2, indikatorRows, ikuItems, rabBarang, rabJasa, rabPerjalanan, currentStep,
          draftId: id || null,
        }));
      } catch {}
    }, 500);
    return () => clearTimeout(timer);
  }, [step1, step2, indikatorRows, ikuItems, rabBarang, rabJasa, rabPerjalanan, currentStep, isLoadingDraft, id]);

  // Flush draft on beforeunload / unmount to avoid losing draft on fast navigation/refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isLoadingDraft) {
        try {
          localStorage.setItem(DRAFT_KEY, JSON.stringify({
            step1, step2, indikatorRows, ikuItems, rabBarang, rabJasa, rabPerjalanan, currentStep,
            draftId: id || null,
          }));
        } catch {}
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload(); // run on unmount
    };
  }, [step1, step2, indikatorRows, ikuItems, rabBarang, rabJasa, rabPerjalanan, currentStep, isLoadingDraft, id]);

  // State ref for unmount cleanup auto-save
  const stateRef = useRef({
    step1, step2, indikatorRows, ikuItems, rabBarang, rabJasa, rabPerjalanan, currentStep, currentDraftId, currentUser
  });

  useEffect(() => {
    stateRef.current = {
      step1, step2, indikatorRows, ikuItems, rabBarang, rabJasa, rabPerjalanan, currentStep, currentDraftId, currentUser
    };
  }, [step1, step2, indikatorRows, ikuItems, rabBarang, rabJasa, rabPerjalanan, currentStep, currentDraftId, currentUser]);

  // Save draft to database when component unmounts (auto-save draft)
  useEffect(() => {
    return () => {
      if (hasSubmitted.current) return;
      const state = stateRef.current;
      if (!state.currentUser) return;

      const hasContent = state.step1.nama_kegiatan?.trim() || state.step1.jenis_kegiatan?.trim() || state.step2.gambaran_umum?.trim();
      if (!hasContent) return;

      const payload: Record<string, any> = {
        nama_kegiatan: state.step1.nama_kegiatan || 'Draft Usulan',
        jenis_kegiatan: state.step1.jenis_kegiatan || null,
        tempat: state.step1.tempat || null,
        pengusul_organisasi: state.step1.pengusul_organisasi || null,
        status: 'draft',
      };
      if (state.step1.tanggal_kegiatan) payload.tanggal_kegiatan = state.step1.tanggal_kegiatan;

      payload.kak = {
        gambaran_umum: state.step2.gambaran_umum || null,
        penerima_manfaat: state.step2.penerima_manfaat || null,
        strategi_pencapaian: state.step2.strategi_pencapaian || null,
        metode_pelaksanaan: state.step2.metode_pelaksanaan || null,
        tahapan_pelaksanaan: state.step2.tahapan_pelaksanaan || null,
        kurun_waktu_mulai: state.step2.kurun_waktu_dari || null,
        kurun_waktu_selesai: state.step2.kurun_waktu_sampai || null,
        indikator: state.indikatorRows.map(r => ({ bulan: r.bulan, indikator: r.indikator, target: r.target })),
      };

      payload.iku = state.ikuItems
        .filter(i => i.nama_indikator.trim())
        .map(i => ({ nama_iku: i.nama_indikator, target_persen: i.target_persen }));

      const toRabPayload = (items: RabItem[], kategori: string) =>
        items.filter(it => it.uraian.trim()).map(it => ({
          kategori, uraian: it.uraian, qty1: it.qty1, satuan1: it.satuan1,
          qty2: it.qty2, satuan2: it.satuan2, qty3: it.qty3 ?? null, satuan3: it.satuan3,
          harga_satuan: it.harga_satuan,
        }));

      payload.rab = [
        ...toRabPayload(state.rabBarang, 'barang'),
        ...toRabPayload(state.rabJasa, 'jasa'),
        ...toRabPayload(state.rabPerjalanan, 'perjalanan'),
      ];

      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const targetId = state.currentDraftId;
      const url = targetId ? `/api/kegiatan/${targetId}` : '/api/kegiatan';
      const method = targetId ? 'PUT' : 'POST';

      fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(err => console.error('Auto-save on unmount failed:', err));

      try { localStorage.removeItem('silatorjana_draft_usulan'); } catch {}
    };
  }, []);

  // Restore step from draft
  useEffect(() => {
    if (savedDraft?.currentStep) {
      setCurrentStep(savedDraft.currentStep);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // BUG-015: Clear draft after successful submit
  const clearDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
  };

  // BUG-015: Save draft to DATABASE
  const saveDraft = async () => {
    if (!currentUser) return;
    setDraftSaving(true);
    try {
      const payload: Record<string, any> = {
        nama_kegiatan: step1.nama_kegiatan || 'Draft Usulan',
        jenis_kegiatan: step1.jenis_kegiatan || null,
        tempat: step1.tempat || null,
        pengusul_organisasi: step1.pengusul_organisasi || null,
        status: 'draft',
      };
      if (step1.tanggal_kegiatan) payload.tanggal_kegiatan = step1.tanggal_kegiatan;

      payload.kak = {
        gambaran_umum: step2.gambaran_umum || null,
        penerima_manfaat: step2.penerima_manfaat || null,
        strategi_pencapaian: step2.strategi_pencapaian || null,
        metode_pelaksanaan: step2.metode_pelaksanaan || null,
        tahapan_pelaksanaan: step2.tahapan_pelaksanaan || null,
        kurun_waktu_mulai: step2.kurun_waktu_dari || null,
        kurun_waktu_selesai: step2.kurun_waktu_sampai || null,
        indikator: indikatorRows.map(r => ({ bulan: r.bulan, indikator: r.indikator, target: r.target })),
      };

      payload.iku = ikuItems
        .filter(i => i.nama_indikator.trim())
        .map(i => ({ nama_iku: i.nama_indikator, target_persen: i.target_persen }));

      const toRabPayload = (items: RabItem[], kategori: string) =>
        items.filter(it => it.uraian.trim()).map(it => ({
          kategori, uraian: it.uraian, qty1: it.qty1, satuan1: it.satuan1,
          qty2: it.qty2, satuan2: it.satuan2, qty3: it.qty3 ?? null, satuan3: it.satuan3,
          harga_satuan: it.harga_satuan,
        }));

      payload.rab = [
        ...toRabPayload(rabBarang, 'barang'),
        ...toRabPayload(rabJasa, 'jasa'),
        ...toRabPayload(rabPerjalanan, 'perjalanan'),
      ];

      let result;
      if (id || currentDraftId) {
        result = await apiUpdateKegiatan(id || currentDraftId, payload);
      } else {
        result = await apiCreateKegiatan(payload);
        if (result && result.id) {
          setCurrentDraftId(result.id);
          window.history.replaceState(null, '', `/dashboard/pengusul/usulan/edit/${result.id}`);
        }
      }
      clearDraft();
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 3000);
    } catch (error: any) {
      console.error(error);
      const errMsg = error?.response?.data?.message || error.message;
      setErrors(prev => ({ ...prev, submit: 'Gagal menyimpan draft: ' + errMsg }));
    } finally {
      setDraftSaving(false);
    }
  };

  const handleGoBack = async () => {
    await saveDraft();
    navigate('/dashboard/pengusul/usulan');
  };

  // ── Helpers ──
  const makeRabUpdater = (setter: React.Dispatch<React.SetStateAction<RabItem[]>>) =>
    (i: number, field: keyof RabItem, val: any) =>
      setter(prev => { const n = [...prev]; (n[i] as any)[field] = val; return n; });

  const totalRab = [rabBarang, rabJasa, rabPerjalanan]
    .flat()
    .reduce((s, it) => s + calcTotal(it), 0);

  // ── Submit ──
  const doSubmit = async (verifikatorTarget: string) => {
    if (!currentUser) return;
    setIsSubmitting(true);
    try {
      const payload: Record<string, any> = {
        nama_kegiatan: step1.nama_kegiatan,
        jenis_kegiatan: step1.jenis_kegiatan || null,
        tempat: step1.tempat || null,
        pengusul_organisasi: step1.pengusul_organisasi || null,
        status: 'submitted',
        verifikator_target: verifikatorTarget,
      };
      if (step1.tanggal_kegiatan) payload.tanggal_kegiatan = step1.tanggal_kegiatan;

      payload.kak = {
        gambaran_umum: step2.gambaran_umum || null,
        penerima_manfaat: step2.penerima_manfaat || null,
        strategi_pencapaian: step2.strategi_pencapaian || null,
        metode_pelaksanaan: step2.metode_pelaksanaan || null,
        tahapan_pelaksanaan: step2.tahapan_pelaksanaan || null,
        kurun_waktu_mulai: step2.kurun_waktu_dari || null,
        kurun_waktu_selesai: step2.kurun_waktu_sampai || null,
        indikator: indikatorRows.map(r => ({
          bulan: r.bulan,
          indikator: r.indikator,
          target: r.target,
        })),
      };

      payload.iku = ikuItems
        .filter(i => i.nama_indikator.trim())
        .map(i => ({ nama_iku: i.nama_indikator, target_persen: i.target_persen }));

      const toRabPayload = (items: RabItem[], kategori: string) =>
        items
          .filter(it => it.uraian.trim())
          .map(it => ({
            kategori,
            uraian: it.uraian,
            qty1: it.qty1,
            satuan1: it.satuan1,
            qty2: it.qty2,
            satuan2: it.satuan2,
            qty3: it.qty3 ?? null,
            satuan3: it.satuan3,
            harga_satuan: it.harga_satuan,
          }));

      payload.rab = [
        ...toRabPayload(rabBarang, 'barang'),
        ...toRabPayload(rabJasa, 'jasa'),
        ...toRabPayload(rabPerjalanan, 'perjalanan'),
      ];

      hasSubmitted.current = true;
      if (id || currentDraftId) {
        await apiUpdateKegiatan(id || currentDraftId, payload);
      } else {
        await apiCreateKegiatan(payload);
      }
      clearDraft(); // BUG-015: Clear draft after successful submit
      navigate('/dashboard/pengusul/usulan');
    } catch (error: any) {
      console.error(error);
      const errMsg = error?.response?.data?.message || error.message;
      setErrors(prev => ({ ...prev, submit: 'Gagal mengirim usulan: ' + errMsg }));
    } finally {
      setIsSubmitting(false);
      setShowVerifikatorModal(false);
    }
  };



  // ── Indikator helpers ──
  const addIndikatorRow = () =>
    setIndikatorRows(prev => [...prev, { bulan: '', indikator: '', target: null }]);
  const removeIndikatorRow = (i: number) =>
    setIndikatorRows(prev => prev.filter((_, idx) => idx !== i));
  const updateIndikator = (i: number, field: keyof IndikatorRow, val: any) =>
    setIndikatorRows(prev => { const n = [...prev]; (n[i] as any)[field] = val; return n; });

  // ── IKU helpers ──
  const addIku = () => setIkuItems(prev => [...prev, { nama_indikator: '', target_persen: null }]);
  const removeIku = (i: number) => setIkuItems(prev => prev.filter((_, idx) => idx !== i));
  const updateIku = (i: number, field: keyof IkuItem, val: any) =>
    setIkuItems(prev => { const n = [...prev]; (n[i] as any)[field] = val; return n; });

  // ── BUG-001: Validasi Step 1 ──
  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!step1.nama_kegiatan.trim()) errs.nama_kegiatan = 'Nama kegiatan wajib diisi';
    if (!step1.jenis_kegiatan.trim()) errs.jenis_kegiatan = 'Jenis kegiatan wajib diisi';
    if (!step1.tanggal_kegiatan) errs.tanggal_kegiatan = 'Tanggal kegiatan wajib diisi';
    else if (step1.tanggal_kegiatan < todayStr) errs.tanggal_kegiatan = 'Tidak bisa memilih tanggal yang sudah lewat';
    if (!step1.tempat.trim()) errs.tempat = 'Tempat / lokasi wajib diisi';
    if (!step1.pengusul_organisasi.trim()) errs.pengusul_organisasi = 'Pengusul / organisasi wajib diisi';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── BUG-002: Validasi Step 2 ──
  const validateStep2 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!step2.gambaran_umum.trim()) errs.gambaran_umum = 'Gambaran umum wajib diisi';
    if (!step2.penerima_manfaat.trim()) errs.penerima_manfaat = 'Penerima manfaat wajib diisi';
    if (!step2.strategi_pencapaian.trim()) errs.strategi_pencapaian = 'Strategi pencapaian wajib diisi';
    if (!step2.metode_pelaksanaan.trim()) errs.metode_pelaksanaan = 'Metode pelaksanaan wajib diisi';
    if (!step2.tahapan_pelaksanaan.trim()) errs.tahapan_pelaksanaan = 'Tahapan pelaksanaan wajib diisi';
    if (!step2.kurun_waktu_dari) errs.kurun_waktu_dari = 'Kurun waktu mulai wajib diisi';
    if (!step2.kurun_waktu_sampai) errs.kurun_waktu_sampai = 'Kurun waktu selesai wajib diisi';

    // Validate indikatorRows (Indikator Keberhasilan)
    if (indikatorRows.length === 0) {
      errs.indikator_global = 'Minimal 1 Indikator Kinerja Keberhasilan harus ditambahkan';
    } else {
      indikatorRows.forEach((row, idx) => {
        if (!row.bulan) errs[`indikator_bulan_${idx}`] = 'Bulan wajib dipilih';
        if (!row.indikator.trim()) errs[`indikator_nama_${idx}`] = 'Indikator keberhasilan wajib diisi';
        if (row.target === null || row.target === undefined) {
          errs[`indikator_target_${idx}`] = 'Target wajib diisi';
        } else if (row.target < 0) {
          errs[`indikator_target_${idx}`] = 'Target tidak boleh negatif';
        } else if (row.target > 100) {
          errs[`indikator_target_${idx}`] = 'Target tidak boleh lebih dari 100%';
        }
      });
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── BUG-004: Validasi Step 3 ──
  const validateStep3 = (): boolean => {
    const errs: Record<string, string> = {};
    if (ikuItems.length === 0) {
      errs.iku_global = 'Minimal 1 indikator IKU harus ditambahkan';
    } else {
      ikuItems.forEach((item, idx) => {
        if (!item.nama_indikator.trim()) errs[`iku_nama_${idx}`] = 'Indikator wajib dipilih';
        if (item.target_persen === null || item.target_persen === undefined) {
          errs[`iku_target_${idx}`] = 'Target wajib diisi';
        } else if (item.target_persen < 0) {
          errs[`iku_target_${idx}`] = 'Target tidak boleh negatif';
        } else if (item.target_persen > 100) {
          errs[`iku_target_${idx}`] = 'Target tidak boleh lebih dari 100%';
        }
      });
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── BUG-014: Validasi Step 4 (RAB tidak boleh kosong) ──
  const validateStep4 = (): boolean => {
    const errs: Record<string, string> = {};
    const allRab = [...rabBarang, ...rabJasa, ...rabPerjalanan];
    const filledRab = allRab.filter(it => it.uraian.trim() && Number(it.harga_satuan) > 0);
    if (filledRab.length === 0) {
      errs.rab_global = 'Minimal 1 item RAB harus diisi lengkap (uraian dan harga satuan)';
    }
    if (totalRab <= 0) {
      errs.rab_total = 'Total anggaran harus lebih dari Rp 0';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => {
    let valid = false;
    if (currentStep === 1) valid = validateStep1();
    else if (currentStep === 2) valid = validateStep2();
    else if (currentStep === 3) valid = validateStep3();
    else valid = true;
    if (valid) {
      setErrors({});
      setCurrentStep(prev => prev + 1);
    }
  };

  const steps = [
    { id: 1, name: 'Info Kegiatan' },
    { id: 2, name: 'Kerangka Acuan (KAK)' },
    { id: 3, name: 'Indikator Kinerja (IKU)' },
    { id: 4, name: 'Anggaran (RAB)' },
  ];

  return (
    <>
      <VerifikatorModal
        open={showVerifikatorModal}
        onClose={() => setShowVerifikatorModal(false)}
        onConfirm={doSubmit}
        isSubmitting={isSubmitting}
      />

      <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="flex items-center gap-4 py-4 border-b border-slate-100">
          <Button variant="outline" size="icon" onClick={handleGoBack} className="h-10 w-10 sm:h-11 sm:w-11 border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 shadow-sm transition-all rounded-xl shrink-0">
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Buat Usulan Baru</h2>
            <p className="text-slate-500 mt-1">Isi formulir terpadu untuk Informasi Kegiatan, KAK, IKU, dan RAB.</p>
          </div>
        </div>

        {/* Step Progress */}
        <div className="flex items-center gap-2 sm:gap-4 py-4 mt-2 overflow-x-auto hide-scrollbar">
          {steps.map((step, idx) => (
            <React.Fragment key={step.id}>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <div className={`flex shrink-0 items-center justify-center size-8 sm:size-10 rounded-full font-bold transition-all text-sm sm:text-base ${currentStep === step.id ? 'bg-[#047857] text-white shadow-md' : currentStep > step.id ? 'bg-emerald-100 text-[#047857]' : 'bg-slate-100 text-slate-400'}`}>
                  {step.id}
                </div>
                <span className={`font-semibold text-xs sm:text-sm whitespace-nowrap ${currentStep === step.id ? 'text-slate-900' : currentStep > step.id ? 'text-[#047857]' : 'text-slate-400'}`}>{step.name}</span>
              </div>
              {idx < 3 && <div className={`flex-1 min-w-[20px] h-1 rounded-full ${currentStep > step.id ? 'bg-emerald-500' : 'bg-slate-100'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="space-y-10 mt-2">
          
          {errors.submit && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 font-semibold mb-6 flex items-center justify-between">
              <div>
                 <span className="block text-sm">Gagal Mengirim Usulan</span>
                 <span className="block text-xs font-normal mt-1">{errors.submit}</span>
                 <span className="block text-xs font-normal mt-1">Saran: Silakan cek apakah backend Laravel di laptopmu sudah menyala dan URL sudah tersambung, contoh: jika pakai SSH tunnel pastikan perintah ssh belum mati.</span>
              </div>
              <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => setErrors(prev => { const n = {...prev}; delete n.submit; return n; })}>
                <X className="size-4" />
              </Button>
            </div>
          )}

          {/* ══════════════ STEP 1: INFO KEGIATAN ══════════════ */}
          <div className={currentStep !== 1 ? 'hidden' : 'space-y-6'}>
            <Card className="shadow-sm border-slate-200/60 bg-white overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
              <CardHeader className="bg-slate-50/30 border-b border-slate-100/60 py-5 pl-6 sm:pl-8 pr-4 sm:pr-6">
                <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
                  <div className="flex items-center justify-center size-6 rounded-md bg-blue-100 text-blue-700 text-sm font-bold">1</div>
                  Informasi Utama Kegiatan
                </CardTitle>
                <CardDescription className="text-slate-500 ml-8 font-medium">Detail dasar mendefinisikan kegiatan yang akan diusulkan.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6 pl-6 sm:pl-8 pr-4 sm:pr-6">
                {/* Nama & Jenis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="nama_kegiatan" className="text-slate-700 font-semibold">Nama Kegiatan <span className="text-red-500">*</span></Label>
                    <Input
                      id="nama_kegiatan"
                      value={step1.nama_kegiatan}
                      onChange={e => { setStep1({ ...step1, nama_kegiatan: e.target.value }); setErrors(prev => { const n = {...prev}; delete n.nama_kegiatan; return n; }); }}
                      placeholder="Cth: Seminar Teknik Informatika 2025"
                      required
                      className={`h-12 rounded-xl focus-visible:ring-blue-500/20 focus-visible:border-blue-500 shadow-sm ${errors.nama_kegiatan ? 'border-red-400 bg-red-50/30' : ''}`}
                    />
                    {errors.nama_kegiatan && <p className="text-xs text-red-500 font-medium">{errors.nama_kegiatan}</p>}
                    <p className="text-xs text-slate-500">Gunakan nama yang deskriptif dan mudah dipahami</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jenis_kegiatan" className="text-slate-700 font-semibold">Jenis Kegiatan <span className="text-red-500">*</span></Label>
                    <Input
                      id="jenis_kegiatan"
                      value={step1.jenis_kegiatan}
                      onChange={e => { setStep1({ ...step1, jenis_kegiatan: e.target.value }); setErrors(prev => { const n = {...prev}; delete n.jenis_kegiatan; return n; }); }}
                      placeholder="Cth: Seminar / Workshop / Pelatihan"
                      className={`h-12 rounded-xl focus-visible:ring-blue-500/20 focus-visible:border-blue-500 shadow-sm ${errors.jenis_kegiatan ? 'border-red-400 bg-red-50/30' : ''}`}
                    />
                    {errors.jenis_kegiatan && <p className="text-xs text-red-500 font-medium">{errors.jenis_kegiatan}</p>}
                    <p className="text-xs text-slate-500">Contoh: Seminar, Workshop, Pelatihan, dll</p>
                  </div>
                </div>

                {/* Jurusan & Pengusul */}
                <div className="rounded-xl bg-gradient-to-br from-slate-50 to-emerald-50 border border-emerald-100 p-5 space-y-4">
                  <h4 className="text-sm font-bold text-[#047857] flex items-center gap-2">
                    <Building2 className="size-4" />
                    Pengelola &amp; Penanggung Jawab
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold">Jurusan</Label>
                      <Input
                        value={currentUser?.jurusan || currentUser?.nama_jurusan || ''}
                        readOnly
                        className="h-12 rounded-xl bg-slate-100 border-slate-200 text-slate-600 cursor-not-allowed"
                      />
                      <p className="text-xs text-slate-500">Jurusan/Departemen otomatis sesuai akun Anda</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pengusul_organisasi" className="text-slate-700 font-semibold">Pengusul / Organisasi <span className="text-red-500">*</span></Label>
                      <Input
                        id="pengusul_organisasi"
                        value={step1.pengusul_organisasi}
                        onChange={e => { setStep1({ ...step1, pengusul_organisasi: e.target.value }); setErrors(prev => { const n = {...prev}; delete n.pengusul_organisasi; return n; }); }}
                        placeholder="Cth: Himpunan Mahasiswa Teknik Informatika"
                        className={`h-12 rounded-xl focus-visible:ring-blue-500/20 shadow-sm ${errors.pengusul_organisasi ? 'border-red-400 bg-red-50/30' : ''}`}
                      />
                      {errors.pengusul_organisasi && <p className="text-xs text-red-500 font-medium">{errors.pengusul_organisasi}</p>}
                      <p className="text-xs text-slate-500">Organisasi atau individu yang mengajukan kegiatan</p>
                    </div>
                  </div>
                </div>

                {/* Tanggal & Tempat */}
                <div className="rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100 p-5 space-y-4">
                  <h4 className="text-sm font-bold text-amber-800 flex items-center gap-2">
                    <Calendar className="size-4" /> Waktu &amp; Lokasi Kegiatan
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="tanggal_kegiatan" className="text-slate-700 font-semibold">Tanggal Kegiatan <span className="text-red-500">*</span></Label>
                      <Input
                        type="date" id="tanggal_kegiatan"
                        value={step1.tanggal_kegiatan}
                        min={todayStr}
                        onChange={e => { setStep1({ ...step1, tanggal_kegiatan: e.target.value }); setErrors(prev => { const n = {...prev}; delete n.tanggal_kegiatan; return n; }); }}
                        className={`h-12 rounded-xl focus-visible:ring-amber-500/20 ${errors.tanggal_kegiatan ? 'border-red-400 bg-red-50/30' : ''}`}
                      />
                      {errors.tanggal_kegiatan && <p className="text-xs text-red-500 font-medium">{errors.tanggal_kegiatan}</p>}
                      <p className="text-xs text-slate-500">Kapan kegiatan akan dilaksanakan?</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tempat" className="text-slate-700 font-semibold">Tempat / Lokasi <span className="text-red-500">*</span></Label>
                      <Input
                        id="tempat"
                        value={step1.tempat}
                        onChange={e => { setStep1({ ...step1, tempat: e.target.value }); setErrors(prev => { const n = {...prev}; delete n.tempat; return n; }); }}
                        placeholder="Cth: Ruang Aula Gedung Utama, Lt. 3"
                        className={`h-12 rounded-xl focus-visible:ring-amber-500/20 ${errors.tempat ? 'border-red-400 bg-red-50/30' : ''}`}
                      />
                      {errors.tempat && <p className="text-xs text-red-500 font-medium">{errors.tempat}</p>}
                      <p className="text-xs text-slate-500">Lokasi yang spesifik dan jelas</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ══════════════ STEP 2: KAK ══════════════ */}
          <div className={currentStep !== 2 ? 'hidden' : 'space-y-6'}>
            <Card className="shadow-sm border-slate-200/60 bg-white overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
              <CardHeader className="bg-slate-50/30 border-b border-slate-100/60 py-5 pl-6 sm:pl-8 pr-4 sm:pr-6">
                <CardTitle className="text-lg text-indigo-900 flex items-center gap-2">
                  <div className="flex items-center justify-center size-6 rounded-md bg-indigo-100 text-indigo-700 text-sm font-bold">2</div>
                  Kerangka Acuan Kerja (KAK)
                </CardTitle>
                <CardDescription className="text-slate-500 ml-8 font-medium">Uraikan konsep operasional, strategi, dan penerima manfaat kegiatan.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6 pl-6 sm:pl-8 pr-4 sm:pr-6">
                {/* Gambaran Umum */}
                <div className="rounded-xl bg-gradient-to-br from-slate-50 to-emerald-50 border border-emerald-100 p-5 space-y-4">
                  <h4 className="text-sm font-bold text-[#047857] flex items-center gap-2"><FileText className="size-4" /> Gambaran Umum Kegiatan</h4>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold">Gambaran Umum Acara <span className="text-red-500">*</span></Label>
                    <textarea
                      className={`flex min-h-[120px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/10 focus-visible:border-indigo-500 transition-all resize-none ${errors.gambaran_umum ? 'border-red-400 bg-red-50/30' : ''}`}
                      placeholder="Jelaskan secara singkat tentang acara/kegiatan yang akan dilaksanakan, tujuan, dan latar belakang"
                      value={step2.gambaran_umum}
                      onChange={e => { setStep2({ ...step2, gambaran_umum: e.target.value }); setErrors(prev => { const n = {...prev}; delete n.gambaran_umum; return n; }); }}
                      required
                    />
                    {errors.gambaran_umum && <p className="text-xs text-red-500 font-medium">{errors.gambaran_umum}</p>}
                    <p className="text-xs text-slate-500">Jelaskan latar belakang, tujuan, dan deskripsi kegiatan</p>
                  </div>
                </div>

                {/* Penerima Manfaat */}
                <div className="rounded-xl bg-gradient-to-br from-slate-50 to-emerald-50 border border-emerald-100 p-5 space-y-4">
                  <h4 className="text-sm font-bold text-[#047857] flex items-center gap-2"><Users className="size-4" /> Penerima Manfaat</h4>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold">Penerima Manfaat <span className="text-red-500">*</span></Label>
                    <textarea
                      className={`flex min-h-[100px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/10 focus-visible:border-indigo-500 transition-all resize-none ${errors.penerima_manfaat ? 'border-red-400 bg-red-50/30' : ''}`}
                      placeholder="Sebutkan siapa saja yang akan menerima manfaat dari kegiatan ini"
                      value={step2.penerima_manfaat}
                      onChange={e => { setStep2({ ...step2, penerima_manfaat: e.target.value }); setErrors(prev => { const n = {...prev}; delete n.penerima_manfaat; return n; }); }}
                      required
                    />
                    {errors.penerima_manfaat && <p className="text-xs text-red-500 font-medium">{errors.penerima_manfaat}</p>}
                  </div>
                </div>

                {/* Strategi Pelaksanaan */}
                <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-5 space-y-4">
                  <h4 className="text-sm font-bold text-indigo-800 flex items-center gap-2"><Lightbulb className="size-4" /> Strategi Pelaksanaan</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold">Metode Pelaksanaan <span className="text-red-500">*</span></Label>
                      <textarea
                        className={`flex min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/10 focus-visible:border-indigo-500 transition-all resize-none ${errors.metode_pelaksanaan ? 'border-red-400 bg-red-50/30' : ''}`}
                        placeholder="Contoh: Seminar interaktif, diskusi kelompok, workshop praktik, dll"
                        value={step2.metode_pelaksanaan}
                        onChange={e => { setStep2({ ...step2, metode_pelaksanaan: e.target.value }); setErrors(prev => { const n = {...prev}; delete n.metode_pelaksanaan; return n; }); }}
                      />
                      {errors.metode_pelaksanaan && <p className="text-xs text-red-500 font-medium">{errors.metode_pelaksanaan}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold">Tahapan Pelaksanaan <span className="text-red-500">*</span></Label>
                      <textarea
                        className={`flex min-h-[100px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/10 focus-visible:border-indigo-500 transition-all resize-none ${errors.tahapan_pelaksanaan ? 'border-red-400 bg-red-50/30' : ''}`}
                        placeholder="Contoh: 1) Persiapan, 2) Pelaksanaan, 3) Evaluasi"
                        value={step2.tahapan_pelaksanaan}
                        onChange={e => { setStep2({ ...step2, tahapan_pelaksanaan: e.target.value }); setErrors(prev => { const n = {...prev}; delete n.tahapan_pelaksanaan; return n; }); }}
                      />
                      {errors.tahapan_pelaksanaan && <p className="text-xs text-red-500 font-medium">{errors.tahapan_pelaksanaan}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold">Strategi Pencapaian Keluaran <span className="text-red-500">*</span></Label>
                      <textarea
                        className={`flex min-h-[100px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/10 focus-visible:border-indigo-500 transition-all resize-none ${errors.strategi_pencapaian ? 'border-red-400 bg-red-50/30' : ''}`}
                        placeholder="Jelaskan strategi konkret untuk mencapai target keluaran/output kegiatan"
                        value={step2.strategi_pencapaian}
                        onChange={e => { setStep2({ ...step2, strategi_pencapaian: e.target.value }); setErrors(prev => { const n = {...prev}; delete n.strategi_pencapaian; return n; }); }}
                        required
                      />
                      {errors.strategi_pencapaian && <p className="text-xs text-red-500 font-medium">{errors.strategi_pencapaian}</p>}
                    </div>
                  </div>
                </div>

                {/* Indikator Kinerja Table */}
                <div className="rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100 p-3 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-amber-800 flex items-center gap-2">
                        <CheckSquare className="size-4 shrink-0" />
                        <span className="leading-tight">Indikator Keberhasilan</span>
                      </h4>
                      {errors.indikator_global && <span className="text-xs text-red-500 font-semibold bg-red-100 px-2 py-0.5 rounded-md">{errors.indikator_global}</span>}
                    </div>
                    <Button type="button" variant="secondary" size="sm" className="h-9 rounded-xl w-full sm:w-auto" onClick={addIndikatorRow}>
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
                                onChange={e => {
                                  updateIndikator(idx, 'bulan', e.target.value);
                                  setErrors(prev => { const n = {...prev}; delete n[`indikator_bulan_${idx}`]; return n; });
                                }}
                                className={`w-full h-11 rounded-xl border border-slate-200 text-sm px-3 bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${errors[`indikator_bulan_${idx}`] ? 'border-red-400 bg-red-50/30' : ''}`}
                              >
                                <option value="">Pilih Bulan</option>
                                {BULAN_INDONESIA.map(b => (
                                  <option key={b} value={b}>{b}</option>
                                ))}
                            </select>
                            {errors[`indikator_bulan_${idx}`] && <p className="text-xs text-red-500 font-medium mt-1">{errors[`indikator_bulan_${idx}`]}</p>}
                          </div>
                          <div>
                            <Label className="text-xs mb-1.5 block text-slate-600 font-semibold">Indikator Keberhasilan</Label>
                            <Input
                                placeholder="Contoh: Tersusunnya dokumen RPKL"
                                value={row.indikator}
                                onChange={e => {
                                  updateIndikator(idx, 'indikator', e.target.value);
                                  setErrors(prev => { const n = {...prev}; delete n[`indikator_nama_${idx}`]; return n; });
                                }}
                                className={`h-11 rounded-xl text-sm focus:ring-indigo-500/20 ${errors[`indikator_nama_${idx}`] ? 'border-red-400 bg-red-50/30' : ''}`}
                            />
                            {errors[`indikator_nama_${idx}`] && <p className="text-xs text-red-500 font-medium mt-1">{errors[`indikator_nama_${idx}`]}</p>}
                          </div>
                          <div>
                            <Label className="text-xs mb-1.5 block text-slate-600 font-semibold">Target (%)</Label>
                            <Input
                                type="number" min={0} placeholder="0"
                                value={row.target ?? ''}
                                onKeyDown={handlePositiveNumberKeyDown}
                                onChange={e => {
                                  updateIndikator(idx, 'target', e.target.value ? Math.max(0, Number(e.target.value)) : null);
                                  setErrors(prev => { const n = {...prev}; delete n[`indikator_target_${idx}`]; return n; });
                                }}
                                className={`h-11 rounded-xl text-sm focus:ring-indigo-500/20 ${errors[`indikator_target_${idx}`] ? 'border-red-400 bg-red-50/30' : ''}`}
                            />
                            {errors[`indikator_target_${idx}`] && <p className="text-xs text-red-500 font-medium mt-1">{errors[`indikator_target_${idx}`]}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Desktop View */}
                    <table className="hidden lg:table w-full text-sm text-left min-w-[640px]">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
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
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-slate-400 text-sm">
                              Belum ada indikator. Klik "Tambah Baris" untuk menambahkan.
                            </td>
                          </tr>
                        )}
                        {indikatorRows.map((row, idx) => (
                          <tr key={idx} className="bg-white hover:bg-slate-50/50 transition-colors">
                            <td className="px-3 py-2 text-center text-slate-500 text-sm font-medium">{idx + 1}</td>
                            <td className="p-1.5">
                              <select
                                value={row.bulan}
                                onChange={e => {
                                  updateIndikator(idx, 'bulan', e.target.value);
                                  setErrors(prev => { const n = {...prev}; delete n[`indikator_bulan_${idx}`]; return n; });
                                }}
                                className={`w-full h-9 rounded-lg border border-slate-200 text-sm px-2 bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${errors[`indikator_bulan_${idx}`] ? 'border-red-400 bg-red-50/30' : ''}`}
                              >
                                <option value="">Pilih Bulan</option>
                                {BULAN_INDONESIA.map(b => (
                                  <option key={b} value={b}>{b}</option>
                                ))}
                              </select>
                              {errors[`indikator_bulan_${idx}`] && <p className="text-[10px] text-red-500 mt-0.5">{errors[`indikator_bulan_${idx}`]}</p>}
                            </td>
                            <td className="p-1.5">
                              <Input
                                placeholder="Contoh: Tersusunnya dokumen RPKL"
                                value={row.indikator}
                                onChange={e => {
                                  updateIndikator(idx, 'indikator', e.target.value);
                                  setErrors(prev => { const n = {...prev}; delete n[`indikator_nama_${idx}`]; return n; });
                                }}
                                className={`h-9 rounded-lg text-sm ${errors[`indikator_nama_${idx}`] ? 'border-red-400 bg-red-50/30' : ''}`}
                              />
                              {errors[`indikator_nama_${idx}`] && <p className="text-[10px] text-red-500 mt-0.5">{errors[`indikator_nama_${idx}`]}</p>}
                            </td>
                            <td className="p-1.5">
                              <Input
                                type="number" min={0} placeholder="0"
                                value={row.target ?? ''}
                                onKeyDown={handlePositiveNumberKeyDown}
                                onChange={e => {
                                  updateIndikator(idx, 'target', e.target.value ? Math.max(0, Number(e.target.value)) : null);
                                  setErrors(prev => { const n = {...prev}; delete n[`indikator_target_${idx}`]; return n; });
                                }}
                                className={`h-9 rounded-lg text-sm text-center ${errors[`indikator_target_${idx}`] ? 'border-red-400 bg-red-50/30' : ''}`}
                              />
                              {errors[`indikator_target_${idx}`] && <p className="text-[10px] text-red-500 mt-0.5">{errors[`indikator_target_${idx}`]}</p>}
                            </td>
                            <td className="px-3 py-2 text-center text-slate-500 font-semibold text-sm">%</td>
                            <td className="p-1.5 text-center">
                              <Button
                                type="button" variant="ghost" size="icon"
                                className="text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg h-8 w-8"
                                onClick={() => removeIndikatorRow(idx)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-slate-500">Isi indikator kinerja per-bulan beserta target kumulatifnya</p>
                </div>

                {/* Kurun Waktu */}
                <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 p-5 space-y-4">
                  <h4 className="text-sm font-bold text-indigo-800 flex items-center gap-2"><CalendarRange className="size-4" /> Waktu Pelaksanaan</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="kurun_waktu_dari" className="text-slate-700 font-semibold">Kurun Waktu Pelaksanaan (Dari) <span className="text-red-500">*</span></Label>
                      <Input
                        type="date"
                        id="kurun_waktu_dari"
                        value={step2.kurun_waktu_dari}
                        min={todayStr}
                        onChange={e => { setStep2({ ...step2, kurun_waktu_dari: e.target.value }); setErrors(prev => { const n = {...prev}; delete n.kurun_waktu_dari; return n; }); }}
                        className={`h-12 rounded-xl focus-visible:ring-indigo-500/20 ${errors.kurun_waktu_dari ? 'border-red-400 bg-red-50/30' : ''}`}
                      />
                      {errors.kurun_waktu_dari && <p className="text-xs text-red-500 font-medium">{errors.kurun_waktu_dari}</p>}
                      <p className="text-xs text-slate-500">Tanggal mulai kegiatan</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold">Kurun Waktu Pelaksanaan (Sampai) <span className="text-red-500">*</span></Label>
                      <Input
                        type="date"
                        value={step2.kurun_waktu_sampai}
                        min={step2.kurun_waktu_dari || todayStr}
                        onChange={e => { setStep2({ ...step2, kurun_waktu_sampai: e.target.value }); setErrors(prev => { const n = {...prev}; delete n.kurun_waktu_sampai; return n; }); }}
                        className={`h-12 rounded-xl focus-visible:ring-indigo-500/20 ${errors.kurun_waktu_sampai ? 'border-red-400 bg-red-50/30' : ''}`}
                      />
                      {errors.kurun_waktu_sampai && <p className="text-xs text-red-500 font-medium">{errors.kurun_waktu_sampai}</p>}
                      <p className="text-xs text-slate-500">Tanggal selesai kegiatan</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ══════════════ STEP 3: IKU ══════════════ */}
          <div className={currentStep !== 3 ? 'hidden' : 'space-y-6'}>
            <Card className="shadow-sm border-slate-200/60 bg-white overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500" />
              <CardHeader className="bg-slate-50/30 border-b border-slate-100/60 py-5 pl-6 sm:pl-8 pr-4 sm:pr-6">
                <CardTitle className="text-lg text-purple-900 flex items-center gap-2">
                  <div className="flex items-center justify-center size-6 rounded-md bg-purple-100 text-purple-700 text-sm font-bold">3</div>
                  Indikator Kinerja Utama (IKU)
                </CardTitle>
                <CardDescription className="text-slate-500 ml-8 font-medium">Pilih indikator keberhasilan dan tentukan target yang ingin dicapai.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6 pl-6 sm:pl-8 pr-4 sm:pr-6">
                <div className="bg-blue-50 border border-blue-200/50 rounded-2xl p-5 flex items-start gap-4">
                  <div className="bg-blue-100/80 p-2 rounded-lg shrink-0">
                    <Target className="size-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-blue-900 mb-1">Tips IKU yang Efektif</h4>
                    <ul className="text-sm text-blue-800/80 list-disc list-inside space-y-1">
                      <li>Pilih indikator dari dropdown yang sesuai dengan kegiatan</li>
                      <li>Tambahkan beberapa indikator jika diperlukan</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <Label className="text-slate-700 font-semibold leading-tight block">Daftar IKU yang Dipilih</Label>
                      <p className="text-slate-500 text-sm mt-1">Klik "+ Tambah IKU" untuk menambahkan.</p>
                    </div>
                    <Button type="button" variant="secondary" size="sm" className="h-10 rounded-xl w-full sm:w-auto" onClick={addIku}>
                      <Plus className="mr-2 h-4 w-4 shrink-0" /> Tambah IKU
                    </Button>
                  </div>

                  {errors.iku_global && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">{errors.iku_global}</div>}
                  {ikuItems.length === 0 ? (
                    <div className={`rounded-2xl border border-dashed p-6 text-slate-500 text-center ${errors.iku_global ? 'border-red-300 bg-red-50/30' : 'border-slate-200 bg-slate-50'}`}>
                      <Target className="size-8 opacity-30 mx-auto mb-2" />
                      <p>Belum ada indikator yang dipilih.</p>
                      <p className="text-sm">Klik "Tambah IKU" untuk memilih indikator dari master.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {ikuItems.map((iku, index) => (
                        <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_128px_40px]">
                            <div>
                              <Label className="text-slate-700 font-semibold">Pilih Indikator <span className="text-red-500">*</span></Label>
                              <select
                                value={iku.nama_indikator}
                                onChange={e => { updateIku(index, 'nama_indikator', e.target.value); setErrors(prev => { const n = {...prev}; delete n[`iku_nama_${index}`]; return n; }); }}
                                className={`mt-1 w-full h-12 rounded-xl border border-slate-200 px-3 bg-white text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 ${errors[`iku_nama_${index}`] ? 'border-red-400 bg-red-50/30' : ''}`}
                              >
                                <option value="">-- Pilih Indikator --</option>
                                {ikuMasterList.map(item => (
                                  <option key={item.id} value={item.nama_indikator || item.nama_iku || String(item.id)}>
                                    {item.nama_indikator || item.nama_iku}
                                  </option>
                                ))}
                              </select>
                              {errors[`iku_nama_${index}`] && <p className="text-xs text-red-500 font-medium mt-1">{errors[`iku_nama_${index}`]}</p>}
                            </div>
                            <div>
                              <Label className="text-slate-700 font-semibold">Target (%) <span className="text-red-500">*</span></Label>
                              <Input
                                type="number" min={0} max={100}
                                value={iku.target_persen ?? ''}
                                onKeyDown={handlePositiveNumberKeyDown}
                                onChange={e => { updateIku(index, 'target_persen', e.target.value ? Math.max(0, Math.min(100, Number(e.target.value))) : null); setErrors(prev => { const n = {...prev}; delete n[`iku_target_${index}`]; return n; }); }}
                                placeholder="0"
                                className={`mt-1 h-12 rounded-xl focus-visible:ring-purple-500/20 ${errors[`iku_target_${index}`] ? 'border-red-400 bg-red-50/30' : ''}`}
                              />
                              {errors[`iku_target_${index}`] && <p className="text-xs text-red-500 font-medium mt-1">{errors[`iku_target_${index}`]}</p>}
                            </div>
                            <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-rose-500 sm:mt-6 place-self-end sm:place-self-auto" onClick={() => removeIku(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ══════════════ STEP 4: RAB ══════════════ */}
          <div className={currentStep !== 4 ? 'hidden' : 'space-y-6'}>
            {(errors.rab_global || errors.rab_total) && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 font-semibold flex items-center gap-3">
                <AlertTriangle className="size-5 shrink-0" />
                <div>
                  {errors.rab_global && <span className="block text-sm">{errors.rab_global}</span>}
                  {errors.rab_total && <span className="block text-sm">{errors.rab_total}</span>}
                </div>
              </div>
            )}
            {/* Info Satuan */}
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
              <h5 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2"><Info className="size-4" /> Penjelasan Kode Satuan</h5>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                {[
                  ['OK', 'Orang dalam Kegiatan – untuk konsumsi peserta/panitia'],
                  ['LS', 'Lump Sum – belanja yang tidak bisa diukur (spanduk, dekorasi)'],
                  ['PP', 'Pulang Pergi – untuk anggaran perjalanan transportasi'],
                  ['JAM', 'Per jam (e.g: sewa sound system)'],
                  ['KALI', 'Per kali acara/kegiatan'],
                  ['ORG', 'Per orang untuk honor/fee narasumber'],
                ].map(([code, desc]) => (
                  <div key={code} className="bg-white rounded-lg p-2 border border-amber-100">
                    <span className="font-bold text-amber-900">{code}</span>
                    <span className="text-slate-600 ml-1">– {desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <RabTable
              title="Belanja Barang"
              icon={<ShoppingCart className="size-4" />}
              items={rabBarang}
              onAdd={() => setRabBarang(prev => [...prev, emptyRab()])}
              onRemove={i => setRabBarang(prev => prev.filter((_, idx) => idx !== i))}
              onUpdate={makeRabUpdater(setRabBarang)}
              satuanOptions={SATUAN_BARANG}
            />

            <RabTable
              title="Belanja Jasa"
              icon={<Wrench className="size-4" />}
              items={rabJasa}
              onAdd={() => setRabJasa(prev => [...prev, emptyRab()])}
              onRemove={i => setRabJasa(prev => prev.filter((_, idx) => idx !== i))}
              onUpdate={makeRabUpdater(setRabJasa)}
              satuanOptions={SATUAN_JASA}
            />

            <RabTable
              title="Belanja Perjalanan"
              icon={<Plane className="size-4" />}
              items={rabPerjalanan}
              onAdd={() => setRabPerjalanan(prev => [...prev, emptyRab()])}
              onRemove={i => setRabPerjalanan(prev => prev.filter((_, idx) => idx !== i))}
              onUpdate={makeRabUpdater(setRabPerjalanan)}
              satuanOptions={SATUAN_PERJALANAN}
            />

            {/* Grand Total */}
            <div className="rounded-2xl bg-gradient-to-r from-[#0B6B4A] to-[#047857] p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between shadow-xl gap-4 sm:gap-0 mt-6 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-3 text-white">
                <div className="bg-white/20 p-2 sm:p-2.5 rounded-xl shrink-0"><CircleDollarSign className="size-6 sm:size-7 text-white" /></div>
                <div>
                  <p className="text-white/80 text-xs sm:text-sm font-medium uppercase tracking-wider">Total Anggaran Keseluruhan</p>
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-300">{formatCurrency(totalRab)}</div>
            </div>
          </div>

          {/* Draft saved indicator */}
          {draftSaved && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <CheckCircle className="size-4 shrink-0" />
              Draft berhasil disimpan ke database!
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 pt-6 pb-8 border-t border-slate-200">
            {currentStep > 1 ? (
              <Button type="button" variant="outline" className="h-14 px-8 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 border-slate-300 w-full sm:w-auto transition-all" onClick={() => setCurrentStep(prev => prev - 1)}>Kembali</Button>
            ) : (
              <Button type="button" variant="outline" className="h-14 px-8 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 border-slate-300 w-full sm:w-auto transition-all" onClick={handleGoBack}>Batalkan</Button>
            )}

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {/* BUG-015: Simpan Draft ke DB */}
              <Button
                type="button"
                variant="outline"
                disabled={draftSaving || isSubmitting}
                onClick={saveDraft}
                className="h-14 w-full sm:w-auto rounded-2xl px-6 font-bold text-slate-700 border-slate-300 hover:bg-slate-50 transition-all text-[15px] flex items-center justify-center"
              >
                {draftSaving ? <Loader2 className="size-5 mr-2 animate-spin" /> : <Save className="size-5 mr-2" />}
                {draftSaving ? 'Menyimpan...' : 'Simpan Draft'}
              </Button>

              {currentStep < 4 ? (
                <Button type="button" className="h-14 w-full sm:w-auto rounded-2xl px-6 sm:px-8 font-bold bg-[#047857] hover:bg-[#065F46] text-white shadow-xl shadow-emerald-700/20 transition-all active:scale-95 text-[15px] flex items-center justify-center group" onClick={handleNextStep}>
                  <span className="inline">Selanjutnya</span>
                  <ArrowRight className="size-5 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              ) : (
                <Button type="button" disabled={isSubmitting} onClick={() => { if (validateStep4()) setShowVerifikatorModal(true); }} className="h-14 w-full sm:w-auto rounded-2xl px-6 sm:px-8 font-bold bg-[#047857] hover:bg-[#065F46] text-white shadow-xl shadow-emerald-700/20 transition-all active:scale-95 text-[15px] flex items-center justify-center group">
                  {isSubmitting ? <Loader2 className="size-5 mr-3 animate-spin" /> : <Send className="size-5 mr-3 transition-transform group-hover:translate-x-1" />}
                  <span className="inline">{isSubmitting ? 'Memproses...' : 'Kirim Semua Data'}</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
