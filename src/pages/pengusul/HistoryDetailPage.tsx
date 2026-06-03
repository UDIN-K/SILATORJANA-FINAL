import { Card, CardContent } from '@/components/ui/card';
import api, { apiGetKegiatan } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { ProgressTracker } from '@/components/ProgressTracker';
import { ArrowLeft, Calendar, Building2, User, DollarSign, FileText, Loader2, AlertTriangle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { formatDate, formatCurrency, fetchKAK, fetchIKU, fetchRAB } from '@/lib/helpers';

function renderCatatanRevisi(catatan: string) {
  if (!catatan) return null;
  const lines = catatan.split('\n');
  const items: { field: string; text: string }[] = [];

  for (const line of lines) {
    const match = line.match(/^\[(.+?)\]:\s*(.+)$/);
    if (match) {
      items.push({ field: match[1], text: match[2] });
    } else if (line.trim()) {
      items.push({ field: 'Umum / Lainnya', text: line.trim() });
    }
  }

  if (items.length === 0) return <p className="text-sm text-amber-800 bg-white border border-amber-100 p-3 rounded-lg font-semibold">{catatan}</p>;

  return (
    <div className="space-y-1.5 bg-white border border-amber-100/80 rounded-xl p-3">
      <div className="grid gap-2 text-xs text-slate-700">
        {items.map((it, idx) => (
          <div key={idx} className="flex items-start gap-2 bg-slate-50 border border-slate-100 rounded-lg p-2.5 shadow-sm">
            <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-2 py-0.5 rounded-full uppercase shrink-0 mt-0.5">
              {it.field.replace(/_/g, ' ')}
            </span>
            <span className="leading-relaxed font-semibold text-slate-800">{it.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HistoryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [kegiatan, setKegiatan] = useState<any>(null);
  const [kak, setKak] = useState<any>(null);
  const [ikuList, setIkuList] = useState<any[]>([]);
  const [rabList, setRabList] = useState<any[]>([]);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const doc = await apiGetKegiatan(id);
        setKegiatan(doc);
        const [kakData, ikuData, rabData] = await Promise.all([fetchKAK(id), fetchIKU(id), fetchRAB(id)]);
        setKak(kakData);
        setIkuList(ikuData);
        setRabList(rabData);

        // Fetch status history
        try {
          const hist = await api.get(`/api/status-history/kegiatan/${id}`);
          setHistoryList(hist.data || []);
        } catch (e) {
          console.error('Failed to fetch status history', e);
        }
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    })();
  }, [id]);

  if (isLoading) return <div className="py-12 text-center"><Loader2 className="animate-spin text-emerald-700 mx-auto size-8" /></div>;
  if (!kegiatan) return <div className="py-12 text-center text-slate-500">Data tidak ditemukan.</div>;

  const rabTotal = rabList.reduce((sum: number, r: any) => sum + (parseFloat(r.total) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/pengusul/history')}><ArrowLeft className="size-5" /></Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{kegiatan.nama_kegiatan}</h2>
          <div className="flex items-center gap-3 mt-1"><StatusBadge status={kegiatan.status} /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-sm"><CardContent className="p-5 space-y-3">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2"><FileText className="size-4 text-emerald-700" /> Informasi Kegiatan</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Jenis</span><span className="font-medium">{kegiatan.jenis_kegiatan || '-'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Jurusan</span><span className="font-medium">{kegiatan.nama_jurusan || '-'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Pengusul</span><span className="font-medium">{kegiatan.pengusul_nama || '-'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Tanggal</span><span className="font-medium">{formatDate(kegiatan.created_at)}</span></div>
          </div>
        </CardContent></Card>

        <Card className="shadow-sm"><CardContent className="p-5 space-y-3">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2"><DollarSign className="size-4 text-emerald-600" /> Anggaran</h3>
          <div className="text-3xl font-bold text-emerald-700">{formatCurrency(rabTotal)}</div>
          <div className="text-sm text-slate-500">{rabList.length} item RAB</div>
        </CardContent></Card>
      </div>

      <Card className="shadow-sm"><CardContent className="p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Progress Workflow</h3>
        <ProgressTracker status={kegiatan.status} />
      </CardContent></Card>

      {kak && (
        <Card className="shadow-sm"><CardContent className="p-5 space-y-3">
          <h3 className="font-semibold text-slate-900">Kerangka Acuan Kerja (KAK)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="md:col-span-2"><span className="text-slate-500 block mb-1">Gambaran Umum</span><p className="whitespace-pre-line text-slate-700 leading-relaxed font-medium">{kak.gambaran_umum || '-'}</p></div>
            <div><span className="text-slate-500 block mb-1">Penerima Manfaat</span><p className="whitespace-pre-line text-slate-700 leading-relaxed font-medium">{kak.penerima_manfaat || '-'}</p></div>
            <div><span className="text-slate-500 block mb-1">Strategi Pencapaian</span><p className="whitespace-pre-line text-slate-700 leading-relaxed font-medium">{kak.strategi_pencapaian || '-'}</p></div>
            <div><span className="text-slate-500 block mb-1">Metode Pelaksanaan</span><p className="whitespace-pre-line text-slate-700 leading-relaxed font-medium">{kak.metode_pelaksanaan || '-'}</p></div>
            <div><span className="text-slate-500 block mb-1">Tahapan Pelaksanaan</span><p className="whitespace-pre-line text-slate-700 leading-relaxed font-medium">{kak.tahapan_pelaksanaan || '-'}</p></div>
            <div className="md:col-span-2"><span className="text-slate-500 block mb-1">Kurun Waktu Pelaksanaan</span><p className="text-slate-700 font-semibold">{kak.kurun_waktu_mulai ? `${formatDate(kak.kurun_waktu_mulai)} s.d. ${formatDate(kak.kurun_waktu_selesai)}` : '-'}</p></div>
          </div>
        </CardContent></Card>
      )}

      {kegiatan.catatan_revisi && (
        <Card className="shadow-sm border-amber-200 bg-amber-50/20"><CardContent className="p-5 space-y-2">
          <h3 className="font-semibold text-amber-900 flex items-center gap-2"><AlertTriangle className="size-4 shrink-0" /> Catatan Revisi Aktif</h3>
          {renderCatatanRevisi(kegiatan.catatan_revisi)}
        </CardContent></Card>
      )}

      {ikuList.length > 0 && (
        <Card className="shadow-sm"><CardContent className="p-5 space-y-3">
          <h3 className="font-semibold text-slate-900">Indikator Kinerja Utama (IKU)</h3>
          <div className="divide-y divide-slate-100">
            {ikuList.map((iku: any, i: number) => (
              <div key={iku.id || i} className="py-2 flex justify-between">
                <span className="text-sm">{iku.nama_iku || iku.indikator || '-'}</span>
                <span className="text-sm font-semibold text-emerald-700">{iku.target_persen != null ? `${iku.target_persen}%` : '-'}</span>
              </div>
            ))}
          </div>
        </CardContent></Card>
      )}

      {rabList.length > 0 && (
        <Card className="shadow-sm"><CardContent className="p-5 space-y-3">
          <h3 className="font-semibold text-slate-900">Rincian Anggaran Biaya (RAB)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-200 text-left text-slate-600">
                <th className="py-2 px-3">No</th><th className="py-2 px-3">Uraian</th><th className="py-2 px-3">Kategori</th><th className="py-2 px-3 text-right">Harga Satuan</th><th className="py-2 px-3 text-right">Total</th>
              </tr></thead>
              <tbody>{rabList.map((r: any, i: number) => (
                <tr key={r.id || i} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="py-2 px-3">{i + 1}</td>
                  <td className="py-2 px-3 font-medium">{r.uraian}</td>
                  <td className="py-2 px-3 capitalize">{r.kategori || '-'}</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(r.harga_satuan)}</td>
                  <td className="py-2 px-3 text-right font-semibold">{formatCurrency(r.total)}</td>
                </tr>
              ))}</tbody>
              <tfoot><tr className="border-t-2 border-slate-200">
                <td colSpan={4} className="py-3 px-3 font-bold text-right">Total Anggaran</td>
                <td className="py-3 px-3 text-right font-bold text-emerald-700">{formatCurrency(rabTotal)}</td>
              </tr></tfoot>
            </table>
          </div>
        </CardContent></Card>
      )}

      {/* Status History / Timeline */}
      <Card className="shadow-sm border-slate-200 bg-white">
        <CardContent className="p-5 space-y-4">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <span>⌛</span> Timeline &amp; Riwayat Persetujuan
          </h3>
          {historyList.length === 0 ? (
            <p className="text-sm text-slate-500 py-2">Belum ada riwayat perubahan status.</p>
          ) : (
            <div className="relative border-l border-slate-200 ml-3 pl-6 space-y-5 py-2">
              {historyList.map((hist, idx) => (
                <div key={hist.id || idx} className="relative">
                  {/* Timeline bullet */}
                  <span className="absolute -left-[31px] top-1.5 flex items-center justify-center size-3.5 rounded-full bg-emerald-500 border border-white shadow-sm ring-4 ring-emerald-50" />
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800">{hist.user_nama}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full capitalize">
                          {hist.user_role}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-medium">
                        {new Date(hist.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-xs mt-1 font-medium text-slate-600">
                      Mengubah status menjadi: <span className="text-emerald-700 font-bold">{hist.status_baru}</span>
                    </p>
                    {hist.catatan && (
                      <div className="mt-1.5 p-2.5 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-100 font-medium">
                        <span className="font-bold text-slate-500 block mb-0.5">Catatan:</span>
                        {hist.catatan}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
