import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Mail, Shield, Calendar, Building2, Loader2, FileText, Clock, Edit } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { databases, APPWRITE_DB_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { formatDate, formatDateLong, timeAgo, formatCurrency } from '@/lib/helpers';
import { StatusBadge } from '@/components/StatusBadge';

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700', pengusul: 'bg-blue-100 text-blue-700',
  verifikator: 'bg-emerald-100 text-emerald-700', ppk: 'bg-amber-100 text-amber-700',
  wadir2: 'bg-indigo-100 text-indigo-700', bendahara: 'bg-rose-100 text-rose-700',
  rektorat: 'bg-cyan-100 text-cyan-700',
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator', pengusul: 'Pengusul', verifikator: 'Verifikator',
  ppk: 'PPK', wadir2: 'Wakil Direktur II', bendahara: 'Bendahara', rektorat: 'Rektorat',
};

export function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const doc = await databases.getDocument(APPWRITE_DB_ID, 'users', id);
        setUser(doc);

        // If user is pengusul, fetch their kegiatan
        if (doc.role === 'pengusul') {
          try {
            const res = await databases.listDocuments(APPWRITE_DB_ID, 'kegiatan', [
              Query.equal('pengusul_id', parseInt(doc.$id, 10)),
              Query.orderDesc('$createdAt'),
              Query.limit(20),
            ]);
            setActivities(res.documents);
          } catch {}
        }
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    })();
  }, [id]);

  if (isLoading) return <div className="py-12 text-center"><Loader2 className="animate-spin text-emerald-700 mx-auto size-8" /></div>;
  if (!user) return <div className="py-12 text-center text-slate-500">User tidak ditemukan.</div>;

  const roleColor = ROLE_COLORS[user.role] || 'bg-slate-100 text-slate-700';
  const roleLabel = ROLE_LABELS[user.role] || user.role;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/admin/users')}><ArrowLeft className="size-5" /></Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900">Detail User</h2>
          <p className="text-sm text-slate-500">Informasi lengkap pengguna</p>
        </div>
        <Button variant="outline" size="sm" className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
          onClick={() => navigate(`/dashboard/admin/users/edit/${id}`)}>
          <Edit className="size-4 mr-1" /> Edit
        </Button>
      </div>

      {/* Profile Card */}
      <Card className="shadow-sm border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-6">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold">
              {(user.nama || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{user.nama || 'Tanpa Nama'}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`${roleColor} border-0`}>{roleLabel}</Badge>
                {user.nama_jurusan && <span className="text-emerald-100 text-sm">{user.nama_jurusan}</span>}
              </div>
            </div>
          </div>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <DetailField icon={User} label="Nama Lengkap" value={user.nama || '-'} />
            <DetailField icon={Mail} label="Email" value={user.email || '-'} />
            <DetailField icon={Shield} label="Role" value={roleLabel} />
            <DetailField icon={Building2} label="Jurusan" value={user.nama_jurusan || user.jurusan_id || '-'} />
            <DetailField icon={Calendar} label="Dibuat" value={formatDateLong(user.$createdAt)} />
            <DetailField icon={Clock} label="Terakhir Diperbarui" value={timeAgo(user.$updatedAt)} />
          </div>
        </CardContent>
      </Card>

      {/* Activity for pengusul */}
      {user.role === 'pengusul' && (
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="size-4 text-emerald-600" /> Riwayat Kegiatan ({activities.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {activities.length === 0 ? (
              <div className="py-8 text-center text-slate-500">Belum ada kegiatan yang diajukan.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {activities.map(a => (
                  <div key={a.$id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{a.nama_kegiatan}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span>{formatDate(a.$createdAt)}</span>
                        {a.total_anggaran && <span className="font-medium text-slate-700">{formatCurrency(a.total_anggaran)}</span>}
                      </div>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* Sub-component */
function DetailField({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 bg-slate-100 rounded-lg"><Icon className="size-4 text-slate-500" /></div>
      <div>
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm text-slate-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
