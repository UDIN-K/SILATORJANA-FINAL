import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Clock, ShieldCheck, CheckCircle, Plus, FileText, Loader2 } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { account, databases, APPWRITE_DB_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

export function PengusulDashboard() {
  const navigate = useNavigate();
  const [usulanList, setUsulanList] = useState<any[]>([]);
  const [counts, setCounts] = useState({
    total: 0,
    menunggu: 0,
    berjalan: 0,
    selesai: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsulan = async () => {
      try {
        let userId: number | string = 1; // fallback
        try {
          const userStr = localStorage.getItem('currentUser');
          if (userStr) {
            const user = JSON.parse(userStr);
            userId = parseInt(user.$id || user.user_id || '1', 10);
          }
        } catch (e) {
          console.log('Error reading auth session from localStorage', e);
        }

        const allRes = await databases.listDocuments(APPWRITE_DB_ID, 'kegiatan', [
          Query.equal('pengusul_id', userId),
          Query.orderDesc('$createdAt'),
        ]);

        const allDocs = allRes.documents;
        setUsulanList(allDocs.slice(0, 5)); // Just take top 5 for the "Aktivitas Terakhir"

        let cTotal = allDocs.length;
        let cMenunggu = 0;
        let cBerjalan = 0;
        let cSelesai = 0;

        allDocs.forEach((doc: any) => {
          if (doc.status === 'selesai' || doc.status === 'completed' || doc.status === 'lpj_done') {
            cSelesai++;
          } else if (doc.status.startsWith('menunggu') || doc.status.startsWith('disetujui') || doc.status === 'pending_ppk' || doc.status === 'approved_ppk' || doc.status === 'approved_wadir') {
            cBerjalan++;
          } else if (doc.status === 'draft' || doc.status === 'diajukan' || doc.status === 'revisi' || doc.status === 'submitted' || doc.status === 'diverifikasi') {
            cMenunggu++;
          }
        });

        setCounts({
          total: cTotal,
          menunggu: cMenunggu,
          berjalan: cBerjalan,
          selesai: cSelesai
        });
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsulan();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Pengusul</h2>
          <p className="text-slate-500">Selamat datang kembali! Berikut ringkasan usulan Anda.</p>
        </div>
        <Button onClick={() => navigate('/dashboard/pengusul/usulan/baru')} className="bg-emerald-700 hover:bg-emerald-800">
          <Plus className="size-4 mr-2" />
          Buat Usulan Baru
        </Button>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-emerald-700 size-8" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-sm border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium text-slate-600">Total Usulan</p>
                  <div className="p-2 rounded-xl bg-emerald-100">
                    <Package className="size-4 text-emerald-700" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-bold tracking-tight text-slate-900">{counts.total}</h3>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium text-slate-600">Menunggu Verifikasi</p>
                  <div className="p-2 rounded-xl bg-amber-100">
                    <Clock className="size-4 text-amber-600" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-bold tracking-tight text-slate-900">{counts.menunggu}</h3>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium text-slate-600">Sedang Berjalan</p>
                  <div className="p-2 rounded-xl bg-indigo-100">
                    <ShieldCheck className="size-4 text-indigo-600" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-bold tracking-tight text-slate-900">{counts.berjalan}</h3>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium text-slate-600">Selesai Ber-LPJ</p>
                  <div className="p-2 rounded-xl bg-emerald-100">
                    <CheckCircle className="size-4 text-emerald-600" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-bold tracking-tight text-slate-900">{counts.selesai}</h3>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-lg">Aktivitas Terakhir</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {usulanList.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">Anda belum membuat usulan kegiatan.</div>
                ) : (
                  usulanList.map((item) => (
                    <div key={item.$id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-full bg-slate-100 text-slate-500">
                          <FileText className="size-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{item.nama_kegiatan}</p>
                          <p className="text-sm text-slate-500">{new Date(item.$createdAt).toLocaleDateString('id-ID')}</p>
                        </div>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// End of component
