import { MonitoringPage } from '@/components/MonitoringPage';
import { apiListKegiatan } from '@/lib/api';
import { getUserId } from '@/lib/helpers';
import { useState, useEffect } from 'react';

export function PengusulMonitoringPage() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const userId = getUserId();
        const res = await apiListKegiatan({ pengusul_id: userId });
        setItems((res.data || res));
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };
    load();
  }, []);

  return <MonitoringPage items={items} isLoading={isLoading} title="Monitoring Kegiatan Saya" showJurusan={false} />;
}
