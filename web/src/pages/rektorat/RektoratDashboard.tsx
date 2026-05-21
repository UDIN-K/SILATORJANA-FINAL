import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/helpers';
import { BarChart3, FileText, CheckCircle, XCircle, Clock, TrendingUp, Loader2, ArrowUpRight, PieChart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { databases, APPWRITE_DB_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { useNavigate } from 'react-router-dom';

const STATUS_GROUPS: Record<string, string[]> = {
  approved: ['approved_wadir', 'accepted_funds', 'funds_disbursed', 'lpj_approved', 'completed', 'lpj_done', 'selesai'],
  rejected: ['rejected', 'ditolak'],
  pending: ['submitted', 'verified', 'revision_requested', 'revisi_done', 'approved_ppk'],
};

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

export function RektoratDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, approved: 0, rejected: 0, pending: 0, totalBudget: 0 });
  const [jurusanStats, setJurusanStats] = useState<{ nama: string; total: number; budget: number }[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: string; count: number }[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<{ label: string; count: number; color: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await databases.listDocuments(APPWRITE_DB_ID, 'kegiatan', [Query.limit(500)]);
        const docs = res.documents;
        const approved = docs.filter((d: any) => STATUS_GROUPS.approved.includes(d.status?.toLowerCase())).length;
        const rejected = docs.filter((d: any) => STATUS_GROUPS.rejected.includes(d.status?.toLowerCase())).length;
        const pending = docs.length - approved - rejected;
        const totalBudget = docs.reduce((s: number, d: any) => s + (parseFloat(d.total_anggaran) || 0), 0);
        setStats({ total: docs.length, approved, rejected, pending, totalBudget });

        // Group by jurusan
        const jMap: Record<string, { total: number; budget: number }> = {};
        docs.forEach((d: any) => {
          const j = d.nama_jurusan || 'Lainnya';
          if (!jMap[j]) jMap[j] = { total: 0, budget: 0 };
          jMap[j].total++;
          jMap[j].budget += parseFloat(d.total_anggaran) || 0;
        });
        setJurusanStats(Object.entries(jMap).map(([nama, v]) => ({ nama, ...v })).sort((a, b) => b.total - a.total));

        // Monthly data (last 6 months)
        const now = new Date();
        const monthly: Record<string, number> = {};
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          monthly[key] = 0;
        }
        docs.forEach((d: any) => {
          const created = new Date(d.$createdAt);
          const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
          if (monthly[key] !== undefined) monthly[key]++;
        });
        setMonthlyData(Object.entries(monthly).map(([k, count]) => ({
          month: MONTH_NAMES[parseInt(k.split('-')[1]) - 1],
          count,
        })));

        // Status breakdown
        const statusMap: Record<string, number> = {};
        docs.forEach((d: any) => { const s = d.status || 'unknown'; statusMap[s] = (statusMap[s] || 0) + 1; });
        const breakdown = [
          { label: 'Disetujui', count: approved, color: '#059669' },
          { label: 'Pending', count: pending, color: '#d97706' },
          { label: 'Ditolak', count: rejected, color: '#dc2626' },
        ];
        setStatusBreakdown(breakdown);
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    })();
  }, []);

  if (isLoading) return <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-emerald-700 size-8" /></div>;

  const cards = [
    { label: 'Total Usulan', value: stats.total, icon: FileText, color: 'bg-emerald-100 text-emerald-700', sub: 'Semua periode' },
    { label: 'Disetujui', value: stats.approved, icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600', sub: `${stats.total > 0 ? ((stats.approved / stats.total) * 100).toFixed(0) : 0}% approval rate` },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'bg-amber-50 text-amber-600', sub: 'Menunggu proses' },
    { label: 'Ditolak', value: stats.rejected, icon: XCircle, color: 'bg-red-50 text-red-600', sub: 'Tidak disetujui' },
  ];

  const maxMonthly = Math.max(...monthlyData.map(m => m.count), 1);
  const maxJurusan = Math.max(...jurusanStats.map(j => j.total), 1);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Dashboard Rektorat</h2>
        <p className="text-slate-500">Ringkasan kegiatan seluruh politeknik.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <Card key={i} className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-slate-500">{c.label}</p>
                <div className={`p-2.5 rounded-xl ${c.color}`}><c.icon className="size-4" /></div>
              </div>
              <p className="text-3xl font-bold text-slate-900">{c.value}</p>
              <p className="text-xs text-slate-400 mt-1">{c.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Budget card */}
      <Card className="shadow-sm border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100/30">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-700">Total Anggaran Seluruh Kegiatan</p>
            <p className="text-3xl font-bold text-emerald-800 mt-1">{formatCurrency(stats.totalBudget)}</p>
            <p className="text-xs text-emerald-600 mt-1">{stats.total} kegiatan terdaftar</p>
          </div>
          <div className="p-4 bg-emerald-200/50 rounded-2xl"><TrendingUp className="size-8 text-emerald-700" /></div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Monthly */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="size-4 text-emerald-600" /> Usulan per Bulan (6 bulan terakhir)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-end gap-3 h-48">
              {monthlyData.map((m, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">{m.count}</span>
                  <div className="w-full bg-slate-100 rounded-t-lg relative overflow-hidden" style={{ height: '160px' }}>
                    <div
                      className="absolute bottom-0 w-full rounded-t-lg transition-all duration-700 ease-out"
                      style={{
                        height: `${Math.max(4, (m.count / maxMonthly) * 100)}%`,
                        background: `linear-gradient(to top, #059669, #34d399)`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{m.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Donut Chart - Status */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <PieChart className="size-4 text-emerald-600" /> Distribusi Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center gap-8">
              {/* SVG Donut */}
              <div className="relative">
                <svg width="160" height="160" viewBox="0 0 160 160">
                  {(() => {
                    const total = statusBreakdown.reduce((s, b) => s + b.count, 0) || 1;
                    let cumulative = 0;
                    const r = 60, cx = 80, cy = 80, strokeW = 24;
                    const circumference = 2 * Math.PI * r;
                    return statusBreakdown.map((b, i) => {
                      const pct = b.count / total;
                      const dashLen = pct * circumference;
                      const dashOffset = -cumulative * circumference;
                      cumulative += pct;
                      return (
                        <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                          stroke={b.color} strokeWidth={strokeW}
                          strokeDasharray={`${dashLen} ${circumference - dashLen}`}
                          strokeDashoffset={dashOffset}
                          transform={`rotate(-90 ${cx} ${cy})`}
                          className="transition-all duration-700"
                        />
                      );
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-2xl font-bold text-slate-900">{stats.total}</span>
                  <span className="text-xs text-slate-500">Total</span>
                </div>
              </div>
              {/* Legend */}
              <div className="space-y-4 flex-1">
                {statusBreakdown.map((b, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="size-3 rounded-full" style={{ backgroundColor: b.color }} />
                      <span className="text-sm text-slate-700">{b.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-900">{b.count}</span>
                      <span className="text-xs text-slate-400 ml-1">
                        ({stats.total > 0 ? ((b.count / stats.total) * 100).toFixed(0) : 0}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Jurusan Horizontal Bar Chart */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="size-4 text-emerald-600" /> Rekap per Jurusan
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {jurusanStats.length === 0 ? <div className="py-8 text-center text-slate-500">Belum ada data.</div> : (
            <div className="space-y-4">
              {jurusanStats.map((j, i) => (
                <div key={i} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-slate-800">{j.nama}</span>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-slate-500">{formatCurrency(j.budget)}</span>
                      <span className="font-bold text-slate-900">{j.total} usulan</span>
                    </div>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 group-hover:opacity-80"
                      style={{
                        width: `${Math.max(3, (j.total / maxJurusan) * 100)}%`,
                        background: `linear-gradient(to right, #059669, #34d399)`,
                      }}
                    />
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
