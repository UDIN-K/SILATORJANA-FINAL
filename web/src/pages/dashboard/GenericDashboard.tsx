import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocation } from 'react-router-dom';
import { Package, Clock, ShieldCheck, CheckCircle } from 'lucide-react';

export function GenericDashboard() {
  const location = useLocation();
  const role = location.pathname.split('/')[2] || 'Pengguna';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 capitalize">Dashboard {role}</h2>
        <p className="text-slate-500">Selamat datang di Panel {role} Si-LATORJANA.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-slate-600">Usulan Aktif</p>
              <div className="p-2 rounded-xl bg-blue-100">
                <Package className="size-4 text-blue-600" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold tracking-tight text-slate-900">24</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-slate-600">Menunggu Tindakan</p>
              <div className="p-2 rounded-xl bg-amber-100">
                <Clock className="size-4 text-amber-600" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold tracking-tight text-slate-900">8</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-slate-600">Disetujui Bulan Ini</p>
              <div className="p-2 rounded-xl bg-green-100">
                <CheckCircle className="size-4 text-green-600" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold tracking-tight text-slate-900">12</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-200 mt-6">
         <CardHeader>
           <CardTitle>Ringkasan Area Kerja</CardTitle>
           <CardDescription>Bagian ini akan menampilkan tugas spesifik berdasarkan peran {role} pada workflow usulan.</CardDescription>
         </CardHeader>
         <CardContent>
           <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-lg">
             <ShieldCheck className="size-12 mx-auto text-slate-300 mb-4" />
             <h3 className="text-lg font-medium text-slate-900">Belum Ada Data</h3>
             <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
               Silahkan buat koneksi database atau integrasi API backend untuk menampilkan data dinamis.
             </p>
           </div>
         </CardContent>
      </Card>
    </div>
  );
}
