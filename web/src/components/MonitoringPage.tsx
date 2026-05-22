import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/StatusBadge';
import { ProgressTracker } from '@/components/ProgressTracker';
import { formatDate, formatCurrency, timeAgo } from '@/lib/helpers';
import { Search, Filter, Eye, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MonitoringItem {
  $id: string;
  nama_kegiatan: string;
  status: string;
  pengusul_nama?: string;
  nama_jurusan?: string;
  jenis_kegiatan?: string;
  $createdAt?: string;
  $updatedAt?: string;
  created_at?: string;
  updated_at?: string;
}

interface MonitoringPageProps {
  items: MonitoringItem[];
  isLoading: boolean;
  title?: string;
  showJurusan?: boolean;
  onIntervene?: (id: string, newStatus: string) => Promise<void>;
}

const STATUS_FILTERS = [
  { key: 'all', label: 'Semua' },
  { key: 'pending', label: 'Pending', statuses: ['submitted', 'revisi_done', 'revision_requested', 'pending_ppk', 'approved_ppk'] },
  { key: 'approved', label: 'Disetujui', statuses: ['verified', 'approved_ppk', 'approved_wadir', 'accepted_funds', 'funds_disbursed', 'lpj_verified', 'lpj_approved', 'completed', 'lpj_done'] },
  { key: 'revisi', label: 'Revisi', statuses: ['revision_requested', 'lpj_revision'] },
  { key: 'lpj', label: 'LPJ', statuses: ['lpj_submitted', 'lpj_revision', 'lpj_approved', 'lpj_verified', 'lpj_done'] },
];

export function MonitoringPage({ items, isLoading, title = 'Monitoring Kegiatan', showJurusan = true, onIntervene }: MonitoringPageProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [interveneStatus, setInterveneStatus] = useState<string>('');
  const [isIntervening, setIsIntervening] = useState(false);

  const filtered = items.filter(item => {
    const matchesSearch = !search || item.nama_kegiatan?.toLowerCase().includes(search.toLowerCase()) ||
      item.pengusul_nama?.toLowerCase().includes(search.toLowerCase()) ||
      item.nama_jurusan?.toLowerCase().includes(search.toLowerCase());
    
    const filterDef = STATUS_FILTERS.find(f => f.key === statusFilter);
    const matchesStatus = statusFilter === 'all' || (filterDef?.statuses?.includes(item.status?.toLowerCase()));

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
        <p className="text-slate-500">Pantau progress setiap kegiatan secara real-time.</p>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
              <Input placeholder="Cari kegiatan, pengusul, jurusan..." className="pl-9 bg-white" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-2 flex-wrap">
              {STATUS_FILTERS.map(f => (
                <Button key={f.key} variant={statusFilter === f.key ? 'default' : 'outline'} size="sm"
                  className={statusFilter === f.key ? 'bg-emerald-700 text-white' : ''}
                  onClick={() => setStatusFilter(f.key)}>
                  {f.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-slate-500">Memuat data...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-500">Tidak ada data ditemukan.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map(item => (
                <div key={item.$id}>
                  <div className="flex items-center justify-between p-4 hover:bg-slate-50/50 cursor-pointer transition-colors" onClick={() => setExpandedId(expandedId === item.$id ? null : item.$id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-semibold text-slate-900 truncate">{item.nama_kegiatan}</p>
                        <StatusBadge status={item.status} />
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        {item.pengusul_nama && <span>Pengusul: {item.pengusul_nama}</span>}
                        {showJurusan && item.nama_jurusan && <span>Jurusan: {item.nama_jurusan}</span>}
                        <span>{formatDate(item.$createdAt || item.created_at)}</span>
                      </div>
                    </div>
                    <ChevronDown className={`size-5 text-slate-400 transition-transform ${expandedId === item.$id ? 'rotate-180' : ''}`} />
                  </div>
                  {expandedId === item.$id && (
                    <div className="px-6 pb-6 pt-2 bg-slate-50/50 border-t border-slate-100">
                      <p className="text-sm font-medium text-slate-600 mb-3">Progress Workflow</p>
                      <ProgressTracker status={item.status} />
                      <div className="mt-4 flex gap-3 text-xs text-slate-500">
                        <span>Update terakhir: {timeAgo(item.$updatedAt || item.updated_at)}</span>
                        {item.jenis_kegiatan && <span>Jenis: {item.jenis_kegiatan}</span>}
                      </div>

                      {onIntervene && (
                        <div className="mt-6 p-4 border border-red-200 bg-red-50 rounded-lg">
                          <p className="text-sm font-semibold text-red-800 mb-2">Intervensi Status (Admin Only)</p>
                          <div className="flex gap-3 items-center">
                            <Select value={interveneStatus} onValueChange={setInterveneStatus}>
                              <SelectTrigger className="w-[200px] bg-white border-red-200">
                                <SelectValue placeholder="Pilih status baru..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="submitted">Submitted (Draft)</SelectItem>
                                <SelectItem value="revision_requested">Revision Requested</SelectItem>
                                <SelectItem value="verified">Verified (Verifikator)</SelectItem>
                                <SelectItem value="approved_ppk">Approved (PPK)</SelectItem>
                                <SelectItem value="approved_wadir">Approved (Wadir)</SelectItem>
                                <SelectItem value="funds_disbursed">Funds Disbursed (Bendahara)</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button 
                              variant="destructive" 
                              disabled={!interveneStatus || isIntervening}
                              onClick={async () => {
                                setIsIntervening(true);
                                try {
                                  await onIntervene(item.$id, interveneStatus);
                                } finally {
                                  setIsIntervening(false);
                                  setInterveneStatus('');
                                }
                              }}
                            >
                              Force Update
                            </Button>
                          </div>
                          <p className="text-xs text-red-600 mt-2">Peringatan: Mengubah status secara paksa dapat mem-bypass alur persetujuan normal.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
