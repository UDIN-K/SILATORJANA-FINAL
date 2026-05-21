import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { Input } from '@/components/ui/input';
import { Search, Eye, Archive, Loader2, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { databases, APPWRITE_DB_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { formatDate, formatCurrency, timeAgo } from '@/lib/helpers';

const ARCHIVE_STATUSES = [
  'approved_wadir', 'accepted_funds', 'funds_disbursed',
  'lpj_submitted', 'lpj_approved', 'lpj_verified', 'lpj_done',
  'selesai', 'completed', 'rejected', 'ditolak',
];

interface ArchivePageProps {
  role: 'verifikator' | 'ppk' | 'wadir2';
  detailPath: string;
}

export function ArchivePage({ role, detailPath }: ArchivePageProps) {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    (async () => {
      try {
        const res = await databases.listDocuments(APPWRITE_DB_ID, 'kegiatan', [
          Query.orderDesc('$updatedAt'), Query.limit(200),
        ]);
        const archived = res.documents.filter((d: any) =>
          ARCHIVE_STATUSES.includes(d.status?.toLowerCase())
        );
        setItems(archived);
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    })();
  }, []);

  const filtered = items.filter(i => {
    const matchSearch = !search || i.nama_kegiatan?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || i.status?.toLowerCase() === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusCounts = items.reduce((acc: Record<string, number>, i) => {
    const s = i.status?.toLowerCase() || 'unknown';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const ROLE_LABELS: Record<string, string> = {
    verifikator: 'Verifikator',
    ppk: 'PPK',
    wadir2: 'Wadir II',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Archive className="size-6 text-slate-600" /> Arsip Proposal
        </h2>
        <p className="text-slate-500">Proposal yang sudah selesai diproses atau ditolak — {ROLE_LABELS[role]}.</p>
      </div>

      {/* Stats */}
      {!isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Arsip" value={items.length} color="bg-slate-100 text-slate-700" />
          <StatCard label="Selesai" value={(statusCounts['completed'] || 0) + (statusCounts['selesai'] || 0) + (statusCounts['lpj_done'] || 0)} color="bg-emerald-50 text-emerald-700" />
          <StatCard label="Ditolak" value={(statusCounts['rejected'] || 0) + (statusCounts['ditolak'] || 0)} color="bg-red-50 text-red-700" />
          <StatCard label="Dana Cair" value={(statusCounts['funds_disbursed'] || 0) + (statusCounts['accepted_funds'] || 0)} color="bg-indigo-50 text-indigo-700" />
        </div>
      )}

      {/* Filters */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="p-4 border-b bg-slate-50/50">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
              <Input placeholder="Cari kegiatan..." className="pl-9 bg-white" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'completed', 'rejected', 'funds_disbursed'].map(s => (
                <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm"
                  className={statusFilter === s ? 'bg-emerald-700 text-white' : ''}
                  onClick={() => setStatusFilter(s)}>
                  {s === 'all' ? 'Semua' : s === 'completed' ? 'Selesai' : s === 'rejected' ? 'Ditolak' : 'Dana Cair'}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center"><Loader2 className="animate-spin text-emerald-700 mx-auto size-8" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Archive className="size-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">Tidak ada arsip ditemukan</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map(item => (
                <div key={item.$id} className="p-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-semibold text-slate-900 truncate">{item.nama_kegiatan}</p>
                        <StatusBadge status={item.status} />
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Calendar className="size-3" /> {formatDate(item.$createdAt)}</span>
                        <span>{item.nama_jurusan || '-'}</span>
                        {item.total_anggaran && <span className="font-medium text-slate-700">{formatCurrency(item.total_anggaran)}</span>}
                        <span>Diperbarui {timeAgo(item.$updatedAt)}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="shrink-0" onClick={() => navigate(detailPath.replace(':id', item.$id))}>
                      <Eye className="size-4 mr-1" /> Detail
                    </Button>
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

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl px-4 py-3 ${color}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium mt-0.5 opacity-80">{label}</p>
    </div>
  );
}

/* ---- Role-specific wrappers ---- */
export function VerifikatorArchivePage() {
  return <ArchivePage role="verifikator" detailPath="/dashboard/verifikator/usulan/:id" />;
}

export function PpkArchivePage() {
  return <ArchivePage role="ppk" detailPath="/dashboard/ppk/review/:id" />;
}

export function WadirArchivePage() {
  return <ArchivePage role="wadir2" detailPath="/dashboard/wadir2/review/:id" />;
}
