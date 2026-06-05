import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { apiGetKegiatan, apiTambahPencairan, apiAmbilUangMuka } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2, DollarSign, Clock, Calendar, CheckSquare } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { formatCurrency, formatDate } from '@/lib/helpers';
import { StatusBadge } from '@/components/StatusBadge';

export function PencairanPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const [persentaseInput, setPersentaseInput] = useState<string>('');
  const [catatanInput, setCatatanInput] = useState<string>('');

  const fetchData = async () => {
    try {
      if (!id) return;
      const kegiatan = await apiGetKegiatan(id);
      setData(kegiatan);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (isLoading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto size-8 text-emerald-700" /></div>;
  if (!data) return <div className="p-8 text-center text-red-500">Data tidak ditemukan</div>;

  const disbursementHistory = data.pencairan_dana || data.pencairanDana || [];
  const totalDisbursed = disbursementHistory.reduce(
    (sum: number, p: any) => sum + parseFloat(p.persentase),
    0
  );
  const remainingPercentage = 100 - totalDisbursed;

  // Calculate dynamic nominal based on percentage input
  const inputPercentNum = parseFloat(persentaseInput) || 0;
  const calculatedNominal = (inputPercentNum / 100) * (data.total_anggaran || 0);

  const handlePencairan = async () => {
    if (!id || !persentaseInput) {
      alert('Mohon masukkan persentase pencairan.');
      return;
    }

    if (inputPercentNum <= 0) {
      alert('Persentase pencairan harus lebih besar dari 0.');
      return;
    }

    if (totalDisbursed + inputPercentNum > 100) {
      alert(`Total pencairan tidak boleh melebihi 100%. Sisa limit: ${remainingPercentage}%`);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiTambahPencairan(id, {
        persentase: inputPercentNum,
        catatan: catatanInput,
      });
      alert('Pencairan dana berhasil dicatat!');
      setPersentaseInput('');
      setCatatanInput('');
      setData(result);
    } catch (error: any) {
      alert("Gagal mencatat pencairan: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkTaken = async () => {
    if (!id || !confirm('Tandai bahwa pencairan telah diambil oleh pengusul?')) return;
    setIsMarking(true);
    try {
      const result = await apiAmbilUangMuka(id);
      setData(result);
    } catch (e: any) {
      alert('Gagal menandai pencairan: ' + (e.message || 'Unknown error'));
    } finally {
      setIsMarking(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/dashboard/bendahara/detail/${id}`)}>
          <ArrowLeft className="size-5 text-slate-500" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Pencairan Dana Usulan</h2>
          <p className="text-slate-500">ID Usulan: {String(id).padStart(8, '0')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Info + History */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-lg">Informasi Usulan & Anggaran</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <Label className="text-slate-500 text-xs uppercase tracking-wider">Nama Kegiatan</Label>
                  <p className="font-semibold text-slate-900 mt-1">{data.nama_kegiatan}</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-xs uppercase tracking-wider">Total Anggaran Disetujui</Label>
                  <p className="font-bold text-emerald-700 mt-1 text-lg">{formatCurrency(data.total_anggaran)}</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-xs uppercase tracking-wider">Status Kegiatan</Label>
                  <p className="mt-1"><span className="capitalize"><StatusBadge status={data.status} /></span></p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="size-4.5 text-slate-600" /> Riwayat Pencairan Dana
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {disbursementHistory.length === 0 ? (
                <div className="py-6 text-center text-slate-500 italic">Belum ada pencairan dana yang dicatat sebelumnya.</div>
              ) : (
                <div className="overflow-x-auto border border-slate-100 rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/50">
                        <TableHead className="px-4 py-3 text-xs font-bold text-slate-500">Tahap</TableHead>
                        <TableHead className="px-4 py-3 text-xs font-bold text-slate-500">Tanggal Pencairan</TableHead>
                        <TableHead className="px-4 py-3 text-xs font-bold text-slate-500 text-center">Persentase</TableHead>
                        <TableHead className="px-4 py-3 text-xs font-bold text-slate-500 text-right">Nominal</TableHead>
                        <TableHead className="px-4 py-3 text-xs font-bold text-slate-500">Catatan</TableHead>
                        <TableHead className="px-4 py-3 text-xs font-bold text-slate-500 text-center">Status Diambil</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {disbursementHistory.map((p: any, idx: number) => (
                        <TableRow key={p.pencairan_id || p.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <TableCell className="px-4 py-3 font-semibold text-slate-800">Tahap {idx + 1}</TableCell>
                          <TableCell className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(p.tanggal_pencairan || p.created_at)}</TableCell>
                          <TableCell className="px-4 py-3 text-slate-800 font-bold text-center bg-slate-50/30">{parseFloat(p.persentase)}%</TableCell>
                          <TableCell className="px-4 py-3 text-right font-bold text-emerald-700 whitespace-nowrap">{formatCurrency(p.nominal)}</TableCell>
                          <TableCell className="px-4 py-3 text-slate-500 text-sm max-w-xs truncate" title={p.catatan}>{p.catatan || '-'}</TableCell>
                          <TableCell className="px-4 py-3 text-center">
                            {p.is_taken || p.tanggal_pengambilan ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                Diambil
                              </span>
                            ) : (
                              <div className="flex flex-col items-center gap-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                  Menunggu
                                </span>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-6 text-[10px] px-2 py-0"
                                  onClick={handleMarkTaken}
                                  disabled={isMarking}
                                >
                                  {isMarking ? <Loader2 className="size-3 animate-spin mr-1" /> : <CheckCircle2 className="size-3 mr-1" />} Tandai
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Action card */}
        <div className="space-y-6">
          <Card className="shadow-sm border-slate-200 sticky top-20">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg">Pencairan Baru</CardTitle>
              <CardDescription>Otorisasi Pengeluaran Dana</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              {/* Summary Limit */}
              <div className="grid grid-cols-2 gap-2 text-sm pb-2 border-b border-slate-100">
                <div>
                  <span className="text-slate-500">Telah Dicairkan:</span>
                  <p className="font-bold text-slate-800">{totalDisbursed}%</p>
                </div>
                <div>
                  <span className="text-slate-500">Sisa Limit:</span>
                  <p className="font-bold text-emerald-700">{remainingPercentage}%</p>
                </div>
              </div>

              {remainingPercentage <= 0 ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex gap-3 text-emerald-800 text-sm">
                  <CheckSquare className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Dana Dicairkan 100%</p>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Pencairan dana usulan ini telah diselesaikan sepenuhnya.
                      {data.deadline_lpj && (
                        <span> Batas waktu akhir LPJ diatur pada: <strong>{formatDate(data.deadline_lpj)}</strong></span>
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="persentase">Persentase Pencairan (%)</Label>
                    <div className="relative">
                      <Input
                        id="persentase"
                        type="number"
                        placeholder={`Maks ${remainingPercentage}`}
                        value={persentaseInput}
                        onChange={(e) => setPersentaseInput(e.target.value)}
                        max={remainingPercentage}
                        min={0.01}
                        step="any"
                        className="pr-12"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
                        %
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500">Nominal yang Dicairkan</Label>
                    <p className="text-xl font-bold text-emerald-700">{formatCurrency(calculatedNominal)}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="catatan">Catatan / No. Referensi BCA/Mandiri</Label>
                    <textarea
                      id="catatan"
                      value={catatanInput}
                      onChange={(e) => setCatatanInput(e.target.value)}
                      className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-600"
                      placeholder="Masukkan referensi transfer bank..."
                    />
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3 text-amber-800 text-xs">
                    <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      Pencairan bertahap akan tercatat ke database. Jika total pencairan mencapai 100%, status proposal akan otomatis diset menjadi <strong>funds_disbursed</strong>.
                    </p>
                  </div>

                  <Button
                    disabled={isSubmitting || !persentaseInput}
                    onClick={handlePencairan}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold h-11 shadow"
                  >
                    {isSubmitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : <CheckCircle2 className="size-4 mr-2" />}
                    Konfirmasi Pencairan Tahap Ini
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
