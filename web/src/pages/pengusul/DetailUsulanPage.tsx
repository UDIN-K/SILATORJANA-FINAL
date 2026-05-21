import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { ProgressTracker } from '@/components/ProgressTracker';
import { formatDate, formatCurrency, getUserId, fetchKegiatan } from '@/lib/helpers';
import { ArrowLeft, FileText, Clock, MapPin, User, Loader2, Printer } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { databases, APPWRITE_DB_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

export function DetailUsulanPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [kegiatan, setKegiatan] = useState<any>(null);
  const [kak, setKak] = useState<any>(null);
  const [ikuList, setIkuList] = useState<any[]>([]);
  const [rabList, setRabList] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const kg = await databases.getDocument(APPWRITE_DB_ID, 'kegiatan', id);
        setKegiatan(kg);

        try {
          const kakRes = await databases.listDocuments(APPWRITE_DB_ID, 'kak', [Query.equal('kegiatan_id', id)]);
          setKak(kakRes.documents[0] || null);
        } catch {}

        try {
          const ikuRes = await databases.listDocuments(APPWRITE_DB_ID, 'iku', [Query.equal('kegiatan_id', id)]);
          setIkuList(ikuRes.documents);
        } catch {}

        try {
          const rabRes = await databases.listDocuments(APPWRITE_DB_ID, 'rab', [Query.equal('kegiatan_id', id)]);
          setRabList(rabRes.documents);
        } catch {}

        try {
          const histRes = await databases.listDocuments(APPWRITE_DB_ID, 'status_history', [
            Query.equal('ref_id', id), Query.orderDesc('$createdAt')
          ]);
          setHistory(histRes.documents);
        } catch {}
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  if (isLoading) return <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-blue-600 size-8" /></div>;
  if (!kegiatan) return <div className="py-12 text-center text-slate-500">Data kegiatan tidak ditemukan.</div>;

  const totalRab = rabList.reduce((sum, r) => sum + (r.total || r.harga_satuan * (r.qty1 || r.volume || 1)), 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="size-5" /></Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900">{kegiatan.nama_kegiatan}</h2>
          <div className="flex items-center gap-3 mt-1">
            <StatusBadge status={kegiatan.status} />
            <span className="text-sm text-slate-500">{formatDate(kegiatan.$createdAt)}</span>
          </div>
        </div>
        <Button variant="outline" className="text-emerald-700 border-emerald-200 hover:bg-emerald-50" onClick={() => navigate(`/dashboard/pengusul/print/${id}`)}>
          <Printer className="size-4 mr-2" /> Cetak PDF
        </Button>
      </div>

      {/* Progress */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100"><CardTitle className="text-base">Progress Workflow</CardTitle></CardHeader>
        <CardContent className="p-6"><ProgressTracker status={kegiatan.status} /></CardContent>
      </Card>

      {/* Info Kegiatan */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100"><CardTitle className="text-base">Informasi Kegiatan</CardTitle></CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoRow icon={FileText} label="Jenis" value={kegiatan.jenis_kegiatan || kegiatan.kategori || '-'} />
          <InfoRow icon={Clock} label="Tanggal" value={formatDate(kegiatan.tanggal_kegiatan || kegiatan.tgl_kegiatan)} />
          <InfoRow icon={MapPin} label="Tempat" value={kegiatan.tempat || '-'} />
          <InfoRow icon={User} label="Pengusul" value={kegiatan.pengusul_organisasi || '-'} />
          {kegiatan.deskripsi && <div className="md:col-span-2"><p className="text-sm text-slate-500">Deskripsi</p><p className="text-sm text-slate-800 mt-1">{kegiatan.deskripsi || kegiatan.latar_belakang}</p></div>}
        </CardContent>
      </Card>

      {/* KAK */}
      {kak && (
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100"><CardTitle className="text-base">KAK (Kerangka Acuan Kerja)</CardTitle></CardHeader>
          <CardContent className="p-6 space-y-3">
            {kak.gambaran_umum && <div><p className="text-sm font-medium text-slate-600">Gambaran Umum</p><p className="text-sm text-slate-800">{kak.gambaran_umum}</p></div>}
            {kak.tujuan && <div><p className="text-sm font-medium text-slate-600">Tujuan</p><p className="text-sm text-slate-800">{kak.tujuan}</p></div>}
            {kak.sasaran && <div><p className="text-sm font-medium text-slate-600">Sasaran</p><p className="text-sm text-slate-800">{kak.sasaran}</p></div>}
            {kak.penerima_manfaat && <div><p className="text-sm font-medium text-slate-600">Penerima Manfaat</p><p className="text-sm text-slate-800">{kak.penerima_manfaat}</p></div>}
            {kak.strategi_pencapaian && <div><p className="text-sm font-medium text-slate-600">Strategi Pencapaian</p><p className="text-sm text-slate-800">{kak.strategi_pencapaian}</p></div>}
            {kak.metode_pelaksanaan && <div><p className="text-sm font-medium text-slate-600">Metode Pelaksanaan</p><p className="text-sm text-slate-800">{kak.metode_pelaksanaan}</p></div>}
          </CardContent>
        </Card>
      )}

      {/* IKU */}
      {ikuList.length > 0 && (
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100"><CardTitle className="text-base">IKU (Indikator Kinerja Utama)</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead className="px-6">Indikator</TableHead><TableHead className="px-6 w-32 text-right">Target (%)</TableHead></TableRow></TableHeader>
              <TableBody>
                {ikuList.map(iku => (
                  <TableRow key={iku.$id}><TableCell className="px-6">{iku.nama_iku}</TableCell><TableCell className="px-6 text-right">{iku.target_persen ?? '-'}%</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* RAB */}
      {rabList.length > 0 && (
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100"><CardTitle className="text-base">RAB (Rincian Anggaran Biaya)</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-6">Uraian</TableHead>
                  <TableHead className="px-6 text-center w-20">Vol</TableHead>
                  <TableHead className="px-6 text-right w-40">Harga Satuan</TableHead>
                  <TableHead className="px-6 text-right w-40">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rabList.map(rab => {
                  const total = rab.total || (rab.harga_satuan * (rab.qty1 || rab.volume || 1));
                  return (
                    <TableRow key={rab.$id}>
                      <TableCell className="px-6">{rab.uraian}</TableCell>
                      <TableCell className="px-6 text-center">{rab.qty1 || rab.volume || 1}</TableCell>
                      <TableCell className="px-6 text-right">{formatCurrency(rab.harga_satuan)}</TableCell>
                      <TableCell className="px-6 text-right font-medium">{formatCurrency(total)}</TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-slate-50 font-bold">
                  <TableCell colSpan={3} className="px-6 text-right">Total Anggaran</TableCell>
                  <TableCell className="px-6 text-right text-blue-700">{formatCurrency(totalRab)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {history.length > 0 && (
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100"><CardTitle className="text-base">Riwayat Status</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {history.map(h => (
                <div key={h.$id} className="p-4 flex items-start gap-3">
                  <div className="size-2 rounded-full bg-blue-400 mt-2 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={h.status_baru || h.new_status} />
                      <span className="text-xs text-slate-400">{formatDate(h.$createdAt || h.timestamp)}</span>
                    </div>
                    {h.catatan && <p className="text-sm text-slate-600 mt-1">{h.catatan}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aksi submit ulang untuk Pengusul setelah diverifikasi */}
      {kegiatan.status === 'diverifikasi' && (
        <Card className="shadow-sm border-slate-200 bg-blue-50/50">
          <CardHeader className="border-b border-slate-100 md:flex md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <CardTitle className="text-base text-blue-900">Usulan Telah Diverifikasi</CardTitle>
              <p className="text-sm text-slate-600 mt-1">Usulan ini telah diverifikasi oleh Verifikator. Lanjutkan usulan ini kepada PPK agar dapat diproses lebih lanjut.</p>
            </div>
            <Button
              className="w-full md:w-auto"
              onClick={async () => {
                try {
                  await databases.updateDocument(APPWRITE_DB_ID, 'kegiatan', kegiatan.$id, { status: 'pending_ppk' });
                  alert('Berhasil diteruskan ke PPK');
                  window.location.reload();
                } catch (e: any) {
                  alert('Gagal: ' + e.message);
                }
              }}
            >
              Teruskan ke PPK
            </Button>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-slate-100"><Icon className="size-4 text-slate-500" /></div>
      <div><p className="text-xs text-slate-500">{label}</p><p className="text-sm font-medium text-slate-800">{value}</p></div>
    </div>
  );
}
