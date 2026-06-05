import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { apiGetSpkRiwayat } from '@/lib/api';
import { useState, useEffect } from 'react';
import { getGradeColor, getGradeLabel, formatSkorToPercentage } from '@/lib/mooraCalculator';
import { Loader2, Award, TrendingUp, CheckCircle, BarChart3, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SpkHistoryItem {
  id: number;
  kegiatan_id: number;
  skor_c1: number;
  skor_c2: number;
  skor_c3: number;
  skor_c4: number;
  skor_akhir: number;
  grade: string;
  dinilai_oleh: string;
  dinilai_pada: string;
  kegiatan?: {
    id: number;
    nama_kegiatan: string;
    pengusul_nama: string;
    status: string;
  };
}

export function SpkDashboardWidget() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SpkHistoryItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      try {
        const res = await apiGetSpkRiwayat();
        if (!active) return;
        
        // Paginated Laravel response: check if it's res.data or res.data.data
        const items = Array.isArray(res) 
          ? res 
          : (res.data || res.results || []);
        
        setData(items);
        setTotalCount(res.total || items.length);
      } catch (err: any) {
        console.error('Failed to load SPK history:', err);
        if (active) setError(err.message || 'Gagal memuat riwayat SPK');
      } finally {
        if (active) setLoading(false);
      }
    };
    loadData();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <Card className="shadow-sm border-slate-200/60 p-6 flex justify-center items-center h-[280px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="animate-spin text-emerald-600 size-8" />
          <span className="text-sm text-slate-500 font-medium">Memuat analisis kualitas...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-sm border-slate-200/60 p-6 flex justify-center items-center h-[280px]">
        <div className="flex flex-col items-center text-center gap-2 text-amber-600">
          <AlertCircle className="size-8" />
          <p className="text-sm font-semibold">Gagal memuat SPK Widget</p>
          <p className="text-xs text-slate-500 max-w-xs">{error}</p>
        </div>
      </Card>
    );
  }

  // Calculate statistics
  const totalEvaluations = totalCount;
  const averageScore = data.length > 0 
    ? data.reduce((sum, item) => sum + Number(item.skor_akhir), 0) / data.length
    : 0;

  // Grade distributions
  const grades = { A: 0, B: 0, C: 0, D: 0 };
  data.forEach((item) => {
    const g = item.grade as keyof typeof grades;
    if (grades[g] !== undefined) {
      grades[g]++;
    }
  });

  const getGradePercentage = (count: number) => {
    if (totalEvaluations === 0) return 0;
    return Math.round((count / data.length) * 100);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* 1. Rata-rata & Total Evaluasi */}
      <Card className="shadow-sm border-slate-200/60 rounded-2xl md:col-span-1 bg-white flex flex-col justify-between overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Statistik Mutu LPJ</CardTitle>
          <CardDescription className="text-xs text-slate-400">Total laporan pertanggungjawaban ter-analisis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 flex-1 flex flex-col justify-center pb-6">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
              <Award className="size-8 text-emerald-600" />
            </div>
            <div>
              <p className="text-3xl font-extrabold text-slate-800 tracking-tight leading-none mb-1">
                {formatSkorToPercentage(averageScore)}
              </p>
              <p className="text-xs text-slate-500 font-medium">Rata-rata Skor Kualitas (Y_i)</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
              <TrendingUp className="size-8 text-blue-600" />
            </div>
            <div>
              <p className="text-3xl font-extrabold text-slate-800 tracking-tight leading-none mb-1">
                {totalEvaluations}
              </p>
              <p className="text-xs text-slate-500 font-medium">LPJ Telah Dinilai SPK</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Distribusi Grade SPK */}
      <Card className="shadow-sm border-slate-200/60 rounded-2xl md:col-span-1 bg-white overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="size-4.5 text-slate-500" /> Distribusi Mutu
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">Klasifikasi nilai kualitas LPJ</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pb-6">
          {(Object.keys(grades) as Array<keyof typeof grades>).map((grade) => {
            const count = grades[grade];
            const pct = getGradePercentage(count);
            const theme = getGradeColor(grade);
            
            return (
              <div key={grade} className="space-y-1">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded font-mono font-bold ${theme.bg} ${theme.text} border ${theme.border}`}>
                      Grade {grade}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      ({getGradeLabel(grade)})
                    </span>
                  </div>
                  <span>{count} LPJ ({pct}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      grade === 'A' ? 'bg-emerald-600' :
                      grade === 'B' ? 'bg-blue-600' :
                      grade === 'C' ? 'bg-amber-600' : 'bg-red-600'
                    }`} 
                    style={{ width: `${pct}%` }} 
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* 3. Penilaian Terakhir */}
      <Card className="shadow-sm border-slate-200/60 rounded-2xl md:col-span-1 bg-white overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle className="size-4.5 text-slate-500" /> Penilaian Terbaru
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">Daftar kualitas LPJ terbaru yang disetujui</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100 max-h-[220px] overflow-y-auto">
            {data.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 italic">
                Belum ada data evaluasi SPK.
              </div>
            ) : (
              data.slice(0, 4).map((item) => {
                const colors = getGradeColor(item.grade);
                return (
                  <div 
                    key={item.id} 
                    className="p-3.5 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
                    onClick={() => navigate(`/dashboard/bendahara/lpj/${item.kegiatan_id}`)}
                  >
                    <div className="min-w-0 pr-2 space-y-1">
                      <p className="text-xs font-bold text-slate-800 truncate leading-snug">
                        {item.kegiatan?.nama_kegiatan || `Kegiatan #${item.kegiatan_id}`}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        Oleh: {item.kegiatan?.pengusul_nama || '-'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-slate-600">
                        {formatSkorToPercentage(item.skor_akhir)}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-mono font-extrabold rounded-md border ${colors.bg} ${colors.text} ${colors.border}`}>
                        {item.grade}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
